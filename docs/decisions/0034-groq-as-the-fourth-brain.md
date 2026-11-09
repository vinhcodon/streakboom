# ADR-0034: Groq is the fourth brain, offered right after Google and presented as a second free choice

- **Status:** accepted (built 2026-11-09, not released; not tried with a real key)
- **Date:** 2026-11-09
- **Decided by:** Vinh (author), with Claude

## Context
The author asked for Groq as a fourth brain, placed in the order of preference right after Google. Groq runs open models behind an OpenAI-compatible API and has a free tier with rate limits (per minute and per day), which makes it a second free way to give Peak a brain. ADR-0008 fixed the shape of brains: one in use at a time, keys of several stored, API keys only, no automatic failover.

## Decision
1. **Order:** Gemini, Groq, Claude, OpenAI. It is the order of the picker in Settings, Brain, and the order in which another brain is picked when the one in use has its key removed (`Provider::ALL`).
2. **Two free choices side by side.** Each brain shows a small tag in the picker ("free tier" for Gemini and Groq, "paid" for Claude and OpenAI) in both languages; Claude and OpenAI keep their cost notes. The pet's "Get a free brain" card is unchanged and starts the same flow.
3. **How it is built.** A thin Rust layer over the OpenAI client (`groq.rs`): the address `https://api.groq.com/openai/v1`, the key in the `Authorization` header only, a default model `llama-3.3-70b-versatile` (named as a production model on Groq's models page on 2026-11-09), Groq's error reading (401 and 403 a bad key, 429 slow down or the day's allowance used, 400 or 404 a model that is gone), a **low reasoning effort for `gpt-oss` models** (they think first and a small output limit could use up the answer), and a model choice that leaves out speech, text-to-speech, safety and embedding models and puts the default first, then the small Llama, then the open GPT models. The key is stored as `groq-api-key` (service `streakboom`); the chosen model is kept per brain as `groq_model`. Groq's model names carry the maker ("openai/gpt-oss-20b"), so the model-name check allows one `/` for Groq only and never as a path.
4. **Honest text.** Groq's terms were not available to read (the privacy policy says API data is governed by a separate agreement), so the data note says only that what you send goes to Groq, which runs the model, to be answered, and points to Groq's terms; the age box says "I am 18 or older" without saying Groq requires it; the cost note says a free tier exists with limits and that Groq's console shows the limits of the account. No claim is made that no card is needed.

## Alternatives considered
Groq as the only recommended free brain (rejected: the author chose two); automatic failover between free brains when one is rate limited (declined again, ADR-0008); a hosted proxy (ADR-0001); Groq's own SDK (an extra dependency for the same request).

## Consequences
- Four brains; `Provider::ALL` has four entries and the picker, the keys and the stored model per brain all know Groq.
- Rust tests 54 to 61 (Groq's errors, the reasoning rule, the model list, a request with the key in the header only, an error response, the model-name rule).
- **Not verified:** a real key (the default model name, whether the free tier serves it, the `reasoning_effort` parameter, the 429 texts, how Peak's voice reads on an open model); Groq's terms for data and age; that the free tier needs no card. Listed in `docs/plans/verification-debt.md`.
