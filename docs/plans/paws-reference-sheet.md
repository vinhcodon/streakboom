# Paws, the dog: the reference sheet (first look)

**Status:** drawn 2026-11-15 by the sticker session for the request `docs/handoff/sticker-paws-reference.md` (ADR-0127, spec 19). **Only the sheet is drawn, no sticker**; the author looks at it first (256 px and 32 px, light and dark ground). Nothing is added to the app.

## 1. What is delivered
All in [`assets/paws/`](assets/paws/), built by `build_paws_sheet.py` (one command, no network):
- [`paws-reference-sheet.svg`](assets/paws/paws-reference-sheet.svg) and its render [`paws-reference-sheet.png`](assets/paws/paws-reference-sheet.png): the front view, the side view, what changed against the first drawing and the palette.
- [`paws-front.svg`](assets/paws/paws-front.svg) and [`paws-side.svg`](assets/paws/paws-side.svg): the two views alone (a 120 x 120 drawing space, the same as Peak's sheet).
- [`paws-check.png`](assets/paws/paws-check.png): **the check the author asked for**: both views at 256 px, 64 px and 32 px on a white ground (#ffffff), on #1e1f22 and on #2b2d31 (the chat grounds the first check used).

## 2. How each finding of the render check was answered
(`duo-paws-svg-check.md`, section 2.)
| Finding | What was drawn |
|---|---|
| The near-black body vanished on a dark ground | A **lighter dark tone** (#4b5160) and a **light rim line** (#e9eef5) round every dark shape; the shade for the ears and hind legs is #3a3f4b. On #1e1f22 and #2b2d31 the outline stays visible, also at 32 px (seen in `paws-check.png`) |
| The silhouette read like a penguin or a hamster | **Big ears** standing up with the tips folded over, a long white blaze and muzzle, a neck ruff, **hind legs** (haunches at the sides in the front view, four legs in the side view) and a **bushy tail with a white tip** |
| The front paws were two empty rings | **Real paws**: white feet with two toe lines, different from the white chest |
| Wrong `xmlns` | Every SVG here has `xmlns="http://www.w3.org/2000/svg"` |
Added so the face reads at a small size: two **tan brow spots** (a tri-colour collie), a small pink tongue and the same round eyes with two highlights as Peak. Peak's family look is kept (flat fills, a round mochi body, blush); the contrast is the colour and the character of the face (alert ears, a muzzle).

## 3. Rules kept
No arm strokes (paws on the body); no meme text; not Doge, Cheems or Kabosu; no name printed; CC BY 4.0 (ADR-0126); a Border Collie, black and white (the author may change it). The font is not used (no text on the sheet except the sheet's own notes).

## 4. What the author is asked
Look at `paws-reference-sheet.png` and `paws-check.png` and say: keep the dog as it is, or what to change (the ears, the colour, the face, the size of the tan spots, the tongue). **Only after he approves are the eight stickers of spec 19 section 3 ordered**, in Vietnamese, English and Japanese.

## 5. Not verified
- **Nobody has looked at it yet** (the author's look is the gate).
- The PNG renders were made with PyMuPDF, **not with Chrome**: a browser may antialias the thin rim differently. The `.svg` files were not opened in an `<img>` tag or in a chat app.
- The contrast of the rim against the grounds was judged by eye, not measured; the dark ground of other apps (Telegram, Zalo, Discord) may be darker or lighter than the two tried.
- The side view's legs (the near and far feet are close) may need a second pass.
- Whether the dog looks like a Border Collie to someone who knows the breed (the white blaze, the ears and the tan brows are the cues used).
