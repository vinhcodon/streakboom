# The chat box: two defects looked into, and a proposal for a live-chat style overlay

**Status:** written 2026-11-22 for the author (the app session, beside the duo session). **Update, same day: part 2 is carried out on `main` (ADR-0146, `clip.ts`, V-193); the small `lang` fix of part 1 is in the bubble; the rest of part 1 and the overlay of part 3 are not built.** (The text below is as first written.) Part 1 and 2 are what the code and a rendering test show; part 3 is an evaluation of the author's idea with options to choose from. The chat box discussed is the **duo chat box** of the branch `exp/duo-prototype` (ADR-0142, `app/src/routes/chatbox/+page.svelte`, `duo.rs`); the single-pet chat on `main` shares the cut-off of part 2. What is verified and what is not is marked.

## 1. Vietnamese text that looks wrong, "especially after a slash command"
**What I checked, and what I found:**
- **The sources are clean (verified).** A scan of every `.ts`, `.svelte`, `.json`, `.md`, `.rs` and `.mjs` of `app/src`, the persona files, `site/` and the handoffs, on `main` and on the branch, found **no** replacement character (U+FFFD), **no** mojibake patterns, **no** decomposed (NFD) Vietnamese and no zero-width characters.
- **The font stacks render Vietnamese correctly on this machine (verified by a rendering test, not in the app).** In headless Chrome (the same engine family as WebView2, not the same build) the line "Gọi Paws ra, ẩn đi, xê ra, tránh đường ... ệ ợ ẫ ặ ữ ỵ ẳ" drawn in `"Segoe UI", system-ui, sans-serif`, and in the `ui-monospace, Consolas` of the command hints, comes out right in **precomposed (NFC) and decomposed (NFD) form and with `lang` set to `en`, `ja` and `vi`**. So the choice of font and of `lang` does not explain the author's observation **on this machine**.
- **I could not reproduce what the author saw (not verified).** The cause is open. Ranked by what the code makes plausible:
  1. **A Vietnamese typing program (UniKey, Telex or VNI) interfering with the field.** Such programs correct a word by sending back-spaces and new letters. The box re-draws on every input (`oninput` runs `grow()`, `slash` is derived from the draft, and an effect resets `slashSel`), and the text area has `maxlength="300"`. The key handler already ignores keys while a word is composed (`e.isComposing`), but the **input** handler does not wait for the composition to end. After `/`, the list of commands opens and closes while the person is typing the next letters, which is the moment such a program is busiest.
  2. **Small text on a transparent, layered window.** The box is a transparent window; Windows draws such text with grey-scale anti-aliasing, which can make the marks of Vietnamese letters hard to read at 13 px (and worse at 125% or 150% scale).
  3. **Something specific to the author's machine** (a font that replaces Segoe UI, or the scale). A screenshot would settle it.
- **Two small real defects found on the way (verified in code), not the cause on this machine:** the bubble sets `lang` to `en` for anything that is not Japanese, so Vietnamese is marked as English (`bubble/+page.svelte`); and the chat box page sets no `lang` at all (the default of `app.html` is `en`).
- **A suggested hardening, cheap and safe:** set `lang` on every window from the language the person chose (`vi`, `en`, `ja`); declare a full stack (`"Segoe UI", "Segoe UI Variable Text", "Noto Sans", Arial, sans-serif`); show every text after `normalize("NFC")` (the app only ever *removes* marks to match commands, it never shows the stripped form, but a decomposed text from a model or a paste is possible); and **do not touch the draft, the list or the height while a word is composed** (`compositionstart` and `compositionend`).
- **What I need from the author to find the cause:** a screenshot of the glitch, the typing program he uses (Windows' own Vietnamese keyboard, UniKey, other), whether it happens only in the box or also in the speech bubble, and whether it happens at 100% display scale. I did not run the duo build (it needs a build and the author's keys); the check of the typing program needs a real keyboard.

## 2. A long message from Peak or Paws is cut off
**Found (verified in code, on `main` and on the branch):**
- **`MAX_REPLY_CHARS = 240` and `clip()` in `routes/+page.svelte`** cut every chat reply to 239 characters and add "…", **in the middle of a sentence**, at three places: the reply of a chat turn, the remark after a reflex, and the reply shown for a model test (`clip(out.text)`, `clip(c.reply)`). The cut text is then what goes into the talk (`reply` is what the page keeps), so the log of the box very likely shows the cut text too, and **the model's next turn sees its own sentence broken** (this last point I read from the code, I did not run it).
- **Why it hurts more in Vietnamese:** 240 characters is about two short sentences; Vietnamese needs more characters than English for the same idea and the persona asks for "extremely concise", which a model does not always obey.
- **Other limits that can also cut (not the main cause):** the model's output limit is 512 tokens (a long Vietnamese reply can reach it; the provider then stops mid-sentence and nothing marks it), the speech bubble is at most 250 px wide, and a very tall bubble may not fit above the pet near the top of the screen (I did not check the placement code, `place_bubble`).
- **Options for the policy** (the author chooses):
  - **A.** Raise the limit (to about 600) and cut only at a sentence end. Simple; a long reply is still cut.
  - **B. (recommended, with D)** The bubble shows the **first sentence or two** (up to about 160 characters, cut at a sentence end) and the **box keeps the whole reply**; the bubble ends with a small "…" that, when the box is open or opened by a click, shows the rest.
  - **C.** Never cut: the bubble grows and scrolls. Long bubbles on a working screen go against the charter (article 2).
  - **D.** Tell the model the budget in the persona (for example "at most two sentences, about 200 characters") so that replies end by themselves, and keep the local cut only as a last safety at a sentence or word end.
- **Where:** a small pure function (`clipReply(text, max)` that cuts at a sentence or word end, with a test), used at the three places; the same three places exist on the duo branch, so the duo session applies the same change or takes it with a merge of `main`.

## 3. The idea: a chat box like the chat of a live stream
**The author's idea, as I understood it:** the box is shown while it is pinned and hides when it is unpinned; by default it is **transparent and lets the mouse through**; the messages are stacked like the chat of a YouTube live stream, **the older ones fading at the top**; only a few recent messages are shown (nobody scrolls back); **on hover** the background becomes solid; **all messages are aligned to the right**.

**My assessment: a good idea, with five conditions.** It answers the real complaint (the box vanishes suddenly) and fits the charter better than the present solid box.

**What it gets right**
- **The disappearance becomes a fade.** Today the box hides the moment it loses focus unless pinned (`Focused(false)` in `duo.rs`, with two grace timers for the tray click and the box taking the focus). Any click elsewhere, a bubble taking focus, a toast, Alt+Tab, a tray click: the box is gone. In a fading overlay the old messages leave by themselves, slowly, and nothing is ever "closed under the person's hand".
- **Charter article 2 (the attention is theirs).** A window that lets the mouse through, takes no focus, and shows nothing when there is nothing new has almost no footprint; the pinned state means "ready", not "always showing something".
- **It matches how the talk is read:** once, as it comes.
- **Right aligned** keeps it by the edge of the screen where Peak and the tray are, away from the middle where the work is.

**The five conditions (what would otherwise go wrong)**
1. **Legibility on any background.** Bare text on an unknown background (a white page, a dark editor, a video) cannot be read. **Each message needs its own pill** (a rounded background at about 75 to 90% opacity, with contrast checked on a light, a dark and a busy background), not only a text shadow. "Transparent" should mean *no frame and no panel*, not *no background behind the letters*.
2. **Hover on a window that lets the mouse through.** A click-through window receives no mouse events, so it cannot know the pointer is over it. The program already has a thread that polls the pointer and turns click-through on and off for the pet (`spawn_hit_test`, `set_ignore_cursor_events`); the box can use the same: hover detected from the pointer position, with a **delay and a margin** (for example 250 ms in, 800 ms out) so that it does not flicker at the edge.
3. **Where the person types.** A click-through log cannot hold the keyboard focus. So there are **two modes**: *ambient* (the log, click-through, no focus) and *engaged* (solid, with the input field and the scroll of the history). Engaged is opened by what opens the box today (the global shortcut, the tray, a double click on a pet) and by a hover; it goes back to ambient when the pointer leaves and the field is empty. I suggest keeping the scroll of the history in engaged mode (it costs nothing and is a safety net for a message read too late), even if it is rarely used.
4. **Fading must not eat a message that has not been read.** A time based on the length (for example the longer of 8 seconds and 0.4 second per word, so that a long Vietnamese reply is not gone before it is read), **held while the pointer is over the box**, a recent-messages limit of about 5, and no fade animation when the person asked the system for reduced motion (the message is shown, then removed).
5. **The two voices in one right-aligned column.** If everything is on the right, the person and the two pets must differ by something else than the side: a small round avatar (Peak, Paws) at the right of its text, the person's message in one colour and without an avatar, names only at the start of a group. This also needs a decision about the pets' own short lines: **do they appear in the log as well as in their bubbles?** If yes the same words are shown twice (above the pet and in the column); I suggest the log carries the **talk** (the person's messages and the replies), and the bubble stays for lines that are not part of a talk.

**A state model that fits the idea**
| State | The window | When |
|---|---|---|
| Hidden | none shown | not pinned and nothing new |
| Ambient | transparent, click-through, no focus: only the pills of the recent messages, fading | a message arrived; or pinned |
| Engaged | solid, with the input and the history | hover, the shortcut, the tray, a double click on a pet |
Unpinned: ambient shows for the life of the messages and then hides; engaged goes back to hidden when the pointer leaves and the field is empty. **Pinned: ambient stays between messages** (and shows nothing when no message is alive). The pin is then the person's single control for "do I want it ready".

**What is not decided, and the choices for the author** (asked after this document): is it pinned **by default**? Do the pets' unprompted lines also go to the log? Per-message pills or bare text with a shadow? Which side and how wide (the width of a reply: about 300 px)? How many recent messages?

**Alternatives I considered**
- **(1) Keep the solid box and only change the hiding rule** (never hide on blur; hide with the pin or Esc): the smallest change; keeps a frame on the screen.
- **(2) The author's overlay as above:** recommended.
- **(3) Overlay without hover (always click-through) and the input only by the shortcut:** simpler and safer for focus, but there is no way to scroll back and the person cannot select or copy a message.

**Risks and what is not known**
- **Hover from polling** can flicker or lag at the edge of the box; to be seen with the real mouse.
- **A click-through transparent window above a full-screen app, a video or a game:** the present rules (quiet in full-screen, presentation) must hold for it too (not checked).
- **Text over video or animation** fades in and out of legibility; the pill answers it, at the cost of a bigger footprint.
- **The renderers and the real mouse:** I can show the idea in a static test page over several backgrounds to check the legibility; **the click-through and the hover are real only in the program** and need a build and the author's look (AGENTS rule 8: the author looks at a test build before a motion or art change is committed).
- **macOS:** click-through and the pointer position are done with the platform layer (`docs/platform/macos.md`); nothing here is Windows only if the pointer reading goes through it.

## 4. How I propose to go on
1. The author answers the choices below (fonts: a screenshot and the typing program; the reply policy; the overlay choices).
2. **The two fixes first, small and independent of the overlay:** `clipReply` (part 2) and the hardening of part 1, each with tests, in a separate commit; the duo session is told so that its branch takes them.
3. **The overlay as a prototype on the duo branch** (the box belongs to the duo prototype, ADR-0142), behind the duo developer flag, in two steps: first the ambient log with pills, fading and the pin (no hover), then the hover and the engaged mode. The author looks at each step before it is committed. An ADR (amending ADR-0142) records the choices.
4. **Not verified now:** everything about the overlay (nothing built), the cause of the font defect, the effect of the reply policy on the model's next turn.
