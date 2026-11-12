# ADR-0067: A dismissible language suggestion from the browser's languages, never a redirect, never the IP

- **Status:** accepted (answered by the author on 2026-11-12); **not built yet** when this record is written
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session), after the request in `docs/handoff/website-language-suggestion.md` and ADR-0066 (the app session)

## Context
ADR-0066 decided that no part of Streakboom looks at the IP address or the location for the language. The website session was asked to check the language switcher and to propose a dismissible suggestion based on `navigator.languages`.

**What is there today (checked on the built pages, 2026-11-12):** the site detects nothing: `/` is English for everyone. Every page has a visible language switcher in the header: two links with the short codes (`EN`, `VI`, `JA`), each with `hreflang`, `lang`, a tooltip and an `aria-label` with the full language name. On the home, How it works, Privacy and Stickers pages (all three languages) a link goes to the same page in the other language; on the changelog and the 404 page (English only) the links go to the home page of the other language. Every page that has translations carries `hreflang` alternates for `en`, `vi`, `ja` and `x-default` (English). On a phone the codes fit in the header. The switcher is not remembered: a visitor who chose Vietnamese lands on English again at `/`.

## Decision
1. **A thin strip above the header**, in the suggested language: for example "Xem bằng tiếng Việt?" with a link to **the same page** in that language and a close button; for Japanese "日本語で見ますか？"; for English "View in English?". It is inserted by a small inline script at the top of the body, which runs before the first paint, so the page starts with the room for the strip and **nothing moves** (the same technique as the "not Windows" class). The strip is **not in the static HTML**: crawlers and assistants do not see it, `hreflang` and the pages are unchanged. Visitors it does not apply to see nothing.
2. **The rule.** Take the first language of `navigator.languages` that the site has (`en`, `vi`, `ja`, matched on the part before the dash: `vi-VN` is `vi`). If it is not the language of the page, suggest it. This holds for all three languages, English included: someone whose browser is English and who lands on `/vi/` from a search is offered "View in English?". The strip is shown only on pages that have a same-page translation (home, How it works, Privacy, Stickers), not on the changelog or the 404 page.
3. **A choice is remembered, only in the visitor's browser.** Closing the strip, or following its link, stores the language in the local storage of the browser under one key; the strip is then not shown again for that language. Storage that is blocked (a private window) only means the strip may come back. No cookie, no request, nothing sent: the page's own script reads `navigator.languages` and the local storage and nothing else. One sentence is added to the privacy page, and the build's check that the sticker script keeps nothing stays as it is (the strip's script is a separate inline one).
4. **No redirect, no IP, no location, no per-country content, no change for crawlers.** A visitor is never moved by the site; the suggestion is a link they may follow.
5. **The language buttons stay as short codes** (`EN`, `VI`, `JA`), the author's choice: they are compact on a phone and have the full name in the tooltip and the `aria-label`.
6. **The text of the strip is in the suggested language** (so the person who needs it can read it), with the `lang` attribute of that language; the close button has a label in the same language. The Japanese sentence has no native reader (the Japanese pages are a beta).

## What the build will check (when built)
That the inline script exists on the four kinds of pages and not on the changelog and the 404 page; that the strip is not in the static HTML; that the script uses `navigator.languages` and no `fetch`, `XMLHttpRequest`, `sendBeacon`, cookie or `location.replace` / `location.assign` / `location.href =` redirect; that the link of each suggestion is the same-page translation (the `switchTo` of the page); that the pure function that picks the suggestion is tested (`vi-VN`, `ja`, `en-US, vi`, `fr`, an empty list, a language already dismissed, the page's own language).

## Alternatives considered
A fixed bar at the bottom of the screen (no push, but it covers a small screen and collides with the sticker and download toasts); no strip and only a clearer switcher (the simplest, but a visitor with a Vietnamese browser must find the button); remembering for the tab only (nothing stored, but the strip comes back for someone who said no); no memory; suggesting only Vietnamese and Japanese (the request's first wording; an English visitor on `/vi/` would get nothing); native names in the switcher (clearer, rejected for now: the codes are compact and have the full name for assistive technology).

## Consequences
- The visitor sees a short line and, if they choose, a link; the site's promise of no tracking and no cookies is unchanged (a local list in the browser, like the recent stickers of ADR-0060).
- A visitor who follows the link gets a page in a language the AI-written Vietnamese and Japanese texts do not yet have a native reader for (W-1 to W-5): the suggestion makes those pages more visited.
- Not verified when this record was written: all of it (nothing is built). To check when built: a phone, Safari, Firefox, Edge; a screen reader reading the strip (the language switch of the voice, the order: the strip comes before the header); the layout shift (Lighthouse) with and without the strip; a private window (blocked storage); a browser with several languages in a different order.

## Sources
`docs/handoff/website-language-suggestion.md`, ADR-0066, ADR-0060, ADR-0031, ADR-0059, Google's advice on locale-adaptive pages and on visible language links, `scripts/site/pages.mjs` (the header).
