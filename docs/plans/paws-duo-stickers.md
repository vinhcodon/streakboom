# The duo test: the eight stickers (drafts)

**Status:** drawn 2026-11-15 by the sticker session after the author chose Paws option A (ADR-0128) and said "draw the eight". **Drafts for the author's look; nothing is published, nothing is added to the site or the app.** The spec is `spec/19-duo-test-plan.md` section 3.

All in [`assets/paws/stickers-draft/`](assets/paws/stickers-draft/), built by `assets/paws/build_duo_stickers.py` (it reuses Peak's rig port in `assets/stickers/build_stickers.py` and Paws from `build_paws_options.py`). Flat, 360 x 360, transparent, caption baked in, **vi / en / ja** (`vi/`, `en/`, `ja/`), no arm strokes, CC BY 4.0. `duo-stickers-vi.png` is the sheet to look at (256 px on light, 80 and 36 px on dark); `review_vi/en/ja.png` show all three languages on both grounds; `manifest.json` has the text, title, alt text and synonyms per language.

| ID | Kind | Picture | vi / en / ja |
|---|---|---|---|
| D1 | Paws alone | looks at a straight row of chestnuts; one is bigger, worried brows | Lệch một hạt. / One is off. / ひとつ大きい |
| D2 | Paws alone | calm, a stamp beside a paper with a red tick, nobody will read it | Đã đóng dấu. / Stamped. / 押印しました |
| D3 | Paws alone | happy and proud beside a small pile of pebbles, sparkles | Xong một viên. / One pebble. / ひとつ運んだ |
| P1 | the pair | Peak asleep, one eye open; Paws holds a straight string of beads across to Peak's back | Xin phép nhé. / Excuse me. / 失礼します |
| P2 | the pair | Paws holds a tiny paper (a meeting) in the mouth; Peak looks at the ceiling | Họp nhé? / Meeting? / 会議しよう？ |
| S1 | four panels | Peak sleeps; Paws bows; the beads cross; Peak opens one eye | Có xin phép. / Asks first. / ちゃんと許可 |
| C1 | control, Peak | Peak eyes a cup at the table edge | Rơi thử? / Just testing. / ためしただけ |
| C2 | control, Peak | Peak squeezed into a too-small box, smiling | Vừa khít. / Fits. / ぴったり |

Voice kept: the dog's work is small, useless and sometimes ruined (D1, D2); the joke is on the situation and the animals, never on the person; Peak stays quiet; no health claims, no "needs the person" lines; no meme text; the name Paws is not printed. Captions are four words or fewer.

## Not verified
See V-163: the author has not looked; en and ja are unreviewed AI lines; PyMuPDF renders, not Chrome; S1 does not read at 32 px; P1's beads end near Peak's head; tags and synonyms are a first guess and the spec 13 tag build was not run; the counting Worker (V-159) is not checked.
