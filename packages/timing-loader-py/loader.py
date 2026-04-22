"""eSM Prequal Timing Loader - reads iRacing telemetry and uploads lap times."""

import argparse
import json
import sys
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
    p.add_argument(
        "--enroll", nargs="?", const="-", metavar="FILE",
        help="Enroll drivers from FILE (or stdin when omitted); sends null lap times and exits",
    )
    return p.parse_args()


def parse_enrollment_input(text):
    """Extract driver names from a tab-separated enrollment table.
    Copy-paste from https://simracing.fi/ season or race driver list works as-is.

    Each row: [optional_number TAB] driver_name [TAB team [TAB car]]
    """
    names = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        fields = line.split("\t")
        name = fields[1].strip() if fields[0].strip().isdigit() else fields[0].strip()
        if name:
            names.append(name)
    return names


def load_driver_ids(server_url):
    """Fetch driver name -> iRacing ID mapping from result-server GET /api/drivers."""
    req = urllib.request.Request(
        url=f"{server_url}/api/drivers",
        headers={"User-Agent": "eSM Prequal Timing Loader/1.0"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read())
    return {d["driverName"]: d["driverId"] for d in data.get("drivers", [])}


def enroll_drivers(args):
    """Send a null-laptime record for every enrolled driver, then exit."""
    if args.enroll == "-":
        text = sys.stdin.read()
    else:
        with open(args.enroll, encoding="utf-8") as f:
            text = f.read()

    names = parse_enrollment_input(text)
    driver_ids = load_driver_ids(args.server)

    laptimes = []
    missing = []
    for name in names:
        driver_id = driver_ids.get(name)
        if driver_id is None:
            missing.append(name)
        else:
            laptimes.append({
                "driverId": driver_id,
                "driverName": name,
                "sessionId": 0,
                "lapNumber": -1,
                "lapTime": None,
            })

    if missing:
        print(f"Warning: no ID found for: {', '.join(missing)}")

    if laptimes:
        send_batch(args.server, args.apikey, args.competition, laptimes)
    else:
        print("No drivers enrolled.")


def send_batch(server_url, api_key, competition, laptimes):
    """POST a batch of lap times to the result server."""
    payload = json.dumps({"competition": competition, "laptimes": laptimes}).encode()
    req = urllib.request.Request(
        method="POST",
        url=f"{server_url}/api/laptimes",
        data=payload,
        headers={"Content-Type": "application/json", "X-API-Key": api_key, "User-Agent": "eSM Prequal Timing Loader/1.0"},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        result = json.loads(resp.read())
    print(f"Sent {len(laptimes)} laptimes, {result.get('inserted', 0)} inserted")


def collect_initial_laps(ir):
    """Read session results to recover each driver's best lap (for mid-session starts)."""
    weekend_info = ir["WeekendInfo"]
    driver_info = ir["DriverInfo"]
    session_info = ir["SessionInfo"]
    if not weekend_info or not driver_info or not session_info:
        return []

    session_id = weekend_info["SubSessionID"]
    session_num = ir["SessionNum"]
    sessions = session_info.get("Sessions", [])
    if session_num is None or session_num < 0 or session_num >= len(sessions):
        return []

    results = sessions[session_num].get("ResultsPositions") or []
    drivers_by_car_idx = {}
    for d in driver_info["Drivers"]:
        if d.get("CarIsPaceCar", 0) > 0 or d.get("IsSpectator", 0) > 0:
            continue
        drivers_by_car_idx[d["CarIdx"]] = d

    laptimes = []
    for r in results:
        d = drivers_by_car_idx.get(r.get("CarIdx"))
        if not d:
            continue
        fastest_time = r.get("FastestTime", 0)
        fastest_lap = r.get("FastestLap", 0)
        if fastest_time > 0 and fastest_lap > 0:
            laptimes.append({
                "driverId": d["UserID"],
                "driverName": d["UserName"].strip(),
                "sessionId": session_id,
                "lapNumber": fastest_lap,
                "lapTime": fastest_time,
            })

    return laptimes


def collect_laptimes(ir):
    """Read current lap data from iRacing telemetry."""
    weekend_info = ir["WeekendInfo"]
    driver_info = ir["DriverInfo"]
    if not weekend_info or not driver_info:
        return []

    session_id = weekend_info["SubSessionID"]
    drivers = driver_info["Drivers"]

    ir.freeze_var_buffer_latest()
    car_idx_lap = ir["CarIdxLapCompleted"]
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

    if args.enroll is not None:
        enroll_drivers(args)
        return

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

                # On connect, recover each driver's best lap from session results
                initial = collect_initial_laps(ir)
                if initial:
                    print(f"Recovered {len(initial)} best laps from session results")
                    try:
                        send_batch(args.server, args.apikey, args.competition, initial)
                        for lt in initial:
                            sent.add((lt["driverId"], lt["sessionId"], lt["lapNumber"]))
                    except (urllib.error.URLError, OSError) as e:
                        print(f"Error sending initial laps: {e}")

            laptimes = collect_laptimes(ir)
            if not laptimes:
                print("No active laps in telemetry")

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
