# ADR-0011: A flat 2D mochi cat, controlled by gestures instead of buttons

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The five-button menu felt clumsy; a pseudo-3D prototype was built and rejected as less cute.

## Decision
The character is a round 2D mochi cat. Interaction is by gesture: click pokes, drag carries, sweeping the cursor over the head scratches, over the belly rubs (usually liked, sometimes a trap), double-click opens the chat bubble. The eyes follow the cursor only while it is over the pet. Chasing the cursor across the screen is not wanted and is not built. The pet hints at gestures a few times, one at a time, until the user has done them.

## Alternatives considered
A menu of buttons (removed); a 3D look (rejected); a cursor-chasing pet (declined: needs global polling).

## Consequences and when to revisit
Gestures are invisible, hence the hints. The cursor is known only over the pet window because the rest is click-through.

## Sources
spec/03, docs/engineering-log.md (gestures rounds 1 and 2)
