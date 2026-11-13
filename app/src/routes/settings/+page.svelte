<script lang="ts">
  // The settings window: a normal window opened from the tray menu.
  // It holds no pet state: it shows the snapshot the pet window sends and sends changes back.
  // The API key is typed here, goes straight to Rust (brain_connect) and the OS credential
  // store, and is never sent to the pet window.
  import { invoke } from "@tauri-apps/api/core";
  import { getVersion } from "@tauri-apps/api/app";
  import { channelOf } from "$lib/channel";
  import { emitTo } from "@tauri-apps/api/event";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { onMount, tick } from "svelte";
  import { brainChanged, fromSettings, type ProviderId, type SettingsSnapshot } from "$lib/bus";
  import type { Settings } from "$lib/state";
  import { UI, type ErrKind } from "$lib/ui";

  let snap = $state<SettingsSnapshot | null>(null);
  // Which brain the Brain page is showing (the one in use at first; the others can be set up too).
  let editing = $state<ProviderId>("gemini");
  let editingInit = false;
  const hasKeyHere = $derived(snap ? snap.keys[editing] : false);
  const isActive = $derived(snap?.provider === editing);
  $effect(() => {
    if (snap && !editingInit) {
      editingInit = true;
      editing = snap.provider;
    }
  });
  function pickProvider(p: ProviderId) {
    editing = p;
    replacing = false;
    err = "";
    errDetail = "";
    keyInput = "";
    ageOk = false;
    models = [];
    modelsKey = "";
    modelPick = "";
  }
  // The model of the brain in use, for the "Answering with" line.
  async function loadActiveModel() {
    try {
      activeModel = (await invoke<{ model: string }>("brain_model")).model;
    } catch {
      activeModel = "";
    }
  }
  $effect(() => {
    void snap?.provider;
    void snap?.hasKey;
    if (snap?.hasKey) void loadActiveModel();
  });
  async function useThisBrain() {
    try {
      const info = await invoke<{ active: ProviderId; gemini: boolean; groq: boolean; claude: boolean; openai: boolean }>("brain_set_provider", { provider: editing });
      if (snap) snap = { ...snap, provider: info.active, keys: { gemini: info.gemini, groq: info.groq, claude: info.claude, openai: info.openai }, hasKey: info[info.active], brainBad: false };
      void brainChanged({ type: "switched" });
    } catch (e) {
      err = ui.err[errKind(e)];
    }
  }
  const ui = $derived(UI[snap?.lang ?? "en"]);
  $effect(() => {
    document.documentElement.lang = snap?.lang ?? "en";
  });
  const s = $derived(snap?.settings);
  const pv = $derived(ui.providers[editing]);
  const usageLine = $derived(
    snap
      ? ui.usageToday
          .replace("{chat}", String(snap.usage.chat))
          .replace("{chatCap}", String(snap.usage.chatCap))
          .replace("{proactive}", String(snap.usage.proactive))
          .replace("{proactiveCap}", String(snap.usage.proactiveCap))
      : ""
  );
  const companyNow = $derived(ui.providers[snap?.provider ?? "gemini"].company);

  // "What Peak is told" (RX-6): the persona prompt for the current language, closeness and tone, read-only
  interface PersonaLayerView {
    name: string;
    locked: boolean;
    text: string;
  }
  let personaOpen = $state(false);
  let personaLayers = $state<PersonaLayerView[]>([]);
  $effect(() => {
    if (!personaOpen || !snap) return;
    const { lang, tier } = snap;
    const gentle = snap.settings.gentle;
    invoke<PersonaLayerView[]>("persona_preview", { lang, tier, gentle })
      .then((v) => (personaLayers = v))
      .catch(() => (personaLayers = []));
  });
  const personaName = (n: string): string =>
    (
      {
        voice: ui.personaVoice,
        language: ui.personaLanguage,
        core: ui.personaCore,
        "voice-ja": ui.personaVoiceJa,
        tone: ui.personaTone,
        mood: ui.personaMood,
        closeness: ui.personaCloseness,
      } as Record<string, string>
    )[n] ?? n;

  // brain
  let models = $state<string[]>([]);
  let modelPick = $state(""); // "" = automatic
  let modelName = $state(""); // the model actually in use
  let modelsKey = ""; // which key the list was fetched for ("" = the stored key)
  let modelsTimer: ReturnType<typeof setTimeout> | undefined;
  let replacing = $state(false); // user chose "Replace key" while a key exists
  let ageOk = $state(false);
  let activateAfter = $state(true); // use the brain right after connecting it
  let activeModel = $state(""); // the model the brain in use answers with
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

  // Start with Windows (the real setting lives in Windows; this only reads and flips it)
  let autostart = $state(false);
  async function setAutostart(on: boolean) {
    autostart = on;
    try {
      autostart = await invoke<boolean>("autostart_set", { on });
      void fromSettings({ type: "startup", on: autostart });
    } catch {
      autostart = !on;
    }
  }

  // "Copy stats": the opted-in events as JSON on the clipboard, for the user to hand over.
  let statsCopied = $state(false);
  async function copyStats() {
    if (!snap) return;
    const autostartNow = await invoke<boolean>("autostart_get").catch(() => null);
    const text = JSON.stringify(
      { app: "streakboom", version, installId: snap.stats.installId, events: snap.stats.events, days: snap.stats.days, config: snap.stats.config, autostart: autostartNow },
      null,
      2
    );
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
      // By hand: a Stable if there is a newer one; on a Preview copy, else the newest Preview (ADR-0095).
      const info = await invoke<{ version: string } | null>("update_check", { scope: "manual" });
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


  // what the pet remembers: the drafts follow the stored names when those change
  let petDraft = $state("");
  let meDraft = $state("");
  const storedPet = $derived(snap?.memory.petName ?? "");
  const storedMe = $derived(snap?.memory.callMe ?? "");
  $effect(() => {
    petDraft = storedPet;
  });
  $effect(() => {
    meDraft = storedMe;
  });
  let wipe = $state<"" | "habits" | "all">("");
  let wipeTimer: ReturnType<typeof setTimeout> | undefined;
  const saveName = (field: "petName" | "callMe", value: string) => void fromSettings({ type: "mem", action: "set", field, value });
  function forget(kind: "habits" | "all") {
    if (wipe !== kind) {
      wipe = kind;
      clearTimeout(wipeTimer);
      wipeTimer = setTimeout(() => (wipe = ""), 4000);
      return;
    }
    wipe = "";
    void fromSettings({ type: "mem", action: kind === "all" ? "forget-all" : "forget-habits" });
  }
  const setAi = (v: boolean) => void fromSettings({ type: "mem", action: "ai", value: v });
  let factDrafts = $state<Record<string, string>>({});
  const factText = (id: string, text: string) => factDrafts[id] ?? text;
  function saveFact(id: string) {
    const v = factDrafts[id];
    if (v === undefined) return;
    delete factDrafts[id];
    void fromSettings({ type: "mem", action: "fact-set", id, value: v });
  }
  const setLearn = (v: boolean) => void fromSettings({ type: "mem", action: "learn", value: v });
  const showWizard = $derived(!hasKeyHere || (isActive && !!snap?.brainBad) || replacing);

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (snap) snap = { ...snap, settings: { ...snap.settings, [key]: value } }; // optimistic
    void fromSettings({ type: "setting", key, value });
  }
  const setDaily = (yes: boolean) => {
    if (snap) snap = { ...snap, daily: yes };
    void fromSettings({ type: "daily", yes });
  };
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
      models = await invoke<string[]>("brain_models", { key, provider: editing });
      modelsKey = key ?? "";
    } catch {
      models = []; // the list is a nicety; "automatic" always works
    }
  }

  async function refreshModel() {
    if (!isActive) return;
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
    if (showWizard || !isActive) return; // while connecting, the choice is applied by brain_connect
    try {
      modelName = await invoke<string>("brain_set_model", { model: m || null });
    } catch (e) {
      err = ui.err[errKind(e)];
    }
  }

  // With a key stored (and not replacing) list the key's models for changing; while the wizard
  // is open, list them once a plausible key has been typed (debounced).
  // (It depends on `brainMode`, not on `snap`, so toggling a setting does not refetch the list.)
  const brainMode = $derived(!snap ? "none" : `${showWizard ? "wizard" : "manage"}:${editing}`);
  $effect(() => {
    clearTimeout(modelsTimer);
    if (brainMode === "none") return;
    if (brainMode.startsWith("manage")) {
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
      await invoke("open_key_page", { provider: editing });
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
        provider: editing,
        key: keyInput,
        lang: snap.lang,
        tier: snap.tier,
        gentle: snap.settings.gentle,
        model: modelPick || null,
        activate: activateAfter,
      });
      modelName = out.model;
      keyInput = "";
      ageOk = false;
      replacing = false;
      if (snap) {
        const keys = { ...snap.keys, [editing]: true };
        // the brain in use only changes if the user wanted it to
        const provider = activateAfter ? editing : snap.provider;
        snap = { ...snap, hasKey: keys[provider], brainBad: false, provider, keys };
      }
      void brainChanged({ type: activateAfter ? "connected" : "switched", reply: out.reply, model: out.model });
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
      const info = await invoke<{ active: ProviderId; gemini: boolean; groq: boolean; claude: boolean; openai: boolean }>("brain_forget", { provider: editing });
      confirmForget = false;
      modelName = "";
      models = [];
      if (snap) snap = { ...snap, hasKey: info[info.active], brainBad: false, provider: info.active, keys: { gemini: info.gemini, groq: info.groq, claude: info.claude, openai: info.openai } };
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

  // One page per section, chosen in the left column.
  const PAGES = ["general", "personality", "brain", "memory", "privacy", "about"] as const;
  type Page = (typeof PAGES)[number];
  let page = $state<Page>("general");
  const pageLabel = (p: Page) => ({ general: ui.pgGeneral, personality: ui.pgPersonality, brain: ui.pgBrain, memory: ui.pgMemory, privacy: ui.pgPrivacy, about: ui.pgAbout })[p];
  function goto(section: string | null | undefined) {
    if (section && (PAGES as readonly string[]).includes(section)) {
      page = section as Page;
      tick().then(() => document.getElementById("pane")?.scrollTo({ top: 0 }));
    }
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
    invoke<boolean>("autostart_get").then((v) => (autostart = v)).catch(() => {});
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

<div class="shell">
  <nav class="nav" aria-label="Settings">
    {#each PAGES as p (p)}
      <button class="navbtn" class:on={page === p} onclick={() => goto(p)}>{pageLabel(p)}</button>
    {/each}
  </nav>
<main id="pane">
  {#if !snap || !s}
    <p class="muted">…</p>
  {:else}
    {#if page === "general"}
    <section id="sec-general" class="card">
      <h2>{ui.sectionGeneral}</h2>
      <div class="row">
        <span class="lbl">{ui.language}</span>
        {#each [["auto", ui.auto], ["vi", "Tiếng Việt"], ["en", "English"], ["ja", "日本語 (beta)"]] as [v, label]}
          <button class="seg" class:on={s.lang === v} onclick={() => patch("lang", v as Settings["lang"])}>{label}</button>
        {/each}
      </div>
      <label class="chk">
        <input type="checkbox" checked={autostart} onchange={(e) => setAutostart(e.currentTarget.checked)} />
        {ui.autostart}
      </label>
      <p class="muted">{ui.autostartNote}</p>
      <div class="row">
        <span class="lbl">{ui.updatesLabel}</span>
        {#each [["auto", ui.updatesAuto], ["ask", ui.updatesAsk], ["off", ui.updModeOff]] as [v, label]}
          <button class="seg" class:on={s.updates === v} onclick={() => patch("updates", v as Settings["updates"])}>{label}</button>
        {/each}
      </div>
      <p class="muted">{s.updates === "auto" ? ui.updatesNoteAuto : s.updates === "off" ? ui.updatesNoteOff : ui.updatesNoteAsk}</p>
    </section>
    {/if}

    {#if page === "personality"}
    <section id="sec-personality" class="card">
      <h2>{ui.sectionPersonality}</h2>
      <label class="chk">
        <input type="checkbox" checked={s.gentle} onchange={(e) => patch("gentle", e.currentTarget.checked)} />
        {ui.gentle}
      </label>
    </section>
    {/if}

    {#if page === "brain"}
    <section id="sec-brain" class="card">
      <h2>{ui.sectionBrain}</h2>
      <p class="muted">{ui.brainAdult}</p>
      {#if snap.hasKey}
        <p class="activeline">{ui.activeLine.replace("{name}", ui.providers[snap.provider].name).replace("{model}", activeModel || "…")}</p>
        <p class="muted">{usageLine}</p>
      {/if}
      <div class="row">
        <span class="lbl">{ui.brainPick}</span>
        {#each ["gemini", "groq", "claude", "openai"] as p (p)}
          <button class="seg" class:on={editing === p} onclick={() => pickProvider(p as ProviderId)}>
            {ui.providers[p as ProviderId].name} <small class="tag">· {ui.providers[p as ProviderId].tag}</small>{snap.provider === p && snap.keys[p as ProviderId] ? " ✓" : ""}
          </button>
        {/each}
      </div>
      <div class="row">
        <span class="lbl">{ui.brainLabel}</span>
        <b>{hasKeyHere ? (isActive ? (snap.brainBad ? "⚠ " + ui.brainBad : ui.brainOn + " · " + ui.brainInUse) : ui.brainSaved) : ui.brainOff}</b>
      </div>

      {#if !showWizard}
        {#if isActive}
          <div class="muted">{ui.modelNow}: <b class="sel">{modelName}</b></div>
          {@render modelChips()}
        {:else}
          <div class="row"><button class="seg primary" onclick={useThisBrain}>{ui.useBrain}</button></div>
        {/if}
        <div class="row">
          <button class="seg" onclick={startReplace}>{ui.replaceKey}</button>
          <button class="seg" class:danger={confirmForget} onclick={forgetKey}>{confirmForget ? ui.sure : ui.removeKey}</button>
        </div>
      {:else}
        <ol class="steps">
          <li>{pv.step1} <button class="seg primary" onclick={openStudio}>{pv.open}</button></li>
          <li>{pv.step2}</li>
          <li>{pv.step3}</li>
        </ol>
        <p class="muted">{pv.cost}</p>
        <label class="chk"><input type="checkbox" bind:checked={ageOk} /> {pv.age}</label>
        {#if snap.hasKey && !isActive}
          <label class="chk"><input type="checkbox" bind:checked={activateAfter} /> {ui.activateNow}</label>
        {/if}
        <p class="muted">{pv.dataNote}</p>
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
        <p class="muted">{pv.keyNote}</p>
      {/if}
      <label class="chk"><input type="checkbox" checked={s?.remarks ?? true} onchange={(e) => patch("remarks", e.currentTarget.checked)} /> {ui.remarksLabel}</label>
      <p class="muted">{ui.remarksNote}</p>
      <h3 class="persona-h">{ui.personaTitle}</h3>
      <p class="muted">{ui.personaLead}</p>
      <div class="row">
        <button class="seg" onclick={() => (personaOpen = !personaOpen)}>{personaOpen ? ui.personaHide : ui.personaShow} {personaOpen ? "▾" : "▸"}</button>
      </div>
      {#if personaOpen}
        <div class="persona">
          {#each personaLayers as l (l.name)}
            <div class="layer">
              <div class="layer-name">{personaName(l.name)}{#if l.locked} <span class="lock">🔒 {ui.personaLocked}</span>{/if}</div>
              <div class="layer-text sel">{l.text}</div>
            </div>
          {/each}
        </div>
        <p class="muted">{ui.personaNote}</p>
      {/if}
    </section>
    {/if}

    {#if page === "memory"}
    <section id="sec-memory" class="card">
      <h2>{ui.sectionMemory}</h2>
      <p class="muted">{ui.memIntro}</p>
      <label class="chk">
        <input type="checkbox" checked={snap.memory.learn} onchange={(e) => setLearn(e.currentTarget.checked)} />
        {ui.memLearn}
      </label>
      <div class="row">
        <span class="lbl">{ui.memPetName}</span>
        <input class="txt" maxlength="20" placeholder={ui.memNone} bind:value={petDraft} onkeydown={(e) => e.key === "Enter" && saveName("petName", petDraft)} />
        <button class="seg" disabled={petDraft.trim() === snap.memory.petName} onclick={() => saveName("petName", petDraft)}>{ui.memSave}</button>
      </div>
      <div class="row">
        <span class="lbl">{ui.memCallMe}</span>
        <input class="txt" maxlength="20" placeholder={ui.memNone} bind:value={meDraft} onkeydown={(e) => e.key === "Enter" && saveName("callMe", meDraft)} />
        <button class="seg" disabled={meDraft.trim() === snap.memory.callMe} onclick={() => saveName("callMe", meDraft)}>{ui.memSave}</button>
      </div>
      {#if snap.memory.days > 0 || snap.memory.marks.length > 0}
        <div class="row"><span class="lbl">{ui.memDays}</span><b>{snap.memory.days}</b></div>
        {#if snap.memory.usualPart}
          <div class="row"><span class="lbl">{ui.memUsual}</span><b>{ui.memParts[snap.memory.usualPart]}</b></div>
        {/if}
        <div class="row">
          <span class="lbl">{ui.memTouches}</span>
          <b>{snap.memory.touches.poke + snap.memory.touches.scratch} / {snap.memory.touches.chat}</b>
        </div>
        <div class="row">
          <span class="lbl">{ui.memMarks}</span>
          <span>{snap.memory.marks.length ? snap.memory.marks.map((m) => ui.memMarkNames[m] ?? m).join(", ") : ui.memEmpty}</span>
        </div>
      {:else}
        <p class="muted">{ui.memEmpty}</p>
      {/if}
      <label class="chk">
        <input type="checkbox" checked={snap.memory.aiLearn} onchange={(e) => setAi(e.currentTarget.checked)} />
        {ui.memAi}
      </label>
      <p class="muted">{ui.memAiNote.replace("{company}", companyNow)}</p>
      <div class="muted">{ui.memFacts}</div>
      {#each snap.memory.facts as f (f.id)}
        <div class="row">
          <input class="txt wide" maxlength="60" value={factText(f.id, f.text)} oninput={(e) => (factDrafts[f.id] = e.currentTarget.value)} onkeydown={(e) => e.key === "Enter" && saveFact(f.id)} />
          <button class="seg" disabled={factDrafts[f.id] === undefined} onclick={() => saveFact(f.id)}>{ui.memSave}</button>
          <button class="seg" aria-label="delete" onclick={() => fromSettings({ type: "mem", action: "fact-del", id: f.id })}>×</button>
        </div>
      {:else}
        <p class="muted">{ui.memFactsNone}</p>
      {/each}
      <div class="row">
        <button class="seg" disabled={snap.memory.facts.length === 0} onclick={() => fromSettings({ type: "mem", action: "forget-facts" })}>{ui.memForgetFacts}</button>
        <button class="seg" class:danger={wipe === "habits"} onclick={() => forget("habits")}>{wipe === "habits" ? ui.sure : ui.memForgetHabits}</button>
        <button class="seg" class:danger={wipe === "all"} onclick={() => forget("all")}>{wipe === "all" ? ui.sure : ui.memForgetAll}</button>
      </div>
      <p class="muted">{ui.memForgetNote}</p>
    </section>
    {/if}

    {#if page === "privacy"}
    <section id="sec-privacy" class="card">
      <h2>{ui.sectionPrivacy}</h2>
      <div class="row">
        <span class="lbl">{ui.statsLabel}</span>
        <button class="seg" class:on={snap.consent === "on"} onclick={() => setConsent(true)}>{ui.on}</button>
        <button class="seg" class:on={snap.consent !== "on"} onclick={() => setConsent(false)}>{ui.off}</button>
      </div>
      <p class="muted">{ui.consentNote}</p>
      <label class="chk"><input type="checkbox" checked={s?.groundMap ?? false} onchange={(e) => patch("groundMap", e.currentTarget.checked)} /> {ui.groundMapLabel}</label>
      <p class="muted">{ui.groundMapNote}</p>
      {#if snap.consent === "on"}
        <div class="row">
          <span class="lbl">{ui.dailyLabel}</span>
          <button class="seg" class:on={snap.daily} onclick={() => setDaily(true)}>{ui.on}</button>
          <button class="seg" class:on={!snap.daily} onclick={() => setDaily(false)}>{ui.off}</button>
        </div>
        <p class="muted">{ui.dailyNote}</p>
        <p class="muted">{ui.statsQueued.replace("{n}", String(snap.queued))}</p>
        <div class="row">
          <button class="seg" disabled={snap.queued === 0 && snap.stats.days.length === 0} onclick={copyStats}>{statsCopied ? ui.statsCopied : ui.copyStats}</button>
        </div>
        <p class="muted">{ui.statsHint}</p>
      {/if}
    </section>
    {/if}

    {#if page === "about"}
    <section id="sec-about" class="card">
      <h2>{ui.sectionAbout}</h2>
      <div class="row">
        <button class="seg" onclick={() => fromSettings({ type: "tour" })}>{ui.tourReplay}</button>
      </div>
      <div class="row">
        <span class="lbl">{ui.versionLabel}</span>
        <b class="sel">{version}{channelOf(version) === "preview" ? " · " + ui.previewTag : ""}</b>
      </div>
      <div class="row">
        <button class="seg" onclick={() => invoke("open_website").catch(() => {})}>{ui.openWebsite}</button>
      </div>
      <!-- spec 12 section 4: always reachable, static, no numbers and no country -->
      <h3 class="help">{ui.helpTitle}</h3>
      <p class="muted help">{ui.helpText}</p>
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
  {/if}
</main>
</div>

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
  .activeline {
    margin: 0;
    padding: 6px 10px;
    background: #fff7e0;
    border-radius: 8px;
    font-weight: 600;
  }
  .shell {
    display: flex;
    height: 100vh;
  }
  .nav {
    flex: 0 0 150px;
    box-sizing: border-box;
    padding: 14px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: #efece3;
    border-right: 1px solid #e3dfd2;
  }
  .navbtn {
    text-align: left;
    border: 0;
    background: transparent;
    border-radius: 8px;
    padding: 8px 10px;
    font: inherit;
    color: #333;
    cursor: pointer;
  }
  .navbtn:hover {
    background: #e6e2d6;
  }
  .navbtn.on {
    background: #fff;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  }
  main {
    flex: 1;
    min-width: 0;
    overflow-y: auto;
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
  h3.help {
    margin: 8px 0 0;
    font-size: 13px;
    font-weight: 600;
  }
  .muted.help {
    user-select: text;
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
  .persona-h {
    margin: 10px 0 0;
    font-size: 14px;
  }
  .persona {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .layer {
    border: 1px solid #e3e3e3;
    border-radius: 8px;
    padding: 8px 10px;
  }
  .layer-name {
    font-size: 12px;
    font-weight: 600;
    color: #555;
    margin-bottom: 3px;
  }
  .lock {
    font-weight: 400;
    color: #888;
  }
  .layer-text {
    font-size: 12.5px;
    line-height: 1.45;
    color: #333;
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
  .txt {
    width: 150px;
  }
  .txt.wide {
    width: 230px;
  }
  .txt,
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
  .seg {
    border: 0;
    border-radius: 7px;
    background: #f3f1ea;
    padding: 4px 10px;
    font: inherit;
    cursor: pointer;
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
  .tag {
    opacity: 0.65;
    font-size: 0.8em;
  }
</style>
