# Numbers of the project (the dashboard's source)

The project dashboard (a private Claude page, "Streakboom Metrics") reads four CSV files. Two folders of numbers feed them (ADR-0120):

| File | Who writes it | What it holds |
|---|---|---|
| `weekly.csv` | **the author, by hand, once a week** | the five numbers read from Cloudflare, Clarity and Search Console |
| `repo-history.csv` | `scripts/site/metrics.mjs` (appends one row per day it runs) | stars, forks, open issues and watchers of the GitHub repository |

The downloads (daily and per version) are read at each run from the public ledger, `https://streakboom.com/downloads.json`. Nothing here is a secret and no tool needs a token.

## The weekly file, `weekly.csv`
One line per week; `week` is the **Monday** of that week (`2026-11-09`). A number that was not read that week stays empty. Whole numbers only, no thousands separators.

| Column | Where to read it |
|---|---|
| `cloudflare_visits` | Cloudflare, Web Analytics, visits of the week |
| `clarity_sessions` | Clarity, Dashboard, sessions of the week |
| `clarity_download_clicks` | Clarity, Dashboard (or a smart event) for the clicks on the download button; empty if not set up |
| `search_console_indexed_pages` | Search Console, Pages, the number of indexed pages |
| `search_console_impressions` | Search Console, Performance, impressions of the week |

Each tool counts in its own way, so the numbers are never added together.

## Refreshing the dashboard
1. `node scripts/site/metrics.mjs --out <folder>` (from the repository root) reads the public ledger and the GitHub API, checks `weekly.csv` (it stops with a message if a week is not a Monday, a number is not whole or a week is repeated), appends today's row to `repo-history.csv` and writes the four CSV files into `<folder>`.
2. The files are uploaded to the dashboard and its datasets point to them (this is what "update the dashboard" means when asked of Claude).
3. Commit `docs/metrics/weekly.csv` and `docs/metrics/repo-history.csv` by explicit path.

A routine that runs this every week is a separate decision of the author (ADR-0120).
