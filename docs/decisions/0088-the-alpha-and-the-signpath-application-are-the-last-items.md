# ADR-0088: The closed alpha and the SignPath application are the last items of the plan

- **Status:** accepted (the author's instruction of 2026-11-13). **Amends** ADR-0071 (the alpha comes first, and the features freeze while it runs), ADR-0072 (apply after two CI releases) and point 2 of ADR-0086 (the alpha runs on 0.4.2). It does not touch the lawyer-after-the-alpha rule or the Product Hunt rule. **Points 2 and 4 are refined the same day by ADR-0089** (the freeze belongs to the formal alpha only; informal tryouts are allowed).
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Roadmap v2 (ADR-0071) put a closed alpha with 5 to 8 acquaintances next, with features frozen while it runs, and ADR-0072 put the SignPath application after two releases built by CI. The author said on 2026-11-13 that he does **not intend to test with people now**, and that the **SignPath application** (the form for free code signing) should come later too. Both are to be the last items in the plan.

## Decision
1. **The closed alpha (roadmap R4) and the SignPath application (stories AP-1 and then SP-1) are the last items of the plan.** They have no date. The author says when each starts.
2. **Everything that needs other people moves with the alpha:** the phrase survey (adaptive step S0) and the verdict on H18 that depends on it (step S1's readings), the alpha reading of H19 (S3), the colour question (customization step C1), the alpha kit and the consent texts (ME-4, AL-1, AL-2) when they are sent. They are written and kept ready; **nothing is sent to anyone.**
3. **What can be done meanwhile, alone and step by step, each with the author's approval before any code:** the roadmap's R2 (make it checkable: the stats script, the guardrails, the author's own baseline) and R3 (the checks on the author's own machines), the adaptive steps that need no one else (the offline matcher and its tests on phrases the author supplies, "Lượn đi" for the author alone, S2), the customization palette proof (C2), and small fixes.
4. **The freeze of R3 and R4 ("no new behaviour while the testers use it") starts when the author calls the alpha**, not before. Until then new behaviour may be built, each step approved. Point 2 of ADR-0086 ("the alpha runs on 0.4.2") is replaced by: **the alpha runs on whatever version is current when the author calls it.**
5. **Releases built by CI continue** as with 0.4.2 (each one ordered by name). The second CI release (CI-3) is no longer a goal to be met on purpose; it happens with the next release worth publishing, and it counts when the application is made.
6. **Unchanged:** the lawyer comes after the alpha and before anything public; Product Hunt only after both; the website's "Code signing policy" section stays true as written ("preparing to apply", nothing signed).

## Consequences
- The roadmap, the backlog (AP-1, SP-1, CI-3, ME-4, AL-1, AL-2, AP-S0, AP-S3, CU-C1), the signing plan, the adaptive and customization plans, the requirements v0.5 and `PROJECT.md` say so.
- Until the alpha, the evidence for H1, H2b, H4, H5 and the north star baseline stays at the author's own use (n = 1); the hypotheses stay `untested` and say so.
- The installer stays unsigned for longer; the install guide keeps its "More info, Run anyway" step, and `CODE_SIGNING.md` and the site stay honest as they are.
