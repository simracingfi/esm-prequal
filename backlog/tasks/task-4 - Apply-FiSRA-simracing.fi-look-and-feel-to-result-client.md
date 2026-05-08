---
id: TASK-4
title: Apply FiSRA simracing.fi look and feel to result-client
status: To Do
assignee: []
created_date: '2026-05-08 13:42'
labels:
  - result-client
  - ui
dependencies: []
references:
  - packages/result-client/src/index.css
  - packages/result-client/src/components/StandingsTable.tsx
  - 'https://simracing.fi'
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Match result-client visual style to https://simracing.fi (FiSRA). Extract colors and fonts from that site and apply to `src/index.css` and any inline styles in components.

Current styles live entirely in `src/index.css` (35 lines, plain CSS). Dynamic styles use inline `style={{}}` props in `StandingsTable.tsx`.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Colors (background, text, accents, table rows) match simracing.fi palette
- [ ] #2 Font family matches simracing.fi
- [ ] #3 No regressions in table layout or dynamic styles (freshness highlight, gap bar from TASK-3)
<!-- AC:END -->
