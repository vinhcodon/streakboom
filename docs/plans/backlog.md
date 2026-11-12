# Backlog: epics and user stories (from the five qualities assessment)

Status: **proposed 2026-11-08, asked by Vinh to be carried out story by story.** It turns [`pet-qualities-assessment.md`](pet-qualities-assessment.md) into work and sits next to the phases of [`roadmap.md`](roadmap.md): the roadmap says *when* (Phase 3 real keys, Phase 4 readiness, Phase 5 alpha); this file says *what, in pieces*. Epics E1 to E5 are the five qualities, E6 is measuring the north star and running the alpha, E7 is verification and release.

## How we work with it
1. **Size.** S = up to half a day, M = one to two days, L = more than two days (an L must be split before it starts).
2. **After every story** (this is the standing rule): set its status here, update the progress table, compare with the roadmap phase it belongs to, and propose the next two or three stories of size S or M with the reason for the order.
3. **A story that says "Needs Vinh"** is a decision: I put the options to Vinh as a multiple choice and write an ADR before any code. Other stories can start as soon as their dependencies are done.
4. **Done means:** tests for the pure logic, the spec and README updated in the same commit, the engineering-log entry saying what was **not** verified **and the same items added to [`verification-debt.md`](verification-debt.md)** (the one list of everything built but not yet checked; tick or remove a row when it is checked), explicit-path commit (ADR-0023). Behavior the website describes also gets the website session told (README, Release and auto-update, step 1). A release is a separate step the author orders.
5. Statuses: `done`, `doing`, `ready` (can start), `needs Vinh` (a decision or an action only Vinh can do), `blocked` (waits for something named), `later`.

## Progress (2026-11-12, version 0.4.1; counts exclude stories merged into others)

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
| E9 | The desktop as terrain | 10 / 18 | Spec 07 and ADR-0030; the Rust `monitors_info` and `move_to`, the lane (TE-12, TE-13), hops and falls (TE-7, TE-15), the hop out of the typing lane (TE-14) and the perches (TE-10) are built; the cost field (TE-1, TE-4 to TE-6, TE-8) is unbuilt and its place was taken in part by E14 |
| E10 | Perception | 8 / 9 | Spec 08 and ADR-0031, ADR-0045: PC-1 to PC-7 built (the belief, the percept events, the ground map, the ground watch and the fall); the slow senses (PC-8) later |
| E15 | Restraint, play and the charter (spec/11, ADR-0047) | 6 / 6 | The charter, the edge check and the attention modes, the edge ladder, the person's push and drop, and the retirement of Chattiness and Quiet hours are built and committed (CH-1 to CH-6; the shoo was declined); **released in 0.3.2** |
| E16 | The sticker test on Zalo (spec/06 section 7, plan `sticker-test.md`, ADR-0049) | 2 / 8 | Decisions answered 2026-11-10 (name, wording, expressions, 12 to 20 stickers, threshold); the public Zalo rules read; ST-2 (the character sheet) approved; next: the account-only checks (ST-1) and drawing the stickers (ST-3); no app code |
| E14 | The desktop as terrain, version 2 (spec/10) | 7 / 16 | Spec 10, ADR-0044, ADR-0045, ADR-0046: the ground map with window numbers, the overlay, the fall to the plane below, walls, climbing and the climb pose, getting out from under the Start menu (TT-0 to TT-3 partly, TT-9, TT-12, TT-14, TT-15) are built and **released in 0.3.2**; knocks (TT-13), the screen picture sense (TT-10) and content surfaces (TT-11) are next in that track |
| E17 | Foundation alignment (spec/12, ADR-0056 to ADR-0059, ADR-0061) | 11 / 11, released in 0.4.0 | The review, the decisions (Q1 to Q9), spec 12 and the release: absence costs nothing, no streak, the bored lines, the persona rules, the help text, 18+, the outward lines, the claim-word audit. Open: a lawyer for the age gate, the Vietnamese and Japanese reading, the chat rules with real keys on all four brains |
| E18 | Language and one instance (ADR-0066, ADR-0068, ADR-0055 amendment) | 3 / 3, released in 0.4.1 | The tray menu in the chosen language; the default language from the system's list of preferred languages and a picker in the tour (never the IP); one Peak per user. Open: the author's checks (V-108 to V-110) and the in-app update to 0.4.1 |
| E19 | Alpha readiness and signing (roadmap v2, ADR-0071, ADR-0072) | 2 / 13 | The signed installer, the guardrail counters, the tester consent text, a strict CSP; the checks themselves are in E6 (ME-1 to ME-4), E7 (VE-2, VE-3, VE-8), E5 (PF-3), E1 (PR-8) and E3 (PE-1, PE-4) |
| E13 | Fresh words: more variety in the scripted lines | 6 / 9 | Lines more varied: the shuffle bag, tokens, the smallest pools raised (LN-1 to LN-3, LN-5 partly, 0.3.1); the line factory script is built and waits for the author to run it (LN-4); rare lines blocked; the brain's top-up declined for now |
| E12 | Reactions: one way to express what happens | 10 / 11 | Spec 09 and ADR-0041: events, appraisal, beats, words after the body, escalation, the persona in layers, the remark after a fall (RX-1 to RX-8; the first part released in 0.3.1, the remark and the gate not yet); RX-9 later |
| E11 | Reach: languages and brains | 4 / 5 | Groq is the fourth brain and Japanese is built in full, both released in 0.3.0 (BR-1, JA-1 to JA-3, ADR-0037, ADR-0038); BR-2 needs a key |

Released in 0.3.2 (2026-11-11), published on GitHub with the tag on the release commit: the edge check and the three attention modes, the ground map on by default and the terrain from window regions, perches by hop or by climbing, the fall to the plane below, getting out from under the Start menu and Search, the person's push and drop, Chattiness and Quiet hours retired, the percept events and belief, and the remark after a reaction. **Not yet checked** (all in `verification-debt.md`): other machines, Windows 11, several monitors, the in-app update to 0.3.2, a quiet-machine CPU run.

Against the roadmap (version 2, `roadmap.md`, 2026-11-12): **R0** (close what is open: V-108 to V-111, the first CI run) and **R1** (the signing certificate, DS-1) start now; **R2** (make it checkable: ME-1 to ME-4, GR-1, AL-1, AL-2, PE-1) can run in parallel; **R3** (ready to be watched: VE-2, VE-3, VE-8, PF-3, PR-8, PE-4, V-104) follows; **R4** is the closed alpha. Stories outside that path wait, except small fixes. Everything built but not yet checked is in [`verification-debt.md`](verification-debt.md).

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
| TE-14 | Wire the lane into making way: leave the band by a vertical hop; measure the CPU of the hop first | M | done (the cat hops out of the typing lane; the author typed on a test build and said the timing was right on the second try; see the engineering log; README privacy text added; released in 0.2.5) | TE-7, TE-12, TE-13 |
| TE-15 | Lighter hops: find what a hop costs (about 0.5 core-seconds each, near a whole core while it flies) and cut it: the Rust `Moved` handler runs on every `move_to` (bubble placement and a dirty flag), the rig repaints at full speed, the move rate is 60 a second; try 30 a second and a lighter handler, then look again; also the hop **frequency** (the author's test session had 15 lane hops in about 2 minutes, a 6 s cool-down: consider 10 to 12 s); the author looks at the result | S | done (a flight is played by a Rust thread from one path; the cat is painted at 30 frames a second in the air and for 0.7 s after; the lane cool-down is 10 s, the author's choice; a hop went from about 0.91 to about 0.34 core-seconds; the author said it is smooth; engineering log) | TE-7 |
| TE-16 | The lane's false triggers and the look of the hop: Peak dropped by itself when nothing was happening near it (any input counted as typing, a click's lane lived 60 s, the side with more room was often below). Fixed: crowded only while typing now with a still pointer; up first; a 0.14 s crouch before a hop (2 tests; the author tried a test build and said it was fixed) | S | done (released in 0.3.1) | TE-14 |
| TE-10a | L3: Rust windows snapshot (visible, non-minimized, non-cloaked, non-own, extended frame bounds, z-order, maximized flag) behind a Settings switch | M | replaced by PC-6 (the ground map; ADR-0043: no window list) | |
| TE-10b | L3: perches and walls in the terrain (visible parts only, headroom, stable for half a second) | M | replaced by PC-6 and `perch.ts` (ledges from the map with two rows of headroom; walls and stability over time are not built) | PC-6 |
| TE-10c | L3: jump up to a perch, sit, nap, watch | M | done (`perch.ts`, 4 tests; `perchNow` in the idle chooser: about 3% of the idle choices, at most every 5 minutes, only when calm and only if the ground map is switched on; the cat looks at the ledge, crouches, hops; the grid is coarse, so the real top edge is found by asking a few pixels at a time; it then stays up for 3 minutes, only looking around and dozing; **seen on a real window** on 2026-11-10 with a stand-in desktop window of ours: it found 3 ledges, hopped 274 px up and 96 across onto the window, landed with its feet on the real edge (641 against the cell's 687), slept there, and when the window was closed it startled out of its sleep and fell 389 px to the floor) | PC-6, TE-7 |
| TE-10d | L3: fall to the surface below when the perch disappears or moves | M | done for the fall (the ground watch of PC-7 tracks the window the cat stands on, so closing, minimizing or dragging it away makes the cat startle and fall); it falls to the bottom of the work area, not to the surface below it (not built) | PC-7 |
| TE-11 | L4: learned places (welcome by dragging, unwelcome by pushing away) in Settings with Forget; this is PL-2 to PL-5 on the terrain model | M | blocked (TE-6) | TE-6 |

## E10. Perception: what Peak can sense around it and below it (spec/08, a brainstorm draft; decisions in its section 9 are Vinh's)
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PC-0 | Spec 08: the senses, belief and reaction model, the ground ("below") sensing, the notice beat, the gaps found | S | done (draft) | |
| PC-1 | `perception.ts`: the Percept and Belief types, confidence and hysteresis; move the crowded decision and the typing lane into it, with tests | M | done (the belief with the confidence of a fact against a guess; the lane guess holds for 450 ms before it counts as sure, by time and not by a count of probes (a first version counted probes and the hop followed the reflex after 21 ms); a guess first shows the notice reflex and the hop follows; the pointer next to the cat acts at once; 5 tests; checked on the real window with synthetic typing on a test box: reflex at once, the hop 516 ms later) | |
| PC-2 | The notice beat before making way (look toward the pointer or the predicted caret, ears up, about 0.4 s) and looking toward the user's attention while they type near the cat | S | done (a `notice` pose: ears up and forward, eyes a little wider, a bigger turn of the eyes and head toward the work, 0.4 s before the cat hops or walks away, skipped when it is already walking; the cat also looks toward the pointer or the predicted caret while the user works near it; the lane lead went from 1.5 to 1.9 s to pay for the beat; the author looked at a test build and said to commit) | |
| PC-3 | An event stream from Rust (typing started and stopped, a click, the monitor set changed), generalizing `focus-hint` | M | done (the thread emits `percept` events: `activity` with hysteresis, `click` without a position, `monitors`; the page keeps them in the trail, drops its ground and map beliefs when the monitors change and probes at once when the user starts working; 2 Rust tests; checked on the real window: a small mouse move gave activity on, 3.2 s of stillness gave activity off, a click on a test box gave click then activity on; the monitors event was not tried) | TE-13 |
| PC-4 | A sleeping cat wakes with its stretch and makes way when the user types right by it for several seconds (gap G5); the stretch was redrawn as a real play bow | S | done (checked in the real app and by the author) | |
| PC-5 | Rust `ground_at(points)`: the kind of thing at points under and around the cat (desktop, taskbar, app window, foreground), classification only, with a test | M | done (released in 0.3.1; no reaction uses it yet; 6 tests; on the real window: taskbar at the bottom row, a window mid-screen, 144 points in 4 to 6 ms) | |
| PC-6 | The ground map (a coarse grid of the same classification, taken only when about to move) and perches from it; replaces the window-list mechanism of TE-10a and TE-10b | M | done for the sensing (allowed 2026-11-10, ADR-0043: in memory only, off by default, a checkbox in Settings, Privacy; Rust `ground_map`, `groundmap.ts` with `ledges` and `desktopShare`, 4 tests; nothing moves Peak to a ledge yet: that is TE-10c and TE-10d) | PC-5 |
| PC-7 | Ground change: the cat startles and falls when the window it stands on goes (the T5 decision) | M | done (released in 0.3.1; decided 2026-11-10: it startles, then falls; the first version waited for the bare desktop and never fired on a screen covered with windows, so the cat now tracks the window it stands on by an opaque handle; the reflex is the startle beat of RX-1; 7 tests for `groundwatch.ts`; the author tried it and said it was good; CPU A/B before a release is V-69) | PC-5, TE-7, RX-1 |
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
| RX-2 | `events.ts` and `choose.ts`: the event list with appraisals, the pure selection of a beat from the appraisal, with tests (every event in range, deterministic) | M | done (6 events, 10 beats with home points, nearest-beat choice; 7 tests in `beats.test.ts`; the choice reproduces the old poses and delays exactly; no priority between beats yet: RX-8) | RX-1 |
| RX-3a | `wordsAfter(pose, delay, words)`: the words follow the body for the five reflexes that speak (poke 150 ms, head scratch 200 ms, belly rub 500 ms, belly trap 250 ms, naming 200 ms); the words are dropped if the cat has left the pose | S | done (the delays are first guesses; the author tried a test build and said it was good) | RX-0 |
| RX-3 | Move the other existing reactions into beats: the notice beat (PC-2), the mood reactions of ADR-0016 as appraisal presets | M | done (the chat and unprompted-line reactions use `moodBeat`, the lead-in is the `NOTICE` beat; a test shows the poses are the ones `moodPose` gave; `moodPose` stays in `sprites.ts` for the test; the ears-up beat before an unprompted line was not made) | RX-2 |
| RX-4 | Line slots: group the pools as `event.slot` without changing any line id, add the lines for the new events in three languages, extend the parity test | S | done (each event names its pool; a test checks the pool exists in the three languages and has stage lines where the event repeats; the ids did not change; the `fall` cries were added with PC-7) | RX-2 |
| RX-5 | The persona into layers (a locked core, the voice, modifiers) as short files, assembled by Rust to the same string as today for the same settings (a test proves it) | S | done (eight files in `app/src-tauri/persona/` with a README; `persona_layers` returns the layers with a locked flag for the page of RX-6; a fingerprint over every language, tier and tone proved the words are unchanged; a stray run of spaces in the Japanese-voice sentence and the mood rule is gone; 2 Rust tests; not yet in an installed build, which behaves the same) | RX-0 |
| RX-6 | "What Peak is told": a read-only Settings page (Brain) showing the assembled prompt for the current settings, in three languages | S | done (a section at the end of the Brain page with a show/hide button, the layers with readable names and a lock mark; `persona_preview` in Rust; checked on the real Settings window in Vietnamese; the known facts are not shown here, they are on the Memory page) | RX-5 |
| RX-7 | Reaction cards and the model's remark after a reflex: the card format, loading only the matching cards, the prompt assembly, the caps and a Settings switch (R3 decided: event name and appraisal only, ADR-0041, ADR-0043) | M | done (one card, `ground_lost`; `brain_chat` takes an `event`; the remark follows the fall, counts toward the cap of unprompted lines, needs the checkbox in Settings, Brain, on by default; 1 Rust test; the real call to the brain was not tried, see verification-debt) | RX-2, RX-5 |
| RX-8 | The reaction budget and priorities across all beats (spec/09 section 3) as one small module with tests | S | done (`reactions.ts`: priority from surprise and arousal, one at a time, automatic ones with a cool-down, a 3 s gap and 4 a minute; the fall goes through it; 6 tests) | RX-1 |
| RX-9 | Editable voice with presets and the locked core untouched; later: loadable character packs (its own decision) | M | later (R2, R4) | RX-6 |

## E14. The desktop as terrain, version 2 (spec/10, a draft for Vinh's approval)
Why: the perches of TE-10c need bare desktop above a window, which a full-screen window makes impossible; and the tests hid the cat under our own always-on-top windows. The model: surfaces and costs from **regions with identity** (a boundary between two windows is an edge, the frame of the screen and the taskbar are terrain, taught places and props carry the cat where nothing else exists); and a **developer overlay** that draws what Peak believes, so that nothing is built or tested blind again.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| TT-0 | Spec 10: the problem, the principle, the sources of terrain, the shapes, the rules, the decisions T1 to T4 | S | done (draft, waiting for Vinh) | |
| TT-1 | The developer overlay: a click-through window over the screen, never in a release build (a cargo feature `terrain-overlay`; a tray item "Terrain overlay (dev)" and `window.__pet.overlay()`), drawing the grid, a colour per window, the surfaces (green where the cat has room, gray where not), the cat's feet and the ledge it would choose | M | done (seen on the real screen: the grid coloured by the opaque window numbers, a green line on the top edge of a test window, the target circled; two bugs on the way: creating a window from a synchronous command blocks on Windows, and a window without the same WebView2 arguments as the others fails with 0x8007139F) | TT-0 |
| TT-2 | `ground_map` returns a region number per cell (from `window_id_at`), with tests on synthetic maps | S | done (`ids` per cell; `regionAt`, `ledges` by region boundary, `headroomClear`; tests on a screen with a full-screen window and a dialog in front) | TT-0 |
| TT-3 | `terrain.ts`: surfaces (ledge, wall, step) from region boundaries, their extent, stability over probes, the headroom rule, with tests | M | partly done (ledges as runs with their extent and room, `surfaceBelow`; 6 tests; walls and steps, and the stability over probes, are in TT-12) | TT-2 |
| TT-4 | The frame and the taskbar as terrain (floor, walls, corners, peeking at an edge) from the monitor geometry | S | blocked (TT-3) | TT-3 |
| TT-5 | The surface graph and the choice by cost (hop up, hop down, walk along kept inside the surface); `perch.ts` becomes a consumer | M | blocked (TT-3, TE-6) | TT-3 |
| TT-6 | Moving platforms: a perched window that is dragged carries the cat, a closed one drops it (PC-7 already drops it) | M | blocked (TT-3) | TT-3 |
| TT-7 | Props: a cardboard box and a cushion drawn under the cat as the place that works anywhere (art, a rig change) | M | later (the author declined for now, ADR-0044 T3) | TT-5 |
| TT-8 | Taught places (spec/07 L4, TE-11): where the user drops Peak and leaves it becomes a favourite spot, with Forget in Settings | M | needs Vinh (consent text) | TT-5 |
| TT-9 | The ground map switch on by default, the README and the website text | S | done (on by default; the README and the Settings text in three languages; the website session is told at the next release) | |
| TT-10 | The screen picture sense: a low-resolution grayscale picture of the screen in memory, turned into blocks (text-like, boxes, pictures, empty space) with a stability filter; opt-in, off by default; its own README, Settings and website text (spec/10 section 12) | L, split | ready, last in the order (decided 2026-11-10, ADR-0045) | TT-1 |
| TT-11 | Content surfaces: the top edges of blocks as ledges, their sides as walls, and the rule that the cat sits in empty space | M | blocked (TT-10, TT-3) | TT-10 |
| TT-12 | Walls and vertical movement: `terrain.ts` gives walls (`wallFor`: the side of the window under a ledge, with the ledge's width) and a "surface below x" query; climb, mantle, cling; the fall of PC-7 lands on the plane below instead of the floor | M | done (committed 48a2af1; seen on a stand-in desktop: it walked to the wall, climbed 223 px, pulled up onto the ledge, and later climbed down to the floor; the wall's real x is found by asking `ground_at` a few px at a time; falls to the plane below are done; knocks are TT-13) | TT-3 |
| TT-13 | Knocks: a window moved or resized into the cat or closed under a wall it clings to knocks it off (a fall to the plane below), told apart from the user carrying it | M | ready (TT-12 is done; the person's own push is CH-5, this is the world's knock) | TT-12 |
| TT-14 | The climb pose and cycle (a rig change; the author looks at a test build first) | M | done (the author looked at it on the test build on 2026-11-10 and said it was fine; committed 48a2af1; poses `climb` and `cling` on a new side key `CLIMB_S`: body upright and leaning to the wall, belly on it, head up, paws reaching, tail hanging; the legs alternate with the walk machinery; the mantle is a hop without a crouch) | TT-12 |
| TT-15 | Get out from under what covers the cat (the Start menu, Search; ADR-0046): `cover_probe` in Rust (a hit test at points, with the stacking order to tell a cover from a window below Peak), `escape.ts` (places nearest first), the hop out in the page | S | done (seen on the real screen: Start, out by 400 px; Search, out by 560 px) | |

## E13. Fresh words: more variety in the scripted lines (spec/09 section 11)
Why: the author finds the scripted lines repetitive. The pools behind what users do most are the smallest (poke 13, scratch 12, belly 6, trap 5), the no-repeat memory is shared by all triggers and gives up when a pool is used up, and a line depends on nothing but tier, time band and tone. The offline cat is the only voice for users without a key.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| LN-0 | The analysis and the proposals (spec/09 section 11) | S | done (proposal, waiting for Vinh to choose) | |
| LN-1 | A shuffle bag per trigger kept on disk (every line once before any repeats), replacing the shared last-24 memory for choosing; tests | S | done (a bag per trigger and stage in `bags`, `bagAfter` in `selector.ts`; a new round starts with the last line already used so no line comes twice in a row; saved with the pet, old files parse with empty bags; the shared `recent` list is still kept but no longer decides) | |
| LN-2 | Escalation: repeated pokes, scratches and belly rubs within a short time move through stages with their own lines; a counter in memory, not saved | M | done (`escalation.ts`: stage 2 from the 4th, 3 from the 7th, 4 from the 10th, a run ends after 25 s (pokes) or 40 s (scratches, rubs); 27 new lines per language, also in the gentle tone; checked on the real window: 14 pokes climbed through the stages and the bags were saved; not yet judged by use) | LN-1 |
| LN-3 | Tokens in lines ({name}, {time}, {weekday}, {pokes}; a line is eligible only when its value is known) with tests across the three languages | M | done (10 new token lines per language: greeting, return, morning, night, idle; `fill` capitalises a value at the start of a line; the streak, work time and own favourite spot are not tokens yet) | |
| LN-4 | The line factory: an author-run script that drafts candidates with a model, filters duplicates and unwanted patterns, and leaves the choice to the author and to native readers | M | built, not yet run (`scripts/line-factory.mjs` and `linefactory.ts`, 7 tests; decided 2026-11-10: with the author's Gemini key from the Credential Manager, never in chat; the author runs it from his own terminal; then Claude adds the chosen lines; see the usage at the top of the script) | |
| LN-5 | Pool targets by frequency and the lines to reach them in three languages | L, split by trigger | partly done (48 plain lines per language for the smallest pools: idle 15, poke 10, greeting 6, how 5, belly 4, pet 3, return 3, huff 2; the report went from 6 triggers under the limit to 2, idle and poke by a small margin; written by Claude, not yet read by a native speaker of Japanese or English; the targets of the spec (poke 40, scratch 30 and so on) are not reached) | LN-4 |
| LN-6 | Rare lines (about 1 in 100, once a week) and callbacks that remember what Peak joked about | S | blocked (LN-3) | LN-3 |
| LN-7 | Top-up by the connected brain: once a day, a few new lines for the least varied triggers from the trigger name, the tone and the persona only, kept on the machine and marked as generated | M | declined for now (ADR-0043; revisit after LN-4 shows how good machine-drafted lines are) | LN-1, RX-7 |
| LN-8 | A repetition report: distinct lines a typical week would show per trigger, and the triggers under target | S | done (`linereport.ts`, `scripts/line-report.mjs`, 4 tests; the weekly uses are guesses; first run: 6 of 15 triggers under the limit, about 31 lines per language to add, idle and poke first) | |

## E11. Reach: languages and brains (ADR-0037, ADR-0038)
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| BR-1 | Groq as the fourth brain, offered right after Gemini, with a free-tier tag: the Rust client over the OpenAI client (`groq.rs`), the provider list and keys, the model-name rule, the strings in two languages, 7 tests | M | done (released in 0.3.0; not tried with a real key: verification-debt) | |
| BR-2 | Try the Groq brain with a real key: connect, chat, the 429 texts, the default model, `reasoning_effort`, Peak's voice | S | blocked (a key; free to get) | BR-1 |
| JA-1 | Japanese interface: Settings, the tour, bubbles, buttons, errors (the UI table), the language setting with the third value and `ja` detection, the beta label | M | done (the UI table, the language setting with `ja` detection, the beta label, the document language, the prompts) | |
| JA-2 | Japanese lines: the whole pool of scripted lines in the warm casual voice, with the tests that the pools match across the languages | L | done (182 lines translated one to one, the casual voice checked by a test; not read by a native speaker) | JA-1 |
| JA-3 | Japanese memory lines and the prompts to the brain (the persona, the greeting, the fact extractor) | M | done (the memory lines, `knownFor` and the Rust prompts with the Japanese voice rule) | JA-1 |

## E15. Restraint, play and the charter (spec/11, ADR-0047)
Why: the author asked for rare, strong falls, slow actions first, no distraction of someone who is working, and a way for Peak to tell work from play without a settings page. The charter ranks the principles; the modes and the tempo ladder are how they show up in behaviour; the audit (spec 11 section 6) lists what is wrong today.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| CH-1 | The charter (`docs/charter.md`), ADR-0047, the audit; later the README promise in plain words (articles 1 to 4) at the next release | S | done (charter, ADR and audit written and committed a48f1c7; the README line comes with the next release, ADR-0033) | |
| CH-2 | The edge check: a cat that reaches the end of a surface stops, peeks if it can, and never walks into the air (fixes the walk off a perch); a perch by hop gets a way down | S | done (a seat is remembered, the ends of its run of the edge; on it the cat never walks past them: the walk is checked every 0.2 s and stops 44 px short, a walk starts toward the side with room, with no room it only looks around; a seat reached by a hop is left by a hop down, one hop up at most; seen on the real screen: 80 s of walks on the stand-in ledge, feet 1606 to 1841 inside the ledge 1580 to 1900) | |
| CH-3 | The attention mode (Work, Free, Play) as pure logic with tests and the debugger; the tempo tier on every action; Free starts after about 45 to 60 s without input; lines wait for Free or follow a touch; in Work a lost seat is a silent jolt and fall, no cry | M | done (`attention.ts`: the mode, its thresholds and `mayAct`, 5 tests; a touch (poke, stroke, rub, drag, chat) is play for 2 minutes, 20 s of work away from the cat ends it; Free needs 45 s of no input; a walk, a perch and an unprompted line wait for free or play; a lost seat is a silent jolt and fall in Work, no cry and no remark; the mode is shown by `__pet.mode()`; the tier is a rule in `mayAct`, not yet a label on every action) | |
| CH-4 | The edge ladder: poses `peek` and `sit at the edge` (a rig change, the author looks first) and climbing down at the end of a surface | M | done (the author looked and committed it, ee6253d; poses `peek` and `ledge` on new side keys `PEEK_S` and `LEDGE_S`: crouched low with the head down over the edge, and sitting with the front paws over it; the ladder `atEdge`: the walk stops at the end of a seat, 0.5 s, peeks 2.6 s, then half the time turns back, 35% sits at the edge for up to 30 s, 15% climbs down early when it came up a wall; now and then (a quarter of the calm moments) it walks to the edge on purpose; seen on the real screen on the stand-in ledge: idle > peek > idle, and peek > cling > climb > land; the seat is still watched while it peeks or sits, so a lost seat still startles it) | CH-2 |
| CH-5 | The person's push: a drop in the air and a flick at an edge, the teeter and the fall, wariness and the bruise after a fall | M | done (committed 01e1592 after the author's looks and two redraws; `push.ts`, 5 tests; the pose `teeter`, the body rocks about its feet; a poke on the side of the cat toward which it would be pushed, when the cat sits within 100 px of the end of its seat, is a push: teeter 1.1 s, then 4 in 5 times a recovery (a flinch, `huff`), else it is knocked off and falls to the plane below with a little sideways drift; after a fall of 120 px or more it is wary for 10 minutes (no walks to the edge, a push only teeters); **letting go of a dragged cat in the air makes it fall** (90 px or more above the floor and not on a ledge) and on a ledge it keeps the ledge as its seat; also fixed: the fall to the plane below took the ledge it stood on for the plane below, and the real edge scan now covers half a cell each way; seen on the real screen: teeter, recover; teeter, fall 388 px; drop from mid-air fell 523 px; drop near the floor stayed) | CH-3, CH-4 |
| CH-6 | The settings that are amounts retired: Chattiness and Quiet hours are gone from Settings, the state and the export (`freq`); unprompted lines come every 10 to 15 minutes only in free or play, never while the person works; the night is 23:00 to 07:00 by the clock (sleepy, silent: `isNight`); a person who had chosen Quiet is hushed once and for good (`PetData.hush`); the shoo was declined | M | done (answers of 2026-11-11; 245 tests, among them the migration; the three languages' strings removed; not tried on a machine with an old saved state) | CH-3 |


## E17. Foundation alignment (spec/12, plan `release-0.4.0.md`, ADR-0056 to ADR-0059)
Why: the foundation (the evidence home, ADR-0058) names the mechanisms that make a companion harmful: a character with needs, a streak, guilt at leaving. The review (`foundation-review.md`) found two of them in the code. Serves charter article 1 (trust first) and article 7 as changed by ADR-0059.

| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| FA-1 | Absence costs nothing: no decay of mood or closeness, no lonely band, the away and "missed you" lines replaced; the charter's article 7 and the README sentence | M | built 2026-11-11 on the branch (tests: no fall of mood or closeness for 0 to 400 days away; no line matches the banned patterns in three languages); **the author has not yet read the Vietnamese lines or seen a test build** (V-103) | |
| FA-2 | No streak: the state, the memory (also the longest absence), the lines at 3, 7 and 30 days, "Longest streak" in Settings, the +3 for opening the app; `active_d3` and `active_d7` from days together | M | built 2026-11-11 on the branch (tests: days in a row and days with gaps give the same state; old files load without the fields) | |
| FA-3 | The bored lines no longer ask the person for attention (Q9) | S | built 2026-11-11 on the branch (the same banned-pattern test) | FA-1 |
| FA-4 | Persona: goodbye, crisis and outward sentences in the locked core; "well-being" and "close friends" reworded | S | built 2026-11-11 on the branch (a Rust test: every language, tier and tone carries the three sentences; the fingerprint changed once); **not tried with a real key on any brain** (V-104) | |
| FA-5 | The help card in Settings, About, three languages | S | built 2026-11-11 on the branch (no phone number, one public directory named); the texts and the directory are not checked by the author or a lawyer (V-104) | |
| FA-6 | 18+: the tour line, the Brain page line, README | S | built 2026-11-11 on the branch (the installer description left as it is); whether a statement is enough waits for the lawyer | |
| FA-7 | Three outward lines per language | S | built 2026-11-11 on the branch (263 lines per language) | |
| FA-8 | The README promises and the mission, the count of lines, the prompt for the website session (the site still says "a little lonely" and 267 lines) | S | done on the branch 2026-11-11 for the README and the charter; **the website is not told yet: it is told by the release prompt, and the site build fails on this branch until it follows** (`release-0.4.0.md`) | FA-7 |
| FA-9 | `audit-docs` checks the banned claim words | S | done 2026-11-11 (a planted "Peak heals stress" in the README fails the audit; a line that denies a claim is allowed; the site is only reported) | |
| FA-10 | The two data checks (the uninstaller, the Gemini free tier) and their sentences | S | done 2026-11-11: the Gemini terms were opened and the app already says it; the README says how to remove everything; a real uninstall was not tried (V-105) | |
| FA-11 | Hypotheses H1, H4, H5, H6 read against the foundation, with a counter-measure; the old roadmap marked out of date | S | done 2026-11-11 | |

## E18. Language and one instance (0.4.1)
Why: the author found a tray menu that was always English, asked how the default language should be chosen, and found that every click on the program started another Peak. Serves charter articles 1 and 2.

| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| LG-1 | The tray menu follows the chosen language (`set_tray_labels`) | S | done, released in 0.4.1 (ADR-0055 amendment); not seen by the author (V-108) | |
| LG-2 | The default language: the system's ordered list of preferred languages, a picker on the first tour card, never the IP (ADR-0066); the website suggestion is the website session's (ADR-0067) | S | done, released in 0.4.1; not seen by the author (V-109) | |
| SI-1 | One Peak per user: a second start does not open a second pet and shows the running one if it was hidden (ADR-0068) | S | done, released in 0.4.1; three starts left one process, an older build left three (V-110) | |

## E19. Alpha readiness (roadmap v2, `roadmap.md`, ADR-0071)
Why: the closed alpha is the next real gate (roadmap R4). This epic holds the stories that were not in the backlog; the checks that the alpha also needs are already in E1, E3, E5, E6 and E7 and are named in `roadmap.md` (R2 and R3).

| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| CP-1 | `CODE_SIGNING.md` (the code signing policy: the official repository, what is signed, that only the CI workflow signs, roles, approval, key custody, the plain description of the program's network use and of the Win32 calls it makes, the privacy link, honest wording about the status) and a short README section | S | done 2026-11-12 (`CODE_SIGNING.md`, a README section; honest about the status: nothing is signed yet; the website part is CP-2) | |
| CP-3 | List the licenses of the Rust and npm dependencies to be sure none is proprietary (a SignPath condition) | S | done 2026-11-12 (`docs/dependency-licenses.md`: 303 Rust packages, 61 npm packages, nothing proprietary; MPL-2.0 x5 and CDLA-Permissive-2.0 x2 to explain) | |
| CP-4 | Ship a `THIRD-PARTY-NOTICES` file (generated in the build) in the installer and the repository: MIT, Apache-2.0 and BSD ask that their notices travel with a binary; not a SignPath condition but a duty (`dependency-licenses.md`) | S | ready | CP-3 |
| CI-1 | `.github/workflows/release.yml`: on a version tag, checks, tests, the NSIS installer built on a GitHub-hosted runner without the updater key, uploaded as an artifact, a draft release; a first run by hand; the signing step is added after approval (SP-1) | M | built 2026-11-12 (`.github/workflows/release.yml`, `scripts/ci-release-prepare.ps1`, tests in `test-release-lib.ps1`); **never run on GitHub**: needs a rehearsal run by hand, which the author must allow | |
| CI-2 | `scripts/release-finish.ps1`: download the draft release's installer, check its signature when signing is on, sign it with the updater key, write `latest.json`, publish, push the manifest, prune; reusing `release.ps1` and `release-lib.ps1`; `release.ps1` stays as the fallback | M | blocked (CI-1) | CI-1 |
| CI-3 | Two real releases built by CI and finished with CI-2 (each ordered by the author) | M | blocked (CI-2) | CI-2 |
| CP-2 | A note to the website session: the "Code signing policy" section on the home and download pages (honest wording until approval) and the privacy link | S | blocked (CP-1) | CP-1 |
| AP-1 | Apply to SignPath Foundation (<https://signpath.org/apply>) with the evidence of reputation; the author confirms GitHub 2FA first | S | needs Vinh, after CI-3 and CP-2 | CI-3, CP-2 |
| SP-1 | After approval: the SignPath project, artifact configuration, release signing policy with manual approval, the trusted GitHub build system, the API token as a GitHub secret only, the signing step in CI-1, the first signed release, the exact attribution line; then a clean-machine install of the signed build | M | blocked (AP-1) | AP-1 |
| GR-1 | The guardrails beyond chat share, from what is counted: the share of use at night (23:00 to 05:00) and the long tail of active minutes, in the opt-in local stats and the script of ME-3 | M | ready | |
| AL-1 | A plain consent text for the alpha testers (what is collected, by hand through Copy stats, they can stop and have it deleted), in Vietnamese | S | ready | ME-4 |
| AL-2 | What is done about the foundation's call for consent of its own and an outside reviewer for a small test among acquaintances, and what a lawyer must still say (`foundation/legal-questions.md`, items 8 and 9) | S | ready | AL-1 |
| CS-1 | A strict Content-Security-Policy for the three windows, tried on each (V-113) | S | ready | |

## E16. The sticker test on Zalo (spec/06 section 7, plan `sticker-test.md`, ADR-0049)
Why: an off-app test of whether a free sticker set of Peak brings installs (H14) of the same quality (H15) and fixes the character (H16). No app code, no telemetry change. Thresholds are in the plan (section 5) and are written down before the run.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| ST-1 | Verify with a Zalo account: download counts, links or the app name in the description, review time; record the dates and sources (the public pages are done: sizes and terms) | S | public part done 2026-11-10; the account part waits for the author | |
| ST-2 | The character sheet (front and side stills, colors, face rules) and the author's sign-off | S | done 2026-11-10 (front and side views approved by the author; `docs/plans/assets/sticker-character-sheet.svg` v0.2; sit, stretch and loaf bodies not drawn) | |
| ST-3 | Draw 12 to 20 stickers 360 x 360 (spec/06 7.2 and 7.3), the icon 124, the preview 440, the 9 promote banners; compare each with the sheet | L | list of 15 with texts approved 2026-11-10 (`docs/plans/sticker-set-v0.md`); first pass drawn 2026-11-10 (15 stickers, icon, preview, 9 banners in `docs/plans/assets/stickers/set-v0/`, built by `build_stickers.py`); waits for the author to look and for a second pass | ST-2 |
| ST-4 | The consistency review and the note on what the drawing made us decide (H16) | S | ready after ST-3 | ST-3 |
| ST-5 | Short links and the date of each channel; thresholds written and dated; package and submit | S | ready after ST-4 and ST-1 | ST-1, ST-4 |
| ST-7 | The web gallery: a page on streakboom.com where each sticker can be copied or shared (images, CC BY 4.0), built by the website session from `docs/handoff/website-stickers.md`; ADR-0051 | M | done 2026-11-11 (live: /stickers/, /vi/stickers/, /ja/stickers/ from `set-v1` and its manifest, a button copies the PNG, no download and no ZIP, ImageGallery data, a four-item menu; ADR-0053); **the checks on real devices stay open** (V-97: pasting into Zalo, Telegram and Messenger, copy and Share on Android and iPhone, press-and-hold on iOS, older browsers; V-99: English and Japanese text on the stickers not read by a native speaker; Lighthouse not run on the new pages) | ST-3 |
| ST-8 | Three sticker packs of 20 (Cute, Friends, Office; the current 20 are sorted into them and 40 new ones added; Vietnamese first for the new ones); **the lists wait for the author's approval before anything is drawn**; order Cute, Friends, Office; the website moves once at the end (`docs/plans/sticker-packs-three-categories.md`, `sticker-pack-2-office.md`) | L | proposal written 2026-11-12 | ST-3 |
| ST-6 | The run of 4 to 6 weeks, the reading against the thresholds (20 installs, H15 if there is a baseline), the decision and an ADR | S | waits for approval by Zalo | ST-5 |
