# ADR-0076: A truthful "Code signing policy" on the home page, in three languages; no SignPath attribution yet

- **Status:** accepted (the request in `docs/handoff/website-code-signing.md`, ADR-0072, decided what it says; the website session chose the placement and the checks); **built on 2026-11-12** (committed; live after the push, when the website session reports it)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author) for the content (ADR-0072); Claude (the website session) for the placement and the checks

## Context
SignPath Foundation reviews an open-source project's live site before it gives free code signing. The home page and the download pages must carry a "Code signing policy" with the team roles and a link to the privacy policy, and it must be true. Nothing is signed yet: the installers are not code-signed, and the project is preparing to apply once releases are built in public CI (ADR-0072, `CODE_SIGNING.md`).

## Decision (done)
1. **A section `#code-signing` on the home page of each language**, right after the install steps (the download area), with the heading in the exact English term **Code signing policy** in all three languages and the text in the page's language: (a) the installers are not code-signed yet, SmartScreen warns, choose More info then Run anyway; the project is preparing to apply for free code signing from SignPath.io (certificate by SignPath Foundation), which needs releases built automatically in public CI first; (b) the team: Vinh Codon (@vinhcodon on GitHub) is the author, reviewer and approver (one person); (c) privacy: the program uses the network only to check for updates at GitHub (can be turned off) and, if you add your own key, to chat with the provider you chose, nothing else is sent; (d) links to the privacy page and to `CODE_SIGNING.md` on GitHub (the full policy, in English).
2. **The download area points to it:** under the Download button the note about SmartScreen and the release notes now also links to the section ("Code signing policy"). The only page with a download area is the home page (the sticker pages have a button only; the How it works and privacy pages say what the program does).
3. **No claim beyond the truth, and no attribution line.** The build fails on "verified", "trusted", "safe", "secure installer" or "signed by" inside the section, and on the line `Free code signing provided by SignPath.io, certificate by SignPath Foundation` anywhere on the site. When the project is approved the author tells the website session; then the line goes on the home page (the exact wording), the "not signed yet" sentences go, and the check is turned around.
4. **The build checks** that every home page has the section, the exact heading, the link to `CODE_SIGNING.md` and to the privacy page, `SignPath.io`, the author's name and GitHub name, and the pointer from the download area; and that `llms.txt` links to the policy (a line was added under "Source and downloads").
5. **The word budgets of the home page** (ADR-0048) are raised in the test: English 800 to 920 (880 now), Vietnamese 950 to 1,080 (1,045 now). The Japanese page is counted by characters elsewhere.
6. **Not linked:** `THIRD-PARTY-NOTICES.md` does not exist on `main` yet (the handoff says it comes with a release); `docs/dependency-licenses.md` could be linked from the privacy page (a suggestion of the handoff, not a SignPath condition): not done, to keep the pages short.

## Alternatives considered
A separate page `/code-signing/` (a longer text to keep true in three languages; the requirement is the home page and the download pages); the section inside the FAQ (hidden in a closed answer); the sentence in the footer only (too easy to miss for a reviewer).

## Consequences and what is not verified
- The home page is longer by about 100 words; the install area now has a section about code signing under it.
- When SignPath approves the project, this section and the checks need one more change (ADR to follow).
- Not verified: that SignPath Foundation accepts this wording (the author applies); the Vietnamese and Japanese sentences have no native reader; the live page (not looked at by eye before the push); a phone and other browsers; a screen reader on the new section.

## Sources
`docs/handoff/website-code-signing.md`, `CODE_SIGNING.md`, ADR-0072, `docs/plans/signpath-ci-plan.md`.
