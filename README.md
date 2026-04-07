# eSM Prequal

A specialized iRacing live timing app for hotlap qualification competitions. Operators run a local timing loader alongside the iRacing simulator; results are pushed to a cloud API and displayed in real time on a web client.

## Architecture

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│   Windows PC / iRacing  │        │   Cloudflare Workers + D1    │
│                         │        │                              │
│  ┌───────────────────┐  │ HTTPS  │  ┌────────────────────────┐  │
│  │  timing-loader    │──┼───────▶│  │    result-server       │  │
│  │  (Go binary)      │  │ POST   │  │    (Hono REST API)     │  │
│  └───────────────────┘  │        │  └────────────────────────┘  │
│                         │        │           │                  │
└─────────────────────────┘        │    ┌──────▼──────┐           │
                                   │    │  D1 SQLite  │           │
┌─────────────────────────┐        │    └─────────────┘           │
│   Browser / Any Device  │  HTTPS │                              │
│                         │◀───────┼──────────────────────────────│
│  ┌───────────────────┐  │  GET   │                              │
│  │  result-client    │  │        └──────────────────────────────┘
│  │  (React SPA)      │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Components

| Package | Language | Purpose |
|---------|----------|---------|
| [`packages/timing-loader`](packages/timing-loader/) | Go | Reads iRacing telemetry on Windows, POSTs lap time batches to the server every 10 seconds |
| [`packages/result-server`](packages/result-server/) | TypeScript | Cloudflare Workers REST API with D1 (SQLite) storage |
| [`packages/result-client`](packages/result-client/) | TypeScript / React | Single-page app that polls the server and displays live standings |

## Data Model

One table: `laptimes`

| Field | Type | Description |
|-------|------|-------------|
| `driver_id` | integer | iRacing customer ID |
| `driver_name` | text | iRacing profile name |
| `session_id` | integer | iRacing subsession ID |
| `competition` | text | Qualification event name (set when starting the loader) |
| `lap_number` | integer | iRacing-reported lap number |
| `lap_time` | real / NULL | Lap time in seconds; NULL if the lap was invalid (e.g. track limits) |

A `UNIQUE(driver_id, session_id, lap_number, competition)` constraint makes all batch uploads idempotent — duplicate records are silently ignored.

## API

All routes are under `/api`. The POST route requires an `X-API-Key` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/laptimes` | API key | Upload a batch of lap times |
| `GET` | `/api/competitions` | — | List distinct competition names |
| `GET` | `/api/laptimes?competition=X` | — | All lap times for a competition |
| `GET` | `/api/standings?competition=X` | — | Best valid lap per driver, sorted fastest-first |

## Monorepo Layout

```
esm-prequal/
├── packages/
│   ├── timing-loader/   # Go CLI (Windows single-exe)
│   ├── result-server/   # Cloudflare Worker
│   └── result-client/   # Vite React SPA
└── .gitignore
```

The Go and TypeScript packages are independent — there is no shared workspace tooling. Dependencies are managed with `go mod` for the loader and `npm` for each TypeScript package.

## Quick Start

1. **Deploy the server** — see [`packages/result-server`](packages/result-server/README.md)
2. **Start the client** — see [`packages/result-client`](packages/result-client/README.md)
3. **Run the loader on the race PC** — see [`packages/timing-loader`](packages/timing-loader/README.md)
