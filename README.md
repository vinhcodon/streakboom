# Streakboom 🐾

An open-source desktop pet for Windows. Meet **Peak**, a cheerful golden chibi cat inspired by the soft, squishy look of mochi illustrations. Peak lives on top of your screen, reacts to being stroked, poked and carried, says short lines in Vietnamese or English, and keeps you company. It is a companion, not an assistant: it is lovable with no AI at all, and if you give it your own API key (Gemini, Claude or OpenAI) it can also chat and remember a few things about you.

> **Status: closed alpha (v0.1.x), Windows 10/11 only.** The installer is not code-signed yet, so Windows SmartScreen will warn when you run it.

## Meet Peak 🐱

Peak is the name of the character in this project. Your own copy can be given any name: after a day or two the pet asks what you would like to call it, and you can change that, or what it calls you, in Settings, Memory. Peak was designed and drawn for Streakboom (see [Art and credits](#art-and-credits)).

## What it does ✨

- 🐈 **A pet that is alive without any AI.** A mood and closeness model, 182 hand-written lines per language (sarcastic ones can be turned off with "gentle tone"), quiet hours, and no guilt: the pet never dies or starves, it only gets "a bit lonely".
- 👆 **Gestures instead of buttons.** Sweep the cursor over its head to scratch it, over its belly to rub it (it usually loves it; sometimes it is a trap), click to poke, drag to carry it (it hangs by the scruff and leans with your cursor). Its eyes follow your cursor when it is over the pet. It wanders sideways on its own, always stays on screen, and moves like one animal, not a set of pictures.
- 🧠 **Bring your own brain.** Add your own key and double-click the pet to chat. Gemini has a free tier; Claude and OpenAI are paid (a Claude Pro/Team or ChatGPT Plus subscription does not include API access). Some of its unprompted lines are then written by the model, within a daily cap, and each answer comes with a feeling the pet acts out. It answers in the language you write in. Your key stays on your computer.
- 💭 **It remembers a little, and you control it.** A name for the pet, what to call you, a usual part of the day, milestones, and (with a brain, on by default, switchable) a few short facts from your chats. Settings > Memory shows all of it and can forget any part.
- 💚 **Free and open source.** The app costs nothing and the code is under the MIT license. An AI brain is optional and billed by the provider you choose (Gemini has a free tier; Claude and OpenAI are paid). Bug reports and ideas are welcome as GitHub issues.
- 🪶 **Light on your computer.** About 100 to 120 MB of memory across its processes and almost no CPU while it stands still; walking costs a few percent of one core (measured on one machine so far).
- 🤫 **Polite.** It stays quiet in fullscreen apps, during quiet hours and in Quiet mode, and never takes the keyboard focus for plain speech.
- 🔄 **Updates itself, your way.** Install automatically when you are idle, ask first (the default), or never check. It can also start with Windows (off by default; it asks once, politely).

## Getting started 🚀

To use it, follow [Install](#install). To build it or change it, follow [Develop](#develop) (Node.js and Rust; the app is Tauri 2 with SvelteKit, not Python).

## Install 💾

1. Download `Streakboom_<version>_x64-setup.exe` from the [latest release](https://github.com/vinhcodon/streakboom/releases/latest).
2. Run it. If SmartScreen says "Windows protected your PC", choose **More info**, then **Run anyway**. It installs for the current user only (no administrator rights) into `%LOCALAPPDATA%\Streakboom`.
3. Uninstall from Windows Settings, Apps.

Windows needs the WebView2 runtime; the installer downloads it if it is missing.

## Using it 🖱️

| Do this | To get this |
|---|---|
| Sweep the cursor over its head | scratch (the pet is happy, closeness grows) |
| Sweep the cursor over its belly | a belly rub (bliss, or sometimes a playful trap) |
| Click once | a poke |
| Drag | carry it; it lands with a little squash |
| Double-click | open the chat bubble (a scripted "how are you" until it has a brain) |
| Right-click the pet, or the tray icon | Settings, Quiet mode, Quit |

On a fresh install the pet shows a four-card tour (replay it in Settings, About).

**Giving it a brain:** try to chat, or click the disabled text box, and the pet asks. Choose "Get a free brain" and follow the steps on the Brain page of Settings: pick Gemini, Claude or OpenAI, open the provider's console, create an API key, paste it, tick "I am 18 or older" and connect. You can pick the model there. Claude and OpenAI need credit on the provider's side; set a low monthly spend limit there. With keys for several brains you choose which one answers.

**Settings** (General, Personality, Brain, Memory, Privacy, About) open from the tray icon or the pet's right-click menu.

## Privacy and your data 🔒

- Your API keys are stored in the Windows Credential Manager (one entry per brain: `gemini-api-key`, `claude-api-key`, `openai-api-key`, service `streakboom`) and sent only to the provider you chose, in a request header. They are never written to a file or sent to any other window of the app.
- With Google's free tier, what you send may be used and read by Google, and API users must be 18 or older (clients in the EEA, Switzerland and the UK must use paid services). For Claude and OpenAI, what you send goes to Anthropic or OpenAI to be answered; see their terms. The app says so before you connect.
- Chats are kept in memory only. What the pet remembers is stored on your computer in `memory.json`: the names you gave, coarse habit counts (for example how many sessions began in each hour of the day), touch counts, milestones and the short facts it noted from your chats. The facts are sent to the brain you use, together with later chats you start. You can see, edit, delete or switch off all of it in Settings > Memory.
- **Usage stats are off by default.** If you opt in, the app records funnel event names (for example "opened the chat") and timestamps with a random id, in a local queue. Nothing is sent automatically; **Settings, Privacy, Copy stats** puts it on your clipboard so you can share it by hand. Opting out deletes the id and the queue. A second switch, **Daily activity counts**, adds a few numbers per day (scratches, rubs, pokes, messages sent, lines the pet said and you reacted to, minutes the app ran, times Quiet mode was switched on): only counts, never text. Anyone who agreed to the first, narrower wording is asked again and is not counted until they say yes; turning the switch off deletes the numbers. Details: `spec/05-north-star-metrics.md`.
- Files live in `%APPDATA%\com.streakboom.app\`: `state.json` (window position, Quiet mode, the brain in use and the chosen models), `pet.json` (everything else about the pet) and `memory.json` (what it remembers).

## Project layout 🗂️

```
app/                    the application (Tauri 2 + SvelteKit + Svelte 5)
  src/lib/              pure logic and shared code: state model, line selection, gestures,
                        line pools, UI strings, memory (memory.ts, memlines.ts), the cat rig
                        (PetRig.svelte, rig/), window messages (bus.ts)
  src/routes/           the three windows: + page (the pet), bubble/, settings/
  src-tauri/            the Rust core: window control, drag and bubble placement (layout.rs),
                        the brains and credential store (brain.rs, claude.rs, openai.rs),
                        updater (updater.rs)
scripts/                release.ps1 (signed build and update manifest), test-update/ (configs
                        for trying the update flow against a local server)
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
npm test                   # Node tests for the pure logic (src/lib/*.test.ts), 92 tests
npm run check              # svelte-check (types)
cd src-tauri; cargo test   # Rust tests (the three brain clients against a mock server, window geometry), 33 tests
```

```powershell
npm run tauri build -- --no-bundle    # release exe only
npm run tauri build -- --bundles nsis # signed installer (needs the signing key, see below)
```

A first release build compiles all Rust dependencies and takes a while; set `CARGO_TARGET_DIR` to a folder outside the repo to keep that cache between clones.

## Release and auto-update 📦

Updates are signed with a private key that is **not** in this repository (`%USERPROFILE%\.tauri\streakboom-updater.key`); the matching public key is in `app/src-tauri/tauri.conf.json`. Losing the private key means installed copies can never be updated again, so back it up. The app looks for `latest.json` at the address in `app/src-tauri/src/updater.rs`, which points at this repo's latest GitHub release (the repo must stay public for that to work).

To release a version:

1. Bump `version` in `app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.toml` and `app/package.json`. (If you edit these with Windows PowerShell 5.1, do not use `Set-Content -Encoding utf8`: it adds a byte-order mark.)
2. Commit **only the files you changed** (explicit paths, never `git add -A`; see ADR-0023) and push. Release from a clean tree.
3. `.\scripts\release.ps1 -Repo vinhcodon/streakboom -Notes "what changed"` builds the signed installer and writes `dist\latest.json`. Run it with `powershell.exe -File` (inside PowerShell, its native stderr output can abort it).
4. `gh release create v<version> dist\Streakboom_<version>_x64-setup.exe dist\latest.json --repo vinhcodon/streakboom --latest` (not a draft or pre-release, or the app will not find it). `gh` must be on your PATH (`%LOCALAPPDATA%\Programs\GitHub CLI` on the author's machine).

`scripts/test-update/` holds two config overrides for rehearsing the update flow (a version bump and permission for plain HTTP to a local server); the manifest address can be overridden with the `STREAKBOOM_UPDATE_URL` environment variable. An update is only installed if its signature verifies, whatever the address.

## Documentation 📚

The documents are split by the kind of statement they make, so each fact has one home.

| Where | What it is |
|---|---|
| [`spec/`](spec) | **How the product works now.** [`01-product-requirements.md`](spec/01-product-requirements.md) (what it must be), [`02-onboarding-flow.md`](spec/02-onboarding-flow.md) (naive to brained), [`03-naive-pet-design.md`](spec/03-naive-pet-design.md) (the pet, memory, lines), [`04-technical-design.md`](spec/04-technical-design.md) (stack, architecture, brains, data), [`05-north-star-metrics.md`](spec/05-north-star-metrics.md) (Bond Days, specified, not built) |
| [`docs/decisions/`](docs/decisions/README.md) | **What was decided, and why**: one short record per decision, with the alternatives rejected |
| [`docs/hypotheses/`](docs/hypotheses/README.md) | **What we believe but have not proven**, how it would be settled, and the technical assumptions not yet verified |
| [`docs/handoff/`](docs/handoff/README.md) | **Notes passed between sessions**, kept as received, with an index of what became of each |
| [`docs/plans/`](docs/plans/README.md) | **What we will do next**: the roadmap and the plan for each piece of work |
| [`docs/engineering-log.md`](docs/engineering-log.md) | **The history**: spikes, measurements and per-round records, including what was not verified |

[`docs/README.md`](docs/README.md) explains how to keep them in step.

## Roadmap 🧭

Done: the naive pet, the key flow, three brains, memory, gestures, emotional reactions, opt-in stats with Copy stats, the north star counters (Bond Days, released in 0.1.15), the installer and signed auto-update. Next, in order: a first real-key test of the Claude and OpenAI brains, then the closed alpha with a handful of observed first-time users. Open: a place to send stats (or keep Copy stats for the alpha), code signing, crash reporting without content, a macOS port, and testing on more machines (multi-monitor, mixed DPI). The ordered plan is in [`docs/plans/roadmap.md`](docs/plans/roadmap.md).

## Art and credits 🎨

Peak is an original character made for this project. The author chose the "mochi cat" direction from three concept sketches that Claude, an AI assistant made by Anthropic, proposed, and the animation rig (the key poses, the springs and the drawing code) was written with Claude's help. There are no image files: the cat is drawn entirely as vector shapes in code (`app/src/lib/rig/`), so the art is covered by the same MIT license as the code. The style is inspired by mochi and kawaii illustration in general; Peak is not based on any existing character, brand or mascot and is not affiliated with any.

## License 📄

[MIT](LICENSE). Copyright (c) 2026 Vinh Nguyen.
