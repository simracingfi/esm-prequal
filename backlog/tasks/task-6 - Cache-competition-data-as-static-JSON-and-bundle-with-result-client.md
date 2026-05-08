---
id: TASK-6
title: Cache competition data as static JSON and bundle with result-client
status: To Do
assignee: []
created_date: '2026-05-08 20:52'
labels:
  - result-client
  - tooling
  - ci
dependencies: []
references:
  - packages/result-client/src/api/client.ts
  - packages/result-client/src/App.tsx
  - packages/result-client/package.json
  - packages/result-client/vite.config.ts
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

Allow archived competitions to be browsed without the result-server backend by bundling cached API responses as static JSON into the client build.

## Cache script

`packages/result-client/scripts/cache-competition.ts`  
CLI: `npx tsx scripts/cache-competition.ts <competition>`

1. Reads `VITE_API_URL` env var (or accepts `--url` flag) for the live server base URL.
2. Fetches `/api/standings?competition=<name>` and `/api/laptimes?competition=<name>`.
3. Writes output to:
   ```
   src/data/<competition-hash>/standings.json
   src/data/<competition-hash>/laptimes.json
   ```
4. Appends `<competition>` to `src/data/index.json` (list of cached competitions with competition hashes, created if absent).

Add script entry to `package.json`: `"cache": "tsx scripts/cache-competition.ts"`.

## Client changes (`src/api/client.ts`)

On startup, import `src/data/index.json` (via `import`/`fetch` from bundled asset). For competitions present in that list, load standings/laptimes from the bundled JSON instead of fetching the API. For all others, fetch live as today.

`fetchCompetitions()` merges live competitions with cached ones (deduplicated).

## GitHub Action

`.github/workflows/cache-competition.yml`

- Trigger: `workflow_dispatch` with required input `competition` (string).
- Steps:
  1. `actions/checkout`
  2. `npm ci` in `packages/result-client`
  3. Run cache script (uses `RESULT_SERVER_URL` repository secret as `VITE_API_URL`)
  4. Commit changed files in `src/data/` with message `cache: <competition>`
  5. Push to new branch `cache/<competition-slug>`
  6. Create PR via `gh pr create` targeting `main`

## Files

| Path | Action |
|------|--------|
| `scripts/cache-competition.ts` | Create |
| `src/data/index.json` | Created by script |
| `src/data/<competition-hash>/standings.json` | Created by script |
| `src/data/<competition-hash>/laptimes.json` | Created by script |
| `src/api/client.ts` | Serve cached data for known competitions |
| `package.json` | Add `cache` script |
| `.github/workflows/cache-competition.yml` | Create |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Running the script for a competition creates standings.json and laptimes.json under src/data/<competition-hash>/ and updates src/data/index.json
- [ ] #2 A client built after caching shows the competition without any network requests to result-server
- [ ] #3 Competitions not in src/data/index.json still fetch live from the API
- [ ] #4 fetchCompetitions() returns both live and cached competitions (deduplicated)
- [ ] #5 The GitHub Action accepts a competition name, runs the script, and opens a PR with the new JSON files on branch cache/<competition-slug>
- [ ] #6 The Action reads the server URL from a repository secret (not hardcoded)
<!-- AC:END -->
