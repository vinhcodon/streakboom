# ADR-0083: No permalink page per sticker and no story behind each sticker, for now

- **Status:** accepted (answered by the author on 2026-11-13 as multiple choice); **done** (nothing to build)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
Plan step v0.5 was a page and a share picture for every sticker (about 93 pages). Vinh asked why they were needed and how often people send a sticker by link; the website session answered that there is **no data** (the site counts nothing; Search Console is unread), that people in Zalo and Teams send the picture itself, and that a link matters for search discovery, for introducing the set and for a share picture of the one sticker. Vinh also raised the idea of a story behind each sticker (the history of a viral meme, a character, a whole set). The website session compared two kinds: Peak's own short story (owned, cheap, fits the charter, and gives a permalink page its own words) and the real origin of a viral meme (richer, but other people's property, hard to keep accurate, and with legal and quality cost).

## Decision
1. **No permalink page per sticker, and no Open Graph picture per sticker.** v0.5 is dropped from the plan. The sticker page stays one page per language (the hub with the search, the saved and recent rows).
2. **No story behind the stickers** (neither Peak's own nor the origin of a meme). The stickers stay a picture and its words.
3. **What this means for search engines:** the stickers are reachable only through the hub page; a sticker has no address of its own, and a link to the hub shows the hub's picture. The searching on the page (by meaning, any language) is not affected.

## Alternatives considered
A pilot of about eight permalink pages with Peak's note (recommended by the website session); waiting for data (moderated sessions about links, Search Console) before deciding; all 31 pages without stories (a thin-content risk); Peak's story for every sticker, real meme origins for a few, or both in two labelled layers.

## Consequences and when to revisit
- Spec 13 sections 4 (permalinks and tag pages) and the data model's `related` and `layers` stay as a proposal, not built; the plan's v1.3 (tag pages) depends on permalinks and is dropped with v0.5 until this is revisited.
- Revisit when there is data: Search Console showing that people search for these stickers, the first anonymous counts (v1.1), or the moderated sessions (v0.7) saying that people send stickers by link. The story idea can come back as its own decision, starting with Peak's own short note on a few stickers.

## Sources
`docs/plans/sticker-page-plan.md`, spec 13 sections 2 and 4, ADR-0077.
