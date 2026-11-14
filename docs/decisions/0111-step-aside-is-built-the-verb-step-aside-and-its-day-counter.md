# ADR-0111: Step aside is built: the verb `step_aside`, the gates it really has, and the day counter `aside`

- **Status:** accepted (the author ordered the work, "Làm IM-3", on 2026-11-14); built on branch `vanish`, shipped in Stable 0.10.0; **seen working by the author on a desk** (Preview 0.9.6, and the hint in 0.9.8); the cases with no room, asleep and two monitors are not yet seen (V-140). Builds ADR-0109 and ADR-0103.
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
ADR-0109 decided the double right click and the skill `aside`, and said the verb needs its own ADR as every verb does (ADR-0103). Building it showed two small points the earlier text did not settle.

## Decision
1. **A seventh verb, `step_aside`**, joins the closed list (`say, pose, wait, walk_to_edge, step_aside, hide, count`). It asks the page to walk **away from the pointer** along the surface Peak stands on, the way it already makes way (`walkPlan`, ending when the pointer is `LEAVE_PX` away), or to **nod and stay** when there are fewer than `LEAVE_MIN_ROOM_PX` of room on that side. It reports whether it moved; a `false` stops the skill, so nothing is counted when it only nodded. It never hides the window and never falls. A sleeper wakes first.
2. **The skill file `aside.skill.json`** has the steps `step_aside`, then `count aside`; its phrases are table-only (never named by the model, so Rust does not list it, as for `seat`).
3. **Direction:** the side of the cat the double click was on decides (pointer right of the middle: walk left). Typed, it uses where the pointer last was, and failing that the side with more room.
4. **The gate `not_quiet` is kept**, against section 4 of spec 17, which said it works in Quiet mode: in Quiet Peak sleeps, and walking would mean waking it, which the person asked it not to do. Quiet stays quiet; the typed phrase and the click then do nothing, and the plain right click does not either (it already refuses in Quiet).
5. **The double right click falls back to the push** when a gate refuses step aside or a panel is open, so a double click is never dead; the push has its own gates.
6. **A day counter `aside`** is added to the per-day record (an added field with a default of 0; the old builds ignore it, ADR-0090). Like `leave` it is counted apart and is never a Bond Days input.
7. **The cooldown (2.5 s) is shared** with the push (`lastShove`).

## Consequences
- The hint after repeated pushes (IM-4) is built after this ADR: three pushes within 25 s, once in a lifetime, kept in `said.hintaside` (an added key of an existing map); using step aside first marks it as said.
- The hop to another row, named in spec 17 section 4 as a second choice, is **not built**: with no room Peak nods. It can be added if the author sees it needed.
- The walk ends on the pointer's distance, so a still pointer at the cat makes a walk of about 260 px; on a short seat it stops at the end of it.
