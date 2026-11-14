# Peak in detail: what it does and how to use it

The reference for what Peak does and how you use it. The short version is in the [README](../README.md); how it is built is in [`spec/`](../spec). If this file and the app disagree, the app and the specs win; fix this file in the same change (see [`docs/README.md`](README.md)).

## What it does

- 🐈 **A pet that is alive without any AI.** A mood and closeness model, 263 hand-written lines per language, with stages when you keep poking it (sarcastic ones can be turned off with "gentle tone"), a sleepy night (from 23:00 to 07:00 by the clock it dozes and says nothing on its own), and no guilt: the pet never dies or starves, and your absence costs nothing.
- 👆 **Gestures instead of buttons.** Sweep the cursor over its head to scratch it, over its belly to rub it (it usually loves it; sometimes it is a trap), click to poke, drag to carry it (it hangs by the scruff and leans with your cursor). Its eyes follow your cursor when it is over the pet. It wanders on its own (walking, and since 0.2.5 hopping between rows), always stays on screen, and moves like one animal, not a set of pictures.
- 🧠 **Bring your own brain.** Add your own key and double-click the pet to chat. Gemini and Groq have free tiers (with limits); Claude and OpenAI are paid (a Claude Pro/Team or ChatGPT Plus subscription does not include API access). The brains are offered in this order: Gemini, Groq, Claude, OpenAI. Some of its unprompted lines are then written by the model, within a daily cap (60 chat turns and 6 unprompted lines a day; when it has talked enough, Peak says so in its own words and the count resets at midnight), and each answer comes with a feeling the pet acts out. It answers in the language you write in. Your key stays on your computer.
- 💭 **It remembers a little, and you control it.** A name for the pet, what to call you, a usual part of the day, milestones, and (with a brain, on by default, switchable) a few short facts from your chats. Settings > Memory shows all of it and can forget any part.
- 💚 **Free and open source.** The app costs nothing and the code is under the MIT license. An AI brain is optional and billed by the provider you choose (Gemini has a free tier; Claude and OpenAI are paid). Bug reports and ideas are welcome as GitHub issues.
- 🧍 **Out of your way.** While you work, Peak keeps still and quiet: it does not start a walk or speak on its own while you type or use the mouse. If you work right next to it, it makes way (it walks away from your pointer, or yawns and curls up if there is no room; a sleeping Peak wakes and moves if you type right by it). Since 0.2.5 it also guesses where the text you are typing is heading, from where you last clicked and how long you have typed, and hops up or down to another row before the text reaches it. The guess can be wrong, so it sometimes hops when it was not needed; it waits at least 10 seconds between hops.
- 🍃 **Light on your computer.** About 100 to 120 MB of memory across its processes. Processor use, measured on one machine so far: about 4 to 6% of one core while it stands still and a median of about 9 to 11% in normal use (0.3.1 measured the same as 0.3.0); a hop costs about 0.34 seconds of one core. Getting it lower is an open item (`docs/plans/backlog.md`, PR-9).
- 🎭 **It reacts like a cat, in time.** A reaction has a shape: when the window Peak stands on is closed, minimized or dragged away it freezes for a moment, jolts, cries out in a bigger speech bubble and falls to the bottom of the screen; when you poke, scratch or rub it, it moves first and speaks a moment later; repeat the same thing and it gets playful, then a little annoyed, then resigned, then forgives you. Lines are said once each before any repeats, and some use your name, the time or the weekday. Settings, Brain, **What Peak is told** shows, read-only, the notes a brain is given about who Peak is (the safety parts are marked as locked). How it is built: [`spec/09-reactions.md`](../spec/09-reactions.md).
- 🤫 **Polite.** It stays quiet in fullscreen apps, at night and in Quiet mode, says nothing on its own while you work (it speaks unprompted only after about 45 seconds without you touching the computer, or while you play with it), and never takes the keyboard focus for plain speech.
- 🚶 **It can go for a walk.** Type a plain command in the chat box (lượn đi, go away, 消えて) and Peak says a short goodbye, walks to the nearer side edge and leaves; after 20 minutes it comes back at the same edge, or at once when you show it from the tray. It does nothing in Quiet mode and needs a brain connected for the chat box.
- 👋 **It steps aside when asked.** Double right-click on Peak, or type xê ra, tránh ra, move over or どいて, and it walks away from the pointer until it is clear (it nods and stays if there is no room). It never leaves and never falls; a single right click is still a push.
- 🔄 **Updates itself, your way.** Install automatically when you are idle, ask first (the default), or never check. It can also start with Windows (off by default; it asks once, politely).

## Using it

| Do this | To get this |
|---|---|
| Sweep the cursor over its head | scratch (the pet is happy, closeness grows) |
| Sweep the cursor over its belly | a belly rub (bliss, or sometimes a playful trap) |
| Click once | a poke |
| Drag | carry it; it lands with a little squash |
| Double-click | open the chat bubble (a scripted "how are you" until it has a brain) |
| Type or click near it | it stays still and quiet, then makes way (walks away) or hops to another row out of the path of your text |
| The tray icon (click: show or hide; right-click: menu) | Settings, Quiet mode, Quit, Show / Hide |
| Type lượn đi (or go away, 消えて) in the chat box | Peak says goodbye, walks to the nearer side edge and leaves for 20 minutes; show it from the tray to call it back at once |
| Double right-click the pet (or type xê ra, move over, どいて) | it steps aside: walks away from the pointer until it is clear, or nods and stays if there is no room |
| Right-click the pet | a push away from the pointer: it staggers and huffs; near the end of a ledge it wobbles and may fall |

On a fresh install the pet shows a four-card tour (replay it in Settings, About).

**Giving it a brain:** try to chat, or click the disabled text box, and the pet asks. Choose "Get a free brain" and follow the steps on the Brain page of Settings: pick Gemini, Claude or OpenAI, open the provider's console, create an API key, paste it, tick "I am 18 or older" and connect. You can pick the model there. Claude and OpenAI need credit on the provider's side; set a low monthly spend limit there. With keys for several brains you choose which one answers.

**Settings** (General, Personality, Brain, Memory, Privacy, About: few, on purpose; how lively Peak is, it decides itself) open from the tray icon menu.

## Removing everything

Uninstall from Windows Settings, Apps. To remove everything: first use Settings, Brain, **Remove key** (keys live in Windows Credential Manager, which an uninstaller does not touch); in the uninstaller tick **Delete the application data** (it removes `%APPDATA%\com.streakboom.app`: the pet's state, its memory and the settings), or delete that folder yourself afterwards. Where the data lives and what each file holds: [`privacy.md`](privacy.md).
