# ADR-0147: The chat box is one overlay of the talk: a stack of messages and a slim field, shown or hidden, never changing its layout

- **Status:** accepted on 2026-11-22 for the prototype (the branch `exp/duo-prototype`, nothing ships, ADR-0139). It amends ADR-0142 (points 1 to 4: how the box looks, when it hides, and the tray and shortcut) and ADR-0145 (point 3: the top of the box). Each choice was made by the author from options after trying test builds; the request came from the app session (`docs/handoff/chat-overlay-for-duo-session.md`) with the author's first choices.
- **Date:** 2026-11-22
- **Decided by:** Vinh (author)
- **Amended 2026-11-23 (the author, after trying it):** point 4: the box **fades away by itself** after the person has been in another program for a while (20 s, then 4 s of fading), and the pointer on it, the keyboard, a draft or a new message bring it back at once; **pinned (`/pin`) now means it never fades, and the default is not pinned**. The old rule (pinned by default, hidden when it loses the focus if not pinned) is replaced.

## Decision
1. **One overlay, two states: shown or hidden.** The box is a stack of the talk at the bottom right of the work area and a slim field under it. Its layout is the same whoever has the focus and however old the messages are: nothing is collapsed, replaced or taken away in the middle of a talk (the first build had a "reading" mode and a "writing" mode with different layouts; the author found the change a surprise and chose one layout).
2. **Look.** No frame, no header: the avatars of the pets and the pin button at the top are gone, and with them the two dots (the pets are on the screen; the field is one simple line, "Say something…", in the three languages; "Both are resting…" when both are in). Each message is on its own solid pill, all on the right: a pet with a small round avatar (22 px) and its name at the start of a group, the person in one colour. Behind the stack a scrim, dark in both system themes, dense at the bottom (about 96%) and clear at the top, soft at the left edge, only when there is a message (an empty box is only the field). The messages near the top fade by place. No message expires: the talk stays (the box keeps the whole reply, ADR-0146; the bubble keeps the head).
3. **Size.** The window is as tall as the stack (the page tells the program), up to 60% of the work area, then the talk scrolls with the wheel and no bar. It sits flush with the right edge and the taskbar (the 16 px margin of the old floating card is gone; the stack has 8 px inside).
4. **Showing and hiding.** Shown by the global shortcut, the tray, a double click on a pet, or by a pet's reply while it is hidden (shown without taking the keyboard). Hidden by the shortcut or the tray while the person is writing, by Esc, or by fading away after 20 s without the keyboard, the pointer, a draft or a new message on it (4 s of fading; not when pinned with `/pin`). **Losing the focus changes nothing that is seen at first:** the box stays and lets the mouse through; then it fades away (see the amendment above). The pointer resting on it for 0.25 s makes it take clicks and the wheel (not the keyboard); a click in the field gives it the keyboard; it goes back to letting the mouse through 0.8 s after the pointer left, when the field is empty and it has not the keyboard.
5. **Who the pets answer in.** The language the person writes in (the model reads it from the last message), the language chosen in Settings only as the fallback. The voice notes are English, and a small model followed them into English.
6. **Unchanged:** the history is for the session (ADR-0142 point 5); the log carries the talk, not the pets' unprompted lines; who hears (ADR-0145 points 1, 2, 4); the pill and the bubble show a long reply as ADR-0146 says.

## Why
A live chat is read as it comes, and what a person dislikes in it is a window that jumps. One layout with a quiet scrim reads on a white, a dark and a busy background (tried on the three) and never surprises; the only changes are the ones the person makes (show, hide).

## Rejected
- **Two layouts (reading and writing):** tried; the field and the older messages disappeared when the focus was lost.
- **Messages that expire (12 s or 0.5 s a word, eight at most):** tried with the first overlay; the box shrank to a few lines.
- **A light scrim:** a glare on a dark window; a dark one reads on all three backgrounds.
- **Bare text with a shadow:** unreadable on a busy background (the proposal of the app session).
- **A 16 px margin:** a gap from the time of the card.

## Consequences
- **Privacy:** the pointer is read every 100 ms by the program (as for the pets' hit test) to know whether it is on the box; nothing is stored or sent, and nothing outside the box is read.
- **Not verified:** see V-188 to V-191 in `docs/plans/verification-debt.md`. The cause of the odd Vietnamese glyph the author saw is not established (14 px and legibility rendering were tried; a hardening of the field during composition was added without a proof).
