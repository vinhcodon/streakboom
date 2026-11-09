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

## 9. Next improvements after 0.3.0 (proposal 2026-11-09; **the author chose the recommended option of N1 to N5 the same day, ADR-0040; nothing is built yet**)

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

**Two things the baseline found, fixed the same day** (site commit of 2026-11-09 after `de24437`): (1) a layout shift of 0.076 on desktop and 0.015 on a phone: the scene chips were created by the script and, on a phone, the "send the link to my PC" notes were switched by the script after load; the chips are now in the static HTML (the labels are readable without the script too) and the platform class is set on `<html>` by a small script in the head before the first paint; (2) the language links (`EN`, `VI`, `JA`) had accessible names that did not contain their visible text ("English" for "EN"); they are now "EN (English)". After, on a local build (so without GitHub's compression, and one or two runs): desktop performance 100, layout shift 0.007; mobile performance 98 to 99, layout shift 0; the name-mismatch audit passes. The build now checks both (the chips in the static HTML, the accessible names). A re-run on the live site after the deploy is in `verification-debt.md` (W-24).

**Not yet recorded: the assistants' answers** to the fixed question set of section 7 (English, Vietnamese and now three Japanese questions). Only the author can ask them; the baseline of the answers must exist **before** N2 to N4 are built.
