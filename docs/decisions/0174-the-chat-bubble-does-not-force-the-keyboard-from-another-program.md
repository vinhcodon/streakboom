# ADR-0174: The bubble does not force the keyboard away from another program

- **Status:** accepted on 2026-11-29 for the duo experiment. It authorises no merge into `main`, release, key use or art. Adds to ADR-0173.
- **Date:** 2026-11-29
- **Decided by:** Vinh (author): one multiple-choice question, answered with the recommended option. Recorded by Claude (the app session).

## Context
The fix of ADR-0173 asks Windows for the keyboard once and reports the answer. The code before it asked through the window library, which forces the foreground (a simulated Alt key and a second try). By reading the code, with another program in front two bubbles that ask for the keyboard can now appear without it: Peak's own question for the person's name, and a chat reply that arrives after the person has moved to another program. Neither was run live.

## Decision
**Nothing is added to force the keyboard.** The bubble appears; the person who wants to answer goes to it.

## Why
A pet that appears while the person is typing elsewhere should not take their keys, which is the same reason the bubble is not focused when it is made.

## Rejected
- **Force both, as before.**
- **Force only for the chat reply,** which the person is waiting for.

## Consequences
- This differs from what the program did before; with the experiment off it is a difference from `main` on this branch and falls under the gates of ADR-0168 before any merge.
- No new text or sign is shown when the keyboard is refused.
- Not verified: the two cases live, and that a click on a bubble shown without the keyboard gives it the keyboard. The second belongs to the verification of ADR-0173.
