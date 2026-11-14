# ADR-0112: The two small sticker rows on an upright tablet take the columns of the full list

- **Status:** accepted (Vinh asked for the tile of the two regions to be the size of the tile of the full list); **built on a branch, not published**
- **Date:** 2026-11-14
- **Decided by:** Vinh (author)
- **Amends** ADR-0085 (the arrangement of the regions)

## Context
On an iPad held upright (744 to 834 px) "Recently used" and "Peak's picks" were 4 tiles of 112 px by 2 lines: about 490 px in a 705 to 771 px column, so a quarter to a third of the width stayed empty, the two lines were short, and the right edge did not meet the full list below (4 columns of 166 to 182 px). The author found it short and unbalanced.

## Decision
1. From 690 to 853 px (where the full list has 4 columns) the two small rows use the very columns of the full list (`repeat(auto-fill, minmax(150px, 1fr))`): the tile is the same size (measured 168, 166, 179, 182 and 187 px at 744, 768, 820, 834 and 853 px) and both edges are straight with the list. Still 8 tiles: two full lines of 4.
2. From 854 px (where the full list has 5 columns, and 5 + 3 would leave a ragged line) the 8 tiles stand in **one line** that fills the width (87 to 92 px at 854 to 899 px, and 112 px from 994 px as before). This moves the old 900 px break to 854 px.
3. Unchanged: 640 to 689 px (4 tiles of 112 px; the full list has 3 columns there, no common tile exists), the phone (a line swiped sideways), and a desktop from 994 px.

## Consequences
- Seen in the built-in browser by measuring the tiles and edges at 744, 768, 820, 834, 853, 854 and 899 px; the recent row has the same rule as the picks row (the picks row, static, was measured; the recent row appears after a copy).
- **Not verified:** a real iPad (Safari), the look of 8 tiles of 87 px beside the 187 px of the list at 854 px, and the width band 640 to 689 px.
