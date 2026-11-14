# Note for the website session: the count of hand-written lines is now 265, not 263

- **From:** the app session. **Date:** 2026-11-14. **Status:** open, for the website session.
- **What changed:** the one-time hint about stepping aside (ADR-0111, IM-4) added 2 lines per language, so the pools hold **265 lines per language** (counted from `LINES` in `app/src/lib/lines.ts`: 265 in English, Vietnamese and Japanese).
- **Why the README still says 263:** the site build checks that the three `how-it-works` pages say the same number as the README (`scripts/build-site.mjs`), and those pages are the website session's. If the app session changed the README first, the build would fail. So the README and `docs/features.md` still say 263 on purpose.
- **What to do:** change the number on the three pages (`/how-it-works/`: 265 hand-written lines; `/vi/how-it-works/`: 265 câu viết tay; `/ja/how-it-works/`: 265個) and tell the app session; the app session then changes `README.md` and `docs/features.md` to 265 in one commit (spec 03 already says 265). Or change all of them in one commit with the website session's paths, if that is simpler.
- **Not done by the app session:** nothing under `site/` or `scripts/site/` was edited.
