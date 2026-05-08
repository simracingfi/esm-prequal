---
id: TASK-3
title: Show gap-to-leader as background bar in delta column
status: To Do
assignee: []
created_date: '2026-05-08 13:37'
labels:
  - result-client
  - ui
dependencies: []
references:
  - packages/result-client/src/components/StandingsTable.tsx
  - packages/result-client/src/utils/formatGapToBest.ts
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
In `StandingsTable.tsx` the delta `<td>` (lines 89–93) shows a text gap. Add a proportional background bar to that cell visualising gap magnitude.

**Bar logic:**
- Width: `(entry.bestTime - standings[0].bestTime) / maxGap * 100%` where `maxGap` is the largest gap in the current standings
- Leader cell: no bar (gap = 0)
- Apply via inline `background: linear-gradient(to left, <color> <width>%, transparent <width>%)` — same pattern already used for freshness highlighting

**Stack:** React 19, plain CSS, inline styles for dynamic values (`src/components/StandingsTable.tsx`, `src/index.css`).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Driver with the largest gap has a full-width bar; leader has none
- [ ] #2 Bar width scales linearly with gap across all rows
- [ ] #3 Text remains readable over the bar
- [ ] #4 Freshness highlight stays behind the bar
- [ ] #5 No regression on freshness highlighting or other columns
<!-- AC:END -->
