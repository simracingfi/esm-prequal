# timing-loader-py

Python alternative to the Go timing loader. Uses [pyirsdk](https://github.com/kutu/pyirsdk) to read iRacing telemetry and POST lap time batches to the result server. Single-file implementation with no dependencies beyond `pyirsdk`.

## Requirements

- Windows 10/11 with iRacing installed
- Python 3.7+

## Setup

```sh
python -m venv .venv
```

Activate the virtual environment:

| Platform | Command |
|----------|---------|
| Windows CMD | `.venv\Scripts\activate.bat` |
| Windows PowerShell | `.venv\Scripts\Activate.ps1` |
| macOS / Linux | `source .venv/bin/activate` |

Then install dependencies:

```sh
pip install -r requirements.txt
```

## Usage

```sh
python loader.py --competition "My League Q1" --server https://your-worker.workers.dev --apikey YOUR_SECRET_KEY

python loader.py -h
usage: loader.py [-h] --competition COMPETITION [--server SERVER] --apikey APIKEY [--interval INTERVAL] [--enroll [FILE]]

eSM Prequal Timing Loader

options:
  -h, --help            show this help message and exit
  --competition COMPETITION
                        Competition name
  --server SERVER       Result server URL
  --apikey APIKEY       API key for server authentication
  --interval INTERVAL   Polling interval in seconds
  --enroll [FILE]       Enroll drivers from FILE (or stdin when omitted); sends null lap times and exits
```

## Building a standalone exe

Use [PyInstaller](https://pyinstaller.org/) to create a single Windows executable:

```sh
pip install pyinstaller
pyinstaller --onefile loader.py --name esm-loader
```

The resulting `dist/esm-loader.exe` can be distributed without requiring Python on the target machine.
