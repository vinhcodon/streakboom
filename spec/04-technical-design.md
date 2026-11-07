# Technical Design (Alpha 1.0)

The stable design of the app. What was built and measured, milestone by milestone (including the early spikes and the numbers behind the decisions below), is in [`../docs/engineering-log.md`](../docs/engineering-log.md).

## 1. Stack
- **Shell:** Tauri 2 (Rust core + system webview). Windows 10/11 with WebView2 first; macOS later; Linux out of scope.
- **Frontend:** SvelteKit as a single-page app (`adapter-static`), Svelte 5 runes, TypeScript. The pet is a layered **vector rig animated with CSS** (no sprite sheets, no canvas).
- **Rust side:** window control, our own drag with screen clamping, speech-bubble placement, OS credential store (`keyring`), Gemini client (`ureq` + rustls), signed auto-update (`tauri-plugin-updater`), fullscreen/presentation detection (`SHQueryUserNotificationState`).
- **Rendering flag:** WebView2 runs with `--disable-gpu`. Measured: continuous animation on a transparent window costs 4-15x more CPU with the GPU process than with software rendering of a 120 px pet.

## 2. Architecture

Three windows. The pet window owns all state and logic; the others are views.

```
 main  (pet, 140x140)          bubble  (created on demand)     settings  (created on demand)
 - owns all state + logic      - view only                     - view + brain commands
 - drag, gestures, timers      - speech, chat, ask,            - General / Brain / Privacy / About
 - AI calls, telemetry queue     consent, update offer         - API key typed here, goes to Rust
        ^                              ^                              ^
        +---------- events (src/lib/bus.ts), plain JSON, always via the pet window ------+

 Rust core: drag + clamp to the work area, bubble placement (above/below/right/left, always on screen),
            hit-test thread (click-through except over the pet), tray + right-click menu,
            credential store, Gemini client, updater, atomic save of pet.json
```

Principles:
- **The API key never reaches the pet window.** It is typed in the settings window, validated by one tiny request in Rust, stored in the OS credential store and sent only in the `x-goog-api-key` header. Chat goes through a Rust command that reads the key itself. This keeps the key out of webview memory and devtools and avoids CORS and CSP.
- **One writer of state.** The pet window writes `pet.json`; the other windows send actions or patches (`bubble-action`, `settings-patch`, `brain-changed`) and receive snapshots.
- **Nothing runs when nothing happens.** A standing pet has no continuous animation (only a short blink or tail twitch every few seconds); walking, being carried and the one-shot poses animate. The bubble window is destroyed after 45 s hidden to give its memory back; the settings window exists only while open.
- **The pet is the only thing that can be clicked** on its window: a Rust thread toggles click-through by hit-testing the cursor against the pet.
- **Never interrupt.** Proactive lines, update offers and consent cards are suppressed in Quiet mode, quiet hours, fullscreen/presentation, while dragging or while another bubble is open.

## 3. Milestones
- **M0 Spikes** (done): transparency, click-through, memory/CPU, keyring.
- **M1 UI shell** (done): transparent always-on-top window, drag, tray, position memory, multi-monitor handling.
- **M2 Naive pet** (done): mood and closeness model, local persistence, line selector with cooldowns, quiet hours, proactive rate limiting, VI/EN line pools (168 per language).
- **M3 Onboarding and BYOK** (done): brain request, key flow, credential store, error mapping to pet voice, delete key.
- **M4 Brained pet** (done): Gemini client, system prompt, short in-memory context, daily caps, timeout and failover, rate-limit cooldown.
- **M5 Telemetry and packaging** (partly done): opt-in consent and local funnel queue with a "Copy stats" button (done); NSIS installer (done); signed auto-update through GitHub Releases (done). **Open:** a sending backend for telemetry, code signing, crash reporting without content.
- **M6 Closed alpha** (next): 5-10 observed first-time users, then a wider group; evaluate funnel and retention.

Redesign rounds after M4 (gesture interaction, three-window architecture, mochi-cat character) are recorded in the engineering log.

## 4. Gemini integration
- Official Generative Language API (`v1beta`, `generateContent`), stateless (chosen over the stateful Interactions API, which stores interactions by default). Called from Rust only.
- Key in the `x-goog-api-key` header, never in a URL, never logged.
- Default model `gemini-3.1-flash-lite`: with a real key the newest full Flash models timed out or returned 503 "high demand" while the lite model answered in about a second. The user can pick or change the model; on a timeout or 5xx the client fails over to the next best model.
- Prompts are short; the system prompt asks for under two sentences, plus a max output token limit and an 8-turn context kept in memory only.
- Caps: 60 chat turns and 6 proactive AI lines per local day, and a 2-minute cooldown after a 429.
- Errors map to kinds (invalid key, rate limit, network, region, blocked, empty, server, model, storage) and then to pet-voice messages (see [`02-onboarding-flow.md`](02-onboarding-flow.md)); a connect error shows the technical detail behind a toggle and a copy button.
- Google's free-tier terms are surfaced in the key flow: data may be used and human-reviewed; API users must be 18 or older; clients serving the EEA, Switzerland and the UK must use paid services.

## 5. Data and privacy
- `%APPDATA%\com.streakboom.app\state.json`: window position, Quiet mode, chosen model.
- `%APPDATA%\com.streakboom.app\pet.json`: mood, closeness, streak, settings, recent lines, AI usage, gesture and update bookkeeping, telemetry consent and queue. Written atomically (temp file, then rename).
- API key: Windows Credential Manager, entry `gemini-api-key.streakboom`.
- Chat history: in memory only, never persisted.
- Telemetry: opt-in, off by default, a random install id created only on consent and deleted on opt-out, funnel event names and timestamps only (never keys, chat or personal data), each event once per install. The queue stays on the machine; nothing is sent automatically.
- Logs: none that contain keys or message content.

## 6. Testing
- **Node** (`node --test`): state model and decay, line selection and coverage, gestures, reveal rhythm, telemetry rules, update snoozing.
- **Rust** (`cargo test`): Gemini client against a one-shot mock HTTP server, error mapping, model choice, window geometry (clamping and bubble placement).
- **Static:** `svelte-check`.
- **Manual matrix still to run:** Windows 10 and 11, a second and a lower-end machine, multi-monitor, 100% and 150% DPI, fullscreen video, screen sharing, an 8-hour soak test watching memory growth.

## 7. Decisions
1. **Frontend:** Svelte (SvelteKit SPA).
2. **Gemini only, BYOK;** OAuth rejected for alpha.
3. **Platform:** Windows only for alpha; macOS after the alpha validates the funnel.
4. **Code signing:** the closed alpha ships unsigned and testers accept the SmartScreen warning. Sign before any wide release. Unsigned installers lower install conversion, so alpha numbers at the "install" step understate what a signed release would see.
5. **Memory target:** about 120 MB for all processes (a "<40 MB" target is not achievable with a webview). Measured at 111 MB idle with the on-demand bubble window.
6. **Distribution and updates:** GitHub Releases of the public repo; the app offers an update through the pet and never installs by itself. The private signing key lives outside the repo.
7. **Telemetry:** opt-in, funnel events only; the specific analytics service is still to be chosen (see open items).

## 8. Open items
- Telemetry sending: choose an analytics service, or keep "Copy stats" for the closed alpha.
- Code signing, and crash reporting that excludes content.
- macOS port.
- Multi-monitor, mixed-DPI and second-machine checks; fullscreen detection with real games and videos.
- Gestures not built yet: belly rub (usually liked, sometimes a playful "trap"), cursor-following eyes, chase play. The unused "snack" and "play" line pools are reserved for them.
- Streaming replies (show words as they arrive) instead of requesting the whole answer.
