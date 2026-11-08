# 06. Character, movement and focus-safety

Status: **draft for Vinh's review, written 2026-11-08 (version 0.2.2). No feature code exists for anything marked "new".** Source: [`../docs/handoff/character-and-movement.md`](../docs/handoff/character-and-movement.md) (a product discussion in Claude chat), checked against the code. Plan and steps: [`../docs/plans/character-and-movement.md`](../docs/plans/character-and-movement.md). Backlog: [`../docs/plans/backlog.md`](../docs/plans/backlog.md) (epic E8 and the stories named below).

Product line: **"Một chú mèo nhỏ sống trên màn hình của bạn"** (a small cat living on your screen). Three promises: *nhỏ* (small: little space, attention and CPU), *sống* (alive: its own routine), *trên màn hình của bạn* (a housemate in the user's space, not a servant). Companion, not assistant (ADR-0021).

## 0. Decisions (answered by Vinh, 2026-11-08) and what is still open

| # | Question | Answer | Where it lands |
|---|---|---|---|
| D1 | How far up the focus-safety ladder (section 3)? | **Rungs 1 and 2, plus fading the cat when the user types near it.** Rung 3 (geometry of the foreground window) is out for now; rung 4 (caret rectangle) is rejected. | section 3, ADR to write |
| D2 | Order: CPU or new movement first? | **Fix the baseline CPU first** (PR-3, PR-4), then focus-safety, then places and new movement. | plan, backlog |
| D3 | "Too big for me" refusal | **Vague, in the cat's voice, never mentioning an assistant** ("Cái đó khó quá với một con mèo."). | section 1.4 |
| D4 | Sarcasm level | **Keep about 14%** (the Gentle switch stays). Revisit with alpha feedback. | section 1.5 |
| Q2 | Default cat name | **Already decided in ADR-0024:** "Peak" is the project's character; each user's pet starts unnamed and is named after a day or two; if testers dislike the naming card, offer "Peak" as the suggested name there. | nothing to do |

Still open (not blocking the first steps, to settle before the step that needs them): zone definition across monitors and DPI (section 2.3, proposal given), what happens to a favorite spot when the monitor setup changes (2.3), which new movement kinds are worth their art and CPU (2.4, after the CPU gate), and whether a per-day "yield" count is worth a new consent version (section 4).

## 0.1 What the code does today (verified 2026-11-08) and where the handoff is out of date

Verified in `app/src-tauri/src/lib.rs`, `layout.rs`, `app/src/routes/+page.svelte` and `app/src/lib/rig/engine.ts`:
- **Movement is one-dimensional.** `startWalk` calls the Rust command `move_by(dx)` every 66 ms at 36 logical px per second for 3 to 8 seconds (about 110 to 290 px), then stops; the direction is random and flips at the edge of the work area. The window's y never changes (it is the start position, bottom-right of the primary monitor, or wherever the user last dragged it, saved in `state.json`). So "walks a little left and right, then sits, no sense of place" is **confirmed**.
- Idle behavior picks something new every 4 to 11 s: 50% look, 35% walk, 15% doze (`pickNext`).
- **Rust already reads the global cursor position**: the hit-test thread (`spawn_hit_test`) calls `cursor_position()` every 150 ms (30 ms when the cursor is within 40 px of the window) and `drag_*` use it too. The JS side only sees the cursor while it is over the cat (the eyes). So the pointer is available for almost nothing.
- **`is_busy` is only `SHQueryUserNotificationState`** (fullscreen, D3D fullscreen, presentation, session locked). There is **no** idle-time call (`GetLastInputInfo` is used nowhere) and no foreground-window call. "Idle time" in spec/03 is a timer inside the app. `windows-sys` has only the `Win32_UI_Shell` feature today; adding input features is a compile-time change, not a new dependency, and adds no network.
- The pet window (140 x 140 logical px with a 120 px cat) is click-through except over the cat (`set_ignore_cursor_events` from the hit-test thread).

Where the handoff is wrong or old:
1. "Local tree ahead of `main` with uncommitted multi-provider work": not true; that work was committed, pushed and released (0.1.13). Nothing needs protecting.
2. "A standing cat costs about nothing; walking 7 to 15% of a core" is from build 0.1.7. Measured on 0.2.1 and 0.2.2 (engineering log, PR-3): about 11 to 12% of one core when no window moves, about 27 to 30% while walking. The cause is found (engineering log, PR-3 part 2): the cat paints about 25 frames per second on average, because blinks and twitches keep the redraw at full speed for 2 to 4 seconds each (about a fifth of the time), sleep draws about 11 fps, and each painted frame is costly with software compositing. **The movement budget in section 2.1 starts from a baseline that is currently too high** (D2).
3. "spec/03 already lists staying out of the way of the active window's title bar": it does not (the text is not in the current spec).
4. Question 2 (default name) is answered by ADR-0024. Question 3: the persona in `brain.rs` has no refusal behavior yet.
5. The tier table matches the code; only "glances at the cursor" differs: the eyes follow the cursor over the cat at every tier.
6. The hide rate cannot be measured yet (spec/05 section 3.4: Rust would have to tell the pet window). A per-day "yield" counter would add a count the consent wording (version 2) does not list; see section 4.

## 1. Character bible v0.2

Most of this already exists (spec/03, ADR-0011, ADR-0013, ADR-0016, ADR-0021). The new parts are marked.

### 1.1 Voice
First person "mình"; addresses the user by the name they set (`memory.callMe`), otherwise "bạn" (English: "I", "you"). Natural Vietnamese, no machine-translation feel. One sentence, two at most (110 characters). Teases the situation (the clock, the coffee, the tab pile), never the person or the quality of their work.

### 1.2 Five quirks
| # | Quirk | State |
|---|---|---|
| 1 | Proud but secretly glad: acts as if it was not waiting when the user returns | exists in the return lines |
| 2 | Head scratch is heaven; the belly is a trap | exists (`purr`, `huff`) |
| 3 | Hates being woken abruptly; stretches first | exists (`wake`) |
| 4 | Counts time: jokes about the hour and long sessions | partly (long session, night); **new:** a few "on the hour" lines |
| 5 | Knows it is small: says so plainly when asked for something too big | **new** (D3, section 1.4) |

### 1.3 Closeness tiers (existing mechanics, expression)
| Tier | Closeness | Distance and tone | Opens up |
|---|---|---|---|
| Stranger | 0 to 19 | shy, short lines | short lines |
| Acquaintance | 20 to 49 | starts teasing; the belly trap begins | light teasing; usual part of the day |
| Friend | 50 to 79 | private jokes, uses the name | name, shared history |
| Close | 80 to 100 | warmer, more expressive | milestone reactions (7, 30, 100 days) |
Resting distance by tier (a stranger keeps to a far corner, a close friend sits nearer) is **new** and belongs to places (section 2.3).

### 1.4 "Too big for me" (new, D3)
When the user asks for writing, summarizing, searching or coding, the cat declines in character and does not point to any assistant or product. Persona addition for `brain.rs` (to be adapted to the existing prompt, keeping the mood tag untouched), in the pet's voice: *when asked for something too big (write, summarize, look up, program), decline like a cat, briefly and with humor; do not pretend to know what you do not know; do not name other assistants or tools.* Sample lines for tone review (not final copy): "Cái đó khó quá với một con mèo." / "Mình chỉ biết duỗi người, trêu bạn và nhớ vài chuyện nhỏ thôi."

### 1.5 Sarcasm (D4)
Keep the current share (about 14% of scripted lines, tests allow between a few lines and 40%). The Gentle switch drops them. Not measured with real users yet.

### 1.6 Never does
1. Guilt, or judging the user's worth or work. Never dies or starves; only gets "a bit lonely".
2. Interrupts: silent in fullscreen, meetings (presentation mode), quiet hours, Quiet mode, while asleep (0.2.2) and, new, **while the user is typing near it** (section 3).
3. Plays assistant: no drafting, summarizing, searching, coding, and no reading of screen content.

Feature filter for any idea: (1) can the user get it by prompting another assistant? then drop it; (2) does it make the cat more attached, more remembering or visibly growing? if not, drop it; (3) with all AI off, is it still lovable? if not, it is an assistant in a cat costume.

## 2. Movement and places

### 2.1 Budget
Most of the time the cat is still; movement comes in short bursts. **Target (proposal, to confirm after the baseline is fixed in PR-4): with the cat standing still, near 0% CPU (under 1% of one core); walking at most the 7 to 15% measured in 0.1.7.** Every new movement kind is measured with `scripts/cpu-breakdown.ps1` before and after (plan, step 0) and must not raise the average noticeably. Reasons it is costly today: each walk tick moves a transparent topmost window (66 ms) and redraws the canvas at about 30 fps with software compositing (`--disable-gpu`).

### 2.2 Kinds of movement
- **Exists:** sideways walk along one line; look, sit, doze, sleep.
- **New, cheap (after the CPU gate):** curl up in a corner; a hop along an arc to another spot (uses the existing `move_by`, so not free). Clinging to a side edge needs a new pose: later. The cat's own props (a ball) reuse the unused "play" line pool: last.
- **Rejected:** playing with desktop icons (needs the positions of the user's desktop, against "no screen content"; fragile across monitors and DPI; unlikely to move Bond Days). Chasing the cursor across the screen (CPU, polling, annoyance; ADR-0011). Eyes following the cursor while over the cat stay.

### 2.3 Favorite places (new)
- **Learning, counts not a log:** the work area of each monitor is cut into a 3 x 3 grid; the cat's resting position increments the cell it is in (at most once per minute) and nothing else is stored.
- **The user teaches it:** a spot the user drags the cat to becomes a favorite after the same cell is chosen by dragging three times (proposal). It then returns there when idle.
- **Expression by tier:** a stranger prefers far corners, a close friend sits nearer to where the user works (the center-bottom cells), but never inside the pointer's personal space (section 3).
- **Data (proposal):** in `memory.json`, `places: { cells: number[], teach: number[], monitorKey }`, positions as fractions (0 to 1) of the monitor's work area, so a changed resolution, DPI or taskbar keeps the meaning; a monitor key is the work-area size class plus the index, and when the monitor set changes the cat falls back to the primary monitor's bottom-right and the counts for vanished monitors are kept but unused. Pure choice logic in `app/src/lib/places.ts` with Node tests.
- **Control:** shown in Settings, "What the pet remembers", with Forget and a learning switch like the existing habits.
- **Needs vertical movement:** today the cat never changes y. Places require moving to another y; that is a larger story (E8) and comes after the CPU and focus-safety steps.
- **Bond Days:** dragging the cat to a spot is **not** a care act in the north star (spec/05 stays as it is). Whether it deserves to be one is a hypothesis for the alpha, not a metric change now.

## 3. Focus-safety: do not cover what the user is typing in

**Problem:** the cat sits and walks along the bottom edge of the work area, which is where chat apps put their message box, so it can cover the text being typed. This is a design consequence, not bad luck.

**Ladder (cheapest first) and the decision (D1):**
1. **Recent input (in).** The time since the last keyboard or mouse input, as one number (`GetLastInputInfo`); no key identity, no hook.
2. **Personal space around the pointer (in).** The global pointer position, already read by Rust.
3. Geometry of the foreground window: **out for now** (it is new information about what is on the user's screen; the cat cannot leave the edge anyway; revisit if the first two are not enough).
4. Caret rectangle: **rejected** (unreliable in browsers and Electron, UI Automation is heavy and looks like surveillance).
Hard rules: no global keyboard hook, no reading window contents or titles, no new network calls. `GetLastInputInfo` returns a single tick count: it cannot tell which keys, only that the user did something. It also counts mouse movement, which the decision logic accounts for below.

### 3.1 Inputs, outputs and the decision (pure logic, `app/src/lib/focus.ts`)
Inputs per probe: `idleMs` (ms since the last input; unknown means no restriction), `pointer` (distance in logical px from the cat's center, and whether the pointer is over the cat, or unknown), `busy` (existing `is_busy`), the current `pose`, `quiet`, and the previous output (for hysteresis).
Constants (proposals, tunable after manual checks): `ACTIVE_MS = 3000`, `NEAR_PX = 200`, `CALM_MS = 5000`, `LINE_MS = 6000`, `GHOST_ON_MS = 300`, `GHOST_OFF_MS = 1500`, `GHOST_ALPHA = 0.35`.
Derived: `active = idleMs < ACTIVE_MS`; `near = pointer known and distance < NEAR_PX and the pointer is not over the cat`.

| Output | Rule |
|---|---|
| `walkAllowed` | `idleMs >= CALM_MS`. If a walk is in progress and the user becomes active, the walk ends within one tick (the cat stops and sits). |
| `speakAllowed` | `idleMs >= LINE_MS`. An unprompted line waits and is retried (the existing 2-minute retry); it is never forced while the user is active. |
| `ghost` | on when `active and near` has held for `GHOST_ON_MS`; off when `idleMs >= GHOST_OFF_MS` or the pointer is over the cat or far away. While ghosted the cat is faded to `GHOST_ALPHA` **and click-through** (the hit region is emptied), and fades back over 400 ms. |
| `yield` | no step aside or hop in the first version: fading is the whole response (less motion, less CPU). A sideways step may be added later, rate-limited. |

Priority: fullscreen/busy/Quiet mode/asleep rules stay as they are and win; the dragged-to spot is respected when the user is idle and faded when they type near it. A pointer over the cat always turns the ghost off at once (the user wants to touch it).

### 3.2 Platform interface (small, so a macOS port stays possible)
- Rust: `focus_probe() -> { idle_ms: Option<u32>, dx: Option<f64>, dy: Option<f64> }`, the pointer offset from the cat's center in logical px. On non-Windows `idle_ms` is `None` and the pet behaves as today.
- The hit-test thread already wakes every 150 ms and already reads the cursor; it stores the latest pointer and calls `GetLastInputInfo` there into atomics, and `focus_probe` only reads them (no extra thread, no extra syscalls per call). The pet window reads the probe about once a second while visible, and immediately before starting a walk or an unprompted line. **Idle CPU must not rise** (measured, plan step 3).

## 4. Privacy
- The input signal is one number (how long ago the user last did anything); it is not stored, logged or sent. No keys, no text, no window titles, no window rectangles.
- The pointer position is read only to compute a distance and is not stored; no pointer trail exists.
- Places store counts per grid cell (and the cells the user taught), locally in `memory.json`; Settings shows and can delete them; a switch turns learning off.
- No new network calls. Nothing leaves the machine except through the existing "Copy stats" flow.
- A per-day count of how often the cat faded ("yield") would be a new kind of count; the consent wording of version 2 lists the counts it covers, so adding it means a new consent version and asking people again. **Decision: no new counter in this work.** The effect is judged by observation in the alpha and by the existing guardrails (Quiet mode use; the hide rate once the Rust event exists, PF-5).

## 5. Constraints
- Idle cat at about 0% CPU; walking measured before and after (engineering-log recipe and `scripts/cpu-breakdown.ps1`).
- The pet window owns all state; other windows send patches over `bus.ts`.
- Pure logic (focus decision, zone counters, favorite choice) in `src/lib` with Node tests; platform specifics stay in Rust.
- No global keyboard hook, no screen-content reading, no new network call.
- Windows PowerShell 5.1: do not rewrite JSON or TOML with `Set-Content -Encoding utf8` (byte-order mark).

## 6. What could not be verified
- The pet's behavior over several minutes in the real window against a real text box (nothing is built yet).
- That `GetLastInputInfo` works while the screen is shared, locked, or in a remote session; its behavior with several monitors is not expected to differ.
- The constants in section 3.1 are starting points; the CPU effect of the one-second probe and the ghost fade is a prediction until measured.
- How `idleMs` behaves for touch or pen input on a tablet.
- Multi-monitor and mixed-DPI behavior of places (the data model is a proposal).
- Whether people like the cat fading; the alpha has to say.
