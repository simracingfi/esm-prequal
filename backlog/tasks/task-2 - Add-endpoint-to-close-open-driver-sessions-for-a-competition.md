---
id: TASK-2
title: Add endpoint to close open driver sessions for a competition
status: To Do
assignee: []
created_date: '2026-05-08 07:28'
updated_date: '2026-05-09 09:41'
labels:
  - result-server
  - api
dependencies: []
references:
  - packages/result-server/src/db.ts
  - packages/result-server/src/routes/laptimes.ts
  - packages/result-server/src/index.ts
  - packages/result-server/src/types.ts
  - packages/result-server/migrations/0001_init.sql
  - packages/timing-loader-py/tmp/eventresult-85587065.json
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

Add a write endpoint that bulk-closes "open" driver sessions for a given competition. Optionally accepts an iRacing event-result JSON to (a) restrict closing to only drivers listed in that result, and (b) insert missing lap times from the iRacing best qualifying lap time.

## Domain Rules

**Open session**: a `(driver_id, session_id, competition)` group in the `laptimes` table where `MAX(lap_number) > 0` AND `MAX(lap_number) <= 3`. In other words, the driver has started laps but no lap_number 4 record has been written yet.

**Closing a session**: insert one row into `laptimes` with:
- `driver_id` — same as the session
- `driver_name` — from the most recent lap of that session (latest `created_at`)
- `session_id` — same as the session
- `competition` — same as the session
- `lap_number = 4`
- `lap_time = NULL`

Use `INSERT OR IGNORE` (consistent with the existing `insertLaptimes` pattern) so calling the endpoint multiple times is safe.

## Endpoint Design

```
POST /api/sessions/close
Content-Type: application/json
X-API-Key: <key>

{
  "competition": "some-competition-id",
  "iracing_result": { ...iRacing event-result JSON (optional)... }
}
```

Response `200 OK`:
```json
{ "closed": 3 }
```

- Protected by `X-API-Key` authentication (same middleware already applied to `POST /api/laptimes` in `src/index.ts`).
- `competition` is required; return `400` if missing or empty.
- Returns count of rows actually inserted (sessions that were already closed contribute 0 due to `INSERT OR IGNORE`).

## iRacing Result JSON Handling

When `iracing_result` is provided in the request body:

**Driver filter**: only consider drivers whose `cust_id` appears in the QUALIFY session of the iRacing result. Identify the QUALIFY session as the `session_results` entry with `simsession_name == "QUALIFY"`. Map `cust_id` → `driver_id`.

**Fill missing lap times**: before inserting closing rows, add missing `lap_time` rows using `best_qual_lap_time`, `best_qual_lap_num` and `best_qual_lap_at` from the iRacing result. The iRacing time unit is tenths of milliseconds (divide by 10000 to get seconds).  Laptimes are identified by `driver_id`, `session_id`, `competition` and `lap_number`. Do not overwrite existing lap time rows. Skip drivers where `best_qual_lap_time == -1`.

**Without `iracing_result`**: close all open sessions for the competition (original behaviour).

## Implementation Sketch

### New db function — `src/db.ts`

```ts
export async function closeSessions(
  db: D1Database,
  competition: string,
  driverFilter?: number[]   // cust_ids from iRacing result; undefined = close all
): Promise<number> {
  // 1. Find open sessions (optionally filtered to driverFilter)
  const filterClause = driverFilter
    ? `AND l.driver_id IN (${driverFilter.join(',')})`
    : '';
  const openSessions = await db
    .prepare(
      `SELECT l.driver_id, l.driver_name, l.session_id
       FROM laptimes l
       WHERE l.competition = ?
         ${filterClause}
         AND l.created_at = (
           SELECT MAX(l2.created_at)
           FROM laptimes l2
           WHERE l2.driver_id = l.driver_id
             AND l2.session_id = l.session_id
             AND l2.competition = l.competition
         )
       GROUP BY l.driver_id, l.session_id
       HAVING MAX(l.lap_number) > 0 AND MAX(l.lap_number) <= 3`
    )
    .bind(competition)
    .all<{ driver_id: number; driver_name: string; session_id: number }>();

  if (openSessions.results.length === 0) return 0;

  // 2. Batch-insert closing rows
  const stmts = openSessions.results.map(({ driver_id, driver_name, session_id }) =>
    db
      .prepare(
        `INSERT OR IGNORE INTO laptimes (driver_id, driver_name, session_id, competition, lap_number, lap_time, created_at)
         VALUES (?, ?, ?, ?, 4, NULL, datetime('now'))`
      )
      .bind(driver_id, driver_name, session_id, competition)
  );

  const results = await db.batch(stmts);
  return results.reduce((sum, r) => sum + (r.meta.changes ?? 0), 0);
}

export async function fillMissingLapTimes(
  db: D1Database,
  competition: string,
  times: Array<{ driver_id: number; lap_time_s: number }>  // seconds
): Promise<void> {
  if (times.length === 0) return;
  // Find which of the given times already exist in db.
  // Add the ones that aren't there yet.
}
```

### Route logic sketch

```ts
// parse iRacing result if provided
let driverFilter: number[] | undefined;
let driverTimes: Array<{ driver_id: number; lap_time_s: number }> | undefined;

if (body.iracing_result) {
  const qualSession = body.iracing_result.data.session_results
    .find((s: any) => s.simsession_name === 'QUALIFY');
  if (qualSession) {
    driverFilter = qualSession.results.map((r: any) => r.cust_id);
    driverTimes = qualSession.results
      .filter((r: any) => r.best_qual_lap_time > 0)
      .map((r: any) => ({
        driver_id: r.cust_id,
        lap_time_s: r.best_qual_lap_time / 10000,
      }));
    await fillMissingLapTimes(db, body.competition, driverTimes);
  }
}

const closed = await closeSessions(db, body.competition, driverFilter);
return c.json({ closed });
```

### New route — `competitions/close-session`

Mount alongside the existing routes, inside the `X-API-Key` guard. Require `competition`. Use `closeSessions` (and optionally `fillMissingLapTimes`) to execute the closing.

## Notes

- If/when TASK-1 (OpenAPI annotation) is implemented, convert this route to `createRoute` + `.openapi()` at that time rather than doing it here.
- The sub-query approach for `driver_name` picks the most recently created lap for the session. If two laps share an identical `created_at` timestamp the result is deterministic but arbitrary among those rows — acceptable given the use case.
- iRacing `best_qual_lap_time` is in tenths of milliseconds. Divide by 10000 to get seconds before storing.
- The `iracing_result` payload is the full event-result JSON as returned by the iRacing data API (see sample: `packages/timing-loader-py/tmp/eventresult-85587065.json`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /api/sessions/close with a valid X-API-Key and body { competition } (no iracing_result) closes all open sessions and returns 200 { closed: N }
- [ ] #2 Sessions already closed (lap_number 4 row exists) are left untouched and not counted
- [ ] #3 Sessions with only lap_number 0 rows are not closed
- [ ] #4 Calling the endpoint twice for the same competition is idempotent (second call returns { closed: 0 })
- [ ] #5 Missing or empty competition field returns 400
- [ ] #6 Missing or invalid X-API-Key returns 401
- [ ] #7 The inserted closing row carries driver_name from the latest (most recent created_at) lap of that session
- [ ] #8 When iracing_result is provided, only sessions for drivers whose cust_id appears in the QUALIFY session are closed; other open sessions in the competition are left open
- [ ] #9 When iracing_result is provided, missing lap times are filled before closing
- [ ] #10 Drivers with best_qual_lap_time == -1 in the iRacing result are skipped during the fill-missing-times step
- [ ] #11 Existing lap_time rows are never overwritten by the fill step
- [ ] #12 If iracing_result contains no QUALIFY session, behaviour falls back to closing all open sessions (no filter, no fill)
<!-- AC:END -->
