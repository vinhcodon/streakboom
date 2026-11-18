# Changelog of Preview builds

Release notes of the **Preview** builds (an odd middle number: 0.5.x, 0.7.x), newest first. A Preview is a build the author hands to a few adults (ADR-0089, ADR-0090). It is published on GitHub as a pre-release, **never** as the download of the website, and its notes are **not** in [`CHANGELOG.md`](CHANGELOG.md), which the website reads. The format is the same as there: `## x.y.z (YYYY-MM-DD)`, then lines starting with `- `, the first a short bold sentence. When a Preview line is promoted, the Stable version takes its entry in `CHANGELOG.md`.

## 0.11.11 (2026-11-18)
- **A flick shoves Peak.** Hit Peak with a quick stroke of the mouse or the trackpad and stop on it for a moment: it staggers the way you flicked (near the end of a seat it may teeter, as a push always did). The rule is strict on purpose: a pointer that only passes Peak on its way somewhere does nothing, and a flick that does not stop on Peak is a pass. It may miss some flicks.
- **The right button changed.** One right click: Peak looks at the pointer at once and then steps aside. Two right clicks: it goes to its place. (Before, one right click was a push and two were step aside.) The typed phrases for both stay.
- **How it sees a flick:** while the pointer is near Peak (its window and a margin of 80 px around it) the program reads the pointer position every 8 ms and keeps the last 0.3 seconds in memory. Nothing is saved or sent, nothing is read away from Peak, and the page is told only that a flick happened, to the left or to the right. This is in Preview builds only for now.
- **A note for the tests:** `loop-trace.log` has a line for every pass of the pointer near Peak (`fast ...`) and for every flick (`flick_fired ...`): numbers and fixed names, never sent.
- Not yet tried: a real day of use, how many of your own flicks it catches and whether it ever shoves when you only pass, the trackpad over a long time, a weaker computer, and the flick near the end of a seat on purpose.

## 0.11.10 (2026-11-15)
- **A switch in Settings for the screen picture, off by default.** In Settings, Privacy, there is now a checkbox: Let Peak look at a tiny grey picture of the screen, to move out of the way of what you see. When it is on, about every ten seconds while Peak is awake it asks Windows for a grey picture of the screen with at most 192 by 108 squares, too small to read a letter from, and only looks at which squares are empty. It uses that to walk or hop to a clear place when its body covers a good part of what you see, when you ask it to step aside, and before it dozes off. The picture is kept in memory for an instant, never saved, logged or sent, and Peak's own windows are left out of it. Nothing is drawn on your screen. The tray item of the Preview builds still works as before and still opens the terrain layer for testers.
- **Safer picture:** no picture is taken while you are in a full-screen program, presenting, or away (the session locked); a black or failed picture is dropped; on a Windows older than version 2004, where Peak cannot be left out of the picture, none is given. One picture costs about 36 ms on a modest laptop, about once every ten seconds.
- **Fixed:** on a Windows that supports leaving Peak out of the picture, a refused call (for a hidden window, or a first call that failed once) no longer stops the rules.
- Not yet tried: the checkbox itself clicked on and off by a person, the three texts read by anyone (the Japanese was written by Claude), several monitors and mixed scales, Windows older than 2004, security software, and a whole working day.

## 0.11.9 (2026-11-15)
- **Peak now uses the picture of the screen: it moves out of what it covers.** With Screen picture on (from the tray; the layer need not be open), when its body covers a good part of what is on the screen Peak walks along the floor or hops once to the nearest clear place that has room above it. It also goes to a clear place before it dozes off, and when you double right click or ask it to step aside, or when it makes way for your typing, it goes to a clear place beyond the pointer instead of a fixed short step. It rests at least a minute after a move and stops chasing for ten minutes after three moves in ten minutes. It never goes down by itself and a cat that sits on a ledge only walks along it. It reads only whether cells are empty, never what is drawn.
- **A note for the tests:** `loop-trace.log` and `chat-trace.log` in the data folder (numbers and fixed names only, never sent, Preview and developer builds only).
- Not yet tried: any of it through a whole working day on your own screens, the back-off in action, the step aside when no place is clear, the hop out of the typing lane, and Windows 10 older than version 2004. A busy screen (text everywhere) leaves no clear place, and then Peak stays where it is.

## 0.11.8 (2026-11-15)
- **The picture experiment no longer sees itself.** We found that Peak's own windows, the layer included, were in the picture it takes, so the layer was feeding on its own drawing. For the instant of each capture they are now left out (they stay visible on the monitor; a screenshot made at that very moment may miss them). The layer shows how many cells were affected.
- **Better places to stand:** the ledges with a sharp edge and room above them (the top of a button or of a bar of a chart) and the empty inside of a card or pane are now places Peak could stand, joined with the exact window edges and checked for whether Peak could get there by hops; the edge of a window is in cyan, a place found from the picture in green or yellow-green. The threshold has a ceiling so that a strong block of colour does not hide faint borders, and the colours are stronger on a dark screen.
- Still only a view: Peak does nothing with it. A finer grid to see desktop icons was tried and refused: at that size words could be read.
- Not yet tried: the new places on your own screens, on a dark screen, with a small window over the desktop, and on a Windows 10 older than version 2004 (where the windows cannot be left out).

## 0.11.7 (2026-11-15)
- **The picture experiment now finds areas, not only lines.** With Terrain overlay and Screen picture both on, the layer tints what the borders enclose: calm open ground in blue (plains), bordered blocks with a calm inside, such as a card or a pane, in purple (panels, outlined), and busy ground, such as text, icons or a detailed wallpaper, in red (rough, outlined). A third line at the top counts them. The numbers are a first guess, to be tuned from your screenshots. It is still only a view: Peak does nothing with it.
- Not yet tried: any of it on a real screen.

## 0.11.6 (2026-11-15)
- **An experiment: what Peak could see in a picture of the screen.** The tray has a new item, Screen picture on/off (experiment). With it and Terrain overlay both on, about once a second Peak takes a very small grey picture of the screen (too small to read a letter, Peak itself is not in it), finds where the brightness changes sharply and draws it on the layer: green lines are edges with room above for Peak, grey ones without room, orange ones are walls, faint blue is empty space. Off at every start. The picture is dropped at once, never saved or sent, and Peak does nothing with it yet: it is only to look at, so that we can tune it together. The plan is in docs/plans/screen-picture-plan.md.
- Not yet tried: any of it on a real screen.

## 0.11.5 (2026-11-15)
- **Peak has a usual place now.** Say sit here (ngồi đây nhé, ここが定位置) where it stands and that spot along the floor becomes its place; say go to your spot (về chỗ đi) and it comes down to the floor if it is up on a window, walks to its place and nods. Until you teach it, its place is near the right end of the floor. Settings, Memory shows the place and lets you go back to the default. Nothing is watched to find it.
- **Seeing the terrain.** A new tray item, Terrain overlay (Preview), draws a thin layer over the screen showing what Peak believes about the windows and where it would climb or hop; it hides when Peak hides. And a small log, perch-trace.log in the data folder, notes which rule stopped each try to climb or hop (the mode, the cool-down, no ledge and so on): names and numbers only.
- Not yet tried: either of them on a real screen.

## 0.11.4 (2026-11-15)
- **Peak can now answer about the days it keeps.** Ask it, for example, when someone's birthday is: the days you asked it to keep are sent to your chat model with each chat you start, a short line each, so it can answer. They go with the same switch as the noted facts (Settings, Memory, Remember things I tell it in chats): turn that off and neither is sent. Settings says so.
- Not yet tried: asking about the days with a real chat model, and that turning the switch off makes Peak not know them.

## 0.11.3 (2026-11-15)
- **Peak no longer asks the same question about a day again and again.** The small answers people really type (uh, vâng, dạ, ko, nah and more) are understood. With a brain connected, Peak lets the chat model read an answer it does not know, even a corrected day (không phải, ngày mai mới đúng); without one it says how to answer. A day it already keeps, or one you said no to, is not offered again.
- **The question about a day stays open when the chat box closes by itself** (half an hour), and is shown again when you open the box. If you tell several days in one message Peak takes them one at a time. A day Peak could not make out is said plainly, not as if it were kept.
- After you keep a day, Peak looks at once at what you said around it (for example that the child is your second daughter) and may add it to the list of noted facts in Settings, Memory.
- Not yet tried: any of it with a real chat model, and the question shown again after the box closed.

## 0.11.2 (2026-11-15)
- **Peak now knows today's date, and notices a special day you mention.** The chat model is told your computer's date (written in words, with the weekday), so it can answer what day it is and turn today or tomorrow into the day to keep. Tell Peak, for example, hôm nay là sinh nhật con gái mình: it now offers to keep that day even if you did not say remember, and asks "shall I keep that day?" (answer giữ đi, yes, はい, or đừng giữ, no, いいえ).
- Not yet tried: whether the model writes the right date and keeps to real special days in all three languages.

## 0.11.1 (2026-11-14)
- **Peak can keep a day you tell it, and cheer on that day.** Tell it in the chat, for example: nhớ sinh nhật mẹ mình, 12 tháng 3. Peak asks if it understood the day right; answer đúng, yes or はい to keep it, không, no or いいえ to drop it. It repeats every year. On the day, when Peak is free, it says one line with your own words in it and a happy move; a day that came by while it was away or in Quiet mode is said once when it is back, without blame. Settings, Memory lists the days and can remove any of them or all.
- Peak is still not an alarm: it will say so if you ask it to remind you of a time of day or a task.
- Not yet tried: any of it on a screen or with a real chat model (whether it writes the right date in all three languages, and does not keep what is not a day), and the line on the day and the late one.

## 0.11.0 (2026-11-14)
- **The first Preview after Stable 0.10.0.** It has the same program as 0.9.8 and 0.10.0; nothing you can see has changed. It starts the next Preview line, where the new work will go. If you are on a 0.9 Preview, the update check shows the regular 0.10.0 first (a Stable that is higher than your copy is offered before any Preview).

## 0.9.8 (2026-11-14)
- **When an update cannot be downloaded, Peak now writes a small note about why.** It is a line in update-trace.log in its data folder: a number for the answer of the server (such as 403) and how many calls GitHub says are left for your network. No words, no account, nothing is sent anywhere. It is there to find out why an update to 0.9.7 failed, not to fix it.
- Not yet tried: the note on a real failed update; whether the number is read correctly from the error.

## 0.9.7 (2026-11-14)
- **The hint about xê ra now really shows.** After three pushes in a short while Peak is meant to say once that you can also say xê ra; in 0.9.6 the line could be swallowed by the bubble of the push and then never come back. It now waits for the bubble to go and counts as said only when you have seen it.
- Not yet tried: seeing the hint on a real screen (push three times before ever using xê ra).

## 0.9.6 (2026-11-14)
- **You can now ask Peak to step aside.** Double right-click on Peak, or type xê ra, tránh ra, move over, step aside, どいて. Peak walks away from the pointer until it is clear, and nods and stays if there is no room; it never leaves and never falls. A single right click is still a push, but it now waits a quarter of a second to see if a second click follows.
- After you push Peak three times in a short while, it says once, in its whole life, that you can also say xê ra.
- Under the hood, every action now has a name in one table (gestures, typed phrases, the rules that may refuse it).
- Not yet tried: any of it on a real screen or on a trackpad, the feel of the quarter-second wait, and the walk at the edge of a seat or with two monitors.

## 0.9.5 (2026-11-14)
- **Peak no longer says goodbye and stays, and a leaving is no longer stopped by Peak dodging your typing.** In a chat, telling Peak to go away now gets a playful answer instead of a goodbye. And when it really goes, it no longer breaks off to make way for the typing you have just done beside it, which was why it sometimes stood up, hopped and stayed.
- Not yet tried: whether the chat model keeps to the playful answer in all three languages, and the leaving on a real screen after this change.

## 0.9.4 (2026-11-14)
- **Telling Peak to go away in the middle of a chat is now taken as a joke, unless you mean it.** If you were talking with Peak in the last two minutes, lượn đi, cút đi and the others are answered like any message; say it three times within three minutes and Peak goes. With no chat just before, it goes at once, as before.
- **Telling Peak to go back to its place (về chỗ đi, go to your spot) is no longer taken as sending it away.** For now it only nods; it does not know a usual place yet.
- Not yet tried: any of it on a real screen, and how the chat model reacts to these words.

## 0.9.3 (2026-11-14)
- **Peak no longer mistakes the morning for the night.** Its own unprompted lines from the chat model were told only "it is 10 o'clock", and the model read that as 10 at night. Peak now tells the model the time with the part of the day in words, and the chat is given your local time, the weekday and the part of the day (nothing else: no date, no place), so asking Peak what time it is no longer makes it guess. This needs a brain connected; the time goes to that brain only with your chat or the optional unprompted lines.
- Under the hood, sending Peak away is now described in a text file (phrases, goodbyes, steps) that a small interpreter runs; it should look and behave as before. It also fixes a case where Peak could stop walking to the edge and then stand still, refusing the next command.
- Not yet tried: the new wording with a real model in all three languages, and sending Peak away again on a real screen after this change.

## 0.9.2 (2026-11-14)
- **A small log of what happens when Peak is sent away, to find out why it sometimes only nods and stays.** Two reports said that after typing lượn đi or biến đi the chat box closed, Peak nodded twice and then stood there with no goodbye. Peak now writes each step of the leaving (a fixed step name and numbers, never your words or anything from the chat) to a file named leave-trace.log in its data folder, on your computer only; nothing is sent. If it happens again, that file shows which step stopped.
- Not yet found: the cause. This build does not fix the problem, it records it.

## 0.9.1 (2026-11-14)
- **Peak no longer vanishes in the middle of the screen when sent away.** It now trots to the edge, faster than its ordinary walk, with a time that depends on how far the edge is; if it cannot get there (something stops it), it stays where it is instead of disappearing.
- Not yet tried: any of it on a real screen, on two monitors, or on a scaled display.

## 0.9.0 (2026-11-14)
- **The first Preview after Stable 0.8.0.** It has the same program as 0.7.7 and 0.8.0; nothing you can see has changed. It starts the next Preview line, where the new work will go. If you are on a 0.7 Preview, the update check shows the regular 0.8.0 first (a Preview copy is offered a regular version before a Preview); to stay on Preview, check again afterwards and this build is offered.

## 0.7.7 (2026-11-14)
- **Sending Peak away is no longer limited to Preview builds.** This is the last build of the 0.7 line; the next regular version, 0.8.0, is cut from it. On a Preview copy nothing changes from 0.7.6.
- Not yet tried: the model's habit of sending Peak away when you only mention leaving, measured on a real model.

## 0.7.6 (2026-11-14)
- **Peak coming back by itself no longer takes the keyboard from what you are typing in, and it comes back on time even if the computer slept.** Two fixes to sending Peak away: it now reappears without becoming the active window, and its return timer follows the clock instead of one long sleep. Nothing else changes.
- For testing only: starting Peak with the environment variable STREAKBOOM_AWAY_SECS (5 to 3600) shortens the time it stays away; docs/plans/lun-di-checklist.md lists what to look at.
- Not yet tried: any of it on a real screen.

## 0.7.5 (2026-11-14)
- **Sending Peak away can now be understood by the chat model too.** When the model understands that you are telling it to go away, in any wording, Peak says one of its own goodbyes and leaves, as it does for the phrases it knows. This works only on a Preview build, when a brain is connected, from a short message that is not a question, and it is not meant to leave when you only mention leaving (a meeting, a trip). It uses one chat turn.
- Not yet tried: any real model. How often it leaves when it should, and, more important, how often it leaves when it should not, is not known yet; a test for this is written and waits for the author to run it with his own key.

## 0.7.4 (2026-11-14)
- **Sending Peak away now understands more ways of saying it.** Words that only soften or address the command are ignored at both ends, so lượn đi nào, em lượn đi, thôi lượn đi, lượn đi peak, please go away and go away now work, and so does the name you gave Peak. A longer sentence that merely contains the words is still treated as chat. Anything the program does not recognise is still sent to the chat as before.
- Not yet tried: the new wordings in a real chat, and sending Peak away on more than one monitor.

## 0.7.3 (2026-11-14)
- **A first try of sending Peak away: type a plain command in the chat box, such as lượn đi, go away or 消えて.** Peak says one short goodbye, walks to the nearer side edge and leaves; after 20 minutes it comes back at the same edge with a stretch and says nothing, or at once when you show it from the tray (Show / Hide) or start the program again. It only exists on a Preview build, it needs a brain connected for the chat box to exist, and it does nothing while Quiet mode is on. If you are in a full-screen program when the time is up, it waits five minutes and tries again.
- Not yet tried by anyone: the walk, the hide and the return on a real screen, the three languages of the goodbyes, and whether twenty minutes feels right.

## 0.7.2 (2026-11-14)
- **Updates now show one version at a time, and test builds are only offered by hand.** In Settings, About, the check shows the newest regular version if there is one; on a test build it shows the newest test build when there is no newer regular one. The quiet background check never offers a test build, and on a test build Auto asks first instead of installing by itself. On a regular copy that is up to date there is a small link, Test builds..., with a warning and a confirmation, before the newest test build is shown.
- Not yet tried: any of it in a running app, the wording in the three languages, and installing a test build through the link.

## 0.7.1 (2026-11-14)
- **Peak keeps still and quiet while you are in something full-screen, presenting, or the screen is locked.** Before, it could start a walk, a hop or a perch while you watched a full-screen video or gave a presentation; now it starts nothing, stops a walk in progress and says nothing until you are out of it. Nothing else changes.
- Not yet tried: a full-screen video, a presentation and a locked screen on a real computer, and whether a borderless full-screen window counts.

## 0.7.0 (2026-11-13)
- **The first Preview after Stable 0.6.0.** It has the same program as 0.5.1 and 0.6.0; nothing you can see has changed. It starts the next Preview line: from here the new work goes, and the app offers the next 0.7.x by itself. You stay on Preview, and the Stable 0.6.0 is skipped because 0.7.0 contains everything it does.

## 0.5.1 (2026-11-13)
- **A second Preview build, to prove the update inside the app.** It behaves exactly as 0.5.0 and 0.4.2; nothing you can see has changed. If you run 0.5.0, the app should offer this one by itself.

## 0.5.0 (2026-11-13)
- **The first Preview build.** It behaves exactly as 0.4.2; the only difference you can see is the word "Preview" beside the version in Settings, About. It exists to prove that a Preview can be built, published as a pre-release and updated inside the app.
- Not yet tried: installing it, and updating from it to the next Preview or Stable.
