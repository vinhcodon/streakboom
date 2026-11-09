# Website: a structure friendly to search engines (SEO) and AI answer engines (GEO)

**Status:** proposal written 2026-11-09 by the website session for the 0.2.5 release (asked for in `../handoff/website-release-prompt.md`); **the author chose on 2026-11-09 and [ADR-0034](../decisions/0034-website-structure-for-search-and-ai-engines.md) records it. Nothing is built yet**; the work in section 6 waits for the author to say start.

Source of the facts below: the live site on 2026-11-09 (fetched with `curl`), `site/`, `.github/workflows/pages.yml`, `README.md`, `CHANGELOG.md` and `app/src-tauri/tauri.conf.json`. Things I could not check are listed in section 7.

## 1. Where the site stands today

| Question | Today (streakboom.com) |
|---|---|
| What is it? | One static page, `site/index.html`, served by GitHub Pages from a GitHub Actions build (a Node step already runs in `pages.yml`). |
| Does the HTML contain the facts? | **English, yes**: "Windows 10/11", free, MIT, the author, the features, privacy, install steps and the FAQ are in the static HTML (16 KB, one `h1`, six `h2`, nine `h3`, one `main`, `header`, `nav`, `footer`). **The latest version, the date and the release notes, no**: the HTML says "latest release" and "Loading releases…"; JavaScript fills them in from `CHANGELOG.md`. |
| Vietnamese? | Only after JavaScript runs. A crawler that does not run scripts never sees a word of Vietnamese. There is one URL for both languages. |
| Files for crawlers | `robots.txt`, `sitemap.xml`, `llms.txt`, `404.html`, `/changelog/`, `/vi/` all answer **404**. |
| Structured data | None (no JSON-LD). Open Graph and Twitter tags exist, with a canonical link, a 1200x630 share image and a favicon set. |
| Language tags | `lang` on `<html>` is switched by script; no `hreflang`. |
| Rebuild triggers | `pages.yml` runs only for `site/**`, the rig, `scripts/build-site.mjs` and itself. A new release changes `CHANGELOG.md`, `updates/latest.json` and `tauri.conf.json`, none of which trigger a deploy. This matters for any static version of the facts (section 3, D2). |
| Performance | Not measured. The hero is a 360x360 canvas drawn by script; text is the likely first paint. |

**The main problem in one sentence:** the English facts are findable without JavaScript, but the freshest facts (version, notes), all Vietnamese and any machine-readable facts are not.

## 2. Goals, non-goals, and what I would not do

**Goals.** When a person or an assistant asks "what is Streakboom?", "a free open-source desktop pet for Windows", "does it work on Mac?" or "does it read my screen?", the answer found is **true, complete and current**, in English and Vietnamese, and it comes from the site.

**Non-goals.** Traffic for its own sake; ranking for generic words; a blog.

**I would not:**
- **Invent facts or ratings.** No `aggregateRating`, no reviews, no download counts, no awards, no social profiles that do not exist. Structured data states only what the page says and what the repository can prove (the build checks the version against `tauri.conf.json`).
- **Show crawlers something different** from what visitors see (hidden text, pages only for bots). `llms.txt` is a plain summary of the same facts, not a different story.
- **Stuff keywords** or write pages for phrases nobody asks.
- **Auto-translate** into more languages. English and Vietnamese are the two the app speaks.
- **Add visitor tracking** to measure. The product's promise is privacy; the site should not need a cookie banner (see D7).
- **Add a framework** for a handful of pages unless the author prefers it (D2 option C).
- **Promise what is not built:** macOS, code signing, a stats server. A visible "What Streakboom is not" block says so, so that assistants do not guess.

## 3. Decisions (multiple choice, the recommendation first)

### D1. Languages and URLs
How do English and Vietnamese live on the site?
- **A. One page, scripts switch the language (today).** Cost: none. Result: Vietnamese stays invisible to search and AI crawlers, and the language switch cannot be linked or shared. (Only the English facts become static.)
- **B. Two static pages, `/` in English and `/vi/` in Vietnamese, with `hreflang` and canonical links; the toggle becomes a plain link. (Recommended.)** Cost: a build step that generates both from one source (D2). Gains: both languages indexable, no flash of the wrong language, each language can be quoted and linked. `x-default` points at `/`. The existing share links (`streakboom.com`) keep working.
- **C. The same, but Vietnamese at `/` and English at `/en/`.** Choose it if most visitors are expected to be Vietnamese. The README, the app UI and most search queries about the product so far are English, so B is the safer default.

### D2. How the pages are produced
- **A. Edit static HTML by hand, one file per page and language.** Cost: none to start; the facts drift (version, notes, privacy text in four places).
- **B. A small Node build script in `scripts/` (no framework) that fills templates from one source of truth: strings in `site/i18n.js`, the version from `tauri.conf.json`, the notes from `CHANGELOG.md`; run by `pages.yml`. (Recommended.)** About 200 lines; I already have a script of this kind (`build-site.mjs`). `pages.yml` must also trigger on `CHANGELOG.md`, `updates/latest.json` and `tauri.conf.json`, so a release redeploys the site by itself. Checks (section 5) run in the same script and fail the deploy on a mismatch.
- **C. Astro** (or another static site generator). Gains: routing, content collections, an i18n helper, a sitemap integration. Costs: `node_modules`, a config, another thing to upgrade, and the interactive Peak still needs the custom rig build. Reasonable if the site is expected to grow beyond about six pages.

### D3. Which pages
- **A. Home and a changelog page.** Home = what it is, at a glance, features, install, privacy summary, FAQ, latest release. `/changelog/` = every version from `CHANGELOG.md`, one `h2` and `<time>` each.
- **B. A and a full privacy page, `/privacy/` (and `/vi/privacy/`). (Recommended.)** The privacy text is the part people and assistants ask about most ("does it read my screen?"), and the README text is long (keys, memory, stats, what Peak notices). A page of its own can be quoted whole; the home keeps a four-line summary.
- **C. Full split:** home, features, install, FAQ, privacy, changelog, each in two languages (12 pages). More entry points; more to keep true; a lot for one app.

The changelog is English only (the notes are written in English); the Vietnamese pages link to the same `/changelog/`.

### D4. Structured data (JSON-LD)
Facts first: as far as I know (my knowledge may be out of date, see section 7), Google shows rich results for `FAQPage` only to a few authoritative sites and has dropped `HowTo` rich results, and `SoftwareApplication` rich results need ratings, which we do not have and will not invent. So structured data here is for **machine-readable facts**, not for a snippet.
- **A. None.**
- **B. `SoftwareApplication` + `Person` (the author) + `WebSite`, and `FAQPage` using exactly the visible questions and answers; generated by the build and checked against the repository. (Recommended.)**
- **C. B plus `HowTo` (install) and `BreadcrumbList` (if D3 is B or C).** Low value (HowTo) or only useful with more pages (breadcrumbs).

### D5. Files for AI answer engines
- **A. None.**
- **B. `llms.txt` only:** a short, factual summary and links (README, changelog, privacy, FAQ, source).
- **C. `llms.txt` and `llms-full.txt`:** the second carries the full facts, privacy text, FAQ and the latest notes in one plain Markdown file, generated from the same source. **(Recommended: the files cost almost nothing once the build exists.)** Honest caveat: `llms.txt` is a proposal (llmstxt.org); I know of no major search engine that says it uses it, so the benefit is unproven. The content that does the work is the plain, self-contained sentences on the pages themselves.

### D6. Crawler policy (`robots.txt`)
- **A. Allow everything, list the sitemap. (Recommended.)** The project is open source and wants to be found and described correctly; blocking the crawlers that feed assistants makes wrong answers more likely, not less.
- **B. Allow search and "AI search" crawlers, block the crawlers that collect training data** (for example GPTBot, Google-Extended, CCBot). Keeps the pages out of future training sets; the facts may still be known from other sources, possibly worse ones.
- **C. Block all AI crawlers.** Not recommended for a project that wants to be found.
Crawler names change; I would check each vendor's page before writing the file (section 7).

### D7. How to measure (and what we will not use)
- **A. Google Search Console and Bing Webmaster Tools (verified with a DNS TXT record at name.com, so no code in the repository), plus a dated log of answers from AI assistants to a fixed set of questions (section 4). No analytics script on the site. (Recommended.)**
- **B. A + a privacy-friendly analytics script.** Gives visit counts and sources. A script on the site conflicts with a product whose selling point is privacy and may need a notice; I would not add it before there is a reason.
- **C. No measuring.** Then we cannot tell whether anything worked.

### Not a decision: the hero
Whatever is chosen: the `h1` and the facts are text in the first paint; the canvas has fixed `width`/`height` (no layout shift) and Peak starts after first paint (idle callback), so the hero cannot delay the page. I would measure with Lighthouse before and after rather than guess.

## 4. The structure if the recommendations (B, B, B, B, C, A, A) are accepted

**URLs:** `/` (EN), `/vi/` (VI), `/changelog/`, `/privacy/`, `/vi/privacy/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/llms-full.txt`, `/404.html`. `www` and `vinhcodon.github.io/streakboom` already redirect to `https://streakboom.com/` (GitHub Pages).

**Home, top to bottom:** one `h1` ("Streakboom: Peak, a desktop pet cat for Windows"); an **"At a glance"** block of short, self-contained, dated sentences (below); the interactive Peak; features (`h2` + `h3`); install (numbered steps, the file name from the build); privacy summary with a link to `/privacy/`; **"What Streakboom is not"**; FAQ (each question an `h3` with the answer's first one or two sentences complete on their own); latest release (static, from the changelog at build time); footer with the author and the licence. Landmarks `header`, `nav`, `main`, `footer`; link text says where it goes ("read the privacy page", not "here"); every image has alt text.

**At a glance (all verifiable in the repository):**
- Streakboom is an open-source desktop pet for Windows 10 and 11 (64-bit). The pet is Peak, a golden chibi cat.
- The app is free; the code is under the MIT licence. An optional AI "brain" uses your own key (Gemini, Claude or OpenAI) and is billed by the provider you choose; Gemini has a free tier.
- Latest version: 0.2.5, released 2026-11-09 (generated at build from `tauri.conf.json` and `CHANGELOG.md`).
- It installs for the current user without administrator rights; memory use is about 100 to 120 MB (measured on one computer).
- There is no account. Your keys stay in the Windows Credential Manager.
- The installer is not code-signed, so Windows SmartScreen warns on first run.
- Made by Vinh Codon; the source is at github.com/vinhcodon/streakboom.

**What Streakboom is not (also facts):** not an assistant (it is a companion that works with no AI at all); it does not read what you type, which keys you press, your screen, window titles or app names (it knows only when you last used the keyboard or mouse, where the pointer is, and whether the left button is pressed); not available for macOS or Linux (a macOS version is an idea without a date); not code-signed yet; its Claude and OpenAI brains have not yet been tried with real keys.

**JSON-LD sketch (home):** `SoftwareApplication` with `name: "Streakboom"`, `applicationCategory` (to choose; schema.org leaves it free text), `operatingSystem: "Windows 10, Windows 11"`, `softwareVersion` (from `tauri.conf.json`), `datePublished`/`dateModified` (from the newest changelog entry), `downloadUrl: https://github.com/vinhcodon/streakboom/releases/latest`, `offers: { price: "0", priceCurrency: "USD" }`, `license` (the MIT text in the repository), `inLanguage: ["en", "vi"]`, `author: { "@type": "Person", name: "Vinh Codon", sameAs: ["https://github.com/vinhcodon"] }`. No `aggregateRating`. `FAQPage` copies the visible FAQ.

**`llms.txt` sketch:** a title (`# Streakboom`), a one-paragraph summary (the at-a-glance sentences), then links with one line each: README, changelog, privacy, FAQ, the source repository, the latest release. `llms-full.txt`: the same facts, the privacy text, the FAQ and the newest changelog entries as plain Markdown.

**Naming:** one name for the product (**Streakboom**), one for the pet (**Peak**; each person can rename their own copy), one for the author (**Vinh Codon**, GitHub `vinhcodon`), used the same way on every page, in the share image, the JSON-LD and the files.

## 5. Build and checks (what makes it stay true)
The build fails (and the deploy does not happen) when:
1. the version in the JSON-LD, the at-a-glance block or `llms.txt` differs from `app/src-tauri/tauri.conf.json`, or the newest `CHANGELOG.md` entry is not that version;
2. the FAQ in JSON-LD differs from the visible FAQ;
3. an `hreflang` pair is not reciprocal, a page lacks a canonical link, or `sitemap.xml` misses a page;
4. a page has not exactly one `h1`, an image has no `alt`, or an internal link is broken;
5. a retired name (the author's old display name, see ADR-0033) or a forbidden claim ("almost no CPU", "sees what you type", "100% free", a macOS promise) appears.
A no-JavaScript test (`curl` the page, check that the at-a-glance facts, the version, the install file name and the first changelog entries are in the HTML) runs in the same script. `pages.yml` also triggers on `CHANGELOG.md`, `updates/latest.json` and `app/src-tauri/tauri.conf.json`.

## 6. Order of work once the author has chosen (sizes: S small, M medium)
0. **Baseline (S):** record today's answers from the assistants and today's Lighthouse numbers, before any change.
1. **Data and templates (M):** one data module (version, date, notes, strings), the templates, the build script and the checks; `pages.yml` triggers.
2. **English home, static (M);** then **Vietnamese (S)**, `hreflang`, language links instead of the script toggle.
3. **Changelog and privacy pages (S each).**
4. **JSON-LD, sitemap, `robots.txt`, `llms.txt`, `404.html` (S).**
5. **Verification and measuring (S):** Lighthouse, the no-JavaScript test, Search Console and Bing verification at name.com, the assistant question log.
Each step is a small commit on explicit paths (ADR-0023); the interactive Peak, the favicon and the share image stay as they are.

## 7. Measuring success, and what I could not verify
**Fixed question set** (ask in a new chat, with search on where the assistant has it; log the date, the assistant, the full answer and a score):
English: "What is Streakboom?", "Is there a free open-source desktop pet for Windows?", "Does Streakboom work on Mac?", "Does Streakboom read my screen or what I type?", "Why does Windows warn me when I install Streakboom?", "Who made Streakboom?"
Vietnamese: "Streakboom là gì?", "Có thú cưng mèo miễn phí, mã nguồn mở cho màn hình Windows không?", "Peak có đọc những gì tôi gõ không?"
Assistants: ChatGPT, Claude, Gemini, Perplexity, Copilot.

**A proposed definition of success** (the author may change the numbers): within 8 weeks of the change (1) `/`, `/vi/`, `/changelog/` and `/privacy/` are indexed in Google and Bing; (2) the brand query "streakboom" shows streakboom.com first; (3) at least four of the five assistants answer "What is Streakboom?" correctly (Windows, free, open source, bring your own key), and none states a feature that does not exist (macOS, screen reading); (4) Lighthouse on mobile: performance, accessibility and SEO each at least as good as the baseline from step 0 and none below 90 unless the baseline was lower; (5) the no-JavaScript test stays green in CI.

**Not verified / assumptions** (they go to `verification-debt.md`):
- That the common AI crawlers do not run JavaScript. It is widely said and I have not tested it per crawler; the plan does not depend on it, it only makes the static facts safe either way.
- The current status of rich results for `FAQPage`, `HowTo` and `SoftwareApplication`, and of `llms.txt` support, from my knowledge only. Check each vendor's documentation when D4 and D5 are built.
- The exact names of the AI and search crawlers for `robots.txt` (D6).
- The Lighthouse and Core Web Vitals numbers (not measured), and how the page ranks or is described today (no baseline yet).
- Whether the facts in the "At a glance" block are all still true at the next release; the build check covers the version, the rest depends on reading (ADR-0033, release housekeeping).

## 8. Decisions and result
Answered by Vinh on 2026-11-09; recorded in [ADR-0034](../decisions/0034-website-structure-for-search-and-ai-engines.md).

| | Choice | Date |
|---|---|---|
| D1 languages and URLs | **B**: `/` English, `/vi/` Vietnamese | 2026-11-09 |
| D2 how pages are produced | **B** (a small Node build script, no framework), chosen by the website session as the author asked ("the option that fits GitHub Pages": static output built in the existing Actions job) | 2026-11-09 |
| D3 which pages | **B**: home, changelog, privacy | 2026-11-09 |
| D4 structured data | **B**: SoftwareApplication, Person, WebSite, FAQPage | 2026-11-09 |
| D5 files for AI engines | **C**: `llms.txt` and `llms-full.txt` | 2026-11-09 |
| D6 crawler policy | **A**: allow everything, name the sitemap | 2026-11-09 |
| D7 measuring | **A**: Search Console, Bing Webmaster, an assistant answer log; no analytics script | 2026-11-09 |
