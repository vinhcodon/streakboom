# ADR-0008: Gemini, Claude and OpenAI, one brain in use at a time, API keys only

- **Status:** accepted
- **Date:** 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The alpha was Gemini only. Users asked for Claude and OpenAI. OAuth was considered twice.

## Decision
Order of work: Gemini, then Claude, then OpenAI. Keys of several can be stored; one is used at a time and the user chooses (no automatic fallback). A key connected while another brain is in use does not take over unless the user ticks it. Only API keys are supported. Google OAuth was rejected in the alpha (scope verification, per-user projects or shifted quota). A Claude subscription (Pro, Max, Team) login was not built: Anthropic's terms restrict those tokens to Claude Code and claude.ai, and an app would have to pass itself off as Claude Code. Claude Pro/Team and ChatGPT Plus do not include API access; the API is billed separately.

## Alternatives considered
Automatic failover between providers (declined); a subscription OAuth login (declined on terms grounds); a hosted proxy (see ADR-0001).

## Consequences and when to revisit
Paid brains need cost notes, daily caps (60 chats, 6 unprompted lines) and a low spend-limit tip. If Anthropic offers an official third-party sign-in, revisit. The Claude and OpenAI clients have never run against real keys.

## Sources
docs/engineering-log.md (Claude and OpenAI entries); spec/04 section 4
