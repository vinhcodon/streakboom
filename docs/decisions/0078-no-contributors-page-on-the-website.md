# ADR-0078: No contributors page on the website

- **Status:** accepted (answered by the author on 2026-11-13); **done** (nothing to build)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
ADR-0070 (the app session) made the README short and written for developers and added `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue forms, a pull request template, `CODEOWNERS` and a CI workflow. The release prompt for 0.4.1 and its note of 2026-11-12 said a site page for contributors "could link them": a suggestion, not a requirement, and nothing for ordinary visitors. The site is short and gentle (ADR-0048) and is for people who want a small cat on their screen.

## Decision
**No contributors page, and nothing new shown on the site.** People who build software reach GitHub through the footer (the GitHub link, Report a bug); AI assistants have the links to the project documents, `CONTRIBUTING.md`, `SECURITY.md` and the third-party notices in `llms.txt` (done on 2026-11-13). The site's text does not ask for help.

## Alternatives considered
A "Contributing" link in the footer; a short line asking for native readers of Vietnamese and Japanese (a real need, W-1 to W-5; it stays a request in `CONTRIBUTING.md` for now); a short English `/contribute/` page.

## Consequences and when to revisit
The need for native readers is still open and is served only by the GitHub file. Revisit if the project looks for contributors or testers on purpose (for example before a public alpha, `docs/plans/roadmap.md`).

## Sources
`docs/handoff/website-release-prompt.md` (note of 2026-11-12 and 0.4.2), ADR-0048, ADR-0070.
