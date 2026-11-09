# Plan: the desktop as terrain (cost field and attention)

Status: **proposed 2026-11-09 after Vinh agreed the direction ([`../../spec/07-terrain-and-attention.md`](../../spec/07-terrain-and-attention.md), decisions T1 to T6); no code until FS-4 and the CPU target (PR-9) are done (T6).** Epic E9 in [`backlog.md`](backlog.md).

## Levels and order
| Level | What | Needs a permission? | Stories |
|---|---|---|---|
| L1 | One world from all monitors (fractions of work areas, walking across touching monitors); the pure model; Rust: the monitor list and `move_to` | no | TE-1, TE-2, TE-3 |
| L2 | The attention field, the danger zones, cost-based choice of where to be, hops, moving away from the user's work | no (the field is memory only, described in the README) | TE-4 to TE-9 |
| L3 | Window relief: perches, walls, jumping up, falling when a surface disappears | **yes** (Vinh's separate permission and a Settings switch) | TE-10a to TE-10d |
| L4 | Learned places (welcome and unwelcome zones) on top of the above | no | TE-11, PL-2 to PL-5 |

Vertical movement (TE-2, TE-7) was brought forward on 2026-11-09 (T9) because the typing lane needs it.

Order inside L1 and L2: the pure logic first with Node tests (`terrain.ts`, `attention.ts`, the choice function), then the thin Rust commands, then the wiring in the pet window, then a build for Vinh to look at **before** each commit that changes motion (the 2026-11-08 lesson: rates and gaits chosen by arithmetic were wrong twice).

## Steps
| Step | What | Files | Backlog |
|---|---|---|---|
| 1 | Pure world model: monitors to one world; positions as monitor key plus fractions; neighbors across touching edges; conversions; tests for resolution, DPI, taskbar and monitor-set changes | `app/src/lib/terrain.ts`, `terrain.test.ts` | TE-1 |
| 2 | Rust: `monitors_info` (work areas in physical px and scale for each monitor) and `move_to(x, y)` clamped to the world; tests for the clamping across monitors | `lib.rs`, `layout.rs` | TE-2 |
| 3 | Walking across monitors (the walk no longer clamps to the monitor under the cat when the neighbor touches); manual check on two monitors | `lib.rs` (`move_by`), `+page.svelte` | TE-3 |
| 4 | Attention field: decayed grid per monitor, updated from the probe; tests: decay, neighbors, idle does not feed it, a parked pointer decays | `attention.ts`, `attention.test.ts` | TE-4 |
| 5 | Fixed danger zones as costs (caption buttons, title bar band) | `terrain.ts` | TE-5 |
| 6 | Cost-based choice: `choosePlace(world, attention, prefs, tier, now)` returns the best place or none; tests for each state of spec/07 section 3 | `places.ts` or `terrain.ts` | TE-6 |
| 7 | Vertical movement: hop along an arc and fall (Rust `move_to` ticks, rig `hop`, `land`, `gasp`); a CPU measurement per kind | `+page.svelte`, `engine.ts` | TE-7 |
| 8 | Wire avoidance: when the field reaches the cat, move away (rate-limited), else curl up | `+page.svelte`, `focus.ts` | TE-8 |
| 9 | README, Settings text and the website note for the attention field | `README.md`, `ui.ts`, handoff note | TE-9 |
| 8b | The typing lane: the pure model, the click anchor from the mouse button state in Rust, and avoidance with a vertical hop (T7 to T9; needs steps 2 and 7) | `lane.ts`, `lib.rs`, `+page.svelte` | TE-12, TE-13, TE-14 |
| 10 | L3 (after the permission): windows snapshot in Rust, perches and walls, jump up, sit, fall | `lib.rs`, `terrain.ts`, rig | TE-10a to d |

## Risks
- **CPU.** Hops and falls are 60 fps motion; the baseline is already above its budget. Mitigation: measure each kind with `scripts/cpu-breakdown.ps1` and the in-page profiler; rate-limit avoidance moves (once per 20 s); prefer fading when moving is not worth it.
- **A blind field** for keyboard-only users (the caret is unknown). Mitigation: focus-safety (stillness and making way) stays as the net; open question 1 of spec/07.
- **Twitchy behavior** (the cat runs around as the pointer moves). Mitigation: hysteresis, a minimum time between moves, avoidance only when the field is above the limit at the cat's own place.
- **Perception of surveillance.** Mitigation: memory only, a plain statement in the README and on the site, no persistence, no counts sent.
- **Multi-monitor and DPI bugs** (coordinates in physical px, scale per monitor). Mitigation: the fraction model and tests; manual checks on two monitors.
- **Scope creep from L3.** It is a separate permission and a separate decision record; L1 and L2 stand without it.

## Test plan
**Automatic:** world conversions and monitor changes; field update, decay and idle behavior; cost rules per state; place choice; the hop arc and fall as pure functions (positions per tick); Rust tests for `move_to` clamping and the monitor list ordering.
**By hand (real window, debug port recipe, back up and restore the real data around synthetic tests):** the cat leaves a place where the user is typing; it does not run around when the pointer moves a lot; on two monitors the hill on the other monitor does not move it; at 125% and 150% DPI the grid and the danger zones land where expected; a maximized window with the cat inside it while the user is idle; CPU for a standing, walking, hopping and avoiding cat.

## What could not be verified (yet)
Everything: nothing is built. The main open assumption is that the pointer is a good enough proxy for the user's attention (H9). The constants are starting values.
