---
id: TASK-7
title: Add tkinter GUI to timing loader
status: To Do
assignee: []
created_date: '2026-05-08 21:31'
labels:
  - timing-loader-py
  - gui
dependencies: []
references:
  - packages/timing-loader-py/loader.py
  - packages/timing-loader-py/esm-loader.spec
priority: medium
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GUI launches automatically when `loader.py` is run with no CLI arguments (double-click on `.exe`). Headless mode (args given) is unchanged.

## Layout

```
Competition: [________________]
Server:      [http://localhost:8787]
API Key:     [________________]
Interval:    [10]

[Start]  [Stop]  [Enroll Drivers…]
─────────────────────────────────
Activity log (scrolling text)
```

## Implementation

**Zero new dependencies** — tkinter is Python stdlib.

**`TextRedirector`**: redirects `sys.stdout` to the log widget via `widget.after(0, ...)` for thread safety. All existing `print()` calls stay untouched.

**`run_loader(args, stop_event)`**: extract existing `while True:` loop from `main()`. Replace `time.sleep(args.interval)` with `stop_event.wait(args.interval)`; check `stop_event.is_set()` at loop top for clean shutdown.

**`run_gui()`**:
- Form fields pre-populated with defaults (server `http://localhost:8787`, interval `10`)
- Start button: builds `argparse.Namespace` from form, starts `run_loader` in daemon thread
- Stop button: calls `stop_event.set()`
- Enroll Drivers button: opens `filedialog.askopenfilename()`, runs `enroll_drivers(args)` in daemon thread with selected file path
- `ScrolledText` log widget; `sys.stdout` redirected to it on window open

**`main()`**: `if len(sys.argv) == 1: run_gui(); return` — everything else unchanged.

**`esm-loader.spec`**: set `console=False` to hide terminal window behind GUI in the `.exe` build.

## Files

| File | Change |
|------|--------|
| `loader.py` | Add `TextRedirector`, `run_gui()`, extract `run_loader(args, stop_event)`, update `main()` |
| `esm-loader.spec` | `console=False` |
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Running with no args opens the GUI window
- [ ] #2 Start button begins the loader loop in a background thread; output appears in the log
- [ ] #3 Stop button cleanly exits the loop
- [ ] #4 Enroll Drivers button opens a file picker; selecting a file runs enrollment and logs output
- [ ] #5 Closing the window exits the process
- [ ] #6 Running with --competition/--apikey/etc. args runs headless with no window (existing behaviour)
- [ ] #7 pyinstaller esm-loader.spec produces a .exe that opens the GUI with no console window behind it
<!-- AC:END -->
