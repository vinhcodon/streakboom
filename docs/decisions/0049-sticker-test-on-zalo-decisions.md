# ADR-0049: The sticker test on Zalo: name, wording, expressions, measurement

- **Status:** accepted (answered by the author on 2026-11-10); nothing is built or submitted yet
- **Date:** 2026-11-10
- **Decided by:** Vinh (author), with Claude

## Context
`docs/handoff/sticker-test.md` proposes a free sticker set of the cat on Zalo to bring new users. Spec 06 section 7 matched the sticker expressions to the app's states and left nine questions open (section 7.5). The author chose among options on 2026-11-10.

## Decision
1. **Name:** "Peak" (consistent with ADR-0024), with Streakboom in the author name.
2. **Sticker 6 wording:** the sample line of spec 06 section 1.4, "Cái đó khó quá với một con mèo."; pose `sad`.
3. **Sarcasm on stickers:** none in the first set.
4. **Animated stickers:** decided after the static set shows results.
5. **No download numbers from Zalo:** accepted; measure by short link only and drop the "downloads" row.
6. **Sticker 3 (belly request):** keep the rolled-over cat as **sticker-only art**. Accepted knowing that the cat in the app has no such pose; the sticker set must not suggest the app does it (spec 06 section 7.2).
7. **Sticker 8 (nudge):** `curious`. **"Hungry":** dropped (charter, never starves).
8. **Stills:** drawn or generated outside the app, compared with a character sheet; no render tool, no app code.
9. **Install threshold:** 20 installs from stickers within 4 to 6 weeks after approval, else stop.

## Addendum (2026-11-10, after reading Zalo's guideline PDF)
- Zalo requires **12 to 20 stickers** per set, **360 x 360 PNG**, at most **4 words of text per frame**, flat design, and bans text about trademarks. The handoff's "8 to 12" and the sample line for sticker 6 (8 words) do not fit. Items 2 and 9 stand only until the author answers two new questions (the extra stickers to reach 12; a line of at most 4 words). See `docs/plans/sticker-test.md` section 2.
- Answered the same day: **E** rain and night become two stickers, plus one to three more from the spare states already in the app (`gasp`, `think`, `smirk`); rain stays sticker-only art. **F** sticker 6 gets a line of **at most 4 words** in the cat's voice; the author chose **"Quá sức mèo rồi."** (4 words, pose `sad`); item 2 above is replaced by this.

## Alternatives considered
Name another than Peak; sarcasm at about 14%; the render tool from the rig; the belly sticker redrawn from an existing pose (recommended, declined); thresholds of 30 or 50.

## Consequences and when to revisit
Spec 06 section 7.5 and `docs/plans/sticker-test.md` are updated. Step 0 of the plan is done; step 1 (verify Zalo's rules) is next and needs Vinh's Zalo account. Revisit the threshold if step 1 changes the route, and the sticker-only art if testers say the sticker cat and the app cat feel different.
