# ADR-0070: The documents get one entry point, a short README and an update rule

- **Status:** accepted (the author asked for it on 2026-11-12 and chose the options below); built
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
The README had grown to 198 lines of features, privacy detail, layout, release steps, website notes and roadmap. Its reader on GitHub (a developer, an indie hacker, a visitor) needed a front door, and a new session of an AI assistant needed one place that says what the project is, where it stands and by what rules it works, without reading 69 decision records first. The README was never the source of truth (that is `docs/`), but nothing said what was. Several facts were stated in more than one place and had drifted (a duplicate ADR row, a settings page that still named quiet hours, an out-of-date progress table).

## Decision
1. **`docs/PROJECT.md` is the entry point:** the mission, the audience, the principles, the strategy and evidence, the state, the architecture in one page, where everything is, the working rules, the update rule and the pitfalls. It points at the owner of every fact and never replaces it; when they disagree, the owner wins. It carries a snapshot line (version and date) that the audit checks. **`AGENTS.md`** (with `CLAUDE.md` importing it) is the short card for AI assistants and points there.
2. **The README is short** (the audit caps it at 220 lines) and written for developers and indie hackers: what it is, why it might interest them, install, the promises, highlights, build from source, roadmap, contributing, credits. The detail moved to `docs/features.md`, `docs/privacy.md`, `docs/development.md`, `docs/releasing.md` and `docs/website.md`. The sentences that the website build checks are kept.
3. **Contributor files in the repository:** `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue forms (bug, idea, question), a pull request template, `CODEOWNERS`, and a CI workflow (tests, types, audit, website build) that runs on pull requests and by hand. All in English.
4. **The update rule:** every release, and every change to a fact `PROJECT.md` states, updates the snapshot and section 4 in the same commit; the contributor files change when the rules or commands they state change. The audit enforces what can be checked: the entry points exist, the snapshot names the current version, the README stays short, every ADR number has one row, every document directly in `docs/` is named in the map. This extends ADR-0033 (the release routine).
5. **Not done, on purpose:** the GitHub Wiki (a second repository that drifts from the code and cannot be reviewed; the docs and the website are the homes), and most changes to the repository's settings (description, topics, Discussions, labels): they are public settings the author has not asked for. **One was asked for and done on 2026-11-12: private vulnerability reporting was switched on through the API** (`PUT /repos/vinhcodon/streakboom/private-vulnerability-reporting`, verified `enabled: true`), so that `SECURITY.md` has a private channel.

## Alternatives considered
The wiki as the main home (rejected above); one very large file for everything (hard to keep in step with the ADRs and the specs); keeping the long README and folding the detail inside collapsible sections (still long when opened, and not what a visitor wants).

## Consequences and when to revisit
`PROJECT.md` is a summary that can go stale in the parts the audit cannot check (sections 3 to 6); the release routine puts it in the checklist, and a reader who finds a fact that disagrees with its owner fixes this file. The CI workflow has not run yet (it is triggered by pull requests and by hand until its first runs are seen green). Revisit when the first outside contributor arrives, or if `PROJECT.md` is found out of date at a release.

## Sources
`docs/PROJECT.md`; `docs/README.md`; `scripts/audit-docs.mjs`; ADR-0023, ADR-0033, ADR-0058.
