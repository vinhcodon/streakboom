# Request to the website session: make the site as brief and gentle as Peak

**From:** the app session (Vinh and Claude)
**To:** whoever works on `site/` (GitHub Pages)
**Date:** 2026-11-10
**Status:** sent as a prompt; **a request to propose, not to build**. It is not tied to a release.
**Written after:** the author said the site has started to feel long-winded, and Peak now has a charter (`docs/charter.md`, ADR-0047).

---

## The prompt (paste this)

You are the session that owns `site/` in the repository `vinhcodon/streakboom` (streakboom.com, GitHub Pages). The author has told us that the site has started to feel **long-winded**. Before you touch any file, read the three documents that now say what Peak is: `docs/charter.md` (one page: eight ranked principles, "few settings" and the manners that are Peak's unwritten law), `docs/decisions/0047-the-charter-modes-falls-and-few-settings.md` and, for the reasoning, sections 2 to 4 of `spec/11-restraint-play-and-the-charter.md`. Then do the following. **Propose, do not build: the author decides, as multiple choice, and a decision record (the next free ADR number: list `docs/decisions/` first, the app session also uses numbers) is written before any change.**

### 1. Measure what we have
Count, per language, the words of the home page, the how-it-works page, the privacy page and `llms-full.txt`; the number of sections on the home page; the number and length of the FAQ answers; and what is **said twice** (the same fact in the "at a glance" list, a section, the FAQ, the how page and the privacy page). Report the numbers and the worst repeats. Say which parts a first-time visitor needs to decide "do I download it", and which parts are for people who want the detail.

### 2. Propose a structure that behaves like Peak
Peak is a guest in the corner of a working screen: it says little, in order, and then it is quiet; the person's attention is theirs. The site should be a guest too. Propose **two or three structures** (for example: one short home that answers the visitor's three questions and links to the details; a home plus one "how it works" page plus one "privacy" page with the detail moved out of the home; a different idea of yours), each with a **word budget per page and language**, what is cut, what is merged, what moves behind a link, and what each costs (for search engines and AI answer engines, for the three languages, for the hero tour). The test for every paragraph is the first question of the charter's article 2: *would a person who is only deciding whether to download this feel it as noise?* A fact stays in one place and the other places link to it.

### 3. The voice
Apply Peak's character to the words: warm, short, a little playful, never loud, never guilt, no jargon, no claims we cannot back (the charter's article 1). Propose how the copy should change (examples of before and after in the three languages for three pieces of text: the headline block, one feature, one FAQ answer). The site must also keep its own manners: nothing that moves or autoplays in a way that asks for attention without being asked (check `prefers-reduced-motion` and the hero tour), no pop-ups, nothing that interrupts the reading.

### 4. Should the charter be shown on the website?
The app session's assessment is below; **give your own, and propose where and how, or why not**.

*Benefits.* (a) **Trust.** Peak senses the screen, so "does it watch me?" is the first question; a short, public promise is a stronger answer than a long privacy page, which can then be shortened to "exactly what, where it is kept". (b) **Brevity.** The charter can replace several feature lists ("out of your way", "polite", "light"), because the quiet is the product's position, not a list of features. (c) **A position that is remembered.** Most desktop pets are noisy; "a pet with manners" is a sentence a visitor can repeat and an AI answer can quote, which also helps GEO. (d) **Accountability.** A public promise holds the author to it, and invites contributors who share it (the project is open source).
*Costs and risks.* (a) **A promise is a liability.** The site must claim only what the app does today. The app session's audit found faults the charter's article 2 does not yet fully hold (the "free" time starts after 5 seconds without input, a line can come after 6 seconds, the cry on a lost seat plays while the person works); they are being fixed (epic E15 of `docs/plans/backlog.md`). **Do not publish "the attention is theirs" as a promise until CH-2 and CH-3 are released; until then keep to what is already true** (it keeps quiet in fullscreen and presentation, makes way, never reads what is typed). (b) **Length and translation.** A full charter on the site adds to the problem and has to be kept in three languages (one of them a beta). (c) **Tone.** "Constitution", "article" and "principle" are stiff next to a playful cat; the public version must be in Peak's voice.
*The app session's recommendation* (yours may differ): publish **a distilled form, not the charter**: at most five short promises, in Peak's voice, in the three languages, on the home page (and as the opening of the privacy page), with one line linking to the full `docs/charter.md` on GitHub as the proof; no separate charter page at first; do not publish the "few settings" article or the manners (they are for the people who build Peak, and the manners are better *shown* by the hero tour than written). Candidate promises, to rewrite in the voice: it never reads what is on your screen or what you type; it keeps quiet while you work and leaves when it is in the way; it never guilts you and never dies; it works without AI and your key is yours; it is a companion, not an assistant. Hold back the sense that is **opt-in and not built** (the screen picture, ADR-0045) from any text until it exists.

### 5. What must not change
The search and answer-engine structure of ADR-0034 (per-language URLs, the crawlable changelog, structured data, `llms.txt`, `llms-full.txt`, the sitemap and the `facts.mjs` source of truth) stays; shorter text must keep the facts easy to extract (an FAQ answer of one or two sentences is better for an answer engine than a paragraph). Describe **only released behaviour** (0.3.1): the climbing, the fall to the plane below, getting out from under the Start menu and the model's remark after a reflex are **not released**; they are listed in `docs/plans/backlog.md` under "Unreleased since 0.3.1". The author's name is **Vinh Codon**. Do not edit anything outside `site/` and `scripts/site/`.

### 6. Report back
Give the measurements, the proposals as multiple choice with trade-offs, your assessment of the charter on the site, and what you did not verify. Add any unchecked item to the website section of `docs/plans/verification-debt.md` (W- rows).
