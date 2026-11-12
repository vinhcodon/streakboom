# ADR-0074: The sticker copy is 128 px, with a ?px=NN parameter to try other sizes

- **Status:** accepted (answered by the author on 2026-11-12); **built on 2026-11-12** (committed; the live behaviour is checked after the push)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
ADR-0060 made the copy 180 by 180 px. The author pasted and shared stickers into Zalo and found them still much larger than Zalo's own stickers, not sharp, and on a white background, with copy and with share. The website session checked what it can:
- **Transparency:** the source PNGs are RGBA (about 60% of the pixels are fully transparent), and the picture the page puts on the clipboard (and the file it hands to Share) is still transparent after the resize (alpha 0 at the corner, checked in the built-in browser). The white background is therefore added by the receiving app: Zalo takes a pasted or shared picture as an ordinary image and flattens it. The site cannot change that; only a real sticker (a Zalo or a Telegram sticker pack) is transparent in a chat. This was not tested in Zalo itself.
- **Size:** the margins of the pictures are small (the art fills 270 to 338 by 316 to 347 px of the 360), so trimming them would gain at most a few percent. The size in a chat is set by the number of pixels, so only the pixel count changes it.
- **Sharpness:** the resize of the browser (high quality) gave sharper edges than a Lanczos resize written for the test, so a better algorithm would not help; what is left is the number of pixels (fewer pixels are tidier in size but softer) and what the chat app does to the picture.

## Decision
1. **The default copy is 128 by 128 px** (it was 180), for copy and for the file Share hands over.
2. **A test parameter:** opening a sticker page with `?px=NN` (an integer from 48 to 360) copies at NN px, so the author can try several sizes in Zalo and then say which number to keep. Nothing is stored; without the parameter the size is 128. The parameter does not change anything for visitors who do not use it, and the build checks that it stays within these limits only by checking that the code is there (the limits are in the code).
3. **Nothing is added about the white background** (the author had no preference): no note on the page for now.

## Alternatives considered
96 px; two sizes with a switch (small 128 by default, large 360); keeping 180; trimming the transparent margins; a custom resampler; a note on the page about Zalo's white background; asking the app session for a real Telegram sticker pack (the only way to a transparent, right-sized sticker; it needs the author's Telegram account).

## Consequences
- At 128 px the words on the stickers are small (about a third of their size on the page) and a little soft on a high-density screen; the author may choose another number with `?px=`.
- Not verified: how 128 px looks in Zalo (the author tries); whether Zalo shows an image of 128 px at about a sticker's size; whether the white background is Zalo's or Windows' clipboard conversion (the clipboard could not be filled from the built-in browser pane, so what Chrome puts on the Windows clipboard was not inspected; a paste into Paint and into Telegram would tell).

## Sources
ADR-0051, ADR-0060, ADR-0073, `site/stickers.js`.
