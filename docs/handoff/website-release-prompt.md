# Prompt for the website session, refilled at every release

**From:** the app session (Vinh and Claude)
**To:** whoever works on `site/` (GitHub Pages)
**Status:** a template (ADR-0033). At every release the app session fills in the version and what changed, and gives the author the text below to paste into the website session. This copy is filled for **0.2.5** (2026-11-09).

---

## The prompt (paste this)

You are the session that owns `site/` in the repository `vinhcodon/streakboom` (the website streakboom.com, served by GitHub Pages). The app session has just released **version 0.2.5**. Read these first, in this order: `CHANGELOG.md` (the newest entries, the format the site reads), `README.md` (the reference text: features, privacy, status), `docs/handoff/to-website-0.2.5.md` (what changed and what not to claim), `docs/handoff/to-website-0.2.0.md` (the older notes and the site checklist), and ADR-0028, ADR-0031 (the privacy contract) and ADR-0033 (this routine). Do not edit anything outside `site/`, `scripts/build-site.mjs` and `.github/workflows/pages.yml` without asking. Commit explicit paths only (ADR-0023). Say at the end what you did **not** verify.

### 1. Bring the site in line with the app (do this now)
- **Version and notes:** the site reads the version and the notes from `CHANGELOG.md`; check that the 0.2.5 entry shows correctly in English and Vietnamese and that `updates/latest.json` is the fallback.
- **Behaviour text:** describe, in the site's own words and in both languages, the two things that are new since the site was last updated: Peak keeps still and quiet while you work and makes way (0.2.4), and Peak hops up or down out of the way of the text you type (0.2.5). Say plainly that the typing position is a **guess** (from the last click and the time spent typing) and that it can be wrong. Do not say Peak "sees" or "reads" what you type; it does not (ADR-0031).
- **Privacy text:** add the new README bullet "What Peak notices around it": it reads only when you last used the keyboard or mouse (one number, never which keys), where the pointer is, and whether the left mouse button is pressed (so it remembers where you last clicked); never what you type, which keys, what is on screen, window titles or app names; kept only in memory, never written to a file or sent, gone when Peak closes.
- **Numbers and claims:** the processor use is about 4 to 6% of one core standing and about 9% median in normal use, on one machine; do not say "almost no CPU". Memory about 100 to 120 MB. Do not promise macOS, code signing or a stats server (open items). The Claude and OpenAI brains have not been tried with real keys yet (Gemini has).
- **The author's name changed.** The author's GitHub display name is now **Vinh Codon** (it was "Vinh Nguyen"). Replace "Vinh Nguyen" in `site/i18n.js` (`foot_a`, both languages) and `site/index.html` (the footer) and anywhere else it appears (also structured data, meta tags, the share image text if any). The repository owner and URLs (`vinhcodon`) do not change. `LICENSE` and `README.md` are already updated.
- **The interactive Peak and the icon:** the rig changed (a new wake-up stretch, new gait functions, a flag for hops); the site rebuilds it. Look at the wake and the walk once. The app icon is Peak's face (`assets/peak-icon-1024.png`); check the favicon, the touch icon and the share image match it.
- **Releases:** GitHub keeps the newest two releases only; never link to a version-specific file; the download button points at `releases/latest`.

### 2. Propose a better site structure (do not build it yet): friendly to search engines (SEO) and to AI answer engines (GEO)
Write a proposal as `docs/plans/website-seo-geo.md` and put the choices to the author as multiple choice with the trade-offs (the author decides and an ADR records it), the same way the app session does. Please cover, and say what you would not do and why:
- **Findable facts without running JavaScript.** Search crawlers and many AI crawlers read the static HTML and often do not run scripts. Today the version and the notes are filled in by JavaScript. Propose how the key facts (what Streakboom and Peak are, the platform (Windows 10/11), price (free), licence (MIT), latest version and date, requirements, privacy summary, how to install) live in the static HTML, and how the release notes can be a crawlable static page (for example a `/changelog` page built from `CHANGELOG.md` at deploy time).
- **Structure and semantics:** one `h1`, clear `h2`/`h3` sections, landmarks, descriptive link text, alt text, a short factual "at a glance" block near the top, questions as headings in the FAQ with direct one or two sentence answers first (what AI assistants quote).
- **Languages:** separate URLs for English and Vietnamese (for example `/` and `/vi/`) with `hreflang` and canonical links, instead of one page that switches language with scripts; what that costs for the current single-page design.
- **Structured data (JSON-LD):** `SoftwareApplication` (operating system, price 0, download URL, software version, licence), `Person` or `Organization` for the author with `sameAs` links (GitHub), `FAQPage`, `HowTo` for installing, `BreadcrumbList` if pages are added. Keep it truthful and in step with the app (a test or a build check that the version in the data equals `tauri.conf.json`).
- **For AI answer engines (GEO):** an `llms.txt` (and possibly `llms-full.txt`) at the root with a concise, factual summary and links to the README, changelog, privacy and FAQ; short self-contained factual sentences with dates; a consistent entity name (Streakboom, Peak, the author name above) everywhere; a page that states what it is **not** (not an assistant, no screen reading, no macOS yet) so assistants do not invent features; keep claims verifiable against the repository.
- **Technical SEO:** `sitemap.xml`, `robots.txt` (allow the common AI and search crawlers or say why not), canonical domain `streakboom.com` with the `www` and `github.io` redirects, Open Graph and Twitter cards, page titles and descriptions per language, performance (Core Web Vitals: the hero canvas must not block the first paint), accessibility.
- **Measuring it:** Google Search Console and Bing Webmaster verification, a small set of test questions to ask AI assistants before and after ("what is Streakboom?", "a free open-source desktop pet for Windows"), and what we would count as success.
Do not implement the proposal until the author has chosen.

### 3. Report back
Summarise what changed, list what you did not verify (the state on the Pages host, other browsers, a phone), and add any unchecked item to the website section of `docs/plans/verification-debt.md`.

---

## How to refill this at the next release
Change the version and date in the status line and in the first paragraph; list what is new in section 1 from the newest `CHANGELOG.md` entry; keep section 2 until the author has chosen a structure (then replace it with what remains to be done); keep sections 3 and the names check. Update the numbers from the latest measurement. Then hand the text to the author and note in `docs/handoff/README.md` that the prompt was sent.
