# Handoff: start the macOS spike on the author's Mac (a request to a Claude Code session running on the Mac)

**From:** the app session (Windows), 2026-11-21, by the author's order (ADR-0132). **Status:** a request; nothing was run on a Mac.

## Read first
`AGENTS.md`, `docs/PROJECT.md`, `docs/charter.md`, **`docs/platform/macos.md`** (the milestones and what to try), `docs/plans/repo-structure-proposal.md`, ADR-0132, `app/src-tauri/src/platform/mod.rs` (the contract).

## Rules that do not change
Commit explicit paths, never `git add -A`. Do not push, tag, release or publish unless the author orders it. Never ask for, print or store an API key or the updater key. The privacy contract: Peak senses shapes and activity, never meaning (no window titles, no screen contents); a new sense or permission is a decision (an ADR, plain-words text). Say what was not verified and put it in `docs/plans/verification-debt.md` with the prefix **M-n** for macOS checks. Do not edit `site/` or `scripts/site/` (the website session). The next ADR number: check `docs/decisions` **and** `origin/main` (other sessions write ADRs).

## Branch
A short branch `macos-spike` from `main`, merged early into `main` behind `cfg(target_os = "macos")` so that the Windows build is never touched. Everything for macOS lives in `app/src-tauri/src/platform/macos.rs`, `tauri.macos.conf.json`, `Cargo.toml` (the `cfg(target_os = "macos")` table) and `docs/platform/macos.md`. Do not change `windows.rs` or shared code except to make it compile, and say so in the commit.

## First milestone: M0 (the author wants to see it first)
1. Prerequisites: Xcode Command Line Tools, Rust (the stable toolchain for `aarch64-apple-darwin`), Node 24 or newer.
2. `cd app && npm install`; `cd src-tauri && cargo check` (this closes V-169 if it is green; if it fails, fix what fails and write it down).
3. `npm run tauri dev -- --features terrain-overlay` (the feature lets the tray open the layer for testers; not needed for M0).
4. Done when: the app opens, **the Peak window is transparent** and visible, the settings window opens, and the key store is the Keychain (check that a saved key survives a restart; the `keyring` crate uses a mock store if no native one is compiled in, which is why `apple-native` was added). Never type a real key into a test; use a throwaway string for the store test, or ask the author.
5. Back up the author's data folder before the first run if there is one (`~/Library/Application Support/com.streakboom.app/`); Peak writes there.

## What was done on Windows and is NOT verified on a Mac
`Cargo.toml` (`keyring` with `apple-native`, `tauri` with `macos-private-api`), `tauri.macos.conf.json` (`macOSPrivateApi`), and the `macos` job of `.github/workflows/ci.yml` were written without a Mac. The tauri-build check that the feature and the config agree is expected to pass on macOS; if it does not, fix both together. The stubs of `macos.rs` compile and are exercised on Windows only.

## Then
M1 (the window behaves), M2 (the senses one by one, the picture last because of the Screen Recording permission), M3 (a comparison table) as in `docs/platform/macos.md`. Report to the author after each milestone, and append what you found to the last section of that file.
