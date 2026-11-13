# ADR-0099: The previous download ledger is read from the copy kept in Actions, not from the live site

- **Status:** accepted (Vinh chose "Đọc sổ từ bản sao trong Actions" on 2026-11-14, to be able to turn Bot Fight Mode on again); **built** (not yet run by the workflow)
- **Date:** 2026-11-14
- **Decided by:** Vinh (author)
- **Amends** ADR-0052 (where the previous ledger comes from); the count itself still comes from GitHub (`download_count`).

## Context
The build read the previous ledger from `https://streakboom.com/downloads.json` and refused to publish when it could not (so that no history is lost). Since the site is behind Cloudflare, its Bot Fight Mode turned the build server away with a challenge (403, "Just a moment..."), and every deploy failed (W-64) until Bot Fight Mode was switched off. Vinh wants it back on, as a bot protection.

## Decision
1. The workflow **fetches the newest unexpired artifact `downloads-ledger`** (the copy every run already keeps for 90 days) into `previous-ledger/` before the build, with the `actions: read` permission, and the build reads the previous ledger **from that file** (`STREAKBOOM_PREVIOUS_LEDGER`). The live site is not asked.
2. **No artifact, or it cannot be read** (the first run, or 90 days without a successful deploy): the build falls back to the live site as before, and a warning says so. A kept copy that is **not** a valid ledger stops the build; it is never replaced by another source.
3. The count is unchanged: the installer's `download_count` of each release from GitHub, the larger of the two per tag, the total their sum (ADR-0052). Counting button clicks or moving the ledger to a Cloudflare Worker was considered and not chosen: GitHub's number is the real downloads, and a Worker would add two secrets and a second store.

## Consequences
- The build no longer depends on Cloudflare for the ledger. Bot Fight Mode can be on.
- **The check of the live site after the deploy is blind while Bot Fight Mode is on** (the runner is turned away; the check reports "not checked" and passes with a warning). It still works from the author's machine (`node scripts/site/livecheck.mjs`).
- A run that fails after its artifact was uploaded still leaves a good ledger; a run that fails before leaves the previous one. The ledger only grows (per tag the larger count), so an older copy loses no history, only the newest counts, which the next run recovers from GitHub.
- **Not verified:** that the workflow's `gh api` fetch of an artifact works with the default token and `actions: read` (not run yet); the first run after this should be watched.
