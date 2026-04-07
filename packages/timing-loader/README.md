# timing-loader

Go CLI that reads iRacing telemetry via shared memory and POSTs lap time batches to the result server every 10 seconds. Compiles to a single Windows executable with no runtime dependency.

> **Windows only** — iRacing runs on Windows only.

## Requirements

- **Build machine**: Go 1.21+ and `make` ([install via Chocolatey](https://chocolatey.org/install): `choco install make`)
- **Runtime**: Windows 10/11 with iRacing installed and running

## Build

```sh
make build
```

Produces `esm-loader.exe` (cross-compiled for Windows amd64). Copy it to the race PC — no Go installation required there.

```sh
make clean   # remove esm-loader.exe
```

## Configuration

All options are CLI flags:

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--competition` | yes | — | Competition name (used to group results in the server) |
| `--apikey` | yes | — | API key matching the server's `API_KEY` secret |
| `--server` | no | `http://localhost:8787` | Result server base URL |
| `--interval` | no | `10s` | Polling interval (Go duration string, e.g. `10s`, `30s`) |

## Usage (race PC)

1. Start iRacing and join a qualifying session.
2. Open a terminal and run:

```bat
esm-loader.exe --competition "My League Q1" --server https://your-worker.workers.dev --apikey YOUR_SECRET_KEY
```

3. The loader prints a line for each batch sent:

```
eSM Prequal Timing Loader
Competition: My League Q1
Server: https://your-worker.workers.dev
Interval: 10s
Waiting for iRacing connection...
Connected to iRacing!
Sent 3 laptimes, 3 inserted
Sent 1 laptimes, 1 inserted
```

4. Press `Ctrl+C` to stop.

## Development

Run directly with `go run` (requires Windows + iRacing for real data; on other platforms the iRacing client returns an error):

```sh
go run . --competition "Test Event" --server http://localhost:8787 --apikey your-api-key
```

```sh
go vet ./...
go test ./...
```

## How It Works

- Connects to iRacing via the Windows shared memory API (`mpapenbr/goirsdk`).
- Every polling interval it reads `CarIdxLap` and `CarIdxLastLapTime` telemetry arrays, cross-referenced with the session YAML driver list.
- New laps (not yet sent) are collected into a batch and POSTed to `POST /api/laptimes` with the `X-API-Key` header.
- A lap time of `null` is sent when `CarIdxLastLapTime` is ≤ 0 (invalid/penalised lap).
- Successfully sent laps are tracked in memory. If the server is unreachable the batch is retried on the next interval.
- Handles iRacing disconnection: if `GetData()` fails the connection is dropped and re-attempted on the next tick.

## Code Structure

| File | Purpose |
|------|---------|
| `main.go` | Entry point: flag parsing, polling loop, graceful shutdown |
| `types.go` | `Laptime`, `LaptimeBatch`, `lapKey` structs |
| `sender.go` | HTTP POST to result server |
| `iracing.go` | `IRacingClient` interface |
| `iracing_windows.go` | Windows implementation using `goirsdk` (build tag: `windows`) |
| `iracing_stub.go` | Non-Windows stub returning a clear error (build tag: `!windows`) |
