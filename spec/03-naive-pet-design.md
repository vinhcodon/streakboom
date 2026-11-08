# Naive Pet Design

Goal: a pet with no AI that is charming enough to keep for 7 days (hypothesis H4) and that builds the attachment which makes users willing to give it a "brain" (H2b). Hypotheses: [`../docs/hypotheses/`](../docs/hypotheses/README.md). Decisions: [`../docs/decisions/`](../docs/decisions/README.md) (ADR-0011 character and gestures, ADR-0012 motion, ADR-0013 tone, ADR-0014 memory). "Built" below means it exists in the 0.2.1 code; "not built" is stated explicitly.

## Decisions
- **Character:** a round 2D "mochi cat" (ADR-0011).
- **Personality:** playful, mischievous, mildly sarcastic. Teasing never targets the user's worth or work quality; it targets the situation (the clock, the coffee, the pile of tabs). A Gentle tone setting drops the sarcastic lines (ADR-0013).
- **Languages:** Vietnamese and English line pools, chosen by system language, switchable in Settings.
- **No guilt:** the pet never dies, starves or gets sick. Neglect only makes it "a bit lonely", and it is delighted when the user returns.
- **Naive is not dumb:** it does not pretend to understand free text. Free-text input is disabled with an in-character hint until a brain is connected.

## State model
Two values plus a streak, stored locally in `pet.json`, small and cheap.

| State | Range | Moves up when | Moves down when |
|---|---|---|---|
| Mood | 25 to 100 | Interactions (pet, snack, play, how), returning after absence | Slow decay toward about 50; never below 25 |
| Closeness | 10 to 100 | A daily check-in (first launch of a day), a streak of days, gestures (capped per day) | Very slow decay after long absence; floor at 10; never resets |

Derived mood bands: Sleepy (late night), Content, Playful, Bored, Lonely-but-hopeful. Mood chooses the line pool; closeness unlocks lines.

## Closeness tiers
1. **Stranger (0 to 19):** shy, short lines. Built (lines by tier).
2. **Acquaintance (20 to 49):** teasing starts. Built as lines. The belly-rub "trap" starts here. "Follows the cursor briefly": not built as such; the eyes follow the cursor while it is over the pet at every tier.
3. **Friend (50 to 79):** inside jokes and rare "brain" hints. Built as lines. Remembering the user's name and a usual part of the day comes from memory (below), not from the tier.
4. **Close (80 to 100):** warmer lines and milestone reactions (streak days 3, 7 and 30, and shared memory milestones). "Richer animations": not built.

The brain request (spec/02) is more natural at tier 2 or 3, but it is triggered by behavior, not by tier alone.

## Behaviors
- **Idle loop:** standing, an occasional blink and tail twitch, looking around, thinking while waiting for an answer, a drowsy yawn before sleep, curled sleep with z's, and a stretch on waking. Built. "Groom" and "sit" as separate idle behaviors: not built (the sit and loaf are key poses used by drowsy and sleep).
- **Movement:** short walks along the screen edge, always clamped on screen, turning at the edges through the front view. The pet is only clickable where the cat is (the rest of its window is click-through).
- **Character and motion (ADR-0011, ADR-0012):** a small round cat: head nearly as big as the body, large dark eyes with highlights, pink cheeks, a belly patch, forehead stripes, a tail. Motion is a spring-driven blend of hand-drawn key poses (stand, sit, loaf, hang, stretch; front and side views) on a canvas; a pose change is a continuous morph, not a swap. Poses: idle, look, think, happy (hop), land (squash), walk, held (hangs by the scruff, leans with the cursor), drowsy, sleep, wake, purr (belly rub enjoyed), huff (belly rub trap), nod, smirk, gasp, curious and sad (ears fold down). Mood poses are acted out for the feeling of a chat answer (ADR-0016). Standing still costs no redraws.
- **Interactions (gestures, not buttons, ADR-0011):**
  - Click: a poke reaction. Drag: carry it. Double-click: one speech bubble with a text box (a scripted "how are you" without a brain, free chat with one).
  - Sweep the cursor back and forth over the head: scratch (mood and closeness up; a daily cap on closeness still applies).
  - Over the belly (the lower 45% of the sprite): a rub. Usually liked (`purr`, a "belly" line). Sometimes a trap (`huff`, a "huff" line, no gain): only from tier 2, after at least 2 rubs since the last trap, at least 3 minutes apart, then a 35% chance.
  - Eyes follow the cursor while it is over the pet and the cat is calm. Chasing the cursor across the screen: not wanted, not built.
  - Settings: tray menu, right-click menu on the pet, and the gear in the chat bubble.
  - Hints: one gesture at a time (head scratch, then belly rub), at least 20 hours apart, until the user has done it.
- **Reactive to the system (no content reading):** time of day, session length and idle time (a timer). Built. Weekday versus weekend, battery low, lid open after absence and holidays: **not built**. No window titles or screen content are read.
- **Polite:** nothing is said in fullscreen or presentation mode, in quiet hours, in Quiet mode, while dragging, while another bubble is open, or while the pet is asleep or dozing off (an unprompted line waits and is tried again 2 minutes later; the pet also does not doze off while a bubble is showing).

## Line system
- **Line pools by trigger:** greeting, return, morning, night, long session, idle, click, pet, how, milestone, brain hint, gesture hint, belly hint, belly, huff. The "snack" and "play" pools exist and are unused (no buttons any more; reserved for future gestures).
- **Each line has tags:** language, mood band, closeness tier, hours, trigger. Lines marked `~` are sarcastic and hidden in the Gentle tone.
- **Selection:** filter by tags, exclude recently used (a rolling window of 24), weighted random.
- **Size today:** 182 lines per language (about 14% sarcastic), written by hand. Tests check that both languages match, that no text repeats, that lines fit a bubble (110 characters), that sarcasm stays between a few lines and 40%, and that every tier and mood has gentle-tone coverage.
- **Rate limits:** one proactive bubble every 10 to 15 minutes by default (4 to 7 chatty, none when quiet); never during quiet hours, Quiet mode or fullscreen and presentation.

## Memory (ADR-0014)
Separate from the mood state, in `memory.json`, owned by the pet window.
- **No AI needed:** the pet's name and what to call the user (typed by the user, never guessed); coarse habit counts (sessions per hour of day and weekday; a usual part of the day is stated only after 8 sessions and when it holds at least half of them); touch counts; milestones shared once (7, 30 and 100 days, 100 and 500 touches, the first chat, 25 chats).
- **With a brain:** every 4 chat messages up to 3 short lasting facts are noted (at most 20 kept, deduplicated, editable, on by default with a switch). These background requests have their own daily cap (20) and do not use up the 60 chat turns (ADR-0027). They go into chats the user starts as background.
- **Where it is used:** at app start, on head scratches (a quarter of the time) and for milestones; never in the pet's unprompted lines, because the screen may be shared. The pet never claims a memory it does not hold.
- **Control:** Settings > Memory shows everything and can forget habits, facts or everything.

## Tone guide
- Short: one sentence, two at most.
- Teasing, not nagging: "Four hours without a stretch. I'm judging you, kindly." Not: "You are working too much."
- Never medical or moral advice; reminders to rest are suggestions with humor.
- Never mention the user's performance, only the situation.
- Self-aware about being limited, to set up the brain upgrade without a hard sell.

### Example lines (samples for tone review)
- Greeting (EN, tier 1): "Oh. You're here. I wasn't waiting. Much."
- Greeting (VI, tier 1): "À, bạn đến rồi. Mình đâu có đợi. Hơi hơi thôi."
- Long session (EN): "Three hours. Even I got up and left the pixel twice."
- Return after absence (EN): "You're back! I only rearranged your desktop in my head a little."
- Belly trap (EN): "It was a trap! You fell for the oldest trick in the book."

## Persistence and privacy
- Local files only: `pet.json` (mood, closeness, streak, settings, used-line history, AI usage, gesture and update bookkeeping, telemetry consent and queue), `memory.json` (the memory above), `state.json` (window position, Quiet mode, chosen provider and models). Chat history is in memory only.
- No chat content is stored in naive mode. With a brain, the short facts noted from chats are stored and listed in Settings (see ADR-0014). Telemetry is opt-in and carries funnel event names today (spec/05 proposes per-day counts under a new consent).

## Success metrics
The north star and its inputs and guardrails are defined in [`05-north-star-metrics.md`](05-north-star-metrics.md) (Bond Days). The earlier list for the alpha (D3/D7 retention in naive mode, interactions per active day, hide rate, tier 2 and 3 reached, bubble dismissal rate) is folded into it; hide rate and dismissal rate cannot be measured yet.

## Risks
- Line pool too small, so repetition kills charm by day 3. Mitigation: many triggers, cooldowns, new lines during the alpha.
- Sarcasm lands as rude in some cultures or moods. Mitigation: the tone guide and the Gentle switch.
- The belly trap may annoy. Mitigation: it is rare, never first, never twice in a row, and not in the Gentle-tone smirk.
- Art cost. Mitigation: a small set of key poses reused with springs and expression variants.

## Open items
- Who reviews the Vietnamese lines.
- Technical feasibility of fullscreen and meeting detection with real apps (built on a Windows API, unverified in practice).
- Emotions for scripted lines; weekday and holiday lines; battery and lid-open reactions.
- Whether the cat's in-between frames need more key poses (the wake stretch looks weakest).
