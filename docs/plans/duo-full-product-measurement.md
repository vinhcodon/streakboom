# The cost of the complete duo against Peak alone (issue 3)

**Status:** measured 2026-11-22 by the duo session, one machine, canned replies; **a measurement, not a recommendation to build duo or to change a budget** (the decision is the author's). Raw samples and the summary: [`docs/plans/duo-perf/`](duo-perf/). The script: `scripts/windows/duo-perf.ps1` on `exp/duo-prototype`.

## Setup (so the numbers can be redone)
- **Build:** the release build (`tauri build --no-bundle`, `tauri.duospike.conf.json`) of `exp/duo-prototype` with the code of `ec3dd47` (`b81ee08` adds only a merge of documents); own identifier `com.streakboom.duospike`; `STREAKBOOM_DUO=1` and `STREAKBOOM_DUO_FAKE=1` (canned replies: no key, no network, no provider).
- **Machine:** Intel Core i5-7300U (2 cores, 4 threads), 7.9 GB, Windows 10 Pro build 19045, one monitor 1920 by 1080 at 125%, power plan Balanced, **on AC power** (the render spike of `duo-render-spike.md` was on battery: do not compare the two tables as if the conditions were the same). The author's own computer, with a debug build of another session also running (not in the tree that was counted, but it uses the machine: the processor figures include that noise).
- **Method:** the process tree of the program (the program and every WebView2 process it started) is read with `Get-Process`: **private memory = `PrivateMemorySize64` (private bytes committed), working set = `WorkingSet64` (it includes pages shared between processes, so it is bigger and does not add up exactly)**; the processor is the change of `TotalProcessorTime` of the whole tree over the wall time, **in percent of one core** (the machine has 4 threads, 400 would be all of them). 25 s of warm-up after the start, then **3 runs of 15 s** in each phase (memory at the end of each run, the processor over the run). No click, no key, no pointer movement (the pointer is parked in a corner); the scenes and the talk are started through the developer channel.

## Results (mean of the 3 runs; the range in brackets)
| Phase | Processes | Private MB | Working set MB | Processor, % of one core |
|---|---|---|---|---|
| 1. Peak only (Paws in, no box) | 8 | 118 (110 to 134) | 321 | 5.8 (2.8 to 8.7) |
| 2. Peak and Paws out, idle | 8 | 138 (137 to 139) | 369 | 23.6 (14.5 to 33.4) |
| 3. plus the chat box shown, empty, idle | 9 | 167 (165 to 170) | 441 | 38.1 (33.8 to 43.6) |
| 4. plus a scripted talk (an `@Paws` message and one to both, repeated) | 10 | 208 (202 to 215) | 524 | 45.6 (36.6 to 51.7) |
| 5. a scene (`roll`, 14 s) | 9 to 10 | 201 (179 to 212) | 510 | 43.2 (34.6 to 57.7) |
| 6. 60 s after the box was hidden and Paws sent in | 8 | 158 (158 to 159) | 409 | 14.3 (11.5 to 16.2) |

**Calls and latency** (canned replies: 400 ms a call and 0.6 to 1.2 s between the two pets, so these are the program's own overhead, not a provider's): a message to `@Paws` made **one** model call and its line was shown after about 0.55 s; an unaddressed message with both out (the usual case since ADR-0145) made **two** calls, the lines shown after about 0.58 s and 1.85 s. With a real provider each call adds its own latency and its own use of the daily limit (60 chats a day in a release build): **not measured** (it would use the author's keys).

## What it shows (measured) and what it does not (hypotheses are marked)
- **Against the reference budget of about 120 MB for all processes (ADR-0005, A1):** Peak alone is **at** it (118 MB). **The complete duo is above it: about 138 MB with Paws, 167 MB with the chat box, 200 to 210 MB while talking or in a scene** (+80 to +90 MB over Peak alone), measured. This is the number the decision needs; nothing was raised silently.
- **A second pet costs about +20 MB and +18 points of processor idle** (phase 2 against 1): less memory than the render spike's second window (+43 MB) but a larger share of the processor than the spike's still pet (+1 to 2). The page of Paws is the real page with its loops, not a minimal one.
- **The chat box shown and empty costs about +30 MB and +15 points**, and it stays: after the box was hidden and Paws sent in (phase 6), the tree is **40 MB and 8 points above Peak alone**, because the box window is hidden, not destroyed (measured: 158 against 118 MB). **Hypothesis, not measured:** destroying the hidden box window after a rest, as the bubble window is (45 s), would give most of those 40 MB back; the cost is a slower first show.
- **The talk costs about +40 MB over the box alone** (the bubble window and the messages). Teardown gives back about 50 of the 90 MB, so **the resources are partly reclaimed, not wholly**.
- **Where the idle processor goes is not known.** The box watcher (the pointer read every 100 ms), the presence poll (every 2 s) and the pets' own loops are candidates; none was measured one by one.

## What was not measured
Another machine, a laptop on battery, a second monitor or another DPI; a 120 or 144 Hz screen; walking on its own (the pets' own walks happened by chance; the scene `roll` is the only controlled movement); the scenes `tidy-ball` and `shift-away`; the real provider's latency and cost; a long run (hours: leaks), more than 3 runs per phase (the ranges above are wide in phases 1 and 5), the private working set (the figure that the Windows Task Manager shows by default); the cost with the screen picture sense on.

## Decision needed from Vinh
The complete duo does not fit the 120 MB budget of ADR-0005 on this measurement (about 200 MB while talking). Options, none of them taken: (a) accept a higher budget for the prototype and the duo only (an ADR amending ADR-0005, with this table as evidence); (b) cut: destroy the hidden chat box window after a rest, close the bubble window earlier, measure again; (c) keep the budget and keep duo as an experiment that cannot ship until it fits. A fix is not part of this measurement.
