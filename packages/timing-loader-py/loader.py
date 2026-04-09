"""eSM Prequal Timing Loader - reads iRacing telemetry and uploads lap times."""

import argparse
import json
import time
import urllib.request
import urllib.error

import irsdk


def parse_args():
    p = argparse.ArgumentParser(description="eSM Prequal Timing Loader")
    p.add_argument("--competition", required=True, help="Competition name")
    p.add_argument("--server", default="http://localhost:8787", help="Result server URL")
    p.add_argument("--apikey", required=True, help="API key for server authentication")
    p.add_argument("--interval", type=int, default=10, help="Polling interval in seconds")
    return p.parse_args()


def send_batch(server_url, api_key, competition, laptimes):
    """POST a batch of lap times to the result server."""
    payload = json.dumps({"competition": competition, "laptimes": laptimes}).encode()
    req = urllib.request.Request(
        f"{server_url}/api/laptimes",
        data=payload,
        headers={"Content-Type": "application/json", "X-API-Key": api_key},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read())
    print(f"Sent {len(laptimes)} laptimes, {result.get('inserted', 0)} inserted")


def collect_laptimes(ir):
    """Read current lap data from iRacing telemetry."""
    weekend_info = ir["WeekendInfo"]
    driver_info = ir["DriverInfo"]
    if not weekend_info or not driver_info:
        return []

    session_id = weekend_info["SubSessionID"]
    drivers = driver_info["Drivers"]

    ir.freeze_var_buffer_latest()
    car_idx_lap = ir["CarIdxLap"]
    car_idx_last_lap_time = ir["CarIdxLastLapTime"]
    ir.unfreeze_var_buffer_latest()

    if not car_idx_lap or not car_idx_last_lap_time:
        return []

    laptimes = []
    for d in drivers:
        if d.get("CarIsPaceCar", 0) > 0 or d.get("IsSpectator", 0) > 0:
            continue

        car_idx = d["CarIdx"]
        if car_idx < 0 or car_idx >= len(car_idx_lap):
            continue

        lap_num = car_idx_lap[car_idx]
        if lap_num <= 0:
            continue

        lap_time_val = car_idx_last_lap_time[car_idx]
        lap_time = lap_time_val if lap_time_val > 0 else None

        laptimes.append({
            "driverId": d["UserID"],
            "driverName": d["UserName"].strip(),
            "sessionId": session_id,
            "lapNumber": lap_num,
            "lapTime": lap_time,
        })

    return laptimes


def main():
    args = parse_args()
    print(f"eSM Prequal Timing Loader")
    print(f"Competition: {args.competition}")
    print(f"Server: {args.server}")
    print(f"Interval: {args.interval}s")

    ir = irsdk.IRSDK()
    sent = set()  # (driverId, sessionId, lapNumber) tuples

    print("Waiting for iRacing connection...")
    while True:
        try:
            if not ir.is_initialized or not ir.is_connected:
                if not ir.startup():
                    time.sleep(args.interval)
                    continue
                print("Connected to iRacing!")

            laptimes = collect_laptimes(ir)

            new_laps = []
            for lt in laptimes:
                key = (lt["driverId"], lt["sessionId"], lt["lapNumber"])
                if key not in sent:
                    new_laps.append(lt)

            if new_laps:
                try:
                    send_batch(args.server, args.apikey, args.competition, new_laps)
                    for lt in new_laps:
                        sent.add((lt["driverId"], lt["sessionId"], lt["lapNumber"]))
                except (urllib.error.URLError, OSError) as e:
                    print(f"Error sending batch: {e}")

        except KeyboardInterrupt:
            print("\nShutting down...")
            ir.shutdown()
            break
        except Exception as e:
            print(f"Error: {e}")
            ir.shutdown()

        time.sleep(args.interval)


if __name__ == "__main__":
    main()
