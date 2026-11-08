# Product Requirements: Streakboom (desktop pet, bring your own brain)

> **Status.** This was the original requirements and hypothesis document. It has been split so each kind of statement lives in one place:
> - **Hypotheses** (what we believe, not proven) are in [`../docs/hypotheses/`](../docs/hypotheses/README.md).
> - **Decisions** (settled, with the reasons) are in [`../docs/decisions/`](../docs/decisions/README.md).
> - **How the product works now** is in specs 02 to 05 and the README. Where this document and a later one disagree, the later one wins.
>
> What changed since the first draft: the stack is Tauri 2 with Svelte (not "Tauri or PyQt"); the memory target is about 120 MB, not 40 MB (a webview cannot do 40); three brains are supported, not Gemini only (ADR-0008); the product is positioned as a companion, not an assistant (ADR-0021).

## 1. Overview
**Name:** Streakboom. A small desktop pet for Windows 10/11 (macOS later, ADR-0003).
**Core concept:** a lightweight, transparent, always-on-top companion, a round "mochi cat", that reacts to the user through animation, gestures and short speech bubbles. It is lovable with no AI at all. With the user's own API key (**BYOK**, ADR-0001) for Gemini, Claude or OpenAI it can also chat, remember a few things about the user, and act out the feeling of its answers.

## 2. Core value proposition and business model
- **Zero infrastructure cost:** the app hosts no model and pays for no tokens. Users bring their own key, and the client calls the provider directly (ADR-0001).
- **A relationship, not capability:** the pet fills the workspace isolation gap with presence, memory, growth and a consistent character; it is not an assistant, and a feature that could be replaced by prompting another assistant is not built (ADR-0021).
- **Monetization (a hypothesis, not a plan):** a free core app (the pet, its animations and the BYOK chat), and later paid add-ons such as skin packs or character packs. If most users stay at the naive stage, skins carry more of the value. See the hypotheses register.

## 3. Hypotheses and decisions
Moved out of this document:
- the market and product hypotheses (H1 to H8): [`../docs/hypotheses/README.md`](../docs/hypotheses/README.md);
- the decisions log (audience, two stages, provider, key request trigger, telemetry, key storage, and everything decided since): [`../docs/decisions/README.md`](../docs/decisions/README.md).

## 4. Product requirements in brief
1. **A transparent, frameless, always-on-top window** with drag, no focus stealing for plain speech, and a pet that always stays on screen.
2. **Low footprint:** about 120 MB for all processes, idle CPU near zero (ADR-0005). The key is stored in the OS credential store and never sent anywhere but the provider (ADR-0007).
3. **A naive stage that is already charming:** mood and closeness, scripted lines in Vietnamese and English, gestures, no guilt (ADR-0013, spec/03).
4. **A brained stage on request:** a behavioral, dismissible request for a key, a guided key flow, short chat in one bubble, proactive lines, caps on use (spec/02, ADR-0008).
5. **Memory under the user's control** (ADR-0014) and **emotional reactions** to answers (ADR-0016).
6. **Honest data handling:** opt-in local stats, nothing sent automatically (ADR-0009, spec/05 section 6).
7. **Easy install and update:** a signed auto-update through GitHub Releases that asks before installing (ADR-0010).

## 5. Technical architecture
See [`04-technical-design.md`](04-technical-design.md). The system prompt archetype for the brain is in `app/src-tauri/src/brain.rs` (`persona`): witty, slightly sarcastic, loyal, under two sentences, in the language the user writes in, with one mood tag in front of each answer (removed before display).

## 6. Delivery
The original three alpha phases (UI shell, BYOK settings, bubble chat) are done, together with the naive pet, memory, three brains, signed updates and the gestures. What is next, in order, is in [`../docs/plans/roadmap.md`](../docs/plans/roadmap.md).
