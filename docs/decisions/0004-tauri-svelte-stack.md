# ADR-0004: Tauri 2 with SvelteKit (Svelte 5, TypeScript)

- **Status:** accepted
- **Date:** alpha 1.0 planning (original requirements, undated)
- **Decided by:** Vinh (author), with Claude

## Context
A small always-on-top transparent window with a low footprint.

## Decision
Tauri 2 (Rust core plus the system webview) with a SvelteKit single-page app (adapter-static), Svelte 5 runes, TypeScript. Pure logic lives in src/lib with Node tests.

## Alternatives considered
Python with PyQt (mentioned in the original spec; not chosen).

## Consequences and when to revisit
A webview cannot reach the original 40 MB target (ADR-0005).

## Sources
spec/04 sections 1 and 7
