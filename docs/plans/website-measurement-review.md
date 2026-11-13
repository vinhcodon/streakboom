# The website and measurement: a review (2026-11-14)

Written by the website session at the author's request. It does not change anything; it says what was found, what the documents say today, what has to change if the author decides the website may measure, and what to ask. The decision is the author's; the ADR that records it is not written yet.

## 1. What was found on the live site

`streakboom.com` is behind Cloudflare, on purpose (the author confirmed on 2026-11-14). The name servers are Cloudflare's, the A record is a Cloudflare address, every page has `Server: cloudflare` and a `CF-RAY`. On every page Cloudflare adds, outside the repository and outside the build:

| What | Seen | What it is |
|---|---|---|
| `static.cloudflareinsights.com/beacon.min.js`, and a call to `/cdn-cgi/rum` | in the browser, privacy page | **Cloudflare Web Analytics** (real-user monitoring: page views, load times). Cloudflare enabled it by default for proxied sites ([the RUM diaries](https://blog.cloudflare.com/the-rum-diaries-enabling-web-analytics-by-default)), so it may never have been switched on by hand |
| An inline script that loads `/cdn-cgi/challenge-platform/scripts/jsd/main.js` | in the HTML served | **JavaScript detections** of the bot protection (Bot Fight Mode family): not measurement, a bot filter |
| `NEL` and `Report-To` headers to `a.nel.cloudflare.com` | response headers | **Network Error Logging**: a browser may report its own connection errors to Cloudflare |
| No cookie | `document.cookie` was empty | (an older independent review says the beacon once set an identifier cookie, [ctrl.blog](https://www.ctrl.blog/entry/review-cloudflare-analytics/); Cloudflare now says it uses no cookie or local storage; not verified beyond the one empty reading) |

The same proxy probably explains why the deploy fails with a 403 on the download ledger since 17:04 UTC (W-64): the build server asks the live site for `downloads.json` and Cloudflare turns a data-centre address away. The build now says who answered in its error message.

## 2. What the documents promise today, and about what

The question is whether the privacy promise is about the **app** only or also about the **website**. The documents answer both ways, and they are not in conflict about the app:

**About the app only (unchanged by anything here):** `docs/charter.md` article 1 (Peak "never hurts the person's work, privacy or feelings"); `AGENTS.md` rule 4 (the privacy contract: Peak senses shapes and activity, never meaning; nothing sent unless the person turns it on); the five promises of the home page (`pr1` to `pr5`: all about Peak); `README.md` ("no telemetry unless you opt in"); `docs/privacy.md`; ADR-0009; the sections of the privacy page about keys, the AI provider, memory, usage stats, senses and files.

**About the website, decided separately by the author and justified by the product's privacy:**

| Where | What it says |
|---|---|
| ADR-0034, D7 (author, 2026-11-09), and `docs/plans/website-seo-geo.md` D7 and the "what I would not do" list | measuring by Search Console and Bing only; **"no analytics script on the site"**; rejected because it "conflicts with the product's privacy promise" and "a script on the site ... may need a notice" |
| ADR-0052, consequences | "The site has no analytics on purpose (ADR-0034) and makes no request to a third party" |
| `docs/website.md` line 6 | "no third-party script" |
| `spec/13-sticker-page.md` (technology row, section 6 "the site's promises hold") | "no cookies, no third-party script", counting only after the privacy text changes; a hosted counter was "not proposed" because it is a third-party script |
| ADR-0067 | the language strip leaves "the site's promise of no tracking and no cookies unchanged" |
| Public text, three languages (`pv_sections`, the "This website" section) | "This website sets no cookies and has no analytics" and "nothing is sent anywhere" |
| Build checks (`scripts/site/checks.mjs`) | refuse a script from outside the site and some words in the page scripts, **but only on the files the build makes**; what a proxy adds afterwards is not seen |

## 3. Evaluation

**The author's position is coherent.** The charter and the privacy contract are about what Peak does on the person's computer. Nothing in them forbids a website from measuring its visits, and measuring visits is ordinary for a project that wants to know whether its pages work (H4 of the sticker plan, the HOT list, the download funnel). The five promises are about Peak. So there is **no conflict with the charter or the app's contract**.

**There is a conflict with the website's own earlier statements.** D7 of ADR-0034 is the author's decision, and it was argued from the product's privacy image, not from the charter. The privacy page and the sticker page repeat it in public in three languages. Today those statements are **false** on the live site (Web Analytics, the bot script, NEL). That is the urgent part, whatever the decision: either the tools go, or the statements change. Leaving both is the one option that is wrong.

**The risk of measuring is about trust, not law, and it is small if it is said plainly.** The product is sold on privacy (README, home page). A visitor who read "no analytics" and then finds a beacon will feel misled; a visitor who reads "we count page views without cookies, with Cloudflare, nothing about you" can judge it. What helps: say exactly what is measured, keep it to the simplest cookie-free tool, and keep the app's contract and the website's words clearly apart (the privacy page already has a section "This website").

**Which tools are in the same class:**

- Fine in my view (no cookie, no per-person record, aggregate): Search Console and Bing Webmaster (already planned); Cloudflare Web Analytics; the copy counter of ADR-0092.
- Not measurement and not wanted: **JavaScript detections** (a bot filter that loads a script and may decide who sees the page), **Bot Fight Mode** (the probable cause of the 403 for the build), and **Network Error Logging** (browsers report to a third party). They add a third party without giving the project a number it asked for.
- Not proposed: Google Analytics or any tool with identifiers, cross-site cookies or advertising links.

**Automatic against explicit.** Cloudflare puts the beacon in by itself. Then the repository does not show what the visitor receives, the build checks cannot see it, and the privacy words can drift (as they just did). Cleaner: switch the automatic injection off and, if the author wants Web Analytics, add the one `<script>` by hand in the page template with the site token, so the build can allow exactly that one address and refuse every other third-party script. This keeps "what the page does" readable in the repository.

## 4. Proposal (for the author to choose; nothing is done)

1. **An ADR that amends D7 of ADR-0034** (and says so in ADR-0052 and `docs/website.md`): the website may measure with tools that set no cookie, keep no per-person record and are named on the privacy page; the app's contract is unchanged and is restated as the app's only. The list of allowed tools is written in the ADR; adding another is a new ADR.
2. **Words, in three languages** (AI-written, no native reader): the "This website" section of the privacy page says what is counted (visits and load times by Cloudflare Web Analytics, copies of stickers by the counter, search statistics by Google and Bing without anything on the page), that Cloudflare delivers the site, and that no cookie is set; `pv_site_on` and `st_privacy_on` are kept in line; the home and the README get one clear sentence that the app's promise is about the app.
3. **Cloudflare settings (the author):** Web Analytics: keep (and switch to the manual script) or remove; Bot Fight Mode and JavaScript detections: off; Network Error Logging: off.
4. **A guard that sees what the proxy adds:** a check, after the deploy, that fetches the live pages and fails on any third-party script address that is not on the list, so a setting changed in a dashboard cannot make the privacy page wrong again without notice.
5. **Documents to update with the ADR** (list in section 5).
6. **A lawyer's question** added to the list (`docs/foundation/legal-questions.md`): a cookie-free audience measurement and the counter, in Vietnam, Japan and the EU, the wording of the notice. Not answered here: the author asked for a review of the documents, not a legal reading, and none of it has been checked with a lawyer.

## 5. Documents that say something about the site and measurement (to update when decided)

- Decisions: ADR-0034 (D7, the rejected "analytics"), ADR-0052 (consequences), ADR-0067 (the promise of no tracking and no cookies), ADR-0077 Q7 and ADR-0092 (the counter), ADR-0009 (the app's telemetry: stays).
- `docs/website.md` (line 6), `docs/plans/website-seo-geo.md` (D7, the options table, the "would not do" list), `docs/plans/sticker-page-plan.md` (v1.1), `spec/13-sticker-page.md` (technology row, section 6, "the site's promises hold").
- Public words: `site/strings.mjs` (`pv_sections` "This website", `pv_site_on`, `st_privacy`, `st_privacy_on`), the generated `llms-full.txt`, the README line "no telemetry unless you opt in" (make clear it is the app), `docs/privacy.md` (the app; a pointer to the site's privacy page).
- Checks: `scripts/site/checks.mjs` (the third-party script rule and the live check), `scripts/site/counter.test.mjs`.
- Unchanged on purpose: the charter, `AGENTS.md` rule 4, the five promises, `docs/privacy.md` for the app, the foundation documents.

## 6. What was not verified

- That Cloudflare Web Analytics sets no cookie and keeps no identifier (Cloudflare says so; one reading of `document.cookie` was empty; an older independent review says otherwise).
- Which Cloudflare setting produces each of the three items, and that Bot Fight Mode is what turns the build away.
- The legal reading of any of this; the Vietnamese and Japanese words.
- That the privacy words stay true after a Cloudflare setting is changed (hence the guard).
