<script lang="ts">
  // The chat box of the person (ADR-0142, prototype, behind the duo developer flag): the log of the talk with Peak and Paws and the place to write.
  // It owns nothing: the main page (Peak's) sends the turns and receives what is written; this page only draws them like a common chat application.
  import { onMount, tick } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen, emitTo } from "@tauri-apps/api/event";
  import { boxStrings, slashLabel } from "$lib/chatbox-ui";
  import { nfc } from "$lib/clip";
  import { parseCallMe } from "$lib/callme";
  import { parseDuoCommand } from "$lib/duo-command";
  import { EMPTY_VIEW, applyMention, groupTurns, mentionItems, mentionToken, mentionsIn, recallStep, settled, slashItems, timeLabel, withMention, type BoxAction, type BoxView, type MentionItem, type PetKey, type SlashItem } from "$lib/chatbox";

  let view = $state<BoxView>(EMPTY_VIEW);
  let presence = $state({ peak: true, paws: false });
  let pinned = $state(false); // not pinned (the default): the box fades away after the person has been in another program for a while; pinned (`/pin`): it stays until hidden (ADR-0147)
  let fade = $state(1); // the opacity the program asks for while the box fades away; the pointer on it brings it back
  let engaged = $state(false); // the box takes clicks and keys (shortcut, tray, double click, or the pointer resting on it); else the same box lets the mouse through. The layout never changes between the two
  let draft = $state("");
  let input = $state<HTMLTextAreaElement | null>(null);
  let recallIdx = -1; // arrow up and down: where in the messages sent before (-1: not browsing)
  let slashSel = $state(0);
  let composing = $state(false); // a word is being composed by a typing program (Telex, VNI, a Japanese IME): the field is left alone until it is done
  let settledDraft = $state(""); // the draft as the list of commands sees it: it does not move while a word is composed (ADR-0147)
  let slashOff = $state(false); // Esc closed the list: it stays closed until the field changes
  let scroller = $state<HTMLDivElement | null>(null);
  let inner = $state<HTMLDivElement | null>(null);
  const maxH = typeof screen !== "undefined" ? Math.round(screen.availHeight * 0.55) : 480; // the tallest the stack grows (logical px); beyond it the talk scrolls, without a bar

  const items = $derived(groupTurns(view.turns));
  const typingWho = $derived(view.typing);
  // what the program needs to know to treat the pointer (ADR-0147): whether the field is empty (the pointer leaving gives the box back only then)
  $effect(() => { void invoke("chatbox_state", { empty: draft.trim() === "", content: true }).catch(() => {}); });
  const allItems = $derived(items.filter((i) => i.kind === "group"));
  const shown = $derived(allItems);
  const t = $derived(boxStrings(view.lang));
  const locale = $derived(t.locale);
  const PETS = ["peak", "paws"] as const;
  const NAME = $derived({ peak: "Peak", paws: "Paws", person: t.you } as const);
  const anyOut = $derived(presence.peak || presence.paws);
  // who hears is who is out (ADR-0145); the field says one simple line (the pets on the screen show who is out)
  const placeholder = $derived(!view.canChat ? t.noBrain : !anyOut ? t.bothResting : t.say);

  const sent = $derived(view.turns.filter((t) => t.who === "person").map((t) => t.text).slice(-30));
  const slash = $derived<SlashItem[]>(!slashOff && settledDraft.startsWith("/") && !settledDraft.includes(String.fromCharCode(10)) ? slashItems(settledDraft.slice(1), presence) : []);
  $effect(() => { void settledDraft; slashSel = 0; });
  // a mention being typed (ADR-0152): after an @ the names that fit are offered; the arrows, Tab or Enter choose, Esc closes, a click chooses
  let caret = $state(0);
  let mentionSel = $state(0);
  let mentionOff = $state(false); // Esc closed the list: it stays closed until the field changes
  const mentionTok = $derived(mentionToken(settledDraft, Math.min(caret, settledDraft.length)));
  const mentions = $derived<MentionItem[]>(!mentionOff && slash.length === 0 && mentionTok ? mentionItems(mentionTok.query, presence, mentionsIn(settledDraft, mentionTok)) : []);
  $effect(() => { void mentionTok?.query; mentionSel = 0; });
  function chooseMention(it: MentionItem) {
    if (!mentionTok) return;
    const r = applyMention(draft, caret, mentionTok, it);
    draft = r.text; settledDraft = r.text; mentionOff = false;
    void tick().then(() => { grow(); input?.focus(); input?.setSelectionRange(r.caret, r.caret); caret = r.caret; });
  }
  const noteOf = (it: MentionItem) => (it.id === "everyone" ? t.everyoneNote : it.resting ? t.restingNote : "");
  // the page names its language (the default of the page is English, which makes a Vietnamese text use the wrong font and shaping)
  $effect(() => { document.documentElement.lang = view.lang; });

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
    settledDraft = "";
    recallIdx = -1;
    grow();
  }
  /** The field grows with what is written, up to four lines. */
  function grow() {
    if (!input || composing) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 88)}px`;
  }
  function runSlash(it: SlashItem) {
    draft = "";
    settledDraft = "";
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
    // the list of mentions, while it is open
    if (mentions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); mentionSel = (mentionSel + 1) % mentions.length; return; }
      if (e.key === "ArrowUp") { e.preventDefault(); mentionSel = (mentionSel - 1 + mentions.length) % mentions.length; return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); chooseMention(mentions[mentionSel]); return; }
      if (e.key === "Escape") { e.preventDefault(); mentionOff = true; return; }
    }
    // the list of commands, while it is open
    if (slash.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); slashSel = (slashSel + 1) % slash.length; return; }
      if (e.key === "ArrowUp") { e.preventDefault(); slashSel = (slashSel - 1 + slash.length) % slash.length; return; }
      if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); runSlash(slash[slashSel]); return; }
      if (e.key === "Escape") { e.preventDefault(); slashOff = true; return; }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); return; } // Shift+Enter breaks the line
    if (e.key === "Escape") { e.preventDefault(); if (draft) { draft = ""; settledDraft = ""; recallIdx = -1; grow(); } else void invoke("chatbox_hide"); return; }
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && !e.shiftKey && (draft === "" || recallIdx !== -1)) {
      const r = recallStep(sent, recallIdx, e.key === "ArrowUp" ? -1 : 1);
      if (r.text !== null) { e.preventDefault(); recallIdx = r.idx; draft = r.text; settledDraft = r.text; queueMicrotask(grow); }
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
    settledDraft = draft;
    await tick();
    grow();
    input?.focus();
    const n = draft.length;
    input?.setSelectionRange(n, n);
  }
  /** The window is as tall as the stack (ADR-0147): the page tells the program how tall it wants to be, and the program sizes and places it at the bottom right. */
  let lastFit = 0;
  function fit() {
    if (!inner) return;
    const h = Math.ceil(inner.offsetHeight) + 16;
    if (Math.abs(h - lastFit) < 2) return;
    lastFit = h;
    void invoke("chatbox_fit", { h }).catch(() => {});
  }
  $effect(() => { if (!inner) return; const ro = new ResizeObserver(() => fit()); ro.observe(inner); fit(); return () => ro.disconnect(); });
  async function toBottom() {
    await tick();
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }

  $effect(() => {
    void view.turns.length; void view.typing; // follow the end of the talk
    void engaged; void scroller; // and when the box is engaged again: its log is made new, and starts at the end, not the top
    void toBottom();
  });

  onMount(() => {
    const offs: (() => void)[] = [];
    void (async () => {
      offs.push(await listen<BoxView>("chatbox-view", (e) => { view = e.payload; void refreshPresence(); }));
      offs.push(await listen<boolean>("chatbox-mode", (e) => { engaged = e.payload; }));
      offs.push(await listen<number>("chatbox-fade", (e) => { fade = e.payload; }));
      engaged = await invoke<boolean>("chatbox_mode").catch(() => false);
      void invoke("chatbox_pin", { on: pinned });
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
    return () => { clearInterval(poll);  window.removeEventListener("focus", focusInput); offs.forEach((f) => f()); };
  });
</script>


<!-- One overlay (ADR-0147): the stack of the talk at the bottom right, on a scrim that is dense at the bottom and clear at the top; each message on a light pill, a pet with its small
     avatar, the person in a colour; the old ones fade by age and by place. Reading: click-through, only the recent messages. Writing (the shortcut, the tray, a double click
     on a pet, or the pointer resting on it): the whole talk (it scrolls, without a bar) and a slim field at the bottom. The window is as tall as the stack. -->
<div class="overlay" style:--maxh="{maxH}px" style:opacity={fade}>
  {#if allItems.length > 0 || typingWho}<div class="scrim" aria-hidden="true"></div>{/if}
  <div class="inner" bind:this={inner}>
    <div class="col scroll" bind:this={scroller}>
      {#each shown as it (it.kind === "group" ? it.lines[0].id : 0)}
        {#if it.kind === "group"}
          {#if it.who === "person"}
            <div class="arow">
              <div class="alines">
                {#each it.lines as l (l.id)}<div class="pill me" >{nfc(l.text)}</div>{/each}
              </div>
            </div>
          {:else}
            <div class="arow">
              <div class="alines">
                <div class="name {it.who}">{NAME[it.who]}</div>
                {#each it.lines as l (l.id)}<div class="pill pet" >{nfc(l.text)}</div>{/each}
              </div>
              <span class="av small {it.who}"><img src={it.who === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt="" /></span>
            </div>
          {/if}
        {/if}
      {/each}
      {#if typingWho}
        <div class="arow"><div class="alines"><div class="pill pet typing" aria-label={t.writing.replace("{name}", NAME[typingWho])}><i></i><i></i><i></i></div></div><span class="av small {typingWho}"><img src={typingWho === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt="" /></span></div>
      {/if}
    </div>
    {#if !anyOut}<div class="arow"><div class="pill pet resting">{t.bothResting}</div></div>{/if}
            {#if mentions.length > 0}
          <ul class="slash list" role="listbox" aria-label="@">
            {#each mentions as it, i (it.id)}
              <li role="option" aria-selected={i === mentionSel} class:sel={i === mentionSel}><button tabindex="-1" onmousedown={(e) => { e.preventDefault(); chooseMention(it); }}><span>{it.text}</span><code>{noteOf(it)}</code></button></li>
            {/each}
          </ul>
        {:else if slash.length > 0}
          <ul class="slash list" role="listbox" aria-label={t.commands}>
            {#each slash as it, i (it.id)}
              <li role="option" aria-selected={i === slashSel} class:sel={i === slashSel}><button tabindex="-1" onmousedown={(e) => { e.preventDefault(); runSlash(it); }}><span>{slashLabel(t, it)}</span><code>{it.hint}</code></button></li>
            {/each}
          </ul>
        {/if}
<footer>
        <textarea bind:this={input} bind:value={draft} rows="1" {placeholder} maxlength="300" autocomplete="off" oninput={() => { settledDraft = settled(settledDraft, draft, composing); caret = input?.selectionStart ?? draft.length; if (!composing) { slashOff = false; mentionOff = false; recallIdx = -1; grow(); } }} onkeyup={() => { caret = input?.selectionStart ?? caret; }} onclick={() => { caret = input?.selectionStart ?? caret; }} oncompositionstart={() => { composing = true; }} oncompositionend={() => { composing = false; settledDraft = draft; slashOff = false; recallIdx = -1; grow(); }} onkeydown={onKey} aria-label={placeholder}></textarea>
        <button class="send" aria-label={t.send} disabled={!draft.trim()} onclick={send}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l14-7-5 14-2-6-7-1z"/></svg>
        </button>
    </footer>
  </div>
</div>

<style>
  :global(html), :global(body) { margin: 0; background: transparent; overflow: hidden; font: 14px/1.45 "Segoe UI", "Segoe UI Variable Text", "Noto Sans", Arial, sans-serif; text-rendering: optimizeLegibility; }
  :root { --bg: #ffffff; --ink: #1f1f1f; --muted: #7a7a7a; --line: #e4e4e4; --soft: #f1f1f1; --me: #dfeaf7; --me-ink: #12365e; --peak: #b8741a; --paws: #3f6288; --ring: #3f6288; }
  @media (prefers-color-scheme: dark) { :root { --bg: #242424; --ink: #ececec; --muted: #9a9a9a; --line: #3a3a3a; --soft: #333333; --me: #1f3a5c; --me-ink: #dbe8f8; --peak: #e0a050; --paws: #8fb3d9; --ring: #8fb3d9; } }
  .overlay { transition: opacity 0.3s linear; position: relative; box-sizing: border-box; width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: flex-end; color: var(--ink); overflow: hidden; }
  /* the scrim: dense at the bottom, clear at the top, and soft at the left edge, so that the messages read on any background and no panel shows */
  /* dark in both themes (tried on a white, a dark and a busy background: a light scrim is a glare on a dark window; a dark one reads on all three) */
  .scrim { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(to top, rgba(14, 14, 20, 0.96) 0%, rgba(14, 14, 20, 0.9) 40%, rgba(14, 14, 20, 0.62) 72%, rgba(14, 14, 20, 0.2) 90%, transparent 100%);
    -webkit-mask-image: linear-gradient(to right, transparent 0%, black 30%); mask-image: linear-gradient(to right, transparent 0%, black 30%); }
  .inner { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 8px; }
  .col { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; -webkit-mask-image: linear-gradient(to top, black 55%, rgba(0, 0, 0, 0.25) 88%, transparent 100%); mask-image: linear-gradient(to top, black 55%, rgba(0, 0, 0, 0.25) 88%, transparent 100%); }
  .col.scroll { max-height: calc(var(--maxh) - 64px); overflow-y: auto; scrollbar-width: none; }
  .col.scroll::-webkit-scrollbar { display: none; }
  .arow { display: flex; align-items: flex-end; justify-content: flex-end; gap: 8px; max-width: 100%; }
  .alines { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; max-width: 270px; }
  .name { font-size: 11px; margin: 0 4px 0 0; }
  .name.peak { color: #f0b050; } .name.paws { color: #9cc0ea; } /* on the dark scrim */
  .pill { padding: 6px 12px; border-radius: 15px; word-break: break-word; white-space: pre-wrap; transition: opacity 0.4s linear; animation: rise 0.16s ease-out; }
  .pill.me { background: var(--me); color: var(--me-ink); }
  .pill.pet { background: var(--soft); color: var(--ink); } /* solid: the text behind never shows through */
  @keyframes rise { from { transform: translateY(10px); opacity: 0; } }
  .pill.resting { color: var(--muted); font-size: 12px; }
  /* a round avatar: the circle clips (overflow), the picture sits a little larger inside it; no transform on a rounded image, which cut the right side of Paws */
  .av { position: relative; display: inline-block; width: 22px; height: 22px; border-radius: 50%; overflow: hidden; flex: none; background: var(--soft); }
  .av img { position: absolute; width: 108%; height: 108%; left: -4%; top: -2%; }
  .typing { display: inline-flex; gap: 4px; padding: 10px 12px; }
  .typing i { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); animation: blink 1.2s infinite ease-in-out; }
  .typing i:nth-child(2) { animation-delay: 0.2s; } .typing i:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .typing i { animation: none; opacity: 0.6; } .pill { transition: none; animation: none; } .overlay { transition: none; } }
  footer { position: relative; display: flex; gap: 6px; align-items: center; }
  footer textarea { flex: 1; font: inherit; color: var(--ink); background: color-mix(in srgb, var(--bg) 96%, transparent); border: 1px solid var(--line); border-radius: 18px; padding: 7px 12px; outline: none; resize: none; overflow-y: auto; max-height: 88px; line-height: 1.4; }
  footer textarea:focus { border-color: var(--ring); }
  .slash { position: absolute; left: 0; right: 0; bottom: calc(100% + 4px); margin: 0; padding: 4px; list-style: none; background: var(--bg); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }
  .slash.list { position: static; margin: 0 0 6px 0; box-shadow: none; } /* in the flow: the window is as tall as the list too */
  .slash button { all: unset; box-sizing: border-box; display: flex; justify-content: space-between; gap: 10px; width: 100%; padding: 6px 9px; border-radius: 8px; cursor: pointer; }
  .slash li.sel button, .slash button:hover { background: var(--soft); }
  .slash code { color: var(--muted); font: 11px/1.6 ui-monospace, Consolas, monospace; }
  .send { border: 0; background: transparent; color: var(--ring); cursor: pointer; padding: 7px; border-radius: 999px; line-height: 0; }
  .send:disabled { color: var(--muted); cursor: default; }
  .send:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
</style>
