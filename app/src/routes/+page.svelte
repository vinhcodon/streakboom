<script lang="ts">
  // The pet window. It owns all state and logic; speech bubbles are shown by the "bubble"
  // window and settings by the "settings" window (see $lib/bus.ts for the messages).
  import { invoke } from "@tauri-apps/api/core";
  import { getVersion } from "@tauri-apps/api/app";
  import { channelOf, effectiveUpdateMode } from "$lib/channel";
  import { clockLine, clockPhrase } from "$lib/clock";
  import { decideDismissal, freshDismissalState, inConversation } from "$lib/dismissal";
  import { resolveGesture } from "$lib/bindings";
  import { recordPush, shouldHintAside } from "$lib/asidehint";
  import { MAX_CLARIFY, addKept, describeDate, dueToday, fallsOn, hasKept, keptForModel, markDone, missedSince, parseRemindAnswer, parseRemindArgs, pendingAlive, pruneOneOff, remindSay, replyKind, type Pending, type RemindLine } from "$lib/remind";
  import { clickResolver } from "$lib/clickresolver";
  import { newPass, passEnd, passLine, passStep } from "$lib/pass";
  import { gatesPass, pickLine as pickFromPool, runSteps, type Host } from "$lib/skill-run";
  import { ASIDE_SKILL, LEAVE_SKILL, SEAT_HERE_SKILL, SEAT_SKILL } from "$lib/skills";
  import { seatFraction, seatMove, seatWalkMs } from "$lib/seat";
  import { addressees, parseDuoCommand, parseRelay } from "$lib/duo-command";
  import { parseCallMe } from "$lib/callme";
  import { Conversation, addTurn, newRoom, presentable, situation, toHistory, type Line } from "$lib/conversation";
  import type { BoxAction, BoxView } from "$lib/chatbox";
  import type { PetId } from "$lib/duo";
  import { LEAVE_PACE_PX_S, RETRY_SECS, isLeaveCommand, leaveDeadlineMs, mayLeave, nearerEdge } from "$lib/farewell";
  import { matchIntent, shortEnoughForSkill } from "$lib/intents";
  import { emitTo } from "@tauri-apps/api/event";
  import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
  import { onMount } from "svelte";
  import Pet from "$lib/PetRig.svelte";
  import { isDozing, needsWakeFirst, TIMED, type PetState } from "$lib/sprites";
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
    forgetKept,
    forgetSeat,
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
    cleanName,
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
    isNight,
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
  import { LEAVE_MIN_ROOM_PX, LEAVE_PX, NEAR_PX, SLEEP_CROWD_MS, decideFocus, initialFocus, wakesToMakeWay, type FocusOut } from "$lib/focus";
  import { glideOut, rampIn, takeSteps } from "$lib/gait";
  import { CLIMB_PX_PER_S, HOP_MAX_PX, WALK_TO_WALL_PX_PER_S, chainAt, planCrawl, planFall, planHop, splitHop, totalMs, type Flight } from "$lib/hop";
  import { startGroundWatch, stepGround } from "$lib/groundwatch";
  import { NOTICE, wordsAtMs, type Beat } from "$lib/beats";
  import { chooseBeat, moodBeat } from "$lib/choose";
  import { endReaction, mayReact, newGate, startReaction } from "$lib/reactions";
  import { desktopShare, ledges, summary, type GroundKind, type GroundMap } from "$lib/groundmap";
  import { surfacesBelow, surfaces, wallFor, type Wall } from "$lib/terrain";
  import { clipReply, nfc } from "$lib/clip";
  import { analyse, edgeSpots, fuseSpots, hasRoom, reachability, standSpots, type StandSpot } from "$lib/picture";
  import { SETTLE, boxCoverage, chooseSettle, settleAllowed } from "$lib/settle";
  import { believe, responseFor, startBelief, type Belief } from "$lib/perception";
  import { choosePerch, PERCH_LIMITS } from "$lib/perch";
  import { bodyPoints, escapePlaces } from "$lib/escape";
  import { BRUISE_FALL_PX, BRUISE_MS, dropFalls, isBruised, shoveDirection, shoveKind, teeterEnds } from "$lib/push";
  import { initialAttention, mayAct, mayChatter, silentReaction, stepAttention, touched as attnTouched, type Mode } from "$lib/attention";
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
  // What is shown of a long reply (docs/plans/chat-box-issues-and-overlay-proposal.md, part 2): cut at the end of a sentence, not in the middle of one.
  const MAX_REPLY_CHARS = 600; // the reply to the person in the chat panel
  const MAX_REMARK_CHARS = 160; // a remark in a bubble the person did not ask for: short
  const MAX_TEST_CHARS = 400; // the reply shown by the model test of Settings

  type Panel = null | "chat" | "ask" | "consent" | "update" | "input" | "choice" | "tour" | "dailyconsent";
  type Turn = { role: "user" | "model"; text: string };

  let pose = $state<PetState>("idle");
  let poseTick = $state(0); // bumped on every change of pose so one-shot animations replay
  let dir = $state<1 | -1>(1);
  let gaze = $state<{ x: number; y: number } | null>(null); // where the cursor is over the cat (eyes follow)
  let tilt = $state(0); // degrees the pet leans while it is carried (follows the cursor's speed)
  let quiet = $state(false); // "Quiet mode": pet sleeps and says nothing
  // "Lượn đi" (spec 14, S2): Peak has walked off and its window is hidden until the timer in Rust runs out or the person shows it.
  let away = false;
  let leaving = false; // on the way out: the goodbye, then the walk to the edge
  let awayWalkActive = false; // the next walk is the walk to the edge
  /** The walk to its usual place along the floor (ADR-0117): physical px to go, the time given, and who waits for it. */
  let homeGoal: { px: number; ms: number; done: (reached: boolean) => void } | null = null;
  let lastFarewell: string | null = null;
  let data = $state<PetData>(defaultData(Date.now()));
  let mem = $state<Memory>(defaultMemory()); // what the pet remembers (its own file, memory.json)
  let inputField = $state<MemField>("callMe");

  // What the bubble window shows: a plain speech line, or one of the panels.
  let panel = $state<Panel>(null);
  let bubbleText = $state("");
  let bubbleExclaim = $state(false); // the bubble shows a cry: bigger, bolder, with a small jolt (spec/09)
  let bubbleOn = $state(false);

  // brain (BYOK). The key itself never reaches this window: it lives in the settings window's
  // input box and the OS credential store.
  let hasKey = $state(false);
  let providerInfo = $state<{ active: ProviderId; gemini: boolean; claude: boolean; openai: boolean }>({ active: "gemini", gemini: false, claude: false, openai: false });
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

  const lang = $derived(resolveLang(data.settings.lang, navigator.languages?.length ? navigator.languages : navigator.language));
  const ui = $derived(UI[lang]);
  // the document language decides which font variants the web view picks for Japanese characters
  $effect(() => {
    document.documentElement.lang = lang;
  });
  // the tray icon's menu is built in Rust: tell it the words in the language that is chosen now (and again when it changes)
  $effect(() => {
    const u = ui;
    invoke("set_tray_labels", { labels: [u.trayShow, u.traySettings, u.trayQuiet, u.trayQuit] }).catch(() => {});
  });
  const canChat = $derived(hasKey && !brainBad);
  /** The picker on the first card of the tour: each language in its own name, so that anyone can find theirs (ADR-0065). */
  const LANG_CHOICES = [
    { value: "vi" as const, label: "Tiếng Việt" },
    { value: "en" as const, label: "English" },
    { value: "ja" as const, label: "日本語" },
  ];

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const clip = (s: string, max = MAX_REPLY_CHARS) => clipReply(s, max);

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
      band: bandOf(data, hour),
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
    playTouched();
    mem = recordTouch(mem, kind);
    scheduleSave();
  };

  // ---------------------------------------------------- per-day counts (Bond Days, spec/05)
  // Recorded only if the user agreed to them (bumpDay checks). Counts only, never content.
  function count(key: DayCounter, n = 1) {
    void invoke("loop_trace", { step: `act ${key}` }).catch(() => {});
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
    if (away) return; // its window is hidden: nothing is shown while it is away
    bubbleText = text;
    bubbleWho = null;
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
  // The attention mode (spec/11 section 3, ADR-0047): work, free or play. Refreshed at every probe; a touch starts play.
  let attn = initialAttention();
  let mode: Mode = "work";
  function playTouched() {
    attn = attnTouched(attn, Date.now());
    mode = "play";
  }
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
        busy?: boolean; // fullscreen, presentation or a locked session (is_busy), read in the same probe (AP-08)
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
      const r = decideFocus(focusState, { idleMs: p.idleMs, pointer, busy: p.busy === true, quiet }, now);
      focusState = r.state;
      focusOut = r.out;
      const am = stepAttention(attn, { idleMs: p.idleMs, pointerNear: pointer === null ? null : pointer.over || pointer.dist < NEAR_PX }, now);
      attn = am.state;
      mode = am.mode;
    } catch {
      mode = "work"; // unknown: the person is working
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
  const NOTICE_MS = NOTICE.steps[0].ms; // the beat before it makes way: it looks toward the user's work, ears up (PC-2, ADR-0031)
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
    if (leaving || awayState()) return false; // leaving: no beat before an action that is not the leaving
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
    const b = believe(beliefState, fo, laneOut, lastGround); // the guess of the lane is steadier for being counted per probe (PC-1)
    beliefState = b.state;
    lastBelief = b.belief;
    if (fo.crowded || laneOut.crowded) {
      crowdedSince ??= Date.now();
      void makeWay(fo.leaveDir);
    } else {
      crowdedSince = null;
      laneNoted = false;
      laneReflexDone = false;
    }
  }

  const trail: string[] = []; // the last few decisions, for the debugger (window.__pet.trail)
  const note = (m: string) => {
    trail.push(`${new Date().toISOString().slice(11, 23)} ${m}`);
    if (trail.length > 40) trail.shift();
  };

  async function makeWay(away: 1 | -1) {
    if (leaving || awayState()) return; // it was told to go: it does not also dodge the typing (the trace of 0.9.4 showed a "notice" cancelling the leaving)
    const now = Date.now();
    if (laneOut.crowded && laneOut.lane && !flying) {
      const why = quiet ? "quiet" : panel !== null ? "a panel is open" : now - lastLaneHop < LANE_COOLDOWN_MS ? "cool-down" : pose === "held" ? "held" : null;
      if (!laneNoted) {
        laneNoted = true;
        note(`lane crowded: pose ${pose}, caret ${Math.round(laneOut.caretX ?? 0)}, cat ${Math.round(laneCat.x)},${Math.round(laneCat.y)}${why ? `, waiting: ${why}` : ""}`);
      }
      if (why) return;
      // A guess about where the text is heading first gets only a reflex (the cat looks toward it, ears up); the hop
      // follows once the guess has held for a moment (PC-1, spec/08 section 3). A fact (the pointer right by it) acts at once.
      if (!laneReflexDone && responseFor(lastBelief) === "reflex" && (pose === "idle" || pose === "look")) {
        laneReflexDone = true;
        note(`lane guess: reflex, confidence ${lastBelief.confidence.toFixed(2)}`);
        const l0 = laneOut.lane;
        if (l0) void noticeBeat((laneOut.caretX ?? laneCat.x) - laneCat.x, (l0.y0 + l0.y1) / 2 - laneCat.y);
        return;
      }
      if (responseFor(lastBelief) === "reflex") return; // not sure yet
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
      if (pose === "idle" || pose === "look" || pose === "notice") {
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
    if (await clearAside(away, lastPointer ? lastPointer.dx : null)) return; // with the picture on: the nearest clear place beyond the pointer
    if (pose !== "idle" && pose !== "look") return;
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
    if (await clearOutOfLane(lane)) return; // with the picture on: to a clear place outside the typing band
    const esc = escapeRow(lane, laneCat.y, room.up, room.down);
    note(`lane hop: ${esc ? `${esc.dir < 0 ? "up" : "down"} ${Math.round(esc.dist)}` : "no room"}, room ${room.up}/${room.down}, caret ${Math.round(laneOut.caretX ?? 0)}`);
    if (pose !== "idle" && pose !== "look" && pose !== "walk" && pose !== "notice") return; // something else happened while asking
    if (esc) {
      leavePerch();
      await fly(splitHop(0, esc.dir * esc.dist), "walk");
    }
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
    // anything else taking over ends the walk to its place without arriving
    if (homeGoal && requested !== "walk") {
      const g = homeGoal;
      homeGoal = null;
      g.done(false);
    }
    // something else took over while it was leaving (picked up, touched, a hop, a fall): it does not leave
    // While it walks to the edge, a plain "idle", "look" or "nod" would stop the walk without ending the leaving (the person would
    // see Peak standing and the next command would be refused as "already leaving"): they are ignored until the walk ends.
    if (leaving && awayWalkActive && (requested === "idle" || requested === "look" || requested === "nod")) {
      lt(`ignored_${requested}_during_walk`);
      return;
    }
    if (leaving && requested !== "walk" && requested !== "nod" && requested !== "idle" && requested !== "look") {
      lt(`cancelled_by_pose pose=${requested}`);
      leaving = false;
      awayWalkActive = false;
      settleWalk(false);
    }
    if (requested === "held") {
      leavePerch(); // carried away: it is no longer where it perched
    }
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
    if (away) return; // nothing moves or speaks while it is away
    nextTimer = setTimeout(pickNext, rand(4_000, 11_000));
  }

  /** exp/duo-prototype: true while a duo scene plays; Peak's own wandering waits. */
  let sceneHold = false;

  function pickNext() {
    if (sceneHold) return scheduleNext();
    if (leaving) return scheduleNext(); // the leaving is Peak's only business until it ends
    if (flying) return scheduleNext();
    if (pose === "peek" || pose === "ledge") return scheduleNext(); // a rest at the edge is not cut short
    if (quiet) return pose === "sleep" || pose === "drowsy" ? undefined : enter("drowsy");
    if (panel) return scheduleNext();
    // E29 round 4 (the screen picture experiment, Preview only): when the cat covers content, it goes to the nearest clear place
    if (pictureOn && !settleOff && !perchWall && (pose === "idle" || pose === "look") && Date.now() - lastSettle > SETTLE_EVERY_MS && settleAllowed(settleMoves, Date.now())) {
      lastSettle = Date.now();
      return void settleNow().finally(scheduleNext);
    }
    if (perchWall && Date.now() >= perchedUntil && (pose === "idle" || pose === "look")) return void descend();
    if (perchSeat && !perchWall && Date.now() >= perchedUntil && (pose === "idle" || pose === "look")) return void hopDown();
    if (Date.now() < perchedUntil) {
      if (perchSeat && Math.random() < 0.25 && !bubbleOn && !isBruised(bruisedUntil, Date.now())) return void tryWalk(true); // (not while wary after a fall) // now and then it walks to the edge and looks over (the ladder, CH-4)
      return void (Math.random() < 0.6 ? enter("look") : enter(bubbleOn ? "look" : "drowsy"));
    }
    if (isNight(new Date().getHours()) && mode !== "play" && Math.random() < 0.5) return void enter(bubbleOn ? "look" : "drowsy"); // at night by the clock it is sleepy (the retired quiet hours, ADR-0047)
    const r = Math.random();
    if (data.settings.groundMap && r > 0.97) return void perchNow();
    if (r < 0.5) enter("look");
    else if (r < 0.85) void tryWalk();
    else dozeOff(); // yawns first, then falls asleep (never while it is speaking)
  }

  // ------------------------------------------------------------------ perches (TE-10c, TE-10d, ADR-0043)
  const PERCH_COOLDOWN_MS = 5 * 60_000;
  let lastPerch = 0;
  let perchedUntil = 0; // while it is perched it only looks around and dozes (never walks off the ledge)
  /** The ledge it sits on, physical px (the ends of the run of the edge): it never walks past them (CH-2, the charter's article 3). */
  let perchSeat: { x0: number; x1: number } | null = null;
  const EDGE_MARGIN = 44; // logical px kept between the cat's feet and the end of the seat (the coast of a stop included)
  const SEAT_MIN_WALK = 70; // less room than this to either side and it only looks around
  function leavePerch() {
    perchedUntil = 0;
    perchWall = null;
    perchSeat = null;
  }
  /** Room to walk on the seat to the left and the right of the cat's feet, logical px; null when it is not on a seat. */
  async function seatRoom(): Promise<{ left: number; right: number } | null> {
    if (!perchSeat) return null;
    const at = await catFeet();
    if (!at) return null;
    const m = EDGE_MARGIN * at.scale;
    return { left: Math.max(0, (at.feet.x - (perchSeat.x0 + m)) / at.scale), right: Math.max(0, (perchSeat.x1 - m - at.feet.x) / at.scale) };
  }
  let walkSeatRoom: { left: number; right: number } | null = null;
  let walkToEdge = false; // this walk goes to the nearer end of the seat on purpose
  /**
   * The grid is coarse (a cell is about 115 px tall): the real top edge of the window under a ledge cell, found by asking a few
   * pixels at a time from half a cell above the cell's top down to it, where what is above stops and the window begins.
   * Physical px; null when it could not be asked.
   */
  async function refinedEdgeY(map: GroundMap, col: number, row: number): Promise<number | null> {
    try {
      const colX = Math.round(map.x + ((col + 0.5) * map.w) / map.cols);
      const cellH = map.h / map.rows;
      const top = map.y + row * cellH;
      const pts: [number, number][] = [];
      for (let y = Math.round(top - cellH * 0.5); y <= Math.round(top + cellH * 0.5); y += 4) pts.push([colX, y]); // the real edge is between the centres of the two cells
      const kinds = await invoke<string[]>("ground_at", { points: pts });
      const hit = kinds.findIndex((k) => k === "app" || k === "foreground");
      note(`edge at ${pts[Math.max(0, hit)][1]} (the cell said ${Math.round(top)})`);
      return hit > 0 ? pts[hit][1] : Math.round(top);
    } catch {
      return null;
    }
  }

  /**
   * How far a fall goes before the next surface below the cat (spec/10 section 11, ADR-0045): the ground map is read when
   * the seat has gone and the first edge under the cat's feet is found; logical px, or null when the map is off, shows
   * nothing below, or could not be taken (the fall then goes to the floor, as before).
   */
  async function planeBelow(): Promise<number | null> {
    if (!data.settings.groundMap) return null;
    const map = await takeGroundMap();
    const at = await catFeet();
    if (!map || !at) return null;
    // the nearest edge that is really below the feet (the ledge it stands on is an edge of the grid too, but its real edge is at its feet)
    for (const s of surfacesBelow(map, at.feet, -map.h / map.rows)) {
      const y = (await refinedEdgeY(map, s.col, s.row)) ?? s.y;
      if (y - at.feet.y >= 24 * at.scale) return Math.round((y - at.feet.y) / at.scale);
    }
    return null;
  }

  /** Where the cat's feet are, in physical px (the same space as the ground map), and the scale. */
  async function catFeet(): Promise<{ feet: { x: number; y: number }; scale: number } | null> {
    const place = await invoke<{ x: number; y: number; scale: number }>("pet_place");
    const geo = await invoke<{ catX: number | null; catY: number | null }>("focus_probe");
    if (geo.catX === null || geo.catY === null) return null;
    // the cat's centre (logical) plus half its size, times the scale
    return { feet: { x: geo.catX * place.scale, y: (geo.catY + PET_SIZE / 2) * place.scale }, scale: place.scale };
  }

  // The developer overlay (TT-1, spec/10): only a build with the cargo feature `terrain-overlay` has the tray item that opens
  // it. While it is open the page takes a map every 800 ms (whatever the switch says: it is for looking) and sends it, with
  // the surfaces, the cat's feet and the ledge it would choose, to the overlay window.
  let overlayTimer: ReturnType<typeof setInterval> | undefined;
  /** The picture of the screen is in use: the person's switch in Settings (any build), or the tray switch of a Preview or developer build (ADR-0119, PS-8). */
  let pictureOn = false;
  let pictureTray = false; // the tray switch of the test builds, off at every start
  function syncPicture() {
    const user = data.settings.screenPicture === true;
    pictureOn = pictureTray || user;
    void invoke("picture_user", { on: user }).catch(() => {});
  }
  /** The picture of the screen read once: the analysis, the size of the cat in cells and the stand spots (the windows and the picture, fused). */
  type PictureGrid = { x: number; y: number; w: number; h: number; gw: number; gh: number; data: number[]; ownCells: number };
  function readPicture(grid: PictureGrid, ss: ReturnType<typeof surfaces>) {
  const seen = analyse({ gw: grid.gw, gh: grid.gh, data: grid.data });
  const cell = grid.w / grid.gw; // physical px of a cell
  const cellY = grid.h / grid.gh;
  const catCells = Math.round((PET_SIZE * (window.devicePixelRatio || 1)) / cell);
  // the surfaces of the map of windows (exact edges), in grid cells: the feet row is the one above the edge (round 7: one list of places)
  const winSpots: StandSpot[] = ss
    .filter((u) => u.roomy)
    .map((u) => ({ x0: Math.max(0, Math.floor((u.x0 - grid.x) / cell)), x1: Math.min(grid.gw - 1, Math.floor((u.x1 - grid.x) / cell)), y: Math.floor((u.y - grid.y) / cellY) - 1, headroom: catCells }))
    .filter((u) => u.x1 - u.x0 + 1 >= Math.max(6, Math.ceil(catCells * 0.6)) && u.y >= 0 && u.y < grid.gh - 2);
  const meanGrey = grid.data.reduce((a, b) => a + b, 0) / Math.max(1, grid.data.length);
    const spots = reachability(fuseSpots(winSpots, fuseSpots(edgeSpots(seen, catCells), standSpots(seen, catCells), 2, "edge")), seen, Math.round((HOP_MAX_PX * (window.devicePixelRatio || 1)) / cell));
    return { seen, cell, cellY, catCells, meanGrey, spots };
  }

  const SETTLE_EVERY_MS = 10_000;
  let settleOff = false; // STREAKBOOM_NO_SETTLE=1 (a test aid): the rule is not used, so the share of cover can be measured without it
  void invoke<boolean>("dev_flag", { name: "STREAKBOOM_NO_SETTLE" }).then((v) => (settleOff = v)).catch(() => {});
  let lastSettle = 0;
  let settleMoves: number[] = []; // the times of the moves, for the back-off
  /**
   * Look at the picture of the screen; if more than a third of the cells under the cat's body are not empty, walk along the floor or hop up
   * to the nearest clear place with room above it (settle.ts). Only while the picture experiment is on. It moves away from content, so
   * it is allowed while the person works, but never while a panel, a hold or a flight is going on. Numbers only in the trace.
   */
  async function settleNow(beforeSleep = false): Promise<boolean> {
    try {
      if (flying || quiet || panel !== null || leaving || away) return false;
      const sc = await readScene();
      if (!sc) return false;
      const { seen, col, row, catCells, spots, hopCells } = sc;
      let move = chooseSettle(seen, { col, row }, catCells, spots, hopCells, beforeSleep ? SETTLE.coverBeforeSleep : SETTLE.coverHigh);
      lp(`settle${beforeSleep ? "_presleep" : ""} col=${col} row=${row} move=${move ? move.kind : "none"} cover=${Math.round(100 * boxCoverage(seen, col, row, catCells, catCells))}`);
      // one chooser of places (E29, ADR-0123): on a ledge it keeps as its seat the cat only walks along it, never leaves it
      if (move && perchSeat && move.kind !== "walk") move = null;
      if (!move) return false;
      return await runMove(move, sc);
    } catch {
      return false;
    }
  }

  type Scene = NonNullable<Awaited<ReturnType<typeof readScene>>>;
  /** The picture of the screen, the cat's cell and the places (one look). Null when the picture or the cat's place is not there. */
  async function readScene() {
    const grid = await invoke<PictureGrid | null>("screen_grid");
    const at = await catFeet();
    if (!grid || !at) return null;
    let ss: ReturnType<typeof surfaces> = [];
    try {
      ss = surfaces(await invoke<GroundMap>("ground_map"));
    } catch {
      /* no map of windows: the picture alone */
    }
    const { seen, cell, cellY, catCells, spots } = readPicture(grid, ss);
    const col = Math.floor((at.feet.x - grid.x) / cell);
    const row = Math.floor((at.feet.y - grid.y) / cellY) - 1;
    const hopCells = Math.round((HOP_MAX_PX * at.scale) / cell);
    return { grid, at, seen, cell, cellY, catCells, spots, col, row, hopCells };
  }

  /** Walk or hop to the place the chooser gave. True when the cat went. */
  async function runMove(move: NonNullable<ReturnType<typeof chooseSettle>>, sc: Scene): Promise<boolean> {
    const { grid, at, cell, cellY, col } = sc;
    const dxPhys = (move.col - col) * cell;
    if (move.kind === "walk") {
      const px = Math.abs(dxPhys);
      dir = dxPhys < 0 ? -1 : 1;
      // the room the cat has toward that edge: it does not aim past where it can stand (H28)
      let room = Infinity;
      try {
        room = (await invoke<number>("edge_room", { dir })) * at.scale;
      } catch {
        /* unknown: no cut */
      }
      const go = Math.min(px, Math.max(0, room - 20 * at.scale));
      if (go < 2 * cell) {
        lp(`settle_walk skipped room=${Math.round(room)} px=${Math.round(px)}`);
        return false;
      }
      settleMoves = [...settleMoves.filter((t) => Date.now() - t < 10 * 60_000), Date.now()];
      const ok = await new Promise<boolean>((resolve) => {
        homeGoal = { px: go, ms: seatWalkMs(go / at.scale, LEAVE_PACE_PX_S), done: resolve };
        enter("walk");
      });
      lp(`settle_walk ok=${ok ? 1 : 0} px=${Math.round(go)} asked=${Math.round(px)}`);
      return ok;
    }
    settleMoves = [...settleMoves.filter((t) => Date.now() - t < 10 * 60_000), Date.now()];
    const footY = grid.y + (move.row + 1) * cellY;
    await fly(splitHop(Math.round(dxPhys / at.scale), Math.round((footY - at.feet.y) / at.scale)), "walk");
    lp(`settle_hop dx=${Math.round(dxPhys / at.scale)} dy=${Math.round((footY - at.feet.y) / at.scale)}`);
    return true;
  }

  /**
   * The typing lane with the picture on: instead of a hop of 160 px or more up or down, go to the nearest clear place (up to one hop, or
   * along the floor) whose box lies outside the band of the typing row (`lane.y0`..`lane.y1`, logical px). False when none, then the old hop.
   */
  async function clearOutOfLane(lane: { y0: number; y1: number }): Promise<boolean> {
    if (!pictureOn || settleOff || flying) return false;
    try {
      const sc = await readScene();
      if (!sc) return false;
      const k = sc.at.scale;
      const band = { y0: Math.floor((lane.y0 * k - sc.grid.y) / sc.cellY) - 1, y1: Math.ceil((lane.y1 * k - sc.grid.y) / sc.cellY) + 1 };
      const move = chooseSettle(sc.seen, { col: sc.col, row: sc.row }, sc.catCells, sc.spots, sc.hopCells, 0, undefined, band);
      lp(`lane_place col=${sc.col} row=${sc.row} band=${band.y0}-${band.y1} move=${move ? move.kind : "none"}`);
      if (!move || (perchSeat && move.kind !== "walk")) return false;
      leavePerch();
      return await runMove(move, sc);
    } catch {
      return false;
    }
  }

  /**
   * "Step aside" and "make way" with the picture on (the author's idea): instead of a fixed short walk, go to the nearest clear place
   * beyond the pointer, on the side away from it, no farther than 45 cells (about 450 px). False when the picture is off, there is no such
   * place, or something else is going on; the caller then does what it always did.
   */
  async function clearAside(way: 1 | -1, pointerDx: number | null): Promise<boolean> {
    if (!pictureOn || settleOff || flying) return false;
    try {
      const sc = await readScene();
      if (!sc) return false;
      const ptrCol = sc.col + Math.round(((pointerDx ?? 0) * sc.at.scale) / sc.cell);
      const move = chooseSettle(sc.seen, { col: sc.col, row: sc.row }, sc.catCells, sc.spots, sc.hopCells, 0, { col: ptrCol, gap: sc.catCells + 2, side: way, maxCols: 45 });
      lp(`aside_place col=${sc.col} way=${way} ptr=${ptrCol} move=${move ? move.kind : "none"}`);
      if (!move || (perchSeat && move.kind !== "walk")) return false;
      return await runMove(move, sc);
    } catch {
      return false;
    }
  }

  /** Falls asleep where it is, or, with the picture experiment on, first goes to a clear place if it covers even a little (H29; manners 1, yield first). */
  function dozeOff() {
    if (pictureOn && !settleOff && !perchWall && (pose === "idle" || pose === "look") && !bubbleOn && settleAllowed(settleMoves, Date.now())) {
      void settleNow(true).finally(() => {
        if (!flying && !quiet && !leaving && (pose === "idle" || pose === "look")) enter("drowsy");
      });
      return;
    }
    enter(bubbleOn ? "look" : "drowsy");
  }

  let viewTick = 0;
  let lastGrid: { x: number; y: number; w: number; h: number; gw: number; gh: number } | null = null;
  async function feedOverlay() {
    try {
      const map = await invoke<GroundMap>("ground_map");
      const at = await catFeet();
      const perch = at ? choosePerch(map, at.feet, at.scale, { ...PERCH_LIMITS, maxRise: CLIMB_MAX_RISE }, 0) : null; // the limits of a real attempt, climbing included
      const target = perch && at ? { x: Math.round(at.feet.x + perch.dx * at.scale), y: Math.round(at.feet.y + perch.dy * at.scale) } : null;
      const ss = surfaces(map);
      const note = `${summary(map)} | ${ss.length} surfaces (${ss.filter((s) => s.roomy).length} with room) | ${target ? "target at " + target.x + "," + target.y : "no target"} | mode ${mode} | last: ${lastPerchWhy}`;
      // the screen picture (ADR-0119): a small grey grid, read for edges at once and dropped; only lines and a mask go to the overlay
      let picture: unknown = null;
      let coverNow = -1; // the share of the cat's box that is not empty, percent (E29)
      if (pictureOn) {
        const grid = await invoke<{ x: number; y: number; w: number; h: number; gw: number; gh: number; data: number[]; ownCells: number } | null>("screen_grid");
        if (grid) {
          lastGrid = { x: grid.x, y: grid.y, w: grid.w, h: grid.h, gw: grid.gw, gh: grid.gh };
          const { seen, catCells, meanGrey, spots } = readPicture(grid, ss);
          if (at) coverNow = Math.round(100 * boxCoverage(seen, Math.floor((at.feet.x - grid.x) / (grid.w / grid.gw)), Math.floor((at.feet.y - grid.y) / (grid.h / grid.gh)) - 1, catCells, catCells));
          picture = { gw: seen.gw, gh: seen.gh, threshold: seen.threshold, catCells, hsegs: seen.hsegs.map((h) => ({ ...h, room: hasRoom(h, catCells) })), vsegs: seen.vsegs, empty: Array.from(seen.empty), kinds: Array.from(seen.kinds), regions: seen.regions, bands: seen.bands, own: grid.ownCells, dark: meanGrey < 110, spots };
        }
      }
      // E29: every third map (about 2.4 s) one line of what the cat stands on, numbers only (no pixels, no words)
      if (++viewTick % 3 === 0) {
        let onSpot = -1;
        let spotsN = -1;
        let ownCells = -1;
        const pic = picture as { spots?: { x0: number; x1: number; y: number }[]; own?: number; gw?: number } | null;
        if (pic && pic.spots) {
          spotsN = pic.spots.length;
          ownCells = pic.own ?? -1;
          const gridNow = lastGrid;
          if (at && gridNow) {
            const col = Math.floor((at.feet.x - gridNow.x) / (gridNow.w / gridNow.gw));
            const row = Math.floor((at.feet.y - gridNow.y) / (gridNow.h / gridNow.gh)) - 1;
            onSpot = pic.spots.some((u) => col >= u.x0 && col <= u.x1 && Math.abs(u.y - row) <= 1) ? 1 : 0;
          }
        }
        lp(`view pose=${pose} surfaces=${ss.length} roomy=${ss.filter((u) => u.roomy).length} spots=${spotsN} on_spot=${onSpot} cover=${coverNow} fx=${at ? Math.round(at.feet.x) : -1} fy=${at ? Math.round(at.feet.y) : -1}`);
      }
      await emitTo("overlay", "overlay-data", { map, surfaces: ss, target, feet: at ? at.feet : null, note, picture });
    } catch {
      /* the overlay may have been closed meanwhile */
    }
  }

  /**
   * Hop up onto the top edge of a window when the ground map (only if the user switched it on) shows one nearby: the cat
   * looks at it, crouches, hops, and then simply stays (it sits, dozes, watches like anywhere else). If the window goes
   * away under it, the ground watch of PC-7 makes it startle and fall (TE-10d). `fake` and `force` are for the debugger.
   */
  async function perchNow(fake?: GroundMap, force = false, how?: "hop" | "climb") {
    const now = Date.now();
    if (flying || quiet || panel !== null || (pose !== "idle" && pose !== "look")) {
      pt(`blocked busy flying=${flying ? 1 : 0} quiet=${quiet ? 1 : 0} panel=${panel !== null ? 1 : 0} pose=${pose}`);
      return scheduleNext();
    }
    if (!force && now - lastPerch < PERCH_COOLDOWN_MS) {
      pt(`blocked cooldown left_s=${Math.round((PERCH_COOLDOWN_MS - (now - lastPerch)) / 1000)}`);
      return scheduleNext();
    }
    const fo = await probeFocus();
    if ((!fo.walkAllowed || !mayAct(mode, 2, "own", quiet)) && !force) {
      pt(`blocked not_free mode=${mode} walk_allowed=${fo.walkAllowed ? 1 : 0}`);
      return scheduleNext(); // a perch is brisk: only when the person is not working
    }
    const map = fake ?? (await takeGroundMap());
    if (!map) {
      pt(`blocked no_map ground_map=${data.settings.groundMap ? 1 : 0}`);
      return scheduleNext();
    }
    const at = await catFeet();
    if (!at) {
      pt("blocked no_feet");
      return scheduleNext();
    }
    const { feet, scale } = at;
    const place = { scale };
    // a ledge up to CLIMB_MAX_RISE high counts when there is a wall to climb to it (spec/10 section 11); without one, the hop's limit
    const perch = choosePerch(map, feet, scale, { ...PERCH_LIMITS, maxRise: CLIMB_MAX_RISE }, Math.random());
    const wall = perch ? wallFor(map, perch.col, perch.row, feet.x) : null;
    const canClimb = !!wall && wall.width >= MIN_CLIMB_LEDGE * scale && how !== "hop";
    const climb = canClimb && (how === "climb" || -perch!.dy > 200 || Math.random() < 0.5);
    note(perch ? `perch: ledge ${perch.col},${perch.row}, go ${perch.dx},${perch.dy}${climb ? ", by climbing" : ""}` : "perch: no ledge");
    if (!perch) {
      pt(`no_ledge ledges=${ledges(map).length} surfaces=${surfaces(map).length} desktop_pct=${Math.round(desktopShare(map) * 100)} scale=${scale}`);
      return scheduleNext();
    }
    if (!climb && -perch.dy > HOP_MAX_PX) {
      pt(`too_high rise=${-perch.dy} hop_max=${HOP_MAX_PX} wall=${wall ? 1 : 0} wall_width=${wall ? Math.round(wall.width) : 0}`);
      return scheduleNext(); // by hop one hop up, so that one hop brings it down again
    }
    pt(`go ${climb ? "climb" : "hop"} dx=${perch.dx} dy=${perch.dy} wall=${wall ? 1 : 0}`);
    const run = surfaces(map).find((u) => u.row === perch.row && perch.col >= u.c0 && perch.col <= u.c1);
    const seat = run ? { x0: run.x0, x1: run.x1 } : null;
    lastPerch = now;
    // The grid is coarse (a cell is about 115 px tall): find the window's real top edge by asking, a few pixels at a time,
    // from the cell above down to the cell's top edge, where the bare desktop stops and the window begins.
    let dy = perch.dy;
    const edge = await refinedEdgeY(map, perch.col, perch.row);
    if (edge !== null) dy = Math.round((edge - feet.y) / place.scale);
    if (climb && wall) {
      if (await climbUp(map, wall, edge ?? Math.round(feet.y + dy * scale), feet, scale)) {
        perchedUntil = Date.now() + 3 * 60_000;
        perchSeat = seat;
        pt("climb_done ok=1");
      } else {
        perchWall = null;
        pt("climb_done ok=0");
      }
      return;
    }
    if (!(await noticeBeat(perch.dx, dy))) return;
    await fly(splitHop(perch.dx, dy), "walk");
    perchedUntil = Date.now() + 3 * 60_000; // it stays up there a while, and never walks off the seat (CH-2)
    perchSeat = seat;
    pt("hop_done");
  }

  /**
   * The ladder at the end of a seat (spec/11 section 1.1, CH-4): it has stopped; it crouches and peeks over the edge for a
   * moment, and then, by chance, turns back (half the time), sits there with its paws over the edge for a while (a rest with
   * a view), or, when it came up a wall, climbs down early. It never falls: a fall needs a cause (the charter, article 3).
   */
  async function atEdge(faced: 1 | -1) {
    if (!perchSeat || flying) return;
    await sleepMs(500); // the stop coasts for a moment first
    if (pose !== "idle" || !perchSeat) return;
    dir = faced;
    stopTimers();
    pose = "peek";
    poseTick++;
    await sleepMs(2600);
    if (!still("peek") || !perchSeat) return;
    const r = Math.random();
    note(`edge: peeked, ${r < 0.5 ? "turns back" : r < 0.85 || !perchWall ? "sits at the edge" : "climbs down"}`);
    if (r < 0.5) return void enter("idle");
    if (r < 0.85 || !perchWall) return void enter("ledge");
    enter("idle");
    void descend();
  }

  // ------------------------------------------------------------------ the person's push and drop (CH-5, spec/11 section 1)
  let bruisedUntil = 0; // wary until then: no walks to the edge, a push only teeters
  /** How far it falls from here: to the plane below it (a ledge, a dialog) or the floor; logical px. */
  async function fallDistance(): Promise<number> {
    let down = 0;
    try {
      down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
    } catch {
      /* unknown */
    }
    const plane = await planeBelow();
    return plane !== null ? Math.min(plane, down) : down;
  }

  /** A ledge just under the feet (the real edge asked for, a few px at a time): the ends of its run, physical px; null when there is none. */
  async function seatUnder(): Promise<{ x0: number; x1: number } | null> {
    const map = await takeGroundMap();
    const at = await catFeet();
    if (!map || !at) return null;
    for (const u of surfaces(map)) {
      if (at.feet.x < u.x0 || at.feet.x > u.x1 || Math.abs(u.y - at.feet.y) > (map.h / map.rows) * 1.2) continue;
      const e = await refinedEdgeY(map, u.c0, u.row);
      if (e !== null && Math.abs(e - at.feet.y) <= 16) return { x0: u.x0, x1: u.x1 };
    }
    return null;
  }

  /** After a landing or a placing: if it stands on a ledge it keeps it as its seat (it stays a while and never walks off its end). */
  async function adoptSeatHere() {
    await sleepMs(500);
    if (flying || pose === "held") return;
    const seat = await seatUnder();
    if (!seat) return;
    perchSeat = seat;
    perchWall = null;
    perchedUntil = Date.now() + 3 * 60_000;
    note("on a ledge: it has a seat");
  }

  /** The window rocks about for `ms` (a teeter), `dir` the way of the push; ends where it began. */
  async function wobble(dir: 1 | -1, ms: number) {
    if (flying) return;
    flying = true;
    try {
      const start = await invoke<{ x: number; y: number; scale: number }>("pet_place");
      const points: [number, number][] = [];
      for (let t = 0; t <= ms; t += 16) points.push([Math.round(dir * 9 * start.scale * Math.sin((2 * Math.PI * 3 * t) / ms)), 0]);
      points.push([0, 0]);
      await invoke<boolean>("fly_path", { points, frameMs: 16 });
    } catch {
      /* the window could not be moved */
    } finally {
      flying = false;
    }
  }

  /** A real push at the edge: rock, then (four times in five, always when wary) recover, else be knocked off the seat. */
  async function doTeeter(way: 1 | -1, force?: "recover" | "fall") {
    stopTimers();
    clearTimeout(oneShotTimer);
    const bruised = isBruised(bruisedUntil, Date.now());
    const ends = force ?? teeterEnds(Math.random(), bruised);
    note(`push ${way > 0 ? "right" : "left"}: teeter, ${ends}${bruised ? " (wary)" : ""}`);
    dir = way; // the cat faces the edge: its side shows
    pose = "teeter";
    poseTick++;
    await wobble(way, 1100);
    if (!still("teeter")) return;
    if (ends === "recover") return void enter("huff"); // it catches itself: a flinch and a flick of the tail
    // it goes off the end of its seat: out sideways past the edge (and its own half width) first, then down beside the wall, not through the window
    const room = await seatRoom();
    const toEnd = room ? (way > 0 ? room.right : room.left) + EDGE_MARGIN : 40; // from its feet to the end of the seat, logical px
    const across = way * Math.round((toEnd + 30) * 1.2 + 30);
    leavePerch();
    const dist = await fallDistance();
    say("fall", { exclaim: true });
    if (dist >= BRUISE_FALL_PX) bruisedUntil = Date.now() + BRUISE_MS;
    if (dist >= FALL_MIN_PX) {
      await fly([{ ...planFall(dist), dx: across, slide: true }], "gasp");
      void adoptSeatHere();
    } else enter("idle");
  }

  /**
   * The right click is a push (ADR-0055): away from the pointer. Near the end of the seat it sits on, Peak teeters (and may
   * fall); anywhere else it staggers a little and huffs. A sleeper is only poked. `pointerDx`: the pointer from the cat's
   * middle, logical px.
   */
  let lastShove = 0;
  let pushTimes: number[] = []; // recent pushes, for the one-time hint about "step aside" (IM-4); memory only
  /** After several pushes in a short while Peak says once, in its whole life, that the person can also say "step aside". */
  function maybeHintAside(now: number) {
    pushTimes = recordPush(pushTimes, now);
    if (!shouldHintAside(pushTimes, data.said) || hintAsideWaiting) return;
    // The push usually has its own huff and bubble: the hint waits until the bubble is gone (up to ~12 s) and is marked
    // as said only when it was really shown, so a swallowed line is not lost for good (V-141).
    hintAsideWaiting = true;
    let tries = 0;
    const attempt = () => {
      tries++;
      if (data.said.hintaside) return void (hintAsideWaiting = false); // step aside was used meanwhile
      const free = !quiet && !away && !leaving && !flying && pose !== "held" && panel === null && !bubbleOn;
      if (free && say("hintaside")) {
        data = { ...data, said: { ...data.said, hintaside: Date.now() } };
        scheduleSave();
        hintAsideWaiting = false;
      } else if (tries < 12) setTimeout(attempt, 1000);
      else hintAsideWaiting = false;
    };
    setTimeout(attempt, 2200);
  }
  let hintAsideWaiting = false;
  async function shove(pointerDx: number) {
    const now = Date.now();
    lp(`shove pose=${pose} quiet=${quiet ? 1 : 0} flying=${flying ? 1 : 0} panel=${panel === null ? 0 : 1} cool=${now - lastShove < 2500 ? 1 : 0}`);
    if (quiet || flying || panel !== null || pose === "held" || now - lastShove < 2500) return;
    if (isDozing(pose)) return pokeNormal();
    if (!(pose === "idle" || pose === "look" || pose === "peek" || pose === "ledge")) return;
    lastShove = now;
    maybeHintAside(now);
    const way = shoveDirection(pointerDx, dir);
    const kind = shoveKind(perchSeat ? await seatRoom() : null, EDGE_MARGIN, way);
    data = interact(data, "click", now);
    touch("poke");
    count("poke");
    engage();
    if (kind === "teeter") return void doTeeter(way);
    stopTimers();
    clearTimeout(oneShotTimer);
    note(`push ${way > 0 ? "right" : "left"}: stagger`);
    await wobble(way, 450);
    enter("huff");
  }

  /** Let go of Peak: on a ledge it keeps it as a seat; high above the floor it falls (to the ledge below, if there is one); nearly on the floor it just lands. */
  async function afterDrop() {
    await sleepMs(350); // the landing squash first
    if (flying || pose === "held" || quiet) return;
    const seat = await seatUnder();
    if (seat) {
      perchSeat = seat;
      perchWall = null;
      perchedUntil = Date.now() + 3 * 60_000;
      note("placed on a ledge: it has a seat");
      return;
    }
    leavePerch();
    const dist = await fallDistance();
    if (!dropFalls(dist, false)) return;
    note(`let go in the air: falls ${Math.round(dist)}`);
    say("fall", { exclaim: true });
    if (dist >= BRUISE_FALL_PX) bruisedUntil = Date.now() + BRUISE_MS;
    await fly([planFall(dist)], "gasp");
    void adoptSeatHere();
  }

  /** A seat reached by a hop is left by a hop: a deliberate step down with a crouch, not a fall (spec/11 section 1.1). */
  async function hopDown() {
    if (!perchSeat || perchWall || flying) return;
    leavePerch();
    let down = 0;
    try {
      down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
    } catch {
      /* unknown: it stays */
    }
    note(`hop down ${Math.round(down)}`);
    if (down >= 30) await fly(splitHop(0, down), "walk");
  }

  // ------------------------------------------------------------------ walls and climbing (TT-12, TT-14, spec/10 section 11)
  const CLIMB_MAX_RISE = 900; // logical px: a wall can be climbed as high as the screen
  const MIN_CLIMB_LEDGE = 200; // the ledge must be this wide (logical px) for the cat to pull itself up and stand
  const CLAW_DX = 42; // from the cat's centre to the wall it clings to (the paws of the climb drawing)
  const MANTLE_DX = 78; // from the clinging place to the middle of the cat standing on the ledge
  const MANTLE_DY = 88; // how far the feet line is under the ledge while the paws are on its edge
  /** Where the cat perched by climbing, to go down the same way: physical px of the wall and facing; null when it hopped up or not at all. */
  let perchWall: { dir: 1 | -1; x: number } | null = null;

  /** The wall's real x: the cell edge is coarse, so ask a few pixels at a time from outside the window toward it, just under its top edge. Physical px. */
  async function refinedWallX(map: GroundMap, wall: Wall, topY: number): Promise<number> {
    try {
      const cellW = map.w / map.cols;
      const y = Math.round(topY + 24);
      const pts: [number, number][] = [];
      if (wall.dir === 1) for (let x = Math.round(wall.x - cellW * 0.5); x <= Math.round(wall.x + cellW * 0.75); x += 4) pts.push([x, y]);
      else for (let x = Math.round(wall.x + cellW * 0.5); x >= Math.round(wall.x - cellW * 0.75); x -= 4) pts.push([x, y]);
      const kinds = await invoke<string[]>("ground_at", { points: pts });
      const hit = kinds.findIndex((k) => k === "app" || k === "foreground");
      note(`wall at ${hit >= 0 ? pts[hit][0] : "?"} (the cell said ${wall.x})`);
      return hit >= 0 ? pts[hit][0] : wall.x;
    } catch {
      return wall.x;
    }
  }

  /** Still in the pose the route set (not picked up or told to do something else meanwhile). */
  const still = (p: PetState) => (pose as PetState) === p;

  /**
   * Walk to the wall, cling, climb up it, cling, pull up onto the ledge (a hop with no crouch), then sit there. False when
   * something took over on the way (the route stops where it is). `top` is the window's top edge, physical px.
   */
  async function climbUp(map: GroundMap, wall: Wall, top: number, feet: { x: number; y: number }, scale: number): Promise<boolean> {
    const wallX = await refinedWallX(map, wall, top);
    const centreX = wallX - wall.dir * CLAW_DX * scale;
    const approach = (centreX - feet.x) / scale;
    const rise = (feet.y - (top + MANTLE_DY * scale)) / scale;
    note(`climb: approach ${Math.round(approach)}, up ${Math.round(rise)}, facing ${wall.dir}`);
    if (rise < 30) return false;
    if (!(await noticeBeat(approach, -rise))) return false;
    if (Math.abs(approach) > 4) {
      dir = approach > 0 ? 1 : -1;
      await fly([planCrawl(approach, 0, WALK_TO_WALL_PX_PER_S)], "walk", { settle: false });
      if (!still("walk")) return false;
    }
    dir = wall.dir;
    pose = "cling";
    poseTick++;
    await sleepMs(300);
    if (!still("cling")) return false;
    await fly([planCrawl(0, -rise, CLIMB_PX_PER_S)], "climb", { settle: false });
    if (!still("climb")) return false;
    pose = "cling";
    poseTick++;
    await sleepMs(350);
    if (!still("cling")) return false;
    await fly([planHop(wall.dir * MANTLE_DX, -MANTLE_DY)], "walk", { crouch: false, keepDir: true });
    perchWall = { dir: wall.dir, x: wallX };
    return true;
  }

  /**
   * Go down the way it came up: to the edge, over it onto the wall, down the wall to the floor, and stand. Called from `pickNext`
   * when the stay on the ledge is over. If anything is wrong (no room under it, picked up) it simply stops where it is.
   */
  async function descend() {
    const w = perchWall;
    if (!w || flying) return;
    perchWall = null;
    perchSeat = null;
    perchedUntil = 0;
    note("descend");
    // walk to the edge (the cat faces away from the wall's side first: it walks the way it came from), then over
    dir = (-w.dir) as 1 | -1;
    await fly([planCrawl(-w.dir * (MANTLE_DX - CLAW_DX - 16), 0, WALK_TO_WALL_PX_PER_S)], "walk", { settle: false });
    if (!still("walk")) return;
    dir = w.dir;
    pose = "cling";
    poseTick++;
    await sleepMs(300);
    if (!still("cling")) return;
    await fly([planHop(-w.dir * (CLAW_DX + 16), MANTLE_DY)], "cling", { crouch: false, keepDir: true, settle: false });
    if (!still("cling")) return;
    let down = 0;
    try {
      down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
    } catch {
      /* unknown: it stays where it is */
    }
    note(`descend: down ${Math.round(down)}`);
    if (down < 30) return void enter("idle");
    await sleepMs(250);
    if (!still("cling")) return;
    await fly([planCrawl(0, down, CLIMB_PX_PER_S)], "climb");
  }

  /**
   * For the debugger (`window.__pet.perchPretend()`): hop onto a ledge that is not there. A made-up map puts a "window" with bare desktop above it
   * a little up and to the side of the cat, so the hop can be looked at on a screen that has no real ledge. It ignores the
   * cool-down and the switch of the ground map, and nothing is read from the screen.
   */
  async function perchPretend() {
    if (flying || (pose !== "idle" && pose !== "look")) return;
    const m = (await invoke<{ x: number; y: number; w: number; h: number; scale: number }[]>("monitors_info"))[0];
    if (!m) return;
    const cols = 16;
    const rows = 9;
    const read = async () => {
      const place = await invoke<{ x: number; y: number; scale: number }>("pet_place");
      const geo = await invoke<{ catX: number | null; catY: number | null }>("focus_probe");
      return { place, geo };
    };
    let { place, geo } = await read();
    if (geo.catX === null || geo.catY === null) return;
    const feetRow = () => Math.floor((((geo.catY ?? 0) + PET_SIZE / 2) * place.scale - m.y) / m.h * rows);
    if (feetRow() < 5) {
      // too high for a ledge three rows above it: first let it drop to the floor
      const down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
      if (down >= FALL_MIN_PX) await fly([planFall(down)], "gasp");
      await sleepMs(900);
      ({ place, geo } = await read());
      if (geo.catX === null || geo.catY === null) return;
    }
    // a block of "window" cells, its top edge three rows above the cat's feet, four cells wide, starting four cells to the
    // right of the cat (or to its left near the right edge)
    const ledgeRow = Math.max(2, feetRow() - 3);
    const catCol = Math.floor(((geo.catX * place.scale - m.x) / m.w) * cols);
    const start = catCol + 8 < cols ? catCol + 4 : Math.max(0, catCol - 8);
    const cells: GroundKind[] = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push(c >= start && c < start + 4 && r >= ledgeRow ? "app" : "desktop");
    await perchNow({ x: m.x, y: m.y, w: m.w, h: m.h, cols, rows, cells }, true);
  }

  /** A walk starts only if the user has paused; otherwise the cat stays where it is and tries again later. */
  async function tryWalk(toEdge = false) {
    if (flying) return;
    const fo = await probeFocus();
    if (pose !== "idle") return; // something else took over while the probe was read
    if (!fo.walkAllowed || !mayAct(mode, 1, "own", quiet)) return scheduleNext(); // a walk is unhurried: not while the person is working
    const room = await seatRoom();
    if (pose !== "idle") return;
    if (!toEdge && room && Math.max(room.left, room.right) < SEAT_MIN_WALK) return void enter("look"); // at the end of a small seat: it only looks around
    walkSeatRoom = room;
    walkToEdge = toEdge;
    enter("walk");
  }

  function startWalk() {
    if (awayWalkActive) return runLeaveWalk();
    if (homeGoal) return runHomeWalk();
    const plan = walkPlan;
    walkPlan = null;
    const leaving = plan !== null; // walking away from the user's work
    const seatRoomNow = walkSeatRoom;
    const toEdgeNow = walkToEdge;
    walkSeatRoom = null;
    walkToEdge = false;
    dir = plan ? plan.dir : toEdgeNow && seatRoomNow ? (seatRoomNow.left < seatRoomNow.right ? -1 : 1) : seatRoomNow && seatRoomNow.left < SEAT_MIN_WALK ? 1 : seatRoomNow && seatRoomNow.right < SEAT_MIN_WALK ? -1 : Math.random() < 0.5 ? -1 : 1;
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
        // on a seat it never walks past the end of it: it stops at the edge (CH-2)
        if (perchSeat && ticks % 3 === 0) {
          const room = await seatRoom();
          if (pose !== "walk") return;
          if (room && (dir > 0 ? room.right : room.left) < 4) {
            if (leaving) settleAfterLeaving();
            const faced = dir;
            stopWalking();
            if (!leaving) void atEdge(faced);
            return;
          }
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
  async function fly(flights: Flight[], air: PetState, opts: { crouch?: boolean; settle?: boolean; keepDir?: boolean } = {}) {
    if (flying || flights.length === 0) return;
    flying = true;
    stopTimers();
    clearTimeout(oneShotTimer);
    try {
      const start = await invoke<{ x: number; y: number; scale: number }>("pet_place");
      if (flights[0].dx !== 0 && !opts.keepDir) dir = flights[0].dx > 0 ? 1 : -1;
      if (flights[0].kind === "hop" && opts.crouch !== false) {
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
    if (pose === air && opts.settle !== false) enter("land");
  }

  // ------------------------------------------------- the ground goes (PC-7, ADR-0041)
  const GROUND_POLL_MS = 1000; // while the cat stands: what is under its feet, asked once a second (3 points, a few ms)
  const FALL_MIN_PX = 60; // less room than this below: it only gasps
  let groundW = startGroundWatch();
  let gate = newGate(); // one reaction at a time, a budget for the ones Peak starts by itself (RX-8)
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
    if (quiet || away || panel !== null || flying || !mayReact(gate, EVENTS.ground_lost, now)) return;
    if (pose !== "idle" && pose !== "look" && pose !== "peek" && pose !== "ledge" && !isDozing(pose)) return; // a sleeping cat on a perch that goes is startled out of its sleep
    gate = startReaction(gate, EVENTS.ground_lost, now);
    await probeFocus(); // the mode at this moment decides whether it cries out
    const silent = silentReaction(mode);
    leavePerch();
    try {
      note("ground lost: startle");
      if (!(await runBeat(chooseBeat(EVENTS.ground_lost.appraisal), silent ? undefined : () => say("fall", { exclaim: true })))) return; // picked up or told to do something else meanwhile
      let down = 0;
      try {
        down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
      } catch {
        /* unknown: it only gasps */
      }
      // it falls to the plane below (a dialog, a window under it), not past it to the floor (ADR-0045)
      const plane = await planeBelow();
      const dist = plane !== null ? Math.min(plane, down) : down;
      note(`ground lost: room below ${down}, plane below ${plane === null ? "none" : plane}`);
      if (dist >= BRUISE_FALL_PX) bruisedUntil = Date.now() + BRUISE_MS; // wary for a while after a real fall
      if (dist >= FALL_MIN_PX) {
        await fly([planFall(dist)], "gasp");
        void adoptSeatHere(); // it may have landed on a ledge: then it knows its ends
      } else enter("idle"); // no room to fall: it has only startled
    } finally {
      gate = endReaction(gate, Date.now());
    }
    if (!silent) void remarkAfter("ground_lost"); // while the person works the fall is silent: no cry, no remark
  }

  /**
   * After a reflex, a connected brain may add one short remark (RX-7, ADR-0043). It is sent only the event name and the
   * five appraisal numbers (the card is in Rust), counts toward the daily cap of unprompted lines, needs the switch in
   * Settings, Brain, and never waits: the cry and the fall have already happened. Any problem is silent.
   */
  async function remarkAfter(id: EventId) {
    const t = Date.now();
    if (!canChat || !data.settings.remarks || quiet || aiGate(data, "proactive", t) !== "ok") return;
    data = recordAi(data, "proactive", t);
    scheduleSave();
    const ap = EVENTS[id].appraisal;
    const prompt = `Event: ${id}. How it feels to you: surprise ${ap.surprise.toFixed(2)}, valence ${ap.valence.toFixed(2)}, arousal ${ap.arousal.toFixed(2)}, about the user ${ap.aboutUser.toFixed(2)}, control ${ap.control.toFixed(2)}. Say your remark now.`;
    try {
      const out = await invoke<{ text: string; mood: string }>("brain_chat", {
        lang,
        tier: tierOf(data.closeness),
        gentle: data.settings.gentle,
        history: [{ role: "user" as const, text: prompt }],
        event: id,
      });
      // the cry is still on the screen: the remark waits for it to go (at most 6 s), it does not replace it
      for (let i = 0; i < 20 && bubbleOn; i++) await sleepMs(300);
      const fo = await probeFocus();
      if (quiet || panel !== null || bubbleOn || pose === "held" || isDozing(pose) || !fo.speakAllowed) {
        note(`remark not shown: ${fo.speakAllowed ? "busy" : "the user is active"}`);
        return;
      }
      note("remark shown");
      showBubble(clip(out.text, MAX_REMARK_CHARS), 5000);
    } catch (e) {
      const k = errKind(e);
      if (k === "invalid_key") brainBad = true;
      if (k === "rate_limit") data = coolDown(data, Date.now());
      scheduleSave();
    }
  }

  /**
   * A coarse picture of where windows are (PC-6, ADR-0043), only when the user switched it on in Settings, Privacy, and
   * only when the cat is about to move. Kept in memory (the last one), never saved or sent. Null when the switch is off.
   */
  let lastMap: GroundMap | null = null;
  async function takeGroundMap(): Promise<GroundMap | null> {
    if (!data.settings.groundMap) {
      lastMap = null;
      return null;
    }
    try {
      lastMap = await invoke<GroundMap>("ground_map");
      note(`ground map ${summary(lastMap)}, ${ledges(lastMap).length} ledges, desktop ${Math.round(desktopShare(lastMap) * 100)}%`);
    } catch {
      lastMap = null;
    }
    return lastMap;
  }

  /**
   * Events from Rust (PC-3): the user started or stopped working, a click happened (where it was stays in Rust and is read
   * with the probe), the monitors changed. Only the kind and a flag arrive. They are kept in the trail for the debugger;
   * a change of monitors drops what was believed about the old layout; the user starting to work probes at once instead
   * of waiting for the next poll.
   */
  function onPercept(p: { kind: string; on?: boolean; way?: string; power?: number }) {
    note(`percept ${p.kind}${p.on === undefined ? "" : p.on ? " on" : " off"}`);
    if (p.kind === "monitors") {
      groundW = startGroundWatch();
      lastMap = null;
    } else if (p.kind === "activity" && p.on) {
      void probeFocus();
    } else if (p.kind === "covered" && p.on) {
      void coverTick(); // told by Rust when the cat is under the Start menu or Search, and again every 3 s while it is
    } else if (p.kind === "flick" && (p.way === "left" || p.way === "right")) {
      // a strike on Peak seen by the fine sampler in Rust (ADR-0136; a Preview or developer build): the shove, in the way it was flicked
      const act = resolveGesture("flick", rightGates());
      lp(`flick way=${p.way} power=${p.power === 2 ? 2 : 1} act=${act ?? "refused"} pose=${pose}`);
      if (act === "shove") void shove(p.way === "right" ? -60 : 60); // the push goes away from the pointer: a flick to the right is a pointer on the left
    }
  }

  // What Peak believes about being in the way, and how sure it is (PC-1, spec/08); for the debugger and the trail for now
  let beliefState = startBelief();
  let lastBelief: Belief = { crowded: null, confidence: 0, userActive: false, ground: null };
  let lastGround: GroundKind | null = null;
  let laneReflexDone = false; // the cat has already shown it noticed the lane guess in this episode
  const currentBelief = () => ({ belief: lastBelief, response: responseFor(lastBelief) });

  /**
   * Something in front of the cat that it cannot be raised over (the Start menu, Search: windows of a higher layer than an
   * always-on-top one) hides it, and nothing in it noticed. Once a second, Rust is asked about five points of the cat's body
   * (and puts Peak back on top first, in case a window of its own layer simply came later). If it is still covered, the places
   * it could hop to are tried nearest first (`escape.ts`) by asking about their points too, and it hops to the first one that
   * is free: a window's rectangle says nothing here (the Start menu's window is the whole screen, only its flyout answers a
   * touch). Only "covered or not" is used.
   */
  let escaping = false;
  let lastEscape = 0;
  async function coverTick() {
    if (escaping || flying || panel !== null || Date.now() - lastEscape < 3000) return;
    if (!(pose === "idle" || pose === "look" || pose === "walk" || pose === "peek" || pose === "ledge" || isDozing(pose))) return;
    try {
      // Rust (the hit-test thread) found the cat covered and put Peak back on top without result: work out where to go
      const at = await catFeet();
      if (!at) return;
      const half = (PET_SIZE / 2) * at.scale;
      const cat = { x: at.feet.x - half, y: at.feet.y - PET_SIZE * at.scale, r: at.feet.x + half, b: at.feet.y };
      const here = bodyPoints(cat);
      const mons = await invoke<{ x: number; y: number; w: number; h: number; scale: number }[]>("monitors_info");
      const m = mons.find((k) => at.feet.x >= k.x && at.feet.x < k.x + k.w && at.feet.y >= k.y && at.feet.y <= k.y + k.h) ?? mons[0];
      if (!m) return;
      const places = escapePlaces(cat, { x: m.x, y: m.y, r: m.x + m.w, b: m.y + m.h }, at.scale);
      const probe = places.flatMap((p) => bodyPoints({ x: cat.x + p.dx * at.scale, y: cat.y + p.dy * at.scale, r: cat.r + p.dx * at.scale, b: cat.b + p.dy * at.scale }));
      const covered = await invoke<boolean[]>("cover_probe", { points: probe, raise: false });
      const per = here.length;
      const way = places.find((_, i) => !covered.slice(i * per, (i + 1) * per).some(Boolean));
      note(`covered: ${way ? `out by ${way.dx},${way.dy}` : "nowhere to go"}`);
      if (!way) return;
      escaping = true;
      lastEscape = Date.now();
      leavePerch();
      await fly(splitHop(way.dx, way.dy), "walk");
    } catch {
      /* the sense is not available: nothing happens */
    } finally {
      escaping = false;
    }
  }

  async function groundTick() {
    if (groundBusy) return;
    const standing = !flying && !quiet && panel === null && (pose === "idle" || pose === "look" || pose === "peek" || pose === "ledge" || isDozing(pose));
    if (!standing) {
      groundW = startGroundWatch(); // walking, held, asleep, speaking: it will find its footing again when it stands
      return;
    }
    groundBusy = true;
    try {
      const g = await invoke<{ id: number; foot: [number, number]; under: GroundKind }>("ground_under_cat");
      lastGround = g.under;
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
    if (away) return;
    if (pose === "walk") stopWalking();
    panel = p;
    resetMenuTimer();
  }
  function closePanel() {
    if (panel === "chat" && duoOn) void invoke("duo_bubble_to", { pet: "peak", ms: 0 }).catch(() => {}); // the bubble goes back to Peak
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
    pokeNormal(); // a left click is always a poke; the push is the right click
  }

  function pokeNormal() {
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
    if (duoOn) { void invoke("duo_open_box", { pet: "peak" }); return; } // ADR-0145: the chat box takes the keyboard, not the old input above Peak
    if (panel) return closePanel();
    engage(); // answering the pet's line by opening the chat (a typed message never counts)
    data = { ...data, brain: { ...data.brain, menuOpens: data.brain.menuOpens + 1 } };
    track("first_interaction");
    if (shouldAskBrain(data, Date.now(), hasKey)) showAsk();
    else openChat();
    scheduleSave();
  }

  function openChat() {
    lp("chat_open");
    playTouched();
    chatUser = "";
    chatSlow = false;
    chatDraft = false;
    if (canChat && pendingAlive(pendingDay, Date.now()) && pendingAsk) {
      // the chat box closed by itself while a question about a day was open: it is shown again, to be answered
      chatReply = pendingAsk;
      chatPhase = "reply";
    } else if (canChat) {
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
    lp(`pointer_down button=${e.button} pose=${pose}`);
    if (e.button !== 0) return;
    press = { x: e.screenX, y: e.screenY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  async function beginDrag() {
    lp(`carry_start pose=${pose}`);
    playTouched();
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
      if (!quiet) void afterDrop(); // let go in the air: it falls (CH-5)
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
    // E33: the speed of every pass of the pointer over Peak, as numbers, to calibrate the flick later (a test build writes it, nothing else reads it)
    {
      const ps = passStep(passState, { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
      passState = ps.state;
      const l = passLine(ps.done, r.width);
      if (l) lp(l);
    }
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
  let passState = newPass();
  function onPetLeave() {
    const pe = passEnd(passState);
    passState = pe.state;
    const pl = passLine(pe.done, 140);
    if (pl) lp(pl);
    gaze = null;
    scratch = { ...scratch, pts: [] };
  }
  function onHeadScratch() {
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

  // Right-click: no menu (the only menu is the tray's, ADR-0055). The right button is the two polite requests (ADR-0133, which amends ADR-0109):
  // one click is "step aside", two are "go back to your place". Peak starts to look at the pointer at once (the first click), so the wait of
  // RIGHT_DOUBLE_MS to tell one click from two overlaps the look and is not felt; then it walks aside, or, on a second click, goes to its place.
  // The shove (`shove`) has no gesture now: it waits for the flick, after a round that measures the speeds (`pass` lines of the loop trace).
  const rightGates = () => ({ held: pose === "held", quiet, flying, away, leaving, cooldownOk: Date.now() - lastShove >= 2500 });
  const rightClicks = clickResolver<number>(
    (dx) => {
      const act = resolveGesture("right_click", rightGates());
      lp(`right_click act=${act ?? "refused"} pose=${pose} panel=${panel === null ? 0 : 1}`);
      if (act === "step_aside" && panel === null) void startAside(dx);
      else if (pose === "notice") enter("look"); // refused: the look it began is over
    },
    (dx) => {
      const act = resolveGesture("right_double_click", rightGates());
      lp(`right_double act=${act ?? "refused"} pose=${pose} panel=${panel === null ? 0 : 1}`);
      if (act === "seat" && panel === null && startSeat("double_right_click")) return;
      if (pose === "notice") enter("look");
    },
    undefined,
    undefined,
    (dx) => {
      // the first click: it looks at the pointer at once (only when it is standing and may be asked)
      if (quiet || flying || away || leaving || pose === "held" || panel !== null) return;
      if (pose === "idle" || pose === "look") {
        attentionGaze = toGaze(dx, 0);
        enter("notice");
      }
    },
  );
  function onPetMenu(e: MouseEvent) {
    e.preventDefault();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    rightClicks.click(e.clientX - (r.left + r.width / 2));
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
  let ownVersion = "";
  async function autoCheckUpdate() {
    clearTimeout(updateRetry);
    if (data.settings.updates === "off") return;
    try {
      // The quiet check looks at Stable only, never at a Preview (ADR-0095); on a Preview copy Auto asks instead of installing.
      if (!ownVersion) ownVersion = await getVersion().catch(() => "");
      const mode = effectiveUpdateMode(data.settings.updates, channelOf(ownVersion));
      const info = await invoke<{ version: string } | null>("update_check", { scope: "background" });
      if (!info || !shouldOfferUpdate(data, info.version, Date.now())) return;
      const busyNow = await invoke<boolean>("is_busy").catch(() => false);
      if (quiet || busyNow || panel !== null || isNight(new Date().getHours())) {
        updateRetry = setTimeout(autoCheckUpdate, 10 * MIN); // not now; try again shortly
        return;
      }
      updateVersion = info.version;
      if (mode === "auto") {
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

  // ---------------------------------------------------------------- "Lượn đi" (spec 14, story S2, ADR-0086)
  // The person types a plain command to go away. Peak says one short goodbye, walks to the nearer side edge, leaves (Rust hides
  // its window and starts a timer) and comes back after AWAY_MINUTES at the edge it left by, stretching and saying nothing; or
  // at once when the person shows it from the tray. On every build (ADR-0100). Counted as `leave` and `callback`, apart from
  // Bond Days. Nothing here is saved: after a restart Peak is simply on screen.
  /** One step of the leaving into leave-trace.log (V-132): a fixed name and numbers, never the person's words. */
  /** One step of the perch attempts into perch-trace.log (ADR-0116): a fixed gate name and numbers. `lastPerchWhy` is shown on the terrain overlay. */
  let lastPerchWhy = "no attempt yet";
  /** One line of what the pointer reached and which gate answered, into loop-trace.log (E29): names and numbers only. */
  function lp(step: string) {
    void invoke("loop_trace", { step }).catch(() => {});
  }
  function pt(step: string) {
    lastPerchWhy = step.slice(0, 80);
    void invoke("perch_trace", { step }).catch(() => {});
  }
  function lt(step: string) {
    void invoke("leave_trace", { step }).catch(() => {});
  }

  function awayState() {
    return away;
  }
  let lastUserChatAt: number | null = null; // when the person last sent a chat message in this run (a conversation is going on if it was just now)
  let dismissState = freshDismissalState(); // dismissals typed in the middle of a conversation (ADR-0108); memory only

  /**
   * "Go back to your place": not a wish to be left alone (ADR-0108). Peak goes down to the floor if it is up on a window, walks to its usual
   * place (taught by "sit here", or the right end of the floor) and nods (ADR-0117). The typed command and the double right click (ADR-0133)
   * come here. False when a gate refuses it.
   */
  function startSeat(how: "command" | "double_right_click"): boolean {
    if (!gatesPass(SEAT_SKILL.gates, { quiet, held: pose === "held", flying, away, leaving })) return false;
    lt(`command_seat how=${how} pose=${pose}`);
    closePanel();
    void runSteps(SEAT_SKILL.steps, skillHost, () => true, lt).then((r) => {
      lt(`seat ${r}`);
      if (r === "failed" && !flying && pose !== "held") enter("nod"); // it could not walk there: it only nods, as before
    });
    return true;
  }

  // Prototype (branch only, developer flag): "gọi Paws ra", "Paws go in" are Peak's business, not a message to the model (ADR-0139).
  let duoOn: boolean | null = null;
  async function tryDuoFromChat(text: string): Promise<boolean> {
    await initDuo();
    if (!duoOn) return false;
    // "call me Vinh": what the pets call the person, understood on the device (ADR-0144); both pets use it
    const callMe = parseCallMe(text);
    if (callMe) { lt("command_call_me"); answerInput("callMe", callMe); return true; }
    const c = parseDuoCommand(text);
    if (!c) return false;
    const ok = await invoke<boolean>("duo_command", { target: c.target, act: c.act }).catch(() => false);
    lt(`command_duo target=${c.target} act=${c.act} ok=${ok}`);
    if (ok && c.act === "in") talk.tucked(c.target);
    void refreshPawsOut();
    if (ok && c.target === "paws") { closePanel(); enter("nod"); }
    return true; // recognised: no model call and no chat turn, even when it changed nothing
  }

  // The talk among the person, Peak and Paws (ADR-0141; branch only): one room log, the lines shown one at a time as a bubble beside the
  // speaker, the listener turning its head first, a nod for a pass. The words come from the model; who speaks, when, and what is dropped is the code's.
  let pawsOutNow = $state(false);
  let peakOutNow = $state(true);
  /** Who is out (ADR-0145: a message goes to every pet that is out). */
  async function refreshPawsOut() {
    if (!duoOn) { pawsOutNow = false; return; }
    const p = await invoke<{ peak: boolean; paws: boolean }>("duo_presence").catch(() => null);
    if (p) { peakOutNow = p.peak; pawsOutNow = p.paws; }
  }
  const outNow = () => ({ peak: peakOutNow, paws: pawsOutNow });
  async function initDuo() {
    if (duoOn === null) { duoOn = await invoke<boolean>("duo_enabled").catch(() => false); duoFake = duoOn && (await invoke<boolean>("duo_fake").catch(() => false)); }
  }
  let duoFake = false; // developer channel: canned replies instead of the model, so the talk can be checked without a key
  function fakeReply(pet: PetId, role: "first" | "second" | "relayed", said: string): string {
    if (role === "relayed") return pet === "paws" ? "[happy] The cushion is in perfect order, as asked." : "[neutral] Fine, as usual, since you ask.";
    if (pet === "peak") return "[neutral] Fine, as usual.";
    if (role === "first") return "[happy] Duty is done, and the cushion is in perfect order.";
    return said.includes("pass") ? "[pass]" : said.includes("aside") ? "[to:peak] Shall I fetch the ball?" : "[happy] Splendid, as always.";
  }
  let bubbleWho = $state<PetId | null>(null);
  let modelTyping = $state<PetId | null>(null); // the pet whose model call is running: the three dots of the chat box
  let boxTurns = $state<{ id: number; who: "person" | PetId; text: string; at: number }[]>([]); // the whole talk, for the chat box (ADR-0142)
  let talkLog = $state<{ who: "person" | PetId; text: string }[]>([]);
  const talk = new Conversation(
    {
      model: async (pet, view, role) => {
        if (duoFake) { await pause(400); return fakeReply(pet, role, [...view].reverse().find((t) => t.from === "person")?.text ?? ""); }
        data = recordAi(data, "chat", Date.now());
        const lastPerson = [...view].reverse().find((t) => t.from === "person");
        const both = !!lastPerson && lastPerson.to.length === 2;
        const out = await invoke<{ text: string }>("brain_chat", {
          lang,
          tier: pet === "peak" ? tierOf(data.closeness) : 0,
          gentle: data.settings.gentle,
          history: toHistory(view, pet),
          known: pet === "peak" ? knownFor(mem, lang) : undefined,
          followUser: true,
          clock: clockLine(new Date()),
          pet,
          duo: true,
          situation: situation(pet, role, both, undefined, mem.callMe, lang),
        }).catch((e) => {
          void invoke("duo_log", { line: `brain_failed ${pet} ${errKind(e)}` }).catch(() => {});
          if (errKind(e) === "rate_limit") data = coolDown(data, Date.now()); // as every other brain call: the second pet of a turn is then a gesture, not a second refused call (issue 4)
          throw e;
        });
        return out.text;
      },
      allow: () => duoFake || aiGate(data, "chat", Date.now(), 2) === "ok",
      quiet: () => quiet || away,
      sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
      beat: () => 600 + Math.random() * 600,
      now: () => Date.now(),
      writing: (p) => (modelTyping = p),
    },
    (l) => enqueueLine(l),
  );
  // The chat box: what it shows is pushed to its window whenever it changes; what is written in it comes back as an action.
  let lastBox = "";
  let lastBoxTurns = 0;
  function pushBox(force = false) {
    const v = $state.snapshot({ lang, callMe: mem.callMe, turns: boxTurns, typing: chatPhase === "thinking" ? "peak" : modelTyping, canChat: canChat || duoFake }) as BoxView;
    if (!duoOn) return;
    const s = JSON.stringify(v);
    if (!force && s === lastBox) return;
    lastBox = s;
    if (boxTurns.length > lastBoxTurns) void invoke("duo_box_ambient").catch(() => {}); // a message arrived: the ambient log shows it (no focus taken)
    lastBoxTurns = boxTurns.length;
    void emitTo("chatbox", "chatbox-view", v).catch(() => {});
  }
  $effect(() => pushBox());
  function onBoxAction(a: BoxAction) {
    if (a.type === "send") { void sendChat(a.text); return; }
    if (a.type === "name") { const n = cleanName(a.value); if (n) answerInput("callMe", n); return; } // `/name Vinh`
    if (a.type === "clear") {
      // "clear this chat": the talk is forgotten by the box and by the pets, and the lines waiting to be said are dropped
      cancelTalk();
      talk.room = newRoom();
      talk.lastSpoken = null;
      syncLog();
      return;
    }
    if (a.type === "command") {
      // a command of the slash list: bring a pet out or send it in, on the device, no model (the same as "call Paws out" typed)
      void (async () => {
        const ok = await invoke<boolean>("duo_command", { target: a.target, act: a.act }).catch(() => false);
        lt(`command_duo target=${a.target} act=${a.act} ok=${ok} from=box`);
        if (ok && a.act === "in") talk.tucked(a.target);
        await refreshPawsOut();
        if (ok && a.target === "paws") enter("nod");
      })();
    }
  }
  function syncLog() {
    talkLog = talk.room.turns.filter((t) => t.act === "say").slice(-6).map((t) => ({ who: t.from, text: t.text }));
    boxTurns = talk.room.turns.filter((t) => t.act === "say").map((t) => ({ id: t.id, who: t.from, text: t.text, at: t.at }));
  }
  let lineGen = 0;
  let lineChain: Promise<void> = Promise.resolve();
  const pause = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
  async function sayAs(pet: PetId, text: string) {
    void invoke("duo_log", { line: `shown ${pet} ${text.length}` }).catch(() => {});
    await invoke("duo_bubble_to", { pet, ms: 4000 + text.length * 60 + 1500 }).catch(() => {}); // the bubble stands beside the speaker
    showBubble(text);
    bubbleWho = pet;
  }
  function enqueueLine(l: Line) {
    syncLog();
    void invoke("duo_log", { line: `line ${l.pet} ${l.act} to=${l.to.join("+")} ${l.text}` }).catch(() => {});
    const g = lineGen;
    lineChain = lineChain
      .then(async () => {
        if (g !== lineGen) return;
        const other: PetId = l.pet === "peak" ? "paws" : "peak";
        if (l.act === "say") {
          void invoke("duo_face", { listener: other, speaker: l.pet }).catch(() => {});
          await pause(500);
          if (g !== lineGen) return;
          if (!presentable(l, quiet || away)) { void invoke("duo_log", { line: `quiet: a queued line of ${l.pet} is dropped` }).catch(() => {}); return; } // Quiet came while the line waited
          await sayAs(l.pet, clipReply(l.text, 160)); // the bubble shows the head of a long reply cut at the end of a sentence; the talk and the box keep the whole (ADR-0146)
          await pause(Math.min(9000, 1500 + l.text.length * 55)); // the time to read it, before the next speaker
        } else if (l.act === "turn") {
          void invoke("duo_face", { listener: l.pet, speaker: l.to[0] }).catch(() => {}); // it turns to the one it was asked to ask
          await pause(900);
        } else {
          if (l.pet === "peak") enter("nod");
          else await invoke("duo_nod", { pet: "paws" }).catch(() => {});
          await pause(700);
        }
      })
      .catch(() => {});
  }
  /** A touch, or the pet going in: the lines still waiting are thrown away and a line being written is dropped. */
  function cancelTalk() {
    lineGen++;
    talk.cancel();
  }
  function mirrorPeak(user: string, reply: string) {
    if (!duoOn) return;
    // the person's turn was put in the room when it was sent (sendChat); only the answer of Peak is added here
    talk.room = addTurn(talk.room, { from: "peak", to: ["person"], text: reply, at: Date.now(), act: "say" }).room;
    talk.lastSpoken = "peak";
    syncLog();
  }
  async function tryTalkFromChat(text: string): Promise<boolean> {
    if (!duoOn || !(canChat || duoFake)) return false;
    await refreshPawsOut();
    const out = outNow();
    const present = (["peak", "paws"] as PetId[]).filter((p) => out[p]);
    const rel = out.peak && out.paws ? parseRelay(text) : null; // "ask Paws ...": one pet turns to the other, which answers (ADR-0141, situation 8)
    if (rel) {
      busy = true;
      closePanel();
      void invoke("duo_scene_cancel").catch(() => {});
      lineGen++;
      try {
        await talk.relay(text, rel.via, rel.target, present);
      } catch (e) {
        lt(`talk_failed ${errKind(e)}`);
      } finally {
        busy = false;
      }
      return true;
    }
    const to = addressees(text, out); // every pet that is out, or the one the message names (ADR-0145)
    if (to.length === 0) return true; // nobody is out: nothing is sent
    if (to.length === 1 && to[0] === "peak") return false; // Peak alone: its own chat, as before
    // the daily limit or a cooldown: the pet says so in its own words and no call is made (it used to be a silent gesture, and the person saw nothing)
    const gate = duoFake ? "ok" : aiGate(data, "chat", Date.now(), 2);
    if (gate !== "ok") {
      const line = gate === "cap" ? ui.capHit[Math.floor(Math.random() * ui.capHit.length)] : ui.err.rate_limit;
      talk.notePerson(text, to);
      talk.room = addTurn(talk.room, { from: to[0], to: ["person"], text: line, at: Date.now(), act: "say" }).room;
      syncLog();
      lineGen++;
      await sayAs(to[0], line);
      return true;
    }
    busy = true;
    closePanel();
    void invoke("duo_scene_cancel").catch(() => {});
    lineGen++; // a new message drops the lines still waiting from the one before
    try {
      await talk.person(text, to, present);
    } catch (e) {
      lt(`talk_failed ${errKind(e)}`);
    } finally {
      busy = false;
    }
    return true;
  }

  async function tryLeaveFromChat(text: string): Promise<boolean> {
    const m = matchIntent(text, []);
    if (m?.skill === "seat" && m.kind === "exact") return startSeat("command");
    if (m?.skill === "seat_here" && m.kind === "exact") {
      // "sit here from now on": the place where Peak stands along the floor becomes its usual place (ADR-0117)
      if (!gatesPass(SEAT_HERE_SKILL.gates, { quiet, held: pose === "held", flying, away, leaving })) return false;
      lt(`command_seat_here pose=${pose}`);
      closePanel();
      void runSteps(SEAT_HERE_SKILL.steps, skillHost, () => true, lt);
      return true;
    }
    if (m?.skill === "aside" && m.kind === "exact") {
      // "step aside": get out of the way of the cursor, calmly; never a way to make it leave (ADR-0111)
      if (!gatesPass(ASIDE_SKILL.gates, { quiet, held: pose === "held", flying, away, leaving })) return false;
      lt(`command_aside pose=${pose}`);
      closePanel();
      void startAside(null);
      return true;
    }
    if (!isLeaveCommand(text, [])) return false; // "peak" may stand around the command
    if (!mayLeave({ quiet, held: pose === "held", flying, away, leaving })) {
      lt(`command_refused quiet=${quiet} held=${pose === "held"} flying=${flying} away=${away} leaving=${leaving}`);
      return false;
    }
    // In the middle of a conversation "lượn đi" is a joke, not an order: it goes to the chat unless it is said again and again (ADR-0108).
    const now = Date.now();
    const decision = decideDismissal(now, lastUserChatAt, dismissState);
    dismissState = decision.state;
    lt(`dismissal ${decision.action} talking=${inConversation(now, lastUserChatAt)} said=${decision.state.times.length}`);
    if (decision.action === "chat") return false;
    lt(`command_table pose=${pose}`);
    void startLeave();
    return true;
  }

  let leaveRoom = 0; // logical px from Peak to the edge it walks to
  let walkDone: ((reached: boolean) => void) | null = null; // the walk_to_edge step waits for this
  function settleWalk(reached: boolean) {
    const r = walkDone;
    walkDone = null;
    r?.(reached);
  }

  /** What the six verbs of a skill file do on this page (ADR-0103). Nothing else can be asked of the page by a skill. */
  const skillHost: Host = {
    say(poolName, ms) {
      const pools = LEAVE_SKILL.pools[poolName] as Record<string, string[]>;
      const line = pickFromPool(pools[lang] ?? pools.en, lastFarewell);
      lastFarewell = line;
      showBubble(line, ms);
      lt(`bubble on=${bubbleOn} len=${line.length}`);
    },
    pose(p) {
      enter(p as PetState);
    },
    wait: (ms) => new Promise((r) => setTimeout(r, ms)),
    async walkToEdge() {
      let roomLeft = 0;
      let roomRight = 0;
      try {
        roomLeft = await invoke<number>("edge_room", { dir: -1 });
        roomRight = await invoke<number>("edge_room", { dir: 1 });
      } catch {
        /* unknown: it walks right */
      }
      if (!leaving) return false;
      dir = nearerEdge(roomLeft, roomRight);
      leaveRoom = dir < 0 ? roomLeft : roomRight;
      lt(`walk_start left=${Math.round(roomLeft)} right=${Math.round(roomRight)} dir=${dir} deadline=${leaveDeadlineMs(leaveRoom)}`);
      return new Promise<boolean>((resolve) => {
        walkDone = resolve;
        awayWalkActive = true;
        enter("walk"); // startWalk sees awayWalkActive and runs the walk to the edge
      });
    },
    async stepAside() {
      // Away from the pointer (the side the click was on, or where the pointer is); a sleeper wakes first. No room: it nods and stays.
      if (isDozing(pose)) enter("idle");
      const now = Date.now();
      let way: 1 | -1 | null = null;
      const from = asideDx ?? lastPointer?.dx ?? null;
      if (from !== null && Math.abs(from) > 2) way = from > 0 ? -1 : 1;
      let roomL = 0;
      let roomR = 0;
      try {
        roomL = await invoke<number>("edge_room", { dir: -1 });
        roomR = await invoke<number>("edge_room", { dir: 1 });
      } catch {
        /* unknown: nods */
      }
      if (way === null) way = roomL > roomR ? -1 : 1;
      const room = way < 0 ? roomL : roomR;
      lt(`aside way=${way} room=${Math.round(room)} pose=${pose}`);
      if (pose !== "idle" && pose !== "look" && pose !== "notice") return false; // something else happened while asking (a look at the pointer is the beat of a right click, ADR-0133)
      lastShove = now; // the cooldown is shared with the push
      if (await clearAside(way, from)) return true; // with the picture on: to the nearest clear place beyond the pointer
      if (room < LEAVE_MIN_ROOM_PX) {
        enter("nod");
        return false;
      }
      walkPlan = { dir: way };
      enter("walk"); // the walk ends when the pointer is clear (LEAVE_PX), as when it makes way
      return true;
    },
    async walkHome() {
      // Down to the floor if it is up on a window, then along the floor to its usual place (ADR-0117).
      if (isDozing(pose)) enter("idle");
      if (flying) return false;
      if (perchWall) await descend();
      else {
        leavePerch();
        let down = 0;
        try {
          down = (await invoke<{ up: number; down: number }>("vertical_room")).down;
        } catch {
          /* unknown: it walks where it is */
        }
        if (down >= 30) await fly(splitHop(0, down), "walk");
      }
      if (pose !== "idle" && pose !== "look") enter("idle");
      let roomL = 0;
      let roomR = 0;
      try {
        roomL = await invoke<number>("edge_room", { dir: -1 });
        roomR = await invoke<number>("edge_room", { dir: 1 });
      } catch {
        /* unknown: it does not walk */
      }
      const go = seatMove(roomL, roomR, mem.seat);
      lt(`home from=${Math.round((seatFraction(roomL, roomR) ?? -1) * 100)} to=${Math.round((mem.seat ?? -1) * 100)} px=${go ? Math.round(go.px) : 0}`);
      if (!go) return true; // there already, or no room to tell
      dir = go.dir;
      const scale = window.devicePixelRatio || 1;
      return new Promise<boolean>((resolve) => {
        homeGoal = { px: go.px * scale, ms: seatWalkMs(go.px, LEAVE_PACE_PX_S), done: resolve };
        enter("walk"); // startWalk sees homeGoal and runs the walk to the place
      });
    },
    async saveSeat() {
      let roomL = 0;
      let roomR = 0;
      try {
        roomL = await invoke<number>("edge_room", { dir: -1 });
        roomR = await invoke<number>("edge_room", { dir: 1 });
      } catch {
        /* unknown */
      }
      const f = seatFraction(roomL, roomR);
      lt(`seat_saved at=${f === null ? -1 : Math.round(f * 100)}`);
      if (f === null) return false;
      mem = { ...mem, seat: f };
      scheduleSave();
      pushSettings();
      return true;
    },
    async hide(minutes) {
      if (!leaving || away) return false;
      clearInterval(walkTimer);
      clearTimeout(walkEndTimer);
      leaving = false;
      awayWalkActive = false;
      away = true; // from here nothing moves or speaks (scheduleNext, showBubble and the proactive line look at it)
      enter("idle");
      const left = await invoke<boolean>("pet_leave", { minutes }).catch(() => false);
      lt(`pet_leave left=${left}`);
      if (!left) {
        away = false; // the window could not be hidden: Peak simply stays
        scheduleNext();
      }
      return left;
    },
    count(key) {
      count(key as Parameters<typeof count>[0]); // counted when it has really gone: the skill file puts this step after the hide
    },
  };

  let asideDx: number | null = null; // the pointer from the cat's middle when step aside was asked with the mouse; null when typed
  async function startAside(dx: number | null) {
    asideDx = dx;
    if (!data.said.hintaside) {
      data = { ...data, said: { ...data.said, hintaside: Date.now() } }; // it knows the words: no hint needed
      scheduleSave();
    }
    lt(`aside_start pose=${pose}`);
    const result = await runSteps(ASIDE_SKILL.steps, skillHost, () => true, lt);
    lt(`aside ${result}`);
    asideDx = null;
  }

  async function startLeave() {
    pendingDay = null; // a question about a day does not wait through a leaving
    leaving = true;
    lt(`start pose=${pose} away=${away}`);
    closePanel(); // the chat box goes
    const result = await runSteps(LEAVE_SKILL.steps, skillHost, () => leaving || away, lt);
    lt(`run ${result}`);
    if (leaving) {
      // nothing is left half done
      leaving = false;
      awayWalkActive = false;
    }
  }

  /** The walk to its usual place: straight along the floor at the trot, until the distance is covered, the edge is reached or the time is up. */
  function runHomeWalk() {
    const g = homeGoal;
    if (!g) return;
    const scale = window.devicePixelRatio || 1;
    const fullStep = (LEAVE_PACE_PX_S * scale * WALK_TICK_MS) / 1000;
    let ticks = 0;
    let carry = 0;
    let moved = 0;
    const finish = (ok: boolean) => {
      clearInterval(walkTimer);
      clearTimeout(walkEndTimer);
      if (homeGoal === g) homeGoal = null; // before enter(): enter() would otherwise report the walk as broken off
      lt(`home_walk ${ok ? "arrived" : "stopped"} moved=${Math.round(moved)} of=${Math.round(g.px)}`);
      enter("idle");
      g.done(ok);
    };
    walkTimer = setInterval(async () => {
      try {
        ticks++;
        const s = takeSteps(carry, Math.min(fullStep * rampIn(ticks * WALK_TICK_MS), g.px - moved));
        carry = s.carry;
        if (s.move === 0) {
          if (g.px - moved < 1) finish(true);
          return;
        }
        const hitEdge = await invoke<boolean>("move_by", { dx: dir * s.move });
        moved += s.move;
        if (hitEdge || moved >= g.px - 0.5) finish(true);
      } catch {
        finish(false);
      }
    }, WALK_TICK_MS);
    walkEndTimer = setTimeout(() => finish(false), g.ms);
  }

  /** The walk to the edge: straight on, at the trot, until the window cannot go further (or the time is up). */
  function runLeaveWalk() {
    const scale = window.devicePixelRatio || 1;
    const fullStep = (LEAVE_PACE_PX_S * scale * WALK_TICK_MS) / 1000;
    let ticks = 0;
    let carry = 0;
    walkTimer = setInterval(async () => {
      try {
        ticks++;
        const s = takeSteps(carry, fullStep * rampIn(ticks * WALK_TICK_MS));
        carry = s.carry;
        if (s.move === 0) return;
        const hitEdge = await invoke<boolean>("move_by", { dx: dir * s.move });
        if (ticks === 1 || ticks % 100 === 0) lt(`walk_tick n=${ticks} hit=${hitEdge}`);
        if (hitEdge) {
          clearInterval(walkTimer);
          clearTimeout(walkEndTimer);
          settleWalk(true);
        }
      } catch {
        lt("walk_error");
        giveUpLeave();
      }
    }, WALK_TICK_MS);
    // It leaves only at the edge. If the time given for the distance runs out first, it stays (ADR-0102): never a vanishing in the middle of the screen.
    walkEndTimer = setTimeout(() => giveUpLeave(), leaveDeadlineMs(leaveRoom));
  }

  /** The edge was not reached in time (blocked, carried, the screens changed): Peak stays where it is and the leaving is cancelled. */
  function giveUpLeave() {
    if (!leaving) return;
    lt("gave_up_edge_not_reached");
    clearInterval(walkTimer);
    clearTimeout(walkEndTimer);
    leaving = false;
    awayWalkActive = false;
    enter("idle");
    settleWalk(false);
  }

  /** The timer ran out. Peak comes back unless the person is in something full-screen or presenting; then it asks again later. */
  async function onAwayDue() {
    if (!away) return;
    const busyNow = await invoke<boolean>("is_busy").catch(() => false);
    if (busyNow) {
      await invoke("pet_away_retry", { secs: RETRY_SECS }).catch(() => {});
      return;
    }
    const back = await invoke<boolean>("pet_return").catch(() => false);
    if (back) endAway(false);
  }

  /** Peak is back (the timer, or the person showed it): a stretch, no line. */
  function endAway(byPerson: boolean) {
    if (!away) return;
    away = false;
    leaving = false;
    awayWalkActive = false;
    if (byPerson) count("callback");
    void runSteps(LEAVE_SKILL.after_return, skillHost, () => true); // a stretch (the skill file says so), no line
    setTimeout(() => void keptTick(), 8_000); // a day that came by while Peak was away is said once, now that it is back
  }

  // ------------------------------------------------------- kept days (ADR-0106, ADR-0115)
  let pendingAsk = ""; // the words of the open question, shown again if the chat box was closed and is opened before it is answered
  const declinedDays = new Set<string>(); // days the person said no to in this run (year-month-day): the model is not allowed to offer them again
  let pendingTries = 0; // short replies to the open question that were answered with "say it again"
  let pendingDay: Pending | null = null; // a day waiting for the person's yes or no; memory only, gone after five minutes
  let lastRemindLine: string | null = null;
  function remindLine(kind: RemindLine, v: { label?: string; date?: string }): string {
    const l = remindSay(kind, lang, v, lastRemindLine);
    lastRemindLine = l;
    return l;
  }

  /** The answer to the question about a day. True when the message was that answer (and so is not sent to the model). */
  function answerDay(text: string): boolean {
    const now = Date.now();
    const p = pendingDay;
    if (!pendingAlive(p, now)) {
      pendingDay = null;
      return false;
    }
    const kind = replyKind(text);
    // With a brain, a reply the table does not know is read by the model, which knows the whole talk and can tell a yes, a no or a
    // corrected day; the open question goes with the message for this one turn (ADR-0115 addendum). Without a brain the table decides.
    if (kind !== "yes" && kind !== "no" && canChat && aiGate(data, "chat", now, duoOn ? 2 : 1) === "ok") return false;
    if (kind === "short" && pendingTries < MAX_CLARIFY) {
      // a few words that are neither yes nor no ("uh"): the model does not know there is a question and would ask it again, so Peak says
      // how to answer, keeps the question, and does not send the words on
      pendingTries++;
      lt("remind_clarify");
      showLocalReply(text, remindLine("clarify", {}));
      return true;
    }
    pendingDay = null; // answered, or something else was said: the question is over either way
    if (kind !== "yes" && kind !== "no") return false;
    showLocalReply(text, settleDay(p, kind, now));
    return true;
  }

  /** Keep the day or leave it, and say so: the one place where a yes or a no (the table's or the model's) takes effect. */
  function settleDay(p: Pending, a: "yes" | "no", now: number): string {
    let line: string;
    if (a === "no") {
      declinedDays.add(`${p.year}-${p.md}`);
      line = remindLine("dropped", {});
    }
    else {
      const r = addKept(mem.keptDays, p, now, `d${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`);
      if (r.result === "added") {
        let list = r.list;
        const last = list[list.length - 1];
        if (fallsOn(last, new Date(now))) list = markDone(list, [last.id], now); // told on the day itself: no cheer right after the telling
        mem = { ...mem, keptDays: list };
        scheduleSave();
        line = remindLine("kept", { date: describeDate(p.md, p.year, lang), label: p.label });
        setTimeout(() => void maybeRemember(true), 800); // what was said around the day ("my second daughter") is looked at now, not after four more messages
      } else line = remindLine(r.result === "same" ? "same" : "full", {});
    }
    lt(`remind_answer ${a}`);
    return line;
  }

  /** Peak's own answer in the chat box, without the model. */
  function showLocalReply(text: string, line: string) {
    chatUser = text;
    chatReply = line;
    chatPhase = "reply";
    replyMood = "neutral";
    history = [...history, { role: "user" as const, text }, { role: "model" as const, text: line }].slice(-8);
    resetMenuTimer();
  }

  /**
   * Once a minute: say a kept day on its day, or a missed one when Peak is back, one at a time, once each, in a free moment
   * (not Quiet, not away, nothing open, not asleep, the person not at work, no full-screen program). Nothing is counted aloud.
   */
  let keptBusy = false;
  async function keptTick() {
    if (keptBusy) return;
    keptBusy = true;
    try {
      const now = Date.now();
      const today = dayKey(now);
      const list = pruneOneOff(mem.keptDays, now);
      if (list.length !== mem.keptDays.length) {
        mem = { ...mem, keptDays: list };
        scheduleSave();
      }
      const due = dueToday(list, now);
      const pick = due[0] ?? missedSince(list, mem.keptCheck, now)[0];
      if (!pick) {
        if (mem.keptCheck !== today) {
          mem = { ...mem, keptCheck: today };
          scheduleSave();
        }
        return;
      }
      const free = () => !(quiet || away || leaving || flying || pose === "held" || panel !== null || bubbleOn || busy || isDozing(pose));
      if (!free()) return;
      const fo = await probeFocus();
      if (!fo.speakAllowed || !free()) return;
      const kind: RemindLine = due.includes(pick) ? "today" : "missed";
      enter(moodBeat("happy", data.settings.gentle).steps[0].pose);
      showBubble(remindLine(kind, { label: pick.label }), 7000);
      mem = { ...mem, keptDays: markDone(mem.keptDays, [pick.id], now) };
      scheduleSave();
      lt(`remind_said ${kind}`);
    } finally {
      keptBusy = false;
    }
  }

  async function sendChat(raw: string) {
    const text = raw.trim();
    if (!text) return;
    if (duoOn) {
      // the message is in the talk at once, so that the chat box shows it before any pet answers (ADR-0142)
      await refreshPawsOut();
      const out = outNow();
      // with both pets in only a local command goes on; anything else is not sent (ADR-0145)
      if (!out.peak && !out.paws && !parseDuoCommand(text) && !parseCallMe(text)) return;
      const rel = out.peak && out.paws ? parseRelay(text) : null;
      talk.notePerson(text, rel ? [rel.via, rel.target] : addressees(text, out).length > 0 ? addressees(text, out) : ["peak"]);
      syncLog();
    }
    // A plain command to go away is Peak's own business, not a message to the model: no key, no chat turn counted (spec 14, A5).
    if (!busy && (await tryDuoFromChat(text))) return;
    if (!busy && (await tryTalkFromChat(text))) return;
    if (!busy && (await tryLeaveFromChat(text))) return;
    // A yes or a no to the question about a day is Peak's business too (ADR-0115): no model call, no chat turn counted.
    if (!busy && answerDay(text)) return;
    if (busy || !canChat) return;
    const gate = aiGate(data, "chat", Date.now(), duoOn ? 2 : 1); // the duo prototype counts two calls for a message to both, so its limit is twice as high (ADR-0152)
    void invoke("chat_trace", { step: `chat gate=${gate} chars=${text.length} day=${data.ai.chat}` }).catch(() => {});
    if (gate !== "ok") {
      chatUser = text;
      chatReply = gate === "cap" ? ui.capHit[Math.floor(Math.random() * ui.capHit.length)] : ui.err.rate_limit;
      chatPhase = "reply";
      if (duoOn) { mirrorPeak(text, chatReply); void sayAs("peak", chatReply); } // the old chat bubble is not shown with the box: Peak says so in the box and above itself, not nothing
      resetMenuTimer();
      return;
    }
    data = recordAi(data, "chat", Date.now());
    const talking = inConversation(Date.now(), lastUserChatAt); // a conversation was already going on: the model is not offered the skill (ADR-0108)
    lastUserChatAt = Date.now();
    count("chat"); // a message that passed the usage gate and goes to the model
    busy = true;
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
    const openNow = Date.now();
    const asked = pendingAlive(pendingDay, openNow) ? pendingDay : null; // the question the model is told is open, for this turn only
    let leftByModel = false; // the model named the skill and Peak is leaving: no chat answer is shown
    try {
      // The model may name a skill (S4, spec 14), but not while Quiet or away.
      const out = await invoke<{ text: string; mood: string; skill?: string; skillArgs?: string }>("brain_chat", {
        lang,
        tier: tierOf(data.closeness),
        gentle: data.settings.gentle,
        history,
        known: knownFor(mem, lang),
        keptDays: mem.aiLearn ? keptForModel(mem.keptDays, lang) : undefined, // so Peak can answer about the days it keeps (the same switch as the notes)
        followUser: true, // answer in the language the user writes in
        skills: !quiet && !away && !leaving && !talking,
        openDay: asked ? `${describeDate(asked.md, asked.year, lang)}: ${asked.label}` : undefined,
        remind: !away && !leaving, // a day told in a chat is told in a chat, so the model is offered this one in a conversation too (ADR-0115)
        banter: talking, // in a conversation a "go away" is a tease: stay and answer in kind (ADR-0108)
        clock: clockLine(new Date()), // the local time, the weekday and the part of the day, so the model does not guess them (ADR-0105)
        situation: duoOn && pawsOutNow ? situation("peak", "first", false, undefined, mem.callMe, lang) : undefined, // Paws is out: Peak knows it is its housemate, not a name it never heard (duo prototype)
      });
      // The model's own word is checked again here: the name is on the closed list, the message is short and not a question,
      // and the same gates as for the table (Preview, not Quiet, not carried, not in the air). Its words are not shown: Peak says
      // one of its own goodbyes (ADR-0097).
      if (out.skill) lt(`model_skill=${out.skill} short=${shortEnoughForSkill(text)} flying=${flying} quiet=${quiet}`);
      if (out.skill === "leave" && shortEnoughForSkill(text) && mayLeave({ quiet, held: pose === "held", flying, away, leaving })) {
        leftByModel = true;
        history = history.slice(0, -1); // the command is not part of the talk
        void startLeave();
        return;
      }
      let reply = clip(out.text);
      if (out.skill === "remind") {
        // The model named a day. Its form is checked here; Peak asks in its own words and keeps nothing until the person says yes.
        const p = parseRemindArgs(out.skillArgs);
        const answer = parseRemindAnswer(out.skillArgs);
        lt(`model_remind valid=${p !== null} answer=${answer ?? "none"} open=${asked !== null}`);
        if (answer && asked) {
          // the model read the reply as a yes or a no to the open question; Peak says the rest itself
          if (pendingDay === asked) pendingDay = null;
          reply = settleDay(asked, answer, Date.now());
        } else if (answer) {
          reply = remindLine("stale", {}); // a yes or a no with no question open: nothing is kept, and Peak says so
        } else if (p && hasKept(mem.keptDays, p)) {
          reply = remindLine("same", {}); // already kept: the model naming it again is not asked about again
        } else if (p && declinedDays.has(`${p.year}-${p.md}`)) {
          // the person said no to this day in this run: it is not offered again; the model's own words stay
        } else if (p) {
          pendingDay = { ...p, t: Date.now() };
          pendingTries = 0;
          reply = remindLine("ask", { date: describeDate(p.md, p.year, lang), label: p.label });
          if (p.more) reply += " " + remindLine("later", {}); // several days in one message: one at a time
          pendingAsk = reply;
        } else {
          reply = remindLine("baddate", {}); // the tag was not a day: Peak does not repeat the model's words, which may say it is kept
        }
      }
      if (asked && pendingDay === asked) pendingDay = null; // the model had its one turn with the question; it is not kept open for a stray "uh" later
      replyMood = out.mood;
      // the model gets its own whole words back, not the cut ones, unless Peak said something else in their place
      history = [...history, { role: "model" as const, text: reply === clip(out.text) ? nfc(out.text) : reply }].slice(-8);
      chatReply = reply;
      mirrorPeak(text, reply);
      if (duoOn && panel !== "chat") void sayAs("peak", reply); // the chat box is not the bubble: Peak's answer is said above Peak
      void maybeRemember();
    } catch (e) {
      const k = errKind(e);
      history = history.slice(0, -1); // drop the unanswered user turn
      if (k === "invalid_key") brainBad = true;
      if (k === "rate_limit") data = coolDown(data, Date.now());
      chatReply = ui.err[k];
      if (duoOn && panel !== "chat") showBubble(ui.err[k]);
      replyMood = "none";
    } finally {
      clearTimeout(slowTimer);
      chatSlow = false;
      busy = false;
      if (leftByModel) return; // startLeave closed the chat box and is saying its goodbye
      chatPhase = "reply";
      // If the chat was closed while waiting, still deliver the answer as a plain bubble.
      if (panel !== "chat") showBubble(chatReply, 5000);
      // act out the answer's feeling (a plain nod when there is none; nothing special after an error)
      enter(replyMood === "none" ? "idle" : moodBeat(replyMood, data.settings.gentle).steps[0].pose);
      resetMenuTimer();
      scheduleSave();
    }
  }

  // Every few chat messages, a small background call picks lasting facts out of the chat. Silent on
  // any problem. The first time, a short note says what is stored and where it goes.
  let remembering = false;
  async function maybeRemember(force = false) {
    // forced: right after a day was kept, so that what was said around it is noted now (only if the person lets Peak learn)
    const c = force ? { memory: mem, due: mem.learn && mem.aiLearn } : countChat(mem);
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
      case "tour-lang":
        // the picker on the first card of the tour: an explicit choice, kept like the one in Settings (ADR-0065)
        if (panel !== "tour") break;
        setSetting("lang", a.value);
        pushSettings();
        resetMenuTimer();
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
    if (key === "screenPicture") syncPicture();
    scheduleSave();
  }

  function memoryView(): MemoryView {
    return {
      learn: mem.learn,
      petName: mem.petName,
      callMe: mem.callMe,
      days: mem.days,
      sessions: mem.sessions,
      usualPart: usualPart(mem),
      touches: { ...mem.touches },
      marks: mem.marks.map((m) => m.id),
      aiLearn: mem.aiLearn,
      facts: mem.facts.map((f) => ({ id: f.id, text: f.text })),
      seat: mem.seat,
      keptDays: mem.keptDays.map((k) => ({ id: k.id, md: k.md, year: k.year, label: k.label })),
    };
  }

  function onMemPatch(p: Extract<SettingsPatch, { type: "mem" }>) {
    if (p.action === "set") mem = setName(mem, p.field, p.value);
    else if (p.action === "learn") mem = { ...mem, learn: p.value };
    else if (p.action === "ai") mem = { ...mem, aiLearn: p.value, sinceExtract: 0 };
    else if (p.action === "fact-set") mem = setFact(mem, p.id, p.value);
    else if (p.action === "fact-del") mem = removeFact(mem, p.id);
    else if (p.action === "seat-del") mem = forgetSeat(mem);
    else if (p.action === "kept-del") mem = { ...mem, keptDays: mem.keptDays.filter((k) => k.id !== p.id) };
    else if (p.action === "forget-kept") {
      mem = forgetKept(mem);
      pendingDay = null;
    }
    else if (p.action === "forget-facts") mem = forgetFacts(mem);
    else if (p.action === "forget-habits") mem = forgetHabits(mem);
    else {
      mem = forgetAll(mem);
      pendingDay = null;
    }
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
      keys: { gemini: providerInfo.gemini, claude: providerInfo.claude, openai: providerInfo.openai },
      usage: {
        chat: data.ai.day === dayKey(Date.now()) ? data.ai.chat : 0,
        chatCap: AI_CHAT_DAILY_CAP * (duoOn ? 2 : 1),
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
              config: { gentle: data.settings.gentle },
            }
          : { installId: "", events: [], days: [], config: { gentle: false } },
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
      showBubble(`${clip(c.reply, MAX_TEST_CHARS)}\n· ${c.model}`, 6000);
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
    if (data.hush) return; // chose Quiet at the retired setting: it says nothing unprompted
    proactiveTimer = setTimeout(() => fireProactive(), rand(10, 15) * MIN); // fixed; whether it may speak now is the attention mode and the night
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
      away ||
      busyNow ||
      isNight(hour) ||
      pose === "held" ||
      isDozing(pose) ||
      panel !== null ||
      bubbleOn ||
      !mayChatter(mode);
    if (blocked || !fo.speakAllowed) {
      proactiveTimer = setTimeout(() => fireProactive(), blocked ? 2 * MIN : FOCUS_RETRY_MS);
      return;
    }
    const t = Date.now();
    // Questions first (a typed answer, never a guess), then a shared milestone.
    const ageDays = Math.floor((t - data.firstSeen) / DAY_MS);
    for (const [f, field] of duoOn ? [] : ([["callMe", "callMe"]] as const)) { // the pet is no longer named by the person (ADR-0143); with the chat box the name is set there, not asked by a pop-up (ADR-0144)
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
    const mood = bandOf(data, hour);
    const prompt =
      lang === "vi"
        ? `${clockPhrase(lang, hour)} Tâm trạng của bạn: ${mood}. Tình huống: ${trigger}. Hãy tự nói một câu ngắn với mình, không cần mình trả lời.`
        : lang === "ja"
          ? `${clockPhrase(lang, hour)}きみの気分：${mood}。状況：${trigger}。自分から短くひとこと話しかけてね。返事はいらないよ。`
          : `${clockPhrase(lang, hour)} Your mood: ${mood}. Situation: ${trigger}. Say one short thing to me unprompted; no reply needed.`;
    try {
      const out = await invoke<{ text: string; mood: string }>("brain_chat", {
        lang,
        tier: tierOf(data.closeness),
        gentle: data.settings.gentle,
        history: [{ role: "user" as const, text: prompt }],
      });
      const reply = clip(out.text, MAX_REMARK_CHARS);
      const fo = await probeFocus(); // the user may have started typing while the model was answering
      if (quiet || panel !== null || bubbleOn || pose === "held" || isDozing(pose) || !fo.speakAllowed) return false;
      enter(moodBeat(out.mood, data.settings.gentle).steps[0].pose);
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
        log: talkLog.length > 0 ? talkLog : undefined,
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
        langs: tourStep === 0 ? LANG_CHOICES.map((c) => ({ ...c, on: c.value === lang })) : undefined,
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
    if (bubbleOn) return { kind: "say", text: bubbleText, exclaim: bubbleExclaim, who: bubbleWho ?? undefined };
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
          if (quiet && duoOn) { void invoke("duo_log", { line: "quiet: the talk is cancelled" }).catch(() => {}); cancelTalk(); } // a call that is pending or a line that waits in the queue must not speak in Quiet (issue 4), as a touch drops them
          if (quiet) {
            bubbleOn = false;
            closePanel();
          }
          enter(quiet ? "drowsy" : "idle"); // drifts off, or wakes up with a stretch
        })
      );
      cleanups.push(await win.listen<BubbleAction>("bubble-action", (e) => onBubbleAction(e.payload)));
      cleanups.push(await win.listen<boolean>("focus-hint", (e) => onFocusHint(e.payload)));
      cleanups.push(
        await win.listen<boolean>("overlay-toggle", (e) => {
          clearInterval(overlayTimer);
          overlayTimer = e.payload ? setInterval(feedOverlay, 800) : undefined;
          if (e.payload) setTimeout(feedOverlay, 600);
        }),
      );
      cleanups.push(await win.listen<boolean>("picture-toggle", (e) => { pictureTray = e.payload; syncPicture(); }));
      cleanups.push(await win.listen<{ kind: string; on?: boolean }>("percept", (e) => onPercept(e.payload)));
      cleanups.push(await win.listen("bubble-ready", resendView));
      cleanups.push(await win.listen("settings-ready", pushSettings));
      cleanups.push(await win.listen("away-due", () => void onAwayDue()));
      cleanups.push(await win.listen("away-ended", () => endAway(true)));
      // exp/duo-prototype (ADR-0139): a duo scene holds Peak's own wandering and shows the pose the scene gives (the director is in the page of Paws)
      cleanups.push(await win.listen<{ pose: PetState; dir: 1 | -1; hold: boolean }>("duo-scene-pose", (e) => {
        sceneHold = e.payload.hold;
        if (e.payload.hold) { dir = e.payload.dir; pose = e.payload.pose; poseTick++; }
        else { if (pose === "walk" || pose === "look" || pose === "sleep") pose = "idle"; scheduleNext(); }
      }));
      cleanups.push(await win.listen("duo-touch", () => { if (duoOn) cancelTalk(); })); // a touch on Paws ends the talk, as a touch on Peak does
      void initDuo();
      cleanups.push(await win.listen("chatbox-ready", () => pushBox(true)));
      cleanups.push(await win.listen<BoxAction>("chatbox-action", (e) => onBoxAction(e.payload)));
      cleanups.push(await win.listen<string>("duo-type", (e) => void sendChat(e.payload))); // developer channel: a message typed without the box
      cleanups.push(await win.listen<{ dir: 1 | -1 }>("duo-face", (e) => { if (pose === "idle") dir = e.payload.dir; })); // the talk: the head turns toward the speaker
      cleanups.push(await win.listen<{ pet: PetId; text: string }>("duo-say", (e) => void sayAs(e.payload.pet, e.payload.text))); // developer channel: a line in Paws' bubble without the model
      const touchEndsScene = () => { if (sceneHold) void invoke("duo_scene_cancel"); if (duoOn) cancelTalk(); };
      window.addEventListener("pointerdown", touchEndsScene, true);
      cleanups.push(() => window.removeEventListener("pointerdown", touchEndsScene, true));
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
      syncPicture(); // the person's saved choice (off unless they turned it on)
      try {
        mem = parseMemory(await invoke<string | null>("load_memory"));
      } catch {
        /* nothing remembered yet */
      }
      mem = recordSession(mem, now);
      if (isNew) track("first_launch"); // dropped unless already opted in; backfilled on consent
      if (!isNew && !data.tour.done) data = finishTour(data); // an existing user never gets the tour unasked
      // "Days together reached 3 / 7" (different days, never reset; spec 12: there is no streak). Each once per install.
      if (mem.days >= 3) track("active_d3");
      if (mem.days >= 7) track("active_d7");
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
      }
      scheduleProactive();
      groundLoop = setInterval(groundTick, GROUND_POLL_MS);
      // Test hook (like window.__cat): lets a debugger trigger the real unprompted-line path now.
      (window as unknown as Record<string, unknown>).__pet = { proactive: () => void fireProactive(), focus: () => ({ ...focusOut, lastLeave, pose }), trail: () => trail, sleep: () => enter("drowsy"), wake: () => enter("idle"), hop: (dx: number, dy: number) => void fly(splitHop(dx, dy), "walk"), lane: () => ({ ...laneOut, state: laneState, cat: laneCat }), ground: () => invoke("ground_under_cat"), belief: () => { const b = currentBelief(); return { ...b.belief, response: b.response }; }, perch: (fake?: unknown, how?: "hop" | "climb") => void perchNow(fake as GroundMap | undefined, true, how), perchPretend: () => void perchPretend(),  descend: () => void descend(), mode: () => ({ mode, playUntil: attn.playUntil, seat: perchSeat, hush: data.hush }), play: () => playTouched(), walk: (toEdge?: boolean) => void tryWalk(toEdge === true), push: (d: 1 | -1, ends?: "recover" | "fall") => void doTeeter(d, ends), drop: () => void afterDrop(), bruise: () => ({ until: bruisedUntil, wary: isBruised(bruisedUntil, Date.now()) }), edge: () => void atEdge(dir), overlay: () => invoke<string>("overlay_toggle"), map: () => takeGroundMap().then((m) => (m ? { summary: summary(m), ledges: ledges(m).length } : null)), groundLost: () => void groundLost(), say: (t: Trigger, kind?: RepeatKind) => (kind ? say(t, repeatNow(kind)) : say(t)), bubble: () => bubbleText, fall: (d: number) => void fly([planFall(d)], "gasp") };
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
        void keptTick();
      }, MIN);
      setTimeout(() => void keptTick(), 25_000); // the first look, soon after start

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

<!-- No browser menu anywhere; a right click on the pet is a push (see onPetMenu). -->
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
