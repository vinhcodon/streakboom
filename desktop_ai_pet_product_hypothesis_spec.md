# Product Requirement & Hypothesis Specification: Desktop AI Pet (BYOK)

## 1. Project Overview
**Project Name:** Desktop AI Pet (Working Title)  
**Target Platform:** Cross-platform Desktop (Windows / macOS) built via Tauri or lightweight UI frameworks.  
**Core Concept:** A lightweight, transparent, always-on-top desktop companion (pet/avatar) that interacts with users through animations and contextual thought bubbles, powered by the user's own AI API key (**BYOK - Bring Your Own Key**).

---

## 2. Core Value Proposition & Business Model
* **Zero Infrastructure Cost:** The app does not host or pay for LLM token costs. Users provide their own API keys (e.g., Google Gemini Free tier, Claude, Grok).
* **Emotional Hook & Productivity:** Fills the workspace isolation gap by offering visual entertainment, companionship, and helpful productivity triggers (reminders, casual commentary, coding assistant cues).
* **Monetization Strategy:** 
  * Free Core App (Base pet, basic animations, BYOK functionality).
  * Paid Add-ons / DLCs (Custom skin packs, retro pixel art, anime characters, advanced productivity tools/plugins).

---

## 3. Market & Product Hypotheses (To Validate)

### Hypothesis 1: Emotional Hook & Retention
* **Assumption:** Knowledge workers and developers spending 8+ hours a day on a PC are willing to install an animated desktop pet because they feel isolated and experience screen fatigue.
* **Metric/Validation:** High initial download intent and 3-day/7-day retention rates in a closed alpha test.

### Hypothesis 2: BYOK Friction Acceptance
* **Assumption:** Power users, developers, and tech-savvy creators are willing to generate and input their own API keys (specifically leveraging Google AI Studio's free Gemini keys) to unlock a smart AI pet without monthly subscription fees.
* **Metric/Validation:** Completion rate of the onboarding flow where users successfully input a valid API key.

### Hypothesis 3: Contextual Utility over Web Chat
* **Assumption:** Users prefer quick, bite-sized bubble chat interactions and proactive desktop prompts over opening a separate browser tab to query an LLM for trivial tasks or stress relief.
* **Metric/Validation:** Frequency of double-click interactions and bubble chat engagement per session.

### Hypothesis 4: "Naive Pet" Retention (added)
* **Assumption:** A pet without AI (scripted lines, mood and closeness state, reactions to time of day and session length) is engaging enough that mass-market users keep it for 7 days, before ever being asked for an API key.
* **Metric/Validation:** D3/D7 retention and daily active interactions in naive mode, measured separately from the upgrade rate.

### Hypothesis 2b: Naive → "Brained" Upgrade (refines Hypothesis 2)
* **Assumption:** A fraction of engaged naive-mode users will paste a Gemini key when the pet asks at a moment of high engagement.
* **Metric/Validation:** Funnel conversion from "key request shown" to "first AI message sent". Success/failure thresholds to be set before alpha (suggested starting point: <20% = rethink, >50% = healthy; these are assumptions, not benchmarks).

---

## 3b. Decisions Log (Alpha 1.0)
* **Audience:** Mass market first; developers/power users are a later wave.
* **Two stages:** Naive Pet (no key, scripted) → Brained Pet (BYOK Gemini).
* **Provider:** Gemini only in alpha. OAuth rejected for alpha: Google recommends API keys as the simplest path, and OAuth for distributed apps requires scope verification and either per-user Cloud projects or a shared project that would shift quota/cost to us.
* **Key request trigger:** behavioral signal (e.g. user double-clicks to chat, or opens chat 3+ times); never at install, always dismissible ("later").
* **Naive pet richness:** time-of-day/session reactions plus a simple mood and closeness state with varied line pools.
* **Telemetry:** opt-in, anonymous, funnel events only, never chat content.
* **Key storage:** OS credential store (Windows Credential Manager / macOS Keychain), not a custom encrypted file.
* **Implication:** if most users stay naive, skin packs (DLC) carry more of the value; treat monetization as its own hypothesis.

---

## 4. Technical Architecture (Lightweight Client)

### Part A: The Shell (Desktop Client)
* **Tech Stack:** Tauri (Rust backend + Web frontend: HTML/CSS/JS/React) or lightweight Python (PyQt).
* **Characteristics:** 
  * Frameless, transparent window (`Always on Top`).
  * Low resource footprint (< 40MB RAM, minimal CPU usage).
  * Local Encrypted Storage for storing the user's API key securely on their machine (never sent to any intermediary server).

### Part B: The Brain (API Integration Layer)
* **Mechanism:** Direct HTTPS requests from the client to the chosen LLM provider's official endpoint (`generativelanguage.googleapis.com` or Anthropic API).
* **System Prompt Archetype:** 
  > *"You are a witty, slightly sarcastic, loyal, and tech-savvy digital pet living on the user's desktop. Keep your responses extremely concise (under 2 sentences), playful, and attentive to the user's well-being and productivity."*

---

## 5. Development Roadmap (Alpha 1.0)
1. **Phase 1 (UI Shell):** Implement transparent window, drag-and-drop movement, and basic sprite animations (Idle/Walking).
2. **Phase 2 (BYOK Settings):** Build a secure settings modal for entering and saving the Gemini/Claude API key locally.
3. **Phase 3 (Communication Layer):** Implement bubble chat triggers, double-click input box, and system prompt integration.