# Revising what the mouse does to Peak (a proposal, nothing built)

**Status:** written 2026-11-16 for the author's list of changes (right click = step aside, double right click = go to its place, slow stroking = scratch and rub, a fast decisive flick = a shove that staggers Peak the way it was flicked, left click = poke, left double click = talk). It starts from the audit of [`spec/17`](../../spec/17-input-map.md) (ADR-0109, ADR-0111) and the code of 2026-11-16. **Nothing is changed**; each choice is the author's and becomes an ADR that amends ADR-0109.

## 1. What changes, against what is built
| Input | Built today (Preview 0.11.10) | Proposed |
|---|---|---|
| Left click | poke (after 230 ms, to tell it from a double click) | same |
| Left double click | open the chat | same: **talk** |
| Slow, gentle stroke over the head or the belly | scratch or belly rub (three reversals within 1.3 s, 110 px of path) | same, plus a **speed ceiling** (see 3) |
| **Right click** | **a shove** (a stagger and a huff, a fall at the end of a ledge), after a 250 ms wait | **step aside** (the polite walk away from the pointer, `aside`) |
| **Right double click** | **step aside** | **go to its usual place** (`seat`) |
| **A fast, decisive flick across it** | nothing (a pass is a pass) | **the shove**, in the direction of the flick: it staggers that way |
| Drag | carry | same |

Net effect: **the right button becomes the two polite requests** ("move over a bit", "go back to your place"), both already existing skills with typed phrases (xê ra, về chỗ đi); **the rude, physical shove moves to a physical gesture**, the flick, where the direction of the hand is the direction of the stagger.

## 2. Assessment of each change
**Right click = step aside: good, and it fits the charter better than the present map.** Article 2 says Peak yields first; a single right click that makes it yield is the natural meaning, and it removes the chance of a fall from a casual right click (the shove can teeter or fall at a ledge end). The wait for a possible second click costs nothing if it overlaps the *notice beat* (Peak looks at the pointer for a few hundred ms before it moves): **act on the first click at once by starting the look; after about 250 ms decide: no second click, walk aside; a second click, go home instead.** A walk can be redirected, which a shove could not, so the objection of ADR-0109 (point 2, "push at once and upgrade") does not hold for a walk. *Cost:* the meaning of the single right click changes for anyone who learnt the shove; there are no known users beyond the author, and Stable 0.10.0 has the shove, so the Stable README line (right-click to push) changes only at the next Stable.

**Right double click = go to its place: reasonable as the second rung of "move".** One click, a little aside; two clicks, back to its place. *Cost:* a double right click is awkward on a trackpad (two two-finger taps), so the typed phrase stays the way for everyone, as ADR-0109 already says; and the place (ADR-0117) is a fraction of the room that defaults to 90% of the floor, so a person who never set a place sends Peak to the same right-hand end each time. *Note:* `seat_here` (this is your place) has no gesture; keep it typed.

**Slow stroke = scratch and rub: keep.** The detector already separates a stroke from a pass: a scratch needs three reversals of direction in 1.3 s; a single quick stroke has none. Adding a speed ceiling keeps the two apart when a fast scrub reverses three times by accident.

**A flick = the shove, staggering the way it was flicked: a good idea with one real danger.** The physical match (the hand goes right, Peak staggers right) is the most readable reaction on the list, and it keeps the "strong reaction" the charter allows (article 3: rare, with a cause, proportional, ends in recovery and warmth): the flick is the cause, the stagger is proportional to its strength, and the existing recovery and huff stay. **The danger is accidents (article 2).** Peak stands at the bottom of the screen, near the taskbar, and a person working moves the pointer fast across that area all day. A flick must therefore be a **deliberate strike, not a pass**:
- it begins near or on Peak, accelerates to a speed above a threshold (in sprite widths per second, not pixels, so that screens and scales agree), moves at least about a third of the sprite across it, and **ends or reverses within or just beyond the sprite** (a pointer that keeps going across the screen is a transit, not a strike);
- one flick, then a cooldown (the 2.5 s of the push is kept), and not while Peak is held, asleep, in Quiet mode, or flying;
- the strength (speed) chooses the size of the stagger; a flick toward a ledge end can end in the teeter or the fall that the push has today (a fall needs a cause: the flick is one).
**Technical limit found in the code:** the pet window receives the pointer only when the hit-test thread has made it catch the mouse; that thread looks every 150 ms and every 30 ms when the pointer is near the cat. A flick takes 50 to 100 ms to cross a sprite, so the page may get only two or three pointer events of it. The speed has to be read from Rust (the thread already reads the cursor each round) or from those few events; **the thresholds cannot be guessed, they have to be measured on the author's own hand and trackpad**: first a round that only *logs* the speed of every pass (numbers only, in `loop-trace.log`), then the thresholds, then the gesture.

**Left click = poke and left double click = talk: keep as they are.** (The poke waits 230 ms for a possible double click; unchanged.)

## 3. What I would add
1. **A speed band for the stroke** (gentle below a ceiling, a flick above a floor, nothing between): so a hurried scrub is neither a scratch nor a shove.
2. **Press and hold** on Peak without moving (about 600 ms): a purr and a lean into the hand. Gentle, warm, easy on a trackpad, where stroking is awkward. A new gesture is an ADR (the list is closed).
3. **A throw** (let go of a carry while the pointer is moving fast): Peak arcs and lands; the carry and the fall already exist and a throw is a cause. Fun but the riskiest accident (an ordinary drop at speed); later, and only after the flick has been calibrated.
4. **The gestures visible in Settings** (a read-only list rendered from `bindings.ts`, the one table), so that a person can find what exists; today only the tour and the one-time hint say it. The hint after repeated pushes (IM-4) becomes a hint about the flick, once.
5. **Not added:** the middle click and the wheel (nothing: they would fight with what is under Peak's window), modifier keys (a second layer to learn), a menu on Peak (ADR-0055).

## 4. What it costs
Small to medium: `bindings.ts` (the table and its tests), the right-click resolver (an immediate start with a decision after about 250 ms), a pure `flick.ts` with tests (samples in, direction and strength out), the shove taking a direction and a strength instead of the pointer side, three texts (the hint, the Settings list, `features.md`), spec 17 and an ADR. **Risks:** the accident rate of the flick (the calibration round is the answer), the change of the single right click for people who learnt it, and the 30 ms cadence of the hit test.

## 5. Choices asked of the author
The timing of the right click; whether to build the flick now or after a round that only measures speeds; the press and hold; the throw.
