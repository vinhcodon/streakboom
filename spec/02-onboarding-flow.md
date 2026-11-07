# Onboarding Flow: Naive Pet → Brained Pet

How a new user goes from a pet that only says scripted lines to one that talks with the user's own Gemini key. Everything here is implemented unless marked otherwise.

## Principles
1. Pet is alive and charming before any key is requested.
2. The key request is triggered by behavior, never by install.
3. Never block: "Later" is always visible and the pet keeps living.
4. Plain language: "give the pet a brain", not "enter API key".
5. Honest about data: the key stays on this device and is sent only to Google; free keys may be used and read by Google, and the user must be 18 or older.
6. The key is never typed into the pet or its bubble. It is entered in the settings window.

## Screens

### S0. First launch
- Pet appears and idles/walks. One scripted greeting.
- About 12 seconds later, if nothing else is open: a one-time telemetry consent bubble (opt-in, funnel events only, no chat content). Default off; "No thanks" has the same weight as "Yes". If ignored it comes back at most once more; the choice can always be changed in Settings > Privacy.

### S1. Naive mode (days 1+)
- Scripted lines driven by time of day, session length, idle time and mood/closeness.
- Interaction is by gesture: stroke the head with the cursor, poke, carry. Double-click opens one speech bubble: a scripted "how are you" line and a disabled text box ("I can't understand words yet").
- The pet hints at the head-scratch gesture a few times, spaced at least 20 hours apart, until the user does it once.

### S2. Brain request (trigger: the user clicks the disabled text box, or opens the chat 3 or more times)
- A bubble: "I'd love to talk with you properly. Could you give me a brain? It's free and takes about 2 minutes."
- Buttons: **Get a free brain** (opens the settings window on the Brain section) · **Later**.
- "Later" snoozes the request for 2 days, after which a single gentle re-ask is allowed; at most 3 asks in total. The card also closes itself after a few seconds if ignored.

### S3. Brain section of the settings window
- One page with room for everything:
  1. Open Google AI Studio (a button opens the default browser).
  2. Create an API key.
  3. Copy it and paste it below.
- An "I am 18 or older" checkbox and the free-tier data-use notice sit above the key field.
- Privacy note: "Your key stays on this computer and is only sent to Google." Tip: create a key just for the pet, so it is easy to revoke.
- Optional: choose a model from the list the key can use (once a plausible key is typed); "Automatic" is the default.

### S4. Paste and verify
- The key field is a password input; whitespace is trimmed and the format checked loosely (providers have changed key formats before).
- The app makes one tiny test request (it also returns the pet's first AI line). While it runs: a spinner with elapsed seconds, and after 8 s a "Google is slow right now" hint.
- Success: the pet reacts happily and says the AI-written greeting with the model name; the chat is now live.
- Failure messages (pet voice, no raw codes up front; the technical detail is behind a "Details" toggle with a copy button):
  - Invalid or revoked key: "Hmm, that key doesn't work. Want to try copying it again?"
  - Rate limit/quota (429): "I'm a bit tired, let's chat again in a minute."
  - No network: "I can't reach the internet right now."
  - Region unsupported: "Google says my brain isn't available in your region yet."
  - Server busy, model missing, blocked content, empty answer, storage failure: each has its own line.

### S5. Brained mode
- Free-text chat in one bubble that morphs: type, then the user's line small above and animated dots while the pet thinks, then the answer appears word by word.
- Proactive lines: about half are written by the model, within a daily cap; any failure silently falls back to a scripted line.
- Settings (tray or right-click menu on the pet): language, chattiness, gentle tone, quiet hours, replace or remove the key, model, usage stats, version and update check.
- If the key is later rejected, the text box turns off with "My brain needs a new key" (clicking it opens the settings window on the Brain section) and the pet goes back to scripted lines instead of showing errors.

## Funnel events (opt-in)
first_launch → first_interaction → brain_request_shown → get_key_clicked → returned_to_app → key_pasted → key_valid → first_ai_message → active_d3 → active_d7

Each is recorded once per install, only after consent, as a name and a timestamp. They stay in a local queue; the user can copy them from Settings > Privacy ("Copy stats") to share by hand. (`install` is not recorded: it happens before consent is possible.)

## Open items
- Exact trigger thresholds and snooze durations: tune in the alpha.
- Manual observation of 5-10 first-time users to complement telemetry.
- Whether to add a short "what can I say?" prompt right after the key is connected.
