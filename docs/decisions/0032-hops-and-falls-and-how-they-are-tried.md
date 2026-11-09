# ADR-0032: Hops and falls move the window along an arc; a test build tries them from a temporary menu; a dropped Peak stays where it is

- **Status:** accepted (decisions); built (TE-7, TE-15) and released in 0.2.5; the author tried it on a test build on 2026-11-09 and said to go on
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude

## Context
The cat's sprite has a side and a front view only, so it cannot walk diagonally (spec/07 section 2.3). To leave the row where the user is typing (the typing lane, TE-12) it must change row, which takes a **hop** (a short arc) or a **fall** (gravity). No rule says yet when it should hop (that is TE-14), so a way to see the movement in a test build was needed. A third question: whether a Peak that the user lets go of in the middle of the screen should fall to the bottom of the work area.

## Decision
1. **How it moves.** The window follows a path computed by pure logic (`app/src/lib/hop.ts`): a hop is a parabola (the window rises above the straight line by 36 to 80 px, 380 to 800 ms, at most 240 px per hop; a longer way is a chain of equal hops); a fall is gravity (2600 px/s squared). The page asks Rust for each position about 60 times a second with `move_to` (TE-2), in a pose of the existing rig (the side view while hopping, the startled `gasp` while falling), and ends with the existing `land` squash. Being picked up during a flight ends it. A hop has no new art in this first version: the legs of the walk pose move while it is in the air, and whether that looks right is for the author to judge.
2. **How the author sees it.** A test build (cargo feature `hop-test`) adds three items to the pet's right-click menu: "Test: hop up", "Test: hop down", "Test: fall". A release build has no such items. The CPU of each kind is measured before the motion is committed as final, and the author looks at the test build first (the rule after the gait of 2026-11-08).
3. **A dropped Peak stays where it is.** Letting go of the cat in the middle of the screen does not make it fall: the user's choice of place is kept, as today. A fall is for later (when a window disappears under the cat, T5, level L3).

## Alternatives considered
A hidden developer hook only (the author could not try it; rejected); the cat hopping by itself while idle (it is a behaviour that belongs to the wander rules of later stories; rejected for now); a video made from the debugger for the author to watch (kept as a help, not as the way); falling to the bottom edge on a drop (more alive but it loses the place the user chose; rejected).

## Consequences
- TE-7 is built and measured; TE-14 (leaving the typing lane by a hop) can use `fly` once the author is happy with the look.
- A dedicated leap pose (legs stretched, no leg cycle) is a likely follow-up if the walk legs in the air look wrong.
- **Amended after TE-15 (2026-11-09):** the flight is played by a Rust thread from one path sent by the page (not one IPC call per frame), the cat is painted at the walking rate (30 a second) in the air and for 0.7 s after the landing, and the typing lane's cool-down is 10 s (the author chose it from 6, 10 and 15 s after a test session of 15 hops in two minutes). A hop now costs about 0.34 core-seconds, down from about 0.91.
- First measurement on 2026-11-09 (one machine, a test build with the debugger port on, so rough): a hop of 160 px, a fall of 300 px and a chain of two hops each cost about 0.5 to 1.3 core-seconds, close to a whole core while the flight lasts; the standing cat in the same run was at 14 percent of a core. Cheap in energy for the occasional hop, but a stutter risk on a busy machine, so TE-15 looks for the cost.
- Not verified: several monitors, hopping against the edge of the screen, a hop on a loaded machine, the look of the cat in the air at every frame (the screen capture was too slow to catch them all).
