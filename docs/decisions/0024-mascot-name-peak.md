# ADR-0024: The mascot is named Peak; each user can name their own pet

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The README draft introduced the character as "peak". The product so far had no character name: the pet asks the user to name it (ADR-0014), which could clash with a fixed name.

## Decision
"Peak" is the name of the character in the project (README, art credits, marketing). It is not hard-coded in the app: the pet still starts unnamed, asks to be named after a day or two, and the user's name wins. The user can rename it any time in Settings > Memory.

## Alternatives considered
Making Peak the default pet name (declined for now: it removes the small ritual of naming, which is part of the attachment hypothesis H6); keeping the character nameless (declined).

## Consequences and when to revisit
Docs and lines may say "Peak" when speaking about the character, never when addressing the user's own named pet. If testers find the naming card unwelcome, offer "Peak" as the suggested name in the card.

## Sources
README (Meet Peak, Art and credits), ADR-0014
