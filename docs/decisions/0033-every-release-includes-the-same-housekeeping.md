# ADR-0033: Every release of a new version includes the same housekeeping

- **Status:** accepted (a standing rule; first applied with 0.2.5 on 2026-11-09)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude

## Context
After 0.2.5 the author asked for a review of the whole documentation for consistency and integrity, a README refresh with the new icon, a check of a changed GitHub display name ("Vinh Nguyen" became "Vinh Codon"), and a prompt for the website session that also asks for a search-engine and AI-engine friendly structure. Doing this once found real drift: test counts in two places, a backlog count that was wrong, specs and ADRs that still said "not built" for things that are built, a roadmap progress note two days old, indexes missing new files, and the old name in the licence and the website. The author asked that these things be done every time a version is released.

## Decision
**Whenever a new version is released, the app session also does all of the following, in the same session, after the release is verified:**
1. **Audits the documents** for consistency and integrity: runs `node scripts/audit-docs.mjs --js <n> --rust <n>` (links, indexes, versions against `tauri.conf.json`, retired names, test counts) and reads the specs, plans, ADR statuses, backlog and roadmap progress for statements that are out of date; fixes them in a commit.
2. **Refreshes the README** with what is new (features, privacy, numbers, roadmap) and checks that the icon at the top is the current one.
3. **Checks the names**: the author's GitHub display name (now **Vinh Codon**; the owner of the repository is `vinhcodon`) in `LICENSE`, the README, the specs and, by reporting, in `site/`. When the name changes again, update the `RETIRED` list in `scripts/audit-docs.mjs`.
4. **Gives the author a prompt for the website session** (`docs/handoff/website-release-prompt.md`, refilled for the version). The prompt always asks that session to bring the site in line with the README and `CHANGELOG.md`, fix names, and propose (as choices for the author) a site structure friendly to **search engines (SEO) and AI answer engines (GEO)**: facts in static HTML, a crawlable changelog page, per-language URLs, structured data, `llms.txt`, a sitemap, and a way to measure.
5. Records what was not verified in the engineering log and `docs/plans/verification-debt.md`.

The README's "Release and auto-update" section lists the same steps (step 5), and `docs/README.md` keeps them in the "Keeping them in step" list.

## Alternatives considered
Leaving it to chance (rejected: the drift above); a continuous-integration check only (the script can be run in CI later, but the reading of statements that are out of date needs a person); putting the website prompt in the release script (rejected: it needs the author's choices and a human message).

## Consequences
- A release now takes a little longer; the cost is paid back in fewer wrong statements.
- The script checks what can be checked mechanically; the rest depends on reading. The first run found 7 problems and the reading found about a dozen more.
- Not verified: that the website session has acted on the first prompt.
