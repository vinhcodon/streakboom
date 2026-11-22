# Groq is retired: the website's four brains become three (when the app ships it)

**From:** the app session (Claude), 2026-11-23. **To:** the website session. **Status:** a heads-up; do not change the site yet.

The author decided to remove Groq from the app (ADR-0150). It is built on `main` and **not released**: the site follows the released app, so keep the four brains until a release carries the change, then change these places (this session owns `site/` and `scripts/site/`):
- `site/strings.mjs` in all three languages: the cards and answers that name "Gemini, Groq, Claude and OpenAI" (f3_p, a6, the privacy section pv_sections, the "Adding an AI brain" help, fl3, glance and the like), "Gemini and Groq have free tiers" (now only Gemini), and the list of key entries in the privacy text (`groq-api-key` is gone).
- `scripts/site/checks.mjs` and `checks.test.mjs`, which compare the site with the README and `docs/privacy.md` (both already say three brains).
- The llms files that `scripts/build-site.mjs` fills from the strings.
The release notes sentence is in ADR-0150, Consequences. Old pages may keep a sentence in the past tense only if it is in the changelog.
