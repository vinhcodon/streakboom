# Backlog: epics and user stories (from the five qualities assessment)

Status: **proposed 2026-11-08, asked by Vinh to be carried out story by story.** It turns [`pet-qualities-assessment.md`](pet-qualities-assessment.md) into work and sits next to the phases of [`roadmap.md`](roadmap.md): the roadmap says *when* (Phase 3 real keys, Phase 4 readiness, Phase 5 alpha); this file says *what, in pieces*. Epics E1 to E5 are the five qualities, E6 is measuring the north star and running the alpha, E7 is verification and release.

## How we work with it
1. **Size.** S = up to half a day, M = one to two days, L = more than two days (an L must be split before it starts).
2. **After every story** (this is the standing rule): set its status here, update the progress table, compare with the roadmap phase it belongs to, and propose the next two or three stories of size S or M with the reason for the order.
3. **A story that says "Needs Vinh"** is a decision: I put the options to Vinh as a multiple choice and write an ADR before any code. Other stories can start as soon as their dependencies are done.
4. **Done means:** tests for the pure logic, the spec and README updated in the same commit, the engineering-log entry saying what was **not** verified, explicit-path commit (ADR-0023). Behavior the website describes also gets the website session told (README, Release and auto-update, step 1). A release is a separate step the author orders.
5. Statuses: `done`, `doing`, `ready` (can start), `needs Vinh` (a decision or an action only Vinh can do), `blocked` (waits for something named), `later`.

## Progress (2026-11-08, version 0.2.2; counts exclude stories merged into others)

| Epic | Quality | Done / stories | Where it stands |
|---|---|---|---|
| E1 | Presence | 5 / 8 | The pet is there; the CPU cause is found (PR-3 done), the fix (PR-4) is next; PR-6 moved to E8 |
| E2 | Continuity and growth | 3 / 6 | Memory and tiers exist; growth is not visible |
| E3 | Consistent personality | 1 / 6 | The character exists; the vague refusal, hour lines, own habits and the Vietnamese review are open |
| E4 | Two-way care loop | 2 / 5 | Gestures answer; no lasting change yet (weakest) |
| E5 | Proactive but frugal | 3 / 6 | Polite and rate-limited; context timing comes through E8 (strongest) |
| E6 | Measurement and alpha | 1 / 7 | Counters built; no baseline, no tool, no testers |
| E7 | Verification and release | 3 / 9 | The 8-hour soak was stopped at 2 h 23 (memory flat) to diagnose CPU; real keys, devices open; the 0.2.1 to 0.2.2 update was seen working |
| E8 | Focus-safety and places | 1 / 15 | Spec and ADR-0029 written; code waits for the CPU gate |

Against the roadmap: Phases 0 to 2 done; **Phase 4 in progress** (E7: the soak was stopped early; PR-3 done, PR-4 next; PF-3, PR-8, VE-2, VE-3 open); Phase 3 blocked on keys (VE-4, VE-5, PE-3); Phase 5 not started (E6).

## E1. Presence
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PR-0 | The pet is always on top, click-through except over the cat, with idle, walk, sleep and wake | M | done | |
| PR-1 | Eyes follow the cursor while it is over the pet | S | done | |
| PR-2 | Start with Windows as an opt-in (ADR-0018) | S | done (not verified across a reboot) | |
| PR-3 | Break the CPU down: idle versus walking versus sleeping, per process, against the budget | S | done 2026-11-08 (about 25 painted frames per second on average; blink and twitch keep the cat in full mode about 20% of the time; CPU follows frames; see the engineering log) | |
| PR-4 | Bring the CPU within the budget: cap the full mode at about 30 fps outside held or dragged, end a blink or twitch with its own animation, sleep effects at about 5 fps, walk at about 20 fps with fewer window moves; measure after each change with `scripts/cpu-breakdown.ps1` and the in-page profiler | M | ready | PR-3 |
| PR-5 | Decision: read only the time of the last keyboard or mouse input (no content, no hook) to know whether the user is typing | S | done (rungs 1 and 2 plus fading, ADR-0029) | |
| PR-6 | The pet stays still while the user is typing | M | merged into FS-3 (spec/06) | |
| PR-7 | The pet plays more when the user has been idle a while | S | blocked (FS-2) | FS-2 |
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
| PE-0 | The character, the tone guide, 182 lines per language, the persona and mood tags (ADR-0011, ADR-0013, ADR-0016) | L | done | |
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
| VE-6 | A real update from one version to the next (**observed once**: the installed 0.2.1 became 0.2.2 by itself at 22:06:56 on 2026-11-08; who accepted the offer was not observed) and the first real clean-up of an old release (the release after 0.2.3) | S | partly done | next release |
| VE-7 | Update the installed copy to 0.2.2 | S | done (the app updated itself at 22:06:56) | |
| VE-8 | A full 8-hour soak on the build after the CPU fix | S | blocked (PR-4) | PR-4 |

## E8. Focus-safety and places (spec/06, plan `character-and-movement.md`)
Order by decision D2: the CPU baseline (PR-3, PR-4) comes first.
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| FS-0 | Decide the focus-safety rungs and write the ADR (ADR-0029) | S | done | |
| FS-1 | Pure focus decision `focus.ts` with Node tests (walk and speak permissions, ghost with hysteresis) | S | blocked (PR-4) | PR-4 |
| FS-2 | Rust probe `focus_probe`: last-input time and pointer offset read by the hit-test thread; `windows-sys` features; Rust test for the tick arithmetic | M | blocked (PR-4) | PR-4 |
| FS-3 | Hold walks and unprompted lines while the user is active (replaces PR-6 and PF-4) | M | blocked (FS-1, FS-2) | FS-1, FS-2 |
| FS-4 | Fade and click-through while the user types near the cat | S | blocked (FS-3) | FS-3 |
| FS-5 | Manual checks: overlap with a real text box, multi-monitor, DPI, CPU (spec/06 plan) | S | blocked (FS-4) | FS-4 |
| FS-6 | Clarify the "no input hook" line in spec/05 to say what is and is not read | S | blocked (FS-2) | FS-2 |
| PL-0 | Decision: how zones and favorite spots survive a monitor, DPI or taskbar change (spec/06 2.3 gives a proposal) | S | needs Vinh | |
| PL-1 | Vertical movement: a Rust `move_to` and the walk along both axes | M | blocked (PL-0, FS-5) | PL-0 |
| PL-2 | `places.ts`: cell counts, taught spots, tier distance, monitor changes, with Node tests | M | blocked (PL-0) | PL-0 |
| PL-3 | Places in memory, Settings view, Forget and a learning switch | M | blocked (PL-2) | PL-2 |
| PL-4 | Dragging the cat teaches a favorite spot | S | blocked (PL-1, PL-2) | PL-1, PL-2 |
| PL-5 | Resting distance by closeness tier | S | blocked (PL-2) | PL-2 |
| PL-6 | New movement: curl up in a corner (measured for CPU) | M | blocked (PR-4, PL-1) | PR-4 |
| PL-7 | New movement: a hop along an arc (measured for CPU) | M | blocked (PR-4, PL-1) | PR-4 |

## Suggested order
1. **PR-3** (S): explain the CPU. It decides whether the presence quality is healthy at all, and it is the only open story that needs no decision and no waiting.
2. **ME-3** and **ME-2** (S each): the measuring tool and the checks of the counters, so that the alpha can produce a baseline.
3. **PR-5**, **CO-3**, **CA-2** (S each, all decisions for Vinh): the three choices that unlock E1 timing, E2 growth and E4 care. These can be asked together as multiple choices.
4. **PE-1** and **PE-2** (S, M): the personality stories that need no decision.
5. After the soak ends (about 03:40): **VE-7, PR-8, PF-3** together.
6. **ME-4**, then the alpha when Phase 4 allows it.

## What was not verified
The sizes are estimates, not measured. Which stories matter most for retention is a hypothesis (H5, H6); the alpha is what can test it.
