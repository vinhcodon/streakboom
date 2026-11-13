# ADR-0086: Answers on the order of voice, the alpha build, the return from "Lượn đi", the shared budget and customization

- **Status:** accepted (answered by the author on 2026-11-13 as multiple choice); **point 2 (the alpha runs on 0.4.2) is replaced by ADR-0088** (the alpha runs on whatever version is current when the author calls it); completes the open questions of [`../../spec/14-adaptive-peak.md`](../../spec/14-adaptive-peak.md) and [`../../spec/15-customization.md`](../../spec/15-customization.md). **No code is approved by it.**
- **Date:** 2026-11-13
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The cross-check of [`../plans/requirements-v0.5.md`](../plans/requirements-v0.5.md) (section 6) left questions that only the author can answer.

## Decision
1. **Voice (the held hotkey and sending audio to the AI provider) comes after the alpha and the lawyer.** It is a new sense: its own ADR, an open switch and the texts of the README, `privacy.md` and the site first. This agrees with roadmap v2 and ADR-0059.
2. **The alpha runs on 0.4.2.** "Lượn đi" is built (step S2) for the author alone; the phrase survey (S0) and the offline table (S1) run beside the alpha. A build with the skill is for a second alpha round.
3. **One shared weekly limit** for what Peak says on its own initiative to propose something (adaptive suggestions and the colour question), recorded in one place (spec 14 section 8), so that Peak does not ask too often. It sits inside the existing unprompted slot and does not change the 10 to 15 minute rhythm of ordinary lines.
4. **"Lượn đi" returns after 20 minutes** at the edge it left by, with no reproach and no counting aloud of the time; **the person can call Peak back at once** with the tray (Show). The return waits while the safety gate says wait.
5. **Customization:**
   - the person **may ask for a look in words** ("đổi màu hồng đi"), as one entry of the closed skill list, in addition to Peak's proposal;
   - Peak **does not remark** on its own new look;
   - Peak **only asks** about the dryness of its voice, never changes it by itself (agrees with ADR-0047);
   - the default look must be **pixel-identical** to today's after the move to a palette.
6. **The rule for ADR and spec numbers is unchanged:** list the folder **and `origin/main`** before taking a number (it has gone wrong three times; the author kept the rule).

## Consequences
- Spec 14 section 13 (Q1) and spec 15 section 7 (N11 to N14) are answered; the requirements v0.5 cross-check items 1 to 3 are settled.
- The skill list of spec 14 gains "change my look" as a later entry; it is not part of the first slice.
- The 20 minutes is a starting value to be read in the author's own use (step S2) and may be changed by a later record.
