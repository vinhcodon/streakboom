# ADR-0123: Peak prefers clear places: where it stands, it does not cover content (proposed)

- **Status:** proposed on 2026-11-15, **waiting for the author's choice** (the code of the first form is in the working tree from loop round 4 and was looked at by the author on a test build).
- **Date:** 2026-11-15
- **Decided by:** to be decided by Vinh (author); written by Claude (the app session)

## Context
The author's idea: Peak should lean toward places with enough empty room, so that it does not hide content. Loop rounds 4 to 6 (E29, `docs/engineering-log.md`) built a first form: `settle.ts` reads the picture of the screen (only which cells are empty), and when 30% or more of the cells under the cat's body are not empty it walks or hops once to the nearest place that is at most 15% not empty. It never goes down (a fall needs a cause, charter article 3), and it runs only with the screen picture on (Preview).

## Options
1. **Keep it as a Preview experiment** behind the screen picture switch, tune it for two more rounds, decide later (recommended).
2. Make it the way Peak behaves whenever the picture is on, with a back-off (at most one move a minute; none while the person types or the cat is being played with).
3. Drop it: the cat stays where the walks and perches leave it, and the picture stays only a view.

## Charter check
Article 2 (the attention is theirs: moving away from content is what it is for), 3 (slow, no sudden moves: the pace and the back-off matter), 4 (only emptiness is read, no meaning), manners 1, 3, 6. The risk is restlessness: a cat that follows every change of the screen. Hypotheses H27 to H30.

## Consequences
Whatever is chosen, the count of moves per five minutes stays in the loop trace so that restlessness can be seen.
