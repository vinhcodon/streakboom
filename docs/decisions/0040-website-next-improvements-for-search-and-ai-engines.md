# ADR-0040: The next improvements of the website for search and AI engines

- **Status:** accepted (decisions 2026-11-09; step 0, N4, N2 and the N5 budget are built; N3 (Japanese wording, needs a Japanese reader) is not)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
After 0.3.0 the website session reviewed the structure of ADR-0034 against the new facts (three languages of the app, four brains, the notice beat) and proposed five improvements as multiple choice in `../plans/website-seo-geo.md` section 9. The author chose the recommended option in all five. The measured state at the time: eight pages, scripts of about 16 KB gzipped, home HTML of 27 to 33 KB, no `featureList`, requirements or release-notes link in the structured data, Japanese questions that are translations of the English ones, and no Lighthouse run or assistant answers ever recorded.

## Decision
- **N1, the tour: keep the making-way scene as it is.** The caption and the feature card describe the notice beat in words; the `notice` pose is subtle from the front, so it is not added as a pose or a chip.
- **N2, a "How it works" page: one page per language** (`/how-it-works/`, `/vi/how-it-works/`, `/ja/how-it-works/`), in plain words from the README and the app's records: no AI by default, how a brain is added (your key, kept in the Windows Credential Manager), what is stored on your computer, what Peak notices and never reads, what is free and what is billed, how updates work. Same build checks and `hreflang` as the other pages. No comparison page.
- **N3, Japanese search wording:** rework the Japanese title, description and headings with the words Japanese readers use where they are true (for example デスクトップマスコット beside デスクトップペット, 常駐, 無料, オープンソース), and add three or four Japanese FAQ questions (is it free, how heavy is it, does it read my screen, how do I uninstall) with a direct first sentence. A Japanese reader should confirm the wording; no keyword lists. The share image stays as it is.
- **N4, structured data and the `llms` files, generated from the repository:** `SoftwareApplication` gains `featureList` (the nine card titles), `softwareRequirements` (Windows 10 or 11, 64-bit; WebView2 runtime), `releaseNotes` (the changelog URL) and `screenshot` (the share image); `llms.txt` and `llms-full.txt` state the languages (English, Vietnamese, Japanese beta), the four brains in order and which are free; a new FAQ question "Is Streakboom safe to install?" (open source, unsigned installer, installs for the current user, no administrator rights). The build checks that each value appears on a visible page. No `SoftwareSourceCode` entity.
- **N5, speed and measuring:** run Lighthouse (mobile and desktop) once and write the numbers into the plan as the baseline, and add a size budget to the build (the scripts of a page at most about 30 KB gzipped, the home HTML at most about 60 KB). Lighthouse stays a manual check; not in GitHub Actions.
- **Order of work:** (0) the baseline first: Lighthouse by the agent, the answers of the assistants to the fixed question set (section 7, now with three Japanese questions) by the author, **before** N2 to N4 are built; (1) N4, because it is small and generated; (2) N2; (3) N3 with a Japanese reader; (4) N5's budget. Each step a small commit on explicit paths (ADR-0023).

## Alternatives considered
Showing the notice beat as a scene or a chip (rejected for now: subtle, more chips, one more caption in three languages); no new page; a comparison page (rejected: unverifiable claims about other products); leaving the Japanese text as translations; a Japanese share image; a `SoftwareSourceCode` entity; Lighthouse in Actions (noisy, slower).

## Consequences
- More text to keep true in three languages; the build's outdated-wording list (ADR-0039) and the new checks carry part of that.
- The baseline of the assistants' answers needs the author; without it the later comparison is weaker (W-17 to W-20 style rows stay open until it exists).
- Not verified: everything above is a decision; nothing is built.

## Sources
`../plans/website-seo-geo.md` section 9, ADR-0034, ADR-0035, ADR-0039, ADR-0031.
