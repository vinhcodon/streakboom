# ADR-0132: One repository with a platform layer and named zones for Windows, macOS and the web

- **Status:** accepted on 2026-11-15 (the author chose Option B of `docs/plans/repo-structure-proposal.md` and the answers below). **Nothing is moved yet**; the stages are done one by one, each on the author's order.
- **Date:** 2026-11-15
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Decision
1. **Option B:** one repository, one app. `app/`, `site/`, `spec/` and `docs/` stay where they are (the website build, the audit script and the other sessions use these paths). Structure is added inside: `app/src-tauri/src/platform/` (a trait for the commands the page uses; `windows.rs` holds the Win32 code moved from `lib.rs`, `ground.rs` and `picture.rs` unchanged; `macos.rs` begins as stubs that return "unknown"), `tauri.windows.conf.json` and `tauri.macos.conf.json` beside the common `tauri.conf.json`, `scripts/windows/` and `scripts/macos/` (the shared `scripts/loop/` and the website's `scripts/site/` stay), `.github/workflows` split by zone with path filters, `docs/platform/windows.md` and `docs/platform/macos.md`.
2. **One product version and one release with both installers.** A tag `vX.Y.Z` builds Windows and macOS; if macOS lags, the release carries the Windows installer only and says so. The channels stay (even Stable, odd Preview, spec 16). The update manifests get an entry per platform.
3. **The macOS spike comes after stage 2** (the platform layer is in and the Windows behaviour is proven unchanged), on a short branch that merges early into `main` behind `cfg(target_os)`. No long-lived platform branch.
4. **The target is a Mac with Apple Silicon** (the author has one; the macOS version is still to be given). An Intel build and the oldest macOS supported are open.
5. **Not decided:** Option C (a full monorepo) stays a possible later step if B proves too small; the permissions of macOS for the picture, the caret of the typing lane and the key store each need their own ADR and the privacy texts in plain words.

## Consequences
The stages are RS-2 to RS-6 of E32. The documents get a platform tag (M-n for the macOS checks); `AGENTS.md`, `CODEOWNERS` and the audit script learn the zones at stage 4. Nothing about macOS has been tried; the statements in the proposal about macOS are to be verified on the Mac.

## Progress
- **Stage 2 (platform layer), 2026-11-15:** built, in Preview 0.11.11.
- **Stage 3 (scripts and CI), 2026-11-21, in part:** the Windows scripts are in `scripts/windows/` with one-line stubs at the old paths; the release workflow calls the new path; `ci.yml` has a `macos` job (compile only); `Cargo.toml` has the Keychain and the private API for macOS and `tauri.macos.conf.json` the matching flag. **Not done:** `tauri.windows.conf.json` (the bundle settings stay in `tauri.conf.json` until a macOS distribution), path filters, `scripts/macos/` (nothing to distribute yet). **The author chose** to do stage 3 before trying macOS, to open a Claude Code session on his Mac for the macOS code, and a short branch `macos-spike`; the first milestone is M0 (the app opens on the Mac with a transparent Peak window).
