# ADR-0171: A failed entry into the group visit says the existing busy line

- **Status:** accepted on 2026-11-28 for the duo experiment. It authorises no merge into `main`, release, key use or art. Adds to ADR-0166 (Q5) and ADR-0167 (row 8).
- **Date:** 2026-11-28
- **Decided by:** Vinh (author): one multiple-choice question, answered with the recommended option. Recorded by Claude (the app session).

## Context
Row 8 of the contract says a failed entry is rolled back, the failure is said and the unsent text comes back. It does not give the words. The T2a work (issue #23) used the lines the program already has for a pet that cannot come out (`callBusy`, in English, Vietnamese and Japanese).

## Decision
When an entry fails before the commit (a refused save, a box that cannot be shown, or the 5 s deadline) Peak says **one of the existing `callBusy` lines**, never in Quiet. No new text.

## Why
The lines already ask the person to try again later, and nothing new is added to what the pets say.

## Rejected
- **Only the line that does not say the pet is busy.**
- **New lines** in three languages.

## Consequences
- One of the lines says the pet is busy, which is not the true cause of any of these failures; this is accepted.
- Nothing changes with the experiment off. How the line reads to a person after a real failure is not verified.
