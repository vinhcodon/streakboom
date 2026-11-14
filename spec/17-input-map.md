# 17. The input map: what the person does, what it is called, what Peak does

**Status:** **decided on 2026-11-14 (ADR-0109), written from an audit of the code of Preview 0.9.5. Built since on branch `vanish` (IM-1 to IM-4, ADR-0110; not seen, V-139 and V-140); the one-time hint (IM-4) too, V-141.** Two points differ from the text below: step aside keeps the gate `not_quiet`, and with no room it nods instead of hopping to another row (ADR-0110). The author asked for (a) a "step aside" action ("tránh ra", "xê ra") on a double right click, and (b) a review that names every action and ties each to the mouse events and keys that exist. The decisions of section 8 were taken as recommended (ADR-0109).

## 1. Why

Today Peak's inputs are bound in the page, one handler each, and the **actions have no names** except where a reaction event has one (`events.ts`: `poked`, `scratched`, `belly_enjoyed`, `belly_trap`, `named`, `ground_lost`). The typed commands ("lượn đi", "về chỗ đi") are a separate world with their own names (`leave`, `seat`, skill files, ADR-0103). Three problems follow:
1. A new gesture means a new handler, and nobody can see all gestures in one place, so two of them can silently overlap.
2. The same wish (get out of my way) is reached by four different triggers with four different implementations (section 3.2).
3. The person cannot discover what exists: there is no menu on Peak (ADR-0055) and the tour is four cards.

## 2. The principle

**One table of named actions.** Every action has: a **name** (an id), the **gesture** that reaches it (if any), the **typed phrases** that reach it (if any), the **gates** that may refuse it (spec 14 section 6), and what **implements** it (a reflex event or a skill file). The table is fixed in the program. **There is no setting to remap anything** (charter, few settings; spec 14 A1): a person who cannot use a gesture can type the phrase.

**Keys.** Peak does not read the keyboard (charter article 4: it knows when you last typed, never which key). So there are **no global keys** and none may be added without an ADR (the held-key voice of spec 14 A3 is the one planned exception). The only keys are those of the chat box: Enter sends, Escape closes. This is a privacy rule, not a gap.

## 3. The audit (Preview 0.9.5)

### 3.1 Every input that exists

| Input | Handler | Named action today | What it does |
|---|---|---|---|
| Left click | `onClick` after 230 ms | `poked` | a poke; always a poke (ADR-0055); not while held or in Quiet |
| Left double click | `onDblClick` | (none) | opens or closes the chat; or the "ask for a brain" card |
| Left press and move over 5 px | `onPetDown`, `onPetMove` | (none) | carry; letting go in the air off a ledge is a fall |
| Hover and sweep over the head | `scratchStep` | `scratched` | a scratch |
| Hover and sweep over the belly | `scratchStep` | `belly_enjoyed` or `belly_trap` | a rub, sometimes a trap |
| Right click | `onPetMenu` then `shove` | (none) | a push away from the pointer: stagger and huff, or teeter and fall at the end of a ledge; a sleeper is only poked |
| Right double click | none | (none) | two pushes (the second ignored by the 2.5 s cooldown) |
| Middle click, wheel | none | none | nothing |
| Tray icon left click | Rust `on_tray_icon_event` | (none) | show or hide; ends "away" |
| Tray menu | Rust | (none) | Settings, Quiet mode, Show/Hide, Quit |
| Typed in the chat box | `sendChat` | `leave`, `seat` (table) | commands before any chat (spec 14 section 7) |
| Typing or clicking near it (not on it) | the probe, `makeWay` | (none) | it makes way (spec 07 section 3.1) |
| Being covered by a window | `coverTick` | (none) | it hops out from under it |
| Enter, Escape in the chat box | the bubble | (none) | send, close |

### 3.2 Findings

1. **Four ways to get out of the way:** the right click (a push, a reaction, it may fall), the typing lane (it hops or walks away from your text, `makeWay`), the cover escape (`coverTick`), and the end of "leave" (it goes away for 20 minutes). Only the first is triggered by a person on purpose.
2. **The double right click is free** and its natural meaning is an escalation of the push: a person who clicks the right button twice is saying "move" more strongly. That is the same ladder the repeated pokes already have (`repeatNow`, escalation LN-2).
3. **A right double click does not exist in the browser** (`dblclick` is for the left button): it has to be built with a timer, as the left click already does (230 ms). The cost: a single right click would wait for the timer before the push starts.
4. **On a trackpad** a double right click is two two-finger taps: possible, awkward. The typed phrase is the way for everyone.
5. **Discoverability is the real gap.** No gesture is explained after the tour. A first hint (one line, once, after the third push in a short time: "you can also say *xê ra*") would cost one scripted line and no setting.
6. `onDblClick` and the carry have **no names**. The reaction events cover only the reflexes.

## 4. The proposal: "step aside" ("tránh ra", "xê ra")

**What it is.** A polite request to get out of the cursor's way: Peak looks at the pointer (the notice beat), then moves **away from the pointer along the surface it stands on** by about one and a half body lengths at least (the existing `LEAVE_PX` is 260 logical px for walking away from work; the same distance is a reasonable start), and stops. If the surface ends or has no room it hops to another row (the existing `hopOutOfLane` path) or, failing that, stays and nods. **It never leaves and never falls.** A sleeper wakes first.

**How it differs from the push (the right click).** The push is a physical, cartoon reaction: it is knocked, staggers, huffs, may fall. Step aside is Peak's own polite act, calm, with no complaint. The push stays on the single right click.

**Bindings.**
- **Gesture:** the double right click, resolved by a timer (about 250 ms, as the left click). One right click: the push, started after the timer. Two within the timer: step aside, and no push.
- **Typed:** *xê ra, tránh ra, nhường chỗ, tránh đường* (vi); *move over, step aside, out of the way, make way* (en); *どいて, 避けて, 道をあけて* (ja). Table only, never named by the model (as `seat`, ADR-0108).
- **Gates:** not held, not flying; works in Quiet mode (the person asked for a move, which is quiet); not while away or leaving. A cooldown shared with the push (2.5 s).
- **Implementation:** a skill file `aside.skill.json` (ADR-0103) with a new verb `step_aside` (an ADR, as every verb) that calls the existing movement code. This is the second real test of the skill-file format after `seat`, and the first skill that moves.
- **Counted:** `aside` in the day counts, apart from Bond Days.

**What it must not become:** a way to make Peak leave (that is `leave`), a thing the model offers, or a second "get out of the way" that the typing lane contradicts (the lane waits while the person has just asked: the same guard as for leaving, ADR-0108 addendum).

## 5. The names (proposed)

The table below is the contract for every action, existing or proposed. A name is `snake_case`, never changes, and is what the counts, the trace and the skill files call it.

| Name | Gesture | Typed phrases | Implemented by | Gates | Status |
|---|---|---|---|---|---|
| `poke` | left click | | reflex event `poked` | not held, not Quiet | built (the event is `poked`) |
| `scratch` | sweep the head | | event `scratched` | not held, not Quiet | built |
| `belly_rub` | sweep the belly | | events `belly_enjoyed`, `belly_trap` | not held, not Quiet | built |
| `carry` | left press and move | | the drag | not Quiet | built |
| `open_chat` | left double click | | `onDblClick` | not Quiet | built |
| `shove` | right click | | `shove` | not Quiet, not held, cooldown | built |
| `step_aside` | right double click | xê ra, tránh ra, move over, どいて | skill `aside` | not quiet, not held, not flying, not away, not leaving, cooldown | built (not seen) |
| `leave` | | lượn đi, go away, 消えて, ... | skill `leave` | spec 14 section 7.4 | built (Stable 0.8.0) |
| `seat` | | về chỗ đi, go to your spot, 席に戻って | skill `seat` | not held, not flying, not away | built in Preview (nods only) |
| `toggle_visibility` | tray left click | | Rust | none | built |
| `quiet_toggle`, `settings`, `quit` | tray menu | | Rust | none | built |
| `make_way` | (the person typing near it) | | `makeWay` | the focus gates | built, not a command |
| `escape_cover` | (a window covers it) | | `coverTick` | | built, not a command |

The gesture column is a **closed list**: left click, left double click, left drag, sweep head, sweep belly, right click, right double click, tray click. A new gesture is an ADR (it is a new thing the person must learn and Peak must sense).

## 6. Where it goes in the code (when decided)

1. A file `app/src/lib/bindings.ts` with the table of section 5 as data and a pure `resolveGesture(gesture, state)` that returns the action name or null, with tests (every gesture on the closed list has exactly one action; every phrase of a skill file is in exactly one action; no two actions share a gesture).
2. `+page.svelte` handlers call `resolveGesture` and then run the action by name; the right-click timer is a small pure helper (`clickResolver`) with tests.
3. Skill files may carry a `gestures` key (a subset of the closed list) once a second skill needs it (stage 3 of ADR-0103); until then the table in `bindings.ts` holds it.
4. `leave-trace.log` grows from "leave steps" to "action steps" (the name of the action first), still only names and numbers.

## 7. What it costs

Small: one handler change, one timer, one skill file and one verb, one hint line in three languages (under the banned-patterns test). Risk: the 250 ms wait before a push (the push feels slower), and the extra concept for the person; both are mitigated by the typed phrase and by the hint after repeated pushes.

## 8. The decisions (taken as recommended, ADR-0109)

1. **The double right click** is the gesture (rejected: holding the right button, only the typed phrase).
2. **A single right click waits about 250 ms** (rejected: pushing at once and upgrading on the second click).
3. **A one-time hint** after repeated pushes.
4. **`bindings.ts` is the one table** (rejected: names only in each skill file).
