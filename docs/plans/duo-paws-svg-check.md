# Paws: the name and a render check of the reference SVG

**Status:** written 2026-11-15 for the handoff `docs/handoff/duo-characters-hypothesis.md` (tasks 4 and 5). The author chose the name **Paws** and pasted the SVG of the handoff (section 6, "Master Paws" from a Gemini proposal). Nothing is added to the app or to the sticker folders; the SVG and the renders are **not** kept in the repository (the handoff allows images only in `docs/handoff/assets/`, which does not exist).

## 1. The name Paws
- **Chosen by the author** on 2026-11-15, over the candidates of [`duo-name-candidates.md`](duo-name-candidates.md).
- **What a web search found** (plain searches, 2026-11-15): no dog character or sticker line called Paws, but the name leads at once to **Paws, Inc.**, the company that owns the Garfield trademarks ([Wikipedia](https://en.wikipedia.org/wiki/Paws,_Inc.), [USPTO record of GARFIELD](https://uspto.report/TM/76502954)). Paws, Inc. holds marks for GARFIELD; the search does not show a mark for PAWS alone, but **a search is not a registry check**.
- **Weakness of the name** (said in the handoff, kept): "Paws" is a common word (paws of animals, animal shelters), hard to search for and hard to make one's own; "Master Paws" of the Gemini proposal was dropped for sounding like a boss. Under ADR-0126 no trademark policy protects the name, so anyone may use it too.
- **Not done:** a registry search (Vietnam, the United States, the European Union, Japan, and the sticker and app stores), a spoken test in Vietnamese, English and Japanese, and a check of what "Paws" would be confused with in the licensing and merchandise fields (V-161).

## 2. The SVG, rendered outside the repository
Rendered with Chrome (headless) on 2026-11-15 at 256 px and 32 px, on a white ground, on a near-black ground (#1E1F22) and on the body colour itself (#2B2D31), and as an `<img>` file.

| Finding | Detail |
|---|---|
| **The `xmlns` is wrong** | `http://w3.org` instead of `http://www.w3.org/2000/svg`. Pasted inline in an HTML page it works; **as a `.svg` file in an `<img>` it shows a broken image** (seen). With the address fixed it renders. Needed for the sticker export to PNG. |
| **On a dark ground the dog vanishes** | The near-black body and ears (#2B2D31, #232529) almost disappear on #1E1F22 and are invisible on #2B2D31; only the white chest remains. At 32 px on a dark ground it reads as **a small white bottle with two dots**, not as a dog. The handoff's warning was right. A sticker is used on dark chats, so this has to be solved (a light rim line around the body, a lighter dark tone, or a sticker background). |
| **On a light ground it reads, but not clearly as a dog** | At 256 px the silhouette (a tall bean, two upright ears, a white chest, a small tail) reads closer to a penguin or a hamster than a Border Collie; the ears are the main dog sign and are small. At 32 px it is a dark blob with a white belly. |
| **The front paws are two outlined circles** | The `rect` with `rx` 7 and a grey stroke on the white chest look like two empty rings, not paws. They need toes or a fill that differs from the chest. |
| **No back legs, no neck, no visible mouth line below the muzzle** | The chest and body are one piece; the tail is a small flag with a detached white tip. |
| **Animation** | Only the left ear twitches (as the handoff noted); the tail wags and the body breathes. Not needed for stickers (they are still images). |
| **Rule of the stickers** | There are **no arm strokes** (the standing rule of the sticker drawings): the paws are on the body. Good. |
| **Peak's family look** | Peak is a golden chibi cat; Paws is dark and white. The contrast is intended; the round mochi body is shared. |

Renders (not kept in the repository): a sheet of the six cases and the `<img>` test, made in the session's scratch folder.

## 3. What this asks of the sticker session
A reference sheet of Paws that works at 32 px on a dark ground (a rim light or a lighter dark tone), a clearer dog (bigger ears, a muzzle, a tail and legs), real paws, and the `xmlns` fixed; then the author looks at 256 px and 32 px on light and dark before any sticker is drawn (spec 19, DU-3).
