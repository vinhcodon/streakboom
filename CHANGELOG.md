# Changelog

Release notes of every version of Streakboom, newest first. **GitHub keeps the latest release and the one right before it** (installer and update manifest; the previous one is a way back if the newest is bad); when a new version is published, anything older is deleted together with its tag and its notes stay here (ADR-0028). The git history keeps every commit.

## 0.3.1 (2026-11-10)
- Peak no longer drops by itself while you are doing nothing near it. It used to hop away when the mouse moved after you had clicked on its row; now it leaves a row only while you are actually typing, it prefers to go up, and it crouches for a moment first so the hop looks meant.
- Peak notices when the window it stands on goes away: if you close it, minimize it or drag it off, Peak freezes for a moment, jolts, cries out ("Á!", "Ơ kìa, đâu mất rồi?!") in a bigger, bolder speech bubble, and falls to the bottom of the screen. If another window is merely brought in front of it, nothing happens. To do this it asks the system what kind of window is just under its feet and remembers an opaque number for it; it never reads titles, contents or app names (README, Privacy).
- Words now follow the body: when you poke, scratch or rub Peak, it moves first and speaks a moment later, instead of both at the same instant.
- Repeating the same thing changes how Peak answers: the first pokes are playful, then it gets a little annoyed, resigned, and finally forgives you; scratching and belly rubs go through their own stages too.
- Peak varies its lines more: every line is said once before any repeats, there are 48 new plain lines per language for the things you do most (idle, poking, greetings, belly rubs, "how are you", scratching, coming back), and some lines use your name, the time or the weekday (only when it knows them).
- Settings, Brain has a new section, **What Peak is told**: it shows, read-only and in your language, the notes Peak is given about who it is every time a brain answers, layer by layer, with the safety parts marked as locked.
- Measured on one computer, the processor use is the same as in 0.3.0 (a median of about 11% of one core, standing about 10%).
- Not yet tried by a native speaker: the new Japanese and English lines.

## 0.3.0 (2026-11-09)
- A third language: Peak now speaks Japanese (日本語, marked beta in Settings). The whole interface, all the scripted lines, the lines about what it remembers and the instructions to the AI brain are in Japanese, in a warm casual voice. The text was written by an AI and has not yet been read by a native speaker, so some sentences may sound odd. Settings, General, Language chooses it; "Auto" picks it on a Japanese Windows.
- A fourth AI brain: Groq, offered right after Gemini (the order is Gemini, Groq, Claude, OpenAI). Groq has a free tier with limits; Settings, Brain tags each brain "free tier" or "paid". It has not been tried with a real key yet.
- Peak now notices before it makes way: when your work comes near it (or the text you are typing is about to reach it) it stops for a moment, looks toward your work with its ears up, and then walks or hops away. While you work near it, it also looks toward your pointer or toward where your text is heading.
- Fixed: with the mouse buttons swapped in Windows (left-handed setup) Peak read the wrong button and guessed the wrong place where you were typing; it now follows the button you click with.
- Fixed: the Vietnamese note about what Peak sends to the AI brain always named Google; it now names the brain you use.

## 0.2.5 (2026-11-09)
- Peak keeps out of the way of what you type: from where you last clicked and how long you have been typing it guesses where the text is heading, and before the text reaches it Peak hops up or down to another row (a sleeping Peak wakes first, and curls up if there is no room to hop). The guess can be wrong, so Peak sometimes hops when it was not needed; it waits at least 10 seconds between two hops.
- Peak now changes rows by hopping along an arc, so it moves up and down as well as sideways.
- To make that guess Peak remembers, in memory only, where you last clicked with the left mouse button and when (never which keys you press, nothing on your screen), and it is forgotten when Peak closes. The README says so under Privacy.
- A hop is light: it costs about 0.34 seconds of one processor core, and over a few minutes of normal use the median processor use is about 9% of one core, about the same as 0.2.4 (about 8%), measured on one computer.

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
