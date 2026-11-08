# ADR-0006: Three windows; the pet window is the only owner and writer of state

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The pet could be dragged off screen and the bubble clipped; settings and the key flow did not fit in a tiny panel.

## Decision
A 140x140 pet window (state, logic, timers, AI calls), a bubble window created on demand and destroyed after 45 s hidden, and a normal settings window opened on demand. Dragging is done by Rust so the pet is clamped to the work area. The other windows are views that send actions and receive snapshots (src/lib/bus.ts).

## Alternatives considered
A single large window (rejected: it capped how high the pet could go); letting the OS drag (rejected: unclamped).

## Consequences and when to revisit
Two writers of pet.json would corrupt state, so other windows only send patches. One more webview costs memory while the bubble exists.

## Sources
spec/04 section 2
