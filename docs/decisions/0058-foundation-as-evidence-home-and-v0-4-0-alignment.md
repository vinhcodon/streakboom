# ADR-0058: `docs/foundation/` is the home of evidence; the charter is aligned to it; 0.4.0 is the alignment release

- **Status:** accepted; carried out: the review was done, the scope was set in ADR-0059 and released as 0.4.0 on 2026-11-12
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude

## Context
The repo has one home per kind of statement (`../README.md`). It has no home for scientific evidence. A research foundation (EN and VI) now exists. The charter (ADR-0047) and ADR-0013, 0021, 0022 already hold much of what the foundation concludes, but some points differ (for example the charter lets neglect make Peak "a little lonely"; the foundation's rule is that absence has no emotional cost for Peak).

## Decision
1. `docs/foundation/` becomes the home for evidence: what research says, with what confidence, and what is still unknown. It is added to the documentation map.
2. The charter stays the home of principles. After a full review, differences are settled by new ADRs that amend the charter; the foundation's eleven hard rules are the checklist for that review. Nothing in the charter changes until then.
3. Plans, hypotheses, the backlog and the roadmap are reviewed against the charter and the foundation. What contradicts them is changed, deferred or dropped, with a record.
4. The next major release after 0.3.2 is 0.4.0, proposed as the "alignment" release: remove what breaks the rules, add the 18+ age gate, audit public claims, tighten telemetry, and prepare the guardrail measures. New features (voice, selling) enter only after their gates.

## Alternatives considered
A second rule set inside `foundation/` (rejected: two homes for principles). Treating the whole research as an unchangeable truth (rejected: most sources were read as abstracts; only principles and ADRs are protected, evidence stays editable).

## Consequences and when to revisit
Cost: a review of about 130 documents and the code strings they describe. Revisit the 0.4.0 scope when the review report (`../handoff/`) is approved.

## Sources
`../foundation/README.md`; `../handoff/2026-11-11-foundation-handoff.md`; `../handoff/requirements-draft-v0.4.md` (an earlier plan this must be reconciled with).
