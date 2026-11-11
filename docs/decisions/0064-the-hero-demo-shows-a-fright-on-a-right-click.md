# ADR-0064: The hero demo shows a fright on a right click

- **Status:** accepted (answered by the author on 2026-11-12); **built on 2026-11-12**
- **Date:** 2026-11-12
- **Decided by:** Vinh (author), with Claude (the website session)

## Context
In the app a right click pushes Peak away from the pointer (ADR-0055). The hero Peak is drawn by the app's rig but has no room to be pushed: it sits in a round picture, and a push is a move across the screen. The browser's own right-click menu is not wanted on the picture of Peak.

## Decision
A right click **on the picture of Peak** (not on the page around it) shows the startled pose and a caption that says what the app does: "In the app a right click pushes it away: it staggers and huffs. Here it only gets a fright." (three languages). The browser menu is blocked on that picture only. A phone has no right click, so nothing changes there. A left click is still a poke.

## Alternatives considered
Doing nothing and describing it in words (the gestures table does that too); a push animation (the rig has none for a canvas without a floor).

## Consequences
- A visitor who right-clicks Peak to save the picture does not get the browser menu there; the picture is a drawing made by code, not an image file, so there is nothing to save.
- Not verified: how it feels with a real mouse and on a laptop touchpad; a long press on a phone (not changed: no `contextmenu` blocking is expected to fire from a touch, but a touch device that sends one would see the same fright).

## Sources
ADR-0055, `site/peak.js`.
