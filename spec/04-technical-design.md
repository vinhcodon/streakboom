# Technical Design

The stable design of the app as of 0.2.4. What was built and measured, round by round (including the early spikes and the numbers behind the decisions), is in [`../docs/engineering-log.md`](../docs/engineering-log.md). The reasons behind the choices are in [`../docs/decisions/`](../docs/decisions/README.md); the unverified assumptions are in [`../docs/hypotheses/`](../docs/hypotheses/README.md).

## 1. Stack
- **Shell:** Tauri 2 (Rust core plus the system webview), Windows 10/11 with WebView2 first (ADR-0003, ADR-0004).
- **Frontend:** SvelteKit as a single-page app (`adapter-static`), Svelte 5 runes, TypeScript. The pet is drawn on a **Canvas 2D** from a spring-driven rig (`src/lib/rig/`, `PetRig.svelte`): hand-drawn key poses blended by springs (ADR-0012). It replaced an earlier CSS layered rig.
- **Rust side:** window control, our own drag with screen clamping, speech-bubble placement, the OS credential store (`keyring`), the brain clients (`brain.rs` with Gemini and the provider layer, `claude.rs`, `openai.rs`; `ureq` with rustls), signed auto-update (`tauri-plugin-updater`), start with Windows (`tauri-plugin-autostart`), fullscreen and presentation detection (`SHQueryUserNotificationState`).
- **Rendering flag:** WebView2 runs with `--disable-gpu`. Measured: continuous animation on a transparent window costs 4 to 15 times more CPU with the GPU process than with software rendering of a 120 px pet (ADR-0005).

## 2. Architecture

Three windows. The pet window owns all state and logic; the others are views (ADR-0006).

```
 main  (pet, 140x140)          bubble  (created on demand)     settings  (created on demand, 680x600)
 - owns all state + logic      - view only                     - view + brain commands
 - drag, gestures, timers      - speech, chat, ask, consent,   - General / Personality / Brain /
 - AI calls, telemetry queue     update, name, choice, tour      Memory / Privacy / About
 - memory (memory.json)                                        - API key typed here, goes to Rust
        ^                              ^                              ^
        +---------- events (src/lib/bus.ts), plain JSON, always via the pet window ------+

 Rust core: drag + clamp to the work area, bubble placement (above/below/right/left, always on screen),
            hit-test thread (click-through except over the pet), tray + right-click menu,
            credential store, brain clients (three providers), updater, autostart,
            atomic save of pet.json, memory.json and state.json
```

Principles:
- **API keys never reach the pet window** (ADR-0007). A key is typed in the settings window, validated by one tiny request in Rust, stored in the OS credential store (one entry per provider) and sent only in the provider's header. Chat goes through a Rust command that reads the key itself. This keeps the key out of webview memory and devtools and avoids CORS and CSP.
- **One writer of state.** The pet window writes `pet.json` and `memory.json`; the other windows send actions or patches (`bubble-action`, `settings-patch`, `brain-changed`) and receive snapshots.
- **Nothing runs when nothing happens.** A standing pet does not repaint; a short blink or tail twitch every few seconds. The redraw rate follows the motion (`Rig.mode`, PR-4): full speed only while a big motion runs (a pose change, a turn, a hop, being carried), about 24 fps for small motion (a blink, a tail flick, the eyes looking around), about 30 fps walking (two paints per window move, so the steps stay even), about 11 fps for sleep and thinking (the settled cat is cached; only z's and dots are drawn). Springs stop once they are within 1% of their target, so the slow end of an approach does not keep the loop running. Each painted frame costs about 0.55% of one core with software drawing, on top of a floor of about 1.3%. The bubble window is destroyed after 45 s hidden; the settings window exists only while open.
- **The pet is the only thing that can be clicked** on its window: a Rust thread toggles click-through by hit-testing the cursor against the pet.
- **Never interrupt.** Proactive lines, update offers and cards are suppressed in Quiet mode, quiet hours, fullscreen or presentation, while dragging or while another bubble is open.

## 3. Milestones
- **M0 Spikes** (done): transparency, click-through, memory and CPU, keyring.
- **M1 UI shell** (done): transparent always-on-top window, drag, tray, position memory, multi-monitor handling.
- **M2 Naive pet** (done): mood and closeness, local persistence, line selector with cooldowns, quiet hours, proactive rate limiting, VI/EN line pools (182 per language today).
- **M3 Onboarding and BYOK** (done): brain request, key flow, credential store, error mapping to pet voice, delete key.
- **M4 Brained pet** (done): the brain client, system prompt, short in-memory context, daily caps, timeout and failover, rate-limit cooldown.
- **M5 Telemetry and packaging** (partly done): opt-in consent and local funnel queue with "Copy stats" (done); NSIS installer (done); signed auto-update through GitHub Releases (done). **Open:** a sending backend, code signing, crash reporting without content.
- **Rounds after M5** (done, recorded in the log): gesture interaction, three-window architecture, the mochi cat, continuous spring motion, memory phases 1 and 2, belly rub and cursor-following eyes, emotional reactions, language following, start with Windows, the first-run tour, the reorganized Settings and update modes, Claude and OpenAI as brains.
- **M6 First outside users** (next; 0.2.0 is the first official release): 5 to 10 observed first-time users, then a wider group; evaluate funnel, retention and Bond Days. The ordered work to get there is in [`../docs/plans/roadmap.md`](../docs/plans/roadmap.md).

## 4. Brain providers
One brain is in use at a time; keys of several can be stored (ADR-0008). All calls are made from Rust, are stateless, and use short prompts: the system prompt asks for under two sentences, a max output limit applies, and the context is the last 8 turns kept in memory only.

| | Gemini (Google) | Claude (Anthropic) | OpenAI |
|---|---|---|---|
| API | `generateContent`, v1beta | Messages API, `anthropic-version` 2023-06-01 | Chat Completions |
| Key header | `x-goog-api-key` | `x-api-key` | `Authorization: Bearer` |
| Default model | `gemini-3.1-flash-lite` | `claude-haiku-5-5` | `gpt-4.1-mini` |
| Automatic model order | lite Flash models first, newest first | Haiku, then Sonnet, then others, Opus last | "mini", then "nano", then full size; audio, image, search, embedding and code-agent models excluded |
| Cost | free tier available; free data may be used and reviewed by Google; clients serving the EEA, Switzerland and the UK need paid services | paid; a Claude Pro or Team subscription does not include the API | paid; a ChatGPT Plus subscription does not include the API |
| Verified with a real key | yes | **no** | **no** |

- A key never appears in a URL or a log. A model name is only plain name characters.
- On a timeout, a 5xx or an unknown model the client lists the key's models and fails over to the next best one, remembering it if it works. A bad key or a rate limit is never failed over.
- Caps (per local day): 60 typed chat turns, 6 proactive AI lines and 20 background fact-noting requests (each counted separately, ADR-0027), and a 2-minute cooldown after a rate limit. When a cap is reached the pet declines in character, with a randomly picked line and no numbers; Settings > Brain shows today's use. (0.2.0 still counted the fact-noting requests in the 60; 0.2.1 does not.)
- Errors map to kinds (invalid key, rate limit, network, region, blocked, empty, server, model, storage, billing) and then to pet-voice messages (spec/02); a connect error shows the technical detail behind a toggle and a copy button.
- **Mood tags:** every chat answer starts with one bracketed feeling tag chosen by the model; Rust removes it before display and returns the text and the mood separately (ADR-0016).
- **Language:** in chats the user starts the brain answers in the language of the latest message (ADR-0015).
- **Facts:** a second small request every 4 messages picks up to 3 short facts; Rust filters them (length, secrets, links, digits, repeats) (ADR-0014).
- Gemini was chosen over the stateful Interactions API because it is stateless. The default Gemini model was changed after the newest full Flash models timed out or returned 503 while the lite model answered in about a second.

## 5. Data and privacy
Files in `%APPDATA%\com.streakboom.app\`:
- `state.json`: window position, Quiet mode, the active provider and the chosen model per provider.
- `pet.json`: mood, closeness, streak, settings (including the update mode), recent lines, AI usage, gesture, startup, tour and update bookkeeping, telemetry consent and queue. Written atomically (temp file, then rename).
- `memory.json`: the pet's name and what to call the user, coarse habit counts, touch counts, shared milestones, noted facts, and the memory settings. Written atomically; the user can see, edit and delete all of it in Settings > Memory.
- API keys: Windows Credential Manager, one entry per provider (`gemini-api-key`, `claude-api-key`, `openai-api-key`, service `streakboom`).
- Chat history: in memory only, never persisted. The facts noted from chats are persisted (see above) and are sent to the active provider with later chats the user starts.
- Telemetry: opt-in, off by default, a random install id created only on consent and deleted on opt-out, funnel event names and timestamps, each once per install, plus per-day counters (`telemetry.days`, 60 days, counts only) recorded only at consent version 2 (`telemetry.consentV`); the queue and the counters stay on the machine and nothing is sent automatically (ADR-0009, spec/05). Pure rules for the counters are in `src/lib/bond.ts`.
- Logs: none that contain keys or message content.

## 6. Testing
- **Node** (`node --test`, 155 tests; Rust 53): state model and decay, line selection and coverage, gestures, reveal rhythm, telemetry and per-day counter rules (bond.ts), update snoozing, start-with-Windows and tour rules, the rig (key schema, springs, continuity, poses, and that its files can be copied to the website by erasing types), memory rules and lines.
- **Rust** (`cargo test`, 33 tests): the three clients against a one-shot mock HTTP server, error mapping, model ordering, mood tags, fact filtering, language rule, window geometry.
- **Static:** `svelte-check`.
- **Manual matrix still to run:** Windows 10 and 11, a second and a lower-end machine, multi-monitor, 100%, 125% and 150% DPI, fullscreen video, screen sharing, an 8-hour soak test, a reboot with start with Windows, and real Claude and OpenAI keys.

## 7. Updates
The app reads an update manifest from two addresses in order (a copy in the repository, then the release asset), each with a 20 s timeout, and repeats a failed check once after 4 s; the installer address in the manifest goes through the GitHub API; the signature is always verified. See ADR-0025 and `scripts/release.ps1 -Publish`.

## 7b. Decisions
The decisions are recorded one by one, with reasons and alternatives, in [`../docs/decisions/`](../docs/decisions/README.md). In short: Svelte on Tauri (ADR-0004); BYOK with Gemini, Claude and OpenAI, API keys only, one in use at a time (ADR-0001, ADR-0008); Windows only for the alpha (ADR-0003); an unsigned alpha installer with signed auto-update through GitHub Releases that asks first (ADR-0010); about 120 MB total memory (ADR-0005); opt-in local telemetry (ADR-0009).

## 8. Open items
- Telemetry sending: choose an analytics service, or keep "Copy stats" for the closed alpha. Bond Days counters first (spec/05).
- Code signing, and crash reporting that excludes content.
- macOS port.
- Multi-monitor, mixed-DPI and second-machine checks; fullscreen detection with real games and videos.
- Real-key tests of the Claude and OpenAI clients.
- A cheaper walking draw; more key poses for the in-between frames.
- Emotions for scripted lines.
- Streaming replies are not built and not planned while answers stay under two sentences (ADR-0020).
