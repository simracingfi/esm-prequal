---
id: TASK-8
title: 'Fix: last laps missing when batch send times out'
status: To Do
assignee: []
created_date: '2026-05-09 09:34'
labels:
  - bug
dependencies: []
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Observed:** Last 2 laps of a round were not reported. Both were the driver's final laps.

**Suspected cause:** Log shows two errors: `Error sending batch: The read operation timed out`. Timed-out batches may be silently dropped instead of retried or queued.

**Unknowns:** Whether the missing-laps and timeout correlation is causal or coincidental.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Timed-out batches are retried or otherwise not lost
- [ ] #2 All laps recorded in session appear in results, including final laps
<!-- AC:END -->
