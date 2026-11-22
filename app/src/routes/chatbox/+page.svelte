<script lang="ts">
  // The chat box of the person (ADR-0142, prototype, behind the duo developer flag): the log of the talk with Peak and Paws and the place to write.
  // It owns nothing: the main page (Peak's) sends the turns and receives what is written; this page only draws them like a common chat application.
  import { onMount, tick } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen, emitTo } from "@tauri-apps/api/event";
  import { boxStrings, slashLabel } from "$lib/chatbox-ui";
  import { parseCallMe } from "$lib/callme";
  import { parseDuoCommand } from "$lib/duo-command";
  import { EMPTY_VIEW, groupTurns, recallStep, slashItems, timeLabel, withMention, type BoxAction, type BoxView, type PetKey, type SlashItem } from "$lib/chatbox";

  let view = $state<BoxView>(EMPTY_VIEW);
  let presence = $state({ peak: true, paws: false });
  let pinned = $state(false);
  let draft = $state("");
  let input = $state<HTMLTextAreaElement | null>(null);
  let recallIdx = -1; // arrow up and down: where in the messages sent before (-1: not browsing)
  let slashSel = $state(0);
  let slashOff = $state(false); // Esc closed the list: it stays closed until the field changes
  let scroller = $state<HTMLDivElement | null>(null);

  const items = $derived(groupTurns(view.turns));
  const t = $derived(boxStrings(view.lang));
  const locale = $derived(t.locale);
  const PETS = ["peak", "paws"] as const;
  const NAME = $derived({ peak: "Peak", paws: "Paws", person: t.you } as const);
  const anyOut = $derived(presence.peak || presence.paws);
  // who hears is who is out (ADR-0145): the field says it in its own words, no buttons
  const placeholder = $derived(!view.canChat ? t.noBrain : !anyOut ? t.bothResting : presence.peak && presence.paws ? t.messageBoth : presence.paws ? t.messagePaws : t.messagePeak);

  const sent = $derived(view.turns.filter((t) => t.who === "person").map((t) => t.text).slice(-30));
  const slash = $derived<SlashItem[]>(!slashOff && draft.startsWith("/") && !draft.includes(String.fromCharCode(10)) ? slashItems(draft.slice(1), presence) : []);
  $effect(() => { void draft; slashSel = 0; });

  function act(a: BoxAction) {
    void emitTo("main", "chatbox-action", a).catch(() => {});
  }
  function send() {
    const text = draft.trim();
    if (!text) return;
    // with both pets in only a local command goes ("call Paws out", "call me ..."): anything else stays in the field and the placeholder says why
    if (!anyOut && !parseDuoCommand(text) && !parseCallMe(text)) return;
    act({ type: "send", text });
    draft = "";
    recallIdx = -1;
    grow();
  }
  /** The field grows with what is written, up to four lines. */
  function grow() {
    if (!input) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 88)}px`;
  }
  function runSlash(it: SlashItem) {
    draft = "";
    recallIdx = -1;
    grow();
    if (it.act.kind === "pin") togglePin();
    else if (it.act.kind === "clear") act({ type: "clear" });
    else if (it.act.kind === "name") act({ type: "name", value: it.act.value });
    else act({ type: "command", act: it.act.kind, target: it.act.target });
    input?.focus();
  }
  function onKey(e: KeyboardEvent) {
    if (e.isComposing) return; // a word still being composed (a typing mode) is not a key of the box
    // the list of commands, while it is open
    if (slash.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); slashSel = (slashSel + 1) % slash.length; return; }
      if (e.key === "ArrowUp") { e.preventDefault(); slashSel = (slashSel - 1 + slash.length) % slash.length; return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); runSlash(slash[slashSel]); return; }
      if (e.key === "Escape") { e.preventDefault(); slashOff = true; return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); return; } // Shift+Enter breaks the line
    if (e.key === "Escape") { e.preventDefault(); if (draft) { draft = ""; recallIdx = -1; grow(); } else void invoke("chatbox_hide"); return; }
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey && (draft === "" || recallIdx !== -1)) {
      const r = recallStep(sent, recallIdx, e.key === "ArrowUp" ? -1 : 1);
      if (r.text !== null) { e.preventDefault(); recallIdx = r.idx; draft = r.text; queueMicrotask(grow); }
      return;
    }
  }
  function togglePin() {
    pinned = !pinned;
    void invoke("chatbox_pin", { on: pinned });
  }
  async function refreshPresence() {
    presence = await invoke<{ peak: boolean; paws: boolean }>("duo_presence").catch(() => presence);
  }
  /** A double click on a pet opened the box: the pet is waiting in Rust (the page may not have existed when it was clicked). */
  async function takePrefill() {
    const pet = await invoke<string | null>("chatbox_take_prefill").catch(() => null);
    if (!pet) return;
    await refreshPresence();
    draft = withMention(draft, pet === "paws" ? "paws" : "peak", presence);
    await tick();
    grow();
    input?.focus();
    const n = draft.length;
    input?.setSelectionRange(n, n);
  }
  async function toBottom() {
    await tick();
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }

  $effect(() => {
    void view.turns.length; void view.typing; // follow the end of the talk
    void toBottom();
  });

  onMount(() => {
    const offs: (() => void)[] = [];
    void (async () => {
      offs.push(await listen<BoxView>("chatbox-view", (e) => { view = e.payload; void refreshPresence(); }));
      offs.push(await listen("chatbox-open", () => { void refreshPresence(); setTimeout(() => input?.focus(), 30); void takePrefill(); }));
      await emitTo("main", "chatbox-ready", {}).catch(() => {});
    })();
    // the box is shown before this page has loaded the first time, so the event of opening can be missed: take the focus when the page is ready and whenever the window gets it
    const focusInput = () => input?.focus();
    window.addEventListener("focus", focusInput);
    setTimeout(focusInput, 60);
    setTimeout(() => void takePrefill(), 120);
    const poll = setInterval(refreshPresence, 2000);
    void refreshPresence();
    return () => { clearInterval(poll); window.removeEventListener("focus", focusInput); offs.forEach((f) => f()); };
  });
</script>


<div class="box">
  <header>
    <div class="who">
      {#each PETS as p (p)}
        <span class="chip" class:away={!presence[p]} aria-label={NAME[p]}>
          <span class="av {p}"><img src={p === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt="" /><i class="dot" class:out={presence[p]}></i></span>{NAME[p]}
        </span>
      {/each}
    </div>
    <button class="pin" class:on={pinned} aria-pressed={pinned} aria-label={t.keepOpen} title={t.keepOpen} onclick={togglePin}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6l-1 6 3 3v1H7v-1l3-3-1-6z"/><path d="M12 14v6"/></svg>
    </button>
  </header>

  <div class="log" bind:this={scroller}>
    {#each items as it, i (i)}
      {#if it.kind === "time"}
        <div class="time">{timeLabel(it.at, Date.now(), locale, t.today)}</div>
      {:else if it.who === "person"}
        <div class="row me">
          <div class="lines">
            {#each it.lines as l (l.id)}<div class="msg me">{l.text}</div>{/each}
          </div>
        </div>
      {:else}
        <div class="row pet">
          <span class="av small {it.who}"><img src={it.who === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt={NAME[it.who]} /></span>
          <div class="lines">
            <div class="name {it.who}">{NAME[it.who]}</div>
            {#each it.lines as l (l.id)}<div class="msg pet">{l.text}</div>{/each}
          </div>
        </div>
      {/if}
    {/each}
    {#if view.typing}
      <div class="row pet">
        <span class="av small {view.typing}"><img src={view.typing === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt={NAME[view.typing]} /></span>
        <div class="lines"><div class="msg pet typing" aria-label={t.writing.replace("{name}", NAME[view.typing])}><i></i><i></i><i></i></div></div>
      </div>
    {/if}
    {#if items.length === 0 && !view.typing}
      <div class="empty">
        <div>{view.canChat ? t.empty : t.emptyNoBrain}</div>
        {#if !view.callMe}<div class="hint">{t.hintName} <code>/name</code> {t.hintNameAfter}</div>{/if}
      </div>
    {/if}
  </div>

  {#if !anyOut}<div class="resting">{t.bothResting}</div>{/if}
  <footer>
    {#if slash.length > 0}
      <ul class="slash" role="listbox" aria-label={t.commands}>
        {#each slash as it, i (it.id)}
          <li role="option" aria-selected={i === slashSel} class:sel={i === slashSel}><button tabindex="-1" onmousedown={(e) => { e.preventDefault(); runSlash(it); }}><span>{slashLabel(t, it)}</span><code>{it.hint}</code></button></li>
        {/each}
      </ul>
    {/if}
    <textarea bind:this={input} bind:value={draft} rows="1" {placeholder} maxlength="300" autocomplete="off" oninput={() => { slashOff = false; recallIdx = -1; grow(); }} onkeydown={onKey} aria-label={placeholder}></textarea>
    <button class="send" aria-label={t.send} disabled={!draft.trim()} onclick={send}>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l14-7-5 14-2-6-7-1z"/></svg>
    </button>
  </footer>
</div>

<style>
  :global(html), :global(body) { margin: 0; background: transparent; overflow: hidden; font: 13px/1.45 "Segoe UI", system-ui, sans-serif; }
  :root { --bg: #ffffff; --ink: #1f1f1f; --muted: #7a7a7a; --line: #e4e4e4; --soft: #f1f1f1; --me: #dfeaf7; --me-ink: #12365e; --peak: #b8741a; --paws: #3f6288; --ring: #3f6288; }
  @media (prefers-color-scheme: dark) { :root { --bg: #242424; --ink: #ececec; --muted: #9a9a9a; --line: #3a3a3a; --soft: #333333; --me: #1f3a5c; --me-ink: #dbe8f8; --peak: #e0a050; --paws: #8fb3d9; --ring: #8fb3d9; } }
  .box { box-sizing: border-box; width: 100vw; height: 100vh; display: flex; flex-direction: column; background: var(--bg); color: var(--ink); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
  header { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border-bottom: 1px solid var(--line); }
  .who { display: flex; gap: 6px; flex: 1; flex-wrap: wrap; }
  .chip { display: flex; align-items: center; gap: 6px; padding: 3px 10px 3px 4px; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: inherit; font: inherit; cursor: default; }
  .chip.away .av img { filter: grayscale(1); opacity: 0.6; }
  .pin:focus-visible, .send:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
  .av { position: relative; display: inline-flex; width: 24px; height: 24px; border-radius: 50%; flex: none; background: var(--soft); }
  .av img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
  .av.peak img { transform: scale(1.18); }
  .av.paws img { object-position: 50% 25%; transform: scale(1.35); transform-origin: 50% 35%; }
  .av.small { width: 28px; height: 28px; }
  .dot { position: absolute; right: -1px; bottom: -1px; width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--bg); background: transparent; }
  .dot.out { background: #3b8a2e; }
  .pin { border: 0; background: transparent; color: var(--muted); cursor: pointer; padding: 4px; border-radius: 6px; }
  .pin.on { color: var(--ring); background: var(--soft); }
  .log { flex: 1; overflow-y: auto; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
  .time { align-self: center; font-size: 11px; color: var(--muted); }
  .row { display: flex; gap: 8px; align-items: flex-end; }
  .row.me { justify-content: flex-end; }
  .lines { display: flex; flex-direction: column; gap: 2px; max-width: 78%; }
  .row.me .lines { align-items: flex-end; }
  .name { font-size: 11px; margin: 0 0 1px 3px; }
  .name.peak { color: var(--peak); } .name.paws { color: var(--paws); }
  .msg { padding: 6px 11px; word-break: break-word; white-space: pre-wrap; }
  .msg.me { background: var(--me); color: var(--me-ink); border-radius: 15px 15px 4px 15px; }
  .msg.pet { background: var(--soft); border-radius: 15px 15px 15px 4px; }
  .typing { display: inline-flex; gap: 4px; padding: 10px 12px; }
  .typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite ease-in-out; }
  .typing i:nth-child(2) { animation-delay: 0.2s; } .typing i:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .typing i { animation: none; opacity: 0.6; } }
  .resting { padding: 5px 12px; font-size: 12px; color: var(--muted); text-align: center; border-top: 1px solid var(--line); }
  .hint { margin-top: 10px; font-size: 12px; }
  .hint code { font: 11px/1.6 ui-monospace, Consolas, monospace; background: var(--soft); padding: 0 4px; border-radius: 4px; }
  .empty { margin: auto; text-align: center; color: var(--muted); padding: 0 24px; }
  footer { position: relative; display: flex; gap: 8px; align-items: center; padding: 8px 10px; border-top: 1px solid var(--line); }
  footer textarea { flex: 1; font: inherit; color: inherit; background: transparent; border: 1px solid var(--line); border-radius: 18px; padding: 7px 12px; outline: none; resize: none; overflow-y: auto; max-height: 88px; line-height: 1.4; }
  footer textarea:focus { border-color: var(--ring); }
  .slash { position: absolute; left: 10px; right: 10px; bottom: calc(100% - 2px); margin: 0; padding: 4px; list-style: none; background: var(--bg); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }
  .slash button { all: unset; box-sizing: border-box; display: flex; justify-content: space-between; gap: 10px; width: 100%; padding: 6px 9px; border-radius: 8px; cursor: pointer; }
  .slash li.sel button, .slash button:hover { background: var(--soft); }
  .slash code { color: var(--muted); font: 11px/1.6 ui-monospace, Consolas, monospace; }
  .send { border: 0; background: transparent; color: var(--ring); cursor: pointer; padding: 4px; border-radius: 6px; }
  .send:disabled { color: var(--muted); cursor: default; }
</style>
