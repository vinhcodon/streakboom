# The duo test: the eight stickers (drafts)

**Status:** drawn 2026-11-15 by the sticker session after the author chose Paws option A (ADR-0128) and said "draw the eight". **Drafts for the author's look; nothing is published, nothing is added to the site or the app.** The spec is `spec/19-duo-test-plan.md` section 3.

All in [`assets/paws/stickers-draft/`](assets/paws/stickers-draft/), built by `assets/paws/build_duo_stickers.py` (it reuses Peak's rig port in `assets/stickers/build_stickers.py` and Paws from `build_paws_options.py`). Flat, 360 x 360, transparent, caption baked in, **vi / en / ja** (`vi/`, `en/`, `ja/`), no arm strokes, CC BY 4.0. `duo-stickers-vi.png` is the sheet to look at (256 px on light, 80 and 36 px on dark); `review_vi/en/ja.png` show all three languages on both grounds; `manifest.json` has the text, title, alt text and synonyms per language.

| ID | Kind | Picture | vi / en / ja |
|---|---|---|---|
| D1 | Paws alone | looks at a straight row of chestnuts; one is bigger, worried brows | Lệch một hạt. / One is off. / ひとつ大きい |
| D2 | Paws alone | calm, a stamp beside a paper with a red tick, nobody will read it | Đã đóng dấu. / Stamped. / 押印しました |
| D3 | Paws alone | happy and proud beside a small pile of pebbles, sparkles | Xong một viên. / One pebble. / ひとつ運んだ |
| P1 | the pair | Peak with one eye open and no z; Paws sits beside (no beads) | Xin phép nhé. / Excuse me. / 失礼します |
| P2 | the pair | Paws holds a tiny paper (a meeting) in the mouth; Peak looks at the ceiling | Họp nhé? / Meeting? / 会議しよう？ |
| S1 | four panels | Paws creeps in from far (small), nearer, just past Peak (Peak opens one eye, no z), well past and bigger | Có xin phép. / Asks first. / ちゃんと許可 |
| C1 | control, Peak | Peak eyes a cup at the edge of a table (two legs) | Rơi thử? / Just testing. / ためしただけ |
| C2 | control, Peak | Peak sits in a box (back wall, then Peak, then the front wall), smiling | Vừa khít. / Fits. / ぴったり |

Voice kept: the dog's work is small, useless and sometimes ruined (D1, D2); the joke is on the situation and the animals, never on the person; Peak stays quiet; no health claims, no "needs the person" lines; no meme text; the name Paws is not printed. Captions are four words or fewer.

## Decision of the author (2026-11-15): four for now
**Only D1, D2, D3 and P1 are kept for now.** P1 is the first drawing (Peak with one eye open and no z, Paws sitting beside) **without the string of beads**. P2, S1, C1 and C2 are **parked** in `assets/paws/stickers-draft/parked/` (drawn, not in the manifest, not for the site). Note for the test: the spec 19 plan needs eight (and the two Peak controls C1, C2); with four the control is missing, so the author decides later whether to run the test as planned.

## Changes after the author's first look (2026-11-15)
- **The string of beads is gone** from P1 and S1 (it did not show the idea, and Paws had not passed Peak). Spec 19's P1/S1 scene (a string of beads laid across the cat's back) is replaced by **Paws creeping past sleeping Peak**; the app session may update spec 19 section 3 (a note, not an edit here).
- S1 follows the author's order: Paws from small and far to near, just past Peak (Peak opens one eye, the z is gone), well past and bigger.
- C1: the table has two legs now. C2: a box with a back wall and a front wall, so Peak sits in it. P2 kept.

## Not verified
See V-163: the author has not looked; en and ja are unreviewed AI lines; PyMuPDF renders, not Chrome; S1 does not read at 32 px; tags and synonyms are a first guess and the spec 13 tag build was not run; the counting Worker (V-159) is not checked.
