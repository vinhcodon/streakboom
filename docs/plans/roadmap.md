# Roadmap (version 2): from 0.4.1 to a closed alpha, and the gates to going public

> **Reordered on 2026-11-13 (ADR-0087).** The author does not intend to test with people now: **the closed alpha (R4) and the SignPath application (AP-1, SP-1) are the last items of the plan, with no date**; he says when each starts. Everything that needs other people moves with them. Until then the work is R2, R3 on the author's own machines, and the steps of the adaptive and customization plans that need no one else, each approved before code. The freeze of R3 and R4 belongs to the **formal alpha only** and starts when it is called (ADR-0088); informal tryouts with a few adults are allowed at any time. Where the text below says "now" or "next" about the alpha or the application, read this note first.

**Status:** written 2026-11-12 after the review of the backlog (163 stories, about 93 done), with the author's answers of the same day (ADR-0071). It supersedes [`roadmap-v1.md`](roadmap-v1.md) (2026-11-08, "from 0.2.0 to the first outside users"), whose Phases 0 to 2 are done and whose Phase 5 is carried forward here. The stories are in [`backlog.md`](backlog.md); what is built but unchecked is in [`verification-debt.md`](verification-debt.md); the strategy and the evidence are in [`../PROJECT.md`](../PROJECT.md) and [`../foundation/`](../foundation/README.md). Durations are **estimates**, not promises: three of the steps depend on other people (a certificate, the testers, a lawyer).

## Where we are

The product is at **0.4.2** (the first release built by CI), public on GitHub, with a website in three languages. Behaviour, safety rules and documents are ahead of the evidence: the app is built for adults, makes no health claim and has no character that needs the person (0.4.0), but **nobody outside the author has used it**, nothing has run on a second computer, Windows 11 or more than one monitor, three of the four brains have never met a real key, and the north star has no baseline. The bottleneck is not features; it is **finding out whether anyone wants this and whether it does no harm**. The backlog shows it: the measurement epic E6 is 1 of 7 done.

## The aim of this stretch

Run a **closed alpha with 5 to 8 adults the author knows, Vietnamese speakers**, observed (a call after day 3 and day 7), on a signed installer, and get a first baseline of Bond Days and of the guardrails, to test hypotheses H1, H2b, H4 and H5. **Descriptive only:** the foundation says about 100 people per arm are needed to infer anything, so n of 5 to 8 tells us where people stop and what they feel, not a rate.

## Phases

### R0. Close what is open (days, now): mostly done on 2026-11-13
The author: click through the in-app update to 0.4.1 (V-111), try the tray menu in two languages, the language picker and a second start (V-108 to V-110). Claude: commit the backlog fix, run the CI for the first time through a throwaway pull request when the author agrees (V-112), a strict Content-Security-Policy (V-113, CS-1). **Gate:** V-108 to V-111 are checked or have a named reason. *Done 2026-11-13: V-108 to V-110 seen by the author; V-111 (the update from 0.4.0) could not be tried, no 0.4.0 copy is left, and the in-app update 0.4.1 to 0.4.2 worked (V-120). The CI ran on GitHub on 2026-11-13 (V-112). The strict CSP (CS-1) is still open.*

### R1. Signing through SignPath Foundation, with releases built in CI (the CI part is done; the application is the last item, ADR-0087)
Decided 2026-11-12 (ADR-0072, which amends ADR-0071 point 3): **free code signing from SignPath Foundation only**; paid certificates are out. It needs automated builds of the public repository, so the work is: **CP-1** the code signing policy, **CP-3** the dependency licenses, **CI-1** a release workflow in CI, **CI-2** a local finishing script (the updater key stays on the author's computer), **CI-3** two real releases built by CI, **CP-2** the website's policy section, then **AP-1** the application by the author, then **SP-1** the SignPath setup. *Status on 2026-11-13: CP-1 to CP-4, CI-1 and CI-2 are done, CP-2 is live on the site, CI-3 is one of two (0.4.2 was built by CI and finished with the script). **AP-1 and SP-1 are deferred to the end by the author (ADR-0087).*** The full assessment, the flow and the reputation risk are in [`signpath-ci-plan.md`](signpath-ci-plan.md). **The alpha does not wait for the signature:** it runs on the unsigned installer once R3 is done (no certificate removes the SmartScreen prompt at once anyway), and the install guide keeps its "More info, Run anyway" step. If SignPath declines, plan B is free: stay unsigned and reapply later, or (a separate, larger project) publish through the Microsoft Store.

### R2. Make it checkable (Claude, 1 to 2 weeks, in parallel with R1)
- **ME-3** a script that computes BD7, D3, D7, the engagement rate and the chat share from a folder of "Copy stats" exports; **ME-1** the author's own baseline (consent must be on); **ME-2** check what was never verified (`chat` with a real chat, `quiet`, the midnight rollover, the per-day counters).
- **GR-1** the guardrails beyond chat share, in the opt-in local stats and from what is already counted: the share of use at night (23:00 to 05:00) and the long tail of active minutes (the foundation's list; regret and compulsion scales need a survey and are not in this stretch).
- **ME-4** the alpha kit: who to ask and the message in Vietnamese, an install guide (with the signing state), the observation protocol (install, the first ten minutes, a call after day 3 and day 7; write down where people stop), the questions, and **AL-1** a plain consent text for taking part (what is collected, that it is by hand through Copy stats, that they can stop and have it deleted; the foundation asks for consent of its own and, where possible, a reviewer from outside: **AL-2** says what is done about that for a group of friends and what a lawyer must still say).
- **PE-1** export all Vietnamese lines for a native reader (the author, and one more person if possible).
**Gate:** the script runs on the author's baseline; the kit is written and read by the author.

### R3. Ready to be watched (the author and Claude, 2 to 3 weeks)
What the testers would meet, and nothing more: **VE-2** 125% and 150% display scale and a second monitor; **VE-3** a second, lower-end computer; **VE-8** an 8-hour soak after the CPU fix; **PF-3** a stronger silence test (fullscreen, presentation, screen sharing); **PR-8** start with Windows across a reboot and an update; **V-104** the chat rules with a real key on at least two brains; **PE-4** the vague "too big for a cat" refusal. Small fixes found on the way go into 0.4.x patch releases. **No new behaviour** (it would reset what the testers see). **Gate:** the checks above are done or recorded as known problems (the installer is unsigned for the alpha, ADR-0072).

### R4. The closed alpha (3 to 4 weeks of use): **the last item, not scheduled (ADR-0087)**
5 to 8 adults, Vietnamese speakers, people the author can call. Install, the first ten minutes watched, a call after day 3 and day 7, "Copy stats" collected from those who agree. Record outcomes in the hypotheses register (status and evidence, descriptive). **The foundation's stop rule applies:** if any guardrail gets worse for a person (they report pressure or guilt, night use rises, chat share climbs sharply), Peak is changed or the person is released from the test, even if Bond Days rises. **Gate to R5:** everyone has had at least 7 days, or has stopped and said why.

### R5. Decide (1 week after the alpha)
Write what was learned (the engineering log and the hypotheses), set the **Bond Days thresholds** from the baseline (they have been blank on purpose), and choose the next stretch as multiple choice with ADRs: the proxy question (D3, by the key funnel: who tried to chat and stopped at the key), what to build (taught places TT-8, more lines, growth CO-3 and CO-5, an editable voice), selling (only demand signals, after the foundation's gate), and whether to widen the alpha.

### R6. The gates before going public (not scheduled; in this order)
1. **A lawyer** (decided 2026-11-12: after the alpha, before anything public): the age gate, the data and claims questions in [`../foundation/legal-questions.md`](../foundation/legal-questions.md).
2. A wider, still observed group; the Zalo sticker test and the website's reach (E16 and the website session) are their own tracks.
3. **Product Hunt only after** the observed group and the lawyer (ADR-0059 point 4), never as the first step.

## Tracks owned by others (they continue in parallel)
- **Stickers** (the sticker session, E16): the three packs of 20, the Zalo test. Their results feed R5 (does the sticker audience bond?), through sources outside the app, with no tracking added to the app.
- **The website** (the website session): follows each release; no change needed for the alpha except the install guide's link.

## What is deliberately not in this roadmap
Voice, a keyless trial through a proxy, selling anything, a stats backend (a place to send stats), the screen picture sense (TT-10), taught places (TT-8), content surfaces (TT-11), a macOS port, crash reporting. Each is either waiting for the alpha's answer or for a legal gate. Adding behaviour during the formal alpha is out **from the day it is called** (ADR-0087, ADR-0088); until then new behaviour may be built, one approved step at a time (the adaptive and customization plans), and tried informally by a few adults.

## Dependencies at a glance
```
Now:  R0 (mostly done) -> R2 (make it checkable) -> R3 (own machines) -> adaptive / customization steps that need no one else
Last: R4 (alpha, when the author calls it) -> AP-1, SP-1 (the SignPath application) -> R5 (decide) -> R6 (public gates)
```

## Risks
- **SignPath declines, or answers late** (a young repository, weak reputation): the alpha does not depend on it.
- **Too few testers, or testers who are polite:** friends tell you it is nice. The observation protocol asks where they stopped and what they did when nobody was looking (the stats), not whether they liked it.
- **The numbers mean nothing at n of 8.** They are descriptive; the risks and the stop rule are the real output.
- **Research without ethics:** a small test among acquaintances is not a study, and must not be written up as evidence; a published claim needs the foundation's design (consent, an outside reviewer, a larger group).
- **The Vietnamese lines have a single reader** (the author) and the Japanese none: the alpha is Vietnamese on purpose.
- **A second machine may show problems that need a new behaviour or fix:** they go to a patch release and are explained to the testers.

## Decisions (answered by the author, 2026-11-12; ADR-0071)
- **Direction:** the alpha first; features only as small fixes.
- **Alpha:** 5 to 8 acquaintances who speak Vietnamese.
- **Signing:** first decided as "a certificate before the alpha" (ADR-0071), **amended the same day** (ADR-0072): SignPath Foundation only, releases built in CI, applied for after two CI releases, and **the alpha runs unsigned**.
- **Lawyer:** after the alpha, before anything public.
- **2026-11-13 (ADR-0087):** the alpha and the SignPath application are the last items, with no date; the alpha runs on whatever version is current when the author calls it; the freeze starts then. **2026-11-13 (ADR-0088):** the freeze belongs to the formal alpha only; informal tryouts (adults only) are allowed at any time; the survey S0 still waits for the alpha.
