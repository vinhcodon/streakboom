# Changelog of Preview builds

Release notes of the **Preview** builds (an odd middle number: 0.5.x, 0.7.x), newest first. A Preview is a build the author hands to a few adults (ADR-0089, ADR-0090). It is published on GitHub as a pre-release, **never** as the download of the website, and its notes are **not** in [`CHANGELOG.md`](CHANGELOG.md), which the website reads. The format is the same as there: `## x.y.z (YYYY-MM-DD)`, then lines starting with `- `, the first a short bold sentence. When a Preview line is promoted, the Stable version takes its entry in `CHANGELOG.md`.

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
