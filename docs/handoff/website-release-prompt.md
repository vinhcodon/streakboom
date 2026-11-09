# Prompt for the website session, refilled at every release

**From:** the app session (Vinh and Claude)
**To:** whoever works on `site/` (GitHub Pages)
**Status:** a template (ADR-0033). At every release the app session fills in the version and what changed, and gives the author the text below to paste into the website session. This copy is filled for **0.3.0** (2026-11-09). The previous copies (0.2.5) were acted on by the website session: the structure of its ADR-0034 is built.

---

## The prompt (paste this)

You are the session that owns `site/` in the repository `vinhcodon/streakboom` (the website streakboom.com, served by GitHub Pages). The app session has just released **version 0.3.0** (Japanese, a fourth AI brain, and a gentler way of making way). Read these first, in this order: `CHANGELOG.md` (the 0.3.0 entry: the format the site reads), `README.md` (the reference text: features, privacy, status, roadmap), `docs/decisions/0037-groq-as-the-fourth-brain.md` and `docs/decisions/0038-japanese-as-the-third-language.md` (the app session's two new records; note they are numbered 0037 and 0038 because both sessions used 0034 and 0035 at the same time: **list `docs/decisions/` and take the next free number before you write a record**), `docs/plans/verification-debt.md` (section C and the website rows), your own records ADR-0034 to ADR-0036, and `docs/decisions/0033-every-release-includes-the-same-housekeeping.md` (this routine). Do not edit anything outside `site/`, `scripts/build-site.mjs`, `scripts/site/` and `.github/workflows/pages.yml` without asking. Commit explicit paths only (ADR-0023). Say at the end what you did **not** verify.

### 1. Bring the site in line with the app (do this now)
- **Version and notes:** the site builds the version and the notes from `tauri.conf.json` and `CHANGELOG.md`; check that the 0.3.0 entry appears correctly in all three languages' pages and in `llms.txt`, `llms-full.txt`, the structured data and the changelog page.
- **The app now speaks Japanese (beta).** Your Japanese pages (`/ja/`, `/ja/privacy/`) and the English and Vietnamese ones say, or imply, that the app is in Vietnamese and English only. Change that: Peak speaks Vietnamese, English and **Japanese**; Japanese is a **beta**, written by Claude and **not yet read by a native speaker**, so some sentences may sound odd; Settings, General, Language chooses it, and "Auto" picks it on a Japanese Windows. Keep the honest tone (do not say "native quality"). Update the FAQ entry about languages and the `inLanguage` data.
- **A fourth AI brain: Groq**, offered right after Gemini; the order is Gemini, Groq, Claude, OpenAI. Gemini and Groq have free tiers (with limits); Claude and OpenAI are paid. Say that Groq, Claude and OpenAI have **not yet been tried with a real key** (Gemini has). Do not state anything about Groq's data use, age rule or whether a card is needed (not read yet). The keys are stored in the Windows Credential Manager, one entry per brain, now also `groq-api-key`.
- **Peak notices before it makes way:** before it walks or hops away from your work it stops for a moment and looks toward your work (or toward where your text is heading) with its ears up; while you work near it it also looks toward your pointer. Describe it as behaviour, never as Peak "seeing" or "reading" your screen.
- **Privacy wording:** the app now reads the **primary** mouse button (the one you click with; it works for left-handed setups), not "the left button": `site/strings.mjs` and the privacy pages still say "left". The rest of the "What Peak notices around it" bullet is unchanged.
- **Numbers and claims:** processor use about 4 to 6% of one core standing and about 9 to 10% median in normal use, on one machine (an A/B check of 0.2.5 against 0.3.0 found them equal); a hop costs about 0.34 seconds of one core; memory about 100 to 120 MB. Do not promise macOS, code signing or a stats server.
- **The interactive Peak and the hero tour:** the rig changed (a new `notice` pose with ears up and a wider look, a flag for hops, a wake-up stretch); the site rebuilds it. Look at the tour once, and consider whether the "making way" scene should show the notice beat (propose, do not just add).
- **The author's name** is **Vinh Codon** (done in `LICENSE` and the README; check `site/` once more).
- **Releases:** GitHub keeps the newest two (`v0.3.0`, `v0.2.5`); never link a version-specific file; the download button points at `releases/latest`.

### 2. Propose the next improvements for search engines (SEO) and AI answer engines (GEO)
The structure of your ADR-0034 is built. As at every release, review it against the new facts and **propose** (as multiple choice for the author, with the trade-offs; the author decides and a record is written) what to improve next. Think about at least: coverage of the new facts for answer engines (the four brains, the three languages, what is free, what Peak does and does not read), the Japanese pages for Japanese search (titles, descriptions, `hreflang` including `ja`, questions people would ask in Japanese), whether a short comparison or "how it works" page would be quoted, structured data completeness and that it is generated from the repository so it cannot drift, `llms.txt` and `llms-full.txt` wording, page speed on the hero canvas, and how we measure (Search Console and Bing Webmaster state, the fixed test questions for AI assistants, before and after). Say what you would **not** do and why. Do not build anything in this section until the author has chosen.

### 3. Report back
Summarise what changed, list what you did not verify (the state on the Pages host, other browsers, a phone, a Japanese reader), and add any unchecked item to the website section of `docs/plans/verification-debt.md`.

---

## How to refill this at the next release
Change the version and date in the status line and in the first paragraph; rebuild section 1 from the newest `CHANGELOG.md` entry and the README (what is new, the names, the numbers, the privacy wording, anything the site still says that is no longer true); keep section 2 (the SEO and GEO request is part of every release, ADR-0033) and replace its list by what is still open; keep section 3. Update the numbers from the latest measurement. Then hand the text to the author and note in `docs/handoff/README.md` that the prompt was sent.
