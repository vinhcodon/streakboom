# Adaptive Peak and body-language skills: feasibility (the ten items of section 11 of the handoff)

**Status:** written 2026-11-13 from [`../handoff/adaptive-peak-and-skills.md`](../handoff/adaptive-peak-and-skills.md) (received 2026-11-13, dropped in by Vinh), read together with `requirements-draft-v0.4.md`, `north-star-bond-days.md` and `character-and-movement.md` (all in `../handoff/`) and checked against the code at 0.4.2. **Documents only: no app code was touched.** The spec is [`../../spec/14-adaptive-peak.md`](../../spec/14-adaptive-peak.md) (the handoff asked for `08`; that number is taken, see item 10), the order of work is [`adaptive-peak-plan.md`](adaptive-peak-plan.md).

**`customization-hypothesis.md`** was not in the repository when this was written; it was added later the same day and is read in [`../../spec/15-customization.md`](../../spec/15-customization.md). Where this document says it was not read, that is how things stood at the time. Nothing was run: no skill was built, no hotkey or microphone was tried; every statement about Windows, WebView2 or an API's behaviour is a reading, listed in section "Not verified" at the end.

Where a point needs Vinh, it says **Vinh decides**; the full list is in section 13 of the spec.

---

## 1. The states of the rig, and the cost of "leaving", "away" and "coming back"

**What exists** (`app/src/lib/sprites.ts`, `app/src/routes/+page.svelte`, `lib.rs`):
- 23 poses (`PetState`): `idle look walk sleep held happy think land drowsy wake purr huff nod smirk gasp notice curious sad peek teeter ledge climb cling`.
- Around the pose: the attention mode (`work` / `free` / `play`, `attention.ts`), the `quiet` flag (Quiet mode: the cat sleeps where it is, says nothing, stays on screen), the night by the clock (23:00 to 07:00), `flying` (a hop or a fall), and `panel` (a bubble that asks something).
- The window itself can be **hidden** (tray: Show / Hide, `toggle_visibility` in `lib.rs`). Since 0.4.0 a hidden Peak shows no bubble.

So today there are three different "less of Peak": **Quiet** (on screen, asleep, silent), **hidden** (gone until the person shows it) and **the edge ladder** (peek, sit, climb down). There is no state in which Peak goes and **comes back by itself**.

**Cost of "Lượn đi" (leave, be away, return).** Almost all of it is composition of what exists:
- *Leave:* a short goodbye line (the persona already has one: say goodbye with one short line and stop), `nod` (there is no wave pose and none is needed), the existing sideways `walk` to the nearest side edge, then hide the window. No new art.
- *Away:* a new **logical** state, "away", that is not Quiet and not the person's own hide: the window is hidden **and a timer will show it again**. Two flags in the page (away, return time). Not saved to disk: after a restart Peak is simply there (absence costs nothing, charter article 7).
- *Return:* show the window at the edge it left by, `land` or `wake`, no line or a neutral one.
- *New:* the gates for the return (below), the counters, and the tray calling it back at once (the tray's Show already does; it must also cancel the timer).

**Does it connect to Quiet mode?** Yes, in one direction: both are "less of Peak", both must be undone by the same two words the person already knows (tray: Show, Quiet). They must **not** be merged: Quiet keeps a sleeping cat on screen for a person who wants company without noise; away takes it off the screen. Treating them as one would also make H19 unmeasurable. One shared rule is needed: while away, **no timer of the page may speak or move the window** (the unprompted-line timer and the walk timer already check `quiet`; they need the same check for away).

**Cost summary:** small, no animation work, about the size of Quiet mode plus a timer. The expensive things in the handoff (a phone to the ear, going to a favourite spot to sleep, a transformation) are not part of the first slice and are costed in the spec.

**Vinh decides:** how long Peak stays away, and how the person calls it back (Q1 of the handoff). Facts for the choice: a hidden window cannot be clicked and has no chat, so the only calls available now are the tray icon and the tray menu; a global hotkey would add one (item 4) but is not built and is not part of the first slice.

## 2. The local intent table: structure, coverage, ambiguity

**Structure (proposal).** A pure module `app/src/lib/intents.ts` with a test file beside it, like the other `lib` modules, and no I/O:
- *Input:* the message as typed or transcribed.
- *Normalising:* lower case; for Vietnamese remove diacritics **as well as** keeping the original (so "luon di" and "lượn đi" both match); for Japanese NFKC and hiragana/katakana folding; collapse spaces; strip final punctuation and common endings ("nhé", "đi mà", "ね", "please").
- *Table:* per skill, per language, a list of phrases (exact, after normalising) and a short list of patterns (a few regular expressions). Data in a file, not in code, so a phrase can be added without touching logic.
- *Output:* `{ skill, kind }` where `kind` is `exact` (whole message equals a phrase), `pattern`, or `none`.
- **Whole message only.** The rule is: the message is at most about six words, has no question mark, and the **whole** of it matches. "Lượn đi" matches; "hôm nay anh lượn đi họp" does not and goes to the chat as usual. This is what keeps false positives low without a model.
- Anything that is not `exact` or `pattern` goes to chat unchanged, so with no key the person sees the same as today (the cat's ordinary scripted reply), and with a key the model may still read it as a command (tier 2, item 3).

**Ambiguity ("lượn đi" against "đi ngủ đi").** They are two different wishes: *go away* and *go to sleep*. Rules:
1. They are **two skills in the table** (`leave`, `sleep`), never one. The first slice builds only `leave`; "đi ngủ đi" is recognised as `sleep` and, until that skill exists, handled by an existing behaviour (Peak yawns and goes drowsy, which is already how Quiet mode looks) or passed to chat. Decide with Vinh which.
2. A phrase listed in two skills is **not matched**: the table has a test that fails if one normalised phrase belongs to two skills.
3. Low-confidence matches (`pattern`) do not act at once: they show the existing `ask` card ("Em đi chỗ khác chơi nhé?" with yes / later) and act on yes. `exact` acts.
4. Anything that would be *destructive* to the person's flow is excluded from tier 1 by design: nothing here touches their files, windows or apps (A2).

**How to measure coverage with real data.** Three layers, cheapest first (details in the plan):
1. *Before any code:* a **phrase survey** with the alpha people (how would you tell the cat to go away / to come back / to sleep?), the phrases split in two halves; the table is written from one half and tested **offline on the other half** (a Node test with a fixture file). This is the whole of H18's first test and costs a form.
2. *A negative set:* about 200 ordinary short chat messages (written by testers, no private text) that must **not** match: this measures false positives, which matter more than misses.
3. *In the alpha:* two **counters, no text**: how many commands tier 1 recognised, and how many the model recognised (tier 2). Coverage is `tier1 / (tier1 + tier2)`. To grow the table, the person can "Copy phrases the table missed" (only the short messages tier 2 turned into a skill, shown before copying, never automatic), like "Copy stats".

## 3. Function calling in `brain.rs`: what changes, how to check, how reliable, the 60 a day

**What exists.** `brain.rs` builds one request per chat turn: `contents` (at most 8 turns of at most 500 characters), `systemInstruction` (the persona layers in `app/src-tauri/persona/`), `generationConfig.maxOutputTokens` 512; the answer is text. There is **no `tools` field in any provider**. The answer begins with one mood tag in brackets which `split_mood` removes before display (`mood.md`). There are now **four** providers with four request and answer shapes (`brain.rs` for Gemini, `claude.rs`, `openai.rs`, `groq.rs`; the "multi-provider work not yet committed" of the handoff is committed and released since 0.3.0).

**Native function calling** would mean: a `tools` / `functionDeclarations` block with the closed list, a different answer part to parse (`functionCall` for Gemini, `tool_use` for Claude, `tool_calls` for OpenAI and Groq), a second request if the model should also say something, and tests for four shapes. That is the expensive way and it doubles the calls (see below).

**Recommendation (Vinh decides): do not use native function calling in the first version; use a skill tag, exactly like the mood tag.** One more layer file `skills.md` (not part of the locked core) tells the model: *if, and only if, the person's last message is plainly a command to you from this closed list, begin the reply with `[skill:leave]`; otherwise never*. The tag is parsed by the same function that splits the mood and **removed before display**. Why it is better here:
- Provider-neutral: the same text rule for Gemini, Claude, OpenAI and Groq; one parser; one test.
- No extra call: the tag rides on the reply that is generated anyway, so it **costs no extra chat turn**.
- Easy to check: the client accepts only a code on the closed list, takes **no parameters** in the first slice (so there is nothing to validate but the name), and the safety gate and cooldown still apply.
- No data flows into a function: nothing about files, apps or windows exists to be passed.

**Reliability with small models:** unknown (H20). It can only be tested by running labelled messages through each brain; the plan has a 30-to-60-message harness for it. The risks to measure are false positives (the model adds a tag to a message that was not a command, e.g. "tôi sẽ lượn đi họp") and misses; false positives are the ones that matter, and the whole-message rule of tier 1 does not protect tier 2.

**Does the 60 a day count the call?** Today the cap is by kind: `chat` 60, `proactive` 6, `note` 20 (`state.ts`: `AI_CHAT_DAILY_CAP`, `AI_PROACTIVE_DAILY_CAP`, `AI_NOTE_DAILY_CAP`). With the tag approach a skill is **one chat turn** and counts as one, as every turn does; no new kind and no change. A tier-1 hit makes **no API call at all**, so it uses no quota and works with no key. If native function calling were used with a second round trip, it would double count; that is one more reason for the tag. (**Vinh decides**, Q7 of the handoff: recommended answer "no separate count; one reply, one turn".)

## 4. A global hotkey in Tauri 2

**What exists:** nothing (checked: no `global-shortcut` plugin in `Cargo.toml`, the capability file has only `core:default`).

**Option A (recommended): `tauri-plugin-global-shortcut`**, the official plugin, which registers the combination with Windows (`RegisterHotKey`), so Windows delivers **only that combination** and Peak never sees other keys. Its API reports both pressed and released, which is what hold-to-talk needs. Points to settle in a spike, **not verified**:
- Whether the key **repeats** while held (Windows repeats the message of a registered hotkey) and whether the plugin's `Released` is reliable on Windows; a debounce is needed either way.
- The combination is **taken from every other program** while Peak runs, and registering fails if another program has it. So: a default that rarely clashes, a clear message when registering fails, and a way to change it (a necessity, so a legitimate setting under the charter's "few settings").
- It does not move focus: Windows does not give focus for a registered hotkey, so the app the person is typing in keeps it. Peak's window must also not take focus when it starts to listen (the bubble already has a no-focus path, `bubble_fit(... focus ...)`).
- Needs a new permission in the capability file and a new dependency, so also a refresh of `THIRD-PARTY-NOTICES.md` (the audit fails when it is stale).

**Option B, rejected:** polling the state of a key (`GetAsyncKeyState`, as is done for the mouse button) or a low-level keyboard hook. Both read the keyboard outside the registered combination and look like a keylogger; the charter and `AGENTS.md` forbid it (a global keyboard hook is a hard rule in the character-and-movement handoff, section 4 (spec 06 section 3)).

**Not part of the first slice** (A3, A4); the hotkey and voice come after H18 and H19 have answers.

## 5. A short recording sent to the brain

- **Format.** The web view records with `MediaRecorder` as WebM/Opus, which is not in the list of audio formats the Gemini API documents (WAV, MP3, AIFF, AAC, OGG, FLAC). The safe path is to capture raw samples and write a **WAV, 16 kHz, mono, 16 bit** (about 32 KB a second; with a hard cap of 15 seconds, about 0.5 MB, about 0.65 MB as base64). Sent inline as an audio part next to the text in `contents`. **Not verified**, including the current size limit of an inline request; check the Gemini page the day it is built.
- **Providers.** Only Gemini takes this directly. Claude's API has no audio input; OpenAI and Groq take audio through other endpoints and models. So voice would work with **one provider** unless a speech-to-text step is added. **Vinh decides** (new question N4): Gemini only in the first version, said plainly in Settings, or leave voice until it fits all providers.
- **Microphone permission.** The page would ask the web view for the microphone. WebView2 has its own prompt and a hook for it, Tauri does not wire it by default; Windows also has its own switch ("let desktop apps use the microphone"). Behaviour of a non-focused, transparent window that asks, and what the first-time prompt looks like, **not verified**.
- **The mic indicator.** Windows shows its own microphone icon while a program records (on current Windows 10 and 11, **not verified on this machine**). Peak adds its own, not only the system's: a visible "listening" state (the `curious` pose and a mark in the bubble), a hard stop at release or 15 s, and the stream **closed at once** so the system icon goes away. The mic is never open without the hold.
- **Privacy.** Audio carries more than text. It is a new sense, so it needs the open switch the charter asks for (article 4), a consent card that says what is sent and to whom, the sentence that the free Gemini tier may use requests to improve Google's products (in `privacy.md` and the Brain page), nothing stored (the clip lives in memory until sent), and a change in the README and the website's promises, which the website session must be told. Voice is not counted in Bond Days (the same rule as chat).

## 6. Local behaviour counters: where, how big, how to delete

- **Where.** In `memory.json`, with the habits that already live there (`hours`, `weekdays`, `touches`, the `learn` switch), **not** in the telemetry. Telemetry (`DayStat`, spec 05) is a consent-gated export for the author's measurements; what Peak learns about the person for its own behaviour is the pet's memory, visible and deletable in Settings, "What the pet remembers" (spec 06), and switched off by `learn: false`. Keeping them apart also means the suggestions work without the person ever opting in to telemetry.
- **What.** Coarse counts only: a 3 by 3 grid per monitor of **where the person puts the cat** (drops and drags; never the pointer track, never a window name), counts of hides and Quiet-mode starts by part of the day (the arrays by hour already there), counts of leaves, calls back and undoes, suggestions shown, accepted and declined with a date. All integers and dates.
- **Size.** Under 2 KB for a three-monitor setup. No growth with time (counts, not a log).
- **Delete.** The existing "Forget" actions and the learn switch; a new "Forget places" and "Forget suggestions" in the same list. Deterministic buttons, not a conversation (A6).
- **Relation to `DayStat`.** `DayStat` already has a `quiet` count per day; the suggestion engine must not depend on it (it exists only with consent). The new `leave` counter goes into `DayStat` too, **separately** from the Bond Days inputs (A5), so the author can see it in "Copy stats".

## 7. The suggestion mechanism

- **Reuse the `ask` card** (`bus.ts`: `{ kind: "ask"; text; yes; later }`), the same one that asks about starting with Windows. It already has a yes and a later; "later" is the decline.
- **Where it fits in the charter.** A suggestion is an unprompted line, so it uses the **existing unprompted slot** (`fireProactive`, every 10 to 15 minutes, only in `free` or `play`, never while the person works, never at night, never while Quiet or busy). It never adds a second channel of interruption.
- **Rules (proposal; Vinh sets the numbers, Q5):**
  - At most **one suggestion a week** (a number to confirm), never two kinds on one day, never in the first three days or before closeness tier 2.
  - Each says its reason in Peak's voice and in the person's language ("anh hay đặt em ở đây"), and always offers the way back by words.
  - *Later* silences that kind for 14 days; a second *later* for 60; a *yes* is never asked again.
  - A *yes* applies the change, says so in one line, and is shown (with a Forget) in Settings.
- **The shoo, declined (ADR-0047).** The author declined a Peak that quietly becomes quieter after the person moves it away or starts Quiet mode. So frequent hides and Quiet starts may only be the reason for a **question** ("Muốn em ngồi yên ở góc này không?"), never a silent change in behaviour.
- **Does answering count toward Bond Days?** Today `engaged` counts a poke, scratch, rub or double click within 30 s of an unprompted line. Pressing the card's button is such a reaction. Whether it counts is Vinh's call, because it would let the suggestion engine raise its own north star (new question N6; the handoff section 8 also asks for the author's approval).

## 8. No action during a meeting, screen share or presentation: is the detection enough?

**What exists.** `is_busy` (`lib.rs`) calls `SHQueryUserNotificationState`: true for a fullscreen program, a Direct3D fullscreen game, presentation mode, and a locked or absent session. **Where it is used:** only before an unprompted line and before an update (`+page.svelte`: `fireProactive`, the update check). **The focus path passes `busy: false`** (`decideFocus(... busy: false ...)` in the same file), so walking and hopping do not look at it.

**Gaps:**
1. It is **not wired to movement**. A skill that moves the window (leave, return) must check it, and the return especially: if busy at the return time, wait and try again later.
2. It does not see a **window being shared** in Teams, Zoom or Meet (a windowed or whole-screen share is not "fullscreen" or "presentation mode"); a transparent always-on-top cat shows in the shared picture. This is true of Peak today, not only of skills. **Not verified** for each product.
3. The camera or microphone being in use is not available to a program without reading the device state; and reading the names of the running programs to guess a meeting is against the privacy contract.

**Consequence for the design:** a skill the **person** triggers (they typed it or held a key) is by definition not happening behind their back; the risk is the **automatic** parts: the return by timer, the suggestion. So both are gated by `is_busy`, by `quiet`, by `work` mode, and the return waits. For the share gap the honest answer is the one the product already has: Quiet mode and Hide, and a line in the install guide; a test matrix (Teams share, Zoom share, Meet in a browser, a PowerPoint slideshow, a full-screen video, a game) goes in `verification-debt.md`.

## 9. The cheapest order to check H18 (the table covers real commands) and H19 ("Lượn đi" adds feeling and does not replace Quiet)

(The handoff calls them H2 and H3; in the register they are **H18 and H19**, because H1 to H16 are taken. Full plan in [`adaptive-peak-plan.md`](adaptive-peak-plan.md).)

1. **S0, no code.** The phrase survey (H18's first test): a form to the alpha candidates and anyone willing, 10 minutes each.
2. **S1, a script, no app.** The table as data and the pure matcher with tests, run on the two halves of the survey and the negative set. This is the real answer for H18 before any change to the app.
3. **S2, the smallest build, for the author alone (needs Vinh's approval to code).** Tier 1 for `leave` only, typed in the chat box, with walk to the edge, hide and timed return, behind a test switch. This gives H19 its first, n = 1 reading ("does it feel good, do I use it instead of Quiet?").
4. **S3, the alpha.** The two counters and the leave counters in "Copy stats", read against Quiet starts, hides and Bond Days of the people who used it and the people who did not, plus a short end-of-week question.
5. Only then H20 (the tag with small models), and later H17, H21, H22.

## 10. Where the handoff disagrees with the code or with the documents

| # | The handoff says | What is true | What to do |
|---|---|---|---|
| 1 | Write `spec/08-adaptive-peak.md` | `spec/08-perception.md` exists; specs 01 to 13 are all taken | The spec is `spec/14-adaptive-peak.md`. **Vinh may still choose to renumber.** |
| 2 | Hypotheses H1 to H6 | `docs/hypotheses/README.md` already has H1 to H16 with other meanings (H2 is the key flow, H3 is chat versus a browser tab) | Registered as **H17 to H22**, with a mapping table in the spec |
| 3 | `customization-hypothesis.md` has R1 to R4 and a H1 | The file is not in the repository | Merged from section 12 of the handoff only; to be checked when the file is found |
| 4 | "Rig has only front and side views"; walking costs 7 to 15 % of a core on 0.1.7 | 23 poses now, including `peek`, `ledge`, `climb`, `cling`, `teeter`; later CPU measurements exist (0.2.5 median 8.8 %, the A/B before 0.3.1) | The ceiling still holds: no walk cycle seen from the back or lying down; walking in many directions is still the expensive thing |
| 5 | Quiet mode and hiding as a pair of controls | There are three: Quiet (on screen, asleep), hidden (tray) and the edge ladder; Leave would be a fourth | Keep Leave distinct from Quiet (item 1) |
| 6 | Fullscreen and presentation detection exists | True, but it is not used for movement (`busy: false`) | Wire it for the return and any skill that moves the window (item 8) |
| 7 | "Multi-provider work is not committed" (Q8) | Committed and released; four providers, four request shapes | Prefer a tag over native function calling (item 3); Q8 is answered |
| 8 | Caps 60 a day and 6 unprompted | Also a cap of 20 for notes, and a cooldown (`aiGate`) | No change needed (item 3) |
| 9 | Learn how often the person hides the cat and starts Quiet mode, and act on it | ADR-0047 declined the shoo, a silent quieting after a push or a Quiet start | Allowed only as the reason for a question (item 7) |
| 10 | The cat leaves and comes back | Charter article 7 and manners rule 7, spec 12, ADR-0056 to 0059: absence costs nothing, never accusing, no "I missed you", a banned-patterns test on the lines | The return lines are a new pool under the same test; no counting of time, no reproach |
| 11 | Voice as a hold-key (replaces the wake word of the requirements draft) | Charter article 4: a new sense must be switched on in the open; `AGENTS.md` rule 4: a new sense is a decision | Needs its own ADR before it is built; README, `privacy.md`, Brain page and the website promises change with it |
| 12 | The learned places and the "what Peak has learned" screen | "What the pet remembers" with Forget actions already exists (spec 06) | Extend it; no new screen |
| 13 | `requirements-draft-v0.4.md` asks for `spec/07-requirements.md` | `spec/07` is the terrain spec; the requirements were never written as one file | Not part of this task; noted |

## Not verified (to go into `verification-debt.md`)

Everything about Windows and web-view behaviour that was read and not tried: the hotkey's repeat and release; the microphone prompt in a non-focused transparent window and the system indicator; the audio format and size limits of the API on the day it is built; how often each provider's small models wrongly add a skill tag; whether screen-sharing products show the cat; the cost in CPU of a walk to the edge on the author's machine; whether the whole-message rule is enough in real chat. None of these is a reason to stop; each is a step of the plan.
