---
title: The eleven hard rules against the charter and ADRs
status: verified-2026-11-11
updated: 2026-11-11
note: Written from the charter and ADR-0013/0022 only; every row was verified against the code and the texts on 2026-11-11 (see ../plans/foundation-review.md, which also says where the foundation may be wrong). The conflicts it found were resolved in 0.4.0 (ADR-0059).
---

# Foundation rules vs what the repo already says

Purpose: avoid two rule sets. Claude Code verifies each row against the code, spec and the other ADRs, then proposes the ADRs that amend the charter (ADR-0047 says the charter changes only that way).

| # | Foundation rule | Already in the repo (from the files read) | Gap or conflict | To check |
| --- | --- | --- | --- | --- |
| 1 | Absence has no cost: Peak does not get hungry, sad or sick; no "I miss you"; neutral welcome back | ADR-0013 (never dies, starves or gets sick); charter art. 7 and manner 7 ("come back warmly, never accusingly") | **Conflict:** ADR-0013 and art. 7 say neglect makes Peak "a bit lonely". The foundation says a character that needs you is the risky mechanism (Replika, farewell tactics) | Any line, animation or notification that shows loneliness after absence |
| 2 | Cumulative count, no reset, no "broken streak" | ADR-0022 (Bond Days: days in the last 7 with a care gesture) | Probably aligned; Bond Days is a rolling count. **Check** the `active_d3`/`active_d7` "streak of consecutive launch days" in telemetry (handoff README, point 4): it is a streak by name | Anything shown to the user as a streak or reset |
| 3 | Clean goodbye: one line, then stop | Not seen | Probably new | Quit/quiet/sleep behaviour; lines on exit; add an automated test |
| 4 | Peak stays at the edge: no stealing focus, no covering the typing area, one-touch quiet, still mode | Charter art. 2, ADR-0029, ADR-0046, Quiet mode, spec 06 | Likely aligned | Respect for the OS reduced-motion setting |
| 5 | Few, batched notifications; user sets the schedule | Charter "few settings" says no setting for an *amount* of behaviour | **Tension:** the foundation wants a user-set notification schedule; the charter forbids settings for amounts. Resolve by ADR (maybe Peak adapts and Quiet mode stays the only control) | Proactive lines frequency and their timers |
| 6 | No variable rewards, no endless content | Charter manner 4 ("never the same trick twice", lines from a bag) | **Check:** random pools of lines are not a reward system, but make sure nothing is tied to how often the app is opened | Rewards, unlocks, "rare" events |
| 7 | Point people outward: rest, move, message a friend | Not seen | Probably new (README promise 5 fits the tone) | Existing lines; add a small set, not a feature |
| 8 | Chat is secondary; soft cap; chat share is a guardrail | ADR-0022 (chat share watched); chat cap 60/day (draft v0.4) | Aligned in intent | Voice later: short sessions, break prompt |
| 9 | Transparency; minimal data; opt-in counters only; no chat content stored; easy exit and deletion | ADR-0009 (opt-in local telemetry), ADR-0031, ADR-0001, ADR-0007 | Likely aligned | "Delete my data" path; the free-tier Gemini note (draft v0.4, E4) |
| 10 | Modest claims | README promises 1–4; ADR-0048 (site with the charter's promises) | **Audit:** README, site, stickers, store text against the do/don't-say table | Search for "heal", "relax", "stress", "lonely" in README, site, strings |
| 11 | Crisis safety: detect self-harm signals, route to local hotline, never pose as a therapist | Not seen | Probably new, needed if chat/voice stays | System prompt, refusal behaviour (ADR-0027), local hotline numbers |

## What the foundation adds that the repo lacks

- An **age gate** (ADR-0056).
- A **stop rule** for experiments (any guardrail worse → switch off, even if Bond Days rises).
- A list of **guardrail measures** beyond chat share (night use, 95th percentile of time, regret score, compulsion threshold).
- A **lawyer list** (`legal-questions.md`).
