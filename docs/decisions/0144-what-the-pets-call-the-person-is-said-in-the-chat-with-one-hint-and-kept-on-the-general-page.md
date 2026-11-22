# ADR-0144: What the pets call the person is said in the chat, with one hint, and kept on the General page

- **Status:** accepted on 2026-11-22. Built on the branch `exp/duo-prototype` only (nothing ships from there, ADR-0139). The author asked for an assessment of where the name should live and chose this option from three.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)

## Decision
1. **One name, for both pets.** What the pets call the person is the field `callMe` of `memory.json` (unchanged). Peak and Paws use the same name; the notes for the model of both say it.
2. **It is said in the chat, on the device, with no model and no key:** "call me Vinh", "my name is Vinh", "gọi tôi là Vinh", "tên mình là Vinh", "Vinhと呼んで", or `/name Vinh` in the list of commands of the chat box. A message counts only when it is short and what follows the verb is a name (up to three words); anything longer is an ordinary message. The pet that is spoken to answers with one line, as it did when the name was typed in the old input.
3. **One hint, never a pop-up:** while the chat box is empty and no name is known, a small line under the empty text says how (`/name` and the name). The pet no longer opens an input of its own after a few days to ask; with the chat box the asking is gone (without the chat box the old asking stays until the branch is merged).
4. **Settings:** one field, on the General page and not under Memory, called "Call me" ("Hãy gọi tôi là", "わたしの呼び方"; the author asked for the Vietnamese words after trying the first wording); an empty field clears the name.

## Why
The name belongs to the person, not to a pet, so it should not sit in a pet's memory page; it is found where the person already talks to the pets; an unprompted question costs the person's attention (charter article 2) where a hint they may ignore does not; and both pets must say the same thing.

## Rejected
- **A field in Settings only:** easy to build, but nobody finds it and the pets cannot take it from a sentence.
- **Keep the old input and the ask after three days:** one more window that opens on its own.

## Consequences
- **Built on the branch:** `callme.ts` (the sentences), `nameFromSlash` and the `/name` item in `chatbox.ts`, the hint in the box, the field moved to General, the three strings, the line "The person likes to be called X" in the situation of both pets. The old asking is skipped when the developer flag is on.
- **Not verified:** see `docs/plans/verification-debt.md` (V-185).
