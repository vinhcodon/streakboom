# Verification debt

Everything that was built or released but **not yet checked**, in one place. Before 2026-11-09 these lived as scattered "Not verified" lines in `docs/engineering-log.md` (about 37 of them, some already out of date). From now on this file is the list; the engineering log still tells the story of each task and says what it left unchecked, and **every new "Not verified" line is also added here, and a row is ticked or removed as soon as it is checked** (with the date and how).

Who: **Vinh** = needs the author (a second machine, a key, a reboot, eyes on the screen); **Claude** = can be done by the agent; **either**.
How the agent checks on the real machine: run from the author's Terminal panel (the agent's own shell sees a private copy of `AppData`, see the engineering log of 2026-11-09), start the app with `explorer.exe <exe>`, and for synthetic input click only on a box the test opens itself.

## A. Needs the author (a machine, a key, a reboot, eyes)
| ID | What is unchecked | How to check | Who | Since |
|---|---|---|---|---|
| V-1 | A lower-end second machine: install, update, CPU, behaviour (roadmap A1) | install 0.2.4 and look at the CPU for a day | Vinh | 0.2.0 |
| V-2 | 100% and 150% display scale (this machine runs 125%) and **several monitors**: pointer offset, walk across, `move_to`, hops, the click frame of the typing lane (roadmap A2, A3; VE-2) | change the scale; plug a second monitor; try the test build's hop items near the edges | Vinh | 0.2.0 |
| V-3 | Start with Windows across a reboot, and the tray icon after a restart (A7; PR-8) | turn the option on, reboot, look | Vinh | 0.2.0 |
| V-4 | Real keys for the Claude and the OpenAI brains: connect, chat in both languages, the no-credit and bad-key errors, the mood tags (VE-4, VE-5) | a key in Settings, Brain (never pasted in chat) | Vinh | Phase 3 |
| V-5 | A full 8-hour soak on the current build, and a long CPU run with nobody at the PC (VE-8; PR-9 decides the CPU target) | leave the PC awake; `scripts/soak-log.ps1` | Vinh | 0.2.2 |
| V-6 | The restored data shows in Settings, Memory (name, call-me name, 5 facts) | open Settings, Memory | Vinh | 2026-11-09 |
| V-7 | The installer window itself (icon, wording) and the Apps list entry (only silent installs were done) | run `Streakboom_x.y.z_x64-setup.exe` by hand | Vinh | 0.2.0 |
| V-8 | The update click-through: the offer, the accept, the restart, and which manifest address served it (the app does not log it); the mode "automatic when idle" (only "ask" was used) | wait for the next release | Vinh | 0.2.1 |
| V-9 | The first-run consent card with the new wording on a fresh install | install on a clean user | Vinh | 0.2.0 |
| V-10 | Whether the focus-safety constants feel right with a real person typing (including long pauses between bursts, keyboard-only use) and whether the typing lane's guess (H9) is good enough | use it for a week | Vinh | 0.2.4 |
| V-11 | A fresh look at the hop (TE-7): the legs of the walk pose move in the air; would a dedicated leap pose be better? | try "Test: hop up" again after TE-15 | Vinh | 2026-11-09 |

## B. The agent can check these
| ID | What is unchecked | How to check | Who | Since |
|---|---|---|---|---|
| V-20 | A stronger silence test: force `window.__pet.proactive()` during fullscreen, presentation and screen sharing, and with a sleeping cat; the app must show nothing (PF-3) | debug port plus the hook | Claude | 0.2.1 |
| V-21 | A click shorter than the polling interval (the "pressed since" bit of the button reading) | synthetic short clicks with nobody using the mouse | Claude (author's hands off the mouse) | 2026-11-09 |
| V-22 | Swapped mouse buttons: the left virtual key is the physical left button; a left-handed setting would record the wrong clicks | read `GetSystemMetrics(SM_SWAPBUTTON)` and use it; a unit test for the mapping | Claude | 2026-11-09 |
| V-23 | Hops: against the screen edge and the taskbar (clamping), on a loaded machine, and the frames in mid-air (capture faster than the screen grab) | the test build with the debug port; a burner process; a faster capture | Claude | 2026-11-09 |
| V-24 | A walk interrupted by the user working near the cat, a make-way walk interrupted by a click, a sleeping cat when the user starts typing (it waits until it wakes) | synthetic input with a harmless target | Claude | 0.2.4 |
| V-25 | The focus probe with the screen locked, shared or in a remote session, and with touch or pen input | needs those setups; a lock-screen check is possible | either | 0.2.4 |
| V-26 | Hit-testing the cat after the window moves between monitors of different scale | with V-2 | Vinh | 0.2.4 |
| V-27 | Old items from the 0.2.0 build: `shown` and `engaged` with a real unprompted line, `quiet`, the midnight rollover, the minute counter after a real sleep, the export JSON on the clipboard | the debug hooks and a changed clock | Claude | 0.2.0 |
| V-28 | The cost of hops and falls (TE-15) and the CPU of a walk away and of the probe loop | `scripts/cpu-breakdown.ps1` and `hop_cpu`-style windows | Claude | 2026-11-09 |
| V-29 | `cargo clippy` is not installed on this machine, so no lint run has been done | `rustup component add clippy` | Claude | 0.2.1 |

## C. Things that are written but not done (not verification, kept here so they are not lost)
- The privacy text in the README and on the website for the mouse button reading, the attention field and the ground type (due with TE-14 and TE-9).
- The website session has to be told when the behaviour it describes changes (focus-safety, making way; the typing lane when it ships): its source of truth is `CHANGELOG.md`.
