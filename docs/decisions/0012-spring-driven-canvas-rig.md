# ADR-0012: Motion is a spring-driven blend of hand-drawn key poses on a canvas; idle means no redraw

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
Swapping two pictures read as jerky; the author wanted one cat that moves.

## Decision
Poses are weights on key drawings (front and side) that follow targets like critically damped springs; turning is one spring that passes through the front view; extra springs drive the head, eyes, mouth, ears, hop and squash. Rendering is Canvas 2D, redrawn only as often as the motion needs (full speed while a spring moves, about 30 fps walking, about 11 fps for sleep and thinking, none standing still). The settled cat is cached while only z's or dots move.

## Alternatives considered
Cross-fading drawings with CSS (replaced); sprite sheets (not used); a pseudo-3D rig (rejected).

## Constraint added 2026-11-08 (the website reuses the rig)
`keys.ts`, `engine.ts` and `draw.ts` are copied to the website by erasing types only (`scripts/build-site.mjs`, Node's strip mode). Keep them to erasable TypeScript (no enum, namespace or constructor parameter properties) and import only each other (type imports from `../sprites.ts` are fine). `rig.test.ts` checks this; if the build breaks, the site silently stops deploying.

## Consequences and when to revisit
The in-between frames of some blends are less polished (the end of the wake stretch). A cheaper walking draw is still open.

## Sources
docs/engineering-log.md (continuous motion, CPU entries)
