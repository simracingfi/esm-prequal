# result-client

React single-page app that displays live qualifying standings. Polls the result server every 5 seconds and updates automatically — no page refresh required.

## Requirements

- Node.js 18+

## Setup

```sh
npm install
```

## Development

Start the Vite dev server:

```sh
npm run dev
```

The app is served at `http://localhost:5173`. API calls to `/api/*` are proxied to `http://localhost:8787` (the result server dev port) — start `result-server` first:

```sh
# In packages/result-server:
npm run dev

# In packages/result-client:
npm run dev
```

### Pointing at a deployed server

Set `VITE_API_URL` to override the base URL:

```sh
VITE_API_URL=https://esm-prequal-server.your-subdomain.workers.dev npm run dev
```

## Build

```sh
npm run build
```

Static files are output to `dist/`. The build bundles React and all client code — the result is a fully static site with no server-side rendering requirement.

Preview the production build locally:

```sh
npm run preview
```

## Deployment

The `dist/` folder can be served from any static host. The recommended option is **Cloudflare Pages** (free tier), which co-locates the client with the Worker for minimal latency.

### Cloudflare Pages (recommended)

1. Push the repo to GitHub (already done).
2. In the Cloudflare dashboard → **Pages** → **Create a project** → connect the repo.
3. Set the build configuration:
   - **Framework preset**: None (or Vite)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `packages/result-client`
4. Add an environment variable:
   - `VITE_API_URL` = `https://esm-prequal-server.your-subdomain.workers.dev`
5. Deploy. Cloudflare Pages automatically redeploys on every push to `main`.

### Other static hosts

Any host that can serve a `dist/` folder works (Netlify, Vercel, GitHub Pages, S3+CloudFront, etc.). Set `VITE_API_URL` at build time to point at your Worker URL.

## Usage

1. Open the app in a browser.
2. Select a competition from the dropdown (populated automatically from the server).
3. The **Standings** tab shows each driver's best valid lap, sorted fastest first, with gaps to P1.
4. Switch to **All Laps** to see every recorded lap, including invalid ones.
5. Both views refresh automatically every 5 seconds.

## Code Structure

```
src/
├── main.tsx                    # React entry point
├── App.tsx                     # Competition picker and tab navigation
├── vite-env.d.ts               # Vite type declarations
├── api/
│   └── client.ts               # Typed fetch wrappers for each endpoint
├── components/
│   ├── CompetitionPicker.tsx   # Dropdown sourced from /api/competitions
│   ├── StandingsTable.tsx      # Best-lap table with position and gap columns
│   └── LaptimesTable.tsx       # All-laps table
└── hooks/
    └── usePolling.ts           # Generic polling hook (configurable interval)
```

### Polling behaviour

`usePolling(fetcher, intervalMs)` calls `fetcher` immediately on mount, then on a fixed interval. The hook returns `{ data, error, loading }`. Stale data is preserved while a refetch is in flight — the UI never flickers to a loading state after the first successful fetch.
