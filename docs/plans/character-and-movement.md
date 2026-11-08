# Plan: character, movement and focus-safety

Status: **spec approved by Vinh on 2026-11-08 ([`../../spec/06-character-and-movement.md`](../../spec/06-character-and-movement.md)); work proceeds story by story from step 0.** Decisions D1 to D8 are answered (spec section 0, ADR-0029). The work sits in epic E8 and in E1, E3 and E5 of [`backlog.md`](backlog.md).

## Order (D2: CPU first)
Step 0 is a gate: steps 1 to 5 do not start until the baseline CPU is understood and brought down, because every later step adds motion or a probe.

| Step | What | Files | Backlog |
|---|---|---|---|
| 0 | Explain and reduce the baseline CPU (about 11 to 12% of a core standing, about 27 to 30% walking, on 0.2.1 and 0.2.2). Attribution with the in-page profiler (pose, redraw mode, frames per second) against `scripts/cpu-breakdown.ps1`; then change the cause (cause found in PR-3: blink and twitch bursts keep the redraw at full speed for 2 to 4 s about a fifth of the time, sleep paints about 11 fps, walk paints 30 fps and moves a transparent window 15 times a second; the levers are listed in the engineering log and in PR-4). | `PetRig.svelte`, `rig/engine.ts`, `routes/+page.svelte` (`startWalk`, `pickNext`), maybe `lib.rs` | PR-3, PR-4 |
| 1 | Pure focus decision `focus.ts` (spec 3.1) with Node tests: walk and speak permissions, ghost on and off with hysteresis, the pointer over the cat, unknown inputs. | `app/src/lib/focus.ts`, `focus.test.ts` | FS-1 |
| 2 | Rust probe: `GetLastInputInfo` and the pointer offset stored by the hit-test thread, command `focus_probe`; enable the `windows-sys` features (`Win32_UI_Input_KeyboardAndMouse`, and `Win32_System_SystemInformation` for the tick count if needed); Rust unit test for the tick arithmetic (wraparound after about 49 days). | `app/src-tauri/Cargo.toml`, `lib.rs` | FS-2 |
| 3 | Wire it: probe once a second while visible and before a walk or a line; hold walks and unprompted lines; ghost fade and click-through. Measure idle CPU before and after. | `routes/+page.svelte`, `Pet`/`PetRig.svelte` (opacity), `lib.rs` (hit region) | FS-3, FS-4 |
| 4 | Manual checks in the real window (below). Fix constants. | | FS-5 |
| 5 | ADR for the rule on input (not a hook), update spec/05 line about "no input hook" to say what is and is not read. | `docs/decisions/`, `spec/05` | FS-6 |
| 6 | Vertical movement and favorite places: `places.ts` (cells, taught spots, tier distance, monitor change), memory schema, Settings view and Forget, drag teaches. | `lib/places.ts`, `memory.ts`, `routes/settings`, `lib.rs` (`move_to`) | PL-1 to PL-5 |
| 7 | New movement kinds (curl in a corner, a hop), each measured. | `rig`, `+page.svelte` | PL-6, PL-7 |
| 8 | Character content: refusal in the persona, a few "on the hour" lines, more quirks, a native review of the Vietnamese; tests that line pools still match in both languages. | `brain.rs`, `lines.ts`, `lines` tests | CH-1 to CH-3 |
| 9 | README, specs, website note (behavior the site describes changes); log what was not verified. | | |

## Risks
- **CPU.** The probe and the fade add work; the baseline is already over budget. Mitigation: step 0 first; the probe reads atomics filled by a thread that already runs; the ghost is a short CSS opacity change.
- **Privacy perception.** An input-time API can be mistaken for a keylogger. Mitigation: the ADR and the privacy text say exactly what is read (one number, not stored), no hook.
- **Flicker or twitchy fade** when the user alternates mouse and keyboard. Mitigation: hysteresis (`GHOST_ON_MS`, `GHOST_OFF_MS`), tested in step 1.
- **Wrong "near" with several monitors and DPI.** Mitigation: the pointer offset is computed in the pet's own window coordinates (as the hit test does), tested manually.
- **Click-through while faded** could swallow a user's attempt to touch the cat; the pointer over the cat turns the ghost off at once.
- **Idle never reached** (a user who always touches the mouse): the cat never walks. Acceptable by design ("sits still while you work"), but it must not look broken; the cat still blinks, twitches and dozes.
- **Scope creep** from places (vertical movement, schema, Settings): kept behind steps 0 to 5.

## Test plan
**Automatic (Node, `src/lib`):** focus decision table (each row of spec 3.1, thresholds on both sides, hysteresis sequences, unknown inputs, the pointer over the cat, busy and quiet winning); later `places.ts` (cell counting at most once a minute, teaching by drag, tier distance, a changed monitor set, forgetting). **Automatic (Rust):** tick arithmetic and wraparound of the idle time; the offset computation.
**By hand, in the real window (WebView2 debug port recipe, back up and restore the real data around synthetic tests):**
1. *Overlap:* open a chat or notepad with its caret at the bottom right; type with the cat nearby; the cat must fade and not walk; stop typing; it returns after about 1.5 s; click the cat while it is faded near the pointer.
2. *Multi-monitor:* the cat on the second monitor, pointer on the first and the other way round; no fade from a far pointer.
3. *DPI:* 100%, 125%, 150%; the near radius is in logical pixels and must feel the same.
4. *CPU:* `scripts/cpu-breakdown.ps1` for 10 minutes standing, walking and with the pointer near and typing; compare with step 0's numbers; idle must not rise.
5. *Edge cases:* fullscreen video, locked screen, a remote session, a screen share (A4).

## What could not be verified (yet)
Everything about the new behavior: nothing is built. The constants are starting points. The effect of the proposed CPU levers is an estimate until PR-4 measures it.
