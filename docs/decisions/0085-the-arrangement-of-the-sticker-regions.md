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

## Amendment (2026-11-13, after Vinh saw it)
Vinh saw three faults: the tiles of the recent row and of Peak's picks had different sizes on a wide screen (84 to 100 px and 108 to 124 px); a full row of 8 or 10 wrapped to a second line with one tile; and a desktop window narrowed to phone width showed a sideways scroll bar, which looks bad. Now: **one tile size for both rows** (up to 112 px, same on a phone: 88 px); **from 900 px 8 in one line, from 640 px 4 by 4** (8 is two full lines, never an orphan); the recent row **shows its first 8 on a wide screen** (10 are still kept and all 10 are swiped on a phone); the **scroll bar of the sideways line is hidden** (the cut last tile is the cue; a touch screen has no bar anyway). The tiles of the full list stay as they were.

## Amendment 2 (2026-11-13, Vinh: people come back often to pick their favourites)
On a phone the recent stickers and Peak's picks should come up the screen. The order stays (search, recent, picks, all). The head of the page is tighter on a phone **for everyone** (not only for returning visitors: hiding it with a script would move the page while it loads): smaller title (1.5rem), the lead at 1rem, less space above and between, 20 px between the regions. Vinh chose this over moving the search below the rows or leaving it. Seen at 375 x 812 with recent stickers: the recent row at 374 to 500 px, picks at 576 to 703 px and the heading of the full list at 723 px, all on the first screen (before: the recent row started about 80 px lower and the picks touched the bottom). A phone 667 px high (estimate, not seen) still cuts the picks.

## Amendment 3 (2026-11-13, Vinh asked whether the phone menu should fold; he chose to keep the line)
No hamburger: four links are too few to fold, and folding hides the Stickers link behind a tap (ADR-0053 keeps the menu at four). Instead the four links now fit a phone **from 360 px in all three languages with no fade at the right edge**: the gap between links is 0 (it was 4 px; the Vietnamese line was 8 px too long at 360 px) and the fade and the swipe stay only for a window under 360 px. Measured at 360 px: the line is as wide as its box in English, Vietnamese and Japanese, and no mask is applied.

## Consequences
- The build checks the heading of the full list on all three languages.
- **Not verified:** all widths come from the CSS and the built-in browser at phone width, not from a real phone (swipe feel, whether the cut tile reads as "more", 3 columns with the on-screen keyboard open, Android and iOS); the Vietnamese and Japanese heading texts have no native reader.
