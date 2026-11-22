# ADR-0150: Groq is retired; Streakboom offers three brains, Gemini, Claude and OpenAI

- **Status:** accepted on 2026-11-23, built on `main`, **not released**. The author's words: Groq's quality was judged poor in the tests, so remove it from the app and from the experimental parts; the system supports three brains. He chose "remove it for good, through a Preview" from three options. Supersedes ADR-0037.
- **Date:** 2026-11-23
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
Groq was added as the fourth brain in 0.3.0 (ADR-0037, "not tried with a real key"). In the voice tests of 2026-11-22 the only model the author's key could use was `openai/gpt-oss-20b` (the default `llama-3.3-70b-versatile` was refused for the key, and the automatic choice takes the first model the key lists): its Vietnamese was incoherent with every voice, once an empty reply, once an answer in mixed English. Gemini, tried on the same messages, was coherent. The duo prototype also had a developer flag to put Paws on Groq. Groq is in Stable 0.10.0 and the Previews 0.11.x, so some people may use it.

## Decision
1. **Groq is removed**: `groq.rs`, the provider in `brain.rs` and `lib.rs`, its card in Settings in the three languages, the type `ProviderId`, the tests and the documents that describe what the app does now (README, `features.md`, `privacy.md`, `PROJECT.md`, `development.md`, `CODE_SIGNING.md`, the bug template). Three brains remain, offered in the order Gemini, Claude, OpenAI.
2. **A person who used Groq** starts with Gemini (a saved provider the app does not know falls back to the default, tested) and sees "no key" until they add one in Settings, Brain. Their stored Groq key (`groq-api-key` in the Windows Credential Manager) is deleted by the app at every start, silently when there is none: the app stored it, so the app removes it; they can also revoke it in Groq's console.
3. **Files are not broken** (the add-only rule): `groq_model` stays in `state.json`, is read with a default and never used.
4. **History stays**: ADR-0037, the changelog, the engineering log and the release history say what was true then.
5. **The duo branch** loses its flag `STREAKBOOM_PAWS_PROVIDER=groq` when it takes this change from `main`; the duo session does that.

## Why
One small model is not proof that a whole provider is bad, but the author's own key could not use a better one, a fourth brain nobody checks is one more thing that can fail in a person's hands, and the charter prefers few moving parts. It costs an existing Groq user one step (a key for another brain).

## Rejected
- **Keep Groq and fix the automatic model choice:** possible, but it spends work on a brain the author does not want.
- **Remove only the experiments, keep Groq in the app until the next Stable:** keeps a brain nobody checks, with no benefit to people.

## Consequences
- **Not verified (V-196):** the removal was tested as code (Rust 119, JS 425, type check clean, audit clean) and **not seen in the running app**: Settings with three brains, a start with `provider: groq` in `state.json`, the deletion of a stored Groq key on a machine that has one. Nothing else could be tested with a real Groq key (there is none in use).
- **The website** still says four brains in `site/strings.mjs` and `scripts/site/checks.*`; it follows the released app, so it changes when this ships (note `docs/handoff/website-groq-removed.md`).
- **For the release notes** (not put in `CHANGELOG.md` now): "Groq is no longer offered as a brain. If you used it, Peak now answers with Gemini once you add a Gemini key in Settings, Brain, and its stored Groq key is removed from this computer. Gemini, Claude and OpenAI stay."
- The ignored tests `skill_harness` and the like list the providers `gemini | claude | openai`.
