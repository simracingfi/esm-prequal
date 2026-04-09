# timing-loader-py

Python alternative to the Go timing loader. Uses [pyirsdk](https://github.com/kutu/pyirsdk) to read iRacing telemetry and POST lap time batches to the result server. Single-file implementation with no dependencies beyond `pyirsdk`.

## Requirements

- Windows 10/11 with iRacing installed
- Python 3.7+

## Setup

```sh
pip install -r requirements.txt
```

## Usage

```sh
python loader.py --competition "My League Q1" --server https://your-worker.workers.dev --apikey YOUR_SECRET_KEY
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--competition` | yes | — | Competition name |
| `--apikey` | yes | — | API key matching the server's `API_KEY` secret |
| `--server` | no | `http://localhost:8787` | Result server base URL |
| `--interval` | no | `10` | Polling interval in seconds |

## Building a standalone exe

Use [PyInstaller](https://pyinstaller.org/) to create a single Windows executable:

```sh
pip install pyinstaller
pyinstaller --onefile loader.py --name esm-loader
```

The resulting `dist/esm-loader.exe` can be distributed without requiring Python on the target machine.
