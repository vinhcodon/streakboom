# ADR-0007: API keys live in the OS credential store and never reach the pet window

- **Status:** accepted
- **Date:** alpha 1.0 planning (original requirements, undated)
- **Decided by:** Vinh (author), with Claude

## Context
A key in webview memory, a file or devtools is exposed; keys also invite CORS and CSP problems.

## Decision
Keys are typed in the settings window, validated by one tiny request in Rust, stored in the Windows Credential Manager (one entry per provider) and sent only in the provider's header. Chat goes through Rust commands that read the key themselves; the pet window never sees it.

## Alternatives considered
A custom encrypted file (rejected).

## Consequences and when to revisit
Settings must call Rust directly for key operations; the pet window learns only whether a key exists.

## Sources
spec/01 section 3b, spec/04 sections 2 and 5
