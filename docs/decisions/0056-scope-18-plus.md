# ADR-0056: Streakboom is for people aged 18 and over

- **Status:** accepted
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude

## Context
The research in `../foundation/` first assumed 13+. The Gemini API terms (effective 2026-03-23) require API users to be 18+ and bar use in apps directed to, or likely to be accessed by, people under 18. Voice chat through Gemini is being considered. The UK Children's Code and similar rules also reach services "likely to be accessed" by under-18s.

## Decision
Streakboom serves people 18 and over. This is option C in the foundation's A/B/C table. "Every age" now means every adult age, including older adults.

## Alternatives considered
A: chat and voice for 18+ only, the rest for 13+ (more to build, two experiences). B: switch to a model provider that allows minors (more obligations: California SB 243, JED guidance, Children's Code). Both rejected for now.

## Consequences and when to revisit
Voice and chat through Gemini become feasible if the age gate is effective. Teenagers are out of scope; serving them later needs a separate product or mode, another provider and a new legal review. Note: the app is bring-your-own-key (ADR-0001), so the party bound by the Gemini terms may be the key holder rather than Streakboom; the lawyer should say what that changes (`../foundation/legal-questions.md`). Open: what age gate is enough (self-declared or verified). Revisit after the lawyer answers.

## Sources
`../foundation/streakboom-foundation.vi.md` (executive summary 4, legal section, design principles); Google AI terms (https://ai.google.dev/terms), opened directly on 2026-11-11.
