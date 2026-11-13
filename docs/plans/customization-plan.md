# Customization: the order of work, cheapest first, to settle H23 and H24 before anything is built

**Status:** proposed 2026-11-13, **waiting for Vinh**. **Reordered 2026-11-13 (ADR-0088):** the author does not intend to test with people now, so the steps that ask people (C1's question in the alpha form, C3, the demand readings) wait for the alpha; C0 is done and C2, the palette proof for the author alone, can come first once he approves it. Spec: [`../../spec/15-customization.md`](../../spec/15-customization.md). It follows [`adaptive-peak-plan.md`](adaptive-peak-plan.md) in priority: the adaptive steps S0 to S3 are first, and these steps ride on the same alpha. **No app code is written until Vinh approves the step that writes it.**

The two hypotheses to settle first (the handoff's H1 and H2): **H23** (enough people want a skin other than the default) and **H24** (a palette skin is much cheaper than a new character).

| Step | What | Code? | Cost | What it tells |
|---|---|---|---|---|
| **C0** | **H24 on paper.** Read the code for every colour and every anchor. **Done 2026-11-13** (spec 15 section 2): one file, `draw.ts`, about 18 places, no change to the rig; the anchors exist in every pose. | No | done | **H24: supported on paper.** Still to be seen on a screen (C2). |
| **C1** | **Demand, with no code.** Add one optional question to the S0 phrase survey (question 8: "if you could change one thing about how Peak looks, what?" with colours as examples) and ask the alpha people which two colours they would pick. Also: Vinh draws the pink, purple and dark versions of the character sheet (`docs/plans/assets/sticker-character-sheet.svg`) for a look, and checks the contrast of the cheeks and nose by eye. | No (a design asset only) | an hour for the question; an evening for the three sheets | **H23's first reading** and which skins to build first (Q3) |
| **C2** | **The palette proof, for the author alone (needs Vinh's approval to code).** The six constants and the inline colours become a `Palette` parameter; a dev switch picks pink, purple, dark; a pixel comparison proves the default is unchanged (CU-1, CU-2); a contrast test over all palettes. | Yes: `draw.ts`, a new `skins.ts` and tests | about 2 days | **H24 on the screen**, and the default is proved unchanged |
| **C3** | **Demand in the world.** The sticker variants in the new colours (CU-6) on the sticker page as a choice, and the question to the alpha people about the colour of the real Peak. The website session builds the page part. | Assets; the page by the website session | a week of the sticker session's time | **H23** with more people than the alpha (counts only, as on the page today) |
| **C4** | **Ask once in the app** (the choice card with swatches, in the unprompted slot), after C1 to C3 have answered; counts of "chosen" and "not now". | Yes | 1 to 2 days | H23 inside the product |
| **C5** | **One accessory and its CPU A/B.** One piece on the head anchor, looked at in every pose by the author; CPU of "none" and "worn" by the recipe in the engineering log. | Yes | 2 to 3 days | **H25** |
| **C6** | **The dryness dial, internal.** The selector weight and a second persona layer; heard by the author in the three languages; Bond Days compared (H26) only if the alpha has enough people. | Yes | 2 days plus listening | **H26** |

## Why this order

- C0 is already done and answers the "is it cheap" question without a line of code.
- C1 asks the only thing that can kill the idea (nobody wants it) before any work, using a survey that is being sent anyway.
- C2 is the first code and is small and reversible; C3 and C4 only after demand shows.
- Accessories and the voice dial come last; they are the most expensive and the most likely to disturb the budget or the character.

## Dependencies with the adaptive work

The colour question can be asked **in words** by a skill (spec 14, a closed list entry), but the skill list starts with "Lượn đi" only (A4), so C4's card comes first. Both reuse the same `ask`/choice card and the same unprompted slot; they must share the weekly limit of suggestions (spec 14 section 8) or Peak would ask too often.

## Not in this plan

Content from users, paid skins, Personality Packs, a new character, a Settings page of looks.

## Risks

- **A pink fur may hide the cheeks and the nose.** The contrast test exists for this; the default palette must also be proved unchanged.
- **The sticker colours and the app colours drift apart.** Three more files hold the palette (`build_stickers.py`, the character sheet, `gen-assets.html`); a skin has to be defined once and read by all, or by a check.
- **Demand from a small alpha is a reading.** 5 to 8 people cannot show demand; C3 widens it.

## Not verified

The estimates are guesses until C2 is done; nothing has been seen on a screen.
