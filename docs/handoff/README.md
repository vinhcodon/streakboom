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
| [`2026-11-11-foundation-handoff.md`](2026-11-11-foundation-handoff.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-11 | **received on 2026-11-11; phases 0 to 4 done and released in 0.4.0** (the review `../plans/foundation-review.md`, ADR-0059, spec 12, the code) | Brought `../foundation/` (the evidence), ADR-0056 (18+), ADR-0057 (the mission, no health claims) and ADR-0058 (proposed). Asks for a review of everything against the foundation, a regrouping of documents, then the spec and plan of 0.4.0. Nothing in the charter or the app has changed yet |
| [`claude-code-prompt.md`](claude-code-prompt.md) | the same discussion | 2026-11-11 | **received** (the prompt the author pasted to start the work above) | The order of the phases and the gates; no content of its own |
| [`requirements-draft-v0.4.md`](requirements-draft-v0.4.md) | product discussion in Claude chat (Vinh and Claude), with a strategy review written by Gemini | 2026-11-11 | **received on 2026-11-11; reconciled with the foundation in the review (`../plans/foundation-review.md` section 5), not a spec** (older than the foundation handoff; some of it is out of date and the rest waits; nothing of it is a spec or an ADR yet) | Decisions D1 to D7, work streams A to G (measurement, onboarding, character, distribution, voice, revenue, privacy), the gate for a keyless trial, open questions. Known to disagree with the foundation in places (Product Hunt first, the audience, voice) |
| [`north-star-bond-days.md`](north-star-bond-days.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-08 | **received; spec, plan, implementation and release (0.1.15) done** | Specified in [`../../spec/05-north-star-metrics.md`](../../spec/05-north-star-metrics.md); planned in [`../plans/bond-days.md`](../plans/bond-days.md); settled points are in ADR-0021 and ADR-0022; open claims are in hypotheses H5 and H8. |

| [`character-and-movement.md`](character-and-movement.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-08 | **received; spec 06 approved on 2026-11-08 (decisions D1 to D8 answered); code not started** | Spec [`../../spec/06-character-and-movement.md`](../../spec/06-character-and-movement.md); plan [`../plans/character-and-movement.md`](../plans/character-and-movement.md); [ADR-0029](../decisions/0029-focus-safety-recent-input-and-pointer-fade.md); stories in the backlog (E8). Out of date when received: see spec/06 section 0.1. |

| [`sticker-test.md`](sticker-test.md) | product discussion in Claude chat (Vinh and Claude) | 2026-11-10 | **received; spec 06 section 7, the plan, ADR-0049 and ADR-0050 written** (the sticker session's file; its row was added by the app session at the 0.3.2 release) | The sticker test on Zalo: [`../plans/sticker-test.md`](../plans/sticker-test.md), epic E16 |

### Notes sent out

| File | To | Date | Status | What it asks |
|---|---|---|---|---|
| [`website-restructure-request.md`](website-restructure-request.md) | the session working on `site/` | 2026-11-10 | **sent as a prompt; asks for proposals, not changes** (not tied to a release) | The author finds the site long-winded: measure it, propose two or three structures with word budgets, bring the voice to Peak's character, and assess putting the charter on the site (the app session recommends a distilled five-promise form in Peak's voice, after CH-2 and CH-3 ship) |
| [`website-code-signing.md`](website-code-signing.md) | the session working on `site/` | 2026-11-12 | **done by the website session (2026-11-12): the section is on the home page in three languages with a pointer under the Download button, ADR-0076, W-48** (the build refuses the attribution line and words like "verified" or "safe") | A "Code signing policy" section on the home page and the download area in three languages, honest about the status (nothing signed yet), with the team and the privacy link; the SignPath attribution line only after approval (ADR-0072) |
| [`website-language-suggestion.md`](website-language-suggestion.md) | the session working on `site/` | 2026-11-12 | **sent as a prompt; asks for a proposal, then a change** (not tied to a release) | A dismissible language suggestion from the browser's languages, a visible switcher, no redirect and no IP (ADR-0066) |
| [`website-stickers.md`](website-stickers.md) | the session working on `site/` | 2026-11-11 | **done by the website session (2026-11-11)**: the Stickers pages are live (ADR-0053) | The sticker page: copy and share, no download, CC BY 4.0, the manifest (ADR-0051) |
| [`to-website-0.2.5.md`](to-website-0.2.5.md) | the session working on `site/` (GitHub Pages) | 2026-11-09 | **sent** (a heads-up; the website session has not answered) | What changed up to 0.2.5: the behaviour to describe, the new privacy bullet, the rig files, what not to claim |
| [`website-release-prompt.md`](website-release-prompt.md) | the session working on `site/` | 2026-11-09 | **a template, refilled at every release** (ADR-0033); refilled for 0.3.2 on 2026-11-11 (the retired settings the site still names, the fifth promise, the checks of the site build, the three changes to the senses; **to be pasted into the website session by the author after the release**); earlier refilled for 0.3.1 on 2026-11-10 (the ground sense in the privacy wording, the new behaviour, the numbers, the next SEO and GEO proposals); before that for 0.3.0 on 2026-11-09 (Japanese in the app, Groq, the notice beat, the primary-button wording, the next SEO and GEO proposals) | Brings the site in line with the README and `CHANGELOG.md`, fixes names, asks for an SEO and GEO structure proposal |
| [`to-website-0.2.0.md`](to-website-0.2.0.md) | the session working on `site/` (GitHub Pages) | 2026-11-08 | **done by the website session (2026-11-08)**; its follow-up note was answered the same day | Update the site for the first official release: status wording, the release list, the download link, the feature and privacy text, the dead `v0.1.x` links. Outcome: the site (streakboom.com) reads `CHANGELOG.md` and `updates/latest.json`; the format contract is in ADR-0028; the rig rule is in the README (Website) and tested in `rig.test.ts`. From now on: when behavior or status described on the site changes, update the README and tell the website session (README, Release and auto-update, step 1). |

## Where the handoff was out of date when received

Checked against the working tree on 2026-11-08 (details in spec/05 section 0):

1. It said the multi-provider work was uncommitted and local; it had already been committed, pushed and released (0.1.13, 0.1.14).
2. It said the exploratory Bond Days edit had been reverted and no code was changed; a version of it had reached `main` and the 0.1.14 installer by accident (a blanket `git add -A`). It was reverted again in commit `18e13de`; installed 0.1.14 builds contained it until 0.1.15 replaced it.
3. It said a dismissed bubble could not be observed; the card panels (name, start-with-Windows, consent, update, tour, brain request) do have explicit answers and idle timers. Only the plain spoken lines have no dismissal.
4. It treated `active_d3` and `active_d7` as retention; they mean "the streak of consecutive launch days reached 3 or 7".
5. It listed the interaction handlers without the pet-initiated prompts added since (`memSay`, `shareNextMark`, `askInput`, `startTour`, the start-with-Windows card).
