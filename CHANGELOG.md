# Changelog

Release notes of every version of Streakboom, newest first. **GitHub keeps the latest release and the one right before it** (installer and update manifest; the previous one is a way back if the newest is bad); when a new version is published, anything older is deleted together with its tag and its notes stay here (ADR-0028). The git history keeps every commit.

## 0.8.0 (2026-11-14)
- **You can send Peak away.** Type a plain command in the chat box, such as lượn đi, go away or 消えて: Peak says a short goodbye, walks to the nearer side edge and leaves. After 20 minutes it comes back at the same edge, stretches and says nothing, or at once when you show it from the tray icon or start the program again. It understands some wordings by itself, and, when a brain is connected, other ones through the chat model. It does nothing while Quiet mode is on, and it needs the chat box, so it needs a brain connected.
- **Peak keeps still and quiet while you watch a full-screen video, present or lock the screen.** Before, it could start a walk, a hop or a perch then; now it starts nothing, stops a walk in progress and says nothing until you are out of it.
- **Updates show one version at a time.** In Settings, About, the check shows one version. A few new things are shared early as test builds with a few people; the quiet background check and the Auto setting never offer one, and under You have the latest version there is a small link, Test builds..., that asks for a confirmation before it shows one.
- Not yet tried: how often the chat model sends Peak away when you only mention leaving (the test is written and has not been run); sending Peak away on more than one monitor, in all three languages and with a closed laptop lid have not been reported as checked.

## 0.6.0 (2026-11-13)
- **Nothing you can see changes.** This version finishes the groundwork for two kinds of builds: Stable (this one, for everyone) and Preview (a build for a few testers). The program now knows which one it is from its version number, and a Preview says so beside the version in Settings, About. A Stable copy keeps reading the same update file as before.
- Behind the scenes, the way releases are built, published and updated was reworked and tried on two Preview builds (0.5.0 and 0.5.1); this is the first Stable built after that.
- Not yet tried: updating a Stable copy from 0.4.2 to this version inside the app.

## 0.4.2 (2026-11-13)
- **The licenses of the open-source packages now travel with the program.** `THIRD-PARTY-NOTICES.md`, the license notices of the Rust crates and the JavaScript packages that Streakboom is built from, is installed next to the program, as their licenses ask. Nothing else changes for you: Peak behaves as in 0.4.1.
- This version is built by GitHub's CI from the public source and finished on the author's computer (the update signature is added there). The installer is still not code-signed.
- Not yet tried: that the notices file lands in the install folder (it is checked after the first build that contains it).

## 0.4.1 (2026-11-12)
- **Only one Peak runs at a time.** Before, every click on the program started another Peak, so you could end up with several pets on the screen. Now starting Streakboom again does not open a second pet; if the Peak that is running was hidden, it comes back. (ADR-0068.)
- **The tray icon menu speaks your language.** Show / Hide, Settings, Quiet mode and Quit were always in English; they now follow the language you chose, and change at once when you change it in Settings.
- **A better first guess of the language.** Auto now reads your system's whole list of preferred languages (the first one Peak has: Vietnamese, Japanese or English), not only the first one, and the first card of the tour has a small picker (Tiếng Việt, English, 日本語) if the guess is wrong. Peak never uses your IP address or location for this. (ADR-0066.)
- Not yet tried: the tray menu in Vietnamese and Japanese by the author, the picker in the tour, which Windows setting the list of languages follows, a second start while Peak is hidden.

## 0.4.0 (2026-11-12)
This release changes what Peak is, not what it can do. It follows a review of Peak against research on companions, streaks and attachment (`docs/foundation/`, ADR-0056 to ADR-0059). Everything that made Peak a character who needs you is gone.
- **Your absence costs nothing.** Being away never lowers Peak's mood or closeness any more, there is no "lonely" state, and no line counts the days you were away or says it missed you. When you come back it is simply glad.
- **No streak.** Peak no longer counts days in a row, says "three days in a row", pays closeness for opening the app, or shows "Longest streak" in Settings. "Days together" (different days, never reset) stays. The two optional counters `active_d3` and `active_d7` now mean days together reached 3 and 7.
- **A bored Peak amuses itself.** Its bored lines no longer ask you for attention ("Hello? Anyone? Not even a tiny poke?" is gone).
- **A little more outward.** Three new lines per language nudge you, gently, toward a person or a window ("Someone you like would enjoy a message from you. Not me. A person."). 263 hand-written lines per language now.
- **A right click on Peak pushes it** (away from the pointer); a left click is always a poke. The pet's own right-click menu is gone: Settings, Quiet mode, Quit and Show / Hide are in the tray icon's menu. A hidden Peak now shows no speech bubble. (ADR-0055.)
- **For adults.** Streakboom is made for people aged 18 and over (the first tour card, the Brain page and the README say so). Gemini's terms require API users to be 18 or older.
- **Chat rules, in the part of the prompt no setting can change:** when you say goodbye Peak answers with one short line and stops; if you seem in danger or speak of harming yourself it drops the jokes, says plainly that it is a small program and points you to a person you trust or your local emergency number; it is glad when you speak of friends and rest. "Well-being" and "close friends" are out of its instructions. Settings, About has a short "If you need help now" text with a public directory of helplines (no numbers, no country detection).
- **Claims.** Peak's mission is a small friend that makes the workday lighter; it makes no claim about health. A check in the documentation audit keeps health claim words out of the README and the texts of the app.
- Not yet tried: the new chat rules with a real key on each of the four brains; the new Vietnamese and Japanese lines read by a native reader; a real uninstall (the README says how to remove the keys and the data folder; the uninstaller's "Delete the application data" box comes from the Tauri template and was not clicked); whether a self-declared 18+ line is enough (a lawyer has not seen it).

## 0.3.2 (2026-11-11)
- Peak sits and climbs on the edges of your windows. It hops up to the top edge of a window, or walks to the side of a window and **climbs** it (new climbing and clinging poses), and climbs down again. At the end of a ledge it never walks off: it stops, crouches and looks over the edge (a new pose), then turns back, sits there with its paws over the edge, or climbs down. This uses the coarse picture of where windows are (a grid of squares; which window is which is only an anonymous number; kept in memory, never saved or sent), which is now **on by default** (Settings, Privacy, switch it off there). A dialog in front of a full-screen window counts as a ledge too.
- When the window under it goes away, Peak now falls to the window or ledge below it, not always to the bottom of the screen.
- When the Start menu or Search opens over Peak (windows it cannot be raised over), it hops out from under them instead of staying hidden. To do this it asks the system whether something is covering a few points of its body, nothing more.
- You can tease it: poke Peak when it sits near the end of a ledge and it wobbles; four times in five it catches itself, otherwise it is knocked off the ledge and falls beside the wall, and for ten minutes afterwards it keeps away from edges. **If you let go of Peak while carrying it above the floor, it now falls** (before, it stayed where you let go); on a ledge it stays.
- Peak is calmer while you work: it starts a walk, a hop up to a ledge or a line of its own only after you have not touched the computer for about 45 seconds, or while you are playing with it (a touch starts play for two minutes). When the window under it is closed while you are working it still falls, but silently, with no cry. The cry is no longer written in bold.
- Settings: **Chattiness** and **Quiet hours** are gone. Peak decides how much to say by itself: about one line every 10 to 15 minutes, only when you are not working, and from 23:00 to 07:00 by the clock it is sleepy and says nothing on its own. **If you had chosen "Quiet" at Chattiness, Peak stays silent on its own** (touch it to hear it); custom quiet hours are replaced by this night rule; Quiet mode in the tray menu is unchanged.
- After a fall, a connected brain may add one short remark (Settings, Brain, on by default); only the name of the event and five numbers about how it feels are sent.
- Measured on one computer (with the author at the keyboard), the processor use is the same as in 0.3.1 within the noise of the machine.
- Not yet tried: the new poses and walls with real windows on other machines, the Start menu on Windows 11, several monitors, an old settings file with custom quiet hours.

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
