# ADR-0016: The pet acts out the feeling of a chat answer, named by the model

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
A fixed happy hop after every answer felt wrong for sad or teasing replies.

## Decision
Six emotions (happy, warm, sassy, surprised, curious, sad) plus neutral. The model starts each answer with one bracketed tag; Rust removes it before anything is shown. Neutral and unknown tags give a small nod. Sad folds the ears and never jokes; sassy is dropped in the Gentle tone. One reaction per answer, 1.4 to 2.8 s.

## Alternatives considered
Guessing the feeling from the words in the app (declined: poor in two languages); an extra classification request (declined: cost).

## Consequences and when to revisit
A weak model may tag poorly; the worst result is a nod. Scripted (no-AI) lines have no emotions yet.

## Sources
docs/engineering-log.md (emotional reactions)
