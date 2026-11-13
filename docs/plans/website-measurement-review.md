# The website and measurement: a review (2026-11-14)

Written by the website session at the author's request. It does not change anything; it says what was found, what the documents say today, what has to change if the author decides the website may measure, and what to ask. The decision is the author's: on 2026-11-14 he chose to allow cookie-free measurement and to add the Web Analytics script by hand; then, in a second review the same day, to lift the cookie-free limit (tools approved one by one, a consent notice for visitors outside Vietnam and Japan); it is recorded in ADR-0096.

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

## 7. Second review (2026-11-14, evening): the author wants the site to carry the usual tracking tools

The author does not remember deciding "no analytics" and says a site that promotes a product should carry full tracking tools, with Cloudflare in front as the safety. **Where the "no analytics" came from:** D7 of ADR-0034 (2026-11-09) was option A of a multiple choice in which the website session recommended A and wrote the reason itself ("a script on the site conflicts with a product whose selling point is privacy"); the author chose A. ADR-0051 item 5 and `docs/handoff/website-stickers.md` section 6 (2026-11-11, from the app and sticker side) then wrote "the app's rule holds on the site": no cookies, no third-party script, no fingerprinting, nothing per person. ADR-0077 Q7 and ADR-0092 allowed a counter only with those limits. So the restriction is a chain of earlier choices, not a statement of the charter.

Points that disagree with "tracking without limits" (to approve, then update):

| # | Where | What it says now | Proposed |
|---|---|---|---|
| 1 | ADR-0034 title and D7; `website-seo-geo.md` lines 33, 75-76, 151, 258 | no visitor tracking, no analytics script, would not add one | a new ADR supersedes D7; the plan says tools are chosen by the author |
| 2 | ADR-0051 item 5; `docs/handoff/website-stickers.md` section 6 (a received note, not edited) | "privacy as in the app": no cookies, nothing per person, no third-party scripts | the new ADR says the app's rule is the app's only; the handoff stays as received |
| 3 | ADR-0052 consequence; ADR-0067 consequence | no request to a third party; "no tracking and no cookies" | pointers to the new ADR; ADR-0067 keeps its own design (the strip makes no request) |
| 4 | ADR-0077 Q7, ADR-0092, `spec/13` section 6 and the technology row, sticker plan v1.1 | the counter: no identifier, no cookie, no IP, one event, ranks not numbers; a hosted counter "not proposed" | the limits become the counter's own design, not a site rule; the spec says other tools are allowed |
| 5 | ADR-0096 (written today) | an allowed list; "not allowed: identifiers, cross-site cookies, advertising links" | rewritten: the author chooses the tools; the list of allowed vendors stays explicit |
| 6 | Public words: the privacy page "This website", the sticker note, `st_privacy`, `llms-full.txt` | no cookies, no analytics, "nothing is sent" | composed from the real tools (more tools, more sentences, a cookie notice if cookies are used) |
| 7 | Build and tests: the ban on any third-party script; the words banned in `stickers.js`; `livecheck.mjs`; the worker's one-event rule | refuse anything not on the list | an explicit list of approved vendors in one file; anything else still refused |
| 8 | The app's files (README line "no telemetry unless you opt in"; `docs/privacy.md`; `PROJECT.md`) | true of the app, silent about the site | a note for the app session (sent); wording is theirs |
| 9 | Home page and README positioning (local-first, "no telemetry") against a site full of trackers | consistent only if the privacy page separates the app from the site clearly | already how the privacy page is built; keep that separation |
| 10 | Law (not a document mismatch): tracking with cookies or identifiers usually needs consent in the EU, and rules exist in Vietnam and Japan; Cloudflare does not replace that | no consent notice on the site | a lawyer's question (added) and a decision on a consent banner |

## 8. Third part (2026-11-14, night): what Bot Fight Mode costs, and a shorter paragraph proposed

**Lighthouse on the live pages** (this machine, mobile, one run each, noisy), with Cloudflare's two added scripts:

| Page | Performance | Accessibility | Best practices | SEO | CLS | TBT | LCP |
|---|---|---|---|---|---|---|---|
| `/` | 97 | 100 | **81** | 100 | 0 | 180 ms | 1.5 s |
| `/stickers/` | 96 | 100 | **81** | 100 | 0 | 210 ms | 1.4 s |
| `/vi/stickers/` | 91 | 100 | **81** | 100 | 0 | 350 ms | 1.3 s |

Best practices fell from 100 to 81 because of two deprecation warnings (the Fenced Frame API and `StorageType.persistent`) that come from `/cdn-cgi/challenge-platform/scripts/jsd/main.js`, the bot-protection script; that script takes about 470 ms of the main thread and the analytics beacon about 90 ms. The budget of spec 13 (100 for best practices, 99 for performance, TBT under 50 ms) is **not met on the live site** while that script is there; it was met on the local build. The cost of Bot Fight Mode is therefore: the live check in the workflow is blind (403), the budget above, and in return a basic bot filter on a static page whose origin (GitHub Pages) a bot cannot harm. The author decides between keeping it (and relaxing the budget) and switching it off (the script goes, the check works again).

**A shorter paragraph "This website" (proposal, English, about 125 words instead of 282 with every switch on; Vietnamese and Japanese follow when approved):** "This website sets no cookies of its own. Cloudflare, which delivers the site, runs its bot protection (a small script that may keep a technical cookie to tell people from bots) and Cloudflare Web Analytics, which counts visits and load times without cookies; visitors in the EU are not counted. When you copy a sticker, the page sends one note to a counter, the sticker's name and the page language and nothing else; the counter adds one to that day's total and keeps no list of visitors. The language suggestion and the recent stickers stay in this browser only, and Clear removes them."
The other long parts of the privacy page (the 304 words on what Peak notices, the 126 on the AI provider) are the app's facts, copied from the app's own documents; cutting them would cut facts, so they are not proposed. The How it works page (1,615 words with the menu and footer) was not re-read for this proposal.

**Approved and built 2026-11-14:** the shorter paragraph (all switches on: English 115 words, Vietnamese 143, Japanese 375 characters; it was 282 words in English). The author also chose to switch Bot Fight Mode off again; whether that removes the bot script from the pages is **not known** (when it was off for a few minutes on 2026-11-14 the script stayed on the pages): it is checked after the author switches it off, and `allowBotScript` and its sentence are removed only if the script is really gone.

**Correction (2026-11-14, later):** the author switched Bot Fight Mode off with the proxy left on. A first reading of the live pages found no bot script and no analytics beacon, and this was reported as "gone"; that reading was wrong: the machine's resolver handed out GitHub's address, so the pages came straight from GitHub. Read through a Cloudflare address (`curl --resolve streakboom.com:443:<a Cloudflare address>`) the bot script and the beacon are **still there with Bot Fight Mode off**. The live check now says "not checked" for a page that did not come through Cloudflare. What the bot script costs (W-67) therefore stays unless the proxy is switched off.
