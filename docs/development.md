# Developing Streakboom

How the repository is laid out, how to run and test it, and how the three windows fit together. For the rules of contributing see [`CONTRIBUTING.md`](../CONTRIBUTING.md); for what the product is and why, [`PROJECT.md`](PROJECT.md).

## Project layout

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
                        site-dev.mjs, gen-assets.html and site/ (the website builder, see website.md); audit-docs.mjs
                        (checks that the documents agree) and line-report.mjs (how often each line is seen)
site/                   the website sources: text (strings.mjs), style, scripts, assets; the pages are built from them into _site/ (git-ignored) and served at streakboom.com
assets/                 peak-icon-1024.png, the source of the app icon (npm run tauri icon); the README shows
                        its 256 px frame, app/src-tauri/icons/128x128@2x.png
updates/                latest.json, the update manifest the app reads first
spec/                   how the product works now (see below)
docs/                   the record around it: PROJECT.md (start here), charter.md, decisions/, hypotheses/, foundation/, handoff/, plans/, engineering-log.md
.github/                issue forms, the pull request template, CODEOWNERS and the workflows (pages.yml deploys the site, ci.yml checks pull requests)
AGENTS.md, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md   for AI assistants and contributors
```

### How it fits together

Three windows. The small **pet window** owns all state and logic. The **speech-bubble window** (created on demand, destroyed after 45 s idle to save memory) and the **settings window** (a normal window, open only while needed) are views that talk to it through events. Rust drags the pet itself so it can be clamped to the screen, and places the bubble on whichever side of the pet has room. Details: [`spec/04-technical-design.md`](../spec/04-technical-design.md).

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
cd src-tauri; cargo test   # Rust tests (the four brain clients against a mock server, window and monitor geometry, the focus probe, the ground sense, the persona layers and reaction cards, the activity and monitor events)
```

```powershell
npm run tauri build -- --no-bundle    # release exe only
npm run tauri build -- --bundles nsis # signed installer (needs the signing key, see below)
# (a test build with the debug port, to drive the app from the debugger: window.__pet.hop(dx, dy), .fall(d), .perch(map), .perchPretend())
```

A first release build compiles all Rust dependencies and takes a while; set `CARGO_TARGET_DIR` to a folder outside the repo to keep that cache between clones.
