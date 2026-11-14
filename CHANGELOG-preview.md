# Changelog of Preview builds

Release notes of the **Preview** builds (an odd middle number: 0.5.x, 0.7.x), newest first. A Preview is a build the author hands to a few adults (ADR-0089, ADR-0090). It is published on GitHub as a pre-release, **never** as the download of the website, and its notes are **not** in [`CHANGELOG.md`](CHANGELOG.md), which the website reads. The format is the same as there: `## x.y.z (YYYY-MM-DD)`, then lines starting with `- `, the first a short bold sentence. When a Preview line is promoted, the Stable version takes its entry in `CHANGELOG.md`.

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
