# Plans

What we **will do**, in order, and how we will check it. A plan is not a decision and not a hypothesis: it says how a decision will be carried out. It goes out of date when the work is done; then it is marked done and the result goes to `../engineering-log.md`.

| File | What | Status |
|---|---|---|
| [`roadmap.md`](roadmap.md) | From 0.1.14 to a closed alpha: phases, gates, the decisions needed | approved 2026-11-08; phases 1 and 2 done, the rest open |
| [`backlog.md`](backlog.md) | Epics and user stories from the five qualities of the pet, with sizes, dependencies, progress and the standing rule to compare with the plan after each story | proposed 2026-11-08; being carried out story by story (progress as of 0.2.5) |
| [`character-and-movement.md`](character-and-movement.md) | Character bible, favorite places and focus-safety: ordered steps, files, risks, test plan; the CPU baseline comes first | spec 06 approved 2026-11-08; step 0 (CPU) first |
| [`terrain-and-attention.md`](terrain-and-attention.md) | The desktop as terrain: a cost field of fixed relief and the user's attention; levels L1 to L4, steps, risks, tests | proposed 2026-11-09; direction agreed; monitors, hops and the typing lane built (0.2.5) |
| [`verification-debt.md`](verification-debt.md) | Everything built or released but not yet checked, in one list (what, how to check, who, since when); updated after every task and at every release | live; started 2026-11-09 |
| [`website-seo-geo.md`](website-seo-geo.md) | A site structure friendly to search engines and AI answer engines: static facts, per-language URLs, a crawlable changelog, structured data, `llms.txt`, `robots.txt`, a way to measure; seven decisions as multiple choice | proposal 2026-11-09; **the author chose D1 to D7 on 2026-11-09 (ADR-0034)**; nothing built yet, waiting for the go-ahead |
| [`pet-qualities-assessment.md`](pet-qualities-assessment.md) | Dated assessment of the five qualities (presence, continuity, personality, care loop, proactive but frugal) against what exists, the gaps and how the north star is measured | snapshot 2026-11-08, version 0.2.2 |
| [`bond-days.md`](bond-days.md) | Implementing the north star counters: steps, files, risks, test plan, what could not be verified | built and released in 0.1.15; some checks not verified |

Rules: each plan lists its steps in order, the files affected, the risks, the tests (automatic and by hand) and what could not be verified. No code for a plan starts before Vinh has approved it.
