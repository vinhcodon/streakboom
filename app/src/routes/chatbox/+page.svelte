<script lang="ts">
  // The chat box of the person (ADR-0142, prototype, behind the duo developer flag): the log of the talk with Peak and Paws and the place to write.
  // It owns nothing: the main page (Peak's) sends the turns and receives what is written; this page only draws them like a common chat application.
  import { onMount, tick } from "svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { listen, emitTo } from "@tauri-apps/api/event";
  import { boxStrings, slashLabel } from "$lib/chatbox-ui";
  import { nfc } from "$lib/clip";
  import { parseCallMe } from "$lib/callme";
  import { addressees, parseDuoCommand, summons } from "$lib/duo-command";
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
  const slash = $derived<SlashItem[]>(!slashOff && settledDraft.startsWith("/") && !settledDraft.includes(String.fromCharCode(10)) ? slashItems(settledDraft.slice(1), presence, pinned) : []);
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
  // every deliberate send gets its own id: the pet page dispatches one id once in a visit (T2d, ADR-0167 row 13); two sends of the same text stay two
  let sends = 0;
  const newMid = () => `${Date.now().toString(36)}-${(++sends).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  function send() {
    const text = draft.trim();
    if (!text) return;
    // with both pets in only a local command goes ("call Paws out", "call me ..."): anything else stays in the field and the placeholder says why
    if (!anyOut && !parseDuoCommand(text) && !parseCallMe(text) && summons(text, presence).length === 0) return; // an @ mention calls the pet out (ADR-0157)
    act({ type: "send", text, mid: newMid(), at: Date.now() });
    draft = "";
    settledDraft = "";
    recallIdx = -1;
    void tick().then(grow); // after the field has the empty text: measured at once, it still had the old one and stayed tall
  }
  /** The field grows with what is written, up to four lines. */
  function grow() {
    if (!input || composing) return;
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight + 2, 96)}px`; // border-box: the scroll height has the padding, the 2 is the border
  }
  // the height follows the text whatever changed it (typing, a send, a command, Esc, a paste, the box shown again): measured after the field has the new text
  $effect(() => { void draft; void tick().then(grow); });
  function runSlash(it: SlashItem) {
    draft = "";
    settledDraft = "";
    recallIdx = -1;
    void tick().then(grow);
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
    if (e.key === "Escape") { e.preventDefault(); if (draft) { draft = ""; settledDraft = ""; recallIdx = -1; void tick().then(grow); } else void invoke("chatbox_hide"); return; }
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
  // #17: Paws as a member of the chat. One small group indicator beside the field: the faces of who is in this chat, the ones who will hear the next message
  // lit and the others dimmed, and their names after "to". It is derived from the same saved state as the routing (`duo_presence`, `addressees`).
  let pawsMode = $state("walk");
  const nextTo = $derived.by(() => {
    if (pawsMode !== "chat") return [] as ("peak" | "paws")[];
    const d = settledDraft.startsWith("/") ? "" : settledDraft;
    const eff = { ...presence };
    for (const p of summons(d, presence)) eff[p] = true; // an @ that invites makes the pet a member before the message goes
    return addressees(d, eff);
  });
  // the members are who is really in the chat (the saved state), never someone the draft only names: a pet the draft would invite shows apart, as "+ Paws" (#17, Codex's return)
  const members = $derived((["peak", "paws"] as const).filter((p) => presence[p]));
  const invited = $derived((["peak", "paws"] as const).filter((p) => !presence[p] && nextTo.includes(p)));
  let joinedNote = $state(""); // "Paws joined": once, when it joins
  let wasPaws = false;
  let joinedT: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const now = presence.paws;
    if (pawsMode === "chat" && now && !wasPaws) { joinedNote = t.joined.replace("{name}", "Paws"); clearTimeout(joinedT); joinedT = setTimeout(() => (joinedNote = ""), 6000); }
    if (!now) joinedNote = "";
    wasPaws = now;
  });
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
  const FADE_HEAD = 0; // px of clear strip above the stack; none now that there is no panel behind it (ADR-0155); the same number as BOX_FADE_HEAD in duo.rs
  let lastFit = 0;
  function fit() {
    if (!inner) return;
    const h = Math.ceil(inner.offsetHeight) + 16 + FADE_HEAD;
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
      offs.push(await listen("chatbox-members", () => void refreshPresence())); // #17: who is in the chat changed
      offs.push(await listen<string>("chatbox-restore", (e) => { draft = draft ? `${draft}${String.fromCharCode(10)}${e.payload}` : e.payload; settledDraft = draft; void tick().then(grow); })); // #19: waiting messages not sent (the visit was dismissed) come back to the field
      pawsMode = await invoke<string>("duo_paws_mode").catch(() => "walk");
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


<!-- One overlay (ADR-0147): the stack of the talk at the bottom right, with no panel behind it (ADR-0155); each message on a light pill, a pet with its small
     avatar, the person in a colour; the old ones fade by age and by place. Reading: click-through, only the recent messages. Writing (the shortcut, the tray, a double click
     on a pet, or the pointer resting on it): the whole talk (it scrolls, without a bar) and a slim field at the bottom. The window is as tall as the stack. -->
<div class="overlay" style:--maxh="{maxH}px" style:opacity={fade}>
    <div class="inner" bind:this={inner}>
    <div class="col scroll" bind:this={scroller}>
      {#each shown as it (it.kind === "group" ? it.lines[0].id : 0)}
        {#if it.kind === "group"}
          {#if it.who === "person"}
            <div class="arow">
              <div class="alines">
                {#each it.lines as l (l.id)}<div class="pill me" class:waiting={l.waiting}>{nfc(l.text)}{#if l.waiting}<span class="wait">{t.waiting}</span>{/if}</div>{/each}
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
{#if pawsMode === "chat" && (members.length > 0 || invited.length > 0)}
          <div class="members" role="group" aria-label="{t.members}: {members.map((p) => NAME[p]).join(', ')}">
            {#if joinedNote}<span class="note" role="status">{joinedNote}</span>{/if}
            <span class="faces">{#each members as p (p)}<span class="av face {p}" class:dim={!nextTo.includes(p)} title={NAME[p]}><img src={p === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt="" /></span>{/each}{#each invited as p (p)}<span class="av face invite {p}" title="+ {NAME[p]}"><img src={p === "paws" ? "/paws/paws-front.svg" : "/peak-avatar.png"} alt="" /></span>{/each}</span>
            <span class="to" aria-live="polite">{#if nextTo.length > 0}{t.nextTo} {nextTo.map((p) => (invited.includes(p) ? "+ " : "") + NAME[p]).join(" · ")}{/if}</span>
          </div>
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
  /* no panel behind the messages (ADR-0155): each pill and the field carries its own soft shadow, so that nothing appears as a block and nothing has an edge; the name is a small dark chip, readable on any background */
  .pill, footer textarea { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.22), 0 5px 12px rgba(0, 0, 0, 0.24); }
  .inner { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 14px; } /* 14 px all round: room for the shadows, which the window edge would cut */
  .col { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; -webkit-mask-image: linear-gradient(to top, black 55%, rgba(0, 0, 0, 0.25) 88%, transparent 100%); mask-image: linear-gradient(to top, black 55%, rgba(0, 0, 0, 0.25) 88%, transparent 100%); }
  .col.scroll { max-height: calc(var(--maxh) - 64px); padding: 14px; margin: -14px; overflow-y: auto; /* the padding (and the margin that gives it back) lets the shadows of the pills stay inside the scroller, which would cut them straight */ scrollbar-width: none; }
  .col.scroll::-webkit-scrollbar { display: none; }
  .arow { display: flex; align-items: flex-end; justify-content: flex-end; gap: 8px; max-width: 100%; }
  .alines { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; max-width: 270px; }
  .name { font-size: 11px; margin: 0 4px 0 0; }
  .name.peak { color: #f3c477; } .name.paws { color: #b4d0f0; }
  .name { background: rgba(24, 24, 30, 0.62); padding: 0 7px; border-radius: 8px; }
  .pill { padding: 6px 12px; border-radius: 15px; word-break: break-word; white-space: pre-wrap; transition: opacity 0.4s linear; animation: rise 0.16s ease-out; }
  .pill.me { background: var(--me); color: var(--me-ink); }
  .pill.me.waiting { opacity: 0.7; } /* #19: sent while an answer is in flight; handled after it */
  .pill .wait { display: block; font-size: 10.5px; opacity: 0.75; margin-top: 1px; }
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
  @media (prefers-reduced-motion: reduce) { .typing i { animation: none; opacity: 0.6; } .pill { transition: none; animation: none; } .overlay { transition: none; } footer textarea { animation: none; } }
  footer { position: relative; display: flex; gap: 6px; align-items: center; }
  footer textarea { box-sizing: border-box; flex: 1; font: inherit; color: var(--ink); background: color-mix(in srgb, var(--bg) 96%, transparent); border: 1px solid var(--line); border-radius: 18px; padding: 7px 38px 7px 12px; /* the right padding is room for the send button, which sits inside the field so that the field ends where the pills and avatars end */ outline: none; resize: none; overflow-y: auto; max-height: 96px; line-height: 1.4; }
  footer textarea { animation: fieldin 0.15s ease-out; scrollbar-width: thin; scrollbar-color: rgba(120, 120, 120, 0.45) transparent; }
  @keyframes fieldin { from { opacity: 0; } }
  footer textarea::-webkit-scrollbar { width: 6px; } footer textarea::-webkit-scrollbar-button { display: none; } footer textarea::-webkit-scrollbar-track { background: transparent; margin: 10px 0; } footer textarea::-webkit-scrollbar-thumb { background: rgba(120, 120, 120, 0.45); border-radius: 3px; }
  footer textarea::placeholder { color: var(--muted); }
  footer textarea:focus { border-color: var(--ring); }
  /* #17: the group indicator, small and quiet, right above the field: faces of the members, the next recipients lit */
  .members { display: flex; align-items: center; justify-content: flex-end; gap: 6px; margin: 0 4px 2px 0; font-size: 11px; color: #e8e8ee; }
  .members .to { background: rgba(24, 24, 30, 0.55); padding: 0 7px; border-radius: 8px; }
  .members .faces { display: inline-flex; }
  .members .face { width: 20px; height: 20px; margin-left: -5px; box-shadow: 0 0 0 1.5px #fff, 0 1px 4px rgba(0, 0, 0, 0.3); transition: opacity 0.2s; }
  .members .face.dim { opacity: 0.4; }
  .members .face.invite { box-shadow: 0 0 0 1.5px #fff; outline: 1.5px dashed #b4d0f0; outline-offset: 1px; opacity: 0.85; } /* named by the draft, not yet in the chat */
  .members .note { background: rgba(24, 24, 30, 0.55); padding: 0 7px; border-radius: 8px; color: #b4d0f0; }
  .slash { position: absolute; left: 0; right: 0; bottom: calc(100% + 4px); margin: 0; padding: 4px; list-style: none; background: var(--bg); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.14); }
  .slash.list { position: static; margin: 0 0 6px 0; box-shadow: none; } /* in the flow: the window is as tall as the list too */
  .slash button { all: unset; box-sizing: border-box; display: flex; justify-content: space-between; gap: 10px; width: 100%; padding: 6px 9px; border-radius: 8px; cursor: pointer; }
  .slash li.sel button, .slash button:hover { background: var(--soft); }
  .slash code { color: var(--muted); font: 11px/1.6 ui-monospace, Consolas, monospace; }
  .send { position: absolute; right: 5px; bottom: 4px; border: 0; background: transparent; color: var(--ring); cursor: pointer; padding: 6px; border-radius: 999px; line-height: 0; }
  .send:disabled { color: var(--muted); cursor: default; }
  .send:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
</style>
