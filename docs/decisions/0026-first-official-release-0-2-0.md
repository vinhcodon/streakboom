# ADR-0026: 0.2.0 is the first official release; the 0.1.x development builds are withdrawn

- **Status:** accepted (done 2026-11-08)
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
Versions 0.1.0 to 0.1.16 were development builds, published one after another on 2026-11-07 and 2026-11-08 (17 GitHub releases). One of them (0.1.14) contained an unreviewed prototype by accident. The author wanted a clean start: one official release, with the old ones removed.

## Decision
- **0.2.0** is the first official release. The author chose 0.2.0 over 1.0.0 (a big step that still sits in the 0.x range, which matches what is not yet verified: no code signing, the Claude and OpenAI brains never run with real keys, Windows only) and over 0.1.17.
- The 17 GitHub releases v0.1.0 to v0.1.16 and their tags were deleted; the git commit history is kept. Only v0.2.0 remains in Releases.
- Local copies of the old installers (in `dist/` and in the NSIS bundle folder) and the old frontend build were deleted; the installed app on the author's machine is 0.2.0. Backups of the author's own data (outside the project folder) were kept.
- The README status says "first official release" and says that the 0.1.x builds were development builds and have been withdrawn, with the limits stated plainly.

## Alternatives considered
1.0.0 (declined: it would claim a maturity the project cannot yet show); keeping the old releases and only marking 0.2.0 official (declined by the author); rewriting git history to remove old versions (not requested, and not done).

## Consequences and when to revisit
- Anyone who linked to a v0.1.x release page or download gets a 404; the website must only use "latest" links (see the handoff note to the website).
- Copies of the app older than 0.1.16 could not update (the old release path had failed) and need a manual install of 0.2.0; copies at 0.1.16 read the repository manifest and should offer 0.2.0.
- Revisit the version scheme at the next milestone: call it 1.0.0 once code signing exists and the Claude and OpenAI brains have been tried with real keys.
- This was a one-time cleanup, not a policy: from now on releases are kept.

## Sources
GitHub release v0.2.0, docs/engineering-log.md (the 0.2.0 entry), README status
