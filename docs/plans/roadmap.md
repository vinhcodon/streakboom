# Roadmap: from the first official release (0.2.0) to the first outside users

Status: **approved 2026-11-08 with the answers in section 5; Phases 0, 1 and 2 are done and shipped (the counters in 0.1.15, the first official release 0.2.0 (ADR-0026), the chat-cap fix 0.2.1 (ADR-0027)); Phase 4 has started (A4 first positive report, A5 soak running, a sleep-speech fix committed and unreleased); the rest is open. A reminder to update the website is in `../handoff/to-website-0.2.0.md`.** Written 2026-11-08 after reading all project documents and the code.

The work is split into epics and user stories in [`backlog.md`](backlog.md) (progress per epic, sizes, order); the assessment behind it is [`pet-qualities-assessment.md`](pet-qualities-assessment.md).

Goal of this stretch: run a closed alpha with 5 to 10 observed first-time users and get a first baseline of the north star (Bond Days, [`../../spec/05-north-star-metrics.md`](../../spec/05-north-star-metrics.md)) to test hypotheses H1, H2b, H4 and H5 ([`../hypotheses/README.md`](../hypotheses/README.md)).

## Phase 0. Housekeeping (done on 2026-11-08)
- `gh` installed under `%LOCALAPPDATA%\Programs\GitHub CLI` and added to the user PATH (it had been a portable copy outside the PATH, which is why applications reported it unavailable). Restart the Claude desktop app and any open terminal to pick up the PATH.
- Documents reorganized into `spec/` (how it works now), `docs/decisions/`, `docs/hypotheses/`, `docs/handoff/`, `docs/plans/` and the engineering log; README and specs 01 to 04 brought up to date with 0.1.14.
- Process rule written down (ADR-0023): commit explicit paths, release from a clean tree.

## Phase 1. Settle what is in `main` and in 0.1.14 (done)
The reverted Bond Days prototype was folded out in the Bond Days release (decision R1): 0.1.15 shipped the counters and no prototype, and every copy of 0.1.14 is gone (the 0.1.x builds were withdrawn with 0.2.0, ADR-0026). Hypothesis A10 (no leftover counters after the update) was not checked on other machines because there are none; the author's copy was replaced by hand.

## Phase 2. Bond Days, built from the plan (done and released in 0.1.15 on 2026-11-08; a few checks remain listed as not verified)
Plan and tests: [`bond-days.md`](bond-days.md) (steps 0 to 6, decisions D1 to D8 answered). Order and gates:
1. Step 0: agree the working-tree rules (branch or worktree; ADR-0023).
2. Step 1 to 2: pure functions in `bond.ts` and the schema with the consent version, with their unit tests first.
3. Step 3 to 4: thin call sites in the pet window; the new funnel events (`tier_2`, `tier_3`, `pet_named`).
4. Step 5 to 6: the export fields, the new consent wording and card, the second privacy switch, and the documentation changes (README, specs, ADR-0009) in the same change.
5. Manual checks 1 to 10 in the real window (plan section 5.2), on this machine, using the DevTools port recipe.
6. Gate: all three test suites green, the manual list done, wording and docs updated, a one-line note to people who already opted in.
**Risks to watch:** consent scope, concurrent edits, chat leaking into engagement, the write volume, idle CPU (must stay near 0).

**Follow-up 0.2.1 (done and released 2026-11-08, ADR-0027):** the author hit the daily chat cap in one day. Fact-noting requests now have their own cap (20) and no longer eat the 60 chat turns, and the pet declines in character with no numbers.  Watch the chat-share metric: if people keep reaching 60, consider a setting for the cap.

## Phase 3. Real-key verification of the Claude and OpenAI brains
**Why:** both clients exist and are covered by mock-server tests only (hypothesis A6).
**Needs from Vinh:** a small prepaid balance and a key for each, or a tester who has them.
**Steps**
1. For each brain: connect, chat in both languages, trigger the "no credit" and "bad key" errors on purpose, check the model list and the automatic choice, check the mood tags, check the facts note.
2. Note any reasoning-model empty answers (OpenAI) and any model-name problems (Claude's default is `claude-haiku-5-5`).
3. Fix what is found; add a test for each bug; record results in the engineering log.
**Done when** each brain has completed a real chat and a real error case, or the failures are written down.

## Track in parallel (added 2026-11-10): the character's expression and words
Not a phase, because it does not block or wait for the alpha path. After 0.3.0 the author asked for reactions that feel alive and lines that do not repeat. Epic **E12** (spec 09, ADR-0041: events, appraisal, beats, the persona in layers and shown to the user) and epic **E13** (spec 09 section 11: a shuffle bag, escalation, tokens, a line factory) are the work. They serve hypotheses H4 (a charming naive pet worth keeping for 7 days) and H2b (attachment that leads to a brain) and are cheap in CPU. They are done in the order of the backlog's "Suggested order" and released with the next version the author orders. **Update 2026-11-10:** E12 and most of E13 were built (0.3.1 and after); two more tracks followed from the author's feedback, both off the alpha path and cheap in CPU: epic **E14** (the desktop as terrain, version 2: spec 10; perches, walls and climbing, falls to the plane below, getting out from under the Start menu) and epic **E15** (restraint, play and the charter: spec 11, `docs/charter.md`, ADR-0047). E15 is where the next work is: the edge check, the three attention modes and the fixes the audit found. A release of this unreleased work needs the README promise, the website prompt and the CPU check (ADR-0033). Real-key checks (Phase 3) and the alpha readiness checks (Phase 4) stay as they are.

## Phase 4. Alpha readiness
Verify the assumptions in the hypotheses register before outsiders see the app.

**Progress (2026-11-11, version 0.3.2: perches, climbing, the push and the calm, the retired settings, see the backlog E14 and E15, the CPU equal to 0.3.1 within the noise of one machine); earlier (2026-11-09, version 0.3.0):** the 8-hour soak was stopped at 2 h 23 (memory flat) to fix the CPU (0.2.2 to 0.2.4, the median from about 17% to about 8 to 9% of one core, PR-9 open); the in-app update path was seen working four times; focus-safety, hops, the typing lane and the notice beat were built and released (0.2.4, 0.2.5, 0.3.0, backlog E8, E9 and E10), and Japanese (beta) and the Groq brain with them (0.3.0, E11); everything built but not yet checked is in [`verification-debt.md`](verification-debt.md). Earlier (2026-11-08): A4 first positive report from the author (one try, not a pass); A5 8-hour soak started at 19:40 (`scripts/soak-log.ps1`, result pending); A7 waits for the end of the soak (a reboot would cut it; start with Windows is still off on the author's machine). Next in order after the soak: A7 with the tray icon check, a forced unprompted line during fullscreen (A4) and while the cat sleeps (fix `a4e620f`, then release 0.2.2). A1, A2 and A3 need a second machine or monitor.

| Item | Hypothesis | Action |
|---|---|---|
| Second and lower-end machine; CPU and RAM | A1 | Run the measurement recipe in the engineering log; compare with the 120 MB / 7 to 15% walking budget |
| Visual check without GPU; 125% and 150% DPI | A2 | Look at the rig on several screens |
| Multi-monitor and mixed DPI | A3 | Manual matrix in spec/04 section 6 |
| Fullscreen, video, screen sharing | A4 | Real apps; confirm the pet stays silent |
| 8-hour soak | A5 | Watch memory growth |
| Start with Windows across a reboot and an update | A7 | Reboot test from the installed build |
| SmartScreen and install conversion | A8 | See decision R3 below |
| First-time reaction to the tour, the trap rate, the mood tags, the new Settings | A9 | Observed sessions (Phase 5) |

Also decide: **R2** where stats go (keep "Copy stats" for the alpha, or pick a sending backend) and **R3** whether to buy a code-signing certificate before the alpha or accept the SmartScreen warning. Crash reporting without content stays out of the alpha unless a tester loses data.

## Phase 5. The closed alpha
1. Recruit 5 to 10 first-time users (people the author can observe or call).
2. Observation protocol: install, first 10 minutes (watch the tour, the first gestures, the consent card), a call after day 3 and day 7. Write down where people stop.
3. Collect "Copy stats" JSON from consenting testers; compute Bond Days, engagement rate, chat share and D3/D7 with the formulas in spec/05. **No thresholds are set until the baseline exists** (a fixed decision).
4. Record outcomes in the hypotheses register (status and evidence), and turn changes of direction into decision records. Decide the fate of H3 (see the register).

## Phase 6. After the alpha (not scheduled)
Candidates, in no order: a cheaper walking draw; emotions for scripted lines; more key poses for the in-between frames; the hide-pet rate (needs a Rust event); weekday, battery and lid-open reactions; a macOS port; code signing and a stats backend if the alpha supports going wider; streaming replies only if answers get longer.

## Dependencies at a glance
```
Phase 0 (done) -> Phase 1 -> Phase 2 -----------------> Phase 4 -> Phase 5
                    \-> Phase 3 (can run in parallel) -----^
```
Phase 2 and Phase 3 touch different code (counters and consent versus the brain clients), so they can run in parallel if the working-tree rules in Phase 2 step 0 are followed.

## 5. Decisions (answered by Vinh, 2026-11-08)
- **R1.** Release vehicle for removing the prototype: **fold it into the Bond Days release** (no separate 0.1.15). Until then 0.1.14 copies keep the prototype locally.
- **R2.** Stats: **keep "Copy stats" for the alpha**; no sending backend yet.
- **R3.** Code signing: **not before the alpha**; accept the SmartScreen warning.
- **R4.** Hypothesis H3: **kept as a secondary hypothesis**; H5 is primary.
- **R5.** Real Claude and OpenAI keys: **later, none available now**; Phase 3 waits, and both brains stay "not verified with a real key" in the documents.
- **R6.** Working method: **directly in the current tree**, committing only the files changed (ADR-0023). The tree was clean when work started.
