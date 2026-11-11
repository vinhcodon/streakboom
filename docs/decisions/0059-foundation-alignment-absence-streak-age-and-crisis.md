# ADR-0059: Aligning Peak to the foundation: absence costs nothing, no streak, 18+ self-declared, an honest crisis rule

- **Status:** accepted as the direction (the author approved Q1 to Q8 at gate 1 of the review, 2026-11-11); points 1 and 2 and Q9 are **built** on the branch `foundation/alignment` (2026-11-11, with the charter's article 7); the rest is not built. Q9 was approved at gate 3
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
ADR-0058 asked for a review of everything against `../foundation/`. The review (`../plans/foundation-review.md`) found that the app breaks two of the foundation's rules in code (a cost of absence; a consecutive-day streak) and lacks three things (an age statement, a crisis rule in chat, a goodbye rule in chat). It also found places where the foundation asks for more than its evidence or the product can honestly give.

## Decision
1. **Absence costs nothing (Q1).** Being away never lowers mood or closeness, there is no "lonely" state, and no line counts the days away or says Peak missed the person. The welcome back is warm and need-free. This supersedes the sentence "neglect makes it a bit lonely" of ADR-0013.
2. **No streak (Q2).** The consecutive-day count, its lines at 3, 7 and 30 days, "Longest streak" in Settings and the closeness paid for the first launch of a day are removed. "Days together" (different days, never reset) and the marks on it stay. Bond Days is unchanged and stays unseen by the user.
3. **Rule 5 is met without a setting (Q3).** Peak sends no notifications at all; it speaks only in its bubble, only when the person is not working, never at night, and Quiet mode silences it. No schedule setting is added (charter, "few settings").
4. **Product Hunt comes after a small observed group (Q4),** not with the next release and not after a measured 90 days (the app cannot measure a cohort: it sends nothing).
5. **Crisis safety is three honest pieces (Q5):** a locked sentence in the persona core; a static "If you need help now" card in Settings, by language; tests that both exist. No scanning of what the person types.
6. **18+ is self-declared now (Q6):** one statement at first run and in the public texts. The level of the gate is revisited when a lawyer answers. No public text promises "safe" or "adults only".
7. **The name Streakboom stays (Q7).** It is a name, not a mechanic; the product shows no streak.
8. **Closeness tiers stay (Q8)** (they only rise once decay is gone); the "close" tier's instruction to the model is reworded away from an exclusive relationship.

**Charter text when 0.4.0 is built** (article 7): "It never dies and never lies about itself. Your absence costs nothing: it sleeps while you are away and is glad when you are back. It does not pretend to be a person or a tool." A preamble line carries the mission of ADR-0057. Manner 7 is unchanged (the app will now keep it).

## Q9 (approved at gate 3, 2026-11-11)
**Found while writing the spec:** within a session Peak's mood sinks until the person touches it, and the "bored" state has lines that ask for attention ("Hello? Anyone? Not even a tiny poke?", "Entertain me or I'll start chewing on the taskbar"). This is a need expressed to get interaction, smaller than loneliness but the same mechanism. Recommendation: keep boredom as a mood Peak has by itself (it plays, counts icons), remove the lines that ask the person for something.

## Alternatives considered
A neutral, flat welcome (rejected: the evidence is about expressed needs and guilt, not about warmth; charter article 8). Keeping the streak as a private number (rejected: nothing reads it but the two telemetry events, which become "days together reached"). A notification schedule setting (rejected: there are no notifications). Keyword detection of self-harm in chat (rejected: a new reading of content, weak in three languages, a false promise). Verified age (rejected for now: out of reach for a free desktop program; the lawyer decides if it is needed). Renaming the product (rejected: cost, and no mechanic carries the name).

## Consequences and when to revisit
The number of hand-written lines per language changes (the README and the website state it). Installs keep their closeness; `streak` and `bestStreak` are dropped on load. Revisit: Q6 after the lawyer; Q5 if a brain provider offers a safety signal the app can pass on without reading content; Q4 when the observed group has run.

## Sources
`../plans/foundation-review.md` (sections 2, 6, 7); `../foundation/charter-alignment.md`; `../../spec/12-foundation-alignment.md`.
