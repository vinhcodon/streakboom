# 15. What Peak can change in itself: colour, accessory and voice (after the adaptive turn)

**Status:** **draft for Vinh's review, 2026-11-13.** A hypothesis, not a plan to build; **nothing here may be coded until Vinh approves each item.** Source: [`../docs/handoff/customization-hypothesis.md`](../docs/handoff/customization-hypothesis.md) (committed 2026-11-13; its status note says it is the base, adjusted by the adaptive handoff). Companion: [`14-adaptive-peak.md`](14-adaptive-peak.md) (how Peak notices and suggests; this spec fills its section 7.3). Plan: [`../docs/plans/customization-plan.md`](../docs/plans/customization-plan.md).

**Numbering.** The handoff asked for `spec/08-customization.md`. `spec/08` is taken (perception), `13` is the sticker page and `14` the adaptive Peak, so this is **spec 15** (Vinh may renumber).

## 1. What survives from the handoff, and what the adaptive turn changes

| Handoff idea | Now |
|---|---|
| One Peak, three layers of surface: colour (skin), accessory, voice | **Kept** as the store of what Peak can change in itself. |
| The person chooses in Settings | **Dropped** (adaptive A1, ADR-0080). Peak proposes, or the person asks in words (a body-language skill of spec 14); nothing is added to Settings. |
| R4, a dial of "dryness" | **Kept only as an internal mechanism** Peak moves itself; never a Settings control (the charter forbids a setting for an amount of behaviour). The existing `gentle` tone stays (it is a value Peak cannot infer). |
| No content from users, no Personality Packs, nothing sold | **Kept**, unchanged. |
| H1 to H4, R1 to R6 | Registered as **H23 to H26** (the register already has H1 to H16 and the adaptive hypotheses H17 to H22) and renumbered below as **CU-1 to CU-6**. |

Invariants (not customizable): the name and identity of Peak, its memory of the person, how Bond Days are counted, the privacy promises, and the rules of the charter. A skin never changes the shape, the proportions, the expressions or the movement.

## 2. What the code is (answers to section 9 of the handoff, read from the code at 0.4.2; nothing was run)

### 2.1 Where the colours are (item 1)

All of Peak's drawing is **one file, `app/src/lib/rig/draw.ts`** (262 lines). A search of `app/src` for the cat's six core hex values finds them nowhere else. The other hex values in the app (`routes/bubble/+page.svelte`: `#f3f1ea`, `#f4b942` and friends) are the bubble's paper, not the cat.

| Where | Colours |
|---|---|
| Constants at the top, lines 6 to 11 | `FUR #f6c26b`, `DARK #e9a94a`, `BELLY #fff1d6`, `PINK #f4a7a7`, `INK #2b2220`, `MOUTH #7a4b3a` |
| Written inline in the drawing functions | `#fff` (the two eye highlights, lines 75 and 76); `#d9696f` (the inside of the mouth, lines 122 and 139); `#f59e9e` (the cheeks, line 214); `#e8828a` (the nose, line 215); `#8ecae6` (the sweat drop, line 219); `#8a8a8a` (the thinking dots, line 240); `#6b7cff` (the sleeping "z", line 244); `#000` at 8 % (the shadow, line 166) |
| Derived | the shading of the legs mixes `FUR` and `DARK` (`mixHex`, line 44) |

So the handoff is right: changing the palette is **not** only changing the constants at the top. But it is **one file and about 18 places**, no place outside it. The cost of a palette is small: turn the constants and the inline colours into a `Palette` object passed to `drawBody` and `drawFx` (the functions already take a frame `f`). **Idle cost does not change** if the palette is built once, not per frame.

Outside the app, the same colours live in three more places that a skin would have to follow for the sticker variants (CU-6): `docs/plans/assets/stickers/build_stickers.py`, `docs/plans/assets/sticker-character-sheet.svg` and `scripts/gen-assets.html` (the icons).

**Contrast rule needed:** the cheeks, nose, inner ear and mouth must stay visible against the fur. Measured as a ratio of luminance or a colour difference in a unit test over every palette; a pink fur with a pink cheek disappears (the handoff's warning, section 5).

### 2.2 Anchors for accessories (item 2)

There are not "front and side views" in the code as the handoff says (that was true of an older rig). There is **one drawing**, mirrored when the cat faces left (`flip` in `scene()`), and every pose is a set of numbers (`Key` in `rig/keys.ts`, blended in `engine.ts`) that moves the same parts. The parts an accessory can hang on exist **in every pose by construction**:
- **The head** is an ellipse `k.head {x, y, rx, ry}` drawn inside a transform that tilts it (`f.roll`) and nudges it with the gaze. Anything drawn inside that transform (after the head, before the eyes or after them) follows the head in every pose, including sleep, the lean and the hop. A hat sits at `(x, y - ry)`; glasses on `k.eyeL` and `k.eyeR`; a headband across the head ellipse.
- **The ears** are triangles `k.earL`, `k.earR` (three points each) with an alpha that fades them in some poses. Anything on an ear must use that alpha.
- **The neck does not exist.** The head and the body are two ellipses. A collar or a bow would use the gap between the bottom of the head (`y + ry`) and the top of the body (`k.body.y - k.body.ry`), computed each frame; it follows the blend automatically.
- **Not seen:** how any of this looks in `peek`, `teeter`, `ledge`, `climb`, `cling` (the poses with a rotated body) and while held. Each needs a look in a test build; this is what the plan's accessory step must check.

Cost of one accessory: 15 to 40 lines of canvas drawing in `drawBody`, drawn only when worn, so **no cost when nothing is worn**; when worn, a few more canvas operations per painted frame. The CPU must be measured with the engineering log's recipe before any claim (an A/B of "none" and "worn").

### 2.3 The data of a skin (item 3)

A pure, versioned TypeScript module released with the app (`skins.ts`, with a test file), never read from disk or from the person:

```
{ id: "mochi", v: 1,
  name: { en: "Mochi", vi: "Mochi", ja: "もち" },
  colors: { fur, dark, belly, pink, ink, mouth, tongue, cheek, nose, sweat, dots, z },
  accessory: null | "bow" | ... }
```

`settings.skin` (a string id, default `"mochi"` = today's colours exactly) and `settings.accessory` are saved with the rest and **validated at load**: an unknown id falls back to the default. The names are in the three languages (the `ui.test.ts` rule that every language has every string). No code and no image come from the person (CU rule: no user content).

### 2.4 The voice: what "gentle" does (item 4)

`gentle` is a **boolean** setting. In the scripted lines `selector.ts` drops every line marked `spicy` when it is on (`!(ctx.gentle && l.spicy)`); in the brain `brain.rs` adds the layer `persona/gentle.md`. About 14 % of the lines are sarcastic today; a test keeps the sarcasm between a few lines and 40 % (spec 03). So the cheapest "dryness" is a **weight** on spicy lines in the selector (more or less likely), not new lines, and a second persona layer for the brain; the selector and the context cards (`lines.ts`) would only get a number. A graded dial still needs the author to listen to the result in all three languages.

### 2.5 The dry expression (item 5)

The half-lidded look **already exists**: the poses `huff` (flinch, half-lidded glare) and `smirk` are in `LOOKS` (`engine.ts`). A dry voice does not need a new expression to start; a lopsided smile would be a new mouth state (`Mouth` has `smile open flat o yawn`).

### 2.6 Memory and Bond Days (item 6)

A change of skin or voice is not counted in Bond Days. Whether Peak "notices" a new look (a line about it) is a character decision for Vinh; the safe default is that it does not remark on it, and a new-look line would have to pass the banned-patterns test.

## 3. Hypotheses

| Register | Handoff | Statement | Refuted if | Threshold |
|---|---|---|---|---|
| H23 | H1 | Enough people want a skin other than the default to make it worth building | few people choose or ask for another skin when it is shown | Vinh, with a baseline |
| H24 | H2 | A palette skin is much cheaper than a new character | the colour is scattered through the drawing, or the rig needs many changes | **Answered on paper, 2026-11-13: supported.** One file, about 18 places, no change to the rig (section 2.1). Still to be seen on the screen. |
| H25 | H3 | Accessories raise attachment or demand without breaking the rig | they need rig changes or push CPU or RAM over the budget | Vinh; CPU by A/B |
| H26 | H4 | A dial of dryness lets people pick a voice that suits them without lowering Bond Days | the dry group has clearly lower Bond Days, or hides Peak more | Vinh |

H23 and H24 are the cheap ones. H25 and H26 wait for them.

## 4. How Peak offers a change (the adaptive way)

- **Colour.** A taste cannot be read from behaviour, so Peak **asks once**: a choice card with three or four swatches (reusing the card of the tour), in the unprompted slot, in `free` or `play` mode, not before the person has used Peak for some days. "Not now" is respected and the question is not repeated for a long time. The person can also say it in words ("đổi màu hồng đi"), which is a body-language skill of spec 14 (Peak changes its own look), costing one entry in the closed list.
- **Accessory.** Offered after a milestone or when the person's behaviour fits (for example it is dropped in the same corner often), always as a question; worn at once on yes; removed by words or one click.
- **Voice.** Peak never changes its voice silently (the declined shoo, ADR-0047). It may **ask**: "Muốn em nói gọn hơn không?" after the person has hidden it or put it in Quiet mode several times. A yes moves the internal dial.
- **Seeing and undoing.** What Peak has changed about itself is listed in "What the pet remembers" with a Forget that restores the default (A6).

## 5. Requirements (CU-1 to CU-6, from the handoff's R1 to R6)

| ID | Requirement | Accepted when |
|---|---|---|
| CU-1 | Skins as a pure palette applied to **every** colour, including the inline ones | the default palette draws exactly the same picture as today (a pixel comparison of every pose); a test of contrast over all palettes |
| CU-2 | The default is unchanged | a person who does nothing sees no difference |
| CU-3 | Accessories on the head anchors (3 or 4 to start) | looked at in every pose by Vinh in a test build; CPU A/B inside the budget; nothing drawn when not worn |
| CU-4 | An internal dial of dryness | weights in the selector and a second persona layer; the sarcasm test still passes; heard by Vinh in vi, en, ja |
| CU-5 | Counts only, opt-in: which skin, whether an accessory, the level of the dial | in "Copy stats"; no content |
| CU-6 | The sticker variants follow the skin | the variants are built from the same palette; the choice of a variant on the sticker page is a demand signal (website session) |

## 6. Constraints

RAM 120 MB, idle at about 0 % CPU (a skin costs nothing at rest; an accessory is measured). No content from users. Nothing sold; whether skins or accessories are one day paid is not decided (the requirements draft's F3 puts accessories first, if anything is sold). Privacy: counts only.

## 7. Open questions (recorded; Vinh decides, nothing assumed)

From the handoff (section 10):
- **Q1.** The first level: a few skins and the dial, or accessories at once? *Recommendation: skins first (cheapest, H24 already answered on paper).*
- **Q2.** How dry may the voice be and still be Peak?
- **Q3.** Which skin first: pink, purple, dark, or let data decide? *Recommendation: ask in the alpha form (S0 question 8) and pick the two most named.*
- **Q4.** Free or one day paid? (Nothing is sold now.)
- **Q5.** Does the multi-provider version change the settings structure? *Answered by the code: it is committed; the settings carry `lang`, `gentle`, the brain choice and so on; a skin and an accessory are two more saved strings (section 2.3).*

New:
- **N11.** *Answered 2026-11-13 (ADR-0086): yes, the person may ask for a look in words, as one entry of the closed skill list (not part of the first slice).*
- **N12.** *Answered 2026-11-13 (ADR-0086): Peak does not remark on its new look.*
- **N13.** *Answered 2026-11-13 (ADR-0086): Peak only asks about the dryness; it never changes it by itself.*
- **N14.** *Answered 2026-11-13 (ADR-0086): the default must be pixel-identical.*

## 8. What could not be verified

Nothing was run or looked at. Not seen: any palette on the screen, any accessory in the rarer poses, the CPU of a worn accessory, the three languages of a dry voice. The count of "about 18 places" is by reading the file once.
