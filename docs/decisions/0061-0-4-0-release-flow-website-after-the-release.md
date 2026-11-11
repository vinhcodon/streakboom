# ADR-0061: How 0.4.0 reaches `main` and the world: the old flow, the website after the release

- **Status:** accepted (answered by the author on 2026-11-12); **carried out on 2026-11-12** (merge commit 9065445, `main` pushed, then the release; the site build is red until the website session follows)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
Release 0.4.0 is prepared on the branch `foundation/alignment` (14 commits, pushed to `origin`, not on `main`). The README now says 263 hand-written lines per language and the website says 267; the site build (`scripts/site/checks.mjs`) fails on that difference. The Pages workflow runs on a push to `main` that touches `CHANGELOG.md` or the site sources, so merging first makes the build go red until the website session follows. An earlier draft of the website prompt asked the website session to fix the site on the branch before the merge.

## Decision
1. **The old flow:** the app session merges, releases and only then hands the website session its prompt (ADR-0033). The website is updated after the release, not before. The prompt no longer says "work on the branch".
2. **A short red build is accepted.** Between the push of `main` and the website session's fix the Pages job fails. The site already online stays as it is (the 0.3.2 pages); the download button points at `releases/latest`, so people can still download 0.4.0. No change to `site/` is made by the app session.
3. **The branch is merged with a merge commit** (the history of FA-1 to FA-11 and of the gates is kept). Then `main` is pushed **before** the release is published (the tag goes on the head of the default branch at publish time).
4. **The gates before the order "Phát hành 0.4.0":** the author has read the Vietnamese lines (`docs/plans/vi-lines-0.4.0.md`, V-103, V-105) and has tried the chat rules with a real key on at least one brain (V-104).
5. **The processor use is not measured again** for 0.4.0: the release changes lines, state and texts and touches nothing that costs processor time, and the CHANGELOG makes no promise about it. It goes into the debt list (V-106); a run needs the author away from the machine for about 15 minutes.

## Alternatives considered
The website session fixing the site on the branch before the merge (no red build, but the release waits for it); the app session changing the three numbers in `site/strings.mjs` in the merge commit (a green build at once, but it crosses the ownership of `site/`); a squash merge or a draft pull request (a shorter or a more visible history, but harder to follow story by story); releasing first and checking the chat later (rejected: the chat rules were never tried with a real key); measuring the processor use first.

## Consequences and when to revisit
For a while the website describes 0.3.2 while the README and the release describe 0.4.0, including the sentence "it only gets a little lonely", which the app no longer does. The website prompt is the way to close this gap, so it is handed over the moment the release is published. Revisit the order if a red Pages build ever hides a real site error.

## Sources
`docs/plans/release-0.4.0.md`; `docs/handoff/website-release-prompt.md`; `.github/workflows/pages.yml`; `scripts/site/checks.mjs`; ADR-0033.
