<p align="center">
  <img src="app/src-tauri/icons/128x128@2x.png" alt="Peak's face, the Streakboom app icon" width="128" height="128">
</p>

<h1 align="center">Streakboom</h1>

<p align="center"><b>A small desktop pet for Windows. Meet Peak, a golden mochi cat that keeps you company and stays out of your way.</b></p>

<p align="center">
  <a href="https://github.com/vinhcodon/streakboom/releases/latest"><img alt="latest release" src="https://img.shields.io/github/v/release/vinhcodon/streakboom"></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/github/license/vinhcodon/streakboom"></a>
  <img alt="Windows 10 and 11" src="https://img.shields.io/badge/platform-Windows%2010%2F11-blue">
  <img alt="Tauri 2, Rust and Svelte 5" src="https://img.shields.io/badge/built%20with-Tauri%202%20%C2%B7%20Rust%20%C2%B7%20Svelte%205-orange">
</p>

<p align="center">
  <a href="https://streakboom.com">Website</a> ·
  <a href="https://github.com/vinhcodon/streakboom/releases/latest">Download</a> ·
  <a href="CHANGELOG.md">Changelog</a> ·
  <a href="docs/PROJECT.md">Project guide</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

> **Status: first official release line (v0.6.0), Windows 10/11 only.** Earlier 0.1.x builds were development builds and have been withdrawn. The installer is not code-signed yet, so Windows SmartScreen will warn when you run it. The Groq, Claude and OpenAI brains have not yet been tried with real keys (Gemini has).

Peak lives on top of your screen, reacts to being stroked, poked and carried, perches on the edges of your windows, says short lines in Vietnamese, English or Japanese (Japanese is a beta: written by Claude and not yet read by a native speaker), and keeps you company. It is a companion, not an assistant: it is lovable with no AI at all, and if you give it your own API key (Gemini, Groq, Claude or OpenAI) it can also chat and remember a few things about you.

Streakboom is made for adults (18+). Peak is a small friend that makes the workday lighter; it is not a health product and makes no claim to treat or heal anything. If you need help now, please reach your local emergency number or a person you trust.

## Why it might interest you

- **Local-first and bring-your-own-key.** No account, no server of ours, no hosted inference, no telemetry unless you opt in. Your API key stays in the Windows Credential Manager.
- **A small, honest stack.** Tauri 2 (Rust) with SvelteKit and Svelte 5 in TypeScript, about 100 to 120 MB across its processes, the cat drawn as vector shapes in code with a spring-driven rig.
- **Behaviour you can read.** The pet is a deterministic model (mood, closeness, attention modes, a cost field over your windows) with no AI needed; every decision is a short record in [`docs/decisions/`](docs/decisions/README.md) and every behaviour has a spec in [`spec/`](spec).
- **Built in the open with AI help.** The author works with Claude; the process, the evidence and the rules for contributors are all in the repository ([`docs/PROJECT.md`](docs/PROJECT.md)).

## Install

1. Download `Streakboom_<version>_x64-setup.exe` from the [latest release](https://github.com/vinhcodon/streakboom/releases/latest).
2. Run it. If SmartScreen says "Windows protected your PC", choose **More info**, then **Run anyway**. It installs for the current user only (no administrator rights) into `%LOCALAPPDATA%\Streakboom`. Windows needs the WebView2 runtime; the installer downloads it if it is missing.
3. Uninstall from Windows Settings, Apps. To remove everything, see [Removing everything](docs/features.md#removing-everything).

GitHub keeps only the latest two releases; the release notes of every version are in [CHANGELOG.md](CHANGELOG.md).

## Code signing policy

**The installers are not code-signed yet.** We are preparing to apply for free code signing from [SignPath.io](https://signpath.io) (certificate by [SignPath Foundation](https://signpath.org)), which needs releases built automatically in public CI. What is signed, by whom, how, and what the program does on your computer: [`CODE_SIGNING.md`](CODE_SIGNING.md). Team: Vinh Codon ([@vinhcodon](https://github.com/vinhcodon)) is the author, reviewer and approver. Privacy: [`docs/privacy.md`](docs/privacy.md). The dependencies and their licenses: [`docs/dependency-licenses.md`](docs/dependency-licenses.md).

## What Peak promises

The short version of [`docs/charter.md`](docs/charter.md), which ranks what Peak is for:

- **It never reads what you type or what is on your screen.** It senses only activity (when you last used the keyboard or the mouse, never which keys) and the shape of the screen (where windows are, and whether something is just under its feet: the bare desktop, the taskbar or some window, never what is written in it), in memory, and nothing is sent anywhere.
- **It keeps out of your way.** It is a guest in the corner of a working screen: while you work it stays still and quiet and leaves when it is in the way. It walks, hops, climbs and speaks on its own only when you have stopped for a while, or while you play with it. A fall is rare and always has a cause (you pushed it or let go of it, or the window it sat on went away).
- **It never dies or starves, and it never guilts you.** Your absence costs nothing: it sleeps while you are away and is glad when you are back.
- **It is alive without any AI, and the key is yours.** Everything lovable works with no brain connected; a brain is optional, billed by the provider you choose with your own key.
- **It is a companion, not an assistant.** It remembers, grows and has its own tastes; it does not draft, summarise, search or fix.

## Highlights

- **Alive without any AI.** A mood and closeness model and 263 hand-written lines per language, with stages when you keep poking it, a sleepy night (23:00 to 07:00 it dozes and says nothing on its own), and "gentle tone" for those who prefer no sarcasm.
- **Gestures, not buttons.** Sweep the cursor over its head to scratch it, over its belly to rub it (usually bliss, sometimes a trap), click to poke, drag to carry it, right-click to push it, double-click to chat.
- **It lives on your desktop.** It wanders, hops between rows, hops onto and climbs the edges of your windows, looks over an edge, falls to the window below if its seat goes away, and gets out from under the Start menu.
- **Bring your own brain.** Gemini and Groq have free tiers (with limits); Claude and OpenAI are paid. Daily caps keep it frugal; it answers in the language you write in.
- **It remembers a little, and you control it.** Settings, Memory shows everything and can forget any part.
- **Light on your computer.** About 100 to 120 MB of memory across its processes. Processor use, measured on one machine so far: about 4 to 6% of one core while it stands still and a median of about 9 to 11% in normal use; getting it lower is an open item.
- **Free and open source.** MIT licensed. Updates are signed; you choose to install automatically, to be asked (the default), or never.

All of it in detail, with the gestures table and how to give it a brain: [`docs/features.md`](docs/features.md). What it reads, keeps and sends: [`docs/privacy.md`](docs/privacy.md).

## Build from source

Prerequisites: Windows 10/11 with WebView2, [Node.js](https://nodejs.org) 24 or newer (the tests run TypeScript directly) and [Rust](https://rustup.rs) stable with the MSVC build tools. The app is Tauri 2 with SvelteKit, not Python.

```powershell
cd app
npm install
npm run tauri dev          # run the app with hot reload
npm test                   # the pure logic (src/lib/*.test.ts)
npm run check              # svelte-check (types)
cd src-tauri; cargo test   # the Rust core
```

More in [`docs/development.md`](docs/development.md) (layout, windows, release builds) and [`docs/releasing.md`](docs/releasing.md).

## Roadmap

Released so far: **0.2** the naive pet, the key flow, memory, gestures, signed auto-update; **0.2.4 and 0.2.5** focus-safety and hops; **0.3.0** Japanese (beta) and Groq; **0.3.1 and 0.3.2** reactions, perching and climbing on windows, calmer behaviour; **0.4.0** aligned with the research in [`docs/foundation/`](docs/foundation/README.md) (your absence costs nothing, no streak, for adults, safety rules in chat); **0.4.1** one Peak at a time and a tray menu in your language.

Next (roadmap version 2): the checks that need other machines (the Groq, Claude and OpenAI brains with real keys, a lower-end computer, several monitors) and small steps on how Peak notices and answers. A closed alpha with a handful of observed adults, and an application for free code signing, come last, when the author calls them, and before anything public. The ordered plan is in [`docs/plans/roadmap.md`](docs/plans/roadmap.md), the stories in [`docs/plans/backlog.md`](docs/plans/backlog.md) and what is built but not yet checked in [`docs/plans/verification-debt.md`](docs/plans/verification-debt.md).

## Contributing

Bug reports, ideas and pull requests are welcome: read [`CONTRIBUTING.md`](CONTRIBUTING.md) first (it is short). New here, or an AI assistant? Start with [`docs/PROJECT.md`](docs/PROJECT.md), then [`AGENTS.md`](AGENTS.md). Security issues: [`SECURITY.md`](SECURITY.md). Everyone is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Documentation

| Where | What it is |
|---|---|
| [`docs/PROJECT.md`](docs/PROJECT.md) | **Start here:** the whole project on a few pages (mission, strategy, state, architecture, rules, where everything is) |
| [`docs/`](docs/README.md) | The map: charter, decisions, hypotheses, plans, the evidence ([`foundation/`](docs/foundation/README.md)), handoffs, the engineering log |
| [`spec/`](spec) | How the product works now |
| [`CHANGELOG.md`](CHANGELOG.md) | The release notes of every version |

## Art and credits

Peak is an original character made for this project. The author chose the "mochi cat" direction from three concept sketches that Claude, an AI assistant made by Anthropic, proposed, and the animation rig (the key poses, the springs and the drawing code) was written with Claude's help. The cat is drawn entirely as vector shapes in code (`app/src/lib/rig/`); the few image files (the app icon, the website's icons and share image) are generated from that code, so the art is covered by the same MIT license as the code. The style is inspired by mochi and kawaii illustration in general; Peak is not based on any existing character, brand or mascot and is not affiliated with any.

## License

[MIT](LICENSE). Copyright (c) 2026 Vinh Codon.
