# ADR-0082: The sticker search is by meaning, in any language typed, on any page

- **Status:** accepted (the author's requirement of 2026-11-13); **built on 2026-11-13** (committed; live after the push)
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The first search (plan v0.2) had an index per page language, so on the Vietnamese page "tired" found nothing like "mệt". Vinh asked that, whatever language the page is in and whatever language a visitor types, the stickers of that meaning are found and shown in the page's language: on the Vietnamese page "tired" gives the same list as "mệt".

## Decision
1. **The index is by script, not by page language:** `search-latin.json` (English and Vietnamese together: titles, words on the pictures, synonyms, tag names, all normalised for Latin letters) and `search-ja.json` (Japanese). A query with kana or kanji reads the Japanese file, any other query the Latin file; the page loads the one it needs when it is first needed. The stickers shown are always the page's own (their pictures and titles are in the page's language).
2. **The meaning comes from the tags,** which have names and synonyms in the three languages (ADR-0077): "tired", "mệt" and "眠い" lead to the same tags and so to the same stickers.
3. **The limit:** a language the tags do not have is not understood (for example Spanish or Korean). Another language is added with its names and synonyms in `tags.json` and a file of its script when needed (Q3: no new language yet).
4. **Scale:** each file is limited to 150 KB gzipped by the build; at thousands of stickers the Latin file is split by letter or by tag, as spec 13 says.

## Alternatives considered
Machine translation of the query (a service or a model in the page: a dependency, a privacy question and a weight); one index with all three languages for every page (the same words, three times the size, and mixing the normalisations); no change (the search stays per language).

## Consequences and what is not verified
- Checked by a table of the same meaning typed in the three languages (the lists are the same for "tired" and "mệt") and by typing "tired", "mệt", "眠い" and "thanks" on the Vietnamese page in the built-in browser. **Not verified:** a phone; Safari and Firefox; whether people type other languages (no data); the synonyms in Vietnamese and Japanese have no native reader.
- English and Vietnamese words share one Latin index, so a Vietnamese word without marks that is also an English word can find stickers of the other meaning (the ranking and the best-matching rule keep this small); not measured.

## Sources
`docs/plans/sticker-page-plan.md` (v0.2), spec 13 section 3, ADR-0077.
