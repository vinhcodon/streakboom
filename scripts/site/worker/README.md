# The counter of sticker copies (ADR-0092)

A small Cloudflare Worker that adds one to a daily total when someone copies a sticker on the website. It is **off** until the address of the Worker is put in `scripts/site/catalog/counting.json`; the site then says on the sticker pages and the privacy page that a copy is counted, and the page starts to send.

What it receives: one note per copy, `<sticker> <language>` (for example `thank-you vi`), as a POST with no cookie and no referrer. What it keeps: a row per day, sticker and language with a number (`schema.sql`). It stores no identifier and no address (Cloudflare itself handles the request like any web host).

## What you do (the author; an assistant never handles your login or tokens)

You need a Cloudflare account (free) and Node 20 or newer. From this folder (`scripts/site/worker/`):

1. `npx wrangler login` (opens the browser; you sign in yourself).
2. `npx wrangler d1 create streakboom-count`, then copy the `database_id` it prints into `wrangler.toml` (the line that is commented out).
3. `npx wrangler d1 execute streakboom-count --remote --file=schema.sql`
4. Make a long random string for reading the totals and store it as a secret: `npx wrangler secret put READ_TOKEN` (paste the string when asked). Keep a copy in your password manager; the build will need it as a GitHub secret named `STICKER_COUNT_TOKEN`.
5. `npx wrangler deploy`. It prints the address of the Worker, like `https://streakboom-count.<your-name>.workers.dev`.
6. Tell the website session the address. It puts it in `counting.json`, builds, and you say "Đẩy lên" as usual.

## Checks after it is live

- Copy a sticker on the live page, then `npx wrangler d1 execute streakboom-count --remote --command "SELECT * FROM uses"` shows one row with `n = 1`.
- `curl -i -X POST https://<address>/ --data "hello"` answers 400; a call to `/totals` without the token answers 401.

## To stop counting

Empty the `endpoint` in `counting.json` and push: the page stops sending and the texts go back to "nothing is sent". The data stays in your database until you delete it (`DELETE FROM uses`).
