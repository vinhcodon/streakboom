# ADR-0055: The pet has no menu; the right click is a push

- **Status:** accepted (answered by the author on 2026-11-11); built, to be seen on a test build
- **Date:** 2026-11-11
- **Decided by:** Vinh (author), with Claude (the app session)

## Context
A right click on Peak opened a small native menu (Settings, Quiet mode, Quit), a copy of the tray menu. The author wants the tray menu to be the only menu, and the right click free for an interaction with Peak itself. The same day a bug showed up in the same area: a hidden Peak still showed its bubble (the bubble window was shown by `bubble_fit` with no check that the pet was hidden).

A first try made the right click a silent nod (a content blink). The author saw it and found it too close to the left click. He proposed to move the push there: until now a left click was a poke, except near the end of a ledge on the side away from the pointer, where it was a push (CH-5). One button with two meanings was hard to predict.

## Decision
1. The menu on the pet is removed (`show_pet_menu` and its handlers in Rust, the three menu strings in three languages). Settings, Quiet mode, Quit and Show / Hide are in the tray menu only; a left click on the tray icon shows or hides. No second way into Settings (the author declined a Shift double-click shortcut).
2. **The left click is always a poke. The right click is always a push**, away from the pointer (the way Peak faces when the pointer is over its middle). Near the end of the seat it sits on (the rule of CH-5: within 100 px in the pushed direction) Peak teeters and, as before, recovers four times in five and never falls while wary. Anywhere else it staggers for a moment and huffs. A sleeper is only poked. Nothing happens while it is held, flying, in Quiet mode, with a panel open, or within 2.5 s of the last push.
3. `bubble_fit` shows nothing while the main window is hidden.

## Why
Charter: few settings, few surfaces. Two buttons with one meaning each can be learned; a push that works everywhere can be found without being told where the edges are.

## Consequences
- The intro line about the Gemini key says "from the tray icon" (three languages, still one line each).
- README, specs 02, 03, 04 and 11 follow. The 0.3.2 changelog (released) still says "poke Peak near the end of a ledge"; the next release notes must say the push moved to the right click.
- Rejected: the silent nod (too like a poke), throwing a ball of wool (needs new art), calling Peak to the pointer.
