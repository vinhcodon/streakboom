# ADR-0029: Focus-safety uses recent input and the pointer, and fades the cat; no hook, no window geometry

- **Status:** accepted (decisions answered by Vinh 2026-11-08; the feature is not built)
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The cat sits and walks along the bottom edge of the work area, where chat apps put their message box, so it can cover what the user is typing. The handoff `docs/handoff/character-and-movement.md` proposed a ladder of four approaches. Verified in code: Rust already reads the global pointer (hit-test thread, every 150 ms); `is_busy` is only the Windows notification state (fullscreen, presentation, locked); no idle-time or foreground-window call exists. spec/05 says "no input hook".

## Decision
- **In:** (1) the time since the last user input, one number from `GetLastInputInfo`; (2) the pointer's distance from the cat, from the pointer position Rust already reads.
- **Response:** the cat stays still while the user is active, holds unprompted lines, and **fades (and becomes click-through) when the user types near it**; it does not hop aside in the first version (less motion, less CPU).
- **Out for now:** the geometry of the foreground window (new information about the user's screen; revisit if needed). **Rejected:** the caret rectangle (unreliable, heavy, looks like surveillance).
- **Hard rules kept:** no global keyboard or mouse hook, no reading of keys, titles or contents, no network, nothing stored or sent about it. This is not a "hook": it returns a single tick count and cannot tell which keys were pressed; spec/05's line is clarified accordingly when the feature is built.
- **No new counter** for how often the cat fades: it would add a count the consent wording (version 2) does not list, which means a new consent version.
- Also answered: the "too big for me" refusal is vague and never names an assistant (consistent with ADR-0021); the share of sarcastic lines stays about 14%; the default name question is already settled by ADR-0024.

## Alternatives considered
All four rungs of the ladder (rejected the top one, deferred the third); a hop aside (deferred: costs CPU, and the baseline CPU is already over budget); pointing to the user's own assistant when declining (declined: it pulls toward the assistant frame).

## Consequences and when to revisit
The cat may rarely walk for someone who is always at the keyboard or mouse; that is intended. Revisit rung 3 if fading proves not enough in the alpha, and the per-day counter when the next consent version is needed anyway. Details: `spec/06-character-and-movement.md`, plan `docs/plans/character-and-movement.md`.
