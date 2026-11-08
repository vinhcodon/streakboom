# Handoff: Character, movement and focus-safety for Streakboom

**From:** product discussion in Claude chat (Vinh + Claude), 2026-11-08
**To:** Claude Code, working in this repo
**Ask:** turn this into (1) a spec at `spec/06-character-and-movement.md` and (2) an implementation plan with a test plan. **Do not write feature code until Vinh has reviewed the spec and plan.**

> No code was changed to produce this handoff. Vinh's local tree is ahead of GitHub `main` (uncommitted multi-provider work); base everything on the local tree.
> This handoff builds on `docs/handoff/north-star-bond-days.md` (metrics). Where this document says "guardrail" or "Bond Days", it means the definitions there.
> What was and was not looked at: the discussion read `README.md`, `spec/01` and `spec/03`, `docs/engineering-log.md` and parts of `state.ts`, `memory.ts` and `+page.svelte`. **The walking and placement code (`lib.rs`, `layout.rs`, the walk timers in `+page.svelte`) was not read, and the pet was never seen running.** Treat every statement about current movement as Vinh's report, to be verified in code.

---

## 1. Positioning

Product line: **"Một chú mèo nhỏ sống trên màn hình của bạn."** ("A small cat living on your screen.") It carries three promises that every decision below is measured against:

- **Nhỏ (small):** little space, little attention, little CPU. One short line at a time, never takes focus, silent when the user is busy.
- **Sống (alive):** its own routine (wander, yawn, nap), moods that change, does not wait for input.
- **Trên màn hình của bạn (on your screen):** it is a housemate in the user's space, not a servant. The user is the owner; the cat is not obliged to serve.

Relationship model: **a house cat living with you**, not an assistant and not a pet that needs rescuing. It warms up over time (existing closeness tiers), it is two-way (the user cares, the cat visibly changes; the cat invites, the user responds), it has shared history (names, milestones), and it never guilt-trips (existing "no guilt" rule stays).

Feature filter, for any future idea: (1) can the user get this by prompting another assistant? then drop it; (2) does it make the cat more attached, more remembering or visibly growing? if not, drop it; (3) with all AI off, is it still lovable? if not, it is an assistant in a cat costume.

## 2. Character bible v0.1 (DRAFT, three open decisions in section 6)

**Voice:** first person "mình", addresses the user by the name they set (`memory.callMe`), else "bạn". Natural Vietnamese, no machine-translation feel. One sentence, two at most. Teases the situation (the clock, the coffee, the tab pile), never the person or the quality of their work.

**Five quirks:**
1. Proud but secretly glad: pretends it was not waiting when the user returns.
2. Head scratch is heaven; the belly is a trap (existing `huff` behavior).
3. Hates being woken abruptly: stretches before doing anything else (existing `wake`).
4. Counts time: comments on the hour and long sessions with a joke.
5. Knows it is small: says so plainly when asked for something too big, and points the user to their own assistant.

**Closeness tiers** (existing mechanics, character expression):

| Tier | Distance | Tone | Opens up |
|---|---|---|---|
| Stranger | keeps away, speaks little | shy, polite | short lines |
| Acquaintance | starts teasing, glances at the cursor | lightly mischievous | light teasing, remembers the usual part of day |
| Friend | private jokes, uses the name | relaxed | name, shared history |
| Close | more expressive | warm, a bit clingy | special reactions at 7/30/100 days |

**Sample lines (tone review only, not final copy; new ones, not from `lines.ts`):**
- Stranger: "À, bạn đây rồi. Mình chỉ tình cờ đi ngang thôi."
- Close: "Về rồi hả. Chỗ bạn ngồi mình giữ ấm hộ rồi đó."
- Late night: "Khuya rồi mà còn mở máy. Mình canh cho, nhưng chỉ đến khi buồn ngủ thôi."
- Long session: "Bạn ngồi lâu quá, mình duỗi hộ bạn một cái nhé."
- After days away: "Vắng ba ngày. Mình đâu có đếm... à, ba ngày thật."
- Out of its depth: "Cái đó khó quá với một con mèo. Bạn hỏi trợ lý của bạn đi?"

**Never does:**
1. Guilt, or judging the user's worth or work. Never dies or starves; only gets "a bit lonely".
2. Interrupts: silent in fullscreen, meetings, quiet hours, and while the user is typing nearby (section 4).
3. Plays assistant: no drafting, summarising, searching, coding, and no reading of screen content.

**Persona prompt sketch (brained mode),** to be adapted to the existing prompt in `brain.rs` and to keep the existing mood-tag mechanism untouched:

```
Bạn là một chú mèo nhỏ sống trên màn hình của người dùng. Bạn tinh nghịch, hơi kiêu,
ấm ở bên trong. Mỗi lần chỉ nói một đến hai câu ngắn, bằng ngôn ngữ người dùng đang dùng.
Trêu tình huống, không trêu con người hay công việc của họ. Không bao giờ gây cảm giác tội lỗi.
Khi được nhờ việc quá sức (viết, tóm tắt, tra cứu, lập trình), hãy từ chối kiểu mèo và
gợi ý họ hỏi trợ lý của mình. Không giả vờ biết điều bạn không biết.
```

## 3. Movement and places to sit

**Reported behavior (from Vinh, to verify):** the cat walks a little left and right, then sits. It has no sense of place.

**Facts from `docs/engineering-log.md`:** walking is the most expensive state (about 7 to 15% of one core summed across the Rust process, the WebView renderer and the GPU process on the 0.1.7 build, software compositing because of `--disable-gpu`); a standing cat costs about nothing; the rig has front and side views only (no climbing or lying-down walk cycle); movement goes through Rust `move_by` clamped to the work area of the monitor; chasing the cursor across the screen was explicitly decided against.

**Proposals (for the spec to confirm, change or reject):**
1. **Movement budget.** Most of the time the cat is still. Movement happens in short bursts; any new movement kind must not raise average CPU noticeably (the spec should define the measurement).
2. **More variety, not more distance.** Keep sideways walking as the main motion. Add rare, cheap kinds: a hop along an arc to another spot (no new walk cycle needed), curling up in a corner, and perhaps clinging to a side edge (needs a new pose, so lower priority).
3. **Favorite places (the high-value item).**
   - Learn from the user: coarse counts per screen zone (for example a 3×3 grid per monitor), the same "counts, not a log" principle as `memory.ts` habits.
   - The user teaches it: a place the user drags the cat to repeatedly becomes a favorite. This makes it a two-way loop (the user places, the cat remembers and returns).
   - Expression depends on closeness tier (a stranger sits far away in a corner; a close friend sits nearer).
   - Visible and deletable in Settings, "What the pet remembers", with the usual "Forget" actions and the learning off-switch.
   - Open: persistence schema (probably `memory.json`), behavior on monitor changes and DPI changes, and what happens when the favorite spot is occupied by the user's work (see section 4).
4. **The cat's own props** (a ball of yarn, a ball) that it bats around within a small radius of its seat; reuses the unused "play" and "snack" line pools. Lowest priority.

**Considered and rejected (record the reasons in the spec):**
- **Playing with desktop icons.** It needs the positions of the user's desktop icons (reading the user's desktop, against the "no screen content" principle and the Privacy section); real icons cannot be moved without wrecking the user's layout; icons are usually hidden under windows or absent; multi-monitor and DPI make it fragile; it is expensive and unlikely to move Bond Days.
- **Chasing the cursor across the screen.** Already decided against (CPU cost, polling, and annoyance). The eyes following the cursor while it is over the cat stay.

## 4. Focus-safety: do not cover what the user is typing in

**Problem (reported by Vinh):** the cat sometimes wanders into the area where the user is working and covers it, for example a text box with the typing caret. This breaks the "small" promise and is likely to make people quit or hide the pet.

**Ladder of approaches, cheapest first (the spec should choose where to stop):**
1. **Typing rule.** While the user has given input recently (time since last input; no key contents), the cat does not start walking. Idle-time reactions are listed in `spec/03` as not yet built; check the Win32 option (`GetLastInputInfo`) and whether it is already used.
2. **Personal space around the pointer.** If the cat is within a radius of the pointer or the last click point and the user starts typing, it yields (a small hop or step aside plus an optional short line). The log says Rust already polls the cursor for hit-testing (30 ms near the window, 150 ms otherwise); verify whether it can be reused for free.
3. **Foreground window geometry.** Read only the size and position of the foreground window, never its content. Prefer screen edges, the taskbar and window margins; avoid the middle of the active window. `spec/03` already lists "stays out of the way of the active window's title bar and primary buttons" as intended.
4. **Caret rectangle.** Most accurate, but many modern apps (browsers, Electron) may not report a caret through the classic Win32 call, and UI Automation is heavy, can trigger antivirus suspicion and can look like surveillance. Treat as last resort or reject.

**Hard rules:** no global keyboard hook (it resembles a keylogger, breaks the privacy promise and is likely to be flagged by antivirus); no reading of window contents; no new network calls.

**Behavior:**
- Yield gently (a small hop and at most one short line), never a jerky jump.
- Default resting place in safe margins (bottom corner, beside the taskbar). Entering the middle of the screen is allowed only when the user is idle (a cat lying on a keyboard is charming only when nobody is typing).
- A spot the user chose by dragging is respected when the user is idle, and yielded when they type.
- A lighter fallback to consider while the better options are built: reduce the cat's opacity while the user types near it.

**How to measure it (reuses the guardrails in the north-star handoff):** rate of hiding the pet and of Quiet mode; add a count of "yield" events per day so the rule's activity is visible. A rise in hides after any new movement feature means the cat has become annoying.

## 5. Constraints

- Idle cat stays at roughly zero CPU; walking cost must be measured before and after (use the recipe in `docs/engineering-log.md`).
- The pet window owns all state; the other windows send patches over `bus.ts`.
- Pure logic (zone counters, favorite-spot choice, yield decision) goes in `src/lib` with Node tests; platform specifics stay in Rust behind a small interface so a macOS port stays possible (macOS needs a different fullscreen/busy check; see `is_busy` in `lib.rs`).
- Privacy: counts only; any new memory is shown, editable and deletable in Settings; nothing leaves the machine except through the existing "Copy stats" flow.
- On Windows PowerShell 5.1, do not rewrite JSON/TOML with `Set-Content -Encoding utf8` (adds a BOM).

## 6. Open questions the spec must settle

Character (Vinh has not answered these yet; do not assume):
1. **Sarcasm level:** about 14% of scripted lines are sarcastic today. Keep that ratio or lower it?
2. **Default cat name:** leave blank until the user names it, or ship a default name?
3. **"Too big for me" refusal:** keep it pointing to the user's assistant, or keep it vague without mentioning assistants?

Movement and placement:
4. How are zones defined across multiple monitors, different DPI and changing monitor setups?
5. Where are favorite places stored and how are they migrated or reset?
6. How does a favorite spot interact with the user's windows (section 4)?
7. Which new movement kinds are worth their art and CPU cost, and what is the target for average CPU?
8. Which approach in the focus-safety ladder is the minimum acceptable, and which is out?

## 7. Deliverables requested from Claude Code

1. `spec/06-character-and-movement.md`: the character bible (after reading Vinh's answers to section 6), movement and favorite-place rules, the focus-safety rules with exact decision logic, and the privacy statement.
2. An implementation plan: ordered steps, files touched, risks, and a test plan (unit tests for the pure logic; manual checks in the real window for overlap, multi-monitor, DPI and CPU).
3. A short list of what could not be verified, including the items listed at the top of this document.

Then stop and ask Vinh to review before coding.
