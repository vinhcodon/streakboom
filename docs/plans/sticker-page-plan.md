# Plan: the sticker page as a picker (v0, then v1)

Status: **approved by Vinh on 2026-11-13 ("duyệt"); v0.1 (the tag rules and the proposal page), v0.2 (the search), v0.3 (saved stickers) and v0.4 (Peak's lines) are built; v0.5 (permalinks) was dropped (ADR-0083); v0.6, v0.7 and v0.8 are not built.** Earlier status: a proposal; Vinh answered Q3 to Q10 on 2026-11-13 (ADR-0077: anonymous counting yes from v1, share-first on phones after a test, automatic tags, no white variant, no new language yet, no Download button); the plan itself still waits for his approval to start**; nothing is built. The requirements, the flows, the data model, the search, the measurement and the open questions are in [`../../spec/13-sticker-page.md`](../../spec/13-sticker-page.md); the hands-on table for Vinh is [`../handoff/sticker-test-matrix.md`](../handoff/sticker-test-matrix.md). Input: [`../handoff/sticker-page-hypothesis.md`](../handoff/sticker-page-hypothesis.md) (v0.2). Owner of the work: the session that owns `site/`. No app code. Each step that changes the page waits for Vinh's look before it is committed (AGENTS rule 8's spirit: the author sees a build first).

**What the plan does not do:** animated stickers, accounts, user content, a counting service before Q7 is answered, a new language before Q3 is answered.

**Numbers.** Thresholds (for time to the first copy, the share rate, the return rate) are **left empty until a baseline exists** (the rule of the requirements draft: no invented thresholds). The plan says what is measured and how; Vinh sets the numbers after the first month of data.

## Phase 0: before building anything (a week of Vinh's time, no code)

| # | Step | Who | Done when | How it is measured |
|---|---|---|---|---|
| 0.1 | **(Vinh made a quick check of all his platforms on 2026-11-13 and found Zalo and Teams OK; no cell was filled.) The chat table (V1) for the priority cells:** Zalo and Teams, on the environments Vinh really uses (Windows desktop apps and web first), routes copy-paste and drag-and-drop; then phones | Vinh | the priority cells of the matrix are filled, with a screenshot name for each | the matrix itself; no cell is marked "works" without a screenshot |
| 0.2 | Answer **Q3 to Q10** of spec 13 section 10 | Vinh | **Done 2026-11-13:** ADR-0077 | the ADR exists |
| 0.3 | **Read Search Console and Bing** for the indexing questions of spec 13 section 7 and paste the facts (URL Inspection of three addresses, the Pages report reasons, the sitemap counts) | Vinh | the facts are in `website-seo-geo.md` with the date | the facts exist; **no cause is concluded before this step** |
| 0.4 | The website session reads the matrix and **adjusts v0**: for example, if Zalo flattens onto white, the dark-theme question is moot there; if Teams rejects a dragged image, drag-and-drop is dropped from the flows | the website session | spec 13 section 1 states what is now known, each item with its cell | a diff of the spec |

Phase 0 is **not optional**: it is the only way to know what "send a sticker" even looks like in Zalo and Teams, and the first phases are cheap only if it is done first.

## Phase v0: make today's page a picker (the handoff's section 10, adjusted to what exists)

What exists (spec 13 section 0.1): the grid of 31, the copy, the Share link, the recent row. v0 adds:

| # | Step | Done when | How it is measured |
|---|---|---|---|
| v0.1 | **Built 2026-11-13 (waiting for Vinh to skim [`sticker-tags-proposed.md`](sticker-tags-proposed.md)).** **Tags by the system (Q9):** `tags.json` (the controlled vocabulary, the names per language, the one or two sentences per tag), `tag-rules.json` (the keyword dictionary) applied at build time to the captions, titles and alt texts, an `overrides` file, and the **`tags.proposed.md`** page for Vinh to skim once; the build names any sticker the rules do not tag (spec 13 section 2) | every one of the 31 stickers gets emotions, situations, synonyms and an `edge` from the rules; a table of captions with the expected tags passes; Vinh has skimmed the proposal page | the build and the tests |
| v0.2 | **Built 2026-11-13 (not yet seen by Vinh).** **Search** by name, tag and synonym, **without diacritics**, with typos (spec 13 section 3): the box, the index file, the normalisation, the "no results" line | the table of **at least 40 queries per language** gives the expected first results (every query); the index loads on the first focus without moving the layout | the test table (automatic); Lighthouse after the deploy (layout shift 0.000, accessibility 100) |
| v0.3 | **Favourites REMOVED on 2026-11-13 (Vinh: no one will press a Save button); the recent row by slug stays.** Earlier: **Built 2026-11-13 (ADR-0079; not yet seen by Vinh).** **Mine:** favourites added to the recent row, kept by slug (not by number); a note on the page that they stay in this browser | a favourite survives a reload; Clear removes both; a blocked storage does not break the page | tests with a fake storage; a real browser check |
| v0.4 | **Built 2026-11-13 (ADR-0079).** **Peak's voice:** four or more variants of the line after a copy, one for "no results", per language, obeying the charter; the line still appears for a screen reader | the lines are in the manifest of texts and checked by the same word checks | tests; a screen reader read-through by Vinh (not claimed before) |
| v0.5 | **DROPPED on 2026-11-13 (ADR-0083: no permalink page and no story for now).** Earlier text: **Permalink pages and Open Graph** for the 31 stickers in three languages (about 93 pages), the hub linking them, structured data, `hreflang` between the three, the sitemap, `llms.txt` | the pages are built from the data with no hand-written HTML; every page has its own title and description; the checks (links, hreflang, canonical, size) pass | the build; the schema validator; Search Console **after** the deploy (indexing is read, not assumed) |
| v0.6 | **Route changes:** the mobile **Share-first** behaviour (Q8, approved) **only after a phone test** (until then a tap copies as today); drag-and-drop made reliable if the test shows it works; **no white-background variant** (Q10: only if an app is later found to need it) | each change has its matrix cell in the "after" state | the matrix, re-run on the changed cells |
| v0.7 | **Time to the first copy, without recording anything:** **5 to 8 moderated sessions** (people who use Zalo or Teams at work, asked to "send a sticker to a colleague"), with a stopwatch or a screen recording kept by Vinh; the median and the range written in `website-seo-geo.md` | the sessions are done and written down | the stopwatch; the count of taps or clicks per route |
| v0.8 | **Built 2026-11-13 (ADR-0084): the row is called "Peak's picks", not "Popular", because nothing is counted.** **An editorial "popular" row** chosen by Vinh (no counting), shown on the hub | the row exists and can be edited in the data | none |

**v0 is done when:** the priority cells of the matrix are filled and v0.1 to v0.5 are live; the hub and a sample of permalinks score **100 / 100 / 100 and 99 or more for performance with a layout shift of 0.000** on a clean runner; the 40-query tables pass; **at least five moderated sessions** show a median of **no more than two actions on the page (click or tap, then paste or pick the app)** on the main route (the handoff's H1; the number comes from the handoff, the sessions say if it holds); and the debt list says what was not checked (the phones, Safari, the screen reader).

## Phase v1: growth (after v0; counting was approved by Vinh in Q7)

> **2026-11-14 (ADR-0096):** the website may also count visits (Cloudflare Web Analytics, a script added by hand, switched off until its token is given); the copy counter is unchanged.
>
> **2026-11-13 (ADR-0092): counting is built but off until the author deploys the Worker** (v1.1: the switch, the texts and the Worker are done; v1.2 HOT waits for the thirty-day reading, v1.7). Earlier the same day ADR-0091 paused it.
>
> *Earlier note:* **ADR-0091: counting is paused**, so v1.1, v1.2 (HOT), v1.3 and v1.7 wait; the row of Peak's picks (v0.8) stays. The test of W-57 shows what a GitHub counter would do (all requests counted, a lag of 15 to 25 minutes).

| # | Step | Done when | How it is measured |
|---|---|---|---|
| v1.1 | **Anonymous counting (Q7: yes):** the privacy text changed **first** (the sticker pages and the privacy page, three languages), then the minimal events of spec 13 section 6 to a small counter (option 2 there); an ADR; a lawyer's note added to the list | the counter receives events; no identifier, cookie or IP is stored by our code; the pages say what is counted | a test that the page sends only the listed events; the Worker's code reviewed; the privacy wording read |
| v1.2 | **HOT** (last 7 days) built **at build time** from the daily totals; **New** from `added`; chips for emotions and situations; the **cheekiness filter**; **shelves by the hour** (the person's own clock) | each shelf is a view of the data; no run-time call to the counter for reading | build checks; Lighthouse |
| v1.3 | **Dropped with v0.5 until it is revisited (ADR-0083): tag pages need permalinks.** Earlier text: **Tag pages** (the tags with six or more stickers, with their introductions) and the **staged publication** of new permalinks in batches, each batch followed by a **Search Console coverage read** | a stage is accepted when the previous stage's pages are indexed or the reason is understood | Search Console (pages indexed, impressions, clicks) |
| v1.4 | **Scale:** a virtual or paged grid for hundreds of stickers, the index split if over the size budget, the build and its checks timed; **decide layers (captions on the client) after a Safari test and a build-time picture test**, for new languages only | 1,000 stickers in a test catalogue keep the hub under the budgets (index at most 150 KB gzip per language, a layout shift of 0.000, total blocking time under 50 ms) | a generated test catalogue; Lighthouse on a clean runner |
| v1.5 | **Peak on the page** (spec 13 section 5) and the **single, soft invitation to the app after the fifth copy** with a permanent "no thanks" | Peak runs without covering the grid, stops while typing, obeys reduced motion; the invitation shows once | Lighthouse with Peak running; a manual check; the invitation's `download-click` events if Q7 is yes |
| v1.6 | **PWA** (open again fast, installable, offline recent and favourites) | the page opens offline with the recent stickers; the cache has a size cap and is cleared with Clear | a manual offline check; Lighthouse |
| v1.7 | **Measurement read** after the first 30 days of counting: the median time to the first copy, the share-per-view rate, the no-result rate, the platform mix, the share against the fallback, the returning rate (rough), the app link clicks against the daily downloads, and (from Search Console) impressions and clicks per sticker page | a table in `website-seo-geo.md` with the dates; **then Vinh sets the thresholds** and the stop or widen rule, written as an ADR | the table |

**v1 is done when:** v1.1 to v1.5 are live, v1.7 has a first reading, and the thresholds are set by Vinh. The counting (v1.1) comes first among the v1 steps because HOT, the time to the first copy and the share rate depend on it, and **no event is sent before the texts say so**.

## Dependencies and risks

- **The chat apps decide what the sticker looks like.** If Zalo flattens onto white and shows it large, the page cannot fix that; only a real sticker pack could (the author declined that route, ADR-0051). Phase 0 says how much this matters before anything is built.
- **Thousands of pictures are a repository and a build problem** before they are a page problem (spec 13 section 4): the answer is layers for new languages, decided in v1.4.
- **Thin pages:** publish in stages and read Search Console between them (v1.3).
- **A counter changes a promise:** nothing is counted before the texts say so (v1.1).
- **The sticker session's folder is shared:** the website session reads `set-v2` and the later sets; a new folder layout (one folder per sticker) is agreed with the sticker session first.
- **Not verified anywhere yet:** every behaviour of Zalo and Teams; Web Share on phones; the Safari clipboard; the indexing cause; the legal reading of counters.
