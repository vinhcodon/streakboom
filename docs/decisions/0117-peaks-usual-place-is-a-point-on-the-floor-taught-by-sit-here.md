# ADR-0117: Peak's usual place is a point on the floor, taught by "sit here"; "go to your spot" walks there

- **Status:** accepted (the author chose both points from options on 2026-11-15); built on branch `vanish`, **not yet seen** (V-148). Replaces the "nods and stays" of ADR-0108 for `seat`. Rejected: learning the place from habit (a count of resting minutes in a 3 x 3 grid, spec 06 section 2.3), and teaching it by dragging three times.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
"Go to your spot" (về chỗ đi) only made Peak nod, because it had no usual place. The favourite places of spec 06 section 2.3 and TT-8 were designed and never built, so no data about where Peak rests has ever been collected; "when will it have enough data" had the answer "never, until it is built". The author asked for a place to go back to.

## Decision
1. **A place is one number**: how far along the floor of the work area, from the left end (0) to the right end (1). It is kept in `memory.json` as `seat` (an added field, null = not taught) and read with a default, so a changed resolution, scale or taskbar keeps its meaning. Until it is taught it is **0.9: near the right end of the floor**.
2. **It is taught by saying so**: "sit here" (ngồi đây, this is your spot, ここが定位置) where Peak stands keeps the place where it stands. Nothing is observed passively (no count, no habit data); the person decides. Settings, Memory shows the place and a button back to the default; "forget everything" removes it, "forget habits" keeps it (the person taught it).
3. **"Go to your spot" walks there**: down to the floor first if Peak is up on a window (the wall down, or a hop), then along the floor at the trot (110 px/s) to the place, and a nod. Only the floor, never a climb to a ledge (rejected: a place on a window, which moves). If it cannot (no room, a fall, taken over by something else) it only nods, as before.
4. **Two new verbs** join the closed list of skill steps (ADR-0103): `walk_home` and `save_seat` (nine in all). `seat` gets the steps `walk_home`, `pose nod`; the new skill `seat_here` gets `save_seat`, a line (two per language), `pose nod`. Both are table only, never named by the model (as `seat`).
5. Gates: `seat` (which now walks) is **not in Quiet mode**, not held, not in the air, not away, not leaving (it gains the Quiet gate, as `aside` has, because walking would wake a Peak that was asked to be quiet); `seat_here` moves nothing and keeps the old gates (not held, not in the air, not away, not leaving). A Peak that dozes is woken by `seat`.

## Consequences
- The floor walk does not need Peak's sight of the terrain (it uses the room to each edge, as making way does), so it works whatever the ground-map switch says.
- Several monitors: the place is a fraction of the walkable range of the monitor Peak is on when asked; it is not remembered per monitor.
- The favourite places of spec 06 (learned from habit) remain a possible later step, with its own ADR; this decision does not need them.
