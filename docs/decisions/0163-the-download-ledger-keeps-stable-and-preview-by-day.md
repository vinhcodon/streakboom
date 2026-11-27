# ADR-0163: The download ledger keeps Stable and Preview by day

- **Status:** accepted (the author asked, in a comment on the project dashboard on 2026-11-23, for each day's column to be split into Stable and Preview with lines through them as a trend; he allowed the download of the 81 kept copies of the ledger); **built; published 2026-11-26**
- **Date:** 2026-11-23
- **Decided by:** Vinh (author)
- **Builds on** ADR-0052 and ADR-0099 (the ledger and its copies in Actions), ADR-0090 (the channels), ADR-0120 (the dashboard)

## Context
The ledger `downloads.json` kept one total per day. The dashboard could not split a day into Stable and Preview, and the split of earlier days is not recoverable from GitHub (it keeps only the newest two releases of each channel). But every run of the Pages workflow keeps a copy of the ledger as an artifact (`downloads-ledger`, 90 days), and each copy has the downloads per version of that run.

## Decision
1. **From the next deploy each entry of the daily history carries the split:** `{date, total, stable, preview}`, the cumulative downloads of the versions with an even middle number (Stable) and an odd one (Preview), which add up to the total and never fall. Old readers still work: `date` and `total` are unchanged and the new fields are added. A tag that is not a version gives no split.
2. **The days before are rebuilt once** from the 81 copies Actions had kept (one per run, 2026-11-11 to 2026-11-22; the author allowed their download): the last copy of each date, kept in `scripts/site/catalog/downloads-channel-backfill.json`. A day is listed only when Stable plus Preview equals that day's total in the history (all 12 days did). The build fills a day of the history that lacks the split from this file and never overwrites a day that has it.
3. **`scripts/site/metrics.mjs` writes a fifth file, `downloads_channel.csv`** (date, total, stable, preview), for the dashboard; the dashboard's chart shows per day a column for Stable and one for Preview (the downloads added that day) and a line through each series.

## Consequences
- The ledger grows by two numbers a day; the 400-day limit stays.
- The first entry (2026-11-11) includes the downloads before the ledger began, so its columns are not one day's.
- **Not verified:** the next deploy writes the split into the published ledger (the tests and a dry merge of the live ledger give the 13 days; the live file will show it after the next run); the chart in a browser (the check could not run while the dashboard tab was hidden; the calculation was run on the real file); that the weekly routine writes the fifth file (its folder must have this code: it runs `git pull --ff-only`).

## Amendment 1 (2026-11-26): published, and the days since
The change was published on 2026-11-26, renumbered from 0152 (taken on main in the meantime). The backfill was extended with the days from 11-23 to 11-26 from the copies Actions kept. **There is no entry for 2026-11-25**: that day's run failed (ADR-0162) and kept no ledger, so the increase shown for 11-26 on the dashboard covers two days.
