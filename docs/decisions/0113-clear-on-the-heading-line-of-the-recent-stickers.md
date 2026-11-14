# ADR-0113: The Clear button is on the heading line of the recent stickers, and its note is smaller

- **Status:** accepted (Vinh chose it in the review of the sticker page on a phone, 2026-11-14); **built on a branch, not published**
- **Date:** 2026-11-14
- **Decided by:** Vinh (author)
- **Amends** ADR-0060 and ADR-0085

## Context
On a phone the region "Used recently" was three lines (the heading, the row, and the note "Recent stickers stay in this browser only." followed by the Clear button), while "Peak's picks" is two. The review of the page at 375 px found the rest balanced: both rows are in the first screen (the heading of the recent row at 311 px, the picks at 481 px, the full list at 627 px), the rows are the same tile (88 px, a fourth tile cut at the edge to show that it swipes), the grid has 3 columns of 108 px, and there is no sideways scroll at 320 and 375 px.

## Decision
1. **Clear** moves to the right end of the heading line of "Used recently" (the same button, the same id, the same behaviour). Its touch target is about 43 by 48 px without making the line taller.
2. The note stays, word for word, in a smaller size (`.82rem`, one short line), under the row. The promise it makes (recent stickers stay in this browser only) is not removed.
3. **Kept as it is (the author's choice):** the tile of the two small rows on a phone stays 88 px (the grid's 108 px would leave exactly three tiles and no sign that the row swipes).

## Consequences
- The full list starts 6 px higher; the region of the recent stickers is about 20 px shorter, close to the height of the picks.
- **Not verified:** a real phone (the 43 px target under a thumb, Safari), the Vietnamese and Japanese pages by eye (the same markup), a long Japanese note on 320 px.
