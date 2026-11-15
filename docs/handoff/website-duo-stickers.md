# Note to the website session: the four duo stickers are ready (handed over by the author's order)

**From:** the sticker session, 2026-11-15, **by the author's order** ("settle the four pictures and hand them to the website"). **Status:** a handover of pictures; please read the open question at the end before you publish. This follows `website-duo-test.md` (the app session's information note) and spec 19 (`spec/19-duo-test-plan.md`).

## What is delivered
A set of **four stickers**, `docs/plans/assets/paws/set-duo-4/` (a folder like `set-v2`):
- `vi/`, `en/`, `ja/` with `one-is-off.png`, `stamped.png`, `one-pebble.png`, `excuse-me.png` (360 x 360, transparent, flat, caption baked in, as set-v2; the file name is the English slug).
- `manifest.json`: per sticker `id` (D1, D2, D3, P1), `slug_en`, `file`, `kind`, `text`, `title`, `alt`, `synonyms`, `reviewed` per language, plus the licence and font credits copied from set-v2. The shape follows `set-v2/manifest.json` and spec 13 section 2; **tags (`emotions`, `situations`, `edge`) are not given**: your keyword rules give them at build time (spec 13), and the build will name any caption the rules do not match.
- Look at them first in `docs/plans/assets/paws/stickers-draft/duo-stickers-vi.png`.

| id | file | vi | en | ja | what is drawn |
|---|---|---|---|---|---|
| D1 | `one-is-off` | Lệch một hạt. | One is off. | ひとつ大きい | Paws looks at a straight row of chestnuts, one is bigger |
| D2 | `stamped` | Đã đóng dấu. | Stamped. | 押印しました | Paws, calm, a stamp and a paper with a red tick |
| D3 | `one-pebble` | Xong một viên. | One pebble. | ひとつ運んだ | Paws, proud, beside a small pile of pebbles |
| P1 | `excuse-me` | Xin phép nhé. | Excuse me. | 失礼します | Peak winks (one eye shut, two sparkles on the open-eye side), Paws sits beside |

## Facts that matter for the pages
- **A new character: Paws, a black-and-white dog, Peak's partner** (ADR-0127, ADR-0128). The name Paws is not printed on the stickers. Peak is unchanged. Licence **CC BY 4.0** like all the others (ADR-0126); the font credits are the same as set-v2.
- **The en and ja lines are AI-written and unreviewed** (`reviewed.en` and `reviewed.ja` are false), as for set-v2 (V-99, V-122); the vi lines are the author's to judge and are marked reviewed.
- **Four, not eight:** spec 19 planned eight stickers with two Peak stickers as a control. The author keeps **four for now**; the other four (P2 a meeting paper, S1 a four-panel story, C1 and C2 for Peak) are drawn but **parked** (`stickers-draft/parked/`, not in the manifest, not for the site). So **there is no control among the four**; whether the test of spec 19 is run like this is the author's decision, not yours.
- The counters stay as they are (ADR-0092, no new counter); `popular.json` is not changed.
- No arm strokes, no meme text, no health claim in any caption.

## Open question for the author (not for you to decide)
Whether the four go **live at once** or are **held until the author orders the test** (spec 19 says the test is not ordered yet, and `website-duo-test.md` said "do not change the site yet"). If this note is read as "publish now", ask the author; the pictures are final but not yet seen in a browser, and the Worker (V-159) is not checked.

## Not verified
The author has not seen the four in a browser or on a phone; the PNGs were rendered with PyMuPDF; the en and ja lines have no native reader; the tags are untried (your rules decide them); the sticker at 32 px (D1's chestnuts and D2's stamp are small there).
