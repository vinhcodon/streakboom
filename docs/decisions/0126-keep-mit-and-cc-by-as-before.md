# ADR-0126: Keep the licences as they were: MIT for the code and the app's art, CC BY 4.0 for the stickers; no trademark policy

- **Status:** accepted on 2026-11-15 (the author's instruction: the matter is too tangled, go back to MIT and CC BY as before). **Supersedes ADR-0125** the same day. Not legal advice.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
ADR-0125 chose direction B2 (a trademark policy for the names and the logo, every sticker CC BY 4.0, rules for forks). Writing the drafts showed how much text, upkeep and legal checking it needs (a lawyer for the names, a written answer from SignPath, changes in the README, CONTRIBUTING and the site), for a project the author says has no known users yet. The author decided to go back to what stands today.

## Decision
1. **The code and the art of the app stay MIT** (the whole repository, `LICENSE`, "Copyright (c) 2026 Vinh Codon"). No change of any text about it.
2. **The stickers stay CC BY 4.0** (ADR-0051), as published: free to use, share and adapt, also commercially, with credit to Streakboom.
3. **No trademark policy, no separate terms for goods, no rule about forks beyond the MIT licence.** The drafts `TRADEMARK.md` and the text changes are withdrawn (they stay in the git history, commit `3728a95`).
4. **Nothing is applied in the repository or on the site because of this ADR.** The text of the READMEs, CONTRIBUTING and the site stay as they are.
5. **Two small consistency fixes remain optional**, each only with the author's approval, not new terms: (a) the stickers carry two statements (MIT through the repository, CC BY 4.0 on the website): a licence file in their folder that says CC BY 4.0 (draft: `docs/drafts/STICKERS-LICENSE.md`); (b) `app/src-tauri/Cargo.toml` has no `license` field: `license = "MIT"`.
6. **The SignPath question is lighter:** MIT for everything in the app is the case their conditions describe, so nothing about the licence needs to be asked before the application (ADR-0088).

## What the author gives up by this (stated so that it was a choice)
No right is kept in the names Streakboom and Peak or in the logo beyond what the law gives anyone: another person may publish a fork under the same name, and the published stickers and the app's art may be printed on goods and sold, with credit for the stickers. The merch right rests on the author being the original maker and the official source, not on a licence. It can be reopened later by a new ADR (a trademark policy is a text added without changing MIT or CC BY).

## Charter check
No article is touched.

## Consequences
spec/18 is reduced to these points; the E30 stories are closed except the two optional fixes; the note to the website session says nothing is to change; the lawyer's meeting is no longer needed for the licences (the origin note is kept as a statement of facts).
