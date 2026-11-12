# ADR-0075: The sticker copy is the original 360 px again

- **Status:** accepted (the author's order on 2026-11-12); **built on 2026-11-12** (committed; the live behaviour is checked after the push); supersedes the size in ADR-0060 (180) and ADR-0074 (128)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
ADR-0060 shrank the copy to 180 px and ADR-0074 to 128 px because a pasted sticker looked much larger in Zalo than Zalo's own. The author tried 128 and found the shared picture too small and of low quality. The size in a chat is set by the number of pixels and the sharpness by the same pixels, so the two wishes (small and sharp) pull in opposite directions when the chat app treats the picture as an ordinary image.

## Decision
1. **The copy and the file that Share hands over are the original PNG, 360 by 360 px**, as it is in the set (not drawn again on a canvas, so not re-encoded: the transparency and the quality are exactly the file's).
2. **The `?px=NN` parameter stays** (48 to 360): a visitor or the author can still open the page with `?px=200` to copy at another size. Nothing is stored. At 360 or more the original file is used.
3. **The old reason to be small is open again:** in Zalo the picture will look larger than Zalo's own stickers, on a white background (the chat app flattens it; ADR-0074). Only a real sticker pack of Zalo or Telegram changes that; it is the app session's and the author's decision.

## Alternatives considered
180 px (the author found it too large), 128 px (too small and soft), 240 or 256 px (not tried; reachable with `?px=`).

## Consequences
- Not verified: how the 360 px picture looks in Zalo, Telegram and Messenger; the copy on a phone; the share sheet file.

## Sources
ADR-0051, ADR-0060, ADR-0074, `site/stickers.js`.
