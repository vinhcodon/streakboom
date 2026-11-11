# Release 0.3.2: the draft (nothing is published; the author orders the release)

**Status:** prepared 2026-11-11. The website session finished the Stickers page and said the app session may release; the CHANGELOG entry, the README (a section "What Peak promises", Roadmap, status line), the version files (0.3.2) and the website prompt (`docs/handoff/website-release-prompt.md`) were filled the same day and committed as "Prepare 0.3.2". **Nothing is published until the author orders it** (`scripts/release.ps1 ... -Publish`).

## What is in it
Everything committed since 0.3.1: epic E14 (the desktop as terrain, version 2), epic E15 (restraint, play and the charter), the model's remark after a reflex and the percept events (E12, E10), and the line factory (an author tool, nothing for the user). The documents behind it: `spec/10`, `spec/11`, `docs/charter.md`, ADR-0043 to ADR-0047.

## The changelog entry (to paste into `CHANGELOG.md` as `## 0.3.2 (date)` at release)
- Peak sits and climbs on the edges of your windows. It hops up to the top edge of a window, or walks to the side of a window and **climbs** it (new climbing and clinging poses), and climbs down again. At the end of a ledge it never walks off: it stops, crouches and looks over the edge (new pose), then turns back, sits there with its paws over the edge, or climbs down. This uses the coarse picture of where windows are (a grid of squares; which window is which is only an anonymous number; kept in memory, never saved or sent), which is now **on by default** (Settings, Privacy, switch it off there). A dialog in front of a full-screen window is a ledge too.
- When the window under it goes away, Peak now falls to the window or ledge below it, not always to the bottom of the screen.
- When the Start menu or Search opens over Peak (windows it cannot be raised over), it hops out from under them instead of staying hidden. To do this it asks the system whether something is covering a few points of its body, nothing more.
- You can tease it: poke Peak when it sits near the end of a ledge and it wobbles; four times in five it catches itself, otherwise it is knocked off the ledge and falls beside the wall, and for ten minutes afterwards it keeps away from edges. **If you let go of Peak while carrying it above the floor, it now falls** (before, it stayed where you let go); on a ledge it stays.
- Peak is calmer while you work: it starts a walk, a hop up to a ledge or a line of its own only after you have not touched the computer for about 45 seconds, or while you are playing with it (a touch starts play for two minutes). When the window under it is closed while you are working it still falls, but silently, with no cry. The cry is no longer written in bold.
- Settings: **Chattiness** and **Quiet hours** are gone. Peak decides how much to say by itself: about one line every 10 to 15 minutes, only when you are not working, and from 23:00 to 07:00 by the clock it is sleepy and says nothing on its own. **If you had chosen "Quiet" at Chattiness, Peak stays silent on its own** (touch it to hear it); custom quiet hours are replaced by the night rule; Quiet mode in the tray menu is unchanged.
- After a reflex (the fall), a connected brain may add one short remark (Settings, Brain, on by default); only the name of the event and five numbers about how it feels are sent.
- Measured on one computer (with the author at the keyboard), the processor use is the same as in 0.3.1 within the noise of the machine (medians of 9 to 14% of one core in both).
- Not yet tried: the new poses and the walls with real windows on other machines, the Start menu on Windows 11, several monitors, an old settings file with custom quiet hours.

## The README
Add a short section "What Peak promises" (the charter's articles 1 to 4 in plain words; `docs/charter.md` is the source), the new behaviour in "What it does", and move "Built since 0.3.1" into "Shipped". The privacy bullets already name the grid, the window number and the covered-or-not touch.

## Version files to bump (a clean tree under `app/`, `scripts/`, `updates/`)
`app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.toml` (and `Cargo.lock`), `app/package.json` (and the lock). Then `scripts/release.ps1 -Repo vinhcodon/streakboom -Notes "..." -Publish` with `$env:PATH += ";$env:LOCALAPPDATA\\Programs\\GitHub CLI"`, the key at `~\.tauri\streakboom-updater.key` (never typed or shown). The release routine of ADR-0033 runs after: audit the documents, refresh README and the icon, check the name Vinh Codon, refill `docs/handoff/website-release-prompt.md`, record what is unverified.

## What the website session is told (to put into the release prompt)
The ground map is on by default and what it is; perches by hop or climb and the climb down; the fall to the plane below; getting out from under Start and Search (only covered or not); the push, the teeter and the drop; the calm (free after 45 s, play after a touch, a silent fall in work); Chattiness and Quiet hours are gone and the night is 23:00 to 07:00; the cry is not bold; the model's remark. The site already shows a distilled charter (ADR-0048). **The website session must not claim more than the app does:** "the attention is theirs" is now true to the degree of CH-2 and CH-3 (45 s, silent fall), still not measured on other machines.

## Checks before the order (2026-11-11)
- JS 245 tests, Rust 73 tests, `svelte-check` clean, the document audit clean apart from files of the sticker session.
- CPU against 0.3.1: three A/B rounds; the first found a real cost (the Start menu check, now in the Rust thread) and a wrong baseline (the git tag `v0.3.1` is not the release commit 8b4fe43); the last round: equal within the noise (engineering log 2026-11-11).

## Not verified (goes into `verification-debt.md` at release)
Other machines and several monitors; Windows 11 Start; the feel of 45 s and 90 px and 10 to 15 minutes; the old settings file; the climb and the edge in a day of real use; the cost of a walk on a ledge (the seat is checked every 0.2 s).
