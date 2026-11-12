# Plans

What we **will do**, in order, and how we will check it. A plan is not a decision and not a hypothesis: it says how a decision will be carried out. It goes out of date when the work is done; then it is marked done and the result goes to `../engineering-log.md`.

The files are grouped here, not in folders (decided at gate 2 of the foundation review, 2026-11-11: other sessions and the website build use the present paths).

### Now (the work in hand)

| File | What | Status |
|---|---|---|
| [`foundation-review.md`](foundation-review.md) | The review of the code, the texts, the decisions, the hypotheses and the earlier plans against the foundation (the eleven rules, the mission, 18+, banned claims): each row of `foundation/charter-alignment.md` verified, where the foundation may be wrong, eight decisions proposed | written 2026-11-11; **done** (gates 1 to 3 passed; its decisions are ADR-0059 and the work is released in 0.4.0) |
| [`backlog.md`](backlog.md) | Epics and user stories from the five qualities of the pet, with sizes, dependencies, progress and the standing rule to compare with the plan after each story | proposed 2026-11-08; being carried out story by story (progress as of 0.2.5) |
| [`verification-debt.md`](verification-debt.md) | Everything built or released but not yet checked, in one list (what, how to check, who, since when); updated after every task and at every release | live; started 2026-11-09 |

### Product (how a part will be built)

| File | What | Status |
|---|---|---|
| [`roadmap.md`](roadmap.md) | **Version 2:** from 0.4.1 to a closed alpha and the gates to going public (R0 to R6): the signed installer, the checks, the alpha, the decisions after it | written 2026-11-12 (ADR-0071); **R0 and R1 start now** |
| [`signpath-ci-plan.md`](signpath-ci-plan.md) | Free code signing from SignPath Foundation and releases built in CI: our repository against each condition, the hybrid release flow (the updater key stays local), the steps, the reputation risk and the free plan B | written 2026-11-12 (ADR-0072); **nothing built, nothing applied for** |
| [`code-signing.md`](code-signing.md) | The paid code-signing options for an individual in Vietnam and what signing does about SmartScreen | written 2026-11-12; **set aside** (the author chose SignPath, ADR-0072); kept for the record |
| [`roadmap-v1.md`](roadmap-v1.md) | The first roadmap, from 0.1.14 and 0.2.0 to a closed alpha: phases 0 to 6 and its decisions R1 to R6 | superseded 2026-11-12 by `roadmap.md`; kept for the record |
| [`pet-qualities-assessment.md`](pet-qualities-assessment.md) | Dated assessment of the five qualities (presence, continuity, personality, care loop, proactive but frugal) against what exists, the gaps and how the north star is measured | snapshot 2026-11-08, version 0.2.2 |
| [`terrain-and-attention.md`](terrain-and-attention.md) | The desktop as terrain: a cost field of fixed relief and the user's attention; levels L1 to L4, steps, risks, tests | proposed 2026-11-09; direction agreed; monitors, hops and the typing lane built (0.2.5) |
| [`character-and-movement.md`](character-and-movement.md) | Character bible, favorite places and focus-safety: ordered steps, files, risks, test plan; the CPU baseline comes first | spec 06 approved 2026-11-08; step 0 (CPU) first |

### Stickers (the sticker session's files; `assets/stickers/` is also read by the website build, so it stays where it is)

| File | What | Status |
|---|---|---|
| [`sticker-pack-2-office.md`](sticker-pack-2-office.md) | A second pack of 20 stickers for office chats in a cheeky cat's voice: assessment, risks, the list of 20 quotes with descriptions, the check against pack 1, the way of working | proposal 2026-11-12; the list waits for the author's approval, nothing drawn |
| [`sticker-test.md`](sticker-test.md) | An off-app test: a sticker set of the cat on Zalo to bring new users; steps, facts to verify first, how installs and Bond Days are read without new tracking, stop rules | proposal 2026-11-10; waiting for Vinh's answers to the open questions (spec/06 section 7.5) |
| [`sticker-set-v0.md`](sticker-set-v0.md) | The list of the sticker set (ST-3): the texts, the poses, the counts; updated by ADR-0050 | the sticker session's file; its row was added by the app session at the 0.3.2 release |
| [`sticker-set-v1-direction.md`](sticker-set-v1-direction.md) | The direction for the second pass of the sticker set (about 29% sarcasm, the lounging and the curled cat) | the sticker session's file; decided in ADR-0050 |
| [`sticker-expression-audit.md`](sticker-expression-audit.md) | The audit of how different the emotions of the sticker set are, and the choices that followed | the sticker session's file, 2026-11-11 |
| [`sticker-packs-three-categories.md`](sticker-packs-three-categories.md) | The sticker packs in three categories of 20 (Cute, Friends, Office): the lists, the voice of each, and the first pass of the ten new Cute stickers | the sticker session's file; approved by the author on 2026-11-12 (its row was added by the app session during the documents audit) |
| [`sticker-list.md`](sticker-list.md) | The author's shortlist of 32 stickers in one list (the three-category split was dropped on 2026-11-12) | the sticker session's file; its row was added by the app session during the roadmap work |

### Website (the website session's file)

| File | What | Status |
|---|---|---|
| [`website-seo-geo.md`](website-seo-geo.md) | A site structure friendly to search engines and AI answer engines: static facts, per-language URLs, a crawlable changelog, structured data, `llms.txt`, `robots.txt`, a way to measure; seven decisions as multiple choice | proposal 2026-11-09; the author chose D1 to D7 (ADR-0034); **built and deployed 2026-11-09**; the baseline, validators and Search Console are still open |

### Releases

| File | What | Status |
|---|---|---|
| [`vi-lines-0.4.0.md`](vi-lines-0.4.0.md) | The Vietnamese lines changed for 0.4.0, before and after, for the author to read (V-103, V-105) | written 2026-11-12; **read by the author, no change asked** (V-103, V-105) |
| [`release-0.4.0.md`](release-0.4.0.md) | The alignment release: stories FA-1 to FA-11 from spec 12, their order, tests, risks, what waits for 0.4.1 | **published 2026-11-12**; carried out as planned (the first run of the release script failed on quotes in the notes, nothing was published) |
| [`release-0.3.2.md`](release-0.3.2.md) | The draft of release 0.3.2: what is in it, the changelog entry, the README change, the version files, what the website is told, the checks | prepared 2026-11-11; the CHANGELOG, README and version files were filled the same day and the release waits for the author's order |

### Done (kept for the record)

| File | What | Status |
|---|---|---|
| [`bond-days.md`](bond-days.md) | Implementing the north star counters: steps, files, risks, test plan, what could not be verified | built and released in 0.1.15; some checks not verified |

Rules: each plan lists its steps in order, the files affected, the risks, the tests (automatic and by hand) and what could not be verified. No code for a plan starts before Vinh has approved it.
