# ADR-0096: The website may measure, without cookies and in plain words; the app's privacy contract is unchanged

- **Status:** accepted (Vinh chose "Cho phép đo không cookie, nêu rõ" and "Tự thêm script vào trang" on 2026-11-14); **built, the visit count switched off until its token is given** (`scripts/site/catalog/measurement.json`)
- **Date:** 2026-11-14
- **Decided by:** Vinh (author)
- **Amends** D7 of ADR-0034 ("no analytics script on the site") and the consequence line of ADR-0052; builds on ADR-0092 (the copy counter).

## Context
streakboom.com is behind Cloudflare, on purpose. Cloudflare turned on, by itself, a Web Analytics script, a bot-detection script and error-reporting headers; the privacy page said "no analytics" (W-64). The review `docs/plans/website-measurement-review.md` found that the charter and the app's privacy contract are about Peak, while "no analytics on the site" was a separate decision (D7, 2026-11-09) argued from the product's privacy image. Vinh decided that the website is not bound by the app's contract and that measuring it is right.

## Decision
1. **The app's contract is unchanged and is the app's only:** charter article 1, `AGENTS.md` rule 4, the five promises, `docs/privacy.md` and ADR-0009 are about what Peak senses, keeps and sends. Nothing here touches them.
2. **The website may measure, with tools that set no cookie, keep no per-person record and are named on the privacy page.** The allowed list, and only this list: Google Search Console and Bing Webmaster Tools (nothing on the page); **Cloudflare Web Analytics** (visits and load times, one script); the **copy counter** of ADR-0092. Another tool is a new ADR. Not allowed: anything with an identifier, a cross-site cookie or an advertising link.
3. **The Web Analytics script is added by hand in the page template** (`beaconTag` in `scripts/site/counting.mjs`), not by Cloudflare's automatic injection, so the repository shows what a visitor receives. The token (public, in the page) is in `scripts/site/catalog/measurement.json`; empty means no script. The automatic injection is turned off in the Cloudflare dashboard (the author).
4. **Not wanted and to be switched off in Cloudflare:** the bot-detection script (JavaScript detections, Bot Fight Mode, the probable cause of the 403 on the download ledger, W-64) and Network Error Logging. They add a third party without giving the project a number it asked for.
5. **The words follow the build.** The paragraph "This website" of the privacy page and the note of the sticker page are **composed from the switches** (`siteParagraph`, `stickerNote`), in three languages, so a page cannot say "no analytics" while the script is on. They also say that Cloudflare delivers the site.
6. **Two guards:** the build refuses any third-party script except the one analytics script when the token is set, a page without it when it is set, and a wrong token; and `scripts/site/livecheck.mjs` reads the **live** pages after each deploy (Pages workflow) and fails on anything Cloudflare adds that the words do not say (an automatic analytics script, the bot script, `nel` or `report-to` headers, a cookie, another script). A page that Cloudflare turns away is reported as not checked.

## Consequences
- Until the author gives the token and turns off the automatic injection, the live site carries an analytics script the words do not name; the live check names it (and fails the run after the deploy) so it is not forgotten.
- Documents amended: ADR-0034 and ADR-0052 (pointers), `docs/website.md`, `docs/plans/website-seo-geo.md`, `spec/13-sticker-page.md`, the sticker plan. A note for the app session (`docs/handoff/website-measurement-note.md`) says the README and `docs/privacy.md` could say that their promise is about the app (those files are not the website session's).
- A lawyer's question is added: cookie-free audience measurement and the counter, Vietnam, Japan, the EU, the wording of the notice.
- **Not verified:** that Cloudflare Web Analytics sets no cookie and keeps no identifier (Cloudflare says so; one reading of the cookies was empty); which Cloudflare settings produce each added item; the legal reading; the Vietnamese and Japanese words (AI-written, no native reader).
