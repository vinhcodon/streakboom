# ADR-0062: The website follows the app in 0.4.0: absence costs nothing, adults (18+), the mission line, no health claims

- **Status:** accepted (the release prompt for 0.4.0 and ADR-0056 to ADR-0059 decided the content; the author answered the three proposals on 2026-11-12); **built on 2026-11-12** (committed; the live behaviour is checked after the push)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session), after the release prompt for 0.4.0 (ADR-0033, ADR-0061)

## Context
Version 0.4.0, "the alignment release", took away what made Peak a character who needs you: no streak and no counting of days, no "lonely" state, a bored Peak that does not ask for attention, three gentle lines toward a person or a window; a right click on Peak pushes it and the pet has no right-click menu (Settings, Quiet mode, Quit and Show / Hide are in the tray icon's menu); the app says it is made for adults (18+); the chat rules answer a goodbye with one short line and, if you seem in danger, drop the jokes and point to real people; the mission is "a small friend who makes the workday lighter and leads you back to real life", with no claim about health (ADR-0057). The README now says 263 hand-written lines per language, the site said 267, so the Pages build was red (ADR-0061: accepted for a short time; the site online was still the 0.3.2 one).

## Decision (done)
1. **The number** is 263 in three languages (`f1_p`); the build still reads it from the README.
2. **The promise `pr2`** says the README's sentence in three languages: "It never guilts you and never dies. Your absence costs nothing: it sleeps while you are away and is glad when you are back." The build's backing sentence for it is now "absence costs nothing" (it was "never dies or starves"). "A bit lonely" is gone from the "Alive without AI" card too; the card now says that a few lines point, gently, toward a person or a window.
3. **Adults.** "Made for adults (18+)" is said once under the download button (and the same sentence in Vietnamese and Japanese), as a question ("Who is Streakboom for?") on the How it works page, in the structured data of that page and in `llms.txt` / `llms-full.txt`. It is never "safe", "safe for everyone" or "adults only" as a promise (the build fails on those words): a lawyer has not said what age check is enough (`docs/foundation/legal-questions.md`). The old question "Is Streakboom safe to install?" is about the installer (open source, no administrator rights, no audit) and stays.
4. **The mission** is the one-line description: the hero lead, the meta description and the structured data say "a small friend who makes the workday lighter and leads you back to real life" (not as a promise). The build fails on healing, therapy, "clinically proven", a claim to reduce anxiety, depression, ADHD or loneliness, a claim to replace friends or professionals, a claim that Peak detects a crisis, and on "lonely", "streak" and the pet's own right-click menu (outside the release notes, which keep what was true when they were written).
5. **Behaviour, as behaviour.** The gestures table: Left-click once (a poke), Right-click it (a push away from the pointer), the tray icon (a click shows or hides Peak; the menu has Settings, Quiet mode, Quit, Show / Hide). The "Gestures" card and the home teaser say right-click pushes. How it works, "Adding an AI brain": the part of the notes that no setting can change tells Peak to answer a goodbye with one short line and, if you seem in danger, to drop the jokes, say plainly that it is a small program and point to a person you trust or the local emergency number; **it is said to be a rule for how Peak answers, not a detector, and that it does not read your messages for it**; Settings, About has an "If you need help now" text. The install step on how to remove everything: Settings, Brain, Remove key, then the box "Delete the application data" in the uninstaller.
6. **The release notes** show **bold** as bold (0.4.0 starts its lines with it) and the home page shows the first sentence of the newest note (now "Your absence costs nothing.").
7. **Numbers and the rest unchanged:** the 0.3.2 processor figures (not measured again for 0.4.0); the author's name (Vinh Codon); the download button points at `releases/latest`; the Stickers page is as ADR-0060 left it.

## Result (2026-11-12)
The build passes with 0.4.0 and the README; 95 tests in `scripts/site/`; `node scripts/audit-docs.mjs` finds no problem. Measured (English words, main text): home 783, Vietnamese home 916, How it works 1,473, privacy 898, `llms-full.txt` 3,076. The budgets of ADR-0048 are still exceeded for the last three, and the Vietnamese home budget in the test is raised from 900 to 950 (the mission lead and the adults line; Vietnamese counts syllables).

## Alternatives considered
Keeping "a bit lonely" with a softer word (no: the app does not do it any more); putting "adults only" on the page (no: it reads as a promise and the lawyer has not seen it); writing the chat rule as "detects a crisis" (no: false); a section about "your absence costs nothing" on its own (the promise block already says it).

## Consequences and what is not verified
- The README line about the pet still says "it only gets 'a bit lonely'" (README, feature list): the site no longer says it; the app session should change that sentence (the README is theirs).
- Not verified: that the app does what the README, the CHANGELOG and spec 12 say (read, not run); the new Vietnamese and Japanese sentences have no native reader; "Made for adults (18+)" is a self-declared line that a lawyer has not seen; the Pages host after the push; other browsers and a phone for the new gestures rows.

## Sources
`CHANGELOG.md` 0.4.0, `README.md`, `docs/charter.md` (article 7, "What Peak is for"), ADR-0055 to ADR-0059, ADR-0061, `spec/12-foundation-alignment.md`, `docs/handoff/website-release-prompt.md`.
