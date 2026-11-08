# ADR-0010: GitHub Releases, signed auto-update, unsigned installer for the alpha, update modes

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
Users need a way to get fixes; installers need code signing to avoid SmartScreen warnings.

## Decision
Releases on the public repo vinhcodon/streakboom (a private repo makes the latest download return 404). NSIS installer for the current user. Updates are signed with a key kept outside the repo and verified before install. The alpha installer is not code-signed: testers accept the SmartScreen warning. Update modes in Settings: install automatically when idle, ask first through the pet (default), or do not check.

## Alternatives considered
Code signing now (deferred until before any wide release); installing silently without asking (kept as an option only).

## Consequences and when to revisit
Losing the private updater key means installed copies can never be updated. Unsigned installers lower install conversion, so alpha numbers at the install step understate a signed release.

## Sources
README release section, spec/04 section 7
