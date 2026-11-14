# ADR-0119: The screen picture experiment is a view in Preview builds, turned on from the tray

- **Status:** accepted (the author ordered it on 2026-11-15, "Làm thí nghiệm ngay"); built on branch `vanish`, **not yet seen** (V-149). Applies ADR-0045 point T5 (the screen picture sense, opt-in, off by default) to its first stage and records one exception.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author saw that with all windows minimised the map shows only "bare desktop", and with a window maximised only one block, so Peak has no ledge or wall to use. He asked for the layer decided on 2026-11-10 (spec 10 section 12, ADR-0045 T5): recognise blocks and the borders between them from the brightness of the screen. The plan is `docs/plans/screen-picture-plan.md` (epic E27).

## Decision
1. **Stage 1 is a view only.** A second tray item, "Screen picture (experiment)", exists **only in a Preview build** (and a developer build), like the terrain overlay of ADR-0116. When the person turns it on and the overlay is open, the pet window asks Rust for a small grey grid of the monitor Peak is on (at most 192 by 108 cells), finds edges, horizontal and vertical segments and empty space (`picture.ts`), and the overlay draws them. **Nothing else uses them**: Peak's behaviour does not change.
2. **The exception to ADR-0045 T5**: T5 says the picture is taken "only when Peak is about to move". In the experiment it is taken about once a second **while the person has it turned on and the overlay open**, because tuning needs a live view. It is **off at every start**, only a Preview has the item, and the turning on is the person's own act each time.
3. **The guarantees of the plan hold from the first line of code**: the grid exists only in memory and is dropped after each look; it is never written, logged or sent; Peak's own windows are not in it; it is too small to read text from; no use of it outside the overlay. A test checks that no function of `picture.ts` keeps the grid, and that the Rust command only returns it.
4. **No setting** is added (charter: few settings); the switch in Settings, Privacy comes with stage 5, with the texts, only if the author orders it.
5. The work after stage 1 is **not decided here**: each stage in the plan waits for the author to look at the one before.

## Consequences
- The Preview's changelog says there is a new tray item and what it does; the Stable and the website do not mention it (ADR-0101).
- If the author finds the result useless, the work ends at stage 1 and nothing has been given up: the view is removed and the plan marked ended.
