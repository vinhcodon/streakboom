# ADR-0018: Start with Windows is an opt-in, asked politely once or twice

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
A desktop pet that has to be opened by hand every morning defeats its purpose, but a silent autostart is not acceptable.

## Decision
A Settings switch (state read from Windows) and a yes/not-now card from the pet: not on the first day, at most twice, three days apart, never after yes. Off by default.

## Alternatives considered
Enabling by default (rejected); no option (rejected).

## Consequences and when to revisit
The entry points to the running exe, so it must be turned on from the installed build.

## Sources
docs/engineering-log.md
