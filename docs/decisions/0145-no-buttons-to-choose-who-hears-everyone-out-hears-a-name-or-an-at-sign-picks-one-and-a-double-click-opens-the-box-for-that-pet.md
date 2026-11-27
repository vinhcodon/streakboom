# ADR-0145: No buttons to choose who hears: everyone who is out hears, a name or an @ picks one, and a double click opens the box for that pet

- **Status:** (amended by ADR-0164, 2026-11-27) accepted on 2026-11-22 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). It amends ADR-0142 (the recipient avatars, Tab, Ctrl+1/2/3) and ADR-0141 (point 2, how the person picks who is spoken to). The author proposed it after trying the build: the buttons break the rule of few buttons; showing who is out is enough.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)

## Decision
1. **A message goes to every pet that is out.** Both out: both hear (the first answers, the second may only nod, ADR-0141 point 3, unchanged); one out: that one; none out: nobody (see 5).
2. **A name picks one:** "Paws ơi…", "Peak, …" or `@Paws …` goes to that pet alone, also when both are out. A message that opens with one name but names the other later is for the first. A name of a pet that is in sends the message to whoever is out.
3. **The recipient buttons are gone** from the top of the box (Peak, Paws, Both), and with them the keys Tab, Shift+Tab and Ctrl+1/2/3 and the state "who the box is for". The top of the box shows the two pets with a coloured dot only: green when out, grey when in. No words for the state.
4. **A double click with the left button on Peak or Paws opens the chat box, puts the keyboard in its field, and, when both are out, writes `@Peak ` or `@Paws ` at the start of the field.** It is plain text: the person may delete it with Backspace; nothing else changes. This replaces the input in the bubble above Peak (which the author saw as a second box). One pet out: nothing is written.
5. **With both pets in** the field says so in its placeholder and a message that is not a local command is not sent (the commands such as "call Paws out" and the slash list still work).

## Why
Buttons add a hidden state ("who am I talking to?") that has to be remembered; the common group chats have none: everyone in the room hears, a mention picks one. The dots say who can hear. A mention that is text needs no widget and can be undone by deleting it.

## Rejected
- **Keep the chips:** more to learn and to misclick, against the rule of few buttons.
- **A double click that only opens and focuses:** loses the quick way to speak to one pet when both are out.
- **The words online and offline:** a pet is not offline; the dot is enough (the author chose dots without words).

## Consequences
- **Cost unchanged and noted:** with both out, every message that names nobody makes two model calls; the second pet may answer with a nod.
- **Code (on the branch):** `addressees` takes who is out and no fallback; the box page loses the chips and the keys; the double click on Peak or Paws calls one Rust command that shows the box and takes a mention for the field; the old chips of the bubble chat go. The Shortcuts text of Settings loses the Tab and Ctrl+1/2/3 clause.
- **Not verified:** see `docs/plans/verification-debt.md` (V-187).
