# ADR-0170: When a request's charge cannot be saved, no request is made and the pet answers with a gesture

- **Status:** accepted on 2026-11-28 for the duo experiment. It authorises no merge into `main`, release, key use or art. Adds to ADR-0165 and ADR-0167 (rows 14 and 25).
- **Date:** 2026-11-28
- **Decided by:** Vinh (author): one multiple-choice question, answered with the recommended option. Recorded by Claude (the app session).

## Context
Each chat request in the experiment is counted before it is issued, and restarting must not give it back (ADR-0165). Codex returned T2d (issue #22, comment 7234025168): the first delivery issued the request without waiting for the count to be written, and a failed write was ignored. Waiting for the write raises a question the contract did not answer: what happens when it fails.

## Decision
With the experiment on, when the charge cannot be saved, **no model request is made**; the pet addressed **makes a gesture**, as for a failed call (row 14d), and the failure is written to the log. No new spoken line is added. It holds for a solo message and for a group visit.

## Why
The daily limit stays true after a restart, and nothing new is added to what the pets say.

## Rejected
- **No request, with a short authored line** in three languages.
- **Request anyway**, letting a restart give the call back: it weakens the agreed limit.

## Consequences
- Nothing changes with the experiment off.
- A person whose disk cannot be written sees only gestures and no reason in the interface; whether that is understandable is not verified.
- To be built and verified under #22.
