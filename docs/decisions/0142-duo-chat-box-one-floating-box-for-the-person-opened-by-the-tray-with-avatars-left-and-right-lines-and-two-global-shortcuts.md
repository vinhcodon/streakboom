# ADR-0142: Duo chat box: one floating box for the person, opened by the tray, with avatars, left and right lines, and two global shortcuts

- **Status:** accepted on 2026-11-22 for the prototype and as the direction to try; nothing ships (see ADR-0139). It amends ADR-0141 (how the person types) and the tray rule of ADR-0139. The author proposed the box; each point below was chosen from options.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)
- **Amended by:** ADR-0145 (2026-11-22): the recipient avatars at the top of the box became two avatars with a coloured dot (who is out), the keys Tab, Shift+Tab and Ctrl+1/2/3 are gone, and a double click on a pet opens the box for it (points 2 and 6 below).

## Decision
1. **Where the person types: one floating chat box**, by default at the bottom right of the work area. The pets' words stay in bubbles above them (ADR-0141 option D, the bubble part); the box is the person's input and the log of the talk. It replaces the box beside a pet and the chips of ADR-0141; a double click on a pet only opens the box addressed to it.
2. **Look, from common chat applications:** a line of a pet is on the left with its round avatar (a name and a colour for each pet at the start of a group); a line of the person is on the right in one colour; the same speaker in a row shares one avatar; a time only between long gaps; three dots while a pet is writing; the recipient shown at the top as the avatars of Peak and Paws and *Both*, with a dot for a pet that is out and a greyed avatar for one that is in; a name written in the text still overrides the choice. Not taken from those applications: read receipts, unread counts, buttons to copy, regenerate or attach, markdown (charter articles 2, 5 and 7).
3. **Behaviour:** the box never opens itself. It hides when it loses focus, and a pin keeps it open until the person hides it.
4. **The tray icon:** one click shows or hides the box; a double click sends everyone in, or, with no pet out, brings out the pet tucked last (this changes the single click of ADR-0139). A single click waits about 0.3 s so that it is told from a double click.
5. **History:** only for the session; closing the program forgets it. No file is written.
6. **Shortcuts.** In the box (fixed): Enter sends, Shift+Enter breaks the line, Esc clears the field and then hides the box, the up arrow recalls the last message, Tab and Ctrl+1, 2, 3 change the recipient, and `/` opens a list of the local commands. Global, in a new Settings section *Shortcuts*, each changeable: show or hide the box (default Ctrl+Alt+P) and send everyone in or bring them out (default Ctrl+Alt+Shift+P). A combination already taken by another program is reported, never overridden.
7. **Without a key** the box still opens and takes the local commands; it says so in one line (charter article 6).

## Why
One place to write removes the confusion of three people in a talk and a box that moves with the pets; a familiar layout needs no explaining; keeping the pets' lines as bubbles keeps the feeling of a living thing and keeps the lines short. A box that hides itself and never opens by itself keeps the person's attention theirs.

## Rejected
- **A box that stays on top until hidden:** more likely to cover the person's work.
- **Middle click or the context menu for in and out:** easier to find, but loses the quick tray gesture the author asked for.
- **History on disk (the last 50 turns):** useful, but a new thing to store; can be decided later with a visible clear button.
- **No global shortcut:** nothing registered with Windows, but opening the box would need the tray every time.

## Consequences
- **Privacy:** registering a global shortcut lets the program learn only that that combination was pressed, never other keys; the privacy text must say so before anything ships (charter article 4, AGENTS rule 4).
- **Not built, not verified:** everything above. The first step is the box window with the log and the input into the existing chat path, then the shortcuts, then Settings and the global keys. A real tray click cannot be driven by the assistant (the single and double click are checked through the developer channel and a unit test of the debounce; the real tray is for the author to try). Recorded in `docs/plans/verification-debt.md` (V-183).
