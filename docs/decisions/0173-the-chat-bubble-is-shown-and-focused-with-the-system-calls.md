# ADR-0173: The chat bubble is shown and given the keyboard with the system calls, and a refused keyboard is reported as refused

- **Status:** (added to by ADR-0174, 2026-11-29: the keyboard is not forced) accepted on 2026-11-28 for the duo experiment. It authorises a scoped fix on its own branch; no merge, release, key use or art, and it does not start T2b. Completes E3 of ADR-0168; E4 is not touched.
- **Date:** 2026-11-28
- **Decided by:** Vinh (author): one multiple-choice question, answered with the recommended option. Recorded by Claude (the app session).

## Context
The investigation of ADR-0172 (issue #13, accepted by Codex with qualifications, comment 7242262616) found that B1 as the probe measured it is well explained by the probe losing its first click, and found a defect beside it: after an interactive bubble is hidden by Esc, the next one holds the keyboard while it is invisible. The bubble is hidden with the system call and shown with the window library, whose own record still says it is shown. Seen in 14 cycles of the experiment branches; `main`, which hides and shows with the library, does not have this pair.

## Decisions
1. **The interactive bubble is shown and given the keyboard with the system calls** (through the platform module on Windows; macOS keeps the library's calls). Plain speech, the hide and the rule that the bubble is not focused when it is made stay as they are.
2. **A refused keyboard is not reported as taken.** What the program does is checked, not assumed from the call. Any new text or visible behaviour for a refusal is asked first.
3. **The fix is verified before T2b is offered:** with another program in front (the test's own window), a chat opened over a speech line still showing, hide and show again, the window destroyed and made again, the shortcut and the other ways in, speech never taking the keyboard, and the experiment on. What cannot be run is listed.

## Why
It was the only tried change that showed the bubble in every cycle (8 of 8, 4 of 4 after Esc) while speech never took the keyboard (0 of 18), without relying on the library's record.

## Rejected
- **Hide with the library's call:** smaller, but by reading it leaves a hole when a chat opens over a speech line, and it is the setup of the older unexplained runs of issue #13.
- **More investigation before any fix.**
- **T2b first,** leaving the defect.

## Consequences
- The diagnostic commits of `claude/b1-investigation` are not part of the fix.
- The B1 gate of ADR-0168 stays until the fix is verified. The old probe is retired; a test clicks only when the pet is seen to take the cursor.
- Not established: that this is what issue #13 saw earlier, that a person cannot lose a click the way the probe did, and anything on Windows 11, a second monitor or macOS. A4 is untouched.
