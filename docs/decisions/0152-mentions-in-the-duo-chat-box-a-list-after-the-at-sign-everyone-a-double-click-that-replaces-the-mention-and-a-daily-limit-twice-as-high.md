# ADR-0152: Mentions in the duo chat box: a list after the @ sign, @everyone, a double click that replaces the mention, and a daily limit twice as high

- **Status:** accepted on 2026-11-23 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). It amends ADR-0145 (points 2 and 4: how a name is written and what a double click does) and the daily limit of the chat in the duo prototype. Each point was chosen by the author from options after trying the test build.
- **Date:** 2026-11-23
- **Decided by:** Vinh (author)

## Decision
1. **A double click on a pet replaces a mention that is at the start of the field.** Both out: a double click on Paws writes `@Paws ` in front of what is there; a double click on Peak after that makes it `@Peak ` (what the person typed after the mention stays: `@Paws my text` becomes `@Peak my text`). Mentions at the start (a pet, or everyone) are replaced by the one of the pet clicked; a mention further on in the text is left. A click on a pet says who the person wants to speak to. With one pet out nothing is written (nobody to pick), as before.
2. **After an `@` a short list of names is offered, as in common chat applications:** Peak, Paws and everyone, those that begin with the letters typed (`@e` finds everyone; `all` and `both` find everyone too). The arrows move, Tab or Enter chooses, Esc closes, a click chooses; the choice replaces what was typed with the name and a space. A pet that is in is listed too, marked *resting* (a message goes to whoever is out, ADR-0145). **A name already in the message is not offered again**, and `@everyone` is not offered once the message names anyone (it would add nothing); once it names everyone nothing is offered. The list is part of the box, not above it: the window is as tall as the list too (the first build cut it at the top edge of the window). No button was added.
3. **`@everyone`, `@all` and `@both` mean every pet that is out**, as the words for both already did (ADR-0145 point 2).
4. **The daily limit of chats is twice as high with the duo flag** (120 instead of 60): a message to both pets is two calls and the limit was reached in a few minutes. The normal build is not changed. The Settings figure follows.
5. **A message to Peak alone at the limit or in a cooldown gets a line from Peak, in the box and above it**, as a message to both already did. It was a silent return: the person saw nothing, and took it for a command that did nothing.

## Why
A click on a pet is the quickest way to say who is spoken to, so it should keep working when the field already holds a mention; a list after `@` is how every chat application does it and needs no button; a limit that a short test session reaches in minutes made the prototype look broken.

## Rejected
- **Keep a leading mention as it is on a double click** (the rule of ADR-0145): the second click did nothing, which looked like a defect.
- **Add the second mention** (`@Paws @Peak`): one click should not choose two people.
- **No limit while testing:** a cost that is easy to forget.

## Consequences
- **Not verified:** the list with a typing program (Telex, a Japanese IME): the keys are ignored while a word is composed, as everywhere in the box, but no one tried it with a real input method; a screen reader (the list has the roles of a listbox, not heard); a very long message with many mentions. A request such as "nói peak về chỗ ngồi đi" is **not** a command (the intents expect "peak về chỗ ngồi đi"); it goes to the model; allowing a polite verb before the command is a change of the shared intents and was not made (an open question for the author).
- V-198 in `docs/plans/verification-debt.md`.
