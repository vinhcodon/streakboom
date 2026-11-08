# Changelog

Release notes of every version of Streakboom, newest first. **GitHub keeps the latest release and the one right before it** (installer and update manifest; the previous one is a way back if the newest is bad); when a new version is published, anything older is deleted together with its tag and its notes stay here (ADR-0028). The git history keeps every commit.

## 0.2.1 (2026-11-08)
- Chat: the background requests that note a few lasting facts from your chats no longer use up the daily chat limit (they have their own small limit), so all 60 daily chat turns are your own messages.
- When Peak has talked enough for the day it now says so in its own words (one of four lines per language, picked at random) and no longer in a technical way. Settings, Brain still shows today's use.

## 0.2.0 (2026-11-08), the first official release
- A round mochi-cat desktop pet for Windows named Peak: gestures (scratch the head, rub the belly, poke, carry it), eyes that follow the cursor, a mood and closeness model, 182 hand-written lines per language, quiet hours and Quiet mode.
- Memory you control (names, a usual part of the day, short facts), optional AI brains (Gemini, Claude, OpenAI; bring your own key) that answer in your language and act out a feeling.
- Opt-in stats with per-day counts ("Copy stats"), signed automatic updates with a fallback address, start with Windows (off by default), and Peak's face as the app icon.
- Earlier 0.1.x builds (0.1.0 to 0.1.16) were development builds and were withdrawn; they are not listed here. The installer is not code-signed yet, so Windows SmartScreen warns when you run it.
