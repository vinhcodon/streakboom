# ADR-0087: A version in the addresses of the stylesheet, the scripts and the search indexes

- **Status:** accepted (Vinh asked for it on 2026-11-13: "làm phần gắn mã băm vào CSS và JS đi"); **built on 2026-11-13** (committed; live after the push)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author) for doing it; Claude (the website session) for the way

## Context
After the sticker layout was pushed and deployed, Vinh still saw the old page: GitHub Pages lets a browser keep any file for 10 minutes (`max-age=600`), and `style.css` and the scripts have fixed names. A visitor could also meet a new page with an old stylesheet or script. This would happen at every update.

## Decision
1. The build computes **one short hash (10 hex characters of SHA-256) of the content** of the stylesheet, every script and the search indexes, and puts it in their addresses as `?v=<hash>`: the `<link>` and the `<script>` of every page, the imports the scripts make of each other (`from "./ui.js?v=…"`, also in `peak/`), and the address of the search index that `stickers.js` fetches.
2. One hash for all of them, not one per file: the scripts import each other, so every import must carry the same version or the browser would load two copies of a module. When any of them changes the whole set gets new addresses; when none changes the addresses stay, so the browser keeps what it has.
3. The hash is of the content, so the same files give the same address (no date in it). The source files in `site/` are not changed; the version is added to the copies in `_site/` (`scripts/site/assetversion.mjs`).
4. The build refuses: a page whose stylesheet or script has no version, a script that imports another without it, a `stickers.js` that asks for the search index without it, or a `stickers.js` whose index address the build cannot find (so a rename cannot silently skip it).
5. **Not changed:** the HTML pages themselves are still kept 10 minutes by the browser (GitHub Pages, no control over headers), so a visitor can see an old page for up to 10 minutes, but that old page now always loads its own matching stylesheet and scripts. The sticker pictures and the other files in `assets/` keep their names (they change rarely; a changed picture shows after the 10 minutes).

## Consequences
- No service worker, no cookie, no server: only addresses. The site still sends nothing about the visitor.
- **Not verified:** the effect on the live site until the next deploy (the first deploy after this changes every address once); that no browser, crawler or tool relies on the old fixed address `/style.css` (searched in the repository: nothing does).
