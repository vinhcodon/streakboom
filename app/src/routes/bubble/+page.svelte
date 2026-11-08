<script lang="ts">
  // The speech-bubble window. A pure view: the pet window sends what to show ("bubble-view")
  // and the Rust side places this window next to the pet ("bubble-place"). One bubble morphs
  // between plain speech, the ask/consent cards and the chat (compose -> thinking -> answer).
  import { invoke } from "@tauri-apps/api/core";
  import { emitTo } from "@tauri-apps/api/event";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { onMount, tick } from "svelte";
  import { fromBubble, type BubbleView } from "$lib/bus";
  import { pauseAfter, speedFor, words } from "$lib/reveal";

  type Side = "above" | "below" | "left" | "right";

  let view = $state<BubbleView>({ kind: "none" });
  let side = $state<Side>("above");
  let tailAt = $state(60); // distance along the bubble edge to the pet's center (px)
  let boxW = $state(0);
  let boxH = $state(0);
  let draft = $state("");
  let root: HTMLDivElement | undefined = $state();
  let input: HTMLInputElement | undefined = $state();

  // The pet's answer appears word by word, each word fading in (see $lib/reveal.ts).
  let shownWords = $state<string[]>([]);
  let revealTimer: ReturnType<typeof setTimeout> | undefined;
  let revealedFor = "";
  const reduceMotion = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const interactive = $derived(
    view.kind === "chat" || view.kind === "ask" || view.kind === "consent" || view.kind === "update" || view.kind === "input"
  );
  const hasBrain = $derived(view.kind === "chat" && view.canChat);
  const chatReady = $derived(view.kind === "chat" && view.canChat && view.phase !== "thinking");
  const tailPos = $derived(Math.min(Math.max(tailAt, 26), Math.max(26, (side === "above" || side === "below" ? boxW : boxH) - 26)));

  // Restart the reveal whenever a new answer arrives.
  $effect(() => {
    const full = view.kind === "chat" && view.phase === "reply" ? view.reply : "";
    if (full === revealedFor) return;
    revealedFor = full;
    clearTimeout(revealTimer);
    const all = words(full);
    if (all.length === 0) {
      shownWords = [];
      return;
    }
    if (reduceMotion) {
      shownWords = all;
      return;
    }
    const speed = speedFor(all);
    let i = 0;
    shownWords = [];
    const next = () => {
      shownWords = all.slice(0, ++i);
      if (i < all.length) revealTimer = setTimeout(next, pauseAfter(all[i - 1]) / speed);
    };
    revealTimer = setTimeout(next, 180); // a beat after the dots disappear
  });

  // After every render, tell Rust how big we are so it can size, show and place the window.
  let lastKey = "";
  let lastFocusKey = "";
  $effect(() => {
    void view;
    void side;
    tick().then(async () => {
      if (view.kind === "none") {
        if (lastKey !== "none") {
          lastKey = "none";
          lastFocusKey = "";
          draft = "";
          await invoke("bubble_hide").catch(() => {});
        }
        return;
      }
      if (!root) return;
      const r = root.getBoundingClientRect();
      const w = Math.ceil(r.width);
      const h = Math.ceil(r.height);
      boxW = w;
      boxH = h;
      const focusKey = view.kind === "chat" && chatReady ? "chat" : view.kind === "input" ? `input-${view.field}` : "";
      const focus = focusKey !== "" && focusKey !== lastFocusKey;
      lastFocusKey = focusKey;
      const key = `${w}x${h}:${interactive}:${focus}`;
      if (key !== lastKey) {
        lastKey = key;
        await invoke("bubble_fit", { w, h, interactive, focus }).catch(() => {});
      }
      if (focus) input?.focus();
    });
  });

  function send() {
    const text = draft.trim();
    if (!text || !chatReady) return;
    draft = "";
    void fromBubble({ type: "typing", nonEmpty: false });
    void fromBubble({ type: "chat-send", text });
  }

  function submitInput() {
    if (view.kind !== "input") return;
    const value = draft.trim();
    if (!value) return;
    const field = view.field;
    draft = "";
    void fromBubble({ type: "input", field, value });
  }

  let wasEmpty = true;
  function onInput() {
    const nonEmpty = draft.trim().length > 0;
    if (nonEmpty === !wasEmpty) return;
    wasEmpty = !nonEmpty;
    void fromBubble({ type: "typing", nonEmpty });
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") void fromBubble({ type: "close" });
  }

  onMount(() => {
    const cleanups: Array<() => void> = [];
    (async () => {
      const win = getCurrentWebviewWindow();
      cleanups.push(
        await win.listen<BubbleView>("bubble-view", (e) => {
          view = e.payload;
        })
      );
      cleanups.push(
        await win.listen<{ side: Side; tail: number }>("bubble-place", (e) => {
          side = e.payload.side;
          tailAt = e.payload.tail;
        })
      );
      await emitTo("main", "bubble-ready", {}); // the pet re-sends the current view
    })();
    return () => {
      clearTimeout(revealTimer);
      cleanups.forEach((c) => c());
    };
  });
</script>

<svelte:window onkeydown={onKey} oncontextmenu={(e) => e.preventDefault()} />

{#if view.kind !== "none"}
  <div class="root {side}" bind:this={root}>
    <div class="card">
      {#if view.kind === "say"}
        <div class="say">{view.text}</div>
      {:else if view.kind === "ask"}
        <div class="say">{view.text}</div>
        <div class="row end">
          <button class="btn" onclick={() => fromBubble({ type: "ask-later" })}>{view.later}</button>
          <button class="btn primary" onclick={() => fromBubble({ type: "ask-yes" })}>{view.yes}</button>
        </div>
      {:else if view.kind === "update"}
        <div class="say">{view.text}</div>
        <div class="row end">
          <button class="btn" onclick={() => fromBubble({ type: "update-later" })}>{view.later}</button>
          <button class="btn primary" onclick={() => fromBubble({ type: "update-yes" })}>{view.yes}</button>
        </div>
      {:else if view.kind === "input"}
        <div class="say">{view.text}</div>
        <div class="inputwrap">
          <input
            bind:this={input}
            bind:value={draft}
            class="chat"
            placeholder={view.placeholder}
            maxlength="20"
            autocomplete="off"
            onkeydown={(e) => e.key === "Enter" && submitInput()}
          />
        </div>
        <div class="row end">
          <button class="btn" onclick={() => view.kind === "input" && fromBubble({ type: "input-skip", field: view.field })}>{view.skip}</button>
          <button class="btn primary" disabled={!draft.trim()} onclick={submitInput}>{view.ok}</button>
        </div>
      {:else if view.kind === "consent"}
        <div class="say">{view.text}</div>
        <div class="note">{view.note}</div>
        <div class="row end">
          <button class="btn" onclick={() => fromBubble({ type: "consent", yes: false })}>{view.no}</button>
          <button class="btn" onclick={() => fromBubble({ type: "consent", yes: true })}>{view.yes}</button>
        </div>
      {:else if view.kind === "chat"}
        {#if view.user}
          <div class="you">{view.user}</div>
        {/if}
        {#if view.phase === "thinking"}
          <div class="thinking" aria-label={view.thinking}>
            <span class="dots"><i></i><i></i><i></i></span>
            {#if view.slow}<span class="slow">{view.slow}</span>{/if}
          </div>
        {:else if view.phase === "reply" && view.reply}
          <!-- The full text is laid out invisibly so the bubble keeps one size while it types. -->
          <div class="say typing">
            <span class="ghost">{view.reply}</span>
            <span class="typed">{#each shownWords as w, i (i)}<span class="w">{w}</span>{/each}</span>
          </div>
        {/if}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="inputwrap" onclick={() => !hasBrain && fromBubble({ type: "chat-blocked" })}>
          <input
            bind:this={input}
            bind:value={draft}
            class="chat"
            disabled={!chatReady}
            placeholder={view.placeholder}
            maxlength="300"
            autocomplete="off"
            oninput={onInput}
            onkeydown={(e) => e.key === "Enter" && send()}
          />
        </div>
      {/if}
    </div>
    <div class="tail" style="--t:{tailPos}px"></div>
  </div>
{/if}

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: transparent;
    overflow: hidden;
    user-select: none;
    font: 13px/1.4 "Segoe UI", system-ui, sans-serif;
  }
  /* The margin around the card holds the shadow and the tail. */
  .root {
    position: relative;
    box-sizing: border-box;
    width: max-content;
    max-width: 250px;
    padding: 10px;
  }
  .card {
    background: #fff;
    color: #222;
    border-radius: 14px;
    padding: 8px 12px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 80px;
  }
  .say {
    text-align: center;
    word-break: break-word;
    white-space: pre-line;
  }
  /* A reply reads like a chat answer: left-aligned, so a half-written line does not shift. */
  .typing {
    position: relative;
    text-align: left;
  }
  .ghost {
    visibility: hidden;
  }
  .typed {
    position: absolute;
    inset: 0;
  }
  .w {
    animation: wordin 0.45s ease-out both;
  }
  @keyframes wordin {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  .note {
    font-size: 11px;
    color: #777;
    line-height: 1.35;
  }
  .you {
    align-self: flex-end;
    max-width: 85%;
    background: #f3f1ea;
    color: #555;
    border-radius: 10px;
    padding: 2px 8px;
    font-size: 11.5px;
    word-break: break-word;
  }
  .thinking {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 20px;
  }
  .slow {
    font-size: 11px;
    color: #888;
  }
  .dots {
    display: inline-flex;
    gap: 4px;
  }
  .dots i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #aaa;
    animation: blink 1.1s infinite ease-in-out;
  }
  .dots i:nth-child(2) {
    animation-delay: 0.18s;
  }
  .dots i:nth-child(3) {
    animation-delay: 0.36s;
  }
  @keyframes blink {
    0%,
    80%,
    100% {
      opacity: 0.25;
      transform: translateY(0);
    }
    40% {
      opacity: 1;
      transform: translateY(-3px);
    }
  }
  .inputwrap {
    display: flex;
  }
  .chat {
    flex: 1;
    min-width: 170px;
    box-sizing: border-box;
    border: 1px solid #e3dfd2;
    border-radius: 10px;
    padding: 5px 9px;
    font: inherit;
    background: #fbfaf6;
    color: #222;
  }
  .chat:focus {
    outline: 2px solid #f4b942;
    outline-offset: -1px;
  }
  .chat:disabled {
    pointer-events: none;
    color: #888;
    background: #f4f2ea;
  }
  .row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }
  .row.end {
    justify-content: flex-end;
  }
  .btn {
    border: 0;
    border-radius: 8px;
    background: #f3f1ea;
    padding: 4px 10px;
    font: inherit;
    cursor: pointer;
  }
  .btn:hover {
    background: #ece8da;
  }
  .btn.primary {
    background: #f4b942;
    font-weight: 600;
  }

  /* Tail: a small triangle on the edge facing the pet. */
  .tail {
    position: absolute;
    width: 0;
    height: 0;
    border: 8px solid transparent;
  }
  .above .tail {
    bottom: 2px;
    left: calc(var(--t) - 8px);
    border-bottom: 0;
    border-top-color: #fff;
  }
  .below .tail {
    top: 2px;
    left: calc(var(--t) - 8px);
    border-top: 0;
    border-bottom-color: #fff;
  }
  .left .tail {
    right: 2px;
    top: calc(var(--t) - 8px);
    border-right: 0;
    border-left-color: #fff;
  }
  .right .tail {
    left: 2px;
    top: calc(var(--t) - 8px);
    border-left: 0;
    border-right-color: #fff;
  }
</style>
