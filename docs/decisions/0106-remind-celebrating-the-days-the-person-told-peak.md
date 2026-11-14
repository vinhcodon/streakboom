# ADR-0106: The remind skill: first slice, celebrating the days the person told Peak

- **Status:** accepted as a direction and a first slice (the author chose all three points on 2026-11-14); **nothing is built**. It **amends A2 of spec 14** ("no timer, no reminder") for this narrow case and **applies ADR-0103** (skills as text files in stages).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author asked to open a "remind" skill for three uses: celebrating special events, building good habits, reminding important things; with no setting at all (everything said in conversation), and a record in the memory area of Settings. Spec 14 A2 and charter article 5 (companion, not assistant: "could the person get this from another assistant? Then it does not belong") forbid reminders. The three uses differ in risk:
- **Celebrating a day the person told Peak** (a birthday, an anniversary) is what a friend who remembers does. It fits article 5 ("it remembers").
- **A timed reminder of an important thing** (a meeting at 15:00) fails the article 5 test, and Peak only runs while the computer is on, so it cannot promise the punctuality of an alarm (article 7: it never lies about itself).
- **Habits** invite streaks, counting, guilt and health claims (articles 1 and 7, AGENTS.md rule 5).

## Decision
1. **Staged, the lowest risk first.** Stage R1 (this decision): **celebrate days the person told Peak**, by date, not by time of day. Stage R2 (a separate ADR, only if wanted): one-off timed reminders, with the words that Peak is not an alarm. Stage R3 (a separate ADR, doubtful): recurring nudges the person asked for, never counted, never chased, with no streak and no claim about health. "Good habits" is **not** a feature of its own.
2. **No setting.** The person says it in the chat ("remember my mother's birthday, 12 March") and Peak **confirms in the chat** what it understood ("12 March, your mother's birthday. Right?") before keeping it; removing or changing it is also said in the chat. A misread date costs trust, so the confirmation is not optional.
3. **The record is in the memory area of Settings:** a list of what Peak keeps (the day, a few words, who it is about), each row removable; "forget everything" covers it. This is seeing and deleting data, not a setting for an amount of behaviour (charter, few settings).
4. **Stored on the computer, add-only:** a new field in `memory.json` (a list; never rename or change an existing field, ADR-0090), read with a default, the test in `channel-data.test.ts`. The words are kept short and only what the person said. The list is **not** added to every chat turn: only an entry that is due is given to the model, if at all.
5. **Delivery follows the manners.** On the day, when Peak is free, it says one line (a pool of lines in three languages, under the banned-patterns test) and plays a happy beat; it yields to work and to a full-screen program. It says it **once**, never repeats and never escalates. **A day missed** (Quiet mode, the computer off, Peak away) is said **once when Peak is back, neutral and unaccusing**, never counted ("come back warmly").
6. **A brain is needed to create, not to deliver.** Understanding a date from words needs the chat model; without a brain Peak says so plainly when the person tries. A kept entry is delivered with no key (article 6), from the stored words and a scripted line.
7. **It is a skill file (ADR-0103):** R1 needs the second kind of step beyond stage 1 (a step that reads the list and a trigger "a kept day is today"), so R1 comes after the interpreter of stage 1 of ADR-0103, and **stage 1 of ADR-0103 is the next thing to build**. The model names the skill with a tag as for "leave"; the page does the rest.
8. **Measured, apart from Bond Days:** how many days are kept, how many were celebrated, how many removed by the person. Never shown as a number to the person.

## Consequences
- A2 of spec 14 now reads "no timer, no reminder, except what R1 allows"; a timed or recurring reminder still needs its own ADR.
- A harness like the skill harness (H20) is needed for the date understanding in Vietnamese, English and Japanese before R1 is released: the author runs it with his own key.
- Not verified: everything (nothing is built). Added to the backlog as epic E23.
