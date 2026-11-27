# ADR-0154: Paws gets interaction first, with the two pictures it has; new art comes after and is drawn by the sticker session (DU-11)

- **Status:** (amended by ADR-0164, 2026-11-27) accepted on 2026-11-23 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). The author saw that Paws appears only in the side view and cannot be touched, and asked where its animations are in the plan; the answer was that no story held them. Each point was chosen from options.
- **Date:** 2026-11-23
- **Decided by:** Vinh (author)

## Decision
1. **A new story, DU-11, holds the look and the interaction of Paws.** It starts with **step 1, interaction, with no new picture** (the two pictures Paws has, front and side, and the bobbing); step 2 is new art; step 3 (climbing a window edge so that a scene does not depend on one floor) is decided after the author has tried the first two.
2. **Step 1 contains four things**, all chosen by the author: (a) a poke and a stroke get a reaction (a start, a wag; a double click still opens the box); (b) Paws can be dragged to another place and stands again when let go, as Peak does; (c) its head follows the pointer when it is near, and turns to Peak when Peak speaks or comes close; (d) the picture follows the direction (side view when it looks left or right, front view when it looks at the person), because the side view shown all the time is the lack of that rule.
3. **The new art** (a walk cycle, a stand, a sleep) **is drawn by the sticker session** from the reference sheet of DU-3, as the pets before it; the author looks at it in a test build before anything is committed (AGENTS rule 8). I write the request in a handoff when step 2 starts.
4. **Not decided:** the order of step 3, and whether Paws gets a menu (scenario 17 of `duo-appearance-and-scenes.md` says its menu has only the call of Peak).

## Why
Interaction needs no new art and can be tried in a build at once; the art waits for a person who draws, so it should not block what can already be seen.

## Rejected
- **New art first:** nothing to try while it is drawn. **Both at once:** the interaction would be tried against art that may change.

## Consequences
- Nothing is built by this ADR; the story is in `docs/plans/backlog.md` (DU-11). The built prototype notes already say Paws only bobs.
