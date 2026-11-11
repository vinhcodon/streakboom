# Sticker set v0: the list (ST-3)

Status: **updated 2026-11-11 by ADR-0050: 17 stickers; 03 is now a lounging cat ("Đời là thế."), 09 a curled-up mochi sleeper, 16 "Ừ, giỏi lắm." and 17 "Ai đợi đâu." are new; the table below is the first list.** First list approved by Vinh 2026-11-10 (the 15 stickers and their proposed texts, sticker 6 as he chose); nothing drawn yet.** Part of [`sticker-test.md`](sticker-test.md) (story ST-3, epic E16). Rules: spec/06 section 7 and ADR-0049. Look: [`assets/sticker-character-sheet.svg`](assets/sticker-character-sheet.svg) (approved). Zalo's format: PNG 360 x 360, transparent background, flat, at most 4 words of text per frame, no text about trademarks, no square-cornered background (guideline PDF, read 2026-11-10).

The texts in the "Text" column were approved with the list; Vinh can still change any of them while drawing, and sticker 6 is his own choice. Words are counted in Vietnamese syllable-words and none goes over 4. No text is sarcastic (ADR-0049, item 3), none blames or guilts the person (charter), none names the app, an assistant or a brand.

## The list (12 required by Zalo; 3 spare ones make 15, the limit is 20)

| # | File | Meaning | State in the app | View, body | Text (proposal) | Match | Notes for the drawing |
|---|---|---|---|---|---|---|---|
| 1 | `01.png` | Good morning | `wake` (stretch, eyes shut, yawning) | side, `stretch` | Chào buổi sáng! | exact | The play-bow stretch with a yawn; the rest face is not used |
| 2 | `02.png` | Being scratched on the head | `purr` | front, `stand` | Sướng quá~ | exact | Eyes as closed arcs, head rolled a little, cheeks strong |
| 3 | `03.png` | Asking for a belly rub | none | **sticker-only**: rolled over on its back | Gãi bụng đi? | not in the app | The one pose the app does not have (ADR-0049 item 6); keep the same face, belly cream `#fff1d6`; the cat never does this in the app |
| 4 | `04.png` | Dozing off | `drowsy` | front, `sit` | Buồn ngủ… | exact | Half-lidded eyes, a yawn |
| 5 | `05.png` | The glare when teased | `huff` | front, `stand` | Hừm. (or no text) | exact | Half-lidded, flat mouth, head tilted; a look, not anger; no sarcasm in words |
| 6 | `06.png` | "Too much for me" | `sad` | front, `stand` | **Quá sức mèo rồi.** (Vinh's choice) | partial | Ears down, eyes low; the sweat drop exists only on the hanging pose, so do not add one unless Vinh says so |
| 7 | `07.png` | Celebrating | `happy` | front, `stand` | Giỏi quá! | exact | Closed arcs and open mouth; confetti is sticker-only art; the word "streak" is avoided in case it counts as brand text, Vinh may put it back |
| 8 | `08.png` | A gentle invitation to work together | `curious` | front, `stand` | Làm chung nhé? | partial | A head tilt, eyes up; must not read as nagging (charter) |
| 9 | `09.png` | Good night | `sleep` | side, `loaf` | Ngủ ngon. | exact | Curled loaf with the "z"; the rain is its own sticker |
| 10 | `10.png` | Rain | none | **sticker-only**: front `sit` under a rain cloud or drops | Trời mưa rồi. | not in the app | The cat does not know the weather; any prop is drawn art; keep the face `curious` or `sad` |
| 11 | `11.png` | Sorry | `sad` | front, `stand` | Xin lỗi nhé. | exact | Ears down; a small bow of the head is allowed (roll) |
| 12 | `12.png` | Thank you | `purr` | front, `stand` | Cảm ơn nha! | exact | Closed-arc eyes, big cheeks |
| 13 | `13.png` | Surprise | `gasp` | front, `stand` | Ơ! | exact (spare) | Wide eyes, small round mouth |
| 14 | `14.png` | Thinking | `think` | front, `stand` | Để mình nghĩ… | exact (spare) | Head rolled, flat mouth, three grey dots |
| 15 | `15.png` | Playful | `smirk` | front, `stand` | Hì hì. | exact (spare) | Half lids, a sideways glance, no teasing words |

Counted: 11 exact or spare-exact in the app, 2 partial (6, 8, with a pose that exists but a meaning that does not), 2 sticker-only (3, 10). Not drawn: "hungry" (charter, ADR-0049). If Vinh wants fewer than 15, the spare ones 13 to 15 can go; 12 is the minimum.

## Drawn: first pass (2026-11-10, by Claude, for Vinh to look at)
All 15 stickers, the icon, the preview and the 9 banners exist as PNG in [`assets/stickers/set-v0/`](assets/stickers/set-v0/); [`contact_sheet.png`](assets/stickers/set-v0/contact_sheet.png) shows the set on one page (it is for looking, not for upload). They are made by [`assets/stickers/build_stickers.py`](assets/stickers/build_stickers.py), which ports the rig's numbers (`keys.ts`, `draw.ts`) to SVG and renders with PyMuPDF; no app code is touched, so they match the character sheet (flat fills, same palette and proportions). Checked by script: 15 files of 360 x 360 with an alpha channel, the icon 124 x 124, the preview 440 x 440, the banners at the 9 sizes. Not an artist's work: the poses are the rig's, so 3 (belly) and 10 (rain) and the confetti and hearts are simple shapes added by hand. Known weak points: the stretch (1) and the loaf (9) are small in the frame; the rain cloud in 10 is pale; the sad ears (6, 11) fold sideways and may need a second look; the text font is Windows' **Segoe UI Bold**, a system font, which should be swapped for an open font before the set is published (V-93).

## Also required by Zalo (ST-3 and ST-5)
- **Icon** 124 x 124 PNG, transparent: the front face (the rest face or `happy`).
- **Preview** 440 x 440 PNG, transparent: a collage of the stickers (about 9, the Coco and Bulla example in the guideline shows 9 with the set name on top).
- **Promote banner**, 9 sizes: 720x120, 480x150, 320x100, 240x75, 480x80, 320x53, 240x40, 960x320, 720x225 (the content of the last inside 720x165). Name "Peak" and Streakboom as the author; a banner is where words about the set may go, but "text about trademarks" is banned, so check it with Vinh.
- **Names** `01` to `15` in order, as the guideline says.

## Consistency check for each sticker (ST-4)
Put it next to the sheet: same head-to-body proportion, round eyes with two highlights (closed arcs for `happy`, `purr`), pink inner ears, three forehead stripes, the palette of the sheet, flat fills (no gradient, no bevel, no 3D), a transparent background with no square corners, the cat large and centered with a margin so a chat bubble does not clip it. Reject what drifts.

## Not done and not decided
- The Vietnamese texts were approved with the list; any later change is Vinh's.
- Whether the sticker-only art (3 and 10) is drawn by hand or generated, and how it is held to the sheet, is Vinh's call (question C of the plan: outside the app).
- Nothing here has been drawn; the table is matched to the app by reading the code (V-90).
