# ADR-0130: The sticker pages read the duo set after set-v2

- **Status:** accepted (the tags were chosen by the author on 2026-11-15 from a multiple choice; the publication itself is ADR-0129); **built, not published**
- **Date:** 2026-11-15
- **Decided by:** Vinh (author)

## Context
ADR-0129 puts four stickers of a new character, Paws (a black-and-white dog), with Peak on the sticker pages as normal stickers. They are in `docs/plans/assets/paws/set-duo-4/` (`vi/`, `en/`, `ja/` pictures named by the English slug, `manifest.json` with `slug_en`, `file`, text, title, alt, `reviewed`, no tags). The pages were built from one folder, `set-v2/`, whose pictures are named by number.

## Decision
1. **`scripts/site/stickers.mjs` has a list of extra sets** (`EXTRA_SETS`, today the duo folder). Their stickers follow those of set-v2, in the order of their manifest, and take **the next numbers** (35, 36, 37, 38). The number is in the address of the picture (`/assets/stickers/<lang>/35.png`) and **never changes once published**; the permalink and the saved stickers of a visitor go by the English slug (`one-is-off`, `stamped`, `one-pebble`, `our-secret`), which the manifest fixes.
2. **The build refuses** an extra set whose slug is not an address, whose file is not the slug, whose picture, text, title, alt or reviewed flag is missing in a language, whose licence or creator differs, or that has no font credit for a language. The tags are never read from an extra manifest (spec 13).
3. **The tags** come from the rules and `overrides.json`. The rules matched none of the words of three of the four captions (the fourth only by "winks" in its English alt), and the build refuses an untagged sticker, so the author chose **overrides by slug** (proposed tags): one-is-off = thinking + Work; stamped = firm + Work, Agreement (cheekiness 1 from the rule on "firm"); one-pebble = determined + Work; our-secret = playful (and happy, from the rules) + News and gossip. No word was added to `tag-rules.json`.
4. **The pages say one thing about Paws:** "A few of the stickers have Paws, Peak's dog." (a note above the licence, three languages) and, in llms.txt, "a few with Paws, Peak's dog". The name is not printed on any picture; nothing says this was a test.
5. **No test row, no change of order, no day-7 swap** (ADR-0129). `popular.json` is unchanged. The copy counter of ADR-0092 counts the four by their slug like any sticker.
6. **The Pages workflow also runs when the duo folder changes.**

## Consequences
- The English and Japanese lines of the four are AI-written and unread (`reviewed` false), as set-v2 (V-99, V-122): the pages keep their note.
- The page lists 38 stickers; `docs/plans/sticker-tags-proposed.md` is regenerated.
- **Not verified:** the pages in a real browser and on a phone (only the built-in browser was used); the legibility of D1's chestnuts and D2's stamp at 32 px; the counter Worker with the four new slugs (V-159); that the tags suit the pictures (the author can change them in `overrides.json`).
