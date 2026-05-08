---
id: TASK-5
title: Add a standings view with predicted heat split and cutoff times
status: To Do
assignee: []
created_date: '2026-05-08 19:59'
labels:
  - result-client
  - ui
  - standings
dependencies: []
references:
  - packages/result-client/src/utils/getHeat.ts
  - packages/result-client/src/api/client.ts
  - packages/result-client/src/components/StandingsTable.tsx
  - packages/result-client/src/App.tsx
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add a second standings view that fills in estimated times for drivers without a time in the current competition, then shows where heat boundaries fall and the cutoff time at each boundary.

## Estimation algorithm

**Per-driver off percentage** (computed from a previous competition):
```
offPct(driver) = driver.bestTime in last comp / top bestTime in that comp
```

**Estimated top time for current competition:**
```
estimatedTopTime = currentTopTime / offPct(currentLeader)
```
`currentTopTime` is the actual leader time in the current competition; `offPct(currentLeader)` is derived from the leader's latest competition.

**Estimated time for a timeless driver:**
```
estimatedTime = estimatedTopTime * offPct(driver)
```

Drivers with no previous competition record cannot be estimated; sort them last.

## Data

No new API endpoint needed. Fetch all competitions via `/api/competitions`, then parallel-fetch `/api/standings?competition=X` for each. All cross-competition logic runs client-side.

Current `StandingEntry`: `{ driverId, driverName, bestTime: number|null, lapCount, flag, ... }`.

## UI

New component (e.g. `PredictedStandingsTable.tsx`) added as one more option in addition to existing standings and all laptimes. Predicted standings is available if >=5 drivers have a valid laptime and >0 drivers have green or white flag. 

Wrap `StandingsTable` in a new component `CurrentStandingsTable` and move standings fetching out to `App.tsx`. Both predicted and current standigs render using `StandingsTable`. Introduce one more flag in `StandingsTable` to highlight estimates. Show estimated times with mute color. Heat assignment uses the existing `getHeat()` utility on the merged sorted list. 

## Files to create/change

| File | Change |
|------|--------|
| `src/utils/estimateTimes.ts` | Estimation algorithm |
| `src/components/PredictedStandingsTable.tsx` | Fetch historical standings, calculate predictions, render uses `StandingsTable` |
| `src/components/CurrentStandingsTable.tsx` | render uses `StandingsTable` |
| `src/components/StandingsTable.tsx` | takes standings entries as parameter instead of competition name, no fetch |
| `src/App.tsx` | Fetch standings, check if predictions should be available, provide switcher between current standings, predicted standings and all laps |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Drivers with an actual time appear with their real time
- [ ] #2 Drivers without a time show an estimated time, have estimate flag and the time is displayed with muted color
- [ ] #3 Drivers with no previous competition record appear at the bottom without an estimated time
- [ ] #4 Heat assignments in the predicted table match what getHeat() produces for the merged sorted list
- [ ] #5 Last year champion can't be pushed further down than position 27 when adding drivers with predicted time
<!-- AC:END -->
