# Backlog: epics and user stories (from the five qualities assessment)

Status: **proposed 2026-11-08, asked by Vinh to be carried out story by story.** It turns [`pet-qualities-assessment.md`](pet-qualities-assessment.md) into work and sits next to the phases of [`roadmap.md`](roadmap.md): the roadmap says *when* (Phase 3 real keys, Phase 4 readiness, Phase 5 alpha); this file says *what, in pieces*. Epics E1 to E5 are the five qualities, E6 is measuring the north star and running the alpha, E7 is verification and release.

## How we work with it
1. **Size.** S = up to half a day, M = one to two days, L = more than two days (an L must be split before it starts).
2. **After every story** (this is the standing rule): set its status here, update the progress table, compare with the roadmap phase it belongs to, and propose the next two or three stories of size S or M with the reason for the order.
3. **A story that says "Needs Vinh"** is a decision: I put the options to Vinh as a multiple choice and write an ADR before any code. Other stories can start as soon as their dependencies are done.
4. **Done means:** tests for the pure logic, the spec and README updated in the same commit, the engineering-log entry saying what was **not** verified **and the same items added to [`verification-debt.md`](verification-debt.md)** (the one list of everything built but not yet checked; tick or remove a row when it is checked), explicit-path commit (ADR-0023). Behavior the website describes also gets the website session told (README, Release and auto-update, step 1). A release is a separate step the author orders.
5. Statuses: `done`, `doing`, `ready` (can start), `needs Vinh` (a decision or an action only Vinh can do), `blocked` (waits for something named), `later`.

## Progress (2026-11-09, version 0.3.0; counts exclude stories merged into others)

| Epic | Quality | Done / stories | Where it stands |
|---|---|---|---|
| E1 | Presence | 6 / 9 | The pet is there; the CPU was cut by about half (PR-4), the target needs a decision (PR-9); PR-6 moved to E8 |
| E2 | Continuity and growth | 3 / 6 | Memory and tiers exist; growth is not visible |
| E3 | Consistent personality | 1 / 6 | The character exists; the vague refusal, hour lines, own habits and the Vietnamese review are open |
| E4 | Two-way care loop | 2 / 5 | Gestures answer; no lasting change yet (weakest) |
| E5 | Proactive but frugal | 3 / 6 | Polite and rate-limited; context timing comes through E8 (strongest) |
| E6 | Measurement and alpha | 1 / 7 | Counters built; no baseline, no tool, no testers |
| E7 | Verification and release | 4 / 9 | The 8-hour soak was stopped at 2 h 23 (memory flat) to diagnose CPU; real keys, devices open; the 0.2.1 to 0.2.2 update was seen working |
| E8 | Focus-safety and places | 6 / 13 | FS-0 to FS-4 and PL-0 done; FS-5 and FS-6 left; PL-1 and PL-7 merged into E9 |
| E9 | The desktop as terrain | 8 / 16 | Spec 07 and ADR-0030 written; the Rust `monitors_info` and `move_to` exist (TE-2); the lane model (TE-12) and the mouse button reading (TE-13) exist; hops and falls exist (TE-7); the cat leaves the typing lane by a hop (TE-14); a hop costs about a third of what it did (TE-15) |
| E10 | Perception | 5 / 9 | Spec 08 and ADR-0031: four of five decisions answered; the ground map waits for L3 |
| E13 | Fresh words: more variety in the scripted lines | 4 / 9 | Proposed 2026-11-10 after the author found the lines repetitive; the pools behind poke, scratch and belly are the smallest; nothing built |
| E12 | Reactions: one way to express what happens | 3 / 11 | Spec 09 written and its four decisions answered (ADR-0041, 2026-11-10); the first fall (PC-7) felt flat, which showed that each reaction is a separate rule; nothing built yet |
| E11 | Reach: languages and brains | 4 / 5 | Groq is the fourth brain and Japanese is built in full, both released in 0.3.0 (BR-1, JA-1 to JA-3, ADR-0037, ADR-0038); BR-2 needs a key |

Against the roadmap: Phases 0 to 2 done; **Phase 4 in progress** (E7: the soak was stopped early; PR-3 and PR-4 done; PF-3, PR-8, VE-2, VE-3 open; all the unchecked items are in [`verification-debt.md`](verification-debt.md)); Phase 3 blocked on keys (VE-4, VE-5, PE-3); Phase 5 not started (E6).

## E1. Presence
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PR-0 | The pet is always on top, click-through except over the cat, with idle, walk, sleep and wake | M | done | |
| PR-1 | Eyes follow the cursor while it is over the pet | S | done | |
| PR-2 | Start with Windows as an opt-in (ADR-0018) | S | done (not verified across a reboot) | |
| PR-3 | Break the CPU down: idle versus walking versus sleeping, per process, against the budget | S | done 2026-11-08 (about 25 painted frames per second on average; blink and twitch keep the cat in full mode about 20% of the time; CPU follows frames; see the engineering log) | |
| PR-4 | Bring the CPU within the budget, first round: a "soft" redraw mode at about 24 fps for blink, twitch and look; springs stop within 1% of target; walk stays 30 fps and sleep 11 fps after the author saw 20 and 5 fps look wrong Measured after the correction: frames per second 25.4 to 14.4, median CPU 16.9% to 9.3%, mean 19% to 13.2% (engineering log). The target of D8 (under 1% standing) is **not** reached | M | done (released in 0.2.3) | PR-3 |
| PR-9 | Decide the CPU target and do a second round: the floor is about 1.3% plus about 0.55% per painted frame, so under 1% standing is unreachable with software drawing; candidates: blinks every 4 to 9 s, a lighter look gesture, shorter walks (sleep and walk rates were already tried lower and looked wrong); or accept about 3 to 5% standing and 15 to 20% walking | S | needs Vinh | PR-4 |
| PR-5 | Decision: read only the time of the last keyboard or mouse input (no content, no hook) to know whether the user is typing | S | done (rungs 1 and 2 plus fading, ADR-0029) | |
| PR-6 | The pet stays still while the user is typing | M | merged into FS-3 (spec/06) | |
| PR-7 | The pet plays more when the user has been idle a while | S | ready | FS-3 |
| PR-8 | Start with Windows across a reboot, and the tray icon after a restart (A7) | S | ready (the soak no longer runs; needs Vinh to turn the option on and reboot) | |

Acceptance (PR-6, PR-7): measured with a fake input clock in unit tests; no new timer while the pet stands still (idle CPU must not rise).

## E2. Continuity and growth
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| CO-0 | Memory phase 1: names, usual part of the day, milestones (ADR-0014) | M | done | |
| CO-1 | Memory phase 2: short facts noted from chats | M | done | |
| CO-2 | Closeness tiers and the streak | M | done | |
| CO-3 | Decision: what visible growth looks like (for example an accessory per tier, a coat change, a small item on the screen edge) | S | needs Vinh | |
| CO-4 | Build the visible growth chosen in CO-3 (the art goes through the rig, so the website copy follows) | M | blocked (CO-3) | CO-3 |
| CO-5 | A small visible moment when a tier is reached (the pet reacts; the first time only) | S | ready | |

Open question for CO-3: the "rest rhythm" idea (using the habit counts for more than one line) must respect ADR-0014: memory is never used in unprompted lines because the screen may be shared. A rest nudge would need a decision of its own.

## E3. Consistent personality
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PE-0 | The character, the tone guide, 182 lines per language, the persona and mood tags (ADR-0011, ADR-0013, ADR-0016) | L | done (the persona is to be restructured and shown in E12) | |
| PE-1 | Export all Vietnamese lines to one file for a native reader to review (and a way to apply the corrections) | S | ready | |
| PE-2 | The pet's own habits and quirks: about 20 lines per language plus a repeating behavior or two (a favorite spot, a favorite time), with tests | M | ready | |
| PE-3 | Voice consistency check of the Claude and OpenAI brains with real keys | S | blocked (keys, Phase 3) | VE-4, VE-5 |
| PE-4 | The vague "too big for a cat" refusal in the persona (no assistant named), with a test or a checked example per language (spec/06 1.4) | S | ready | |
| PE-5 | A few "on the hour" lines (quirk 4), in both languages, with the line-pool tests | S | ready | |

## E4. Two-way care loop
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| CA-0 | Scratch and belly rub raise mood and closeness; the pet answers with a pose; the trap; the return greeting | M | done | |
| CA-1 | Bond Days counts care (scratch, rub, a reaction to an unprompted line) | M | done | |
| CA-2 | Decision: the care loop design (options: a snack and a play gesture using the unused line pools; a gentle "wants attention" cue; a lasting look that care changes). It must keep ADR-0013 (no guilt) | S | needs Vinh | |
| CA-3 | Build the chosen care gestures | M | blocked (CA-2) | CA-2 |
| CA-4 | A lasting visible state that care changes | M | blocked (CA-2, CO-3) | CA-2, CO-3 |

## E5. Proactive but frugal
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PF-0 | Rate limits, quiet rules, never taking focus (ADR-0013 and spec/03) | M | done | |
| PF-1 | No speaking while asleep or dozing off (0.2.2) | S | done (not seen in the real app) | |
| PF-2 | AI lines within daily limits; limit refusals in the pet's voice; fact-noting has its own limit (0.2.1, ADR-0027) | S | done | |
| PF-3 | Stronger silence test (A4): force a line during fullscreen, presentation and screen sharing; confirm nothing shows; also test a sleeping cat (PF-1) | S | ready (Peak is running with the debug port now) | |
| PF-4 | Hold an unprompted line while the user is typing, with a longest wait | M | merged into FS-3 (spec/06) | |
| PF-5 | Tell the pet window when the pet is hidden from the tray, to measure the hide rate | S | ready | |
| PF-6 | Adapt the line frequency to the engagement rate | M | later (needs a baseline, ME-5) | ME-5 |

## E6. Measuring the north star and running the alpha
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| ME-0 | Bond Days counters, consent version 2, the "Copy stats" export (spec/05) | L | done | |
| ME-1 | Save the author's own "Copy stats" as a personal baseline (the earlier counters were wiped) | S | ready (consent must be on) | |
| ME-2 | Verify what was not verified: the `chat` counter with a real chat, `quiet`, midnight rollover, the exported JSON on the clipboard, a fresh install's consent card | S | ready | |
| ME-3 | A small script that computes BD7, D3, D7 and the engagement rate from a folder of exports | S | ready | |
| ME-4 | The alpha kit: who to recruit, an install guide, the observation protocol (with a question about liking the character), how testers send their stats, a consent explanation | M | ready | |
| ME-5 | Run the closed alpha with 5 to 10 first-time users and write the baseline (Phase 5) | L | blocked (Phase 4, ME-3, ME-4) | |
| ME-6 | Set thresholds for the north star and the guardrails from the baseline | S | blocked (ME-5) | ME-5 |

## E7. Verification and release
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| VE-0 | Releases 0.2.0 to 0.2.2, the changelog, the two-release rule, the website link | L | done | |
| VE-1 | The 8-hour memory and CPU soak (A5), started 19:40 | S | done early: stopped at 2 h 23 (memory flat, 121 to 127 MB with one step to 156 MB when an eighth process appeared), to diagnose the CPU; a full run follows after the CPU fix (VE-8) | |
| VE-2 | Check at 125% and 150% DPI and with several monitors (A2, A3) | S | needs Vinh (a monitor or a display scale change) | |
| VE-3 | Run on a lower-end second machine (A1) | S | needs Vinh (a machine) | |
| VE-4 | Real-key test of the Claude brain: connect, chat in both languages, the no-credit and bad-key errors, the mood tags (Phase 3) | M | blocked (a key) | |
| VE-5 | The same for the OpenAI brain | M | blocked (a key) | |
| VE-6 | A real update from one version to the next (**observed once**: the installed 0.2.1 became 0.2.2 by itself at 22:06:56 on 2026-11-08; who accepted the offer was not observed) and the first real clean-up of an old release (**done**: publishing 0.2.3 deleted v0.2.1 and its tag and kept v0.2.2) | S | done (the in-app update 0.2.2 to 0.2.3 was watched end to end at 23:18) | |
| VE-7 | Update the installed copy to 0.2.2 | S | done (the app updated itself at 22:06:56) | |
| VE-8 | A full 8-hour soak on the build after the CPU fix | S | ready (the installed copy is on 0.2.3; needs the PC awake for 8 hours) | PR-9 |

## E8. Focus-safety and places (spec/06, plan `character-and-movement.md`)
Order by decision D2: the CPU baseline (PR-3, PR-4, PR-9) comes first; the pure logic FS-1 and the probe FS-2 are ready.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| FS-0 | Decide the focus-safety rungs and write the ADR (ADR-0029) | S | done | |
| FS-1 | Pure focus decision `focus.ts` with Node tests (walk and speak permissions, ghost with hysteresis) | S | done (`decideFocus`, 14 tests; not wired yet) | PR-4 |
| FS-2 | Rust probe `focus_probe`: last-input time and pointer offset read by the hit-test thread; `windows-sys` features; Rust test for the tick arithmetic | M | done (5 Rust tests; checked in the running app; not called by the page yet) | PR-4 |
| FS-3 | Hold walks and unprompted lines while the user is active (replaces PR-6 and PF-4) | M | done (checked with synthetic input and by the author; the CPU effect is not measured) | FS-1, FS-2 |
| FS-4 | The cat makes way when the user works near it: it walks away from the pointer, or yawns and curls up if there is no room (first built as a fade, which the author found unnatural and which was removed) | S | done (checked with synthetic input and by the author's first look; the text running toward the cat is not covered: see TE-12) | FS-3 |
| FS-5 | Manual checks: overlap with a real text box, multi-monitor, DPI, CPU (spec/06 plan) | S | blocked (FS-4) | FS-4 |
| FS-6 | Clarify the "no input hook" line in spec/05 to say what is and is not read | S | ready | FS-2 |
| PL-0 | Decision: how zones and favorite spots survive a monitor, DPI or taskbar change | S | done (answered by the world model of spec/07: fractions of each monitor's work area, TE-1) | |
| PL-1 | Vertical movement: a Rust `move_to` and the walk along both axes | M | merged into TE-2 and TE-7 (spec/07) | |
| PL-2 | `places.ts`: cell counts, taught spots, tier distance, monitor changes, with Node tests; **rebuilt on the world model of spec/07 (TE-1) instead of a 3 x 3 grid** | M | blocked (TE-1) | TE-1 |
| PL-3 | Places in memory, Settings view, Forget and a learning switch | M | blocked (PL-2) | PL-2 |
| PL-4 | Dragging the cat teaches a favorite spot (and pushing it away teaches an unwelcome one) | S | blocked (TE-7, PL-2) | TE-7, PL-2 |
| PL-5 | Resting distance by closeness tier | S | blocked (PL-2) | PL-2 |
| PL-6 | New movement: curl up in a corner (measured for CPU) | M | blocked (TE-7) | TE-7 |
| PL-7 | New movement: a hop along an arc (measured for CPU) | M | merged into TE-7 | |

## E9. The desktop as terrain (spec/07, plan `terrain-and-attention.md`)
Direction agreed 2026-11-09 (ADR-0030). By decision T6 the code comes after FS-4 and PR-9; the spec and ADR are done.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| TE-0 | Spec 07, plan and ADR-0030: the cost-field thesis | S | done | |
| TE-1 | `terrain.ts`: one world from all monitors, positions as a monitor key plus fractions of the work area, neighbors across touching edges, with tests (resolution, DPI, taskbar and monitor-set changes) | M | blocked (FS-4, PR-9) | |
| TE-2 | Rust: `monitors_info` (work areas and scale) and `move_to(x, y)` clamped to the world, with tests (replaces PL-1's Rust part) | M | done (6 Rust tests; not yet exercised on a real window, nothing calls it until TE-7) | |
| TE-3 | Walk across touching monitors (the walk clamps to the world, not to one monitor); manual check on two monitors | M | blocked (TE-1, TE-2) | TE-1, TE-2 |
| TE-4 | `attention.ts`: the memory-only decayed grid per monitor, fed by the focus probe, with tests | M | blocked (TE-1, FS-3) | TE-1 |
| TE-5 | Fixed danger zones as costs (caption buttons at the top right, the title-bar band) | S | blocked (TE-1) | TE-1 |
| TE-6 | Cost-based choice of a place (`choosePlace`) for rest, wander, avoid and approach, with tests | M | blocked (TE-4, TE-5) | TE-4, TE-5 |
| TE-7 | Vertical movement: hops along an arc and falls; a CPU measurement per kind; the author looks at a test build before the commit | M | done (`hop.ts`, 11 tests; `fly` in the page; a test build with a temporary right-click menu; the author looked at it on 2026-11-09 and said to go on; CPU measured: about 0.5 core-seconds per hop or fall, see TE-15; ADR-0032) | TE-2 |
| TE-8 | Wire avoidance on the cost field: the cat moves away from the user's work (at most once every 25 s); the sideways version exists since FS-4, this adds the field and vertical hops | M | blocked (TE-6, TE-7) | TE-6, TE-7 |
| TE-9 | README, Settings text and the website note for the attention field and the typing lane (memory only; the mouse button state, never a key) | S | blocked (TE-8, TE-14) | TE-8 |
| TE-12 | `lane.ts`: the typing lane (click anchor, typing time, predicted caret, the band, crowded inside it) as pure logic with tests (spec/07 3.1) | S | done (`lane.ts`, 15 tests; not wired into the page yet: that is TE-14) | |
| TE-13 | Rust: read the mouse button state in the thread that reads the pointer, keep the last click position and age in atomics, return it in `focus_probe` (T8), with a test | S | done (3 Rust tests; the probe now also carries the cat's centre, the button state and the last click away from the cat; checked on the real window, see the engineering log) | |
| TE-14 | Wire the lane into making way: leave the band by a vertical hop; measure the CPU of the hop first | M | done (the cat hops out of the typing lane; the author typed on a test build and said the timing was right on the second try; see the engineering log; README privacy text added; not released yet) | TE-7, TE-12, TE-13 |
| TE-15 | Lighter hops: find what a hop costs (about 0.5 core-seconds each, near a whole core while it flies) and cut it: the Rust `Moved` handler runs on every `move_to` (bubble placement and a dirty flag), the rig repaints at full speed, the move rate is 60 a second; try 30 a second and a lighter handler, then look again; also the hop **frequency** (the author's test session had 15 lane hops in about 2 minutes, a 6 s cool-down: consider 10 to 12 s); the author looks at the result | S | done (a flight is played by a Rust thread from one path; the cat is painted at 30 frames a second in the air and for 0.7 s after; the lane cool-down is 10 s, the author's choice; a hop went from about 0.91 to about 0.34 core-seconds; the author said it is smooth; engineering log) | TE-7 |
| TE-16 | The lane's false triggers and the look of the hop: Peak dropped by itself when nothing was happening near it (any input counted as typing, a click's lane lived 60 s, the side with more room was often below). Fixed: crowded only while typing now with a still pointer; up first; a 0.14 s crouch before a hop (2 tests; the author tried a test build and said it was fixed) | S | done (after 0.3.0, not released) | TE-14 |
| TE-10a | L3: Rust windows snapshot (visible, non-minimized, non-cloaked, non-own, extended frame bounds, z-order, maximized flag) behind a Settings switch | M | blocked (Vinh's permission; spec/07 open question 4) | |
| TE-10b | L3: perches and walls in the terrain (visible parts only, headroom, stable for half a second) | M | blocked (TE-10a, TE-1) | TE-10a |
| TE-10c | L3: jump up to a perch, sit, nap, watch | M | blocked (TE-10b, TE-7) | TE-10b |
| TE-10d | L3: fall to the surface below when the perch disappears or moves | M | blocked (TE-10b, TE-7) | TE-10b |
| TE-11 | L4: learned places (welcome by dragging, unwelcome by pushing away) in Settings with Forget; this is PL-2 to PL-5 on the terrain model | M | blocked (TE-6) | TE-6 |

## E10. Perception: what Peak can sense around it and below it (spec/08, a brainstorm draft; decisions in its section 9 are Vinh's)
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PC-0 | Spec 08: the senses, belief and reaction model, the ground ("below") sensing, the notice beat, the gaps found | S | done (draft) | |
| PC-1 | `perception.ts`: the Percept and Belief types, confidence and hysteresis; move the crowded decision and the typing lane into it, with tests | M | ready (the contract is decided, ADR-0031) | |
| PC-2 | The notice beat before making way (look toward the pointer or the predicted caret, ears up, about 0.4 s) and looking toward the user's attention while they type near the cat | S | done (a `notice` pose: ears up and forward, eyes a little wider, a bigger turn of the eyes and head toward the work, 0.4 s before the cat hops or walks away, skipped when it is already walking; the cat also looks toward the pointer or the predicted caret while the user works near it; the lane lead went from 1.5 to 1.9 s to pay for the beat; the author looked at a test build and said to commit) | |
| PC-3 | An event stream from Rust (typing started and stopped, a click, the monitor set changed), generalizing `focus-hint` | M | proposed | TE-13 |
| PC-4 | A sleeping cat wakes with its stretch and makes way when the user types right by it for several seconds (gap G5); the stretch was redrawn as a real play bow | S | done (checked in the real app and by the author) | |
| PC-5 | Rust `ground_at(points)`: the kind of thing at points under and around the cat (desktop, taskbar, app window, foreground), classification only, with a test | M | done (after 0.3.0, not released; no reaction uses it yet; 6 tests; on the real window: taskbar at the bottom row, a window mid-screen, 144 points in 4 to 6 ms) | |
| PC-6 | The ground map (a coarse grid of the same classification, taken only when about to move) and perches from it; replaces the window-list mechanism of TE-10a and TE-10b | M | needs Vinh (spec/08 section 9 item 3, with the L3 decision) | PC-5 |
| PC-7 | Ground change: the cat startles and falls when the window it stands on goes (the T5 decision) | M | done (not released; decided 2026-11-10: it startles, then falls; the first version waited for the bare desktop and never fired on a screen covered with windows, so the cat now tracks the window it stands on by an opaque handle; the reflex is the startle beat of RX-1; 7 tests for `groundwatch.ts`; the author tried it and said it was good; CPU A/B before a release is V-69) | PC-5, TE-7, RX-1 |
| PC-8 | The slow senses (the weekday, battery, lid open after an absence) in the same model (spec/03 lists them as not built) | M | later | |

## Suggested order (updated 2026-11-10)
The older order (PR-3, ME-3, the soak and so on) is done or overtaken; this is the order now.
1. **RX-1** (M): the beat runner and the `startle` beat, with PC-7 rebuilt on it. It fixes the flat fall the author saw and proves the shape of spec 09 on a real event. The author looks at a test build before the commit.
2. **RX-3a** (S), right after or together with RX-1: the words follow the body for the five reflexes that speak.
3. **LN-1, LN-2, LN-3** (S, M, M): the shuffle bag, escalation and tokens. They make the lines feel fresh without new text, and do not depend on RX-1, so they can run in parallel.
4. **RX-5** then **RX-6** (S each): the persona in layers, then "What Peak is told" in Settings.
5. **RX-2** (M): events and the choice of a beat, once RX-1 shows the format works; then **RX-8** and **RX-4**.
6. Needing Vinh: **LN-4** (a key for the line-factory script and readers), **LN-7** (top-up by the brain), **BR-2** (a Groq key), the PC-6 / L3 ground-map decision.
7. A release (0.3.1, carrying TE-16, PC-5 and whatever of the above is done) when the author orders it; it needs the CPU A/B and the release routine (ADR-0033).
8. Unchanged from before: Phase 4 checks (second machine, soak, real keys) and the alpha (E6).

## What was not verified
The sizes are estimates, not measured. Which stories matter most for retention is a hypothesis (H5, H6); the alpha is what can test it.

## E12. Reactions: one way to express what happens (spec/09, ADR-0041)
Why: reactions reach the screen by three separate paths (scripted line pools, poses chosen in the page, mood tags from the model), so every new situation is a new rule, and the first fall showed that a startle has a shape in time that nobody had written down. The spec replaces rules with data: **events** with an **appraisal** (five numbers), a small library of **beats** (short scripts of pose, time and words), and **line slots**; the model, when there is one, writes only the remark that follows, from small **reaction cards**. The persona prompt is split into layers and shown to the user.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| RX-0 | Spec 09: the model (event, appraisal, beat, words), the rules that hold for every reaction, the reaction cards, the persona layers, the decisions R1 to R4 | S | done (decisions answered, ADR-0041) | |
| RX-1 | `beats.ts`: the beat format and the runner on top of the rig (steps with pose, time and the moment the words begin), with tests; the `startle` beat as the first (freeze 150 ms, jolt, a cry 120 ms into it, hold, then the fall) and PC-7 rebuilt on it; the bubble got an exclaim style (bigger, bolder, a small jolt; off with reduced motion) | M | done (4 tests; the author tried a test build and said it was good; priority between beats and the per-event cool-down are still the fall's own 20 s: RX-8) | RX-0 |
| RX-2 | `events.ts` and `choose.ts`: the event list with appraisals, the pure selection of a beat from the appraisal and the situation, with tests (every event in range, deterministic for a seed) | M | blocked (RX-1) | RX-1 |
| RX-3a | `wordsAfter(pose, delay, words)`: the words follow the body for the five reflexes that speak (poke 150 ms, head scratch 200 ms, belly rub 500 ms, belly trap 250 ms, naming 200 ms); the words are dropped if the cat has left the pose | S | done (the delays are first guesses; the author tried a test build and said it was good) | RX-0 |
| RX-3 | Move the other existing reactions into beats when each is next touched: the notice beat (PC-2), huff, purr, happy, gasp, the mood reactions of ADR-0016 as appraisal presets (both ways work side by side until then); optionally an ears-up beat before an unprompted line | M | blocked (RX-2) | RX-2 |
| RX-4 | Line slots: group the pools as `event.slot` without changing any line id, add the lines for the new events in three languages, extend the parity test | S | blocked (RX-2) | RX-2 |
| RX-5 | The persona into layers (a locked core, the voice, modifiers) as short files, assembled by Rust to the same string as today for the same settings (a test proves it) | S | ready (independent of RX-1) | RX-0 |
| RX-6 | "What Peak is told": a read-only Settings page (Brain) showing the assembled prompt for the current settings, in three languages | S | blocked (RX-5) | RX-5 |
| RX-7 | Reaction cards and the model's remark after a reflex: the card format, loading only the matching cards, the prompt assembly, the caps and a Settings switch (R3 decided: event name and appraisal only, ADR-0041) | M | blocked (RX-2, RX-5) | RX-2, RX-5 |
| RX-8 | The reaction budget and priorities across all beats (spec/09 section 3) as one small module with tests | S | blocked (RX-1) | RX-1 |
| RX-9 | Editable voice with presets and the locked core untouched; later: loadable character packs (its own decision) | M | later (R2, R4) | RX-6 |

## E13. Fresh words: more variety in the scripted lines (spec/09 section 11)
Why: the author finds the scripted lines repetitive. The pools behind what users do most are the smallest (poke 13, scratch 12, belly 6, trap 5), the no-repeat memory is shared by all triggers and gives up when a pool is used up, and a line depends on nothing but tier, time band and tone. The offline cat is the only voice for users without a key.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| LN-0 | The analysis and the proposals (spec/09 section 11) | S | done (proposal, waiting for Vinh to choose) | |
| LN-1 | A shuffle bag per trigger kept on disk (every line once before any repeats), replacing the shared last-24 memory for choosing; tests | S | done (a bag per trigger and stage in `bags`, `bagAfter` in `selector.ts`; a new round starts with the last line already used so no line comes twice in a row; saved with the pet, old files parse with empty bags; the shared `recent` list is still kept but no longer decides) | |
| LN-2 | Escalation: repeated pokes, scratches and belly rubs within a short time move through stages with their own lines; a counter in memory, not saved | M | done (`escalation.ts`: stage 2 from the 4th, 3 from the 7th, 4 from the 10th, a run ends after 25 s (pokes) or 40 s (scratches, rubs); 27 new lines per language, also in the gentle tone; checked on the real window: 14 pokes climbed through the stages and the bags were saved; not yet judged by use) | LN-1 |
| LN-3 | Tokens in lines ({name}, {time}, {weekday}, {pokes}; a line is eligible only when its value is known) with tests across the three languages | M | done (10 new token lines per language: greeting, return, morning, night, idle; `fill` capitalises a value at the start of a line; the streak, work time and own favourite spot are not tokens yet) | |
| LN-4 | The line factory: an author-run script that drafts candidates with a model, filters duplicates and unwanted patterns, and leaves the choice to the author and to native readers | M | needs Vinh (a key for the script, and who reads Vietnamese and Japanese) | |
| LN-5 | Pool targets by frequency (poke 40, scratch 30, belly 20, trap 15, hints 12, greeting 12 per tier, return 20) and the lines to reach them in three languages, with a test that fails under target | L, split by trigger | blocked (LN-4 or hand writing) | LN-4 |
| LN-6 | Rare lines (about 1 in 100, once a week) and callbacks that remember what Peak joked about | S | blocked (LN-3) | LN-3 |
| LN-7 | Top-up by the connected brain: once a day, a few new lines for the least varied triggers from the trigger name, the tone and the persona only, kept on the machine and marked as generated | M | needs Vinh (spends the user's key; machine-written lines without review) | LN-1, RX-7 |
| LN-8 | A repetition report: distinct lines a typical week would show per trigger, and the triggers under target | S | ready | |

## E11. Reach: languages and brains (ADR-0037, ADR-0038)
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| BR-1 | Groq as the fourth brain, offered right after Gemini, with a free-tier tag: the Rust client over the OpenAI client (`groq.rs`), the provider list and keys, the model-name rule, the strings in two languages, 7 tests | M | done (released in 0.3.0; not tried with a real key: verification-debt) | |
| BR-2 | Try the Groq brain with a real key: connect, chat, the 429 texts, the default model, `reasoning_effort`, Peak's voice | S | blocked (a key; free to get) | BR-1 |
| JA-1 | Japanese interface: Settings, the tour, bubbles, buttons, errors (the UI table), the language setting with the third value and `ja` detection, the beta label | M | done (the UI table, the language setting with `ja` detection, the beta label, the document language, the prompts) | |
| JA-2 | Japanese lines: the whole pool of scripted lines in the warm casual voice, with the tests that the pools match across the languages | L | done (182 lines translated one to one, the casual voice checked by a test; not read by a native speaker) | JA-1 |
| JA-3 | Japanese memory lines and the prompts to the brain (the persona, the greeting, the fact extractor) | M | done (the memory lines, `knownFor` and the Rust prompts with the Japanese voice rule) | JA-1 |
