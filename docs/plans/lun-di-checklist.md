# "Lượn đi": what is still to be seen by the author before it is promoted to Stable

**Status:** written 2026-11-14. It lists what only a person at a real screen can check (V-127, V-128). Each line says what to do and what should happen; report **OK** or **not OK, with what you saw**. Nothing here is claimed as seen until you report it. The build needed is Preview **0.7.6 or later** (the test aids and the no-focus return are in it). Needs a brain connected, because the chat box is where the command is typed.

## How to shorten the waiting (a test aid, not a setting)
Quit Peak from the tray (Quit), then start it from PowerShell with the times shortened (5 to 3600 seconds):

```powershell
$env:STREAKBOOM_AWAY_SECS = "45"; $env:STREAKBOOM_AWAY_RETRY_SECS = "15"; Start-Process "$env:LOCALAPPDATA\Streakboom\streakboom.exe"
```
Close that PowerShell window afterwards (or `Remove-Item Env:STREAKBOOM_AWAY_SECS, Env:STREAKBOOM_AWAY_RETRY_SECS`); Peak started the usual way uses 20 minutes and 5 minutes.

## The checks

| # | Do | Expected | Report |
|---|---|---|---|
| 1 | Type **lượn đi** in the chat box | One short goodbye in a bubble, a nod, a walk to the nearer side edge, then Peak is gone; the chat box closed at once | |
| 2 | Wait for the return (45 s with the aid) | Peak appears at **the same edge**, stretches, says nothing | |
| 3 | While it comes back, be **typing in Notepad** | The letters keep going into Notepad: Peak reappearing must not take the keyboard | |
| 4 | Send it away, then click the **tray icon** (or Show / Hide) before the time | It returns at once, stretches, says nothing | |
| 5 | Send it away, then **start the program again** (the exe) | It returns at once; no second Peak | |
| 6 | Send it away, then play a **full-screen video** before the 45 s | It does **not** reappear while the video is full-screen; it appears within about 15 s after you leave full screen | |
| 7 | Type **lượn đi** and **click or drag Peak** within the first two seconds of the goodbye | It does not leave | |
| 8 | With **Quiet mode on**, type lượn đi | It does not leave (the message goes to the chat) | |
| 9 | **If you have two monitors:** put Peak on the second one, type lượn đi | It walks to the edge of **that** monitor (it does not cross), leaves, and returns there. Also try a scaled display (125 % or 150 %) and a taskbar at the side, if you use them | |
| 10 | Wordings: **lượn đi nào em**, **thôi em đi chỗ khác chơi đi**, **go away please**, **消えて**; then **hôm nay anh đi họp rồi lượn đi chỗ khác**, **mai anh đi vắng** (the last two are only talk) | The first four send it away; the last two do **not**: Peak answers as in an ordinary chat | |
| 11 | Switch the language in Settings to **English** and **Japanese**, send it away in each | The goodbyes read well in both (tell me any line that sounds wrong) | |
| 12 | Close the laptop lid for a minute **while Peak is away** (if you use a laptop), open it again | Peak returns soon after the wake, not a long time later | |
| 13 | Use it for a day at the normal 20 minutes | Does twenty minutes feel right? (too long, too short, fine) | |

## The model test (H20), with your own key
In PowerShell (the key stays in your window; do not paste it anywhere else):

```powershell
$env:STREAKBOOM_HARNESS_PROVIDER = "gemini"; $env:STREAKBOOM_HARNESS_KEY = "<your key>"; cd D:\Claude\projects\streakboom\app\src-tauri; cargo test -- --ignored skill_harness --nocapture
Remove-Item Env:STREAKBOOM_HARNESS_KEY
```
(`gemini`, `groq`, `claude` or `openai`.) It takes about a minute and a half and prints **commands tagged ... of 25, false tags ... of 24**. Tell me those two numbers (and the provider). **Set the number of false tags you can live with before you run it.**

## Then
When the lines above are OK, or their problems are fixed, promotion to Stable 0.8.0 (spec 16) can go ahead.
