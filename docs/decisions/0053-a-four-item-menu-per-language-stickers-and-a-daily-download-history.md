# ADR-0053: A four-item menu, the sticker page waits for per-language sets, and a daily history of downloads

- **Status:** accepted (answered by the author on 2026-11-11); **nothing is built yet**: the sticker page waits for the sticker session's per-language sets, the menu and the ledger history are built together with it
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude (the website session), after reading the app session's handoff `docs/handoff/website-stickers.md` and ADR-0051 and being asked whether the menu had grown too long

## Context
The sticker page (`/stickers/`, `/vi/stickers/`, and a Japanese one) was handed over by the app session. Two things came up while reading it:
- The header menu already has **seven items** (Features, Install, How it works, Privacy, FAQ, Changelog, GitHub) beside three language links; on a phone it scrolls sideways. A Stickers item would make eight. The charter's second article (the attention is theirs) and the style of Peak (few words, in order, then quiet) say the menu should be shorter.
- The stickers carry **Vietnamese text on the image**. For the English and Japanese pages that is the wrong language, and a note beside the picture does not fix it.

The handoff also asks for a proposal of how to see whether the page brings people to the app, with what can and cannot be known (ADR-0052 counts downloads only: no source, no installs).

## Decision
1. **The header menu has four items: Install, How it works, Privacy, Stickers.** The rest moves to the footer: GitHub, Changelog, FAQ, Report a bug (the footer already has Source, Report a bug, How it works, Privacy and Changelog; it gets FAQ and the Atom feed link and loses the duplicates of the header). "Features" goes: the features are on the How it works page and the home page already links to it. Privacy stays in the header because trust is the first article of the charter. The three language links stay. "Stickers" appears in the menu only when its page exists.
2. **The sticker pages show a set in the page's own language.** The author asked the sticker session to produce versions of the 20 stickers with the text in English, Vietnamese and Japanese (same characters, same order and numbers), with a manifest that holds, per sticker and language, the text on the image, a short title and the `alt` text, so that the website reads the count, the order and the words from one folder at build time and hard-codes nothing. **The website session stops here and waits** for that set (the request is in plan `website-seo-geo.md` section 15). The Japanese page is therefore a full page like the others (decision follows the author's answer: one set per language), not a short page that points to the Vietnamese one.
3. **Measuring arrivals: the ledger of ADR-0052 gets a daily history.** `downloads.json` keeps, besides the per-tag counts and the total, a list of `{date, total}`, one entry per day (the last total seen that day), merged from the previous ledger at every build, so the growth per day before and after the day the page goes live can be read. **What it can tell:** how many downloads happened each day, and whether the daily number jumped after the page went live. **What it cannot tell:** who downloaded, where they came from, how many came from the stickers (any other source moves the same number), that a download became an installation (an update is a download too), or anything per person. Nothing new is collected from visitors; no link carries a source; the word "installs" is not used for downloads. The author keeps the 20-installs-in-4-to-6-weeks test of hypothesis H14 only as a reading of this curve, not as a count of installs.

## Alternatives considered
A menu of three items (Privacy to the footer: hiding it can read as hiding it); only the logo, the download button and the language links, everything else in the footer (quietest, but the Stickers and How it works pages become hard to find); keeping seven and adding one (declined). A short Japanese page pointing to the Vietnamese page, or no Japanese page (declined in favour of a set per language). A distinct link such as `?from=stickers` counted by a cookie-less service (it would count clicks on the link, not downloads or installs, needs a third party or a server, goes against ADR-0034 and needs a new privacy text); doing nothing beyond the total (nothing by day).

## Consequences
- The header gets quieter and fits a phone; the pages that left it stay one tap away in the footer. People who looked for Changelog or FAQ in the header must look at the bottom.
- The sticker page is delayed until the per-language set exists; nothing of the page is built, and the app session's earlier version (one Vietnamese set, a Japanese page that points to it) is not used.
- The ledger file grows by one small entry a day (about 40 bytes); the build keeps it within a few hundred entries.
- Not verified: the manifest format and the file layout are the sticker session's to confirm; the Japanese and English text on the images will have no native reader; the effect of the new menu on how people find pages.

## Sources
`docs/handoff/website-stickers.md`, ADR-0051, ADR-0052, ADR-0034, `docs/charter.md`, plan `website-seo-geo.md` sections 14 and 15.
