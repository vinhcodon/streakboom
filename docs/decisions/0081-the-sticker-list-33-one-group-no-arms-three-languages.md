# ADR-0081: The sticker list: 33 stickers in one list, no categories, no arms, three languages

- **Status:** accepted (decisions answered by the author between 2026-11-10 and 2026-11-13); the sticker page is built by the website session
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), with Claude (the sticker session)

## Context
ADR-0049 to ADR-0051 set up the Zalo-less sticker test, the second pass and the web page. Afterwards the author sorted the stickers into three categories (cute, friends, office), drew about forty new ones, then chose a shortlist, dropped the categories and added two meme stickers. The record of those choices was only in `docs/plans/sticker-list.md`.

## Decision
1. **One list, no categories.** 33 stickers in one group; the order keeps similar ones together only for the eye. The manifest has no category, group or tab.
2. **Never draw arms** on Peak in a sticker (paws on or at the edge of the body, props, marks or the face only).
3. **The list** is the one in `docs/plans/sticker-list.md` (17 from the first set, 16 new); the stickers not chosen stay as drafts for a later pack.
4. **Three languages for all 33** (Vietnamese, English, Japanese), with a manifest as the single source of text, title, alt and a `reviewed` flag; the English and Japanese lines are AI-written and not yet read by a native speaker.
5. **Two meme stickers:** "Ờ mây zing, gút chóp!" (Binz, Rap Việt 2020; star-shaped eyes and golden rays, option A2) and "Ý kiến hay." (a flat unimpressed face taken from a picture the author sent, with a dull lightbulb, option Y2). They are the cat's own pictures, not likenesses.
6. **CC BY 4.0, Copy-only web page** as in ADR-0051; set-v2 replaces set-v1 when the page moves.

## Alternatives considered
Three packs of twenty; a Share or Download button on every sticker; sticker 03 with other poses; arms for the gestures (all rejected by the author after seeing them).

## Consequences
The website page must show 33 and has no tabs. The Zalo route (ADR-0049) would need the list split into sets of 12 to 20. The meme origin was read from news articles, not the video (V-122). Revisit when a native speaker has read the English and Japanese lines.

## Addendum (2026-11-13)
Vinh asked for a "No idea" sticker, which the list lacked; "Không biết nha." (an empty thought bubble above a blank face) was added after "Để mình nghĩ…", so the list is **34**, not 33 (the file name of this ADR keeps the number it was written with).

## Addendum 2 (2026-11-13)
"Tuyệt vời!" (sunglasses, a toothy grin, a thumbs-up at each side; the first sticker with teeth) was added after "Ờ mây zing, gút chóp!": the list is **35**.
