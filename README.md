<p align="center">
  <img src="app/src-tauri/icons/128x128@2x.png" alt="Peak's face, the Streakboom app icon" width="128" height="128">
</p>

<h1 align="center">Streakboom</h1>

An open-source desktop pet for Windows. Meet **Peak**, a cheerful golden chibi cat inspired by the soft, squishy look of mochi illustrations. Peak lives on top of your screen, reacts to being stroked, poked and carried, says short lines in Vietnamese, English or Japanese (Japanese is a beta: written by Claude and not yet read by a native speaker), and keeps you company. It is a companion, not an assistant: it is lovable with no AI at all, and if you give it your own API key (Gemini, Groq, Claude or OpenAI) it can also chat and remember a few things about you.

> **Status: first official release line (v0.3.2), Windows 10/11 only.** Earlier 0.1.x builds were development builds and have been withdrawn. The installer is not code-signed yet, so Windows SmartScreen will warn when you run it. The Groq, Claude and OpenAI brains have not yet been tried with real keys (Gemini has).

🌐 **Website:** [streakboom.com](https://streakboom.com), with the latest download and release notes (Vietnamese and English).

## Meet Peak 🐱

Peak is the name of the character in this project. Your own copy can be given any name: after a day or two the pet asks what you would like to call it, and you can change that, or what it calls you, in Settings, Memory. Peak was designed and drawn for Streakboom (see [Art and credits](#art-and-credits)).

## What Peak promises 🤝

The short version of [`docs/charter.md`](docs/charter.md), which ranks what Peak is for:
- **It never reads what you type or what is on your screen.** It senses only activity (when you last used the keyboard or the mouse, never which keys) and the shape of the screen (where windows are, never what is written in them), in memory, and nothing is sent anywhere.
- **It keeps out of your way.** It is a guest in the corner of a working screen: while you work it stays still and quiet and leaves when it is in the way. It walks, hops, climbs and speaks on its own only when you have stopped for a while, or while you play with it. A fall is rare and always has a cause (you pushed it or let go of it, or the window it sat on went away).
- **It never dies or starves, and it never guilts you.** Neglect only makes it a little lonely.
- **It is alive without any AI, and the key is yours.** Everything lovable works with no brain connected; a brain is optional, billed by the provider you choose with your own key.
- **It is a companion, not an assistant.** It remembers, grows and has its own tastes; it does not draft, summarise, search or fix.

## What it does ✨

- 🐈 **A pet that is alive without any AI.** A mood and closeness model, 267 hand-written lines per language, with stages when you keep poking it (sarcastic ones can be turned off with "gentle tone"), a sleepy night (from 23:00 to 07:00 by the clock it dozes and says nothing on its own), and no guilt: the pet never dies or starves, it only gets "a bit lonely".
- 👆 **Gestures instead of buttons.** Sweep the cursor over its head to scratch it, over its belly to rub it (it usually loves it; sometimes it is a trap), click to poke, drag to carry it (it hangs by the scruff and leans with your cursor). Its eyes follow your cursor when it is over the pet. It wanders on its own (walking, and since 0.2.5 hopping between rows), always stays on screen, and moves like one animal, not a set of pictures.
- 🧠 **Bring your own brain.** Add your own key and double-click the pet to chat. Gemini and Groq have free tiers (with limits); Claude and OpenAI are paid (a Claude Pro/Team or ChatGPT Plus subscription does not include API access). The brains are offered in this order: Gemini, Groq, Claude, OpenAI. Some of its unprompted lines are then written by the model, within a daily cap (60 chat turns and 6 unprompted lines a day; when it has talked enough, Peak says so in its own words and the count resets at midnight), and each answer comes with a feeling the pet acts out. It answers in the language you write in. Your key stays on your computer.
- 💭 **It remembers a little, and you control it.** A name for the pet, what to call you, a usual part of the day, milestones, and (with a brain, on by default, switchable) a few short facts from your chats. Settings > Memory shows all of it and can forget any part.
- 💚 **Free and open source.** The app costs nothing and the code is under the MIT license. An AI brain is optional and billed by the provider you choose (Gemini has a free tier; Claude and OpenAI are paid). Bug reports and ideas are welcome as GitHub issues.
- 🧍 **Out of your way.** While you work, Peak keeps still and quiet: it does not start a walk or speak on its own while you type or use the mouse. If you work right next to it, it makes way (it walks away from your pointer, or yawns and curls up if there is no room; a sleeping Peak wakes and moves if you type right by it). Since 0.2.5 it also guesses where the text you are typing is heading, from where you last clicked and how long you have typed, and hops up or down to another row before the text reaches it. The guess can be wrong, so it sometimes hops when it was not needed; it waits at least 10 seconds between hops.
- 🍃 **Light on your computer.** About 100 to 120 MB of memory across its processes. Processor use, measured on one machine so far: about 4 to 6% of one core while it stands still and a median of about 9 to 11% in normal use (0.3.1 measured the same as 0.3.0); a hop costs about 0.34 seconds of one core. Getting it lower is an open item (`docs/plans/backlog.md`, PR-9).
- 🎭 **It reacts like a cat, in time.** A reaction has a shape: when the window Peak stands on is closed, minimized or dragged away it freezes for a moment, jolts, cries out in a bigger speech bubble and falls to the bottom of the screen; when you poke, scratch or rub it, it moves first and speaks a moment later; repeat the same thing and it gets playful, then a little annoyed, then resigned, then forgives you. Lines are said once each before any repeats, and some use your name, the time or the weekday. Settings, Brain, **What Peak is told** shows, read-only, the notes a brain is given about who Peak is (the safety parts are marked as locked). How it is built: [`spec/09-reactions.md`](spec/09-reactions.md).
- 🤫 **Polite.** It stays quiet in fullscreen apps, at night and in Quiet mode, says nothing on its own while you work (it speaks unprompted only after about 45 seconds without you touching the computer, or while you play with it), and never takes the keyboard focus for plain speech.
- 🔄 **Updates itself, your way.** Install automatically when you are idle, ask first (the default), or never check. It can also start with Windows (off by default; it asks once, politely).

## Getting started 🚀

To use it, follow [Install](#install). To build it or change it, follow [Develop](#develop) (Node.js and Rust; the app is Tauri 2 with SvelteKit, not Python).

## Install 💾

1. Download `Streakboom_<version>_x64-setup.exe` from the [latest release](https://github.com/vinhcodon/streakboom/releases/latest).
2. Run it. If SmartScreen says "Windows protected your PC", choose **More info**, then **Run anyway**. It installs for the current user only (no administrator rights) into `%LOCALAPPDATA%\Streakboom`.
3. Uninstall from Windows Settings, Apps.

GitHub keeps only the latest two releases; the release notes of every version are in [CHANGELOG.md](CHANGELOG.md).

Windows needs the WebView2 runtime; the installer downloads it if it is missing.

## Using it 🖱️

| Do this | To get this |
|---|---|
| Sweep the cursor over its head | scratch (the pet is happy, closeness grows) |
| Sweep the cursor over its belly | a belly rub (bliss, or sometimes a playful trap) |
| Click once | a poke |
| Drag | carry it; it lands with a little squash |
| Double-click | open the chat bubble (a scripted "how are you" until it has a brain) |
| Type or click near it | it stays still and quiet, then makes way (walks away) or hops to another row out of the path of your text |
| The tray icon (click: show or hide; right-click: menu) | Settings, Quiet mode, Quit, Show / Hide |
| Right-click the pet | a push away from the pointer: it staggers and huffs; near the end of a ledge it wobbles and may fall |

On a fresh install the pet shows a four-card tour (replay it in Settings, About).

**Giving it a brain:** try to chat, or click the disabled text box, and the pet asks. Choose "Get a free brain" and follow the steps on the Brain page of Settings: pick Gemini, Claude or OpenAI, open the provider's console, create an API key, paste it, tick "I am 18 or older" and connect. You can pick the model there. Claude and OpenAI need credit on the provider's side; set a low monthly spend limit there. With keys for several brains you choose which one answers.

**Settings** (General, Personality, Brain, Memory, Privacy, About: few, on purpose; how lively Peak is, it decides itself) open from the tray icon menu.

## Privacy and your data 🔒

- Your API keys are stored in the Windows Credential Manager (one entry per brain: `gemini-api-key`, `groq-api-key`, `claude-api-key`, `openai-api-key`, service `streakboom`) and sent only to the provider you chose, in a request header. They are never written to a file or sent to any other window of the app.
- With Google's free tier, what you send may be used and read by Google, and API users must be 18 or older (clients in the EEA, Switzerland and the UK must use paid services). For Groq, Claude and OpenAI, what you send goes to Groq (which runs the model), Anthropic or OpenAI to be answered; see their terms. The app says so before you connect.
- Chats are kept in memory only. What the pet remembers is stored on your computer in `memory.json`: the names you gave, coarse habit counts (for example how many sessions began in each hour of the day), touch counts, milestones and the short facts it noted from your chats. The facts are sent to the brain you use, together with later chats you start. You can see, edit, delete or switch off all of it in Settings > Memory.
- **Usage stats are off by default.** If you opt in, the app records funnel event names (for example "opened the chat") and timestamps with a random id, in a local queue. Nothing is sent automatically; **Settings, Privacy, Copy stats** puts it on your clipboard so you can share it by hand. Opting out deletes the id and the queue. A second switch, **Daily activity counts**, adds a few numbers per day (scratches, rubs, pokes, messages sent, lines the pet said and you reacted to, minutes the app ran, times Quiet mode was switched on): only counts, never text. Anyone who agreed to the first, narrower wording is asked again and is not counted until they say yes; turning the switch off deletes the numbers. Details: `spec/05-north-star-metrics.md`.
- **What Peak notices around it.** To keep out of your way Peak reads only *when* you last used the keyboard or the mouse (one number, never which keys), where the pointer is, and whether the primary mouse button (the one you click with) is pressed (so it remembers where you last clicked and can guess which row you are typing on). Since 0.3.1 it also asks the system what kind of thing is just under its feet (the bare desktop, the taskbar, or some window) and remembers, only while it stands there, an opaque number that says "the same window as a moment ago", so it can notice that the window it stands on was closed, minimized or dragged away. A window's class name is looked at only to tell the desktop and the taskbar from other windows and is dropped at once. When the Start menu or Search is opened over it, it asks the system whether something that it cannot be raised over is at a few points of its body and, if so, hops to the nearest place where nothing is; only "covered or not" at those points is used. It never reads what you type, which keys you press, what is on your screen, window titles or app names. These readings are kept only in memory, are never written to a file or sent anywhere, and are gone when Peak closes.
- **Two optional things, after 0.3.1.** (1) **A short remark after a reaction** (Settings, Brain, on by default): after Peak falls, a connected brain may write one sentence for it; what is sent is only the name of the event (for example `ground_lost`) and five numbers about how it feels, never anything about your windows or screen, and it counts toward the daily limit of unprompted lines. (2) **A coarse picture of where windows are** (Settings, Privacy, **on** by default since ADR-0044; switch it off there): when Peak is about to move it may check a grid of 16 by 9 squares and note whether each is the bare desktop, the taskbar or some window; it is kept in memory only, never saved or sent, and has no titles, names or contents. Peak uses it only to look for the top edge of a window it could hop up onto and sit on; it does that rarely (at most once in five minutes) and only when it is calm.
- Files live in `%APPDATA%\com.streakboom.app\`: `state.json` (window position, Quiet mode, the brain in use and the chosen models), `pet.json` (everything else about the pet) and `memory.json` (what it remembers).

## Project layout 🗂️

```
app/                    the application (Tauri 2 + SvelteKit + Svelte 5)
  src/lib/              pure logic and shared code: state model, line selection, gestures,
                        line pools, UI strings, memory (memory.ts, memlines.ts), the cat rig
                        (PetRig.svelte, rig/), window messages (bus.ts), focus-safety (focus.ts),
                        walk easing (gait.ts), hops and falls (hop.ts), the typing lane (lane.ts)
  src/routes/           the three windows: + page (the pet), bubble/, settings/
  src-tauri/            the Rust core: window control, drag and bubble placement, monitor geometry
                        (layout.rs), the focus probe (idle time, pointer, primary mouse button), flights of the
                        window (lib.rs), the brains and credential store (brain.rs, claude.rs, openai.rs),
                        updater (updater.rs)
scripts/                release.ps1 (signed build and update manifest), test-update/ (configs
                        for trying the update flow against a local server); build-site.mjs,
                        site-dev.mjs, gen-assets.html and site/ (the website builder, see Website below)
site/                   the website sources: text (strings.mjs), style, scripts, assets; the pages are built from them into _site/ (git-ignored) and served at streakboom.com
assets/                 peak-icon-1024.png, the source of the app icon (npm run tauri icon); the README shows
                        its 256 px frame, app/src-tauri/icons/128x128@2x.png
updates/                latest.json, the update manifest the app reads first
spec/                   how the product works now (see below)
docs/                   the record around it: decisions/, hypotheses/, handoff/, plans/, engineering-log.md
```

### How it fits together

Three windows. The small **pet window** owns all state and logic. The **speech-bubble window** (created on demand, destroyed after 45 s idle to save memory) and the **settings window** (a normal window, open only while needed) are views that talk to it through events. Rust drags the pet itself so it can be clamped to the screen, and places the bubble on whichever side of the pet has room. Details: [`spec/04-technical-design.md`](spec/04-technical-design.md).

## Develop 🛠️

**Prerequisites:** Windows 10/11 with WebView2, [Node.js](https://nodejs.org) 24 or newer (the tests run TypeScript directly), and [Rust](https://rustup.rs) stable (edition 2024, so Rust 1.85 or newer) with the MSVC build tools.

```powershell
cd app
npm install
npm run tauri dev          # run the app with hot reload
```

```powershell
npm test                   # Node tests for the pure logic (src/lib/*.test.ts), 245 tests
npm run check              # svelte-check (types)
cd src-tauri; cargo test   # Rust tests (the four brain clients against a mock server, window and monitor geometry, the focus probe, the ground sense, the persona layers and reaction cards, the activity and monitor events), 73 tests
```

```powershell
npm run tauri build -- --no-bundle    # release exe only
npm run tauri build -- --bundles nsis # signed installer (needs the signing key, see below)
# (a test build with the debug port, to drive the app from the debugger: window.__pet.hop(dx, dy), .fall(d), .perch(map), .perchPretend())
```

A first release build compiles all Rust dependencies and takes a while; set `CARGO_TARGET_DIR` to a folder outside the repo to keep that cache between clones.

## Release and auto-update 📦

Updates are signed with a private key that is **not** in this repository (`%USERPROFILE%\.tauri\streakboom-updater.key`); the matching public key is in `app/src-tauri/tauri.conf.json`. Losing the private key means installed copies can never be updated again, so back it up. The app looks for `latest.json` at the address in `app/src-tauri/src/updater.rs`, which points at this repo's latest GitHub release (the repo must stay public for that to work).

To release a version:

1. Bump `version` in `app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.toml` (and its `Cargo.lock` entry) and `app/package.json`. (If you edit these with Windows PowerShell 5.1, do not use `Set-Content -Encoding utf8`: it adds a byte-order mark.) Add the release notes to `CHANGELOG.md` as `## x.y.z (YYYY-MM-DD)` followed by lines starting with `- `: the website reads that format (ADR-0028) and the script refuses to publish without it. If the release changes behavior the website describes (limits, key storage, update modes, status wording such as which brains were tried with real keys or code signing), update this README and tell the website session.
2. Commit **only the files you changed** (explicit paths, never `git add -A`; see ADR-0023) and push. Release from a clean tree.
3. `.\scripts\release.ps1 -Repo vinhcodon/streakboom -Notes "what changed" -Publish` builds the signed installer, writes `dist\latest.json` and publishes: it needs a clean git tree and `gh` logged in (on the author's PATH via `%LOCALAPPDATA%\Programs\GitHub CLI`). It creates the release as a draft with the installer, points the manifest at the installer through the GitHub API, uploads the manifest, publishes the release as the latest, and commits and pushes the same manifest as `updates/latest.json`. Afterwards it deletes every release older than the previous one, with its tag, and any left-over draft (GitHub keeps the newest two; the notes of all versions stay in `CHANGELOG.md`). Run it with `powershell.exe -File` (inside PowerShell, native stderr output can abort it). Without `-Publish` it only builds, and you upload the two files from `dist\` by hand.
4. Check that `https://raw.githubusercontent.com/vinhcodon/streakboom/main/updates/latest.json` shows the new version (it can lag a few minutes), that the installer address in it downloads without signing in to a file identical to `dist\Streakboom_<version>_x64-setup.exe`, and that GitHub has exactly the newest two releases.
5. **After every release, do all of these (ADR-0033):**
   - **Audit the documents** for consistency and integrity: run `node scripts/audit-docs.mjs --js <JS tests> --rust <Rust tests>` (links, indexes, versions, retired names, test counts) and read the specs, the plans, the ADR statuses and the backlog and roadmap progress for statements that are now out of date (a "not built" that is built, a count, a date). Fix what you find in the same commit.
   - **Refresh this README** with what is new (features, privacy, numbers, the roadmap) and check the icon at the top.
   - **Check the names** (the author's GitHub display name is **Vinh Codon**; the repository owner is `vinhcodon`): `LICENSE`, this file, the specs, and anything the website session owns (the audit script lists `site/` hits instead of editing them).
   - **Hand the website session a prompt** (`docs/handoff/website-release-prompt.md` is the template; fill it for the new version) and give it to the author to paste. It always asks the website session to bring the site in line with this README and `CHANGELOG.md`, and to propose a site structure that is friendly to search engines (SEO) and to AI answer engines (GEO).
   - Record what was **not** verified in the engineering log and in `docs/plans/verification-debt.md`.

The app reads the manifest from that repository copy first and from the release asset second, because on 2026-11-08 GitHub's public release-download path returned 504 for hours while the API and raw files worked (ADR-0025). Copies installed before that change read only the release asset and need one manual install to get it.

`scripts/test-update/` holds two config overrides for rehearsing the update flow (a version bump and permission for plain HTTP to a local server); the manifest address can be overridden with the `STREAKBOOM_UPDATE_URL` environment variable (one address, or several separated by commas, tried in order). An update is only installed if its signature verifies, whatever the address.

## Website 🌐

The website is a set of static pages with no framework, built by `scripts/build-site.mjs` into `_site/` and served by GitHub Pages (ADR-0034): a home page and a privacy page in English (`/`, `/privacy/`), Vietnamese (`/vi/`, `/vi/privacy/`) and Japanese (`/ja/`, `/ja/privacy/`, ADR-0035; the app itself has no Japanese), a changelog (`/changelog/`, English), `404.html`, `sitemap.xml`, `robots.txt`, `llms.txt` and `llms-full.txt`. Every fact is in the HTML itself, so no script is needed to read it: the version comes from `app/src-tauri/tauri.conf.json`, the release notes from `CHANGELOG.md`, the text from `site/strings.mjs`. The download button always points at the latest release page (GitHub keeps only the two newest releases, so the site never links to a version-specific file). On phones and non-Windows computers the download is replaced by "send the link to my PC".

- **A release redeploys the site by itself.** `.github/workflows/pages.yml` also runs when `CHANGELOG.md`, `updates/latest.json` or `tauri.conf.json` change, so a new release needs no change to the site as long as `CHANGELOG.md` has its entry (`## x.y.z (date)` then `- ` lines; the release script requires one).
- **The build checks the site and fails (nothing is deployed) when:** the `tauri.conf.json` version is not the newest `CHANGELOG.md` entry or differs from the one in the JSON-LD, `llms.txt` or the page; the FAQ in JSON-LD differs from the visible FAQ; an `hreflang` pair is not reciprocal or a canonical link is missing; a page has no single `h1`, an image has no `alt` or an internal link is broken; the facts are missing from the static HTML; the sitemap misses a page; or a retired name or an unbacked claim appears ("almost no CPU", "hand-drawn", a macOS or code-signing promise, "Peak sees what you do"). The checks are tested: `node --test scripts/site/`.
- **Where to edit:** the text of all three languages in `site/strings.mjs` (the build fails if a language lacks a key or a placeholder); the page layouts, structured data and crawler files in `scripts/site/` (`pages.mjs`, `files.mjs`, `checks.mjs`); the style in `site/style.css`; the scripts in `site/app.js` and `site/peak.js`.
- **Peak on the page is the app's own cat.** The build turns `app/src/lib/rig/*.ts` into browser JavaScript in `site/peak/` (generated, git-ignored), so the page cannot drift from the app. Needs Node 22.13 or newer. For that the three rig files may only use TypeScript syntax that can be erased (no `enum`, `namespace` or constructor parameter properties) and may import only each other (`import type` from `../sprites.ts` is fine); a test in `app/src/lib/rig.test.ts` checks it. The interactive Peak starts after the first paint and plays "a day of Peak" by itself with a caption for each scene (`site/scenes.js`, sequenced by `site/tour.js`, ADR-0036): it stops when the visitor acts, hovers or presses Pause, and settles into standing still after two rounds; with "reduce motion" set it does not move by itself.
- **Preview:** `node scripts/site-dev.mjs`, then open `http://localhost:4173`. It builds like the deploy and rebuilds on every page request; a failed check is shown as text.
- **Icons and share image:** with the preview running, open `http://localhost:4173/__gen` and press Save all. It redraws `site/assets/` (favicon, touch icon, header logo, share image) and `assets/peak-icon-1024.png` from the rig.
- **Domain:** `streakboom.com` (registered at name.com). DNS: four `A` records (185.199.108.153, .109.153, .110.153, .111.153) and four `AAAA` records (2606:50c0:8000::153 to 8003::153) for the root, and a `CNAME` for `www` to `vinhcodon.github.io`. The custom domain and Enforce HTTPS are set in the repository's Settings, Pages. `www` and the old `vinhcodon.github.io/streakboom` address redirect to `https://streakboom.com/`.
- **Share previews:** Facebook and Zalo cache the title and image of a link. After changing `site/assets/og-image.jpg` or a page title, press Scrape Again in the Facebook Sharing Debugger.

## Documentation 📚

The documents are split by the kind of statement they make, so each fact has one home.

| Where | What it is |
|---|---|
| [`spec/`](spec) | **How the product works now.** [`01-product-requirements.md`](spec/01-product-requirements.md) (what it must be), [`02-onboarding-flow.md`](spec/02-onboarding-flow.md) (naive to brained), [`03-naive-pet-design.md`](spec/03-naive-pet-design.md) (the pet, memory, lines), [`04-technical-design.md`](spec/04-technical-design.md) (stack, architecture, brains, data), [`05-north-star-metrics.md`](spec/05-north-star-metrics.md) (Bond Days, specified, not built), [`06-character-and-movement.md`](spec/06-character-and-movement.md) (character, movement and focus-safety; focus-safety, hops, falls, perches and climbing are built; favourite places are not), [`07-terrain-and-attention.md`](spec/07-terrain-and-attention.md) (the desktop as a cost field; the monitors, hops, the typing lane are built, the rest was folded into spec 10), [`08-perception.md`](spec/08-perception.md) (Peak's senses; decisions recorded, mostly built), [`10-terrain-model.md`](spec/10-terrain-model.md) (the desktop as terrain, version 2: surfaces from regions with identity, walls and climbing, falls to the plane below; decided, partly built), [`09-reactions.md`](spec/09-reactions.md) (how Peak expresses what happens: events, appraisal, beats, words, and the persona made visible; decided and built), [`11-restraint-play-and-the-charter.md`](spec/11-restraint-play-and-the-charter.md) (restraint: falls only when pushed or when the seat goes, a tempo ladder, three attention modes, and the audit of the current state; decided, not built) |
| [`docs/charter.md`](docs/charter.md) | **What Peak is for, in order of priority**: eight ranked principles with a test each, "few settings", and the manners that are the unwritten law (ADR-0047) |
| [`docs/decisions/`](docs/decisions/README.md) | **What was decided, and why**: one short record per decision, with the alternatives rejected |
| [`docs/hypotheses/`](docs/hypotheses/README.md) | **What we believe but have not proven**, how it would be settled, and the technical assumptions not yet verified |
| [`docs/handoff/`](docs/handoff/README.md) | **Notes passed between sessions**, kept as received, with an index of what became of each |
| [`docs/plans/`](docs/plans/README.md) | **What we will do next**: the roadmap, the backlog and the plan for each piece of work, and the list of what is built but not yet checked |
| [`docs/engineering-log.md`](docs/engineering-log.md) | **The history**: spikes, measurements and per-round records, including what was not verified |

[`docs/README.md`](docs/README.md) explains how to keep them in step; [`CHANGELOG.md`](CHANGELOG.md) has the release notes of every version.

## Roadmap 🧭

**Shipped.** 0.2.0: the naive pet, the key flow, three brains, memory, gestures, emotional reactions, opt-in stats with Copy stats and the Bond Days counters, the installer and signed auto-update with fallbacks. 0.2.1 to 0.2.3: the daily chat cap in the pet's own voice, a much lighter redraw (the median processor use fell from about 17% to about 9% of one core). 0.2.4: focus-safety (Peak keeps still and quiet while you work and makes way), a real wake-up stretch, a cat-like gait. 0.2.5: hops between rows and the typing lane (Peak leaves the path of your text). 0.3.0: Japanese (a beta, the third language), Groq as the fourth brain, and Peak notices before it makes way (it looks toward your work, ears up). 0.3.1: Peak no longer drops by itself, it startles and falls when the window it stands on goes, its words follow its body, repeated pokes and rubs go through stages, more varied lines, and Settings shows what Peak is told. 0.3.2: Peak perches on the edges of windows (by hopping, or by walking to the wall and climbing, and climbs down), looks over an edge and never walks off it, falls to the window below and not always to the floor, hops out from under the Start menu and Search, can be teased at an edge (a wobble, then it catches itself or is knocked off) and falls if you let go of it in the air; it is calmer while you work (walks, perches and lines wait until you have stopped for about 45 seconds, or you play with it) and sleepy from 23:00 to 07:00; **Settings lost Chattiness and Quiet hours** (Peak decides; if you had chosen Quiet it stays silent on its own); the ground map is on by default; the model can add one remark after a fall.

**Next.** More lines and a way to draft them (the line factory is built; the author runs it), an editable voice, a native reader for the Japanese and English text (the beta label comes off after that), and the checks that need other machines or people: the Groq, Claude and OpenAI brains with real keys, a second and a lower-end computer, several monitors and display scales, and a handful of observed first-time users. **Open:** a lower processor target (the floor is about 4% with software drawing), a place to send stats (or keep Copy stats), code signing, crash reporting without content, and a macOS port. The ordered plan is in [`docs/plans/roadmap.md`](docs/plans/roadmap.md), the stories in [`docs/plans/backlog.md`](docs/plans/backlog.md), and everything built but not yet checked in [`docs/plans/verification-debt.md`](docs/plans/verification-debt.md).

## Art and credits 🎨

Peak is an original character made for this project. The author chose the "mochi cat" direction from three concept sketches that Claude, an AI assistant made by Anthropic, proposed, and the animation rig (the key poses, the springs and the drawing code) was written with Claude's help. The cat is drawn entirely as vector shapes in code (`app/src/lib/rig/`); the few image files (the app icon, the website's icons and share image) are generated from that code, so the art is covered by the same MIT license as the code. The style is inspired by mochi and kawaii illustration in general; Peak is not based on any existing character, brand or mascot and is not affiliated with any.

## License 📄

[MIT](LICENSE). Copyright (c) 2026 Vinh Codon.
