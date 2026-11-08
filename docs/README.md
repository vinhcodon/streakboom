# Documentation map

Each kind of statement has one home. Before adding a sentence, decide which kind it is.

| Kind | Home | Question it answers | Changes when |
|---|---|---|---|
| How the product works now | [`../spec/`](../spec) | What does it do, and how is it built? | the product changes |
| Decisions | [`decisions/`](decisions/README.md) | What did we choose, why, and what did we reject? | a choice is made or reversed (new record; old one marked superseded) |
| Hypotheses and assumptions | [`hypotheses/`](hypotheses/README.md) | What do we believe but not know, and what would settle it? | evidence arrives |
| Handoffs | [`handoff/`](handoff/README.md) | What did another session or conversation tell us? | never edited after receipt; the index records what became of it |
| Plans | [`plans/`](plans/README.md) | What will we do next, in what order, tested how? | work starts or finishes |
| History | [`engineering-log.md`](engineering-log.md) | What was built, measured and learned, and what was not verified? | appended, never rewritten |

## Keeping them in step
1. A change to behavior updates the spec in the same commit as the code, and the README if users see it.
2. A choice between options gets an ADR. A belief that is not proven goes in the hypotheses register, with the evidence that would settle it.
3. When a hypothesis is settled, update its status and write an ADR if the product changes.
4. Numbers that appear in several places (test counts, line counts, versions) are updated together; the specs and the README state them, so check them at each release.
5. Say what was **not** verified. Every plan and log entry ends with it.
6. Commit documents with explicit paths, like code (ADR-0023).
