# ADR-0122: A dev build lifts the daily chat cap; three plain logs for loop engineering

- **Status:** accepted on 2026-11-15 (the author's order: open the cap for testing, add the chat trace as proposed)
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The daily chat cap (60) stopped the author's own testing again. We also have no measure of how the cap is used, so no way to say what number is right. The author wants Peak watched in real use, logged, and improved in rounds (E29).

## Decision
1. **A dev build** (`npm run tauri dev`, where Vite reports `DEV`) has no practical chat cap (100000). A release build, Stable or Preview, keeps 60. The cooldown after a provider rate limit stays.
2. **`chat-trace.log`** (E28): one line per message that reaches the gate: the gate result, the number of characters, the count of the day. Never the words.
3. **`loop-trace.log`** (E29): one line per counted action (`act name`). Together with `perch-trace.log` and `leave-trace.log`, and a driver that watches Peak from outside (`scripts/loop/loop-round.ps1`), it feeds the rounds of E29.
4. All three use `append_trace`: fixed names and numbers only, cut at 64 KB, in the app data folder, never sent.
5. The real cap is still to be chosen from the measure (E28), by an ADR the author decides.

## Consequences
A dev run can burn through the author's key quota; the author accepted it for tests. No privacy change: no words, no screen content.
