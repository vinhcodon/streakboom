# ADR-0060: A smaller copy for chats, and a row of recently used stickers (kept in the browser only)

- **Status:** accepted (answered by the author on 2026-11-12); **built on 2026-11-12** (committed; the live behaviour is checked after the push)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The author pasted a sticker into Zalo and it worked, but the picture looked unusually large next to Zalo's own stickers. The site copies the PNG as it is (360 by 360 px); Zalo takes a pasted picture as an ordinary image message and shows it by its pixel size, so it is larger than a sticker. The author also asked for the stickers used last to be remembered and shown in a row on top, so that the same ones can be picked quickly.

## Decision
1. **The copy is 180 by 180 px** (changed to 128 on 2026-11-12, ADR-0074) (half of the page size). The page still shows 360 for sharpness. On a tap the browser shrinks the picture with a canvas (high quality, the transparency is kept; if anything fails, the original picture is copied), so the clipboard, and the file that Share hands over, are the smaller picture. No new file is shipped. The size is one constant (`COPY_PX`) that the build checks; if 180 turns out too small or still too large in Zalo, it is one number to change.
2. **A row "Used recently"** above the grid, up to 10 stickers (8 when first built; raised to 10 on 2026-11-12 at the author's request), the latest first, a **Clear** button. It is kept in the browser's local storage under one key, as the list of sticker numbers only (like `03`), written only after a copy (or a Share) succeeded. The row is hidden when empty and is built by the script, so with scripts off the page is unchanged. A sticker tapped inside the row keeps its place until the next visit (it would otherwise move under the finger). Numbers are the same in the three languages, so the row shows the stickers of the page's own language. A blocked storage (a private window) simply means no row.
3. **This overrules one earlier promise in part.** ADR-0053 said that nothing is stored. Now one list is stored, in the visitor's own browser, never sent: no cookie, no request, no counting. The sticker pages' privacy line says so in three languages, and the build check that banned local storage in `stickers.js` now allows it for this one key (read, write, remove) and still bans cookies, session storage, beacons, XHR, analytics and IndexedDB.

## Alternatives considered
A copy of 240 px (smaller change, may still look large); a size chooser (more interface on a short, gentle page); session storage only (the row is gone when the tab closes, so it helps nobody); no memory (keeps the old promise, but the author wanted the row).

## Consequences
- Visitors with a saved list see the row appear after the script runs, which moves the grid down once (a small layout shift for returning visitors only; a clean Lighthouse run has no list).
- A pasted sticker is still an image, not a Zalo sticker (ADR-0051).
- Not verified when this record was written: how the 180 px picture looks in Zalo (the author checks), Telegram, Messenger and on a high-density screen; the copy on iPhone Safari (the blob goes through a canvas inside the tap's promise); the row on a real phone; no native reader for the new Vietnamese and Japanese words (Used recently, Clear).

## Sources
ADR-0051, ADR-0053, `site/stickers.js`, the author's test in Zalo on 2026-11-12.
