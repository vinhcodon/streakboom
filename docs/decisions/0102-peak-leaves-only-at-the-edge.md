# ADR-0102: Peak leaves only at the edge: a trot, a deadline from the distance, and a stay when it cannot get there

- **Status:** accepted (the author chose each point on 2026-11-14 after seeing Peak vanish mid-screen on Stable 0.8.0); built on branch `vanish`, **not released, not yet seen** (V-132). Replaces the walk rule of ADR-0097 (a fixed 12 s, then hide where it stands).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Told "lượn đi", Peak walked at the ordinary pace (36 px/s) and gave up after a fixed 12 s by hiding the window **where it stood**. Any edge farther than about 430 px (most screens) was out of reach, so Peak vanished in the middle of the screen. The author saw it on 0.8.0.

## Decision
1. **Pace:** the walk to the edge is a trot at 110 px/s (`LEAVE_PACE_PX_S`, the pace Peak already uses to walk to a wall it will climb), with the usual ease-in.
2. **Time from the distance:** the walk may take `clamp(distance / 110 x 1.3 + 2 s, 6 s, 20 s)` (`leaveDeadlineMs`), where the distance is the room to the chosen edge, in logical px.
3. **If the edge is not reached in time, Peak stays** where it is, the leaving is cancelled and it goes back to idle. It never hides away from an edge. The goodbye line was already said and is not taken back.
4. **Counted when it has gone:** the `leave` counter moves from the moment the command is taken to the moment the window is really hidden, so a cancelled leaving is not counted.

## Consequences
- Half of a 1920 px screen (about 960 px) takes about 9 s; the longest allowed walk is 20 s.
- The edge is still the only place Peak disappears; the tray (Show) and the 20 minutes are unchanged.
- **Not verified:** all of it on a real screen, on two monitors and on a scaled display (V-132). The author looks at the build before it goes to Stable (AGENTS.md rule 8).
