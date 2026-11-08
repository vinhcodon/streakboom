# ADR-0023: Commit only the files you changed; never git add -A in a shared checkout

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
A blanket git add -A committed and released another session's unreviewed work (the Bond Days prototype) in 0.1.14.

## Decision
Stage explicit paths. Check git status and the diff before a release commit. Work for different tasks goes on a branch or worktree when more than one session is active. A release is built from a clean tree.

## Alternatives considered
Trusting a clean-looking tree (rejected).

## Consequences and when to revisit
A little more typing per commit.

## Sources
docs/handoff/README.md, docs/plans/roadmap.md
