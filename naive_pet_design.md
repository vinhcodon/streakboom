# Naive Pet Design (Alpha 1.0)

Goal: a pet with no AI that is charming enough to keep for 7 days (Hypothesis 4) and builds the attachment that makes users willing to give it a "brain" (Hypothesis 2b).

## Decisions
- **Character:** a small animal (cat/dog/small creature; species to be fixed by art).
- **Personality:** playful, mischievous, mildly sarcastic. Teasing never targets the user's worth or work quality; it targets the situation (the clock, the coffee, the pile of tabs).
- **Languages:** Vietnamese and English line pools, chosen by system language, switchable in Settings.
- **No guilt:** the pet never dies, starves or gets sick. Neglect only makes it "a bit lonely", and it is delighted when the user returns.
- **Naive ≠ dumb:** it does not pretend to understand free text. Free-text input is disabled with an in-character hint.

## State model
Two values, stored locally, small and cheap.

| State | Range | Moves up when | Moves down when |
|---|---|---|---|
| Mood | 0–100 | Interactions (pet, snack, play), user returns after absence | Slow decay toward a neutral baseline (~50); never below 25 |
| Closeness | 0–100 | Daily check-in (first interaction of the day), streak of days, interactions | Very slow decay; floor at 10; never resets |

Derived mood bands: Sleepy (night/idle), Content, Playful, Bored, Lonely-but-hopeful. Mood chooses animation and line pool; closeness unlocks new lines and gestures.

## Closeness tiers (content unlocks)
1. **Stranger (0–19):** shy, short lines, keeps distance on screen.
2. **Acquaintance (20–49):** teasing starts, follows the cursor briefly.
3. **Friend (50–79):** inside jokes, remembers the user's name and routine times, rare "brain" hints.
4. **Close (80–100):** richer animations, special reactions to milestones (day 7, day 30).

The "brain request" (see onboarding_flow.md) is more natural at tier 2–3, but is triggered by behavior, not by tier alone.

## Behaviors
- **Idle loop:** idle, look around, groom/stretch, yawn, sit, nap.
- **Movement:** short walks along screen edges or the taskbar; never covers the center of the screen; stays out of the way of the active window's title bar and primary buttons where possible.
- **Character (revised after review):** a small round "mochi cat": head nearly as big as the body, large dark eyes with white highlights, pink cheeks, a belly patch, forehead stripes, and a tail that carries mood. Poses: idle, look around, think (while waiting for an answer), happy (closed ^ ^ eyes, bounce), land (squash after being put down), walk (side view), held (hanging by the scruff, leaning with the cursor), sleep (curled loaf with z's). The sarcastic side shows in half-lidded eyes and a lopsided smirk, planned as an extra expression for spicy lines (not built yet).
- **Interactions (revised after M4 review; the 5-button menu was removed as clumsy):** gestures, not buttons. Click = poke reaction; drag = carry; sweeping the cursor back and forth over the head = scratch (mood and closeness up, daily cap still applies); double-click = one speech bubble with a text box (scripted "how are you" without a brain, free chat with one). Settings live in the tray menu and a small gear in the chat bubble. Planned next: belly rub (usually liked, about 1 in 4 a playful "trap" bite with a sarcastic line), eyes following the cursor, chase play. Gestures are invisible, so the pet hints at the head scratch up to 3 times, at least 20 h apart, until the user does it once. The snack and play line pools are kept for the later gestures and for unprompted lines.
- **Reactive to the system (no content reading):** time of day, session length, idle time, battery low, lid-open after absence, weekday vs weekend, holidays. No window titles or screen content in naive mode.

## Line system
- **Line pools by trigger:** greeting, return-after-absence, long-session, late-night, morning, idle, interaction-reaction, milestone, brain-hint.
- **Each line has tags:** language, mood band, closeness tier, trigger, cooldown.
- **Selection:** filter by tags, exclude recently used (rolling window), weighted random. Never repeat the same line within a session.
- **Target size for alpha:** about 150 lines per language (about 15 per trigger on average, more for greetings and idle), written by hand and reviewed for tone.
- **Rate limits:** max one proactive bubble every ~10–15 minutes by default; none during quiet hours or when a fullscreen/meeting app is detected (to be validated technically); user can set "quiet", "normal", "chatty".

## Tone guide
- Short: one sentence, two at most.
- Teasing, not nagging: "Four hours without a stretch. I'm judging you, kindly." Not: "You are working too much."
- Never medical or moral advice; reminders to rest are suggestions with humor.
- Never mention the user's performance, only the situation.
- Self-aware about being limited, to set up the brain upgrade without a hard sell: "I only know a few words. I'd learn more if I had a brain."

### Example lines (samples for tone review)
- Greeting (EN, tier 1): "Oh. You're here. I wasn't waiting. Much."
- Greeting (VI, tier 1): "À, bạn đến rồi. Mình đâu có đợi. Hơi hơi thôi."
- Long session (EN): "Three hours. Even I got up and left the pixel twice."
- Long session (VI): "Ba tiếng rồi đó. Ngay cả mình cũng đã ngủ gật hai giấc."
- Return after absence (EN): "You're back! I only rearranged your desktop in my head a little."
- Brain hint (VI, tier 3): "Mình chỉ biết vài câu thôi. Có bộ não thì mình sẽ nói chuyện hay hơn nhiều đó."

## Persistence and privacy
- Local file only (mood, closeness, last-seen, preferences, used-line history).
- No chat content exists in naive mode. Telemetry (opt-in) carries funnel events only.

## Success metrics (alpha)
- D3 and D7 retention in naive mode.
- Interactions per active day (clicks, pets, menu uses).
- Rate of hiding/closing the pet per day (should be low).
- Share of users who reach closeness tier 2 and tier 3.
- Proactive-bubble dismissal rate (if high, lower frequency).

## Risks
- Line pool too small → repetition kills charm by day 3. Mitigation: many triggers, cooldowns, weekly new lines in alpha.
- Sarcasm lands as rude in some cultures or moods. Mitigation: tone guide, "gentle" toggle in Settings.
- Art cost of animations. Mitigation: a small set (idle, walk, sleep, react, carried) reused across moods with tint/bubble variation.

## Open items
- Species and art style (needs the artist/asset decision).
- Technical feasibility of fullscreen/meeting detection on Windows and macOS.
- Who writes and reviews the Vietnamese lines.
