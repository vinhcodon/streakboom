# ADR-0030: The desktop is terrain, modeled as a cost field of fixed relief and the user's attention

- **Status:** accepted (direction; partly built in 0.2.5: monitor geometry, hops, the typing lane; the cost field, places and window relief are not)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude

## Context
Peak walks along one line and has no sense of place (spec/06 0.1). Vinh proposed treating the desktop as terrain made of paths and blocks. A first version of the idea had the cat live on window edges and not inside windows; Vinh pointed out that people keep windows maximized, so there are no edges, and that Peak must live on edges and inside windows: the empty space is its space. Reading what is on the screen to find empty space is against the privacy principle (no screen content).

## Decision
- **A cost field, not a map of walkable cells** (spec/07 section 1): every place has a cost made of fixed relief (monitors, edges, corners, danger zones such as the caption buttons) and the user's attention; Peak crosses any place but does not rest where the cost is high. Window relief (perches, walls) is a later, separate layer.
- **"Empty space" = where the user's attention is not**, found from the pointer and the user's activity, never from the screen.
- **The attention field** is a coarse grid in memory only, decaying in about 20 seconds; not written to disk, not sent, gone when Peak closes; stated in the README and on the website.
- **Once the field exists (L2), Peak moves away from the user's work using the field** (amends spec/06 D6): it walks or hops to the nearest lower-cost place, at most once every 25 seconds, and curls up where it is if it cannot. Before L2 it makes way sideways (FS-4, ADR-0029); a fade was tried first and removed.
- **Window geometry** (visible windows' position, size and maximized state; no titles, names or contents) is **not** part of L1 and L2. It needs Vinh's separate permission and a Settings switch (L3). When a window is dragged away under the cat, the cat falls to the surface below; it does not follow the window.
- **Order:** the code comes after FS-4 and the CPU target (PR-9). Levels: L1 (one world from all monitors), then L2 (the field, avoidance, hops); L3 (windows) and L4 (learned places) later.

## Amendment 2026-11-09 (later): the typing lane, and the fade is gone
- FS-4 was built as making way sideways (walk away, or curl up with no room); the fade it first had was removed (a see-through cat looked unnatural to the author).
- **The typing lane** (spec/07 section 3.1, T7 to T9): because the real caret is not available in Chromium and Electron apps (tested), the caret is predicted from the last click (the mouse button state may be read, in memory only) and the time spent typing; the cat leaves the band along the typing row, which needs vertical movement, so TE-2 and TE-7 come next.

## Alternatives considered
Edge-only terrain (rejected: windows are maximized); reading blank areas of the screen (rejected: screen content); UI Automation or the caret (rejected in ADR-0029); the cat following a dragged window (rejected: CPU, errors); fading (built first in FS-4, removed the same day: a see-through cat looked unnatural).

## Consequences
- ADR-0029 stays valid for FS-1 to FS-4 and its rung 3 (window geometry) stays deferred, now as L3 behind a switch; D6 is amended for L2 onward.
- Places (PL-2 to PL-5 in the backlog) are rebuilt on the world model of spec/07 (fractions of work areas), replacing the 3 x 3 grid, and PL-0 (how places survive monitor changes) is answered by that model; vertical movement (PL-1) becomes TE-7.
- A new hypothesis, H9, in the register: a pointer-based attention field is a good enough proxy for where the user works; it is judged by observation in the alpha (no new counters: consent version 2 is unchanged).
- The privacy text gains the attention-field paragraph; the website session is told when it is built.
- Not verified: everything; no part is built.
