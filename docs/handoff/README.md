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
| [`north-star-bond-days.md`](north-star-bond-days.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-08 | **received; spec, plan, implementation and release (0.1.15) done** | Specified in [`../../spec/05-north-star-metrics.md`](../../spec/05-north-star-metrics.md); planned in [`../plans/bond-days.md`](../plans/bond-days.md); settled points are in ADR-0021 and ADR-0022; open claims are in hypotheses H5 and H8. |

| [`character-and-movement.md`](character-and-movement.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-08 | **received; spec 06 approved on 2026-11-08 (decisions D1 to D8 answered); code not started** | Spec [`../../spec/06-character-and-movement.md`](../../spec/06-character-and-movement.md); plan [`../plans/character-and-movement.md`](../plans/character-and-movement.md); [ADR-0029](../decisions/0029-focus-safety-recent-input-and-pointer-fade.md); stories in the backlog (E8). Out of date when received: see spec/06 section 0.1. |

### Notes sent out

| File | To | Date | Status | What it asks |
|---|---|---|---|---|
| [`website-restructure-request.md`](website-restructure-request.md) | the session working on `site/` | 2026-11-10 | **sent as a prompt; asks for proposals, not changes** (not tied to a release) | The author finds the site long-winded: measure it, propose two or three structures with word budgets, bring the voice to Peak's character, and assess putting the charter on the site (the app session recommends a distilled five-promise form in Peak's voice, after CH-2 and CH-3 ship) |
| [`to-website-0.2.5.md`](to-website-0.2.5.md) | the session working on `site/` (GitHub Pages) | 2026-11-09 | **sent** (a heads-up; the website session has not answered) | What changed up to 0.2.5: the behaviour to describe, the new privacy bullet, the rig files, what not to claim |
| [`website-release-prompt.md`](website-release-prompt.md) | the session working on `site/` | 2026-11-09 | **a template, refilled at every release** (ADR-0033); refilled for 0.3.1 on 2026-11-10 (the ground sense in the privacy wording, the new behaviour, the numbers, the next SEO and GEO proposals); before that for 0.3.0 on 2026-11-09 (Japanese in the app, Groq, the notice beat, the primary-button wording, the next SEO and GEO proposals) | Brings the site in line with the README and `CHANGELOG.md`, fixes names, asks for an SEO and GEO structure proposal |
| [`to-website-0.2.0.md`](to-website-0.2.0.md) | the session working on `site/` (GitHub Pages) | 2026-11-08 | **done by the website session (2026-11-08)**; its follow-up note was answered the same day | Update the site for the first official release: status wording, the release list, the download link, the feature and privacy text, the dead `v0.1.x` links. Outcome: the site (streakboom.com) reads `CHANGELOG.md` and `updates/latest.json`; the format contract is in ADR-0028; the rig rule is in the README (Website) and tested in `rig.test.ts`. From now on: when behavior or status described on the site changes, update the README and tell the website session (README, Release and auto-update, step 1). |

## Where the handoff was out of date when received

Checked against the working tree on 2026-11-08 (details in spec/05 section 0):

1. It said the multi-provider work was uncommitted and local; it had already been committed, pushed and released (0.1.13, 0.1.14).
2. It said the exploratory Bond Days edit had been reverted and no code was changed; a version of it had reached `main` and the 0.1.14 installer by accident (a blanket `git add -A`). It was reverted again in commit `18e13de`; installed 0.1.14 builds contained it until 0.1.15 replaced it.
3. It said a dismissed bubble could not be observed; the card panels (name, start-with-Windows, consent, update, tour, brain request) do have explicit answers and idle timers. Only the plain spoken lines have no dismissal.
4. It treated `active_d3` and `active_d7` as retention; they mean "the streak of consecutive launch days reached 3 or 7".
5. It listed the interaction handlers without the pet-initiated prompts added since (`memSay`, `shareNextMark`, `askInput`, `startTour`, the start-with-Windows card).
