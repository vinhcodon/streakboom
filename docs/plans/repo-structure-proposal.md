# Proposal: the structure of the repository for Windows, macOS and the landing page

**Status:** a proposal written 2026-11-15 for the author to approve; **nothing is moved or changed**. It answers the author's intention to build the next version for macOS and his wish to separate the shared zone from the zones of Windows, macOS and the web landing page. The decision is the author's; an ADR follows his choice. **I have not run or tested anything on macOS; every statement about macOS here comes from general knowledge and is marked "to verify".**

## 1. What the repository is today (measured 2026-11-15)
| Zone | Where | Size | Platform-specific? |
|---|---|---|---|
| The page and the pure logic of the pet | `app/src/` (TypeScript and Svelte: the rig, the lines, the skills, remind, the rules of terrain, the picture and the clear-place rule) | about 17,500 lines, 101 files | **No.** It reaches the system only through Tauri `invoke` commands |
| The Rust core | `app/src-tauri/src/` | about 5,800 lines, 10 files | **Partly.** `brain.rs`, `claude.rs`, `openai.rs`, `groq.rs`, `layout.rs`, most of `updater.rs` are neutral. **About 26 Win32 call sites** are in `lib.rs` (the hit test, the focus probe, the busy state, the covers, the ledges), `ground.rs` (windows under the cat) and `picture.rs` (the screen capture, the capture exclusion) |
| Packaging | `app/src-tauri/tauri.conf.json` (`nsis`, WebView2), `Cargo.toml` (`windows-sys`, `keyring` with `windows-native`) | small | **Yes**, Windows only |
| Release and test scripts | `scripts/release*.ps1`, `ci-release-prepare.ps1`, `test-update/`, `updater-verify/` | about 6,500 lines in all of `scripts/` | Mostly Windows (PowerShell, `windows-latest`) |
| CI | `.github/workflows/ci.yml` and `release.yml` on `windows-latest`; `pages.yml` on `ubuntu-latest` | | Windows, and the site |
| The website | `site/`, `scripts/site/`, `scripts/build-site.mjs`, `_site/` (ignored), `pages.yml` | about 2,900 lines in `site/`; owned by the website session | **No**, but it reads `tauri.conf.json` (the version), `CHANGELOG.md`, the README and `docs/plans/assets/stickers/` |
| The record | `spec/` (19 files, 2,200 lines), `docs/` (about 220 files, 12,000 lines), the charter, the ADRs | | **No** (the documents say "Windows" in many places) |

The one fact that makes a port cheaper than it looks: **the boundary between the pet and the operating system already exists, and it is the list of Tauri commands** (`focus_probe`, `ground_map`, `edge_room`, `vertical_room`, `cover_probe`, `screen_grid`, `is_busy`, `move_by`, `pet_place`, ...). The TypeScript never calls Win32; Rust does.

## 2. What macOS would change (to verify, I have no Mac here)
- **A WebKit view instead of WebView2:** drawing and CSS can differ; `--disable-gpu` does not apply.
- **The window:** a transparent, always-on-top, click-through window; staying over full-screen apps and across Spaces needs window levels and collection behaviours (Tauri may expose part of it; the rest is native code).
- **The senses:** idle time, pointer, the list of windows with their rectangles, the primary button, whether a full-screen program is in front, the caret of the typing lane (an accessibility API with a permission), the capture of the screen for the picture (**the Screen Recording permission**, a visible consent that changes the privacy story of the feature).
- **The tray** becomes a menu bar item; start at login, the key store (the Keychain instead of the Credential Manager), the signature (an Apple developer account, signing and notarization), the updater (Tauri supports it, with a manifest entry per platform).
- **Testing:** CI can build on a macOS runner; behaviour needs a real Mac (the author's hardware, to be confirmed).

## 3. Options
### Option A: change nothing in the layout; add macOS inside the present folders
One `app/src-tauri/src` with `cfg(target_os)` branches growing in `lib.rs`, scripts and docs mixed.
- *For:* no move. *Against:* `lib.rs` (2,100 lines) would take a second set of OS calls; Windows and macOS code interleave; the documents stay "Windows" with macOS as exceptions; CI and scripts have no clear owner by platform. **Not recommended.**

### Option B (recommended): one repository, one app, with a platform layer and named zones; move little, in stages
Keep `app/`, `site/`, `spec/`, `docs/` where they are (other sessions, the website build and the audit use these paths) and **add structure inside them**:
```
app/
  src/                      SHARED  the page and the pure logic (as today)
  src-tauri/
    src/                    SHARED  brain.rs, layout.rs, the neutral part of updater.rs, ...
    src/platform/           the OS boundary: one file per target
      mod.rs                the trait `Platform` (the list of commands the page uses) and the choice by cfg
      windows.rs            WINDOWS  what is in lib.rs, ground.rs and picture.rs today (moved, not changed)
      macos.rs              MACOS    new, starts as stubs that return "unknown", so the pet runs without senses
    tauri.conf.json         SHARED  the common part
    tauri.windows.conf.json WINDOWS nsis, WebView2
    tauri.macos.conf.json   MACOS   dmg, entitlements, Info.plist
scripts/
  windows/                  WINDOWS release.ps1, ci-release-prepare.ps1, test-update, updater-verify (moved)
  macos/                    MACOS   signing and notarization (new)
  site/ , build-site.mjs    WEB     unchanged, owned by the website session
  loop/                     SHARED  the behaviour rounds (the day-run script is Windows only today)
.github/workflows/          ci.yml (a matrix: windows and macos), release-windows.yml, release-macos.yml, pages.yml (web)
docs/
  PROJECT.md charter.md ... SHARED (unchanged)
  platform/windows.md       WINDOWS signing (SignPath), SmartScreen, WebView2, the Win32 senses
  platform/macos.md         MACOS   signing, notarization, permissions, WebKit differences
  plans/ decisions/ ...     SHARED, with a Platform tag (section 5)
site/                       WEB     unchanged
```
- *For:* one place for the shared logic (no fork of the pet), a visible boundary, Windows behaviour unchanged by the move (tests prove it), the website untouched, each platform's scripts and docs have an owner. *Against:* the `platform` trait has to be designed once; a first stage that moves code without changing behaviour.

### Option C: a full monorepo with packages
`packages/core-ts`, `crates/core`, `crates/platform-windows`, `crates/platform-macos`, `apps/desktop`, `apps/site`, workspaces for npm and for Cargo.
- *For:* the clearest separation and the best fit if there will be more apps (a mobile app, a CLI). *Against:* **everything moves**: the website build (`tauri.conf.json`, `CHANGELOG.md`, the stickers path), the audit script, the CI, the release scripts, the ADRs that cite paths, the other sessions' habits. Large cost for two platforms. **Better kept as a later step** if B proves too small.

### Option D: separate repositories per platform
`streakboom-windows`, `streakboom-macos`, `streakboom-site`, with the pet shared as a package.
- *Against:* a shared core copied or published, two release trains, documents split; heavy for a one-author project. **Not recommended.**

## 4. How to work with git (the author wrote "branches")
- **No long-lived branch per platform** (`windows`, `macos`): they drift apart and the shared code diverges. Use **folders for the zones** and **short feature branches** merged to `main`; a macOS spike may live on a branch `macos` for a while, but it merges into `main` early, behind `cfg(target_os)`, so Windows builds are not affected.
- **CI by zone:** path filters so that a change in `site/` runs the site job, a change in `app/src-tauri/src/platform/macos.rs` runs the macOS job, a change in the shared zone runs both.
- **Owners** (the sessions, as `.github/CODEOWNERS` and `AGENTS.md` say today for the site): the website session owns `site/` and `scripts/site/`; a Windows area and a macOS area would be named the same way; the shared zone is the maintainer's.

## 5. Versions, tags, manifests and documents with two platforms
- **One product version.** A tag `vX.Y.Z` builds a matrix (Windows, macOS) and publishes **one release** with both installers; the channels stay (even Stable, odd Preview; spec 16). If macOS lags, the release carries the Windows installer only and says so; the website shows what exists.
- **The manifests** (`updates/latest.json`, `updates/preview.json`) get an entry per platform (the Tauri updater format has `platforms` keys such as `windows-x86_64` and `darwin-aarch64`; to verify). The release scripts change from "one file" to "one entry per platform".
- **Documents:** `docs/platform/windows.md` and `docs/platform/macos.md` hold what is not shared; the specs stay platform neutral with a short platform note where a behaviour differs (`spec/04` gets a section per OS); a new spec 20 would describe the macOS port when it is decided. The registers get a **Platform** column or a prefix: V-n (app), W-n (website) as now, **M-n for macOS checks**. `docs/privacy.md` states per platform what is read (the Screen Recording permission is one).
- **Privacy contract:** a new platform is not a new sense, but the permission prompts of macOS must be written in the same plain words and decided with the author (ADR for the picture and the caret on macOS).

## 6. The stages of Option B (each its own commit, tests green, no behaviour change until stage 4)
1. **Decide** (ADR): the option, the version and tag model, who owns what.
2. **The platform layer:** `platform/mod.rs` with the trait; move the Win32 code of `lib.rs`, `ground.rs`, `picture.rs` into `platform/windows.rs` unchanged; `cargo test` and the 408 JS tests prove the move; a Preview build is checked by the author before it is called equal.
3. **Scripts and CI by zone:** `scripts/windows/`, the workflows split, path filters; the release routine of `docs/releasing.md` updated.
4. **The documents:** `docs/platform/`, the platform column, `PROJECT.md` section 5 and 6, `docs/development.md` layout, `AGENTS.md` and `CODEOWNERS` zones; the audit script learns the new folders.
5. **The macOS spike** (needs a Mac): a window that shows Peak, a tray item, stubs for the senses; then the senses one by one, each with its permission text and an ADR.
6. **The website:** a download choice by platform when a macOS build exists (through the website session).

## 7. What I do not know
Whether Tauri 2 gives enough on macOS for a transparent, click-through, always-on-top window over full-screen apps without native code; which macOS permissions each sense needs in the macOS versions you target; the cost and effort of Apple signing and notarization; whether the author has a Mac for tests; how many macOS users there are for the product. A short spike on a Mac settles the first questions before stage 5 is planned.

## 8. Choices asked of the author
The option (A, B, C or D); the version and tag model (one product version, or independent versions per platform); whether a macOS spike may start on a branch while stages 2 to 4 are done; which Mac and which macOS versions are the targets.
