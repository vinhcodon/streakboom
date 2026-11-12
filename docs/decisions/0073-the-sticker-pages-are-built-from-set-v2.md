# ADR-0073: The sticker pages are built from set-v2 (31 stickers); the recent list is kept per set

- **Status:** accepted (the handoff `docs/handoff/website-stickers.md` and the author's earlier answer on the AI note decided it); **built on 2026-11-12** (committed; the live behaviour is checked after the push)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author) earlier for the note and the page's shape (ADR-0051, ADR-0053, ADR-0054, ADR-0060), the sticker session for the set; Claude (the website session) for the build

## Context
The sticker session finished `set-v2`: one list of 31 stickers (`docs/plans/assets/stickers/set-v2/`, `vi/`, `en/`, `ja/` with `01.png` to `31.png` and a `manifest.json` that is the single source of text, titles, alt text, the `reviewed` flags, the licence and the font credits). It replaces `set-v1` (20): two stickers are gone, 14 are new, several were redrawn, and **the file numbers changed, so a number does not mean the same sticker in the two sets**.

## Decision (done)
1. **The build reads `set-v2`** (`STICKER_DIR` in `scripts/site/stickers.mjs`, and the Pages workflow's path trigger). Nothing else needed to change: the page, the structured data (an `ImageGallery` of 31 `ImageObject`s per page), the image sitemap (93 `image:loc` entries), `llms.txt` and `llms-full.txt` (31, counted from the manifest) and the build checks already took the count and the order from the manifest.
2. **The note "the words were written by an AI and not read by a native speaker"** stays as the author decided for `set-v1` ("a small line, dropped by itself when the manifest says reviewed"): it shows on the English and Japanese pages (`reviewed: false`) and not on the Vietnamese one (`reviewed: true`).
3. **The list of recent stickers is kept per set.** The numbers of `set-v1` mean other stickers in `set-v2`, so a returning visitor would have seen the wrong ones. The page now carries the set's name (`data-set="set-v2"`, from the manifest's `version`); the list is stored under `streakboom-sticker-recent-<set>` and the old key is removed when the page loads (the old list is dropped, once). When a new set comes, the same happens. The build check on the script's local storage use now expects four mentions (read, write, remove, drop the old key) and the one key family.
4. **31 pictures in a grid:** the first 12 load at once (what a wide screen shows), the rest are lazy; every image has its width and height, so nothing moves. The grid stays two columns on a phone (at three the words on the stickers are too small to read). Total weight of the pictures per page: about 0.6 MB, loaded as one scrolls.
5. **`set-v0` and `set-v1` are not deleted** by this session: they belong to the sticker session's folder, and `set-v0` is where `site/assets/sticker-preview.png` came from (a copy is kept in `site/assets/`). They can be retired by the app session now that the page has moved.
6. **Measurement.** Nothing is added to the sticker pages. The only number is the downloads of the installer (ADR-0052, ADR-0053: a daily history); it cannot say that a download came from a sticker page. If the author wants to know that, the options (each with what it tells and does not tell) are the ones in ADR-0053; none was chosen here.

## Alternatives considered
Keeping the old key and mapping numbers between the sets (the sets are not a one-to-one map); three columns on a phone; showing all 31 eagerly (about 0.6 MB at once); a short list of the first few and a "show all" button (one more tap on a page whose point is to pick one quickly).

## Consequences and what is not verified
- The social preview picture (`site/assets/sticker-preview.png`, a collage of nine stickers made from `set-v0`) now shows older drawings of some stickers. It is still a fair picture of Peak; a new collage from `set-v2` would be better and is for the sticker session or the author to ask for.
- Checked on a built copy in the built-in browser (Chromium) on 2026-11-12: 31 stickers on each page, no broken image, no horizontal scroll at 375 px, the copy at 180 px, the recent list under the new key, the old list dropped. **Not verified:** the real-device checks of the sticker session's handoff (section 7), which are the author's: copy and paste into Zalo on a computer and on a phone, Telegram, Messenger; tap-to-copy on Android and iPhone; Share with Zalo and Telegram; the long press on an image inside a button; the dark theme on devices; the English and Japanese words (no native reader); Lighthouse on the 31-sticker pages (to measure after the deploy); the page in Safari, Firefox and Edge.

## Sources
`docs/handoff/website-stickers.md`, `docs/plans/assets/stickers/set-v2/manifest.json`, `docs/plans/sticker-list.md`, ADR-0051, ADR-0053, ADR-0054, ADR-0060.
