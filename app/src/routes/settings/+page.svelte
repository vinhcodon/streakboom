<script lang="ts">
  // The settings window: a normal window opened from the tray or the pet's right-click menu.
  // It holds no pet state: it shows the snapshot the pet window sends and sends changes back.
  // The API key is typed here, goes straight to Rust (brain_connect) and the OS credential
  // store, and is never sent to the pet window.
  import { invoke } from "@tauri-apps/api/core";
  import { getVersion } from "@tauri-apps/api/app";
  import { emitTo } from "@tauri-apps/api/event";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { onMount, tick } from "svelte";
  import { brainChanged, fromSettings, type SettingsSnapshot } from "$lib/bus";
  import type { Settings } from "$lib/state";
  import { UI, type ErrKind } from "$lib/ui";

  let snap = $state<SettingsSnapshot | null>(null);
  const ui = $derived(UI[snap?.lang ?? "en"]);
  const s = $derived(snap?.settings);

  // brain
  let models = $state<string[]>([]);
  let modelPick = $state(""); // "" = automatic
  let modelName = $state(""); // the model actually in use
  let modelsKey = ""; // which key the list was fetched for ("" = the stored key)
  let modelsTimer: ReturnType<typeof setTimeout> | undefined;
  let replacing = $state(false); // user chose "Replace key" while a key exists
  let ageOk = $state(false);
  let keyInput = $state("");
  let busy = $state(false);
  let connSecs = $state(0);
  let err = $state("");
  let errDetail = $state("");
  let showDetail = $state(false);
  let errCopied = $state(false);
  let confirmForget = $state(false);
  let confirmTimer: ReturnType<typeof setTimeout> | undefined;
  let waitingForReturn = false;

  // about and updates
  let version = $state("");
  let updatesOn = $state(false);
  let upBusy = $state(false);
  let upInfo = $state<{ version: string } | null>(null);
  let upMsg = $state("");

  // "Copy stats": the opted-in events as JSON on the clipboard, for the user to hand over.
  let statsCopied = $state(false);
  async function copyStats() {
    if (!snap) return;
    const text = JSON.stringify({ app: "streakboom", version, installId: snap.stats.installId, events: snap.stats.events }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      statsCopied = true;
      setTimeout(() => (statsCopied = false), 2500);
    } catch {
      /* clipboard blocked: nothing else to do */
    }
  }

  async function checkNow() {
    upBusy = true;
    upInfo = null;
    upMsg = "";
    try {
      const info = await invoke<{ version: string } | null>("update_check");
      upInfo = info;
      upMsg = info ? ui.updateAvailable.replace("{v}", info.version) : ui.upToDate;
    } catch {
      upMsg = ui.updateFailed;
    } finally {
      upBusy = false;
    }
  }

  async function installNow() {
    upBusy = true;
    upMsg = ui.updating;
    try {
      await invoke("update_install"); // installs and restarts; normally never returns
    } catch {
      upMsg = ui.updateFailed;
      upBusy = false;
    }
  }

  const showWizard = $derived(!snap?.hasKey || snap?.brainBad || replacing);

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (snap) snap = { ...snap, settings: { ...snap.settings, [key]: value } }; // optimistic
    void fromSettings({ type: "setting", key, value });
  }
  const stepHour = (key: "qhStart" | "qhEnd", d: number) => s && patch(key, (s[key] + d + 24) % 24);
  const setConsent = (yes: boolean) => {
    if (snap) snap = { ...snap, consent: yes ? "on" : "off" };
    void fromSettings({ type: "consent", yes });
  };

  function errKind(e: unknown): ErrKind {
    const k = (e as { kind?: string } | null)?.kind;
    return k && k in ui.err ? (k as ErrKind) : "unknown";
  }

  async function loadModels(key: string | null) {
    try {
      models = await invoke<string[]>("brain_models", { key });
      modelsKey = key ?? "";
    } catch {
      models = []; // the list is a nicety; "automatic" always works
    }
  }

  async function refreshModel() {
    try {
      const m = await invoke<{ model: string; auto: boolean }>("brain_model");
      modelName = m.model;
      if (!showWizard) modelPick = m.auto ? "" : m.model;
    } catch {
      /* ignore */
    }
  }

  async function pickModel(m: string) {
    modelPick = m;
    if (showWizard) return; // while connecting, the choice is applied by brain_connect
    try {
      modelName = await invoke<string>("brain_set_model", { model: m || null });
    } catch (e) {
      err = ui.err[errKind(e)];
    }
  }

  // With a key stored (and not replacing) list the key's models for changing; while the wizard
  // is open, list them once a plausible key has been typed (debounced).
  // (It depends on `brainMode`, not on `snap`, so toggling a setting does not refetch the list.)
  const brainMode = $derived(!snap ? "none" : showWizard ? "wizard" : "manage");
  $effect(() => {
    clearTimeout(modelsTimer);
    if (brainMode === "none") return;
    if (brainMode === "manage") {
      loadModels(null);
      refreshModel();
      return;
    }
    const k = keyInput.trim();
    if (!ageOk || k.length < 20 || k === modelsKey) return;
    modelsTimer = setTimeout(() => loadModels(k), 700);
    return () => clearTimeout(modelsTimer);
  });

  async function openStudio() {
    try {
      await invoke("open_key_page");
      waitingForReturn = true;
      void fromSettings({ type: "track", event: "get_key_clicked" });
    } catch {
      err = ui.err.unknown;
    }
  }

  async function connect() {
    if (busy || !ageOk || !keyInput.trim() || !snap) return;
    busy = true;
    err = "";
    errDetail = "";
    showDetail = false;
    errCopied = false;
    connSecs = 0;
    const secsTimer = setInterval(() => (connSecs += 1), 1000);
    void fromSettings({ type: "track", event: "key_pasted" });
    try {
      const out = await invoke<{ reply: string; model: string }>("brain_connect", {
        key: keyInput,
        lang: snap.lang,
        tier: snap.tier,
        gentle: snap.settings.gentle,
        model: modelPick || null,
      });
      modelName = out.model;
      keyInput = "";
      ageOk = false;
      replacing = false;
      if (snap) snap = { ...snap, hasKey: true, brainBad: false };
      void brainChanged({ type: "connected", reply: out.reply, model: out.model });
    } catch (e) {
      const m = (e as { message?: string } | null)?.message;
      err = ui.err[errKind(e)];
      errDetail = typeof m === "string" ? m.slice(0, 400) : "";
    } finally {
      clearInterval(secsTimer);
      busy = false;
    }
  }

  async function copyErr() {
    try {
      await navigator.clipboard.writeText(errDetail ? `${err} [${errDetail}]` : err);
      errCopied = true;
    } catch {
      /* the text is selectable by hand */
    }
  }

  async function forgetKey() {
    if (!confirmForget) {
      confirmForget = true;
      clearTimeout(confirmTimer);
      confirmTimer = setTimeout(() => (confirmForget = false), 4000);
      return;
    }
    try {
      await invoke("brain_forget");
      confirmForget = false;
      modelName = "";
      models = [];
      if (snap) snap = { ...snap, hasKey: false, brainBad: false };
      void brainChanged({ type: "removed" });
    } catch (e) {
      confirmForget = false;
      err = ui.err[errKind(e)];
    }
  }

  function startReplace() {
    replacing = true;
    models = [];
    modelsKey = "";
    modelPick = "";
    err = "";
  }

  function goto(section: string | null | undefined) {
    if (!section) return;
    tick().then(() => document.getElementById(`sec-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  onMount(() => {
    const cleanups: Array<() => void> = [];
    const onFocus = () => {
      if (waitingForReturn) {
        waitingForReturn = false;
        void fromSettings({ type: "track", event: "returned_to_app" });
      }
    };
    window.addEventListener("focus", onFocus);
    cleanups.push(() => window.removeEventListener("focus", onFocus));
    getVersion().then((v) => (version = v)).catch(() => {});
    invoke<boolean>("update_enabled").then((v) => (updatesOn = v)).catch(() => {});
    (async () => {
      const win = getCurrentWebviewWindow();
      cleanups.push(
        await win.listen<SettingsSnapshot>("settings-snapshot", (e) => {
          const first = snap === null;
          snap = e.payload;
          if (first) invoke<string | null>("take_settings_section").then(goto).catch(() => {});
        })
      );
      cleanups.push(await win.listen<string>("settings-goto", (e) => goto(e.payload)));
      await emitTo("main", "settings-ready", {});
    })();
    return () => cleanups.forEach((c) => c());
  });
</script>

<svelte:window oncontextmenu={(e) => { if (!(e.target as HTMLElement)?.closest("input, .sel")) e.preventDefault(); }} />

<main>
  {#if !snap || !s}
    <p class="muted">…</p>
  {:else}
    <section id="sec-general" class="card">
      <h2>{ui.sectionGeneral}</h2>
      <div class="row">
        <span class="lbl">{ui.language}</span>
        {#each [["auto", ui.auto], ["vi", "Tiếng Việt"], ["en", "English"]] as [v, label]}
          <button class="seg" class:on={s.lang === v} onclick={() => patch("lang", v as Settings["lang"])}>{label}</button>
        {/each}
      </div>
      <div class="row">
        <span class="lbl">{ui.chattiness}</span>
        {#each [["quiet", ui.quiet], ["normal", ui.normal], ["chatty", ui.chatty]] as [v, label]}
          <button class="seg" class:on={s.freq === v} onclick={() => patch("freq", v as Settings["freq"])}>{label}</button>
        {/each}
      </div>
      <label class="chk">
        <input type="checkbox" checked={s.gentle} onchange={(e) => patch("gentle", e.currentTarget.checked)} />
        {ui.gentle}
      </label>
      <div class="row">
        <label class="chk">
          <input type="checkbox" checked={s.qhOn} onchange={(e) => patch("qhOn", e.currentTarget.checked)} />
          {ui.quietHours}
        </label>
        <button class="step" onclick={() => stepHour("qhStart", -1)}>−</button>
        <span class="hr">{String(s.qhStart).padStart(2, "0")}:00</span>
        <button class="step" onclick={() => stepHour("qhStart", 1)}>+</button>
        <span>{ui.to}</span>
        <button class="step" onclick={() => stepHour("qhEnd", -1)}>−</button>
        <span class="hr">{String(s.qhEnd).padStart(2, "0")}:00</span>
        <button class="step" onclick={() => stepHour("qhEnd", 1)}>+</button>
      </div>
    </section>

    <section id="sec-brain" class="card">
      <h2>{ui.sectionBrain}</h2>
      <div class="row">
        <span class="lbl">{ui.brainLabel}</span>
        <b>{snap.hasKey ? (snap.brainBad ? "⚠ " + ui.brainBad : ui.brainOn) : ui.brainOff}</b>
      </div>

      {#if !showWizard}
        <div class="muted">{ui.modelNow}: <b class="sel">{modelName}</b></div>
        {@render modelChips()}
        <div class="row">
          <button class="seg" onclick={startReplace}>{ui.replaceKey}</button>
          <button class="seg" class:danger={confirmForget} onclick={forgetKey}>{confirmForget ? ui.sure : ui.removeKey}</button>
        </div>
      {:else}
        <ol class="steps">
          <li>{ui.step1} <button class="seg primary" onclick={openStudio}>{ui.openStudio}</button></li>
          <li>{ui.step2}</li>
          <li>{ui.step3}</li>
        </ol>
        <label class="chk"><input type="checkbox" bind:checked={ageOk} /> {ui.age}</label>
        <p class="muted">{ui.dataNote}</p>
        <input
          class="key"
          type="password"
          autocomplete="off"
          spellcheck="false"
          placeholder={ui.keyPlaceholder}
          disabled={!ageOk || busy}
          bind:value={keyInput}
          onkeydown={(e) => e.key === "Enter" && connect()}
        />
        {#if models.length > 0}{@render modelChips()}{/if}
        <div class="row">
          {#if busy}<span class="progress"><span class="spin"></span>{ui.connecting} {connSecs}s</span>{/if}
          <button class="seg primary push" disabled={!ageOk || !keyInput.trim() || busy} onclick={connect}>
            {busy ? ui.connecting : ui.connect}
          </button>
          {#if replacing && !busy}<button class="seg" onclick={() => (replacing = false)}>{ui.back}</button>{/if}
        </div>
        {#if busy && connSecs >= 8}<p class="muted">{ui.slowHint}</p>{/if}
        {#if err}
          <div class="err">{err}</div>
          {#if errDetail}
            <div class="row">
              <button class="seg" onclick={() => (showDetail = !showDetail)}>{ui.details} {showDetail ? "▾" : "▸"}</button>
              <button class="seg" onclick={copyErr}>{errCopied ? ui.copied : ui.copy}</button>
            </div>
            {#if showDetail}<div class="muted sel detail">{errDetail}</div>{/if}
          {/if}
        {/if}
        <p class="muted">{ui.keyNote}</p>
      {/if}
    </section>

    <section id="sec-privacy" class="card">
      <h2>{ui.sectionPrivacy}</h2>
      <div class="row">
        <span class="lbl">{ui.statsLabel}</span>
        <button class="seg" class:on={snap.consent === "on"} onclick={() => setConsent(true)}>{ui.on}</button>
        <button class="seg" class:on={snap.consent !== "on"} onclick={() => setConsent(false)}>{ui.off}</button>
      </div>
      <p class="muted">{ui.consentNote}</p>
      {#if snap.consent === "on"}
        <p class="muted">{ui.statsQueued.replace("{n}", String(snap.queued))}</p>
        <div class="row">
          <button class="seg" disabled={snap.queued === 0} onclick={copyStats}>{statsCopied ? ui.statsCopied : ui.copyStats}</button>
        </div>
        <p class="muted">{ui.statsHint}</p>
      {/if}
    </section>

    <section id="sec-about" class="card">
      <h2>{ui.sectionAbout}</h2>
      <div class="row">
        <span class="lbl">{ui.versionLabel}</span>
        <b class="sel">{version}</b>
      </div>
      {#if !updatesOn}
        <p class="muted">{ui.updatesOff}</p>
      {:else}
        <div class="row">
          <button class="seg" disabled={upBusy} onclick={checkNow}>{upBusy && !upInfo ? ui.checkingUpdates : ui.checkUpdates}</button>
          {#if upInfo}
            <button class="seg primary" disabled={upBusy} onclick={installNow}>{ui.updateNow}</button>
          {/if}
        </div>
        {#if upMsg}<p class="muted">{upMsg}</p>{/if}
      {/if}
    </section>
  {/if}
</main>

{#snippet modelChips()}
  <div class="models">
    <span class="lbl">{ui.modelLabel}</span>
    <div class="chips">
      <button class="seg" class:on={modelPick === ""} onclick={() => pickModel("")}>{ui.modelAuto}</button>
      {#each models as m (m)}
        <button class="seg" class:on={modelPick === m} onclick={() => pickModel(m)}>{m}</button>
      {/each}
    </div>
    <p class="muted">{ui.modelHint}</p>
  </div>
{/snippet}

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: #f6f4ee;
    color: #222;
    font: 14px/1.45 "Segoe UI", system-ui, sans-serif;
  }
  main {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .card {
    background: #fff;
    border-radius: 12px;
    padding: 12px 14px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    gap: 9px;
  }
  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
  .lbl {
    min-width: 96px;
    color: #666;
  }
  .muted {
    margin: 0;
    font-size: 12.5px;
    color: #777;
  }
  .err {
    color: #b3261e;
  }
  .sel {
    user-select: text;
    cursor: text;
    word-break: break-word;
  }
  .detail {
    word-break: break-all;
  }
  .steps {
    margin: 0;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  .chk {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .key {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 6px 9px;
    font: inherit;
    background: #fff;
    color: #222;
  }
  .key:disabled {
    background: #f7f7f7;
    color: #888;
  }
  .models {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .seg,
  .step {
    border: 0;
    border-radius: 7px;
    background: #f3f1ea;
    padding: 4px 10px;
    font: inherit;
    cursor: pointer;
  }
  .step {
    padding: 2px 8px;
  }
  .seg:hover {
    background: #ece8da;
  }
  .seg:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .seg.on,
  .seg.primary {
    background: #f4b942;
    font-weight: 600;
  }
  .seg.danger {
    background: #f6b8b3;
  }
  .push {
    margin-left: auto;
  }
  .hr {
    font-variant-numeric: tabular-nums;
  }
  .progress {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #555;
  }
  .spin {
    width: 11px;
    height: 11px;
    border: 2px solid #ccc;
    border-top-color: #555;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
