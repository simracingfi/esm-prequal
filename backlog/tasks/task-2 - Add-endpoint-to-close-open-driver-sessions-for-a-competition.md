---
id: TASK-2
title: Add endpoint to close open driver sessions for a competition
status: To Do
assignee: []
created_date: '2026-05-08 07:28'
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
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
## Goal

Add a write endpoint that bulk-closes all "open" driver sessions for a given competition. This is a housekeeping operation to be called at the end of a qualifying session to ensure every driver who started laps has a proper closing record.

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

{ "competition": "some-competition-id" }
```

Response `200 OK`:
```json
{ "closed": 3 }
```

- Protected by `X-API-Key` authentication (same middleware already applied to `POST /api/laptimes` in `src/index.ts`).
- `competition` is required; return `400` if missing or empty.
- Returns count of rows actually inserted (sessions that were already closed contribute 0 due to `INSERT OR IGNORE`).

## Implementation Sketch

### New db function — `src/db.ts`

```ts
export async function closeSessions(db: D1Database, competition: string): Promise<number> {
  // 1. Find open sessions with the driver_name from the latest lap
  const openSessions = await db
    .prepare(
      `SELECT l.driver_id, l.driver_name, l.session_id
       FROM laptimes l
       WHERE l.competition = ?
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
```

### New route — `competitions/close-session`

Mount alongside the existing routes, inside the `X-API-Key` guard (or apply the guard on the route itself — follow the existing pattern for `POST /api/laptimes`).  Require competition as parameter.  Use `closeSessions` to execute the closing.

## Notes

- If/when TASK-1 (OpenAPI annotation) is implemented, convert this route to `createRoute` + `.openapi()` at that time rather than doing it here.
- The sub-query approach for `driver_name` picks the most recently created lap for the session. If two laps share an identical `created_at` timestamp the result is deterministic but arbitrary among those rows — acceptable given the use case.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 POST /api/sessions/close with a valid X-API-Key and body { competition } returns 200 { closed: N } where N is the number of sessions closed
- [ ] #2 Sessions already closed (lap_number 4 row exists) are left untouched and not counted
- [ ] #3 Sessions with only lap_number 0 rows are not closed
- [ ] #4 Calling the endpoint twice for the same competition is idempotent (second call returns { closed: 0 })
- [ ] #5 Missing or empty competition field returns 400
- [ ] #6 Missing or invalid X-API-Key returns 401
- [ ] #7 The inserted closing row carries driver_name from the latest (most recent created_at) lap of that session
<!-- AC:END -->
