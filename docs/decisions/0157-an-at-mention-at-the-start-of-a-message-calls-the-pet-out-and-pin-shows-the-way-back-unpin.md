# ADR-0157: An @ mention at the start of a message calls the pet out, and the pin command shows the way back (/unpin)

- **Status:** accepted on 2026-11-24 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). The author saw `/pin` with no `/unpin`, and `@Paws` offered and accepted while Paws was in, with nothing that reached it; option A of three was chosen. Amends ADR-0145 (a name of a pet that is in sends the message to whoever is out) and ADR-0152 (the list offers a pet that is resting).
- **Date:** 2026-11-24
- **Decided by:** Vinh (author)

## Decision
1. **An `@` mention at the start of a message is a call**, as in common chat applications and the same as `/call`: if the pet named is in, it comes out and then the message goes to it. `@Peak @Paws hi` calls both. `@everyone` calls nobody (it means whoever is out). A name without the `@` ("Paws ơi") and a mention in the middle of a sentence call nobody and keep the rule of ADR-0145. If the call changes nothing (busy), the message goes as before, to whoever is out.
2. **The box lets such a message go** when both pets are in (it used to hold everything that was not a command).
3. **The list of mentions says what will happen**: beside a pet that is in it now says "comes out" (it said "resting").
4. **`/pin` and `/unpin`**: one toggle, but the list shows the way that is possible now: "Keep the box open (/pin)" when it is not pinned, "Let the box fade away (/unpin)" when it is. `/unpin` (and `bo ghim`, `release`) finds it. No new dot or row (ADR-0147).

## Why
A mention that offers a name and then delivers to someone else breaks the promise of the list. A call is what every chat does with a mention of someone who is not there yet.

## Rejected
- **B, the list offers only the pets that are out:** simple, but a pet cannot be called with `@`. **C, a line "Paws is resting" when it is sent:** more wording, and the person still has to call the pet by hand.

## Consequences
- `app/src/lib/duo-command.ts` (`summons`), `chatbox.ts` (`slashItems` takes the pinned state), `chatbox-ui.ts`, the main page and the box page; tests in `duo-command.test.ts` and `chatbox.test.ts`. V-203 for what is not yet seen (a call from `@` on a second monitor, two names at once, a call while a scene runs).
