# ADR-0020: Streaming chat replies are not built

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
Answers are limited to under two sentences, so the whole answer arrives almost with the first words, and a growing text would resize the bubble window on every chunk.

## Decision
Replies are requested whole and revealed word by word.

## Alternatives considered
SSE streaming (deferred).

## Consequences and when to revisit
Revisit if answers get longer.

## Sources
docs/engineering-log.md (start with Windows entry)
