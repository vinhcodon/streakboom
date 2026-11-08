# ADR-0015: Interface language is a setting; the chat answers in the language the user writes in

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
With the app set to English the pet kept answering in Vietnamese.

## Decision
The language setting decides the interface, scripted lines and greetings by name. In chats the user starts, the brain is told to answer in the language of the latest message, falling back to the app language when unclear. Noted facts use the language of the chat. The pet's own unprompted AI lines use the app language.

## Alternatives considered
Forcing the app language in chats (replaced).

## Consequences and when to revisit
Stored facts may be in more than one language; they stay editable.

## Sources
docs/engineering-log.md (language fix)
