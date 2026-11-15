# ADR-0124: IndexNow after a deploy

- **Status:** accepted (Vinh answered "làm IndexNow đi" on 2026-11-15, after Bing Webmaster showed "Discovered but not crawled" for the home page); **built, not published**
- **Date:** 2026-11-15
- **Decided by:** Vinh (author)

## Context
Bing Webmaster Tools reported the home page as discovered on 2026-10-07 and never crawled. The site side is in order (checked with a Bingbot user agent: 200, no `noindex`, a canonical, `robots.txt` and the sitemap served). IndexNow is a protocol by which a site tells the engines that take part (Bing, Yandex, Naver, Seznam and others; not Google) which addresses changed, so they come to read them sooner.

## Decision
1. **A key file is served at the root:** `https://streakboom.com/<key>.txt` holds exactly the key (32 lower-case hexadecimal characters, no newline). The key is **public by the protocol's design** (the engines read it to know the owner sent the list); it opens nothing and is not a secret. It lives in `scripts/site/catalog/indexnow.json` with the switch (`enabled`).
2. **After a deploy** the Pages workflow runs `scripts/site/indexnow.mjs`: it first reads the key file from the live site (if it is not live or holds another text, nothing is sent), then posts to `https://api.indexnow.org/IndexNow` the host, the key, where the key is served and **the addresses of every page of the sitemap**. It runs after a push or a manual run, **not on the daily schedule** (which changes only the download number).
3. **What leaves the repository is public:** the host and the addresses of public pages, and the public key. No visitor data, no cookie, no token; nothing is added to any page, so the privacy page does not change.
4. **A failure is a warning:** the step is `continue-on-error`, the script never throws, and the deploy and the live check are not affected.
5. **The build refuses** an invalid key or flag, a key file that is missing, repeated or not exactly the key while the switch is on, a key file while it is off, and the key file named in the sitemap.

## Consequences
- Every push to the site sources sends all the addresses (about 16), not only the changed ones: simple, and small. If the engines throttle repeated lists, the step can be limited to changed pages in a later change.
- IndexNow only makes it likelier that Bing comes sooner; it does not guarantee indexing, and it does nothing for Google (Search Console and the sitemap do that).
- **Not verified:** that Bing accepts the key and the list (the first real answer is in the log of the first deploy, status 200 or 202); that the key file is served by Cloudflare right after the deploy (if not, the step says so and sends nothing; a manual run later does); that Bing then crawls the pages.

## Amendment 1 (2026-11-15): Cloudflare Crawler Hints is on
The author read that Cloudflare supports IndexNow through **Crawler Hints** (Cache, Configuration, Crawler Hints; free) and **turned it on in the Cloudflare dashboard** (his word, 2026-11-15; the website session does not change Cloudflare). It sends signals about changes seen by Cloudflare, in addition to the list this ADR sends after a deploy; both only name public addresses. Cloudflare's post (2021) does not say which URLs are sent, when, whether every plan and only proxied zones qualify, or how it combines with a site's own IndexNow pings, so both are kept: ours is known to work (answered 202), Cloudflare's is not observed. A repeated notice of the same address is harmless. The privacy page does not change (no visitor data).
