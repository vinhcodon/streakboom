# Changelog

Release notes of every version of Streakboom, newest first. **GitHub keeps the latest release and the one right before it** (installer and update manifest; the previous one is a way back if the newest is bad); when a new version is published, anything older is deleted together with its tag and its notes stay here (ADR-0028). The git history keeps every commit.

## 0.2.4 (2026-11-09)
- Peak keeps still and quiet while you work: it does not start a walk and does not speak on its own while you are typing or using the mouse, and a walk that is going on ends gently if you work near it.
- When you work right next to Peak it makes way: it gets up and walks away from your pointer, or yawns and curls up where it is if there is no room. A sleeping Peak wakes with a stretch and makes way if you type right by it for a few seconds.
- A redrawn stretch when Peak wakes up (a real cat stretch with a yawn), and the way back to standing no longer shows a half-turned face.
- Walking looks more like a cat: the four legs step one after another, and the walk starts and stops gently.
- Peak is lighter on your computer again: it paints about 11 frames a second on average (about 25 in 0.2.2) and the median processor use is about 8% of one core (about 17% in 0.2.2), measured on one computer.

## 0.2.3 (2026-11-08)
- Peak is much lighter on your computer: it paints about 14 frames a second on average instead of about 25, and the processor use at the median drops from about 17% to about 9% of one core. Small motions (a blink, a tail flick, the eyes looking around) use a lighter redraw, and a blink or a flick now ends in under a second.
- Walking and sleeping keep their smooth pace.

## 0.2.2 (2026-11-08)
- Peak no longer speaks while it is asleep or dozing off: an unprompted line now waits and is tried again two minutes later, and the pet does not start dozing off while it is showing a bubble.
- Settings, About has a button that opens the website, streakboom.com.
- Release housekeeping: GitHub keeps the two newest releases and the notes of every version stay in this file.

## 0.2.1 (2026-11-08)
- Chat: the background requests that note a few lasting facts from your chats no longer use up the daily chat limit (they have their own small limit), so all 60 daily chat turns are your own messages.
- When Peak has talked enough for the day it now says so in its own words (one of four lines per language, picked at random) and no longer in a technical way. Settings, Brain still shows today's use.

## 0.2.0 (2026-11-08), the first official release
- A round mochi-cat desktop pet for Windows named Peak: gestures (scratch the head, rub the belly, poke, carry it), eyes that follow the cursor, a mood and closeness model, 182 hand-written lines per language, quiet hours and Quiet mode.
- Memory you control (names, a usual part of the day, short facts), optional AI brains (Gemini, Claude, OpenAI; bring your own key) that answer in your language and act out a feeling.
- Opt-in stats with per-day counts ("Copy stats"), signed automatic updates with a fallback address, start with Windows (off by default), and Peak's face as the app icon.
- Earlier 0.1.x builds (0.1.0 to 0.1.16) were development builds and were withdrawn; they are not listed here. The installer is not code-signed yet, so Windows SmartScreen warns when you run it.
