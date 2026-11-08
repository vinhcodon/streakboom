# Handoff

Notes handed **from one session or conversation to another** (a product discussion in Claude chat, a Claude Code session, a person). Each file is a dated snapshot of what its author knew then. It is an input, not a source of truth.

**Rules**
- Do not edit a handoff after it has been received: if something in it is wrong or old, say so in the index below and put the correction in the spec, a decision record or a hypothesis. The original stays as written.
- A handoff proposes; the folders `../decisions/` (settled) and `../hypotheses/` (open) record what was done with it.
- Every handoff gets a row here with its status.
- When two sessions work in the same checkout, say so in the handoff and agree who commits which files (see ADR-0023: stage explicit paths, never `git add -A`).

## Index

| File | From | Date | Status | Outcome |
|---|---|---|---|---|
| [`north-star-bond-days.md`](north-star-bond-days.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-08 | **received; spec, plan and implementation done (unreleased)** | Specified in [`../../spec/05-north-star-metrics.md`](../../spec/05-north-star-metrics.md); planned in [`../plans/bond-days.md`](../plans/bond-days.md); settled points are in ADR-0021 and ADR-0022; open claims are in hypotheses H5 and H8. |

## Where the handoff was out of date when received

Checked against the working tree on 2026-11-08 (details in spec/05 section 0):

1. It said the multi-provider work was uncommitted and local; it had already been committed, pushed and released (0.1.13, 0.1.14).
2. It said the exploratory Bond Days edit had been reverted and no code was changed; a version of it had reached `main` and the 0.1.14 installer by accident (a blanket `git add -A`). It was reverted again in commit `18e13de`; the installed 0.1.14 builds still contain it until the next release.
3. It said a dismissed bubble could not be observed; the card panels (name, start-with-Windows, consent, update, tour, brain request) do have explicit answers and idle timers. Only the plain spoken lines have no dismissal.
4. It treated `active_d3` and `active_d7` as retention; they mean "the streak of consecutive launch days reached 3 or 7".
5. It listed the interaction handlers without the pet-initiated prompts added since (`memSay`, `shareNextMark`, `askInput`, `startTour`, the start-with-Windows card).
