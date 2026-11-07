# Tauri Technical Plan (Alpha 1.0)

Status: draft from general knowledge of Tauri 2; items marked **[verify]** must be confirmed with a spike before committing.

## 1. Stack
- **Shell:** Tauri 2 (Rust core + system webview). Windows: WebView2. macOS: WKWebView.
- **Frontend:** TypeScript + a light framework (Svelte or Preact recommended for small bundle; React is fine if the team knows it). Rendering: sprite sheets via CSS/canvas.
- **Rust side:** window control, OS credential store, HTTP calls to Gemini, local state persistence, system signals (idle time, battery, fullscreen detection).
- **Targets:** Windows 10/11 first, macOS second. Linux out of scope.

## 2. Architecture

```
Frontend (webview)            Rust core
- Pet renderer + animation    - Window manager (transparent, on-top, click-through regions)
- Bubble UI, menu, settings   - Credential store (keyring)
- Line selector (pure TS)     - Gemini client (reqwest)
- State machine (mood etc.)   - State store (JSON file in app data dir)
        ^  invoke / events  ^  - System probes (idle, battery, fullscreen)
                              - Telemetry client (opt-in, funnel only)
```

Principle: the API key never reaches the frontend after saving. The frontend calls a Rust command such as `chat(message)`; Rust reads the key from the credential store and calls Google directly. This keeps the key out of webview memory/devtools and avoids CORS and CSP issues.

## 3. Key technical risks and spikes

| # | Risk | Spike |
|---|---|---|
| 1 | Transparent frameless window renders correctly on Windows 10/11 and macOS (macOS needs the private API option for transparency, which affects App Store distribution) **[verify]** | Minimal app: transparent, always-on-top, draggable sprite |
| 2 | Click-through: transparent areas must not block clicks to apps underneath, while the pet itself stays clickable. Approach: toggle `set_ignore_cursor_events` based on cursor hit-testing against the sprite bounds **[verify]** | Prototype hit-test loop; measure latency and flicker |
| 3 | Memory budget. The spec target of <40MB RAM is likely unrealistic with a webview: WebView2 runs as separate processes and typically adds well above 40MB in total. Measure real total (all processes) before promising any number **[verify]** | Measure private working set of app + msedgewebview2 children, idle for 10 min |
| 4 | Idle CPU. Animation loop must be cheap: cap at ~15–24 fps, pause when pet is asleep, use sprite sheets not DOM-heavy animation | Profile idle CPU on a mid-range laptop |
| 5 | Fullscreen/meeting detection for quiet mode. Windows has a documented user-notification-state API that reports fullscreen/presentation; macOS has no equivalent as direct **[verify]** | Test on both OSes; fall back to a manual "quiet" toggle |
| 6 | Credential store: use a keyring library (OS Credential Manager / Keychain) rather than a custom encrypted file **[verify]** which Tauri plugin or crate is maintained | Save, read, delete key; test on a clean user profile |
| 7 | Auto-start and updates. Tauri has an updater plugin; requires signing keys; installers need code signing to avoid SmartScreen warnings, which hurts mass-market install conversion | Decide before public alpha |

Run spikes 1–3 first. If spike 3 shows the footprint is unacceptable, reconsider the shell before building features.

### Spike M0 results (Windows 11-class machine, WebView2 157, release build, 300x300 window)
Code: `spike/` (Tauri 2 + Svelte, Rust cursor hit-test thread, keyring).

| Check | Result |
|---|---|
| Transparent, frameless, always-on-top window | Works (confirmed visually by user) |
| Drag and drop of the pet | Works |
| Click-through outside the pet via 40 ms cursor polling | Works; the Rust process itself uses ~1% CPU |
| Windows Credential Manager save/read/delete (keyring crate 3.x) | Works |
| Memory, app + 6 WebView2 processes | ~116-121 MB private; `spike.exe` alone ~5 MB private / ~24 MB working set. The "<40MB" target is not achievable with a webview; plan around ~120 MB total |
| Idle CPU, static sprite | ~1.6% of one core |
| Idle CPU, continuous CSS bob animation (ease-in-out) | ~72% of one core, almost all in the WebView2 GPU process |
| Idle CPU, same animation as 8 steps per 2 s (~4 fps) | ~39% of one core |

Findings:
1. Continuous animation on a transparent window is very expensive here (GPU process). The cost does not scale down proportionally with fps, so a per-frame fixed cost seems dominant. Not yet explained.
2. Rust-side logic (hit-test, keyring) is negligible.
3. Memory target should be restated as ~120 MB total (all processes) for the Windows alpha.

#### Spike M0b: sprite sheet, window size, GPU flags (single 20 s samples, release build, idle)

| Variant | CPU (one core) | Private MB |
|---|---|---|
| Static sprite | 0.3-1.6% | ~121 |
| Canvas, 12 fps | 19.5% | ~121 |
| CSS sprite sheet, 12 fps, 300x300 window | 18.2% | ~127 |
| CSS sprite sheet, 12 fps, 140x140 window | 20.2% | ~124 |
| CSS sprite sheet, 4 fps, 140x140 window | 20.2% | ~127 |
| CSS sprite sheet, 12 fps, GPU disabled (`--disable-gpu`) | 4.8% | ~95 |
| CSS sprite sheet, 4 fps, 140x140, GPU disabled | 2.9% | ~102 |
| CSS sprite sheet, 12 fps, vsync/frame-rate limit disabled | 6.8% | ~125 |

Findings:
1. Sprite sheets (canvas or CSS) cost about the same as each other (~18-20%), much less than the ease-in-out bob (72%) but far from free.
2. Neither fps (4 vs 12) nor window size (300x300 vs 140x140) changed the cost. Any ongoing repaint on the transparent window seems to pay a mostly fixed GPU-process cost.
3. Disabling GPU acceleration in WebView2 (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--disable-gpu`) cut CPU to ~3-5% and saved ~25 MB private memory. Software rendering of a 120x120 sprite is cheap. This is the most promising fix. Caveats: single samples on one machine; the vsync-flag result (6.8%) is unexplained; other GPU flags untested.
4. Static idle remains ~0-2%, so "animate only when needed" still helps on top of any flag.

#### Spike M0c: flag configured in `tauri.conf.json`
Window config key (Windows only): `"additionalBrowserArgs": "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --disable-gpu"`. Setting it replaces wry's default `--disable-features=...` list, so that list is repeated explicitly. Confirmed from Tauri source; verified at runtime that WebView2 processes carry the flag.

| Variant (flag from config, no env var) | CPU (one core) | Private MB |
|---|---|---|
| CSS sprite sheet 12 fps, run 1 / 2 / 3 | 5.6% / 4.9% / 5.9% | 95-100 |
| Canvas 12 fps | 6.6% | ~100 |

Result: repeatable ~5-6% CPU with an animating pet, down from ~19%, and ~95-100 MB total. Suggested alpha targets: **<=120 MB total memory, <=7% CPU while animating, ~0-2% while idle** on this machine.

Follow-ups before M1:
- Re-measure on a second, lower-end machine, including one with an integrated GPU only.
- Check visual quality/tearing with GPU disabled and with a larger/animated pet.
- Keep the design rule: pet is fully static (no repaint) while idle or asleep.

## 4. Milestones

**M0: Spikes (1 week):** transparency, click-through, memory/CPU measurement, keyring.

**M1 status (done on the author's Windows machine; user confirmed pet, tray and drag work visually):** project in `app/` (Tauri 2 + Svelte 5, build with `CARGO_TARGET_DIR` pointing at `spike/src-tauri/target` to reuse compiled dependencies). Implemented: 200x200 transparent window with GPU disabled; placeholder procedural cat sprites (idle, look, walk, sleep, held, happy); behavior state machine (idle ~static, random look/walk/sleep, click reaction, drag = held); walking along the work area via a Rust `move_by` command clamped per monitor; tray icon with Show/Hide, Quiet mode, Quit; position and quiet flag persisted to `%APPDATA%\com.streakboom.app\state.json` and validated against connected monitors at startup; adaptive hit-test polling (30 ms near the window, 150 ms otherwise). Measured: ~3.7% CPU average over 90 s with random behavior mix (streakboom.exe itself ~1.6%), ~104 MB private memory. Not yet verified: multi-monitor and mixed-DPI behavior, tray menu by eye, behavior on a second machine.

**M5 remainder: copy stats and more lines (built; not yet released or seen in the window):** Settings > Privacy has a "Copy stats" button (only when the user opted in) that puts the recorded funnel events on the clipboard as JSON (`{app, version, installId, events:[{e,t}]}`), so alpha testers can hand them over without any server; nothing is sent automatically. The scripted line pool grew from about 58 to 168 per language (a second batch in `lines.ts` with ids that do not change the old ones): more greetings by closeness tier, returns, mornings, nights, "you have sat long" nudges, idle lines per mood band, pokes, head-scratch reactions, "how are you" per band, milestones, brain and gesture hints. About 14% are sarcastic (marked `~`, hidden in gentle tone), the rest warm or playful. Tests check size, no repeated text, a 110-character limit for bubbles, a sarcasm share between a few lines and 40%, parity between languages and gentle-tone coverage for every tier and mood. The "snack" and "play" pools are still unused (no buttons any more); a future belly-rub or chase gesture can reuse them. Not done: a sending backend for telemetry (still the open choice of analytics service), the belly-rub and cursor-chase gestures.

**Releases and auto-update (built, published and exercised end to end once):** installers are signed NSIS builds (`bundle.createUpdaterArtifacts`) distributed through GitHub Releases of the public repo `vinhcodon/streakboom` (the repo was private at first; a private repo makes `releases/latest/download/...` return 404 for the app, so it was made public). The app checks `UPDATE_URL` (`updater.rs`) a minute after start and every 6 hours, only offers an update through the pet (never installs by itself), snoozes "Later" for a day per version, and verifies the installer's signature against the public key in `tauri.conf.json` before installing. The private signing key (no password) lives outside the repo at `~\.tauri\streakboom-updater.key`; losing it means installed copies can never be updated again. To release: bump `version` in `tauri.conf.json`, commit and push, run `scripts\release.ps1 -Repo vinhcodon/streakboom`, then `gh release create v<version>` with the installer and `latest.json` from `dist\` (not draft, not pre-release, or `latest` will not find it). Gotchas found: PowerShell 5.1 `Set-Content -Encoding utf8` writes a BOM that breaks the manifest (the script writes UTF-8 without BOM); a local `git ls-remote` can succeed on a private repo because it uses stored credentials. Verified: a safe test (manifest fetched, offer shown, download attempted and failed cleanly against a missing file); the published manifest and installer download anonymously and match local files byte for byte (SHA256 5A55A047...ECD2). End-to-end test (2026-11-08): a 0.1.0 build running from a temp folder found the published v0.1.1, the pet offered it, and after the author clicked "Update" the installer verified the signature, installed 0.1.1 to `%LOCALAPPDATA%\Streakboom` (current-user, no UAC), registered an uninstall entry (version 0.1.1) and relaunched the app by itself, within about 70 s of the offer; the old process was gone, and pet data (`pet.json`), prefs, chosen model and the API key in the Windows credential store were intact. Not observed: what the pet showed during the download (the author did not report it), the failure path with a bad signature, and an update from a build installed by the installer (the tested 0.1.0 was a loose exe). A version cannot update to an older or equal one. Another trap met during the test: editing JSON/TOML with PowerShell 5.1 `Set-Content -Encoding utf8` adds a BOM; rewrite such files without one.

**Character and animation, round D (built; not yet seen in motion in the real window by the author):** the placeholder blob and its sprite sheets were replaced by the "mochi cat" (author's choice from three concepts): `app/src/lib/Pet.svelte` is a layered vector rig (head, ears, eyes with highlights, blush, belly, tail, legs) animated with CSS, so one source covers every pose and colors and shapes are parameters. Views: front (idle, look, think, happy, land), side (walk: diagonal leg pairs swing, body bobs, head nods, tail wags, flipped by direction), hanging (held: swings around the scruff, leans with the cursor via a `tilt` angle computed from drag speed, wide eyes, small "o" mouth, drooping tail, sweat drop) and curled (sleep, floating z's). New poses: `think` (head tilt, eyes up, pulsing dots; used while waiting for an answer, replacing the old "look") and `land` (squash when put down). To keep CPU near zero, standing still has no continuous animation, only short blink and tail-twitch bursts every few seconds; one-shot poses are timed by the page (`ONE_SHOT_MS` in `sprites.ts`). Honored `prefers-reduced-motion`. Checked on a contact sheet of every pose in a browser, and that each pose runs its expected animations (idle none). Not measured: CPU and memory with the rig in the real window (walking repaints a 120 px region), and how it feels. Also changed in this round: the answer in the bubble now appears word by word with a fade (110 ms per word, longer pauses after punctuation, capped at 6 s for long answers, left-aligned, instant with reduced motion; `src/lib/reveal.ts`, 3 tests), replacing the fast per-character typewriter the author found tiring. Real streaming from the API (showing words as they arrive) is not done: the answer is requested whole.

**Window architecture rework (built after the second review; not yet tried in the real windows by the author):** the author's review found: the chat bubble looked like a text box and gave no sign of waiting; walking and being picked up were not visible actions; settings and the key flow crammed into a tiny panel; the pet could be dragged off the right or bottom edge (bubble then clipped) and could not reach the top of the screen; the pet needed a cuter design. Root cause of the position bugs: a 260x340 window with the pet at its bottom (so the OS drag could never raise the pet above 220 px) and an unclamped OS drag. Decisions (author chose a separate bubble window, a right-click menu in addition to the tray, the mochi-cat direction, and layout first): three windows. (1) `main` is 140x140 and holds only the pet; dragging is ours (`drag_start/drag_move/drag_end` in Rust read the cursor and clamp the whole pet into the work area of the monitor under the cursor; walking uses the same clamp), so the pet reaches every edge and cannot leave. (2) `bubble` is a second transparent topmost window created at startup, hidden until needed; the page measures its content and calls `bubble_fit`, Rust sizes it and places it above, else below, right or left of the pet, always inside the work area, and moves it with the pet; plain speech is click-through and non-focusable so it never steals focus from the app being typed in, interactive views (chat, ask, consent) take focus. Geometry is pure and tested in `src-tauri/src/layout.rs` (7 tests). One bubble morphs: compose, then "thinking" (user's line small above, animated dots, slow-network hint after 8 s, pet looks up), then the answer typed in place at constant size. (3) `settings` is a normal window opened on demand from the tray or the pet's right-click menu (and destroyed when closed, so no memory while closed); it holds General, Brain (the whole key flow, model choice, remove key) and Privacy. The API key is typed there and goes only to Rust and the OS credential store; it is never sent to another window. The pet window remains the only owner and writer of state: other windows send actions or patches by events (`src/lib/bus.ts`). The ask card is now a bubble with two buttons; "Yes" opens the settings window on the Brain section. Extra memory cost: one more webview for the bubble (to be measured). Verified: Rust tests (15 pass), Node tests (33 pass), svelte-check clean, and each page in a browser at its real size with a mocked bridge and an in-page event bus (bubble views and sizes, typing without resizing, ask card actions, settings flow, key not leaking to other windows, drag, click-after-drag suppression, right-click labels). Not verified: real multi-window behavior (placement near edges and across monitors, focus behavior, z-order, the native right-click menu, DPI), and memory/CPU with three webviews. Not done yet: new character art and animation (walk cycle, picked-up pose), tracked as round D.

**Interaction redesign, round 1 (built; not yet tried in the real window by the author):** the author found the 5-button menu clumsy, so it was replaced by gestures (decisions: settings via tray plus a gear in the chat bubble; round 1 = head scratch and poke; belly rub with an occasional "trap" and cursor-following eyes are round 2; the pet hints at gestures over time). `app/src/lib/gestures.ts` is a pure detector (direction reversals plus path length inside a 1.3 s window, head/belly zone by height, 4.5 s cooldown) with 8 tests; it is fed `pointermove` on the sprite only while no button is held, so it never conflicts with dragging. Double-click now opens a single bubble: scripted "how are you" without a brain, a focused chat box with one. Tray menu gained "Settings…". Verified at 260x340 in a browser with a mocked Tauri bridge using synthetic pointer events: head sweep fires once, belly sweep and button-held sweep do not. Not verified: feel and thresholds with a real mouse and real sprite art (zones assume the head is above 55% of the sprite height), and the tray item. Telemetry decision: defer sending until after the interaction redesign; a "copy stats" button is the likely alpha mechanism.

**M4 status (built; connect and model choice confirmed with a real key by the author, proactive AI lines and caps not yet observed live):** daily caps (60 chat turns, 6 proactive AI lines per local day, independent, reset at midnight) and a 2-minute cooldown after a 429, all kept in `pet.json` (`ai` block). About half of proactive lines are AI-written when a brain is connected; any failure silently falls back to a scripted line. Per request timeout 20 s; no same-model retry: on a timeout or 5xx the client lists the key's models and fails over to the next best one, remembering it if it works. **Measured finding that changed the design:** with a real key, the newest full Flash models (`gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-flash-latest`) timed out at 25-40 s or returned 503 "high demand", while `gemini-3.1-flash-lite` answered in ~1 s (`3.5-flash-lite` 3.7 s, `3.6-flash` 7 s, `3.5-flash` 8.8 s). Default is now `gemini-3.1-flash-lite`, and automatic selection prefers lite models. The user can pick a model when connecting (list fetched once the key is typed), sees the model in use in Settings, and can change it (stored in `state.json`). Connect UX: two-page guide so every page fits the 210 px panel, spinner with seconds and a slow-network hint after 8 s, friendly error with collapsed technical details and a copy button, native right-click menu suppressed except in inputs and selectable text. UI was reviewed at 260x340 in a browser with a mocked Tauri bridge (not in the real window); the author reports remaining layout issues, deferred. Settings is still one long scrolling panel. Not done: the compiler warning in the Rust lib has not been read; `.claude/launch.json` was added for UI previews.

**M3 status (done; the author connected successfully with a real key after the fixes above):** `app/src-tauri/src/brain.rs` is a `generateContent` client (stateless; chosen over the stateful Interactions API) with the key in the OS credential store and sent only in the `x-goog-api-key` header; errors map to kinds (invalid key, rate limit, network, region, blocked, empty, server, model, storage). The first default model (`gemini-3.8-flash`, from Google docs) turned out to be overloaded in practice; see the M4 status above for the current default. UI: ask card (triggered by trying to type, or 3 menu opens; max 3 asks, "Later" snoozes 2 days), guide panel with 18+ checkbox and the free-tier data-use notice, key paste with verification (the verification call returns the pet's first AI line), basic one-to-one chat (last 8 turns, in memory only), replace/remove key in settings, and funnel `track()` call sites (no-op until M5). Tests: 8 Rust tests against a mock HTTP server (`cargo test`) and 17 Node tests. Window enlarged to 260x340 for the guide panel. Resource check, release build: ~5.7 MB exe, ~95 MB private memory, ~3% average CPU in per-process samples. Open legal/product points from Google's terms: free-tier data may be used and human-reviewed; API users must be 18+; clients serving the EEA, Switzerland and the UK must use paid services only.
**M2 status (done; user confirmed bubble, menu and settings work visually):** window enlarged to 260x260 to fit speech bubble and menu. Pure TypeScript core in `app/src/lib` (`state.ts` mood/closeness/streak/settings, `selector.ts` line picking with tags, cooldown window and gentle tone, `lines.ts` starter pools, `ui.ts` strings) covered by 15 Node tests (`node --test src/lib/pet.test.ts`). Rust: `load_pet`/`save_pet` (atomic write of `pet.json`), `is_busy` (Windows `SHQueryUserNotificationState`: fullscreen, presentation mode, locked). UI: speech bubble, double-click menu (pet, snack, play, say hi, settings), disabled free-text box with hint, settings panel (language, chattiness, gentle tone, quiet hours), proactive lines on a 10-15 min (normal) or 4-7 min (chatty) timer, suppressed in tray Quiet mode, quiet hours, fullscreen/presentation, while dragged, or while a panel is open. Starter line set is about 58 per language, not the 150 target. Measured: ~1.8% CPU average over 90 s, ~101 MB private memory. Not done: system idle-time reactions, battery reactions, hiding the pet over fullscreen apps, weekday/holiday lines, real art.

**M1: UI shell:** pet window, drag and drop, idle/walk/sleep sprites, always-on-top, tray icon (show/hide, quiet, quit), position memory, multi-monitor handling, DPI scaling.

**M2: Naive pet:** state model (mood, closeness), local persistence, line selector with cooldowns, bubble UI, bubble menu, quiet hours, proactive rate limiting, VI/EN line pools.

**M3: Onboarding and BYOK:** brain-request trigger, guide panel, key paste and verify, credential store, error mapping to pet voice, fallback to naive mode when the key fails, delete-key.

**M4: Brained pet:** Rust Gemini client, system prompt, conversation context window (small, in memory), response length cap, daily cap on proactive calls, timeout and retry policy, rate-limit handling.

**M5: Telemetry and packaging:** opt-in consent, funnel events, installer (MSI/NSIS, DMG), code signing, updater, crash reporting that excludes content.

**M6: Closed alpha:** 5–10 observed first-time users, then a wider group; evaluate funnel and retention.

## 5. Gemini integration details
- Endpoint: official Google Generative Language API, called from Rust over HTTPS **[verify]** current model names, endpoint version and free-tier limits at implementation time, as they change frequently.
- Key passed in a request header or query per current docs **[verify]**, never logged.
- Keep prompts short; response capped (system prompt already asks for under 2 sentences) plus a max output token limit.
- Errors mapped: invalid key, quota/rate limit (429), network, region, safety-blocked response → pet-voice messages (see onboarding_flow.md).
- Free-tier data-use terms should be reviewed and surfaced in the guide panel.

## 6. Data and privacy
- Local app data dir: state.json (mood, closeness, last-seen, settings, recent-line history). Versioned schema for migrations.
- Chat history: in memory by default; decide whether to persist (default recommendation: not persisted in alpha).
- Telemetry: opt-in, random install ID, funnel event names only, no content; endpoint choice is open (see below).
- Logs: local, no key or message content.

## 7. Testing
- Unit: line selector (cooldowns, tags), state decay/increase, error mapping.
- Integration: Rust commands with a mocked Gemini server.
- Manual matrix: Windows 10, Windows 11, macOS (Intel/Apple Silicon), multi-monitor, 100%/150% DPI, fullscreen video, screen sharing.
- Soak test: run 8+ hours, watch memory growth.

## 8. Decisions
1. **Frontend framework:** Svelte. (decided)
2. **Telemetry backend:** existing privacy-respecting analytics service with a free tier, funnel events only. Pick the specific service before M5. (decided)
3. **Code signing:** closed alpha ships unsigned; testers accept the SmartScreen warning. Sign before any public or mass-market release. (decided)
4. **Platform:** Windows only for alpha; macOS after the alpha validates the funnel. (decided)
5. **Memory target:** still open. Replace "<40MB" with a measured number after spike 3.

Consequence of 3: unsigned installers lower install conversion, so alpha funnel numbers at the "install" step will understate what a signed release would see. Account for this when reading results.
