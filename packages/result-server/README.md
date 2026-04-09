# result-server

Cloudflare Workers REST API backed by D1 (SQLite). Receives lap time batches from the timing loader and serves live standings to the result client.

## Requirements

- Node.js 18+ ([nvm-windows](https://github.com/coreybutler/nvm-windows) Recommended)
- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- `wrangler` CLI (installed as a dev dependency)

## Setup

### 1. Install dependencies

```sh
npm install
```

### 2. Create the D1 database

```sh
npx wrangler d1 create esm-prequal-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "esm-prequal-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   # <-- replace this
```

### 3. Set the API key secret

```sh
npx wrangler secret put API_KEY
```

Enter a strong random secret when prompted. The timing loader must be started with the same value via `--apikey`.

## Development

Apply the database migration locally before the first run:

```sh
npm run db:migrate:local
```

Create `.dev.vars` with `API_KEY=<key for local testing>` in it.
Start a local dev server (uses a local D1 replica):

```sh
npm run dev
# or: npx wrangler dev
```

The server listens on `http://localhost:8787` by default.

### Testing with curl

```sh
# POST lap times (requires API key)
curl -X POST http://localhost:8787/api/laptimes \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-dev-key" \
  -d '{
    "competition": "Test Event",
    "laptimes": [
      {"driverId": 123456, "driverName": "Alice Driver", "sessionId": 99, "lapNumber": 1, "lapTime": 92.456},
      {"driverId": 123456, "driverName": "Alice Driver", "sessionId": 99, "lapNumber": 2, "lapTime": null}
    ]
  }'

# ...or on PowerShell
Invoke-RestMethod http://localhost:8787/api/laptimes -Method POST -Headers @{"X-API-Key"="your-dev-key"} -ContentType application/json -Body '...'

# GET standings
curl "http://localhost:8787/api/standings?competition=Test+Event"

# GET all lap times
curl "http://localhost:8787/api/laptimes?competition=Test+Event"

# GET competitions
curl "http://localhost:8787/api/competitions"
```

## Deployment

### 1. Apply the migration to production

```sh
npm run db:migrate:remote
```

### 2. Deploy the Worker

```sh
npm run deploy
# or: npx wrangler deploy
```

Wrangler prints the Worker URL (e.g. `https://esm-prequal-server.your-subdomain.workers.dev`).

### 3. Set the production API key

If not done already:

```sh
npx wrangler secret put API_KEY
```

## API Reference

### `POST /api/laptimes`

Upload a batch of lap times. Requires `X-API-Key` header.

**Request body:**
```json
{
  "competition": "My League Q1",
  "laptimes": [
    {
      "driverId": 123456,
      "driverName": "Alice Driver",
      "sessionId": 987654,
      "lapNumber": 3,
      "lapTime": 91.234
    }
  ]
}
```

**Response `201`:**
```json
{ "inserted": 1 }
```

Duplicate laps (same `driverId + sessionId + lapNumber + competition`) are silently ignored; `inserted` reflects only newly recorded laps.

---

### `GET /api/competitions`

**Response `200`:**
```json
{ "competitions": ["My League Q1", "My League Q2"] }
```

---

### `GET /api/laptimes?competition=X`

**Response `200`:**
```json
{
  "laptimes": [
    {
      "id": 1,
      "driver_id": 123456,
      "driver_name": "Alice Driver",
      "session_id": 987654,
      "competition": "My League Q1",
      "lap_number": 3,
      "lap_time": 91.234,
      "created_at": "2026-04-07 14:00:00"
    }
  ]
}
```

---

### `GET /api/standings?competition=X`

Returns each driver's single best valid lap, sorted fastest first.

**Response `200`:**
```json
{
  "standings": [
    { "driverId": 123456, "driverName": "Alice Driver", "bestTime": 91.234, "lapCount": 5 },
    { "driverId": 654321, "driverName": "Bob Racer",    "bestTime": 91.890, "lapCount": 3 }
  ]
}
```

`lapCount` is the total number of laps (valid + invalid) recorded for the driver in that competition.

## Code Structure

```
src/
├── index.ts          # Hono app, CORS, auth middleware, route mounting
├── db.ts             # D1 query helpers
├── types.ts          # Zod schemas and TypeScript types
└── routes/
    ├── laptimes.ts   # POST and GET /api/laptimes
    ├── competitions.ts  # GET /api/competitions
    └── standings.ts  # GET /api/standings
migrations/
└── 0001_init.sql     # Creates laptimes table and indexes
```
