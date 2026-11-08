# ADR-0014: The pet remembers little, locally, and the user controls it

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
Attachment grows when the pet remembers; memory about a person must be honest, inspectable and removable.

## Decision
Memory lives in its own file (memory.json) apart from pet.json. Phase 1 needs no AI: the pet's name and what to call the user are typed by the user, never guessed; habits are coarse counts (sessions per hour and weekday), stated only as a part of the day after at least 8 sessions; milestones are shared once. Phase 2: every 4 chat messages a small request asks the brain for up to 3 short lasting facts, filtered in Rust, kept at most 20, editable and deletable. AI-noted facts are on by default with an off switch (the author's choice); the user is told that they go to the active provider with chats. Memory is used at app start, on head scratches and for milestones, never in unprompted lines (screen sharing). The pet never claims a memory it does not hold. Settings > Memory shows everything and can forget habits, facts or everything.

## Alternatives considered
Conversation summaries (declined in favour of short facts); off by default (declined by the author); sending memory with the pet's own unprompted AI lines (rejected).

## Consequences and when to revisit
Duplicates in other languages can slip past the near-duplicate filter; the prompt and the user's delete button are the guards.

## Sources
docs/engineering-log.md (memory phases 1 and 2, fixes)
