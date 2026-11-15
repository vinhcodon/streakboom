# ADR-0129: The four duo stickers go up now as normal stickers; the duo test of spec 19 is not run

- **Status:** accepted on 2026-11-15 (the author's answers)
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by the sticker session

## Context
Spec 19 planned a test of eight stickers (H33) with two Peak stickers as a control. The author kept **four** (D1, D2, D3, P1; ADR-0131 for the look of Paws) and parked the other four. P1 lost its string of beads, so its caption no longer fitted the picture.

## Decision
1. **The four go up on the sticker pages now**, as normal stickers (the website session builds them from `docs/plans/assets/paws/set-duo-4/`, `docs/handoff/website-duo-stickers.md`).
2. **The duo test of spec 19 is not run.** With four stickers there is no control, so the decision rule of spec 19 section 5 cannot be applied. H33 stays untested; nothing in the app changes; a dog in the app is still not decided.
3. **P1's caption is changed to fit the picture** (Peak winks beside Paws): vi "Bí mật nha.", en "Our secret.", ja "ないしょだよ。" (slug `our-secret`).
4. The parked four (P2, S1, C1, C2) stay in `docs/plans/assets/paws/stickers-draft/parked/`, not published.

## Consequences
- The counters of ADR-0092 count the four like any sticker; `popular.json` is not changed by the test (there is none).
- Spec 19, H33 and the notes that said "eight stickers, a test, the name not chosen" are corrected to this.
- The en and ja lines are unreviewed (as V-99, V-122); the Worker (V-159) is still unchecked.
