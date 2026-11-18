# ADR-0137: The scratch has a speed ceiling, a flick quiets it, and a hard flick staggers wider

- **Status:** accepted on 2026-11-18 (the author: "continue E33" on the main branch; the three points are the open ends of IR-4b in ADR-0136). **The code is not committed until the author has looked at a test build** (rule 8: the stagger is a motion). Continues ADR-0136 and ADR-0133.
- **Date:** 2026-11-18
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
In the author's own session with the flick (26 flicks logged), 7 of the 9 scratches and rubs that Peak counted fell within a second and a half of a flick: a flick is made of fast strokes to and fro, and the scratch detector (`gestures.ts`: three reversals and 110 px in 1.3 s) cannot tell them from a rub. The measured rubs had a top speed of 600 to 1500 px/s over their strokes, the flicks 2000 px/s and more.

## Decision
1. **The scratch has a speed ceiling:** if the points of the last 1.3 s hold a stroke faster than **2000 px/s** (measured over 20 ms or more, never between two neighbouring events, whose time is not exact), the points are dropped and nothing is counted. A slow stroke is a scratch as before.
2. **A flick quiets the scratch and the rub for 1.5 s** (`FLICK_QUIET_MS`): the page takes the flick event as a fact (the program that sees it is strict, so the flicks it misses are still covered by 1).
3. **The power of the flick scales the stagger:** a flick (power 1) the usual stagger (9 px, 450 ms), a hard one (power 2, a peak speed of at least 3500 px/s) a wider and longer one (15 px, 560 ms). The push of a pointer on a sleeping or teetering Peak is unchanged. No setting: the charter allows few, and none for an amount of a behaviour.

## Consequences
`gestures.ts` (`SCRATCH.maxSpeed`, `peakSpeed`) with tests, `push.ts` (`staggerOf`, `FLICK_QUIET_MS`) with a test, the page (`shove(pointerDx, power)`, `wobble` with an amplitude, `lastFlickAt`). Not seen: whether a real scratch is ever faster than 2000 px/s on a trackpad (the measured ones were not), and how the wider stagger looks (the author looks at a test build).
