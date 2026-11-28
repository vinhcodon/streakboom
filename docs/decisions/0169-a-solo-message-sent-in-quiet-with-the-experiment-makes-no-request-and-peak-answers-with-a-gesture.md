# ADR-0169: A solo message sent in Quiet, with the experiment on, makes no request; Peak answers with a gesture

- **Status:** accepted on 2026-11-28 for the duo experiment. It authorises no merge into `main`, release, key use or art. Adds to ADR-0166 and ADR-0167 (the solo state).
- **Date:** 2026-11-28
- **Decided by:** Vinh (author): one multiple-choice question, answered with the recommended option. Recorded by Claude (the app session).

## Context
With the experiment on, the chat box can be open while Quiet is on. The contract of ADR-0167 says what Quiet does in a group visit (rows 5, 10, 15 and 14a) and that an ordinary solo message behaves as the pinned build with the experiment off (row 1). With it off, turning Quiet on closes the chat input and a double click does not open it, so no message can be sent and no request is made; there is no behaviour to copy for a message sent from an open box. The T2d work (issue #22) applied row 14a to this case and flagged it.

## Decision
A message to Peak alone, sent in Quiet with the experiment on, makes **no model request and is not counted**; it shows in the box and Peak answers with a gesture, without a spoken line.

## Why
No request is made in Quiet in either mode, and the rule is the one a group visit already follows.

## Rejected
- **Keep the text in the draft** until Quiet is off.
- **Answer anyway**, since the person asked: a counted request while Peak is quiet.

## Consequences
- Built in `claude/t2d-dispatch-quota@53fff0a` (not merged); its verification is on #22. Nothing changes with the experiment off.
- The gesture on a release build with a real person at the keyboard, and whether it reads as an answer, are not verified.
