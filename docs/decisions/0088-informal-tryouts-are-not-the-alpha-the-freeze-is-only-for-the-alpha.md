# ADR-0088: Informal tryouts are not the alpha; the freeze of behaviour belongs to the alpha only

- **Status:** accepted (answered by the author on 2026-11-13 as multiple choice); **refines ADR-0087 points 2 and 4**. The channel by which tryout builds reach people (stable and preview builds) is **not decided here**: it is under discussion and will get its own record.
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
ADR-0087 moved the closed alpha to the end and said the freeze of new behaviour starts when the alpha is called. It did not separate two things: the **formal alpha** (a measured test of 5 to 8 adults over 3 to 4 weeks, which needs everyone to see the same behaviour) and **informal tryouts** (a few people the author hands a build to, without measurement). The author wants to keep building features and to let people try them, and only the formal alpha is to wait.

## Decision
1. **The freeze of behaviour is part of the formal alpha only** (the 3 to 4 weeks, when the author calls them). It is not a rule of the roadmap in general, and it does not apply to informal tryouts.
2. **Informal tryouts are allowed at any time.** The only rule kept for them is: **adults only (18+)**, as everywhere else in the product. The other light rules offered (a short message, feedback written down as anecdote, Copy stats optional) were **not** chosen; nothing here forbids them either.
3. **The phrase survey (adaptive step S0) is not sent to informal testers**; it waits for the formal alpha (ADR-0087 point 2 stands for it).
4. Safety and trust rules of the charter and of the foundation (no guilt, no health claims, privacy, the stop rule if a person reports pressure) apply to anyone who uses Peak, formal or not. The gates for a new sense (voice) and for learned behaviour are unchanged.

## Consequences
- The roadmap and the plans say the freeze starts with the formal alpha and that informal tryouts are separate.
- What informal testers say is not recorded in the hypothesis register as evidence unless the author decides so; H18 and H19 keep their thresholds, set before any data, for the formal alpha.
- The way a tryout build reaches a person (the public stable line against a preview line) is the next decision.
