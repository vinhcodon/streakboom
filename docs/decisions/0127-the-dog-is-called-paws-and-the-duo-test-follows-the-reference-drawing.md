# ADR-0127: The dog is called Paws; the duo test starts only after the author has looked at the reference drawing

- **Status:** accepted on 2026-11-15 (the author's answers). Not legal advice.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Spec 19 plans a sticker test of a hard-working dog beside Peak (H33). The author chose the name Paws. A plain web search found no dog character or sticker line of that name, but it leads to Paws, Inc., the owner of the Garfield marks; Paws is also a very common word (`docs/plans/duo-paws-svg-check.md`). A registry search was not done.

## Decision
1. **The dog is called Paws.** The author chose to use it **without a registry search and to accept the risk**: a possible confusion with Paws, Inc. and the weakness of a common word. No trademark policy protects the name (ADR-0126), so anyone may use it too. The risk is written in `docs/plans/verification-debt.md` (V-161); the stickers do not have to print the name.
2. **The reference drawing of Paws is handed to the sticker session** (`docs/handoff/sticker-paws-reference.md`): a light rim or a lighter dark tone so that it reads on a dark ground at 32 px, bigger ears and a muzzle, real paws, legs and a tail, a correct `xmlns`. **The author looks at it at 256 px and 32 px on a light and a dark ground before anything else is drawn.**
3. **The duo test (spec 19) starts only after the author has approved the drawing**, and after the counting Worker has been checked (V-159). The eight stickers are then ordered from the sticker session and the website session informed (`docs/handoff/website-duo-test.md`).
4. **Not decided:** a dog in the app (spec 19, section 8). Nothing in the app changes.

## Charter check
No article is touched; the charter impact of a second pet is in `docs/plans/duo-charter-impact.md` and applies only if a dog is ever proposed for the app.

## Consequences
The test depends on one drawing the author has not seen yet; if he does not like it, nothing else is made. If a registry search later shows a conflict, the name changes before the stickers are published.
