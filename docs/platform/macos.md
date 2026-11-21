# Streakboom on macOS (a working document of the spike)

**Status:** started 2026-11-21 (ADR-0132; the author has a Mac with Apple Silicon and develops and tries it on his own machine first). Nothing here is verified on a Mac yet: **everything in the "to verify" columns comes from general knowledge, not from a run.** The session on the Mac keeps this file true as it learns; the facts stay here, the choices go to ADRs and the checks to `docs/plans/verification-debt.md` (prefix **M-n** for the macOS checks).

## Scope of the spike (not distribution)
Run on the author's Mac, from source (`npm run tauri dev`). **Not in scope now:** signing, notarization, a `dmg`, the auto-update, the CI release, a download on the website (each comes with the first distribution; Apple Developer account and the oldest macOS supported are open).

## The boundary
Everything the program asks of the system goes through `app/src-tauri/src/platform/`: `windows.rs` (done) and `macos.rs` (stubs that say "unknown"; the contract is in `mod.rs`). The page (TypeScript) is shared and calls only Tauri commands. A macOS function is done when it replaces its stub, has a test where one can exist, and has a line in the table below.

## Milestones
| | Milestone | Done when |
|---|---|---|
| M0 | Compiles and opens | `cargo check` and `npm run tauri dev` work on the Mac; the Peak window is transparent and visible; the key store is the Keychain (not the mock) |
| M1 | The window behaves | always on top, clicks pass through the transparent part, no Dock icon (a menu bar item), shown on every Space and over full-screen apps, drag and the chat and settings windows work |
| M2 | The senses (one at a time) | idle time and the primary button; the list of windows for the ground; busy (full-screen, presenting); the picture of the screen (**the Screen Recording permission**; the Settings switch stays off by default; needs its own ADR and text) |
| M3 | The comparison | a table of what behaves the same, differently or not yet |

## What is known to differ, and what to try (all to verify on the Mac)
| Contract function | Windows today | macOS idea (to verify) |
|---|---|---|
| `busy_now` | `SHQueryUserNotificationState` | a window that covers the screen, or `NSApplication` presentation options; the session locked: the lock state |
| `primary_button_raw` | `GetAsyncKeyState` | `NSEvent.pressedMouseButtons` or `CGEventSourceButtonState` |
| `last_input_idle_ms` | `GetLastInputInfo` | `CGEventSourceSecondsSinceLastEventType` (no permission needed) |
| `timer_period` | `timeBeginPeriod` | nothing to do |
| `show_without_activating` | `SW_SHOWNOACTIVATE` | `orderFrontRegardless`, no activation |
| `ground_of_point`, `window_id_at`, `window_holds` | the window at a point, its handle, its rectangle | `CGWindowListCopyWindowInfo`: the rectangles and layers need no permission; **titles and owner names are not read** (the privacy contract) |
| `cover_at`, `raise_own` | topmost windows that hide Peak | window levels (`NSWindow.level`), Spaces collection behaviour |
| `capture_gray_with` | GDI `StretchBlt` | Core Graphics or ScreenCaptureKit; **Screen Recording permission** |
| `set_capture_exclusion` | `SetWindowDisplayAffinity(0x11)` | `NSWindow.sharingType = .none` |
| key store | Credential Manager (`keyring`, `windows-native`) | Keychain (`keyring`, `apple-native`, set in `Cargo.toml`) |
| transparent window | works | needs `macOSPrivateApi` (set in `tauri.macos.conf.json`, with the `macos-private-api` feature of `tauri`) |

## What the session found (append here, dated)
_Nothing yet._
