# ADR-0077: The sticker page as a picker: Vinh's answers to Q3 to Q10

- **Status:** accepted (answered by the author on 2026-11-13 as multiple choice); the plan ([`../plans/sticker-page-plan.md`](../plans/sticker-page-plan.md)) and [`../../spec/13-sticker-page.md`](../../spec/13-sticker-page.md) are the proposal these answers fill in; **v0.1 (the tag rules) was built on 2026-11-13 after Vinh approved the plan; the rest of the plan is not**
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
The handoff `sticker-page-hypothesis.md` (v0.2) asked for a spec and a plan for turning the sticker page into a picker for Zalo and Microsoft Teams, with open questions Q3 to Q5. The website session added Q6 to Q10 (spec 13 section 10) and asked each as a multiple choice.

## Decision
1. **Q3, languages:** no new language yet; Vietnamese, English and Japanese stay. A new language is chosen with Search Console country data and the first counts.
2. **Q4, the website:** it is in this repository (`site/`, `scripts/site/`), deployed by GitHub Pages through the workflow on every push to `main` and daily, owned by Vinh and edited by the website session.
3. **Q5, captions:** hand-placed (as now) for v0; layers (captions drawn in the browser) are decided at the start of v1, after Safari and build-time tests, for new languages only.
4. **Q6, Download:** no per-sticker Download button and no ZIP (ADR-0053 holds); the fallback is the browser's own menu on the real `<img>`.
5. **Q7, counting:** **anonymous counting is allowed from v1**, with a small Cloudflare Worker (one new vendor; counters per day, no identifier, no cookie, no IP stored by our code; HOT is built at build time from the daily totals and shows ranks, not numbers). **The privacy texts change first** (the sticker pages and the privacy page, three languages), a lawyer's note is added to the list, and nothing is counted in v0. This **replaces the sticker pages' promise** "nothing is sent or recorded when you copy or share" (ADR-0051, ADR-0053, ADR-0060) from the day v1.1 goes live.
6. **Q8, phones:** a tap opens the share sheet at once where the browser can share files, **after a test on a phone**; until then a tap copies as today.
7. **Q9, tags:** given **by the system**: a keyword dictionary applied at build time to the captions, titles and alt texts, filling emotions, situations, synonyms and the cheekiness level, plus a proposal page for Vinh to skim; a sticker the rules do not tag stops the build; no AI service is called by the build.
8. **Q10, white background:** no variant; only if an app is later found to show the transparent picture wrongly.
9. **V1, the chat table:** Vinh did a quick check of Zalo and Teams on all the platforms he has and found them OK; no cell of the matrix was filled, so the per-app details stay unrecorded. Teams goes into real use and issues are fixed later.
10. **V7, indexing:** the Search Console and Bing facts are given later; no cause is named meanwhile.

## Alternatives considered
For Q7: no counting at all, or never counting. For Q8: keeping copy first. For Q9: tags by hand (by the sticker session or by Vinh), AI suggestions in a session when a sticker is added, or an AI call in CI at every build (a secret key, a cost and unstable results). For Q5: client-side captions from v0. For Q3: one named extra language, or English only.

## Consequences
- The privacy promise of the sticker pages is a thing of v0 only; v1.1 must change the texts, the ADR record and the lawyer's list before it counts anything.
- Tags need a dictionary that grows with the stickers (no sticker is published untagged).
- Not verified: how Zalo and Teams treat the sticker in each environment (Vinh's quick check is a summary); Web Share on phones; the Safari clipboard; the indexing cause; the legal reading of anonymous counters.

## Sources
`docs/handoff/sticker-page-hypothesis.md`, spec 13, the plan, ADR-0051, ADR-0053, ADR-0060, ADR-0075.
