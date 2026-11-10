<script lang="ts">
  // The pet window. It owns all state and logic; speech bubbles are shown by the "bubble"
  // window and settings by the "settings" window (see $lib/bus.ts for the messages).
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { onMount } from "svelte";
  import Pet from "$lib/PetRig.svelte";
  import { isDozing, moodPose, needsWakeFirst, TIMED, type PetState } from "$lib/sprites";
  import type { Trigger } from "$lib/lines";
  import { bagAfter, candidates, fill, pick, remember, resolveLang } from "$lib/selector";
  import { REPEAT_WINDOW_MS, bump, stageFor, type Repeat, type RepeatKind } from "$lib/escalation";
  import { newScratch, scratchStep } from "$lib/gestures";
  import {
    addFacts,
    cooled,
    countChat,
    defaultMemory,
    forgetAll,
    forgetFacts,
    knownFor,
    removeFact,
    resetExtract,
    setFact,
    forgetHabits,
    nextMark,
    parseMemory,
    recordAsked,
    recordSession,
    recordTouch,
    sayKind,
    setName,
    shareMark,
    shouldAsk,
    usualPart,
    type Memory,
    type Touch,
  } from "$lib/memory";
  import { memLine, type MemKind } from "$lib/memlines";
  import {
    toBubble,
    toSettings,
    type BrainChange,
    type BubbleAction,
    type BubbleView,
    type MemField,
    type MemoryView,
    type ProviderId,
    type SettingsPatch,
    type SettingsSnapshot,
  } from "$lib/bus";
  import {
    bumpDay,
    countsDaily,
    recordDailyAsk,
    setDailyCounts,
    shouldAskDaily,
    AI_CHAT_DAILY_CAP,
    AI_PROACTIVE_DAILY_CAP,
    aiGate,
    bandOf,
    coolDown,
    dayKey,
    defaultData,
    inQuietHours,
    interact,
    parse,
    recordAi,
    finishTour,
    markStartupDone,
    recordAsk,
    recordStartupAsk,
    shouldAskStartup,
    recordConsentAsk,
    recordEvent,
    recordBellyHint,
    recordHint,
    recordRub,
    recordScratch,
    shouldHintBelly,
    setConsent,
    shouldAskBrain,
    shouldAskConsent,
    shouldHintGesture,
    shouldOfferUpdate,
    snoozeAsk,
    snoozeUpdate,
    startSession,
    tick,
    tierOf,
    type PetData,
    type Settings,
  } from "$lib/state";
  import type { FunnelEvent } from "$lib/telemetry";
  import { UI, type ErrKind } from "$lib/ui";
  import { LEAVE_MIN_ROOM_PX, LEAVE_PX, SLEEP_CROWD_MS, decideFocus, initialFocus, wakesToMakeWay, type FocusOut } from "$lib/focus";
  import { glideOut, rampIn, takeSteps } from "$lib/gait";
  import { chainAt, planFall, splitHop, totalMs, type Flight } from "$lib/hop";
  import { startGroundWatch, stepGround } from "$lib/groundwatch";
  import { wordsAtMs, type Beat } from "$lib/beats";
  import { chooseBeat } from "$lib/choose";
  import { EVENTS, type EventId } from "$lib/events";
  import { escapeRow, initialLane, stepLane, type LaneOut } from "$lib/lane";
  import { engage as engagePure, markShown as markShownPure, minuteIncrement, noShown, type DayCounter, type DayStat } from "$lib/bond";

  // Pet window layout (logical px) - keep in sync with src-tauri/src/lib.rs.
  const PET_LEFT = 10;
  const PET_TOP = 10;
  const PET_SIZE = 120;
  const WALK_SPEED = 36; // logical px per second
  const WALK_TICK_MS = 66;
  const DRAG_START_PX = 5; // pointer travel before a press becomes a drag
  const MIN = 60_000;
  const MAX_REPLY_CHARS = 240;

  type Panel = null | "chat" | "ask" | "consent" | "update" | "input" | "choice" | "tour" | "dailyconsent";
  type Turn = { role: "user" | "model"; text: string };

  let pose = $state<PetState>("idle");
  let poseTick = $state(0); // bumped on every change of pose so one-shot animations replay
  let dir = $state<1 | -1>(1);
  let gaze = $state<{ x: number; y: number } | null>(null); // where the cursor is over the cat (eyes follow)
  let tilt = $state(0); // degrees the pet leans while it is carried (follows the cursor's speed)
  let quiet = $state(false); // "Quiet mode": pet sleeps and says nothing
  let data = $state<PetData>(defaultData(Date.now()));
  let mem = $state<Memory>(defaultMemory()); // what the pet remembers (its own file, memory.json)
  let inputField = $state<MemField>("petName");

  // What the bubble window shows: a plain speech line, or one of the panels.
  let panel = $state<Panel>(null);
  let bubbleText = $state("");
  let bubbleExclaim = $state(false); // the bubble shows a cry: bigger, bolder, with a small jolt (spec/09)
  let bubbleOn = $state(false);

  // brain (BYOK). The key itself never reaches this window: it lives in the settings window's
  // input box and the OS credential store.
  let hasKey = $state(false);
  let providerInfo = $state<{ active: ProviderId; gemini: boolean; groq: boolean; claude: boolean; openai: boolean }>({ active: "gemini", gemini: false, groq: false, claude: false, openai: false });
  /** Re-reads which brain is in use and whether it has a key (the keys themselves never come here). */
  async function refreshBrain() {
    try {
      providerInfo = await invoke("brain_provider");
      hasKey = await invoke<boolean>("brain_status");
    } catch {
      /* keep what we had */
    }
  }
  let brainBad = $state(false); // stored key was rejected; ask for a new one
  let busy = $state(false);
  let chatPhase = $state<"compose" | "thinking" | "reply">("compose");
  let chatUser = $state("");
  let chatReply = $state("");
  let chatSlow = $state(false);
  let replyMood = "neutral"; // how the last answer felt ("none" = it was an error, so no reaction)
  let chatDraft = false; // the user has typed something in the bubble's text box
  let updateVersion = $state(""); // the version the update offer is about
  let history: Turn[] = [];

  let lonely = false;
  const sessionStart = Date.now();
  let lastClickSay = 0;

  let nextTimer: ReturnType<typeof setTimeout> | undefined;
  let sleepTimer: ReturnType<typeof setTimeout> | undefined;
  let oneShotTimer: ReturnType<typeof setTimeout> | undefined;
  let tiltTimer: ReturnType<typeof setTimeout> | undefined;
  let walkTimer: ReturnType<typeof setInterval> | undefined;
  let walkEndTimer: ReturnType<typeof setTimeout> | undefined;
  let glideTimer: ReturnType<typeof setInterval> | undefined; // the window coasting to a stop after a walk
  let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
  let menuTimer: ReturnType<typeof setTimeout> | undefined;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;
  let proactiveTimer: ReturnType<typeof setTimeout> | undefined;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  let slowTimer: ReturnType<typeof setTimeout> | undefined;

  const lang = $derived(resolveLang(data.settings.lang, navigator.language));
  const ui = $derived(UI[lang]);
  // the document language decides which font variants the web view picks for Japanese characters
  $effect(() => {
    document.documentElement.lang = lang;
  });
  const canChat = $derived(hasKey && !brainBad);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const clip = (s: string) => (s.length > MAX_REPLY_CHARS ? s.slice(0, MAX_REPLY_CHARS - 1).trimEnd() + "…" : s);

  // ------------------------------------------------------------ persistence
  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 500);
  }
  async function save() {
    try {
      await invoke("save_pet", { json: JSON.stringify(data) });
      await invoke("save_memory", { json: JSON.stringify(mem) });
    } catch {
      /* keep running; we will retry on the next change */
    }
  }

  // ------------------------------------------------------------- telemetry
  /** Records a funnel event if (and only if) the user opted in. */
  function track(event: FunnelEvent) {
    const next = recordEvent(data, event, Date.now());
    if (next !== data) {
      data = next;
      scheduleSave();
    }
  }

  // ---------------------------------------------------------------- speech
  function ctxNow(extra: { days?: number; stage?: number; pokes?: number } = {}) {
    const d = new Date();
    const hour = d.getHours();
    const locale = lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US";
    return {
      lang,
      tier: tierOf(data.closeness),
      band: bandOf(data, hour, lonely),
      hour,
      gentle: data.settings.gentle,
      days: extra.days,
      stage: extra.stage,
      // what a line may mention (LN-3): a value that is unknown is left out, and a line that needs it is not chosen
      vars: {
        name: mem.callMe || undefined,
        time: `${String(hour).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
        weekday: new Intl.DateTimeFormat(locale, { weekday: "long" }).format(d),
        pokes: extra.pokes ? String(extra.pokes) : undefined,
      },
    };
  }

  // Escalation (LN-2): a poke, a scratch or a belly rub repeated within a short time moves through stages (memory only).
  const repeats: Partial<Record<RepeatKind, Repeat>> = {};
  function repeatNow(kind: RepeatKind): { stage: number; pokes: number } {
    const r = bump(repeats[kind], Date.now(), REPEAT_WINDOW_MS[kind]);
    repeats[kind] = r;
    return { stage: stageFor(r.n), pokes: r.n };
  }

  /** Pick a scripted line (recording it so it is not repeated soon) without showing it. */
  function pickLine(trigger: Trigger, extra: { days?: number; stage?: number; pokes?: number } = {}): string | null {
    // a shuffle bag per trigger and stage (LN-1): every line is said once before any is said again
    const bagKey = (stage: number | undefined) => ((stage ?? 1) > 1 ? `${trigger}#${stage}` : trigger);
    let c = ctxNow(extra);
    let line = pick(trigger, c, data.bags[bagKey(c.stage)] ?? []);
    if (!line && (extra.stage ?? 1) > 1) {
      // no line at that stage (for example none that fits the tone): the ordinary pool
      c = ctxNow({ ...extra, stage: 1 });
      line = pick(trigger, c, data.bags[bagKey(1)] ?? []);
    }
    if (!line) return null;
    const key = bagKey(c.stage);
    data = {
      ...data,
      recent: remember(data.recent, line.id),
      bags: { ...data.bags, [key]: bagAfter(data.bags[key] ?? [], line, candidates(trigger, c)) },
      said: { ...data.said, [trigger]: Date.now() },
    };
    scheduleSave();
    return fill(line.text, c.vars);
  }

  function say(trigger: Trigger, extra: { days?: number; exclaim?: boolean; stage?: number; pokes?: number } = {}): boolean {
    const text = pickLine(trigger, { days: extra.days, stage: extra.stage, pokes: extra.pokes });
    if (!text) return false;
    showBubble(text, 0, extra.exclaim === true);
    return true;
  }

  /**
   * The words follow the body (spec/09 section 3, RX-3a): run `words` `delayMs` after the pose began, only if the cat is
   * still in that pose (picked up or told to do something else meanwhile: the words are dropped, not said late).
   */
  function wordsAfter(p: PetState, delayMs: number, words: () => void) {
    setTimeout(() => {
      if ((pose as PetState) === p) words();
    }, delayMs);
  }

  /**
   * An event happened (spec/09, RX-2, RX-3): its appraisal picks a beat; the beat's first pose is entered at once (with the
   * usual timer and wake-first rule) and `then` is called with the pose and the delay after which the words follow.
   */
  function startReflex(id: EventId): { pose: PetState; wordsAt: number } {
    const beat = chooseBeat(EVENTS[id].appraisal);
    const p = beat.steps[0].pose;
    enter(p);
    return { pose: p, wordsAt: wordsAtMs(beat) ?? 0 };
  }

  /** The words of an event, from the pool the event names, at the stage of the run when it repeats (LN-2). */
  function sayEvent(id: EventId): boolean {
    const ev = EVENTS[id];
    if (!ev.words) return false;
    return say(ev.words, ev.repeat ? repeatNow(ev.repeat) : {});
  }

  // ---------------------------------------------------------------- memory
  const DAY_MS = 24 * 60 * MIN;
  const touch = (kind: Touch) => {
    mem = recordTouch(mem, kind);
    scheduleSave();
  };

  // ---------------------------------------------------- per-day counts (Bond Days, spec/05)
  // Recorded only if the user agreed to them (bumpDay checks). Counts only, never content.
  function count(key: DayCounter, n = 1) {
    const next = bumpDay(data, key, Date.now(), n);
    if (next !== data) {
      data = next;
      scheduleSave();
    }
  }
  // An unprompted line counts as "engaged" if the user reacts within 30 s, once per line. A typed message never does.
  let shownState = noShown();
  function markShown() {
    count("shown");
    shownState = markShownPure(shownState, Date.now());
  }
  function engage() {
    const r = engagePure(shownState, Date.now());
    shownState = r.state;
    if (r.engaged) count("engaged");
  }

  /** A line that exists only because the pet remembers something. False if there is none to say. */
  function memSay(kind: MemKind, extra: { absentDays?: number; n?: number } = {}, cooldownMs = 0): boolean {
    const now = Date.now();
    if (cooldownMs && !cooled(mem, kind, now, cooldownMs)) return false;
    const text = memLine(kind, mem, { lang, gentle: data.settings.gentle, hour: new Date().getHours(), ...extra });
    if (!text) return false;
    mem = sayKind(mem, kind, now);
    showBubble(text);
    scheduleSave();
    return true;
  }

  /** Shares the next unshared milestone, if any (never over another bubble or panel). */
  function shareNextMark(): boolean {
    const id = nextMark(mem);
    if (!id || quiet || panel !== null || bubbleOn) return false;
    mem = shareMark(mem, id, Date.now());
    scheduleSave();
    const said = memSay(`mark.${id}`, { n: mem.days });
    if (said) markShown();
    return said;
  }

  /** Asks the user to name the pet, or to say what to call them (a typed answer, never guessed). */
  function askInput(field: MemField) {
    mem = recordAsked(mem, field === "petName" ? "name" : "callMe", Date.now());
    inputField = field;
    openPanel("input");
    scheduleSave();
  }

  // First-run tour: a few short cards from the pet, once on a fresh install (and on request).
  let tourStep = $state(0);
  function startTour() {
    if (quiet || panel) return;
    tourStep = 0;
    stopTimers();
    enter("happy");
    openPanel("tour");
  }
  function endTour() {
    closePanel();
    data = finishTour(data);
    scheduleSave();
    stopTimers();
    enter("happy");
  }

  async function answerStartup(yes: boolean) {
    closePanel();
    if (!yes) return;
    try {
      if (await invoke<boolean>("autostart_set", { on: true })) {
        data = markStartupDone(data);
        scheduleSave();
        showBubble(ui.startupOn, 6000);
      }
    } catch {
      /* the setting stays off; Settings shows the real state */
    }
  }

  function answerInput(field: MemField, value: string) {
    mem = setName(mem, field, value);
    closePanel();
    scheduleSave();
    pushSettings();
    stopTimers();
    const r = startReflex("named");
    wordsAfter(r.pose, r.wordsAt, () => memSay(field === "petName" ? "named" : "calledMe"));
  }

  function showBubble(text: string, minMs = 0, exclaim = false) {
    bubbleText = text;
    bubbleExclaim = exclaim;
    bubbleOn = true;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => (bubbleOn = false), Math.max(minMs, 4000 + text.length * 60));
  }

  // ------------------------------------------------------- focus-safety (spec/06 section 3, ADR-0029)
  // The cat does not walk and does not speak unprompted while the user is working. The only signals are how
  // long ago the user last did anything and where the pointer is (one number and one position from Rust);
  // `focus.ts` decides. The probe is read when a decision is needed (before a walk, twice a second during one,
  // before an unprompted line), not on a timer, so a standing cat costs nothing extra.
  const FOCUS_RETRY_MS = 45_000; // an unprompted line held back for the user's work is tried again after this long
  const FOCUS_ALLOW: FocusOut = { walkAllowed: true, keepWalking: true, speakAllowed: true, crowded: false, leaveDir: 1, dist: null, active: false };
  let focusState = initialFocus();
  let lastPointer: { dx: number; dy: number; t: number } | null = null;
  let focusOut: FocusOut = FOCUS_ALLOW;
  // The typing lane (spec/07 section 3.1, TE-14): where the text the user types is thought to run (`lane.ts`), found from
  // the last click and the time spent typing. Stepped on every probe; no keys are read, only the time of the last input.
  const NO_LANE: LaneOut = { lane: null, caretX: null, crowded: false };
  let laneState = initialLane();
  let laneOut: LaneOut = NO_LANE;
  let laneCat = { x: 0, y: 0 }; // the cat's centre at the last probe (logical px of the screen)
  async function probeFocus(): Promise<FocusOut> {
    try {
      const p = await invoke<{
        idleMs: number | null;
        dx: number | null;
        dy: number | null;
        over: boolean;
        catX: number | null;
        catY: number | null;
        click: { x: number; y: number; ageMs: number } | null;
      }>("focus_probe");
      const now = Date.now();
      // "moving" = the pointer travelled more than a few px since the last reading a moment ago
      const moving =
        p.dx !== null && p.dy !== null && lastPointer !== null && now - lastPointer.t < 1000 && Math.hypot(p.dx - lastPointer.dx, p.dy - lastPointer.dy) > 6;
      lastPointer = p.dx !== null && p.dy !== null ? { dx: p.dx, dy: p.dy, t: now } : null;
      if (p.catX !== null && p.catY !== null) {
        laneCat = { x: p.catX, y: p.catY };
        const lr = stepLane(
          laneState,
          { idleMs: p.idleMs, cat: laneCat, pointer: p.dx !== null && p.dy !== null ? { dx: p.dx, dy: p.dy } : null, click: p.click, pointerMoving: moving },
          now,
        );
        laneState = lr.state;
        laneOut = lr.out;
      } else {
        laneState = initialLane();
        laneOut = NO_LANE;
      }
      const pointer = p.dx !== null && p.dy !== null ? { dist: Math.hypot(p.dx, p.dy), over: p.over, moving, dx: p.dx } : null;
      const r = decideFocus(focusState, { idleMs: p.idleMs, pointer, busy: false, quiet }, now);
      focusState = r.state;
      focusOut = r.out;
    } catch {
      focusState = initialFocus();
      focusOut = FOCUS_ALLOW; // unknown: no restriction, as before
      laneState = initialLane();
      laneOut = NO_LANE;
    }
    refreshAttentionGaze();
    noteCrowded(focusOut);
    return focusOut;
  }

  // When the user works near the cat (FS-4, ADR-0030) it makes way: it gets up and walks away from the pointer, and
  // curls up where it is if it cannot. (A first version made the cat fade; a see-through cat looked wrong.)
  // The hit-test thread in Rust tells the page only when "the user may be working near the cat" starts or ends
  // (event "focus-hint"); until then nothing is polled. While it holds, the probe is read four times a second.
  const LEAVE_COOLDOWN_MS = 25_000; // never make way more than once in this time
  // The typing lane is urgent (the text is coming), so it has its own, shorter cool-down, and a sleeping cat that the
  // lane reaches wakes after a moment instead of after the 4 s of the pointer rule. The author found the first
  // version moved only after the text had reached the cat (2026-11-09).
  const NOTICE_MS = 400; // the beat before it makes way: it looks toward the user's work, ears up (PC-2, ADR-0031)
  const LANE_COOLDOWN_MS = 10_000; // 6 s gave 15 hops in two minutes in the author's test (TE-15); the author chose 10 s
  const SLEEP_LANE_MS = 600;
  let lastLaneHop = 0;
  let laneNoted = false; // one trail line per crowded episode (the debugger)
  // Where the user's work is, as a look (x and y in -1..1 from the cat): the pointer when it is near, else the predicted
  // caret of the typing lane. The cat looks that way while the user works near it and it stands calm (PC-2); null = nowhere.
  let attentionGaze = $state<{ x: number; y: number } | null>(null);
  const toGaze = (dx: number, dy: number) => ({ x: Math.max(-1, Math.min(1, dx / 150)), y: Math.max(-1, Math.min(1, dy / 150)) });

  function refreshAttentionGaze() {
    let want: { x: number; y: number } | null = null;
    if (focusOut.active && !panel && (pose === "idle" || pose === "look")) {
      const l = laneOut.lane;
      const cx = laneOut.caretX;
      if (l && cx !== null && Math.abs(cx - laneCat.x) < 500 && Math.abs((l.y0 + l.y1) / 2 - laneCat.y) < 250) want = toGaze(cx - laneCat.x, (l.y0 + l.y1) / 2 - laneCat.y);
      else if (lastPointer && Math.hypot(lastPointer.dx, lastPointer.dy) < 300) want = toGaze(lastPointer.dx, lastPointer.dy);
    }
    const a = attentionGaze;
    // only a real change is passed on: every change of the look is a few painted frames
    if (want === null ? a !== null : a === null || Math.abs(a.x - want.x) > 0.25 || Math.abs(a.y - want.y) > 0.25) attentionGaze = want;
  }

  /**
   * The beat before the cat makes way (PC-2): it stops, looks toward the work (`dx`, `dy` from the cat) with its ears up
   * for NOTICE_MS, and only then acts. Returns false when something else took over meanwhile. A cat that is not standing
   * calm (walking, held, busy) skips the beat.
   */
  async function noticeBeat(dx: number, dy: number): Promise<boolean> {
    if (pose !== "idle" && pose !== "look") return true;
    attentionGaze = toGaze(dx, dy);
    enter("notice");
    await new Promise((r) => setTimeout(r, NOTICE_MS));
    return (pose as PetState) === "notice"; // read again: it may have changed while waiting
  }
  let focusEngaged = false;
  let focusLoop: ReturnType<typeof setInterval> | undefined;
  let lastLeave = 0;
  let crowdedSince: number | null = null; // since when the cat has been crowded without a break
  let walkPlan: { dir: 1 | -1 } | null = null; // set just before `enter("walk")` to walk a given way (making way)

  // Asked on every probe while the cat feels crowded: `makeWay` acts only when the cat is standing, so if the crowding
  // began while it was busy (walking, being held) it makes way as soon as it stands, and the cool-down keeps it calm.
  function noteCrowded(fo: FocusOut) {
    if (fo.crowded || laneOut.crowded) {
      crowdedSince ??= Date.now();
      void makeWay(fo.leaveDir);
    } else {
      crowdedSince = null;
      laneNoted = false;
    }
  }

  const trail: string[] = []; // the last few decisions, for the debugger (window.__pet.trail)
  const note = (m: string) => {
    trail.push(`${new Date().toISOString().slice(11, 23)} ${m}`);
    if (trail.length > 40) trail.shift();
  };

  async function makeWay(away: 1 | -1) {
    const now = Date.now();
    if (laneOut.crowded && laneOut.lane && !flying) {
      const why = quiet ? "quiet" : panel !== null ? "a panel is open" : now - lastLaneHop < LANE_COOLDOWN_MS ? "cool-down" : pose === "held" ? "held" : null;
      if (!laneNoted) {
        laneNoted = true;
        note(`lane crowded: pose ${pose}, caret ${Math.round(laneOut.caretX ?? 0)}, cat ${Math.round(laneCat.x)},${Math.round(laneCat.y)}${why ? `, waiting: ${why}` : ""}`);
      }
      if (why) return;
      if (pose === "sleep" || pose === "drowsy") {
        // asleep it is woken by the lane after a moment (and only if it could then leave), then it hops
        if (crowdedSince === null || now - crowdedSince < SLEEP_LANE_MS) return;
        let v = { up: 0, down: 0 };
        try {
          v = await invoke<{ up: number; down: number }>("vertical_room");
        } catch {
          /* unknown: stay asleep */
        }
        if ((pose === "sleep" || pose === "drowsy") && Math.max(v.up, v.down) >= LEAVE_MIN_ROOM_PX) {
          note(`lane wakes the cat: room ${v.up}/${v.down}`);
          enter("idle");
        }
        return;
      }
      if (pose === "idle" || pose === "look") {
        lastLaneHop = now;
        lastLeave = now;
        const l = laneOut.lane;
        if (!l) return;
        // looks toward where the text is heading first, then hops
        if (!(await noticeBeat((laneOut.caretX ?? laneCat.x) - laneCat.x, (l.y0 + l.y1) / 2 - laneCat.y))) return;
        return void (await hopOutOfLane());
      }
      if (pose === "walk") {
        lastLaneHop = now;
        lastLeave = now;
        return void (await hopOutOfLane());
      }
      return;
    }
    if (quiet || panel !== null || now - lastLeave < LEAVE_COOLDOWN_MS) return;
    if (pose === "sleep" || pose === "drowsy") {
      // Asleep its senses are dull: it wakes only after several seconds of the user working right by it, and only
      // if it could then leave (otherwise waking would change nothing). It wakes with its usual stretch and the
      // next probe makes way as for an awake cat.
      if (crowdedSince === null || now - crowdedSince < SLEEP_CROWD_MS) return;
      let r = 0;
      try {
        r = await invoke<number>("edge_room", { dir: away });
      } catch {
        /* unknown: stay asleep */
      }
      if ((pose === "sleep" || pose === "drowsy") && wakesToMakeWay(true, crowdedSince === null ? null : Date.now() - crowdedSince, r)) {
        note(`wakes to make way ${away > 0 ? "right" : "left"}: room ${r}`);
        enter("idle");
      }
      return;
    }
    if (pose !== "idle" && pose !== "look") return;
    lastLeave = now;
    let room = 0;
    try {
      room = await invoke<number>("edge_room", { dir: away });
    } catch {
      /* unknown: curl up */
    }
    note(`make way ${away > 0 ? "right" : "left"}: room ${room}, pose ${pose}`);
    if (pose !== "idle" && pose !== "look") return; // something else happened while asking
    if (lastPointer && !(await noticeBeat(lastPointer.dx, lastPointer.dy))) return; // it notices first, then acts
    if (room >= LEAVE_MIN_ROOM_PX) {
      walkPlan = { dir: away };
      enter("walk");
    } else enter("drowsy"); // nowhere to go: it yawns and curls up where it is
  }

  /**
   * The text the user types is about to run through the cat's row (TE-14): walking sideways cannot escape it (the caret
   * outpaces the walk), so the cat hops to a row at least 160 px above or below the typing row, on the side with more
   * room, and curls up where it is if neither side has room. It lands outside the band, so the next probe is calm.
   */
  async function hopOutOfLane() {
    const lane = laneOut.lane;
    if (!lane) return;
    let room = { up: 0, down: 0 };
    try {
      room = await invoke<{ up: number; down: number }>("vertical_room");
    } catch {
      /* unknown: no room */
    }
    const esc = escapeRow(lane, laneCat.y, room.up, room.down);
    note(`lane hop: ${esc ? `${esc.dir < 0 ? "up" : "down"} ${Math.round(esc.dist)}` : "no room"}, room ${room.up}/${room.down}, caret ${Math.round(laneOut.caretX ?? 0)}`);
    if (pose !== "idle" && pose !== "look" && pose !== "walk" && pose !== "notice") return; // something else happened while asking
    if (esc) await fly(splitHop(0, esc.dir * esc.dist), "walk");
    else enter("drowsy"); // nowhere to go: it yawns and curls up where it is
  }

  /** After a walk that was making way: if the user is still working right by the cat, it curls up where it stopped. */
  function settleAfterLeaving() {
    setTimeout(async () => {
      const fo = await probeFocus();
      note(`after leaving: crowded ${fo.crowded}, pose ${pose}`);
      if (fo.crowded && pose === "idle") enter("drowsy");
    }, 1000);
  }

  async function focusTick() {
    await probeFocus();
    if (!focusEngaged && !focusOut.crowded && !laneOut.crowded) {
      clearInterval(focusLoop);
      focusLoop = undefined;
    }
  }
  function onFocusHint(engaged: boolean) {
    focusEngaged = engaged;
    if ((engaged || focusOut.crowded || laneOut.crowded) && !focusLoop) {
      void focusTick();
      focusLoop = setInterval(focusTick, 250);
    }
  }

  /** Show something unprompted, but wait for a pause in the user's work (about 4 minutes at most, then give up). */
  function sayWhenCalm(show: () => void, firstDelayMs = 0, tries = 12) {
    void (async () => {
      await new Promise((r) => setTimeout(r, firstDelayMs));
      for (let i = 0; i < tries; i++) {
        const fo = await probeFocus();
        if (fo.speakAllowed && !panel && !bubbleOn && !isDozing(pose) && !quiet) {
          show();
          return;
        }
        await new Promise((r) => setTimeout(r, 20_000));
      }
    })();
  }

  // ------------------------------------------------------------- behaviour
  function stopTimers() {
    clearTimeout(nextTimer);
    clearTimeout(sleepTimer);
    clearInterval(walkTimer);
    clearTimeout(walkEndTimer);
    clearInterval(glideTimer);
  }

  let wakeThen: PetState | null = null; // what to do once the pet has finished waking up

  function enter(requested: PetState) {
    if (flying) void invoke("fly_cancel"); // picked up or told to do something else in mid-air: the flight ends
    let next = requested;
    // A sleeping pet wakes up first (stretch, eyes open), then carries on.
    if (needsWakeFirst(pose, next)) {
      wakeThen = next;
      next = "wake";
    } else if (next !== "wake") {
      wakeThen = null;
    }
    clearInterval(walkTimer);
    clearTimeout(walkEndTimer);
    clearInterval(glideTimer); // any other change of state ends the coasting at once
    clearTimeout(nextTimer); // a pending "what next" from an earlier standing must not wake a cat that has curled up
    clearTimeout(sleepTimer);
    clearTimeout(oneShotTimer);
    pose = next;
    poseTick++;
    const timed = TIMED[next];
    if (timed) {
      oneShotTimer = setTimeout(() => {
        if (next === "wake" && wakeThen) {
          const after = wakeThen;
          wakeThen = null;
          enter(after);
        } else {
          enter(timed.next ?? (quiet ? "sleep" : "idle"));
        }
      }, timed.ms);
    }
    if (next === "idle") scheduleNext();
    if (next === "walk") startWalk();
    if (next === "sleep" && !quiet) {
      sleepTimer = setTimeout(() => enter("idle"), rand(20_000, 60_000));
    }
  }

  function scheduleNext() {
    clearTimeout(nextTimer);
    nextTimer = setTimeout(pickNext, rand(4_000, 11_000));
  }

  function pickNext() {
    if (flying) return scheduleNext();
    if (quiet) return pose === "sleep" || pose === "drowsy" ? undefined : enter("drowsy");
    if (panel) return scheduleNext();
    const r = Math.random();
    if (r < 0.5) enter("look");
    else if (r < 0.85) void tryWalk();
    else enter(bubbleOn ? "look" : "drowsy"); // yawns first, then falls asleep (never while it is speaking)
  }

  /** A walk starts only if the user has paused; otherwise the cat stays where it is and tries again later. */
  async function tryWalk() {
    if (flying) return;
    const fo = await probeFocus();
    if (pose !== "idle") return; // something else took over while the probe was read
    if (fo.walkAllowed) enter("walk");
    else scheduleNext();
  }

  function startWalk() {
    const plan = walkPlan;
    walkPlan = null;
    const leaving = plan !== null; // walking away from the user's work
    dir = plan ? plan.dir : Math.random() < 0.5 ? -1 : 1;
    const scale = window.devicePixelRatio || 1;
    // pixels per tick at full speed; fractional, the remainder is carried (see gait.ts)
    const fullStep = (WALK_SPEED * scale * WALK_TICK_MS) / 1000;
    let ticks = 0;
    let carry = 0;
    walkTimer = setInterval(async () => {
      try {
        ticks++;
        if (leaving) {
          // going on until the pointer is far enough (checked four times a second); then it eases to a stop
          if (ticks % 4 === 0) {
            const fo = await probeFocus();
            if (pose !== "walk") return;
            if (fo.dist === null || fo.dist >= LEAVE_PX) {
              settleAfterLeaving();
              return stopWalking();
            }
          }
        } else if (ticks % 8 === 0 && ticks * WALK_TICK_MS >= 1500) {
          // about twice a second, and only after the first second and a half: has the user started working near
          // the cat? Then the walk eases to a stop. (Stopping a step at once looked like a jolt.)
          const fo = await probeFocus();
          if (pose !== "walk") return;
          if (!fo.keepWalking) return stopWalking();
        }
        // the window speeds up as the legs start (the legs follow a spring, see Rig)
        const want = fullStep * rampIn(ticks * WALK_TICK_MS);
        const s = takeSteps(carry, want);
        carry = s.carry;
        if (s.move === 0) return;
        const hitEdge = await invoke<boolean>("move_by", { dx: dir * s.move });
        if (hitEdge) {
          if (leaving) {
            settleAfterLeaving(); // no more room: it stops here, and curls up if the user is still right there
            return stopWalking();
          }
          dir = dir === 1 ? -1 : 1;
        }
      } catch {
        enter("idle");
      }
    }, WALK_TICK_MS);
    walkEndTimer = setTimeout(() => stopWalking(), leaving ? 10_000 : rand(3_000, 8_000));
  }

  /**
   * End a walk gently: the legs begin to settle at once (the pose becomes idle) and the window keeps moving for a
   * moment at a speed that falls to zero, so the cat coasts to a stop instead of halting mid-step.
   */
  function stopWalking() {
    if (pose !== "walk") return;
    const scale = window.devicePixelRatio || 1;
    const fullStep = (WALK_SPEED * scale * WALK_TICK_MS) / 1000;
    const d = dir;
    enter("idle"); // clears the walk timers and any earlier glide
    const t0 = Date.now();
    let carry = 0;
    glideTimer = setInterval(async () => {
      const ms = Date.now() - t0;
      const f = glideOut(ms);
      if (f <= 0 || pose !== "idle") return clearInterval(glideTimer);
      const s = takeSteps(carry, fullStep * f);
      carry = s.carry;
      if (s.move === 0) return;
      try {
        await invoke<boolean>("move_by", { dx: d * s.move });
      } catch {
        clearInterval(glideTimer);
      }
    }, WALK_TICK_MS);
  }

  // ------------------------------------------------- hops and falls (spec/07 2.3, ADR-0032)
  let flying = false;
  let airborne = $state(false); // the cat is in a hop or a fall: it is painted at the walking rate
  const CROUCH_MS = 140; // the squat before a hop takes off
  const FLIGHT_TICK_MS = 16; // about 60 moves a second while it lasts: a hop is full-speed motion

  /**
   * Move the window along a chain of hops or a fall (positions come from `hop.ts`, each one is a `move_to`), with the
   * cat in the pose `air` meanwhile, then land. Anything that takes the pose away (being picked up) ends it.
   */
  async function fly(flights: Flight[], air: PetState) {
    if (flying || flights.length === 0) return;
    flying = true;
    stopTimers();
    clearTimeout(oneShotTimer);
    try {
      const start = await invoke<{ x: number; y: number; scale: number }>("pet_place");
      if (flights[0].dx !== 0) dir = flights[0].dx > 0 ? 1 : -1;
      if (flights[0].kind === "hop") {
        // a short crouch before the takeoff (the `land` squash) so a hop, down as well as up, reads as a decision and not as a fall
        pose = "land";
        poseTick++;
        await new Promise((r) => setTimeout(r, CROUCH_MS));
        if ((pose as PetState) !== "land") return; // picked up or told to do something else meanwhile
      }
      pose = air;
      poseTick++;
      airborne = true;
      // the whole path, one position per frame, as offsets from here; Rust plays it (no round trip per frame)
      const points: [number, number][] = [];
      const total = totalMs(flights);
      for (let ms = 0; ms < total; ms += FLIGHT_TICK_MS) {
        const p = chainAt(flights, ms);
        points.push([Math.round(p.x * start.scale), Math.round(p.y * start.scale)]);
      }
      const end = chainAt(flights, total);
      points.push([Math.round(end.x * start.scale), Math.round(end.y * start.scale)]);
      await invoke<boolean>("fly_path", { points, frameMs: FLIGHT_TICK_MS });
    } catch {
      /* the window could not be moved: stop where it is */
    } finally {
      flying = false;
      airborne = false;
    }
    if (pose === air) enter("land");
  }

  // ------------------------------------------------- the ground goes (PC-7, ADR-0041)
  const GROUND_POLL_MS = 1000; // while the cat stands: what is under its feet, asked once a second (3 points, a few ms)
  const GROUND_COOLDOWN_MS = 20_000;
  const FALL_MIN_PX = 60; // less room than this below: it only gasps
  let groundW = startGroundWatch();
  let lastGroundFall = 0;
  let groundBusy = false;

  let beatToken = 0;
  const sleepMs = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  /**
   * Play a beat (`beats.ts`): hold each step's pose for its time, call `words` at the moment the beat says. Returns false
   * if anything else took over the pose meanwhile (picked up, told to do something else): the rest is dropped.
   */
  async function runBeat(beat: Beat, words?: () => void): Promise<boolean> {
    const tok = ++beatToken;
    stopTimers();
    clearTimeout(oneShotTimer);
    for (const step of beat.steps) {
      pose = step.pose;
      poseTick++;
      if (step.sayAt !== undefined) {
        await sleepMs(step.sayAt);
        if (tok !== beatToken || (pose as PetState) !== step.pose) return false;
        words?.();
        await sleepMs(Math.max(0, step.ms - step.sayAt));
      } else {
        await sleepMs(step.ms);
      }
      if (tok !== beatToken || (pose as PetState) !== step.pose) return false;
    }
    return true;
  }

  /** The window under the cat is gone: it startles (freeze, jolt, a cry), then falls to the ground below (or only startles when there is no room). */
  async function groundLost() {
    const now = Date.now();
    if (quiet || panel !== null || flying || now - lastGroundFall < GROUND_COOLDOWN_MS) return;
    if (pose !== "idle" && pose !== "look") return;
    lastGroundFall = now;
    note("ground lost: startle");
    if (!(await runBeat(chooseBeat(EVENTS.ground_lost.appraisal), () => say("fall", { exclaim: true })))) return; // picked up or told to do something else meanwhile
    let down = 0;
    try {
      down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
    } catch {
      /* unknown: it only gasps */
    }
    note(`ground lost: room below ${down}`);
    if (down >= FALL_MIN_PX) await fly([planFall(down)], "gasp");
    else enter("idle"); // no room to fall: it has only startled
  }

  async function groundTick() {
    if (groundBusy) return;
    const standing = !flying && !quiet && panel === null && (pose === "idle" || pose === "look");
    if (!standing) {
      groundW = startGroundWatch(); // walking, held, asleep, speaking: it will find its footing again when it stands
      return;
    }
    groundBusy = true;
    try {
      const g = await invoke<{ id: number; foot: [number, number] }>("ground_under_cat");
      // asked about the window it stands on (not about the current one under the feet: a window raised over it changes nothing)
      const holds = groundW.id !== 0 ? await invoke<boolean>("window_holds", { id: groundW.id, x: groundW.x, y: groundW.y }) : null;
      const r = stepGround(groundW, { id: g.id, x: g.foot[0], y: g.foot[1] }, holds);
      groundW = r.w;
      if (r.lost) await groundLost();
    } catch {
      /* the sense is not available: nothing happens */
    } finally {
      groundBusy = false;
    }
  }

  // ---------------------------------------------------------------- panels
  function openPanel(p: Exclude<Panel, null>) {
    if (pose === "walk") stopWalking();
    panel = p;
    resetMenuTimer();
  }
  function closePanel() {
    panel = null;
    clearTimeout(menuTimer);
    clearTimeout(slowTimer);
    chatPhase = "compose";
    chatUser = "";
    chatReply = "";
    chatSlow = false;
    chatDraft = false;
  }
  /** The chat and the ask card close themselves when left alone (never while typing or waiting). */
  function resetMenuTimer() {
    clearTimeout(menuTimer);
    if (panel !== "chat" && panel !== "ask" && panel !== "update" && panel !== "input" && panel !== "choice" && panel !== "tour") return;
    // An idle chat closes by itself, as before (any click or key in the bubble starts the wait
    // again), but never while there is text in the box (see the check below).
    const ms = panel === "tour" ? 90_000 : panel === "input" ? 60_000 : panel === "update" || panel === "choice" ? 30_000 : panel === "chat" && chatPhase === "reply" ? 20_000 : 12_000;
    menuTimer = setTimeout(() => {
      if ((panel === "chat" || panel === "input") && (chatDraft || busy)) resetMenuTimer();
      else {
        if (panel === "update") updateLater(); // ignoring the offer counts as "later"
        if (panel === "tour") endTour(); // walking away from the tour ends it
        closePanel();
      }
    }, ms);
  }

  // ----------------------------------------------------------- interaction
  let suppressClick = false; // the click that ends a drag must not count as a poke

  function onClick() {
    if (suppressClick || pose === "held" || quiet) return;
    // Wait briefly so a double-click (chat) does not also trigger the single-click reaction.
    clearTimeout(clickTimer);
    clickTimer = setTimeout(singleClick, 230);
  }

  function singleClick() {
    stopTimers();
    const r = startReflex("poked");
    engage();
    const now = Date.now();
    if (now - lastClickSay > 3000) {
      lastClickSay = now;
      data = interact(data, "click", now);
      touch("poke");
      count("poke");
      wordsAfter(r.pose, r.wordsAt, () => sayEvent("poked"));
    }
  }

  function onDblClick() {
    clearTimeout(clickTimer);
    if (quiet || suppressClick) return;
    if (panel) return closePanel();
    engage(); // answering the pet's line by opening the chat (a typed message never counts)
    data = { ...data, brain: { ...data.brain, menuOpens: data.brain.menuOpens + 1 } };
    track("first_interaction");
    if (shouldAskBrain(data, Date.now(), hasKey)) showAsk();
    else openChat();
    scheduleSave();
  }

  function openChat() {
    chatUser = "";
    chatSlow = false;
    chatDraft = false;
    if (canChat) {
      chatReply = "";
      chatPhase = "compose";
    } else {
      // Without a brain the pet answers with a scripted "how are you" instead of a real chat.
      chatReply = pickLine("how") ?? "";
      chatPhase = "reply";
    }
    openPanel("chat");
  }

  // Dragging: done here, not by the OS, so Rust can keep the pet on screen (see drag_move).
  let press: { x: number; y: number } | null = null;
  let dragging = false;
  let dragReady = false;
  let movePending = false;

  function onPetDown(e: PointerEvent) {
    if (e.button !== 0) return;
    press = { x: e.screenX, y: e.screenY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  async function beginDrag() {
    dragging = true;
    clearTimeout(clickTimer);
    clearTimeout(oneShotTimer);
    stopTimers();
    pose = "held";
    poseTick++;
    try {
      await invoke("drag_start");
      dragReady = true;
    } catch {
      dragging = false;
    }
  }

  // At most one drag_move in flight; moves that arrive meanwhile collapse into one more call
  // (Rust reads the cursor itself, so nothing is lost). No requestAnimationFrame: it is paused
  // whenever the webview is not considered visible.
  let moveAgain = false;
  async function requestMove() {
    if (!dragReady) return;
    if (movePending) {
      moveAgain = true;
      return;
    }
    movePending = true;
    do {
      moveAgain = false;
      try {
        await invoke("drag_move");
      } catch {
        /* ignore a missed frame */
      }
    } while (moveAgain && dragging);
    movePending = false;
  }

  function onPetUp(e: PointerEvent) {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* not captured */
    }
    if (dragging) {
      dragging = false;
      dragReady = false;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 80);
      invoke("drag_end").catch(() => {});
      clearTimeout(tiltTimer);
      tilt = 0;
      enter(quiet ? "sleep" : "land"); // lands with a little squash, then idles
    }
    press = null;
  }

  // While carried, the pet leans the way the cursor is moving and swings back when it stops.
  let lastDragX = 0;
  function leanWith(screenX: number) {
    const dx = screenX - lastDragX;
    lastDragX = screenX;
    tilt = Math.max(-22, Math.min(22, tilt * 0.5 + dx * 1.6));
    clearTimeout(tiltTimer);
    tiltTimer = setTimeout(() => (tilt = 0), 110);
  }

  // Stroking: sweep the cursor back and forth over the pet's head, no button needed.
  let scratch = newScratch();
  function onPetMove(e: PointerEvent) {
    if (e.buttons & 1) {
      if (!press || quiet) return;
      if (!dragging && Math.hypot(e.screenX - press.x, e.screenY - press.y) > DRAG_START_PX) {
        lastDragX = e.screenX;
        void beginDrag();
      }
      if (dragging) {
        leanWith(e.screenX);
        requestMove();
      }
      return;
    }
    if (quiet || pose === "held") return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const res = scratchStep(scratch, { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }, r.height, r.width);
    scratch = res.state;
    if (res.zone === "head") onHeadScratch();
    else if (res.zone === "belly") onBellyRub();
    // the eyes follow the cursor (in quarter steps, so a tiny move does not redraw anything)
    const q = (v: number) => Math.round(Math.max(-1, Math.min(1, v)) * 4) / 4;
    const gx = q(((e.clientX - r.left) / r.width - 0.5) * 2);
    const gy = q(((e.clientY - r.top) / r.height - 0.45) * 2);
    if (gaze?.x !== gx || gaze?.y !== gy) gaze = { x: gx, y: gy };
  }

  // Belly rub: usually bliss, now and then a trap (never on the first rubs, never twice in a row).
  let rubsSinceHuff = 0;
  let lastHuff = 0;
  function onBellyRub() {
    lonely = false;
    const now = Date.now();
    stopTimers();
    data = recordRub(data);
    touch("scratch");
    count("rub");
    engage();
    rubsSinceHuff++;
    const trap = tierOf(data.closeness) >= 2 && rubsSinceHuff >= 2 && now - lastHuff > 3 * MIN && Math.random() < 0.35;
    if (trap) {
      rubsSinceHuff = 0;
      lastHuff = now;
      const r = startReflex("belly_trap");
      wordsAfter(r.pose, r.wordsAt, () => sayEvent("belly_trap"));
    } else {
      data = interact(data, "pet", now);
      const r = startReflex("belly_enjoyed");
      wordsAfter(r.pose, r.wordsAt, () => sayEvent("belly_enjoyed"));
    }
    track("first_interaction");
    scheduleSave();
  }
  function onPetLeave() {
    gaze = null;
    scratch = { ...scratch, pts: [] };
  }
  function onHeadScratch() {
    lonely = false;
    stopTimers();
    const r = startReflex("scratched");
    data = recordScratch(interact(data, "pet", Date.now()));
    touch("scratch");
    count("scratch");
    engage();
    track("first_interaction");
    wordsAfter(r.pose, r.wordsAt, () => {
      if (!(Math.random() < 0.25 && memSay("pet", {}, 60 * MIN))) sayEvent("scratched");
    });
    scheduleSave();
  }

  // Right-click: a small native menu (the only menu the pet has besides the tray).
  function onPetMenu(e: MouseEvent) {
    e.preventDefault();
    invoke("show_pet_menu", { labels: [ui.menuSettings, ui.menuQuiet, ui.menuQuit] }).catch(() => {});
  }

  // ----------------------------------------------------------------- brain
  function errKind(e: unknown): ErrKind {
    const k = (e as { kind?: string } | null)?.kind;
    return k && k in ui.err ? (k as ErrKind) : "unknown";
  }

  function showAsk() {
    data = recordAsk(data);
    track("brain_request_shown");
    openPanel("ask");
    scheduleSave();
  }
  function askLater() {
    data = snoozeAsk(data, Date.now());
    closePanel();
    scheduleSave();
  }
  function acceptAsk() {
    closePanel();
    invoke("open_settings", { section: "brain" }).catch(() => {});
  }

  /** The disabled text box was clicked. Without a brain that is the "I tried to chat" signal. */
  function onChatBlocked() {
    if (canChat) return;
    if (brainBad) {
      closePanel();
      invoke("open_settings", { section: "brain" }).catch(() => {});
      return;
    }
    data = { ...data, brain: { ...data.brain, chatTries: data.brain.chatTries + 1 } };
    if (shouldAskBrain(data, Date.now(), hasKey)) showAsk();
    scheduleSave();
  }

  function answerConsent(yes: boolean) {
    if (panel === "dailyconsent") {
      // someone who agreed to the first wording: only the per-day numbers are at stake
      data = setDailyCounts(data, yes);
      closePanel();
      scheduleSave();
      pushSettings();
      return;
    }
    data = setConsent(data, yes ? "on" : "off", crypto.randomUUID());
    closePanel();
    scheduleSave();
  }

  // ---------------------------------------------------------------- updates
  // Checks quietly in the background; if a newer signed version exists the pet offers it. It
  // never updates or restarts on its own while you may be busy (fullscreen, a panel, quiet hours).
  let updateRetry: ReturnType<typeof setTimeout> | undefined;
  async function autoCheckUpdate() {
    clearTimeout(updateRetry);
    if (data.settings.updates === "off") return;
    try {
      const info = await invoke<{ version: string } | null>("update_check");
      if (!info || !shouldOfferUpdate(data, info.version, Date.now())) return;
      const busyNow = await invoke<boolean>("is_busy").catch(() => false);
      if (quiet || busyNow || panel !== null || inQuietHours(data.settings, new Date().getHours())) {
        updateRetry = setTimeout(autoCheckUpdate, 10 * MIN); // not now; try again shortly
        return;
      }
      updateVersion = info.version;
      if (data.settings.updates === "auto") {
        // Installing restarts the app: say so, then go (only when nothing else is going on).
        closePanel();
        showBubble(ui.updatingNow.replace("{v}", info.version), 600_000);
        setTimeout(() => void startUpdate(), 2500);
        return;
      }
      openPanel("update");
    } catch {
      /* offline, or no manifest yet: stay quiet */
    }
  }
  function updateLater() {
    if (updateVersion) {
      data = snoozeUpdate(data, updateVersion, Date.now());
      scheduleSave();
    }
  }
  async function startUpdate() {
    closePanel();
    showBubble(ui.updating, 600_000);
    try {
      await invoke("update_install"); // installs and restarts; normally never returns
    } catch {
      showBubble(ui.updateFailed, 6000);
    }
  }

  async function sendChat(raw: string) {
    const text = raw.trim();
    if (!text || busy || !canChat) return;
    const gate = aiGate(data, "chat", Date.now());
    if (gate !== "ok") {
      chatUser = text;
      chatReply = gate === "cap" ? ui.capHit[Math.floor(Math.random() * ui.capHit.length)] : ui.err.rate_limit;
      chatPhase = "reply";
      resetMenuTimer();
      return;
    }
    data = recordAi(data, "chat", Date.now());
    count("chat"); // a message that passed the usage gate and goes to the model
    busy = true;
    lonely = false;
    data = interact(data, "how", Date.now());
    touch("chat");
    history = [...history, { role: "user" as const, text }].slice(-8);
    chatUser = text;
    chatReply = "";
    chatPhase = "thinking";
    chatSlow = false;
    clearTimeout(slowTimer);
    slowTimer = setTimeout(() => (chatSlow = true), 8_000);
    stopTimers();
    replyMood = "neutral";
    enter("think"); // the pet tilts its head and looks up while it waits
    resetMenuTimer();
    try {
      const out = await invoke<{ text: string; mood: string }>("brain_chat", {
        lang,
        tier: tierOf(data.closeness),
        gentle: data.settings.gentle,
        history,
        known: knownFor(mem, lang),
        followUser: true, // answer in the language the user writes in
      });
      const reply = clip(out.text);
      replyMood = out.mood;
      history = [...history, { role: "model" as const, text: reply }].slice(-8);
      chatReply = reply;
      void maybeRemember();
    } catch (e) {
      const k = errKind(e);
      history = history.slice(0, -1); // drop the unanswered user turn
      if (k === "invalid_key") brainBad = true;
      if (k === "rate_limit") data = coolDown(data, Date.now());
      chatReply = ui.err[k];
      replyMood = "none";
    } finally {
      clearTimeout(slowTimer);
      chatSlow = false;
      busy = false;
      chatPhase = "reply";
      // If the chat was closed while waiting, still deliver the answer as a plain bubble.
      if (panel !== "chat") showBubble(chatReply, 5000);
      // act out the answer's feeling (a plain nod when there is none; nothing special after an error)
      enter(replyMood === "none" ? "idle" : moodPose(replyMood, data.settings.gentle));
      resetMenuTimer();
      scheduleSave();
    }
  }

  // Every few chat messages, a small background call picks lasting facts out of the chat. Silent on
  // any problem. The first time, a short note says what is stored and where it goes.
  let remembering = false;
  async function maybeRemember() {
    const c = countChat(mem);
    mem = c.memory;
    if (!c.due || remembering || !canChat || aiGate(data, "note", Date.now()) !== "ok") return scheduleSave();
    remembering = true;
    const transcript = history.map((t) => (t.role === "user" ? "User: " : "Pet: ") + t.text).join("\n");
    try {
      const facts = await invoke<string[]>("brain_remember", { lang, transcript, known: mem.facts.map((f) => f.text) });
      data = recordAi(data, "note", Date.now());
      const before = mem.facts.length;
      mem = resetExtract(addFacts(mem, facts, Date.now(), () => crypto.randomUUID()));
      if (mem.facts.length > before && !mem.aiNotice) {
        mem = { ...mem, aiNotice: true };
        sayWhenCalm(() => showBubble(ui.memNotice.replace("{company}", ui.providers[providerInfo.active].company), 9000), 2500);
      }
      pushSettings();
    } catch (e) {
      if (errKind(e) === "rate_limit") data = coolDown(data, Date.now());
    } finally {
      remembering = false;
      scheduleSave();
    }
  }

  function onBubbleAction(a: BubbleAction) {
    switch (a.type) {
      case "chat-send":
        void sendChat(a.text);
        break;
      case "chat-blocked":
        onChatBlocked();
        break;
      case "tour":
        if (panel !== "tour") break;
        if (a.action === "skip" || tourStep + 1 >= ui.tourSteps.length) endTour();
        else {
          tourStep++;
          resetMenuTimer();
          if (tourStep === 2) {
            stopTimers();
            enter("curious"); // "try stroking my head": it tilts its head, inviting
          }
        }
        break;
      case "choice":
        if (panel === "choice") void answerStartup(a.yes);
        break;
      case "alive":
        resetMenuTimer();
        break;
      case "typing":
        chatDraft = a.nonEmpty;
        resetMenuTimer();
        break;
      case "close":
        closePanel();
        break;
      case "ask-yes":
        acceptAsk();
        break;
      case "ask-later":
        askLater();
        break;
      case "consent":
        answerConsent(a.yes);
        break;
      case "input":
        if (panel === "input") answerInput(a.field, a.value);
        break;
      case "input-skip":
        closePanel(); // asked once already; the next ask comes days later, twice at most
        break;
      case "update-yes":
        void startUpdate();
        break;
      case "update-later":
        updateLater();
        closePanel();
        break;
    }
  }

  // -------------------------------------------------------------- settings
  function setSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    data = { ...data, settings: { ...data.settings, [key]: value } };
    if (key === "freq") scheduleProactive();
    scheduleSave();
  }

  function memoryView(): MemoryView {
    return {
      learn: mem.learn,
      petName: mem.petName,
      callMe: mem.callMe,
      days: mem.days,
      sessions: mem.sessions,
      bestStreak: mem.bestStreak,
      usualPart: usualPart(mem),
      touches: { ...mem.touches },
      marks: mem.marks.map((m) => m.id),
      aiLearn: mem.aiLearn,
      facts: mem.facts.map((f) => ({ id: f.id, text: f.text })),
    };
  }

  function onMemPatch(p: Extract<SettingsPatch, { type: "mem" }>) {
    if (p.action === "set") mem = setName(mem, p.field, p.value);
    else if (p.action === "learn") mem = { ...mem, learn: p.value };
    else if (p.action === "ai") mem = { ...mem, aiLearn: p.value, sinceExtract: 0 };
    else if (p.action === "fact-set") mem = setFact(mem, p.id, p.value);
    else if (p.action === "fact-del") mem = removeFact(mem, p.id);
    else if (p.action === "forget-facts") mem = forgetFacts(mem);
    else if (p.action === "forget-habits") mem = forgetHabits(mem);
    else mem = forgetAll(mem);
    scheduleSave();
  }

  function snapshot(): SettingsSnapshot {
    return {
      lang,
      settings: $state.snapshot(data.settings) as Settings,
      consent: data.telemetry.consent,
      queued: data.telemetry.queue.length,
      hasKey,
      brainBad,
      tier: tierOf(data.closeness),
      provider: providerInfo.active,
      keys: { gemini: providerInfo.gemini, groq: providerInfo.groq, claude: providerInfo.claude, openai: providerInfo.openai },
      usage: {
        chat: data.ai.day === dayKey(Date.now()) ? data.ai.chat : 0,
        chatCap: AI_CHAT_DAILY_CAP,
        proactive: data.ai.day === dayKey(Date.now()) ? data.ai.proactive : 0,
        proactiveCap: AI_PROACTIVE_DAILY_CAP,
      },
      memory: memoryView(),
      daily: countsDaily(data),
      stats:
        data.telemetry.consent === "on"
          ? {
              installId: data.telemetry.installId,
              events: $state.snapshot(data.telemetry.queue) as { e: string; t: number }[],
              days: $state.snapshot(data.telemetry.days) as DayStat[],
              config: { gentle: data.settings.gentle, freq: data.settings.freq },
            }
          : { installId: "", events: [], days: [], config: { gentle: false, freq: "" } },
    };
  }
  const pushSettings = () => void toSettings(snapshot());

  function onSettingsPatch(p: SettingsPatch) {
    if (p.type === "setting") {
      setSetting(p.key, p.value as never);
    } else if (p.type === "tour") {
      startTour();
    } else if (p.type === "startup") {
      if (p.on) data = markStartupDone(data);
      scheduleSave();
    } else if (p.type === "mem") {
      onMemPatch(p);
    } else if (p.type === "daily") {
      data = setDailyCounts(data, p.yes);
      scheduleSave();
    } else if (p.type === "consent") {
      if ((data.telemetry.consent === "on") !== p.yes) {
        data = setConsent(data, p.yes ? "on" : "off", crypto.randomUUID());
        scheduleSave();
      }
    } else {
      track(p.event);
    }
    pushSettings();
  }

  function onBrainChanged(c: BrainChange) {
    history = [];
    brainBad = false;
    if (c.type === "connected") {
      hasKey = true;
      void refreshBrain().then(pushSettings);
      data = { ...data, brain: { ...data.brain, connectedAt: Date.now() } };
      if (panel === "ask") closePanel();
      stopTimers();
      enter("happy");
      showBubble(`${clip(c.reply)}\n· ${c.model}`, 6000);
      track("key_valid");
      track("first_ai_message");
    } else if (c.type === "switched") {
      void refreshBrain().then(pushSettings);
      return;
    } else {
      hasKey = false;
      void refreshBrain().then(pushSettings);
      data = { ...data, brain: { ...data.brain, connectedAt: 0 } };
      showBubble(ui.removed);
    }
    scheduleSave();
    pushSettings();
  }

  // ------------------------------------------------------------- proactive
  function scheduleProactive() {
    clearTimeout(proactiveTimer);
    const f = data.settings.freq;
    if (f === "quiet") return;
    const [a, b] = f === "chatty" ? [4, 7] : [10, 15];
    proactiveTimer = setTimeout(() => fireProactive(), rand(a, b) * MIN);
  }

  async function fireProactive() {
    const hour = new Date().getHours();
    let busyNow = false;
    try {
      busyNow = await invoke<boolean>("is_busy");
    } catch {
      /* assume not busy */
    }
    const fo = await probeFocus();
    const blocked =
      quiet ||
      busyNow ||
      inQuietHours(data.settings, hour) ||
      pose === "held" ||
      isDozing(pose) ||
      panel !== null ||
      bubbleOn;
    if (blocked || !fo.speakAllowed) {
      proactiveTimer = setTimeout(() => fireProactive(), blocked ? 2 * MIN : FOCUS_RETRY_MS);
      return;
    }
    const t = Date.now();
    // Questions first (a typed answer, never a guess), then a shared milestone.
    const ageDays = Math.floor((t - data.firstSeen) / DAY_MS);
    for (const [f, field] of [["name", "petName"], ["callMe", "callMe"]] as const) {
      if (shouldAsk(mem, f, t, ageDays, tierOf(data.closeness))) {
        askInput(field);
        return scheduleProactive();
      }
    }
    if (shareNextMark()) return scheduleProactive();
    if (shouldAskStartup(data, t, mem.days)) {
      const already = await invoke<boolean>("autostart_get").catch(() => false);
      if (already) {
        data = markStartupDone(data);
        scheduleSave();
      } else {
        data = recordStartupAsk(data, t);
        openPanel("choice");
        scheduleSave();
        return scheduleProactive();
      }
    }
    const said = data.said;
    let trigger: Trigger = "idle";
    if ((hour >= 23 || hour < 5) && t - (said.night ?? 0) > 60 * MIN) trigger = "night";
    else if (t - sessionStart >= 90 * MIN && t - (said.long ?? 0) > 75 * MIN) trigger = "long";
    else if (hour >= 5 && hour < 11 && dayKey(said.morning ?? 0) !== dayKey(t)) trigger = "morning";
    else if (shouldHintGesture(data, t) && Math.random() < 0.7) trigger = "hint";
    else if (shouldHintBelly(data, t) && Math.random() < 0.7) trigger = "hintbelly";
    else if (
      !hasKey &&
      tierOf(data.closeness) >= 3 &&
      Math.random() < 0.15 &&
      t - (said.brainhint ?? 0) > 24 * 60 * MIN
    )
      trigger = "brainhint";
    if (trigger === "hint") data = recordHint(data, t);
    if (trigger === "hintbelly") data = recordBellyHint(data, t);
    // With a brain, about half of the proactive lines are written by the AI. Any problem
    // falls back to a scripted line, silently: unprompted chatter must never show errors.
    // (Gesture hints are always scripted: they teach something specific.)
    if (trigger !== "hint" && trigger !== "hintbelly" && canChat && Math.random() < 0.5 && aiGate(data, "proactive", t) === "ok") {
      data = recordAi(data, "proactive", t);
      scheduleSave();
      if (await aiProactive(trigger, hour)) {
        markShown();
        return scheduleProactive();
      }
    }
    // The pet may have dozed off while the model was answering: wait, do not talk in its sleep.
    if (isDozing(pose) || bubbleOn || panel !== null || !focusOut.speakAllowed) {
      proactiveTimer = setTimeout(() => fireProactive(), focusOut.speakAllowed ? 2 * MIN : FOCUS_RETRY_MS);
      return;
    }
    if (say(trigger)) markShown();
    scheduleProactive();
  }

  async function aiProactive(trigger: Trigger, hour: number): Promise<boolean> {
    const mood = bandOf(data, hour, lonely);
    const prompt =
      lang === "vi"
        ? `Bây giờ là ${hour} giờ. Tâm trạng của bạn: ${mood}. Tình huống: ${trigger}. Hãy tự nói một câu ngắn với mình, không cần mình trả lời.`
        : lang === "ja"
          ? `いまは${hour}時だよ。きみの気分：${mood}。状況：${trigger}。自分から短くひとこと話しかけてね。返事はいらないよ。`
          : `It is ${hour}:00. Your mood: ${mood}. Situation: ${trigger}. Say one short thing to me unprompted; no reply needed.`;
    try {
      const out = await invoke<{ text: string; mood: string }>("brain_chat", {
        lang,
        tier: tierOf(data.closeness),
        gentle: data.settings.gentle,
        history: [{ role: "user" as const, text: prompt }],
      });
      const reply = clip(out.text);
      const fo = await probeFocus(); // the user may have started typing while the model was answering
      if (quiet || panel !== null || bubbleOn || pose === "held" || isDozing(pose) || !fo.speakAllowed) return false;
      enter(moodPose(out.mood, data.settings.gentle));
      showBubble(reply, 5000);
      return true;
    } catch (e) {
      const k = errKind(e);
      if (k === "invalid_key") brainBad = true;
      if (k === "rate_limit") data = coolDown(data, Date.now());
      scheduleSave();
      return false;
    }
  }

  // ------------------------------------------------------- bubble window view
  const view = $derived.by<BubbleView>(() => {
    if (quiet) return { kind: "none" };
    if (panel === "chat") {
      return {
        kind: "chat",
        phase: chatPhase,
        canChat,
        placeholder: brainBad ? ui.brainBad : canChat ? ui.chatHint : ui.inputHint,
        user: chatUser,
        reply: chatReply,
        thinking: ui.thinking,
        slow: chatSlow ? ui.slowChat : "",
      };
    }
    if (panel === "input") {
      const name = inputField === "petName";
      return {
        kind: "input",
        field: inputField,
        text: name ? ui.nameAsk : ui.callMeAsk,
        placeholder: name ? ui.nameHolder : ui.callMeHolder,
        ok: ui.nameOk,
        skip: ui.nameSkip,
      };
    }
    if (panel === "tour") {
      const total = ui.tourSteps.length;
      return {
        kind: "tour",
        step: tourStep + 1,
        total,
        text: ui.tourSteps[tourStep] ?? "",
        next: tourStep + 1 < total ? ui.tourNext : ui.tourDone,
        skip: ui.tourSkip,
      };
    }
    if (panel === "dailyconsent") {
      return { kind: "consent", text: ui.dailyConsentText, note: ui.consentNote, yes: ui.consentYes, no: ui.consentNo };
    }
    if (panel === "choice") return { kind: "choice", id: "startup", text: ui.startupAsk, yes: ui.startupYes, later: ui.startupLater };
    if (panel === "ask") return { kind: "ask", text: ui.askText, yes: ui.askYes, later: ui.askLater };
    if (panel === "update") {
      return { kind: "update", text: ui.updateText.replace("{v}", updateVersion), yes: ui.updateYes, later: ui.updateLater };
    }
    if (panel === "consent") {
      return { kind: "consent", text: ui.consentText, note: ui.consentNote, yes: ui.consentYes, no: ui.consentNo };
    }
    if (bubbleOn) return { kind: "say", text: bubbleText, exclaim: bubbleExclaim };
    return { kind: "none" };
  });
  let lastSent = "";
  $effect(() => {
    const v = $state.snapshot(view) as BubbleView;
    const s = JSON.stringify(v);
    if (s !== lastSent) {
      lastSent = s;
      if (v.kind === "none") void toBubble(v);
      // The bubble window is created on demand. If it is new, this first message is lost,
      // but it announces itself ("bubble-ready") and we re-send the view then.
      else void invoke("bubble_ensure").finally(() => toBubble(v));
    }
  });
  function resendView() {
    lastSent = JSON.stringify($state.snapshot(view));
    void toBubble($state.snapshot(view) as BubbleView);
  }

  // ------------------------------------------------------------------ start
  onMount(() => {
    const cleanups: Array<() => void> = [];
    let minuteTimer: ReturnType<typeof setInterval> | undefined;
    let groundLoop: ReturnType<typeof setInterval> | undefined;
    let updateFirst: ReturnType<typeof setTimeout> | undefined;
    let updateEvery: ReturnType<typeof setInterval> | undefined;

    (async () => {
      const win = getCurrentWebviewWindow();
      // Register listeners first so no message from the other windows is missed.
      cleanups.push(
        await win.listen<boolean>("quiet-changed", (e) => {
          quiet = e.payload;
          if (quiet) count("quiet");
          stopTimers();
          if (quiet) {
            bubbleOn = false;
            closePanel();
          }
          enter(quiet ? "drowsy" : "idle"); // drifts off, or wakes up with a stretch
        })
      );
      cleanups.push(await win.listen<BubbleAction>("bubble-action", (e) => onBubbleAction(e.payload)));
      cleanups.push(await win.listen<boolean>("focus-hint", (e) => onFocusHint(e.payload)));
      cleanups.push(await win.listen("bubble-ready", resendView));
      cleanups.push(await win.listen("settings-ready", pushSettings));
      // test builds only (cargo feature `hop-test`): the right-click menu items that try the hops and the fall
      cleanups.push(
        await win.listen<string>("dev-hop", (e) => {
          if (e.payload === "pm_hop_up") void fly(splitHop(0, -160), "walk");
          else if (e.payload === "pm_hop_down") void fly(splitHop(0, 160), "walk");
          else if (e.payload === "pm_fall") void fly([planFall(400)], "gasp");
        }),
      );
      cleanups.push(await win.listen<SettingsPatch>("settings-patch", (e) => onSettingsPatch(e.payload)));
      cleanups.push(await win.listen<BrainChange>("brain-changed", (e) => onBrainChanged(e.payload)));

      const prefs = await invoke<{ quiet: boolean }>("get_prefs");
      quiet = prefs.quiet;

      let stored: string | null = null;
      try {
        stored = await invoke<string | null>("load_pet");
      } catch {
        /* start fresh */
      }
      await refreshBrain(); // which brain is in use, and whether it has a key
      const now = Date.now();
      const isNew = stored === null;
      const s = startSession(parse(stored, now), now);
      data = s.data;
      try {
        mem = parseMemory(await invoke<string | null>("load_memory"));
      } catch {
        /* nothing remembered yet */
      }
      mem = recordSession(mem, now, s.data.streak, s.absentMs);
      lonely = s.lonely;
      if (isNew) track("first_launch"); // dropped unless already opted in; backfilled on consent
      if (!isNew && !data.tour.done) data = finishTour(data); // an existing user never gets the tour unasked
      if (data.streak >= 3) track("active_d3");
      if (data.streak >= 7) track("active_d7");
      save();

      // The "also count per-day numbers" card, once or twice, for people who agreed to the first wording.
      if (shouldAskDaily(data)) {
        let triesDaily = 0;
        const tryDaily = () => {
          if (!shouldAskDaily(data) || quiet) return;
          if (!panel && !bubbleOn && !shouldAskConsent(data)) {
            data = recordDailyAsk(data);
            openPanel("dailyconsent");
            scheduleSave();
          } else if (++triesDaily < 15) setTimeout(tryDaily, 20_000);
        };
        setTimeout(tryDaily, 40_000);
      }

      // One-time, equal-weight consent card shortly after launch, never over another panel.
      // (After the tour, if there is one: it retries every 20 s for a few minutes while another card is open.)
      if (shouldAskConsent(data)) {
        let tries = 0;
        const tryConsent = () => {
          if (!shouldAskConsent(data) || quiet) return;
          if (!panel && !bubbleOn) {
            data = recordConsentAsk(data);
            openPanel("consent");
            scheduleSave();
          } else if (++tries < 15) setTimeout(tryConsent, 20_000);
        };
        setTimeout(tryConsent, 12_000);
      }

      // The window holds only the pet, so the clickable region never changes.
      invoke("set_hit_rect", { x: PET_LEFT, y: PET_TOP, w: PET_SIZE, h: PET_SIZE }).catch(() => {});
      enter(quiet ? "sleep" : "idle");

      if (!quiet) {
        setTimeout(() => {
          // Remembering beats a generic hello when there is something real to remember.
          const days = Math.floor(s.absentMs / DAY_MS);
          if (s.returned && days >= 2 && memSay("away", { absentDays: days })) return;
          if (!s.returned && Math.random() < 0.4 && (memSay("greet", {}, 6 * 60 * MIN) || memSay("habit", {}, 3 * DAY_MS))) return;
          say(s.returned ? "return" : "greeting");
        }, 1500);
        setTimeout(shareNextMark, 25_000);
        if (isNew && !data.tour.done) setTimeout(startTour, 4000);
        if (s.milestone) sayWhenCalm(() => say("milestone", { days: s.milestone! }), 8000);
      }
      scheduleProactive();
      groundLoop = setInterval(groundTick, GROUND_POLL_MS);
      // Test hook (like window.__cat): lets a debugger trigger the real unprompted-line path now.
      (window as unknown as Record<string, unknown>).__pet = { proactive: () => void fireProactive(), focus: () => ({ ...focusOut, lastLeave, pose }), trail: () => trail, sleep: () => enter("drowsy"), wake: () => enter("idle"), hop: (dx: number, dy: number) => void fly(splitHop(dx, dy), "walk"), lane: () => ({ ...laneOut, state: laneState, cat: laneCat }), ground: () => invoke("ground_under_cat"), groundLost: () => void groundLost(), say: (t: Trigger, kind?: RepeatKind) => (kind ? say(t, repeatNow(kind)) : say(t)), bubble: () => bubbleText, fall: (d: number) => void fly([planFall(d)], "gasp") };
      let lastTick = Date.now();
      minuteTimer = setInterval(() => {
        const now = Date.now();
        data = tick(data, now);
        // a minute of presence, unless the machine slept since the last tick (no new timer: this one existed)
        const inc = minuteIncrement(lastTick, now);
        lastTick = now;
        if (inc) data = bumpDay(data, "min", now, inc);
        // once-only milestones for the funnel
        const tier = tierOf(data.closeness);
        if (tier >= 2) track("tier_2");
        if (tier >= 3) track("tier_3");
        if (mem.petName) track("pet_named");
        save();
      }, MIN);

      // First update check a minute after start, then every six hours.
      updateFirst = setTimeout(autoCheckUpdate, 60_000);
      updateEvery = setInterval(autoCheckUpdate, 6 * 60 * MIN);
    })();

    return () => {
      stopTimers();
      [bubbleTimer, menuTimer, clickTimer, proactiveTimer, saveTimer, slowTimer, oneShotTimer, tiltTimer].forEach((t) =>
        clearTimeout(t)
      );
      clearInterval(minuteTimer);
      clearInterval(groundLoop);
      clearInterval(focusLoop);
      clearTimeout(updateFirst);
      clearInterval(updateEvery);
      clearTimeout(updateRetry);
      cleanups.forEach((c) => c());
    };
  });
</script>

<!-- No browser menu anywhere; the pet has its own small native menu (see onPetMenu). -->
<svelte:window oncontextmenu={(e) => e.preventDefault()} />

<main>
  <div
    class="pet"
    role="presentation"
    onpointerdown={onPetDown}
    onpointermove={onPetMove}
    onpointerup={onPetUp}
    onpointercancel={onPetUp}
    onpointerleave={onPetLeave}
    onclick={onClick}
    ondblclick={onDblClick}
    oncontextmenu={onPetMenu}
  >
    <Pet {pose} {dir} {tilt} gaze={gaze ?? attentionGaze} tick={poseTick} air={airborne} />
  </div>
</main>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    background: transparent;
    overflow: hidden;
    user-select: none;
  }
  main {
    position: relative;
    width: 140px;
    height: 140px;
  }
  .pet {
    position: absolute;
    left: 10px;
    top: 10px;
    width: 120px;
    height: 120px;
    cursor: grab;
    touch-action: none;
  }
  .pet:active {
    cursor: grabbing;
  }
</style>
