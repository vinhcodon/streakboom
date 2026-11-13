# ADR-0071: Roadmap version 2: the closed alpha first, a signed installer before it, the lawyer after it

- **Status:** accepted (answered by the author on 2026-11-12); not yet carried out; **point 3 amended by ADR-0072** (SignPath only, the alpha runs unsigned); **the alpha itself moved to the end of the plan by ADR-0088** (2026-11-13)
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
A review of the backlog and the roadmap (2026-11-12) found the first roadmap (2026-11-08) out of date: Phases 0 to 2 were done, the product had gone to 0.4.1 with much that was never in it, and its Phase 5 (a closed alpha with 5 to 10 observed people) had never run. About 93 of 163 stories were done, but the measurement epic E6 was 1 of 7 and the list of things built and unchecked had 128 rows, most of them needing a second machine, a key, another person or a lawyer. The foundation (ADR-0058) puts any public launch behind observation and legal gates.

## Decision
1. **Direction: the alpha first.** Make the product checkable (a script for the north star and the guardrails, an alpha kit), get it ready to be watched (a second machine, scales and monitors, a soak, a silence test, real keys), run the alpha, then decide. New behaviour is limited to small fixes. (`docs/plans/roadmap.md`, version 2.)
2. **The alpha: 5 to 8 adults the author knows, Vietnamese speakers**, observed with a call after day 3 and day 7. The results are descriptive only (n is far under the foundation's 100 per arm), and the foundation's stop rule applies.
3. **A code-signing certificate before the alpha.** This **supersedes R3 of the first roadmap** ("not before the alpha; accept the SmartScreen warning"). If the certificate is not there at week 6 the author decides again, and this record gets an amendment.
4. **The lawyer after the alpha and before anything public:** the age gate, the data and the claims. The alpha is by invitation and not advertised. Product Hunt waits for the observed group and the lawyer (ADR-0059).

## Alternatives considered
Features first, alpha later (more behaviour with nobody to tell whether it is wanted); distribution first through the stickers and the website (an audience without a baseline or a second machine); an alpha of 10 including English speakers (harder to observe, and needs the lawyer sooner); unsigned for the alpha as in the first roadmap (quicker, and more testers stop at SmartScreen); the lawyer before the alpha (safer, but slower and paid before it is known that the product is worth keeping).

## Consequences and when to revisit
New stories in the backlog, epic E19 (the certificate, the guardrail counters, the consent text for the testers, a strict Content-Security-Policy). The certificate is the longest wait and starts at once. Revisit at week 6 (the certificate), after the alpha (R5), and if an incident with a tester changes the stop rule.

## Sources
`docs/plans/roadmap.md`; `docs/plans/backlog.md`; `docs/plans/verification-debt.md`; `docs/foundation/` (the measurement plan and the gates); the author's answers of 2026-11-12.

## Amendment 2026-11-12: what signing does not do
While writing the application guide (`docs/plans/code-signing.md`) it was found that **no certificate removes the SmartScreen warning at once**, not even EV since 2024 (Microsoft Learn, updated 2026-11-10): reputation builds over time for a consistent publisher. The alpha testers will therefore probably still see a prompt, and the install guide keeps its "More info, Run anyway" step. Signing stays worth doing (a named publisher, reputation that starts to build, before going public), so the decision stands, but **the alpha does not wait on it beyond week 6**, as decided above.
