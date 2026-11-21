# Duo review log

The log of the turns of the duo work, as `docs/handoff/duo-prototype-and-cross-review.md` section 6 asks: each turn says who, what, the result and the open questions.

| Date | Who | What | Result | Open questions |
|---|---|---|---|---|
| 2026-11-21 and 2026-11-22 | Claude Code (the app session) | Read the handoff and section 14 of spec v0.2; job A, the render spike (a release build of `exp/duo-prototype`, four scenarios and the real program, 2 minutes each); job B, the reconciliation of the grid size, of the privacy sentences and of the references of section 14 | `docs/plans/duo-render-spike.md` (two windows cost +43 MB and double the walking processor; the world window makes Windows report "busy"; moving a window costs more than painting a second rig); `docs/plans/duo-reconciliation.md` (the grid is 192 wide and up to 216 tall, not "at most 192 by 108"; the Settings text states the wrong maximum; the guarantee of unreadability was measured at 10 px a cell only; the absolute privacy sentences listed with proposed wording; the references of 14 checked: all found, one outdated) | The three questions of section 4 of the handoff (asked of the author before job C); whether to change the Settings text now (it is shown to people in Preview 0.11.10) |
