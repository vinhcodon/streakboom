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

## 6. Order of work, and where it stands (2026-11-09)
0. **Baseline (S): not done.** No Lighthouse numbers and no assistant answers were recorded before the change; the only "before" is the evidence in section 1. Lighthouse can still be run on the new site, and the assistants asked (the question set is in section 7), but they now measure the new site only.
1. **Data and templates (M): done.** `scripts/site/facts.mjs` (version, notes), `site/strings.mjs` (both languages), `scripts/site/pages.mjs`, `scripts/build-site.mjs`, the checks of section 5 in `scripts/site/checks.mjs` with a test for each rule (`node --test scripts/site/`), and `pages.yml` uploading `_site/` and triggering on `CHANGELOG.md`, `updates/latest.json` and `tauri.conf.json`.
2. **English home, static (M) and Vietnamese (S): done.** `/` and `/vi/`, `hreflang` with `x-default`, the language switch is a plain link, the "At a glance" and "What Streakboom is not" blocks, the FAQ questions as headings. The interactive Peak starts after the first paint.
3. **Changelog and privacy pages (S each): done.** `/changelog/`, `/privacy/`, `/vi/privacy/`; the home keeps a four-item privacy summary.
4. **JSON-LD, sitemap, `robots.txt`, `llms.txt`, `llms-full.txt`, `404.html` (S): done.**
5. **Verification and measuring (S): partly.** Done: unit tests, a build in a clean checkout, the deployed URLs and redirects probed with `curl`, structure and layout looked at in the built-in browser. Open: Lighthouse, an external validator for the JSON-LD, Search Console and Bing (DNS TXT at name.com), the assistant question log (`verification-debt.md` W-7, W-8 and W-11 to W-14).
Each step was committed on explicit paths (ADR-0023); the interactive Peak, the favicon and the share image stayed as they were.

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
Added later: a Japanese version (`/ja/`, `/ja/privacy/`) on 2026-11-09, [ADR-0035](../decisions/0035-website-in-japanese.md); the structure of D1 to D7 is unchanged, `hreflang` now covers three languages.

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

## 9. Next improvements after 0.3.0 (proposal 2026-11-09; **the author chose the recommended option of N1 to N5 the same day, ADR-0040; N4, N2 and the N5 budget are built (see section 11); N3 is not**)

What the site does today, measured on the build of 2026-11-09: three languages (`/`, `/vi/`, `/ja/`), eight pages, every fact in the static HTML, JSON-LD (SoftwareApplication, Person, WebSite, FAQPage) with the version checked against `tauri.conf.json`, titles of 27 to 59 characters and descriptions of 62 to 152, `llms.txt` (1.6 KB) and `llms-full.txt` (13.6 KB). The scripts of a page are about 16 KB gzipped in total, the rig included; the home page is about 27 to 33 KB of HTML. The structured data has no `featureList`, no requirements and no link to the release notes; the Japanese pages use the English questions translated, not the questions Japanese readers ask; no Lighthouse run and no assistant answers have ever been recorded (W-7, W-8).

### N1. The making-way scene of the tour and the new notice beat (the app's 0.3.0)
In the app Peak now stops for a moment, looks toward your work with ears up (a `notice` pose: eyes a little wider, flat mouth, ears raised; subtle on a cat facing you), and then walks or hops away. The captions and the feature card already say so in words. Should the tour show it?
- **A. Keep the scene as it is (a walk to the left) and the caption that says "it notices, looks toward your work, then walks off". (Recommended.)** No change; the pose is subtle from the front and would look like a small flicker.
- **B. Play the notice pose for about one second at the start of the making-way scene, then the walk.** Shows the beat; costs one more pose in a scene; the rig already has it.
- **C. A scene of its own with its own chip ("Notices").** Most visible; eleven chips (three rows on a phone) and one more caption in three languages.

### N2. A "How it works" page
Assistants quote pages that answer one question completely. Today the answers are spread over the home page, the FAQ and the privacy page.
- **A. No new page.**
- **B. One page per language (`/how-it-works/`, `/vi/how-it-works/`, `/ja/how-it-works/`) in plain words: no AI by default, how a brain is added (your key, kept in the Windows Credential Manager), what is stored on your computer, what Peak notices and never reads, what is free and what is billed, how updates work. Written from the README and the app's records, with the same build checks. (Recommended.)** Cost: nine strings blocks in three languages; every future change of these facts must be made there too (the build's outdated-wording list helps).
- **C. A comparison with other desktop pets.** I would not: claims about other products cannot be checked from this repository and go stale.

### N3. Japanese search wording
The Japanese pages are translations. Japanese readers look for things like デスクトップマスコット, 常駐, 無料, オープンソース, 猫.
- **A. Leave as it is.**
- **B. Rework the Japanese title, description and headings to use those words where they are true (for example "デスクトップマスコット" next to "デスクトップペット"), and add three or four Japanese questions to the FAQ that Japanese readers ask (is it free, how heavy is it, does it read my screen, how do I uninstall), each with a direct first sentence. (Recommended.)** Needs a Japanese reader to confirm the wording (W-16); no keyword lists.
- **C. B and a Japanese share image** (the image has English and Vietnamese text today).

### N4. Structured data and the `llms` files, generated from the repository
- **A. Leave as it is.**
- **B. Add to `SoftwareApplication`: `featureList` (the nine card titles, from `site/strings.mjs`), `softwareRequirements` ("Windows 10 or 11, 64-bit; WebView2 runtime"), `releaseNotes` (the changelog URL), `screenshot` (the share image); state in `llms.txt` and `llms-full.txt` the languages (English, Vietnamese, Japanese beta), the four brains in order and which are free; add the question "Is Streakboom safe to install?" (open source, unsigned installer, installs for the current user, no administrator rights). All generated, with a build check that each value appears on a visible page. (Recommended.)**
- **C. B and a second entity `SoftwareSourceCode` for the repository (language Rust and TypeScript, MIT).** Helps developer-style questions; one more thing to keep true.

### N5. Speed and measuring
- **A. Only measure: run Lighthouse (mobile and desktop) once now and write the numbers into the plan as the baseline; change nothing.**
- **B. A and a size budget in the build** (fail if the scripts of a page exceed, for example, 30 KB gzipped or the home HTML 60 KB). **(Recommended.)** Cheap, keeps the hero from growing unnoticed; Lighthouse stays a manual check.
- **C. B and Lighthouse in GitHub Actions on every deploy.** Needs a headless browser in the job, slower and noisier numbers; I would not start here.
In every option: the fixed question set of section 7 gets three Japanese questions (Streakboomとは？ / Windowsで使える無料のオープンソースのデスクトップペットはある？ / Peakは入力内容や画面を読みますか？), and the baseline answers of the assistants are recorded **before** any of N1 to N4 is built (by the author; the agent cannot ask the assistants).

### What I would not do, and why
Pages for competitors or "best desktop pets" lists (unverifiable claims, they go stale, and they read as marketing); translating the changelog (the notes are written in English by the app session and would drift); generating a page for every question (thin pages dilute the site); structured data for anything not visible on the page, ratings, reviews or download counts (untrue or unprovable); different text for crawlers; keyword lists in titles or hidden text; more pages than a one-app site needs; analytics scripts (ADR-0034, D7).

### Answers (2026-11-09, [ADR-0040](../decisions/0040-website-next-improvements-for-search-and-ai-engines.md))
| | Choice |
|---|---|
| N1 the notice beat in the tour | **A**: keep the scene, the caption says it |
| N2 a "How it works" page | **B**: one page per language |
| N3 Japanese search wording | **B**: title, description, headings and three or four Japanese questions (a Japanese reader to confirm) |
| N4 structured data and `llms` files | **B**: `featureList`, requirements, release notes, screenshot; languages and brains in the `llms` files; a "safe to install" question |
| N5 speed and measuring | **B**: a Lighthouse baseline and a size budget in the build |
Order of work: the baseline first (before N2 to N4), then N4, N2, N3, N5's budget.

## 10. Baseline, step 0 of ADR-0040 (2026-11-09)

**Lighthouse 12.6.1, Chrome (the author's machine), one run each, simulated throttling for mobile.** Run on the live site before any change of ADR-0040:

| Page | Form factor | Performance | Accessibility | Best practices | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| `/` | desktop | 98 | 100 | 100 | 100 | 0.6 s | 0.6 s | 0 ms | 0.076 |
| `/` | mobile | 98 | 100 | 100 | 100 | 1.7 s | 1.7 s | 70 ms | 0.015 |
| `/ja/` | mobile | 98 | 100 | 100 | 100 | 1.8 s | 1.8 s | 30 ms | 0 |
| `/privacy/` | mobile | 100 | 100 | 100 | 100 | 1.0 s | 1.0 s | 0 ms | 0 |

Transfer: 39 to 41 KB and 12 requests for a home page, 15 KB and 4 requests for the privacy page. What Lighthouse still lists, not fixed on purpose: static assets cached for 10 minutes (GitHub Pages sets the header; we cannot change it), 2 KiB of unminified JavaScript (a build-time minifier would be a new dependency for 2 KiB), images "properly sized" (the 96 px header logo shown at 32 px, 4 to 6 KiB), a DOM-size and a network-chain insight (the module scripts load in a chain, but only after the first paint).

**Two things the baseline found, fixed the same day** (site commit of 2026-11-09 after `de24437`): (1) a layout shift of 0.076 on desktop and 0.015 on a phone: the scene chips were created by the script and, on a phone, the "send the link to my PC" notes were switched by the script after load; the chips are now in the static HTML (the labels are readable without the script too) and the platform class is set on `<html>` by a small script in the head before the first paint; (2) the language links (`EN`, `VI`, `JA`) had accessible names that did not contain their visible text ("English" for "EN"); they are now "EN (English)". **After, on the live site once deployed (commit `cee9673`, one run each):** home desktop performance 99, layout shift 0 (FCP 0.6 s, LCP 0.6 s, TBT 0 ms); home mobile performance 100, layout shift 0 (FCP 1.2 s, LCP 1.2 s, TBT 0 ms); accessibility, best practices and SEO 100 in both; the name-mismatch audit passes. (Before the deploy, on a local build, desktop had reached 100 with a shift of 0.007 and mobile 98 to 99 with 0.) The build now checks both fixes (the chips in the static HTML, the accessible names).

**Not yet recorded: the assistants' answers** to the fixed question set of section 7 (English, Vietnamese and now three Japanese questions). Only the author can ask them; the baseline of the answers must exist **before** N2 to N4 are built.

## 11. Size budget and what was built (2026-11-10)
The build now fails when the scripts together exceed 30 KB gzipped or a home page exceeds 60 KB of HTML (`sizeProblems` in `scripts/site/checks.mjs`, with a test). Measured at the time: scripts 17.5 KB gzipped; home pages 29.5 KB (EN), 33.9 KB (VI), 35.9 KB (JA). N4 (structured data, llms facts, the safe-to-install question) and N2 (the How it works pages) are built; N3 waits for a Japanese reader. Lighthouse stays manual. Not verified: the budget numbers are the ADR's round figures, not derived from a user-speed target.

## 12. Baseline of the assistants' answers (2026-11-10, asked by the website session)
Asked on 2026-11-10, **after** the N4 and N2 changes were live (so this is a baseline of how the world sees the site right now, not a before-and-after of those changes; the site was only a day or two old). Each question was asked once, in a fresh chat.

**Where:** ChatGPT, logged out, temporary chat, search suggested in the link, the basic model (12 answers: all 6 English, 3 Vietnamese and 3 Japanese; the Japanese questions are my own wording of the English ones). Perplexity, logged out: only the first question, then it asked for a sign-in. **Not asked:** Claude, Gemini and Copilot (they need a sign-in; the session may not enter passwords) and the rest of Perplexity.

| Question | Answer in short | Streakboom (the pet) found? |
|---|---|---|
| What is Streakboom? (ChatGPT) | Suggested the user meant StreakBloom, an Android habit tracker | No |
| What is Streakboom? (Perplexity) | A small GitHub repo `joeszz/streakBoom` ("Push your streak"), a different project; its page could not be read | No (a different project) |
| Is there a free open-source desktop pet for Windows? (EN, JA, VI) | OpenPets, DeskCat, BongoCat, PixelPaw(s), Desktop Pets, VPet-Simulator, Shimeji-ee | No, in all three languages |
| Does Streakboom work on Mac? | Could not find a product by that name; asked for a link | No |
| Does Streakboom read my screen or what I type? | No policy found; asked for a link | No |
| Why does Windows warn me when I install Streakboom? | Generic SmartScreen and unsigned-installer reasons; advised against Run anyway until checked | No, but the generic reasons are right |
| Who made Streakboom? | Could not find a reliable source | No |
| Streakboom là gì? (VI) | StreakBloom again | No |
| Peak có đọc những gì tôi gõ không? (VI) and the Japanese version | Another app called Peak (an AI coach) | No |
| Streakboomとは？ (JA) | Not known; offered StreakBloom | No |

**Reading:** in 0 of 13 answers was the desktop pet found. The name is confused with StreakBloom, and a different GitHub repo `streakBoom` exists. The pet competes with many better-known desktop pets for the generic questions, and "Peak" alone is the name of other apps. Nothing here shows the site is wrong; it shows it is not yet in what these assistants retrieve. Things worth doing once the site is older: ask again in a few weeks and compare; make sure the description and the first line name the product with its kind ("desktop pet for Windows") next to the name; Search Console and Bing Webmaster indexing (the author's part, D7).

**Not verified:** one run per question; ChatGPT answers vary between runs, and a logged-in or paid model with live search may do better; the logged-out basic model may not have searched at all; Claude, Gemini, Copilot and most of Perplexity were not asked; no score beyond found / not found.

**Decision (Vinh, 2026-11-10):** option C, no wording change for now. Option A (the name with its kind in the H1 and first line, a line "not a habit tracker" in the not-list, and an FAQ question "Is Streakboom the same as StreakBloom or a habit tracker?") stays available; ask the assistants again in a few weeks (after Search Console and Bing have crawled the site) and decide then from the new answers.

**Search Console and Bing Webmaster (D7), 2026-11-10:** Vinh registered the site in both and submitted `https://streakboom.com/sitemap.xml`. Not verified by the website session: whether either accepted the sitemap or has indexed any page (only the author can see that). Next check: in about two weeks look at the page indexing report and any coverage errors, then ask the assistants the fixed question set again and compare with the baseline above.

## 13. After 0.3.1 (2026-11-10): what was done, and the proposals the author answered
**Done (ADR-0042):** the privacy wording for the sense under Peak's feet in all four places and three languages, the fall and the end of self-hopping on the "out of your way" card, 267 lines and the stages on the "alive without AI" card and the How it works page, What Peak is told on the How it works page, the numbers of the README, "An early release ({version})" in place of "First official release (0.2)". The build now reads the README and fails if the line count, the memory and processor numbers or the "under its feet" wording are missing from a language's pages.

**Proposed as multiple choice, answered by Vinh on 2026-11-10:**

| | Proposal | Answer |
|---|---|---|
| P1 | A tour scene for "the window it stands on goes away, Peak falls" | **No scene** (recommended): the page has no window to lose; a startled pose with a caption would mislead |
| P2 | The build checks memory and processor numbers against the README too | **Yes** (recommended) |
| P3 | An Atom feed of the whole changelog generated from `CHANGELOG.md` | **Yes** (not the recommended option, which was no; built) |

**Still open from before:** the wording that names the product with its kind next to its name and separates it from StreakBloom (option A of section 12; the author chose to wait and ask the assistants again after the crawlers have visited); a native reader for the Vietnamese and Japanese texts.

**What I would not do, and why:** a comparison page with other desktop pets (claims about other products cannot be verified, ADR-0040); a Japanese-only share image (little gain); `HowTo` structured data (search engines have dropped most HowTo rich results); an `llms.txt` per language (the assistants read the English file and the pages are in three languages already); a monitoring script on the page (the site has no analytics on purpose, ADR-0034).

**Not verified:** nothing of this is on the Pages host yet (not pushed); the feed has not been opened in a feed reader; the new texts have no native reader.

## 14. A short, gentle site (2026-11-10): measurements, structures, voice, the charter (ADR-0048)
Asked by the app session (`docs/handoff/website-restructure-request.md`): the site feels long-winded; propose, the author decides, a record first. **Decided by Vinh on 2026-11-10 (all four the recommended options): [ADR-0048](../decisions/0048-a-short-gentle-website-with-the-charters-promises.md). Nothing is built yet.**

### 14.1 Measurements (the built site at version 0.3.1, visible text of the main area, without the header and footer)
| | English (words) | Vietnamese (words) | Japanese (characters) |
|---|---|---|---|
| Home page | 2,862 | 3,198 | 8,591 |
| How it works | 659 | 775 | 1,626 |
| Privacy | 623 | 756 | 1,736 |
| `llms-full.txt` (English only) | 3,037 | | |
| `llms.txt` | 338 | | |

Japanese is counted in characters (about 3 per English word), so the columns are not comparable. **The home page has nine blocks** (English words): hero 205, at a glance 158, features 559 (nine cards), how to play 92, install 74, privacy 261, not 71, FAQ 638, updates 810 (the three newest releases). **The FAQ has ten answers** of 19 to 137 words in English (a8, the one about reading the screen, is the longest; the Japanese ones reach 285 characters).

**What is said more than once** (English; number of places in the strings, home / privacy / how-it-works):
| Fact | Places | Where |
|---|---|---|
| Works without AI | 9 | 5 / 0 / 4 (feature title, FAQ, description, not-list, the whole how page) |
| Free and MIT | 7 | 6 / 0 / 1 |
| Gemini and Groq have free tiers | 7 | 5 / 1 / 1 |
| Never reads what you type or your screen | 6 | 4 / 1 / 1 (the home privacy block, two FAQ answers, the not-list, the privacy page, the how page) |
| Not code-signed, SmartScreen | 5 | 5 / 0 / 0 (the hero notice, a2, at a glance, not-list, a10) |
| No account | 5 | 3 / 1 / 1 |
| The key stays on your computer (Credential Manager) | 4 | 2 / 1 / 1 |
| How updates work | 4 | 2 / 1 / 1 |
| Groq, Claude and OpenAI not yet tried with a real key | 3 | 3 / 0 / 0 |
| Daily limit of 60 and 6 | 3 | 2 / 0 / 1 |
| Memory use of 100 to 120 MB | 2 | 2 / 0 / 0 |

**The worst repeats:** "does it read my screen" (four places on the home page alone plus the two pages), the not-code-signed warning (five places on one page), and "free" (seven). **What a first-time visitor needs to decide "do I download it":** what it is (hero), what it will not do to you (a few promises), that it is free, what it costs in trouble (Windows only, the SmartScreen warning), the three install steps, and a handful of answers. **What is for people who want the detail:** every feature in full, the gestures table, the limits, memory and processor numbers, the exact privacy list, the changelog.

### 14.2 The three structures proposed (word budgets are English; Vietnamese about +12%, Japanese about 3 characters per word)
| | S1 short home (chosen) | S2 medium home | S3 trim in place |
|---|---|---|---|
| Home | 600 | 1,100 | 1,800 |
| How it works | 900 (adds the features in detail, the gestures, the rest of the FAQ) | 700 | 650 |
| Privacy | 500 ("exactly what, where kept") | 450 | 500 |
| `llms-full.txt` | about 1,500 | about 2,000 | about 2,400 |
| Cut | at a glance, not, the home privacy block, nine cards to four lines, the updates to one | not merged into the FAQ, updates to one, gestures shortened | wording only |
| Moves behind a link | feature detail, gestures, 5 of 10 FAQ answers | gestures to a link | nothing |
| Cost for search and AI | the build's text checks must move to the pages that carry the text; FAQPage on two pages; less keyword text on the home page | smaller | none |
| Cost for the three languages | three rewrites, two of them unread by a native speaker | the same, smaller | the same, smaller |
| Cost for the hero tour | none | none | none |

### 14.3 The voice: before and after (the headline block, one feature, one FAQ answer)
Rules: warm, short, a little playful, never loud, no guilt, no jargon, no claim the app cannot back (charter article 1). The headline says "makes way when you work next to it", which is released behaviour; it does not say "quiet while you work" (see 14.4).

**The headline block** (title and lead):
| | Before | After |
|---|---|---|
| EN | Streakboom: meet Peak, a little cat that lives on your screen Meet Peak, a cheerful golden chibi cat. It reacts when you stroke, poke or carry it, says short lines in Vietnamese, English or Japanese, and keeps you company. The app is free and open source, for Windows. (48 words) | Streakboom: meet Peak, a little cat on your screen Peak keeps you company, says a few words, and makes way when you work next to it. Free, open source, for Windows. (31 words) |
| VI | Streakboom: gặp Peak, chú mèo nhỏ sống trên màn hình của bạn Gặp Peak, chú mèo chibi màu vàng vui vẻ. Peak phản ứng khi bạn vuốt ve, chọc hay bế nó, nói vài câu ngắn bằng tiếng Việt, tiếng Anh hoặc tiếng Nhật và ở bên bạn lúc làm việc. Ứng dụng miễn phí và mã nguồn mở, dành cho Windows. (62 words) | Streakboom: gặp Peak, chú mèo nhỏ trên màn hình của bạn Peak ở bên bạn, thỉnh thoảng nói vài câu, và nhường chỗ khi bạn làm việc ngay cạnh nó. Miễn phí, mã nguồn mở, dành cho Windows. (38 words) |
| JA | Streakboom: 画面の上で暮らす小さなネコ、Peakと出会おう 金色のちびネコPeakと出会いましょう。なでたり、つついたり、持ち上げたりすると反応し、ベトナム語、英語、日本語で短いひとことを話して、そばにいてくれます。アプリは無料のオープンソースで、Windows向けです。 (128 chars) | Streakboom：画面の隅にいる、ネコのPeakと出会おう Peakはそばにいて、ときどきひとこと話し、すぐ隣で作業すると道をあけます。無料のオープンソースで、Windows用です。 (85 chars) |

**One feature** ("Bring your own brain"; the detail moves to the how-it-works page):
| | Before | After |
|---|---|---|
| EN | 🧠 Bring your own brain Add your own Gemini, Groq, Claude or OpenAI key and double-click to chat; Gemini and Groq have free tiers, with limits. Some of its unprompted lines are then written by the model too, within a daily limit (60 chat turns and 6 unprompted lines); when Peak has talked enough it says so in its own words. It answers in the language you write in, and each answer comes with a feeling the pet acts out. Your key stays on your computer. (86 words) | Bring your own brain (optional) Add your own Gemini, Groq, Claude or OpenAI key and double-click to chat. Gemini and Groq have free tiers. Your key stays on your computer. (30 words) |
| VI | 🧠 Mang bộ não của riêng bạn Thêm khóa Gemini, Groq, Claude hoặc OpenAI của riêng bạn rồi bấm đúp để trò chuyện; Gemini và Groq có gói miễn phí, có giới hạn. Một số câu Peak tự nói khi bạn không làm gì cũng do mô hình viết, trong một giới hạn mỗi ngày (60 lượt trò chuyện và 6 câu tự nói); khi đã nói đủ, Peak tự nói điều đó bằng lời của mình. Nó trả lời bằng ngôn ngữ bạn viết, và mỗi câu trả lời đi kèm một cảm xúc mà thú cưng diễn ra. Khóa của bạn chỉ nằm trên máy bạn. (108 words) | Mang bộ não của riêng bạn (tùy chọn) Thêm khóa Gemini, Groq, Claude hoặc OpenAI của bạn rồi bấm đúp để trò chuyện. Gemini và Groq có gói miễn phí. Khóa chỉ nằm trên máy bạn. (36 words) |
| JA | 🧠 自分の「頭脳」を持ち込む 自分のGemini、Groq、Claude、OpenAIのキーを追加して、ダブルクリックでおしゃべりできます。GeminiとGroqには無料枠があります（上限あり）。話しかけなくてもPeakが言うセリフの一部もモデルが書くようになりますが、1日の上限（チャット60回、自発的なひとこと6回）があり、話し足りたらPeakが自分の言葉でそう伝えます。あなたが書いた言語で答え、答えごとにペットが演じる感情が付きます。キーはあなたのコンピューターの中だけにあります。 (224 chars) | 自分の「頭脳」を持ち込む（任意） 自分のGemini、Groq、Claude、OpenAIのキーを追加して、ダブルクリックでおしゃべり。GeminiとGroqには無料枠があります。キーはあなたのコンピューターの中だけにあります。 (102 chars) |

**One FAQ answer** ("Does Peak read what I type or what is on my screen?"; the answer stays complete about what it notices, so it does not claim a shorter list than the truth):
| | Before | After |
|---|---|---|
| EN | No. To stay out of your way Peak notices only when you last used the keyboard or the mouse, where the pointer is, and whether the primary mouse button (the one you click with) is pressed. Since 0.3.1 it also asks the system what kind of thing is just under its feet (the bare desktop, the taskbar or a window), only to notice when the window it stands on is closed, minimized or dragged away; it keeps an opaque number for that in memory only. It does not read what you type or which keys you press, and it does not look at your screen, window titles or app names. Where it thinks your text is heading is a guess from where you last clicked and how long you have typed, and the guess can be wrong. (137 words) | No. It never reads what you type, your screen, window titles or app names. To stay out of your way it notices only plain signals: when you last used the keyboard or mouse, whether the primary button is pressed, where the pointer is, and what kind of thing is under its feet. The exact list is on the privacy page. (60 words) |
| VI | Không. Để không cản đường bạn, Peak chỉ biết lần cuối bạn dùng bàn phím hoặc chuột là khi nào, con trỏ đang ở đâu, và nút chuột chính (nút bạn dùng để bấm) có đang được nhấn hay không. Từ 0.3.1 nó còn hỏi hệ thống xem dưới chân nó là loại gì (màn hình nền trống, thanh tác vụ hay một cửa sổ), chỉ để biết khi cửa sổ nó đứng bị đóng, thu nhỏ hay kéo đi; nó giữ một con số vô danh cho việc đó, chỉ trong bộ nhớ. Nó không đọc bạn gõ gì hay nhấn phím nào, và không nhìn màn hình, tiêu đề cửa sổ hay tên ứng dụng. Chỗ nó nghĩ chữ của bạn đang chạy tới chỉ là một phỏng đoán từ chỗ bạn bấm gần nhất và thời gian bạn đã gõ, và phỏng đoán đó có thể sai. (150 words) | Không. Nó không bao giờ đọc bạn gõ gì, màn hình, tiêu đề cửa sổ hay tên ứng dụng. Để tránh đường bạn, nó chỉ biết vài tín hiệu đơn giản: lần cuối bạn dùng bàn phím hoặc chuột, nút chuột chính có đang nhấn không, con trỏ ở đâu, và dưới chân nó là loại gì. Danh sách đầy đủ nằm ở trang Riêng tư. (66 words) |
| JA | いいえ。じゃまにならないよう、Peakが把握するのは、最後にキーボードやマウスを使った時刻、ポインターの位置、マウスのメインボタン（クリックに使うほう）が押されているかどうかだけです。0.3.1からは、足元にあるものの種類（何もないデスクトップ、タスクバー、ウィンドウ）もシステムに尋ねますが、それは立っているウィンドウが閉じられた、最小化された、移動されたことに気づくためだけで、そのための中身のない番号をメモリ内にだけ保持します。入力した内容や押したキーは読まず、画面、ウィンドウのタイトル、アプリ名も見ません。入力中の文字がどこへ向かうかは、最後にクリックした位置と入力していた時間からの推測で、外れることがあります。 (285 chars) | いいえ。入力内容、画面、ウィンドウのタイトル、アプリ名は決して読みません。じゃまにならないよう、把握するのは単純な手がかりだけです：最後にキーボードやマウスを使った時刻、メインボタンが押されているか、ポインターの位置、足元にあるものの種類。正確な一覧はプライバシーのページにあります。 (130 chars) |

The site's own manners: nothing moves by itself except the tour (one round, then still; it pauses on hover, focus, when hidden or off screen; the Pause button; nothing moves with `prefers-reduced-motion`), no pop-ups, no banners, nothing that interrupts the reading. A check could count the number of moving parts, but I would not add one yet.

### 14.4 My assessment of the charter on the website
I agree with the app session's recommendation, with two changes. **Yes, a distilled form:** four short promises (five when CH-2 and CH-3 are released), in Peak's voice, on the home page and as the opening of the privacy page, with one link to `docs/charter.md` on GitHub as the proof. It builds trust faster than a long privacy page, replaces three feature lists ("out of your way", "polite", "light") and gives answer engines one sentence to quote. **Two changes:** (1) the promise "it keeps quiet while you work" is held back until the faults of the audit (spec 11 section 6, epic E15) are fixed and released, and the opt-in screen picture is not mentioned; (2) each promise gets a check in the build (a matching sentence in the README or the charter, and the link to the charter must resolve), so a promise cannot outlive the behaviour behind it. I would not use the word "manners" in a slogan yet, for the same reason: it is a promise about the whole behaviour, and the audit is still open. **Where it is not safe:** a full charter page (long, stiff next to a playful cat, three languages to keep true), and publishing the "few settings" article or the manners (they are for the people who build Peak).

### 14.5 Not verified
The word counts are from my own script (visible text of the main area; the Japanese is counted in characters without spaces and punctuation), not from a standard tool. The "after" texts are proposals: the Vietnamese and Japanese have no native reader. How search engines and the assistants react to a shorter home page is unknown; measure it with the fixed question set of section 7 after the crawlers have visited (section 12 is the baseline). The audit's faults against article 2 are the app session's (E15); the site cannot check them. Nothing in this section is built.
