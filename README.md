# Streakboom

A small desktop pet for Windows. It lives on top of your screen as a round "mochi cat", reacts to being stroked, poked and carried, says scripted lines in Vietnamese or English, and, if you give it your own Google Gemini API key, you can chat with it.

> **Status: closed alpha (v0.1.x), Windows 10/11 only.** The installer is not code-signed yet, so Windows SmartScreen will warn when you run it.

## What it does

- **A pet that is alive without any AI.** A mood and closeness model, about 170 hand-written lines per language (sarcastic ones can be turned off with "gentle tone"), quiet hours, and no guilt: the pet never dies or starves, it only gets "a bit lonely".
- **Gestures instead of buttons.** Sweep the cursor back and forth over its head to scratch it, click to poke, drag to carry it (it hangs by the scruff and leans with your cursor). It wanders sideways on its own and always stays on screen, even at the very top and bottom.
- **Bring your own brain.** Add a free Gemini API key (from Google AI Studio) and double-click the pet to chat. Some of its unprompted lines are then written by the model, within a daily cap. Your key stays on your computer.
- **Polite.** It stays quiet in fullscreen apps, during quiet hours and in Quiet mode, and never takes the keyboard focus for plain speech.
- **Updates itself, but asks first.** It checks GitHub for a newer signed version and the pet offers to update; it never restarts on its own.

## Install

1. Download `Streakboom_<version>_x64-setup.exe` from the [latest release](https://github.com/vinhcodon/streakboom/releases/latest).
2. Run it. If SmartScreen says "Windows protected your PC", choose **More info**, then **Run anyway**. It installs for the current user only (no administrator rights) into `%LOCALAPPDATA%\Streakboom`.
3. Uninstall from Windows Settings, Apps.

Windows needs the WebView2 runtime; the installer downloads it if it is missing.

## Using it

| Do this | To get this |
|---|---|
| Sweep the cursor over its head | scratch (the pet is happy, closeness grows) |
| Click once | a poke |
| Drag | carry it; it lands with a little squash |
| Double-click | open the chat bubble (a scripted "how are you" until it has a brain) |
| Right-click the pet, or the tray icon | Settings, Quiet mode, Quit |

**Giving it a brain:** try to chat, or click the disabled text box, and the pet asks. Choose "Get a free brain" and follow the steps in the settings window: open Google AI Studio, create an API key, paste it, tick "I am 18 or older", and connect. You can pick the model there (the default is `gemini-3.1-flash-lite`, which answered in about a second when tested).

**Settings** (General, Brain, Privacy, About) open from the tray icon or the pet's right-click menu.

## Privacy and your data

- Your API key is stored in the Windows Credential Manager (entry `gemini-api-key.streakboom`) and sent only to Google, in a request header. It is never written to a file or sent to any other window of the app.
- With Google's free tier, what you send may be used and read by Google, and API users must be 18 or older (clients in the EEA, Switzerland and the UK must use paid services). The app says so before you connect.
- Chats are kept in memory only.
- **Usage stats are off by default.** If you opt in, the app records funnel event names (for example "opened the chat") and timestamps with a random id, in a local queue. Nothing is sent automatically; **Settings, Privacy, Copy stats** puts it on your clipboard so you can share it by hand. Opting out deletes the id and the queue.
- Files live in `%APPDATA%\com.streakboom.app\`: `state.json` (window position, Quiet mode, chosen model) and `pet.json` (everything else).

## Project layout

```
app/                    the application (Tauri 2 + SvelteKit + Svelte 5)
  src/lib/              pure logic and shared code: state model, line selection, gestures,
                        line pools, UI strings, the cat rig (Pet.svelte), window messages (bus.ts)
  src/routes/           the three windows: + page (the pet), bubble/, settings/
  src-tauri/            the Rust core: window control, drag and bubble placement (layout.rs),
                        Gemini client and credential store (brain.rs), updater (updater.rs)
scripts/                release.ps1 (signed build and update manifest), test-update/ (configs
                        for trying the update flow against a local server)
spec/                   the requirements and design documents (see below)
docs/                   engineering-log.md: what was built, measured and learned, in order
```

### How it fits together

Three windows. The small **pet window** owns all state and logic. The **speech-bubble window** (created on demand, destroyed after 45 s idle to save memory) and the **settings window** (a normal window, open only while needed) are views that talk to it through events. Rust drags the pet itself so it can be clamped to the screen, and places the bubble on whichever side of the pet has room. Details: [`spec/04-technical-design.md`](spec/04-technical-design.md).

## Develop

**Prerequisites:** Windows 10/11 with WebView2, [Node.js](https://nodejs.org) 24 or newer (the tests run TypeScript directly), and [Rust](https://rustup.rs) stable (edition 2024, so Rust 1.85 or newer) with the MSVC build tools.

```powershell
cd app
npm install
npm run tauri dev          # run the app with hot reload
```

```powershell
npm test                   # Node tests for the pure logic (src/lib/*.test.ts)
npm run check              # svelte-check (types)
cd src-tauri; cargo test   # Rust tests (Gemini client against a mock server, window geometry)
```

```powershell
npm run tauri build -- --no-bundle    # release exe only
npm run tauri build -- --bundles nsis # signed installer (needs the signing key, see below)
```

A first release build compiles all Rust dependencies and takes a while; set `CARGO_TARGET_DIR` to a folder outside the repo to keep that cache between clones.

## Release and auto-update

Updates are signed with a private key that is **not** in this repository (`%USERPROFILE%\.tauri\streakboom-updater.key`); the matching public key is in `app/src-tauri/tauri.conf.json`. Losing the private key means installed copies can never be updated again, so back it up. The app looks for `latest.json` at the address in `app/src-tauri/src/updater.rs`, which points at this repo's latest GitHub release (the repo must stay public for that to work).

To release a version:

1. Bump `version` in `app/src-tauri/tauri.conf.json`, `app/src-tauri/Cargo.toml` and `app/package.json`. (If you edit these with Windows PowerShell 5.1, do not use `Set-Content -Encoding utf8`: it adds a byte-order mark.)
2. Commit and push.
3. `.\scripts\release.ps1 -Repo vinhcodon/streakboom -Notes "what changed"` builds the signed installer and writes `dist\latest.json`.
4. `gh release create v<version> dist\Streakboom_<version>_x64-setup.exe dist\latest.json --repo vinhcodon/streakboom --latest` (not a draft or pre-release, or the app will not find it).

`scripts/test-update/` holds two config overrides for rehearsing the update flow (a version bump and permission for plain HTTP to a local server); the manifest address can be overridden with the `STREAKBOOM_UPDATE_URL` environment variable. An update is only installed if its signature verifies, whatever the address.

## Documentation

| Document | What it is |
|---|---|
| [`spec/01-product-hypothesis.md`](spec/01-product-hypothesis.md) | The original requirements, hypotheses and decisions log |
| [`spec/02-onboarding-flow.md`](spec/02-onboarding-flow.md) | From a scripted pet to a pet with a brain: screens, messages, funnel events |
| [`spec/03-naive-pet-design.md`](spec/03-naive-pet-design.md) | The no-AI pet: character, mood and closeness model, lines, tone, interactions |
| [`spec/04-technical-design.md`](spec/04-technical-design.md) | Stack, architecture, data and privacy, Gemini integration, decisions, open items |
| [`docs/engineering-log.md`](docs/engineering-log.md) | The spikes, measurements and per-milestone record, including what was *not* verified |

## Roadmap

Done: the naive pet, the key flow, the brained pet, opt-in stats with Copy stats, the installer and signed auto-update. Next: the closed alpha with a handful of observed first-time users. Open: a place to send stats (or keep Copy stats for the alpha), code signing, crash reporting without content, a macOS port, more gestures (belly rub, chasing the cursor), streaming replies, and testing on more machines (multi-monitor, mixed DPI). The full list is in section 8 of the technical design.

## License

[MIT](LICENSE). Copyright (c) 2026 Vinh Nguyen.
