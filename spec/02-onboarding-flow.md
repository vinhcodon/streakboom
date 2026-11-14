# Onboarding Flow: Naive Pet to Brained Pet

How a new user goes from a pet that only says scripted lines to one that talks with the user's own key (Gemini, Groq, Claude or OpenAI). Everything here is implemented unless marked otherwise. Decisions behind it: ADR-0002, ADR-0007, ADR-0008, ADR-0009, ADR-0018, ADR-0019 in [`../docs/decisions/`](../docs/decisions/README.md).

## Principles
1. The pet is alive and charming before any key is requested.
2. The key request is triggered by behavior, never by install.
3. Never block: "Later" is always visible and the pet keeps living.
4. Plain language: "give the pet a brain", not "enter API key".
5. Honest about data and cost: the key stays on this device and is sent only to the chosen provider; free Gemini keys may be used and read by Google; Claude and OpenAI are paid and a Claude Pro/Team or ChatGPT Plus subscription does not include API access; the user must be 18 or older.
6. The key is never typed into the pet or its bubble. It is entered in the settings window.

## Screens

### S0. First launch
- The pet appears and idles or walks. One scripted greeting.
- About 4 seconds later, on a fresh install only: the **first-run tour**, four short cards in the bubble with "n / 4", Skip and Next/Got it: drag it and it stays on screen; click to poke and double-click to chat; stroke its head or belly (one can be a trap); add your own key in Settings for real conversation. Leaving a card alone for 90 seconds ends the tour. Existing users never get it unasked; Settings > About has "Show the tour again".
- About 12 seconds after launch, once nothing else is open, a one-time telemetry consent card (opt-in; funnel event names and a few per-day counts, never chat content; consent version 2, see spec/05 section 6). Default off; "No thanks" has the same weight as "Yes". While the tour or another card is open the consent card retries every 20 seconds for up to 5 minutes. If ignored it comes back at most once more; the choice can always be changed in Settings > Privacy.

### S1. Naive mode (days 1+)
- Scripted lines driven by time of day, session length, idle time, mood and closeness.
- Interaction is by gesture: sweep the cursor over the head to scratch, over the belly to rub (usually liked, sometimes a trap), click to poke, drag to carry. Double-click opens one speech bubble: a scripted "how are you" line and a disabled text box ("I can't understand words yet"). The eyes follow the cursor while it is over the pet.
- Gesture hints, one at a time, at least 20 hours apart: first the head scratch (up to 3 times, until done once), then the belly rub (up to 2 times, only after the scratch is known, until done once).
- Memory without AI: after a day or two the pet asks to be named, then how to address the user (typed answers, never guessed, at most twice each, 2 days apart; "Not now" closes the card). It greets by name sometimes, mentions a part of the day it is usually seen in only after 8 sessions, and shares milestones. Details in ADR-0014.
- After at least 2 days of use the pet asks once, politely, whether to start with Windows (at most twice, 3 days apart, never after yes).

### S2. Brain request (trigger: the user clicks the disabled text box, or opens the chat 3 or more times)
- A bubble: "I'd love to talk with you properly. Could you give me a brain? It's free and takes about 2 minutes." (This describes the free Gemini path.)
- Buttons: **Get a free brain** (opens the settings window on the Brain page) and **Later**.
- "Later" snoozes the request for 2 days, after which a single gentle re-ask is allowed; at most 3 asks in total. The card also closes itself after a few seconds if ignored.

### S3. Brain page of the settings window
- A choice of brain at the top: **Gemini (Google)**, **Groq**, **Claude (Anthropic)**, **OpenAI (ChatGPT API)**, each with a small tag (free tier or paid). A tick marks the one in use, and a fixed line shows "Answering with: brain, model" and today's use against the daily caps.
- For the chosen brain, three steps: open the provider's console in the browser (a button), create an API key (Claude and OpenAI first need credit or a payment method), paste it below.
- A cost note (Gemini and Groq: a free tier, Gemini with no card to start; Claude and OpenAI: billed per use, with a tip to set a low monthly spend limit), an "I am 18 or older" checkbox, and a data note that names the right company, sit above the key field. If another brain is already in use, a checkbox "Use this brain right after connecting" decides whether the new key takes over.
- Privacy note: "Your key stays on this computer and is only sent to [the provider]." Tip: create a key just for the pet, so it is easy to revoke.
- Optional: choose a model from the list the key can use (once a plausible key is typed); "Automatic" is the default and prefers small, fast models.
- A stored but unused brain shows "Use this brain" and can be removed on its own.

### S4. Paste and verify
- The key field is a password input; whitespace is trimmed and the format is checked loosely (providers have changed key formats before).
- The app makes one tiny test request (it also returns the pet's first AI line). While it runs: a spinner with elapsed seconds, and after 8 seconds a "the provider is slow right now" hint.
- Success: the pet reacts happily and says the AI-written greeting with the model name; the chat is now live.
- Failure messages (pet voice, no raw codes up front; the technical detail is behind a "Details" toggle with a copy button):
  - Invalid or revoked key: "Hmm, that key doesn't work. Want to try copying it again?"
  - Rate limit or quota (429): "I'm a bit tired, let's chat again in a minute."
  - No credit left (Claude, OpenAI): "That account has no credit left. Add credit on the provider's site, then try again."
  - No network: "I can't reach the internet right now."
  - Region unsupported: the provider's brain is not available in the user's region.
  - Server busy, model missing, blocked content, empty answer, storage failure: each has its own line.

### S5. Brained mode
- Free-text chat in one bubble that morphs: type; then the user's line small above and animated dots while the pet thinks; then the answer appears word by word. An idle chat closes by itself after 12 seconds (20 after an answer) but never while there is text in the box.
- The chat answers in the language the user writes in (ADR-0015). Each answer carries a feeling, and the pet acts it out for 1.4 to 2.8 seconds: happy, warm, sassy (not in the Gentle tone), surprised, curious or sad, otherwise a small nod (ADR-0016).
- Every 4 chat messages a small request notes up to 3 short lasting facts about the user (on by default, with an off switch; they go to the active provider with chats; the user can edit or delete each one). Memory is used in chats the user starts, never in the pet's unprompted lines.
- Proactive lines: about half are written by the model, within a daily cap (60 typed chat turns and 6 proactive lines per local day, plus a separate cap of 20 background fact-noting requests, ADR-0027). When the chat cap is reached the pet says so in character (several variations, no numbers); any failure silently falls back to a scripted line.
- Settings (tray menu), six pages: General (language, start with Windows, update mode: install automatically, ask first (default) or do not check), Personality (Gentle tone), Brain, Memory ("What the pet remembers"), Privacy (usage stats, Copy stats) and About (version, a link that opens streakboom.com in the default browser, update check, the tour).
- If the key is later rejected, the text box turns off with "My brain needs a new key" (clicking it opens the settings window on the Brain page) and the pet goes back to scripted lines instead of showing errors.

## Funnel events (opt-in)
first_launch, first_interaction, brain_request_shown, get_key_clicked, returned_to_app, key_pasted, key_valid, first_ai_message, active_d3, active_d7.

Each is recorded once per install, only after consent, as a name and a timestamp. They stay in a local queue; the user can copy them from Settings > Privacy ("Copy stats") to share by hand. (`install` is not recorded: it happens before consent is possible.) `active_d3` and `active_d7` mean "the streak of consecutive launch days reached 3 or 7", which is not retention. Also recorded once each (built, unreleased): `tier_2`, `tier_3`, `pet_named`. Per-day counters are separate (spec/05): a second switch, recorded only at consent version 2; people who agreed to the first wording are asked once or twice, 40 seconds or more after launch and only when no other card is open.

## Open items
- Exact trigger thresholds and snooze durations: tune in the alpha.
- Observe 5 to 10 first-time users to complement telemetry (and to see the tour, the trap rate and the new Settings pages for the first time).
- Whether to add a short "what can I say?" prompt right after the key is connected.
- The Claude and OpenAI connection flows have not been run with real keys. The Groq flow was run by the author with a real key on 2026-11-14 (connect and chat worked, like Gemini).
