# Handoff for the website session: the Peak sticker page

Written 2026-11-11 by the app session for the website session (the site, streakboom.com, is built there; the app session does not touch it). Decision record: [`../decisions/0051-sticker-web-gallery-and-cc-by.md`](../decisions/0051-sticker-web-gallery-and-cc-by.md). Background: [`../plans/sticker-test.md`](../plans/sticker-test.md), [`../plans/sticker-set-v0.md`](../plans/sticker-set-v0.md).

## 1. What to build and why
A page where anyone can **use the Peak stickers in their own chat right away**, without Zalo or Telegram having the set. The author has **not** submitted the set to any store and will not for now; the page is the first channel and a way to bring people to the app (hypothesis H14, plan `sticker-test.md`). People send the stickers **as images**, not as store stickers, and the page must say so plainly.

Suggested URLs: `/stickers/` (English) and `/vi/stickers/` (Vietnamese). The Japanese page is the website session's call (the stickers carry Vietnamese text, so it may only need a short page that points to the Vietnamese one).

## 2. The assets
Copy these from the app repository: `docs/plans/assets/stickers/set-v0/01.png` to `20.png` (PNG 360 x 360, transparent background, about 15 to 20 KB each). Not for the page: `contact_sheet.png`, the banners, `icon_124.png`, `preview_440.png` (the preview or the icon could serve as the page's social image; ask the author). The set is still a draft and the author may change stickers: take the files from one folder at build time and do not hard-code the count or the order. `docs/plans/assets/stickers/build_stickers.py` regenerates them.

| File | Text on it (Vietnamese) | Meaning (English, for `alt` and structured data) |
|---|---|---|
| 01 | Chào buổi sáng! | Good morning: the cat stretches and yawns |
| 02 | Sướng quá~ | Bliss: eyes closed, head scratched |
| 03 | Đời là thế. | "That is life": a cat lying back with crossed legs, deadpan |
| 04 | Buồn ngủ… | Sleepy: nodding off with a "z" |
| 05 | Hừm. | A sulk: half-lidded glare, little puffs |
| 06 | Quá sức mèo rồi. | "Too much for a cat": overwhelmed |
| 07 | Làm chung nhé? | "Shall we work together?": a beckoning paw |
| 08 | Ngủ ngon. | Good night: curled up asleep |
| 09 | Haha! | Laughing out loud, tears of joy |
| 10 | Xin lỗi nhé. | Sorry: big wet eyes, a sweat drop |
| 11 | Cảm ơn nha! | Thanks: paws together, hearts |
| 12 | Ơ! | Surprise |
| 13 | Để mình nghĩ… | Thinking: a paw on the chin |
| 14 | Hì hì. | A giggle behind a paw |
| 15 | Giỏi quá. | A deadpan thumbs-up |
| 16 | Ai đợi đâu. | "Who was waiting?": proud but secretly glad |
| 17 | Huhu… | Crying |
| 18 | Ok nè! | A wink and an "ok" sign |
| 19 | Hoan hô! | Hooray: a hop for joy with sparkles |
| 20 | Không nha. | "No": holding a no-entry road sign |

The numbering is by position in the set. Please also give each sticker a short English and Vietnamese title for the page (the English column is a starting point). The app's name is not on the images; the page carries it.

## 3. What each sticker offers
1. **Copy** (the main button on a computer): put the PNG on the clipboard (`navigator.clipboard.write` with a `ClipboardItem` of type `image/png`) so the person can paste it with Ctrl+V into Zalo, Telegram, Messenger, Discord and so on. Show "Copied" for a moment; if the browser refuses, fall back to Download and say why in a plain line.
2. **Share** (the main button on a phone): `navigator.share({ files: [file] })` when `navigator.canShare({ files })` is true, so the system share sheet opens and the person picks Zalo or Telegram. Hide the button where it is not supported.
3. **Download** one PNG (a plain `<a download>`), and **Download all** (one ZIP built at site build time; the name `peak-stickers.zip`).

Buttons are real `<button>`s with labels for screen readers and work from the keyboard. With scripts off the images and the download links still appear.

## 4. Words on the page (the author edits; this is the shape)
- A short intro in Peak's voice: what the set is, free to use in chats.
- **How to use**, three lines: on a computer press Copy and paste into the chat; on a phone press Share and choose the chat app (or save the picture); **they are sent as pictures, not as sticker packs** (so they look larger and cannot be tapped to add a pack; a real sticker pack is not offered yet).
- **Licence line, visible near the buttons:** "Peak stickers by Streakboom, CC BY 4.0", linking to `https://creativecommons.org/licenses/by/4.0/`, and a sentence: free to use and share, including commercially, as long as you credit Streakboom. Put the same in the structured data (section 5).
- A gentle call to action: Peak, a small cat that lives on your screen, with the download link of the app. No "Zalo sticker" or "Telegram sticker" claim anywhere: the set is **not** in any store, and Zalo and Telegram are named only as places where you can paste.
- A courtesy credit line: the image text is set in Be Vietnam Pro (SIL Open Font License).

## 5. Search and AI engines (ADR-0034, ADR-0040)
Title and description per language; an `ImageGallery` with `ImageObject` items carrying `license` (the CC BY 4.0 URL) and `creator` (Streakboom); descriptive `alt` text (the English column and a Vietnamese one); an entry in `sitemap.xml`, `llms.txt` and `llms-full.txt`; `hreflang` between the languages; images with width and height, lazy-loaded below the first row. The sticker titles are real text on the page, not only baked into the images.

## 6. Privacy and measurement (the app's rule holds on the site)
No cookies, no third-party scripts, no fingerprinting, nothing per person. **Copying, sharing and downloading must not be recorded per person.** The author wants to know whether the page brings installs (hypothesis H14; the test stops under **20 installs from stickers in 4 to 6 weeks** of the page going live; the author still has to confirm when the clock starts). The site counts no visits today (ADR-0034), so please **propose** how to count arrivals from this page at the app's download link without tracking people, for example a distinct link (`?from=stickers`) whose clicks are counted in aggregate by a privacy-respecting counter the author accepts, or the release's downloads by day. Note ADR-0052 (the download counter read from GitHub, with a ledger): it counts downloads, not installs, and cannot say where a person came from, so by itself it only shows the total moving after the page goes live; a link that carries where the visitor came from would need a counter the site does not have today. Say plainly in the proposal what can and cannot be known, and do not use the word "installs" for downloads. Add nothing the privacy page does not already say; if the page needs new wording, update it in the same change.

## 7. Checks (the author or the website session; the app session cannot do these)
- Copy, then paste into Zalo on a computer, Telegram Desktop and Messenger on the web: the image arrives with a transparent background and a readable size.
- Share from an Android phone and an iPhone: the sheet opens and Zalo and Telegram appear.
- The fall-backs when the clipboard or sharing is not allowed.
- The page in the dark theme (the stickers are drawn to read on light and dark chat backgrounds; check both).
- The licence line and the structured data validate.

## 8. Not decided here (for the author)
Whether the Japanese site gets a page; the order of the 20 on the page; a smaller 256 px version for chats where 360 px looks too big (not made); a real Telegram sticker pack later (needs the author's Telegram account and a side of exactly 512 px; Telegram's own page does not say whether sets are reviewed); and the Zalo or LINE submissions, which stay out of this work.
