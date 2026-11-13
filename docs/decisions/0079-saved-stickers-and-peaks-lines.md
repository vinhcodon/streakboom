# ADR-0079: Saved stickers (kept by slug) and Peak's lines on the sticker page

- **Status:** accepted (inside the plan Vinh approved on 2026-11-13, plan v0.3 and v0.4; the choices below are the website session's and are for Vinh to look at); **built on 2026-11-13** (committed; live after the push)
- **Date:** 2026-11-13
- **Decided by:** Claude (the website session), within `docs/plans/sticker-page-plan.md`

## Context
The plan asked for favourites next to the recent row, kept by address and not by number (v0.3), and for several lines of Peak after a copy and when nothing is found (v0.4). The sticker itself is the button on the page and has no icon (ADR-0053), so a favourite needs another way to be chosen.

## Decision
1. **Saving is done from the line after a copy:** the confirmation carries a small button "♥ Save" (and "♥ Saved (undo)" when it is already saved), next to Share on a phone. No icon is added to the pictures. A saved sticker appears in a row "Saved" above "Used recently"; tapping a sticker in a row copies it again (and offers Save or undo).
2. **Both rows are lists of slugs** (the English address of a sticker, which never changes), in one key of the browser's local storage (`streakboom-stickers-mine`: `{v, recent, fav}`; at most 10 recent and 50 saved). The older lists (sticker numbers, per set, ADR-0060 and ADR-0073) are moved by slug once, when there is no new list yet, and then dropped. A damaged or blocked storage means an empty list, never an error.
3. **One line and one Clear** under the rows: "Saved and recent stickers stay in this browser only. Clear"; Clear removes both lists. The privacy line of the sticker pages says the same in three languages. Nothing is sent: the build still refuses any other use of storage, cookies, beacons or analytics in the page script.
4. **Peak's lines:** five lines after a copy in each language, chosen by the sticker and by how many copies were made in this visit (so the same sticker answers differently the second time), and a quiet line between 23:00 and 06:00 by the person's own clock; three lines for "nothing found" that change when nothing is found again, not on every key. They are replies and play (no need, no guilt, no health claim; the build's word checks read them). The confirmation is still a live region for a screen reader.
5. **The search hides the rows** while a query is typed and shows them again when it is cleared.

## Alternatives considered
A heart on every picture (an icon on 31 or thousands of pictures; the author dislikes icons on the pictures); a long press to save (clashes with the system's menu on a phone); a separate favourites page.

## Consequences and what is not verified
- A returning visitor with saved stickers sees the rows appear after the script runs, which moves the grid down once (a small layout shift for returning visitors only; a clean run has none).
- Checked in the built-in browser (Chromium): the move of an old list by slug, five different lines on repeated copies, Save and undo, the rows after a reload, the search hiding the rows, two different "nothing found" lines, Clear. **Not verified:** a real phone and the on-screen layout of two rows; Safari and Firefox; a screen reader on the new buttons and lines; the night line (not reached); that people find "Save" in the confirmation (it disappears after seven seconds: a moderated test, plan v0.7); the new Vietnamese and Japanese lines have no native reader.

## Sources
`docs/plans/sticker-page-plan.md` (v0.3, v0.4), spec 13 sections 2 and 5, ADR-0053, ADR-0060, ADR-0073.
