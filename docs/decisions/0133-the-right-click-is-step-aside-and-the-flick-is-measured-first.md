# ADR-0133: The right click is step aside, the double right click is its place; the flick for the shove is measured first

- **Status:** accepted on 2026-11-16 (the author's answers to the proposal `docs/plans/input-map-revision.md`). **Amends ADR-0109** (the map of the right button) and spec 17. The code is written and tested (a dev run showed both gestures), **not committed until the author has looked at a test build** (rule 8).
- **Date:** 2026-11-16
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Decision
1. **The right click is `step_aside`** (it was the shove). Peak looks at the pointer **at once** (the first click); after 250 ms, if there was no second click, it walks aside; the wait overlaps the look and is not felt. A walk can be redirected, which a shove could not, so ADR-0109's objection to "act at once and upgrade" does not hold here.
2. **The double right click is `seat`** (go back to its place; it was `step_aside`). The typed phrases of both stay (xê ra, tránh ra, ...; về chỗ đi, ...).
3. **The shove has no gesture for now.** It waits for the flick: a fast, decisive stroke across Peak that staggers it the way it was flicked. **It is not built yet: first a round that only measures** (E33): every pass of the pointer over Peak is written as numbers (`pass n= ms= path= vmax= vavg= rev= dx= dy= w=`, a test build only) so that the thresholds come from the author's hand and trackpad, not from guesses. The danger to design against is an accidental flick when the person moves the pointer fast near the bottom of the screen (charter article 2): a flick must be a strike that ends on or just beyond the sprite, not a transit.
4. **Slow stroking over the head or the belly stays the scratch and the rub**; a speed ceiling for it comes with the flick. **Left click is the poke, left double click is the chat (talk), the drag is the carry:** unchanged.
5. **Later, in this order, each its own decision:** press and hold (a purr, for trackpads), a throw on release, and a read-only list of the gestures in Settings. Not added: the middle click, the wheel, modifier keys.

## Consequences
`bindings.ts` (the table and its tests), `clickresolver.ts` (an `onFirst` call), the page (`rightClicks`, `startSeat`, `stepAside` accepts the look), `pass.ts` (the measurement). The hint after repeated pushes (IM-4) has no push to count until the flick exists. The Stable README and `docs/features.md` keep describing the Stable behaviour until the next Stable.
