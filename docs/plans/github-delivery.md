# GitHub delivery: weekly Kanban and independent acceptance

Approved by Vinh and configured by Codex (OpenAI) on 2026-11-24, Asia/Bangkok. This is the operating guide for the existing work, not a new product roadmap or permission to merge/release duo.

## Where work lives

- [Streakboom Delivery](https://github.com/users/vinhcodon/projects/1): project linked to the repository; private by default, with repository issues remaining public. No access grants or visibility expansion were made.
- [Epic #7](https://github.com/vinhcodon/streakboom/issues/7): make the existing duo work verifiable before expansion.
- [Milestone 1](https://github.com/vinhcodon/streakboom/milestone/1): Duo evidence gate, explicitly not a release; no due date.
- [Issue #1](https://github.com/vinhcodon/streakboom/issues/1): coordination and review history, not a product epic.
- Specs and ADRs still own behavior and decisions; `roadmap.md` owns strategic order and formal-alpha gates. `verification-debt.md` records runtime gaps. Existing handoffs are historical records; new review exchanges go on issues.

## Hierarchy and initial backlog

| Parent under epic #7 | Scoped children | First disposition |
|---|---|---|
| #2 Privacy | #8 factual consent and reproducible synthetic evidence | Ready, W01, S |
| #3 Performance | #9 method/report corrections; #10 budget disposition | #9 Ready/W01/M; #10 Blocked/W02/S |
| #4 Conversation/input | #11 pending/queued Quiet speech; #12 current mentions and real IME | #11 Ready/W01/M; #12 Blocked/W02/S |
| #5 Focus | #13 reproducible probe and intermittent interactive result | Ready, W01, S |

Native sub-issue relationships implement the hierarchy. Native dependencies: #10 is blocked by #9; #12 is blocked by #11 and also needs Vinh's live IME session. #6 character assessment remains a linked follow-up, not a new gate on every engineering ticket. Original parent criteria and evidence are preserved; the children bound the remaining execution work, rather than pretending prior work was undone.

ADR-0152 is the current mention/draft contract: double-click replaces a leading mention and preserves following draft text; `@everyone`/`@all`/`@both` broadcast; duo cap is 120, normal build unchanged. Do not revive the older unresolved draft question or recipient controls. Historical benchmark results retain their measured revision/cap.

## Status and metadata

Issue labels are canonical during rollout. Project Status is a manual mirror, updated in the same session; if they disagree, reconcile against the latest signed issue evidence. There is **no automatic label-to-field synchronizer** and no automatic agent dispatcher. If an agent cannot edit Projects, it updates the labels and explicitly requests the mirror update on #1.

| Issue state/label | Project Status | Meaning |
|---|---|---|
| `status:triage` | Backlog | Unstarted or scope still being clarified |
| `status:ready` | Ready | Scope, acceptance, ownership and dependencies are clear |
| `status:in-progress` | In progress | A named session is executing; parent containers may summarize work |
| `status:ready-for-verification` | Verification | Pinned delivery and evidence await independent acceptance |
| `status:blocked` | Blocked | Name dependency, responsible person and next action |
| Closed/completed | Done | Codex accepted evidence, or an explicit approved disposition is recorded |

Use one active status label. Preserve unrelated labels. Labels carry `kind:*`, `area:*`, `priority:*`, `size:S/M/L`, `owner:claude` or `owner:vinh`, `reviewer:codex`, and the forecast `iteration:W01/W02`. Project Iteration is populated for planned children. The template's Priority/Size/Estimate fields are available but are not the canonical metadata; do not invent story points or assume those template fields are synchronized. No fictional GitHub agent assignees are created.

## Views and limits

- Backlog: hierarchy, existing issues and labels, including coordination and assessment.
- Board: executable leaves, filtered with `-label:"planning:container" -label:"product-assessment"`.
- Current iteration: `iteration:@current`; initially four W01 tasks.
- Roadmap: planning view, not a published release schedule.
- Blocked / Needs Vinh: `label:"status:blocked"`; initially #10 and #12, with concrete dependencies.
- Verification queue: `label:"status:ready-for-verification"`; an empty queue does not mean all work is done.

Board WIP limits are two In progress items and two Verification items. These are visual warnings, not locks. Additionally, each named Claude session takes at most one implementation task; record the session owner when claiming it. Container parents and #1 are excluded from task WIP. Existing parent in-progress labels are preserved and are not claims that six implementation tasks are running.

## Cadence

| Window, inclusive local dates | Goal/forecast |
|---|---|
| W01, 2026-11-24 to 2026-11-30 | Quiet regression and bounded privacy/focus/performance evidence (#11, #8, #13, #9) |
| W02, 2026-12-01 to 2026-12-07 | Conditional integration/IME and resource-budget disposition (#12, #10) |
| W03, 2026-12-08 to 2026-12-14 | Tentative character/scene observations after reliability; no new feature commitment |

Start each week by selecting an outcome and checking dependencies/capacity. End with a pinned-build evidence/demo review and a short retrospective: what finished, what was returned, what blocked, and one process improvement. Dates are forecasts, not promises of Vinh's availability, agent execution, formal alpha, merge or release. No recurring reminders/automations were scheduled.

## Ready, done and scope control

A Ready item states the problem/evidence, scope and non-goals, bounded acceptance, owner/reviewer, size, revision and dependencies. Split L items before execution. A delivery states exact SHA/PR, checks and results, platform limitations and remaining debt. Codex verifies before closing; use `Refs #N` while acceptance is pending.

Done is distinct from merged and released. A verified experimental branch is still experimental. Record merged SHA and release/tag only when those events actually occur; release milestones are created when Vinh orders a specific release, not fabricated now. A new issue or a project field is not authorization to change product policy, use keys, redraw art, merge or release.

Keep acceptance fixed during execution. A failed original criterion stays on its owning task; unrelated findings become linked follow-ups. If a result warrants a narrower delivery, explicitly agree the disposition rather than silently removing criteria. Human checks and decisions have separate children so they do not hide remaining agent-executable work.

## Automation configured

The Team planning template imports existing issues and auto-adds new repository issues/sub-issues. New items default to Backlog. Auto-close issue, PR-linked status changes and PR-merged-to-Done were disabled so they do not bypass acceptance or silently override canonical labels. Item-closed-to-Done remains a presentation mirror; authorized closure is still a process responsibility, not an identity-enforced security control. No Actions/token-based project synchronization was installed.

## Measures and rollout limits

Track lead/cycle time, age of blockers, time waiting for verification, returns and escaped defects, anchored to real transitions. No historical metrics or velocity are claimed for this initial board. Commit count, generated lines and issue volume are not quality measures. The legacy backlog is not bulk-imported or reclassified as unfinished; promote its next approved slices at weekly planning.

Verification of this setup covers GitHub relationships, metadata, views, iterations and workflow settings plus document audit. It does not retest the app or resolve #2–#6. CLI authentication is unavailable; issue connectors and the existing authenticated browser performed the setup. Project visibility/access was left unchanged.
