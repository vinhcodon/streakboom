# ADR-0084: The editorial row "Peak's picks" on the sticker pages

- **Status:** accepted (Vinh approved the list on 2026-11-13: "duyệt"); **built on 2026-11-13** (committed; live after the push)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author) for the list; Claude (the website session) for the name and the way it is shown

## Context
Plan v0.8: until the anonymous counting runs, a row that shows a few stickers first, chosen by hand (the HOT list needs data: ADR-0077 and the open question about how to count). Vinh approved eight stickers.

## Decision
1. **The list** (`scripts/site/catalog/popular.json`, by English address, in this order): thank-you, ok, good-morning, sorry, congrats, haha, friday, deadline. It is Vinh's choice, **not a count**. The build refuses a list with fewer than 4 or more than 12 stickers, an address that is not a sticker of the set, or a sticker twice, and checks that each sticker page shows exactly this list, in this order.
2. **The name is "Peak's picks"** ("Peak gợi ý", "Peakのおすすめ"), **not "Popular"**: with no counting, "popular" would claim a measurement nobody made. When real counts exist the row can be renamed or replaced by the HOT list.
3. **It is in the static HTML** (no script needed), as the same buttons as the grid (the picture is the button, copy and the rest work the same), above the grid and below the recent row; it is hidden while a search is typed and shown again when the box is cleared. It adds no layout shift.

## Alternatives considered
The name "Popular" as asked; a row built by script from the list (a shift for every visitor); putting the row above the recent row; more than eight stickers.

## Consequences and what is not verified
- Checked in the built-in browser (the row, the search hiding it, 33 stickers in the grid) and with Lighthouse on this machine (layout shift 0.000, accessibility 100; the performance numbers moved between 87 and 99 between runs because the machine is noisy, so a clean-runner measurement is still to do).
- Not verified: a phone (the row wraps to three or four per line); that these eight are the ones people use most (a guess, no data).

## Sources
`docs/plans/sticker-page-plan.md` (v0.8), ADR-0077, ADR-0082.
