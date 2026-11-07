# Onboarding Flow: Naive Pet → Brained Pet

## Principles
1. Pet is alive and charming before any key is requested.
2. The key request is triggered by behavior, never by install.
3. Never block: "Later" is always visible and the pet keeps living.
4. Plain language: "give the pet a brain", not "enter API key".
5. Honest about data: the key stays on this device and is sent only to Google.

## Screens

### S0. First launch
- Pet appears and idles/walks. One scripted greeting.
- One-time telemetry consent card (opt-in, funnel events only, no chat content). Default off; "No thanks" is equal in weight.

### S1. Naive mode (days 1+)
- Scripted lines driven by time of day, session length, idle time, and mood/closeness.
- Double-click opens a small bubble menu with canned interactions (pet, snack, "how are you"). Free-text input is shown disabled with a hint: "I can't understand words yet".

### S2. Brain request (trigger: user tries free-text chat, or opens chat 3+ times)
- Pet says: "I'd love to talk with you properly. Could you give me a brain? It's free and takes about 2 minutes."
- Buttons: **Get a free brain** · **Later**.
- "Later" snoozes the request (e.g. 2 days), after which a single gentle re-ask is allowed; max 3 asks total.

### S3. Guide panel
- Opens beside the pet. Three illustrated steps:
  1. Open Google AI Studio (button opens the default browser).
  2. Create an API key.
  3. Copy it and come back.
- Privacy note: "Your key stays on this computer and is only sent to Google. Delete it anytime in Settings."
- Tip: create a key just for the pet, so it is easy to revoke.

### S4. Paste and verify
- Paste field trims whitespace and checks format.
- App makes one tiny test request.
- Success: pet reacts happily, "I can hear you now!"; first AI chat opens.
- Failure messages (pet voice, no raw codes):
  - Invalid or revoked key: "Hmm, that key doesn't work. Want to try copying it again?"
  - Rate limit/quota (429): "I'm a bit tired, let's chat again in a minute."
  - No network: "I can't reach the internet right now."
  - Region unsupported: "Google says my brain isn't available in your region yet."

### S5. Brained mode
- Free-text bubble chat, proactive lines can use the model within a daily cap.
- Settings: replace key, delete key, toggle proactive lines, quiet hours.
- If the key later fails, the pet falls back to naive mode instead of erroring.

## Funnel events (opt-in)
install → first_launch → first_interaction → brain_request_shown → get_key_clicked → returned_to_app → key_pasted → key_valid → first_ai_message → active_d3 → active_d7

## Open items
- Exact trigger thresholds and snooze durations: tune in alpha.
- Check Gemini free-tier data-use terms and surface them in S3.
- Manual observation of 5–10 first-time users to complement telemetry.
