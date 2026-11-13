# ADR-0085: The arrangement of the regions of the sticker pages (phone and wide screen)

- **Status:** accepted (Vinh chose the three options below on 2026-11-13); **built on 2026-11-13** (committed; live after the push)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author) for the options; Claude (the website session) for the numbers

## Context
The page has four regions: the search, the recent stickers (up to 10, only when there are some), Peak's picks (8, ADR-0084) and the full list (33). On a phone 360 px wide, by the CSS (not yet seen on a real phone), the two small rows wrapped to about 3 lines each and the list had 2 columns (17 lines), so the person scrolled about 6 lines before the full list, which was itself long. A finger swipes sideways easily; a mouse does not.

## Decision
1. **Phone (up to 639 px):** the recent row and Peak's picks are **one line each, swiped sideways** (tiles 88 px, scroll snap, the last tile cut at the edge to show there is more). They stay lists of real buttons, so a keyboard and a screen reader reach every tile. The full list has **3 columns** (tiles about 100 px; titles at .8rem, at most 2 lines; the title is still the accessible name of the button).
2. **Wide screen (640 px and more):** no sideways scroll; the rows wrap as a grid and the list fills the width as before.
3. **Boundaries, light:** every region has an h2; the full list gets one too, "All stickers (33)", with a thin line above it; 32 px between regions; no box or background per region. While a search is typed the two rows and the full-list heading are hidden (the count would be wrong).
4. **Order:** search, recent (only when there is something), Peak's picks, all stickers. A first-time visitor sees the picks right under the search; a returning one sees their own first.
5. **No sticky search on a phone:** the on-screen keyboard makes a fixed box jump. The confirmation after a copy was already a fixed box at the bottom of the screen, so it is seen wherever the tapped sticker is.

## Consequences
- The build checks the heading of the full list on all three languages.
- **Not verified:** all widths come from the CSS and the built-in browser at phone width, not from a real phone (swipe feel, whether the cut tile reads as "more", 3 columns with the on-screen keyboard open, Android and iOS); the Vietnamese and Japanese heading texts have no native reader.
