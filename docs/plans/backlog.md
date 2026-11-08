# Backlog: epics and user stories (from the five qualities assessment)

Status: **proposed 2026-11-08, asked by Vinh to be carried out story by story.** It turns [`pet-qualities-assessment.md`](pet-qualities-assessment.md) into work and sits next to the phases of [`roadmap.md`](roadmap.md): the roadmap says *when* (Phase 3 real keys, Phase 4 readiness, Phase 5 alpha); this file says *what, in pieces*. Epics E1 to E5 are the five qualities, E6 is measuring the north star and running the alpha, E7 is verification and release.

## How we work with it
1. **Size.** S = up to half a day, M = one to two days, L = more than two days (an L must be split before it starts).
2. **After every story** (this is the standing rule): set its status here, update the progress table, compare with the roadmap phase it belongs to, and propose the next two or three stories of size S or M with the reason for the order.
3. **A story that says "Needs Vinh"** is a decision: I put the options to Vinh as a multiple choice and write an ADR before any code. Other stories can start as soon as their dependencies are done.
4. **Done means:** tests for the pure logic, the spec and README updated in the same commit, the engineering-log entry saying what was **not** verified, explicit-path commit (ADR-0023). Behavior the website describes also gets the website session told (README, Release and auto-update, step 1). A release is a separate step the author orders.
5. Statuses: `done`, `doing`, `ready` (can start), `needs Vinh` (a decision or an action only Vinh can do), `blocked` (waits for something named), `later`.

## Progress (2026-11-08, version 0.2.2)

| Epic | Quality | Done / stories | Where it stands |
|---|---|---|---|
| E1 | Presence | 3 / 9 | The pet is there; the context signal and the CPU question are open |
| E2 | Continuity and growth | 3 / 6 | Memory and tiers exist; growth is not visible |
| E3 | Consistent personality | 1 / 4 | The character exists; own habits and the Vietnamese review are open |
| E4 | Two-way care loop | 2 / 5 | Gestures answer; no lasting change yet (weakest) |
| E5 | Proactive but frugal | 3 / 7 | Polite and rate-limited; timing is not contextual yet (strongest) |
| E6 | Measurement and alpha | 1 / 7 | Counters built; no baseline, no tool, no testers |
| E7 | Verification and release | 1 / 8 | Soak running; real keys, devices and update tests open |

Against the roadmap: Phases 0 to 2 done; **Phase 4 in progress** (E7: VE-1 running, PF-3, PR-8, VE-2, VE-3 open); Phase 3 blocked on keys (VE-4, VE-5, PE-3); Phase 5 not started (E6).

## E1. Presence
| ID | Story | Size | Status | Depends on |
|---|---|---|---|---|
| PR-0 | The pet is always on top, click-through except over the cat, with idle, walk, sleep and wake | M | done | |
| PR-1 | Eyes follow the cursor while it is over the pet | S | done | |
| PR-2 | Start with Windows as an opt-in (ADR-0018) | S | done (not verified across a reboot) | |
| PR-3 | Break the CPU down: idle versus walking versus sleeping, per process, against the budget (the soak shows about 17% of one core on average) | S | ready | |
| PR-4 | Bring the CPU within the budget (idle near 0) | M | blocked (PR-3) | PR-3 |
| PR-5 | Decision: read only the time of the last keyboard or mouse input (no content, no hook) to know whether the user is typing; reverses a line of spec/05 | S | needs Vinh | |
| PR-6 | The pet stays still while the user is typing | M | blocked (PR-5) | PR-5 |
| PR-7 | The pet plays more when the user has been idle a while | S | blocked (PR-5) | PR-5 |
| PR-8 | Start with Windows across a reboot, and the tray icon after a restart (A7) | S | blocked (the soak ends about 03:40) | VE-1 |

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
| PF-3 | Stronger silence test (A4): force a line during fullscreen, presentation and screen sharing; confirm nothing shows; also test a sleeping cat (PF-1) | S | blocked (the soak ends; needs a restart with the debug port) | VE-1 |
| PF-4 | Hold an unprompted line while the user is typing, with a longest wait | M | blocked (PR-5) | PR-5 |
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
| VE-1 | The 8-hour memory and CPU soak (A5), started 19:40, ends about 03:40 | S | doing | |
| VE-2 | Check at 125% and 150% DPI and with several monitors (A2, A3) | S | needs Vinh (a monitor or a display scale change) | |
| VE-3 | Run on a lower-end second machine (A1) | S | needs Vinh (a machine) | |
| VE-4 | Real-key test of the Claude brain: connect, chat in both languages, the no-credit and bad-key errors, the mood tags (Phase 3) | M | blocked (a key) | |
| VE-5 | The same for the OpenAI brain | M | blocked (a key) | |
| VE-6 | First real update from one version to the next and the first real clean-up of an old release (the release after 0.2.3) | S | later | next release |
| VE-7 | Update the installed copy to 0.2.2 (after the soak) | S | blocked (VE-1) | VE-1 |

## Suggested order
1. **PR-3** (S): explain the CPU. It decides whether the presence quality is healthy at all, and it is the only open story that needs no decision and no waiting.
2. **ME-3** and **ME-2** (S each): the measuring tool and the checks of the counters, so that the alpha can produce a baseline.
3. **PR-5**, **CO-3**, **CA-2** (S each, all decisions for Vinh): the three choices that unlock E1 timing, E2 growth and E4 care. These can be asked together as multiple choices.
4. **PE-1** and **PE-2** (S, M): the personality stories that need no decision.
5. After the soak ends (about 03:40): **VE-7, PR-8, PF-3** together.
6. **ME-4**, then the alpha when Phase 4 allows it.

## What was not verified
The sizes are estimates, not measured. Which stories matter most for retention is a hypothesis (H5, H6); the alpha is what can test it.
