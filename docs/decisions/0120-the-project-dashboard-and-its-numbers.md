# ADR-0120: The project dashboard, and where its numbers come from

- **Status:** accepted (Vinh asked for the dashboard on 2026-11-15 and for a file to hold the hand-typed numbers); **built, not published**
- **Date:** 2026-11-15
- **Decided by:** Vinh (author)

## Context
The site now carries several measurement tools (Cloudflare Web Analytics, Microsoft Clarity, Search Console, the download ledger, the copy counter). Their numbers sit in six places. The author asked for one page that gathers them, with updating that does not depend on remembering, and with the hand-typed numbers in a file in the repository.

## Decision
1. **A private dashboard** (a Claude page of the Data type, "Streakboom Metrics") shows the downloads (total, per day, per version, Stable and Preview), the GitHub numbers and the weekly numbers. It states, beside each number, what it does not measure (a download is not a person; Peak sends nothing home, so there is no count of active users).
2. **The numbers come from public addresses only** (the ledger `downloads.json` and the GitHub API) **plus one hand-typed file**, `docs/metrics/weekly.csv`, in which the author writes once a week what he reads from Cloudflare, Clarity and Search Console. **No token, key or login is given to Claude or put in a file.**
3. **`scripts/site/metrics.mjs`** collects and checks (a week must be a Monday, numbers whole, no repeated week), appends one row per day to `docs/metrics/repo-history.csv` and writes the four CSV files the dashboard reads. It has tests.
4. **The page cannot fetch**: a page of this kind may not call any address, so the files are uploaded to it. A refresh is: run the script, upload the files, point the datasets at them (one request to Claude, "update the dashboard").

## Not decided here
- A **routine** that refreshes every week by itself (a scheduled task); it needs the author's yes.
- Reading Cloudflare, Clarity or Search Console **automatically**. Each needs a token or an OAuth sign-in that the author would create and keep himself; until then the weekly file stays the way.

## Consequences
- The file is read by Claude when the dashboard is refreshed; it holds only numbers, nothing private.
- **Not verified:** that a routine would be able to upload to the dashboard without the author present; how the dashboard looks on a phone.
