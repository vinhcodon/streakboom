# ADR-0092: Measure sticker copies with a small Worker, for a thirty-day reading first

- **Status:** accepted (Vinh asked on 2026-11-13: "tôi vẫn muốn đo để có số liệu cho danh sách hot", and chose a Cloudflare Worker, 30 days, copies only); **built; the Worker was deployed by the author on 2026-11-13** (`https://streakboom-count.vinhndhanoi.workers.dev`); counting starts when the address in `counting.json` is pushed
- **Date:** 2026-11-13
- **Decided by:** Vinh (author) for measuring, the Worker and the event; Claude (the website session) for the design
- **Supersedes** ADR-0091 (the pause); keeps what ADR-0077 Q7 approved

## Context
ADR-0091 paused counting because a GitHub counter lags by 15 to 25 minutes, may merge close requests, and sits next to the pruned releases. Vinh still wants numbers for the HOT list. Q7 (ADR-0077) already allows anonymous counting with a small Cloudflare Worker, texts changed first.

## Decision
1. **One event:** a **copy** of a sticker (not Share, not search, not a view). The page sends one POST per sticker and page view, with the body `<address of the sticker> <language of the page>` (for example `thank-you vi`), `no-cors`, no credentials, no referrer. No cookie, no identifier, no account.
2. **The Worker** (`scripts/site/worker/`, Cloudflare Workers and D1) adds one to a row per **day, sticker and language** and keeps nothing else; this code stores no address. It refuses any other body and any other origin, limits requests per address with Cloudflare's own limiter (not stored by this code), ignores new names once a day has 100 different ones, and gives the totals only with a secret token. Cloudflare itself handles the request as any web host does; the texts say so.
3. **A switch, off by default** (`scripts/site/catalog/counting.json`, empty endpoint = off). With no endpoint the page sends nothing and the texts say "nothing is sent" as before. With an endpoint the build changes **together**: the address on the sticker page, the text that a copy is counted on the sticker pages and in the paragraph about this website of the privacy page (three languages, written by an AI, no native reader), and `llms-full.txt`. The build refuses one without the other, an endpoint that is not https on workers.dev or streakboom.com, one with a query or a login, a page that says "no analytics" while counting is on, and a `stickers.js` that makes a request beyond the three listed (the picture, the search index, the counted copy).
4. **Thirty days of reading first (plan v1.7):** the data is collected and read; **no HOT row is shown** until Vinh sets the thresholds. The HOT formula and the Classics shelf stay as decided before (ADR-0077 Q7, the earlier answers: this week against the sticker's own average of the previous eight weeks, a minimum of uses, ranks not numbers, built at build time from the daily totals).
5. **What the author does:** a Cloudflare account, the deploy of the Worker, the secret `READ_TOKEN`, later a GitHub secret for the build to read the totals (steps in `scripts/site/worker/README.md`). No assistant handles a login or a token.

## Consequences
- Nothing changes on the live site until the author deploys the Worker and gives its address; then the pages change in one push.
- The lawyer's list (plan v1.1) gets the new vendor and the counter.
- **Not verified:** the Worker has not run on Cloudflare (tests use a fake database); the rate-limit binding syntax of `wrangler.toml` was not run; how many copies a day the sticker pages will have (the 200 a week of the HOT plan is a guess); the legal reading of the anonymous counter; the Vietnamese and Japanese texts. Seen in the built-in browser with a test address: the page sends exactly one note per sticker and page view with the body above.
