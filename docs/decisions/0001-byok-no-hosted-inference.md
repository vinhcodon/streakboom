# ADR-0001: Bring your own key; the app hosts no inference

- **Status:** accepted
- **Date:** alpha 1.0 planning (original requirements, undated)
- **Decided by:** Vinh (author), with Claude

## Context
The app must cost nothing to run per user. Hosting a model would put token costs on the author.

## Decision
Users bring their own API key. The client calls the provider directly over HTTPS; there is no Streakboom server in between.

## Alternatives considered
A hosted, paid service (rejected: infrastructure and cost); a shared project key (rejected: quota and cost move to the author).

## Consequences and when to revisit
No intermediary can see chats. Users need an account with a provider, which is a friction to measure (H2, H2b). Keys must be stored safely (ADR-0007).

## Sources
spec/01 sections 2 and 3b
