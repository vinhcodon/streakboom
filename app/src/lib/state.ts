import { bumpDays, parseDays, type DayCounter, type DayStat } from "./bond.ts";
import type { Band, Lang } from "./lines.ts";

export interface Settings {
  lang: "auto" | Lang;
  gentle: boolean;
  updates: "auto" | "ask" | "off"; // install by itself when idle / offer through the pet / do not check
  remarks: boolean; // a connected brain may add a short remark after a reflex (RX-7, ADR-0043)
  groundMap: boolean; // Peak may take a coarse picture of where windows are, in memory, when about to move (PC-6, ADR-0043); on by default (ADR-0044)
}

/** Bookkeeping for the "give me a brain" (API key) request. The key itself is never stored here. */
export interface BrainMeta {
  asks: number; // times the request card was shown (max 3)
  snoozeUntil: number; // "Later" pushes the next ask out
  menuOpens: number; // times the interaction menu was opened
  chatTries: number; // times the user tried to type before having a brain
  connectedAt: number; // 0 if never connected
}

/** Daily AI usage, so a free key is never drained. Resets when the local day changes. */
export interface AiUsage {
  day: string;
  chat: number;
  proactive: number;
  note: number; // background "note a few facts" requests; they never use up the chat cap
  coolUntil: number; // after a rate limit, no AI calls until then
}

export type AiKind = "chat" | "proactive" | "note";

export const AI_CHAT_DAILY_CAP = 60;
export const AI_PROACTIVE_DAILY_CAP = 6;
export const AI_NOTE_DAILY_CAP = 20;
export const AI_COOLDOWN_MS = 2 * 60_000;

export const defaultAi = (): AiUsage => ({ day: "", chat: 0, proactive: 0, note: 0, coolUntil: 0 });

// `note` is missing in data saved before 0.2.1, so it is filled in here.
const freshAi = (a: AiUsage, now: number): AiUsage =>
  a.day === dayKey(now) ? { ...a, note: a.note ?? 0 } : { ...a, day: dayKey(now), chat: 0, proactive: 0, note: 0 };

const CAPS: Record<AiKind, number> = { chat: AI_CHAT_DAILY_CAP, proactive: AI_PROACTIVE_DAILY_CAP, note: AI_NOTE_DAILY_CAP };

/** "ok", or why not: "cooldown" (recent rate limit) / "cap" (daily limit reached). */
export function aiGate(d: PetData, kind: AiKind, now: number): "ok" | "cooldown" | "cap" {
  const a = freshAi(d.ai, now);
  if (now < a.coolUntil) return "cooldown";
  if (a[kind] >= CAPS[kind]) return "cap";
  return "ok";
}

export function recordAi(d: PetData, kind: AiKind, now: number): PetData {
  const a = freshAi(d.ai, now);
  return { ...d, ai: { ...a, [kind]: a[kind] + 1 } };
}

export function coolDown(d: PetData, now: number): PetData {
  return { ...d, ai: { ...freshAi(d.ai, now), coolUntil: now + AI_COOLDOWN_MS } };
}

/**
 * Opt-in, anonymous funnel telemetry. Nothing is recorded unless consent is "on"; events carry a
 * name and a timestamp only (never keys, chat or personal data). Each funnel event is recorded
 * once per install. The queue stays on this machine until a sending backend exists.
 */
export type Consent = "unset" | "on" | "off";
export interface TelemetryEvent {
  e: string;
  t: number;
}
/**
 * Version of the consent wording the user agreed to. 1 = funnel event names only (the first
 * wording); 2 = also per-day counts (spec/05). Per-day counters are recorded only at version 2, so
 * people who agreed to the first wording are not counted until they agree again.
 */
export const CONSENT_VERSION = 2;
export const MAX_DAILY_ASKS = 2;
export interface Telemetry {
  consent: Consent;
  consentV: number; // wording version agreed to (0 = never agreed)
  asks: number; // times the consent card was shown
  dailyAsks: number; // times the "also count per-day numbers" card was shown to a version-1 user
  installId: string; // random, created only when consent is given
  queue: TelemetryEvent[];
  done: string[]; // once-only events already recorded
  days: DayStat[]; // per-day counters, newest last (bond.ts); empty unless consent is on at version 2
}

export const MAX_CONSENT_ASKS = 2;
export const TELEMETRY_QUEUE_MAX = 200;

export const defaultTelemetry = (): Telemetry => ({ consent: "unset", consentV: 0, asks: 0, dailyAsks: 0, installId: "", queue: [], done: [], days: [] });

/** Per-day counters are recorded only with consent on at the current wording. */
export const countsDaily = (d: PetData): boolean => d.telemetry.consent === "on" && d.telemetry.consentV >= CONSENT_VERSION;

export const shouldAskConsent = (d: PetData): boolean =>
  d.telemetry.consent === "unset" && d.telemetry.asks < MAX_CONSENT_ASKS;

export const recordConsentAsk = (d: PetData): PetData => ({
  ...d,
  telemetry: { ...d.telemetry, asks: d.telemetry.asks + 1 },
});

/**
 * Turning on creates a random install id and backfills `first_launch` with the real first-seen
 * time (that moment passed before the user could agree). Turning off deletes the id and the queue.
 */
export function setConsent(d: PetData, consent: "on" | "off", newId: string): PetData {
  if (consent === "off") {
    return { ...d, telemetry: { ...d.telemetry, consent: "off", consentV: 0, installId: "", queue: [], done: [], days: [] } };
  }
  const t = d.telemetry;
  const withId = { ...t, consent: "on" as const, consentV: CONSENT_VERSION, installId: t.installId || newId };
  const base: PetData = { ...d, telemetry: withId };
  return recordEvent(base, "first_launch", d.firstSeen);
}

/** The second switch: also count a few numbers per day. Turning it off deletes them; the funnel events stay. */
export function setDailyCounts(d: PetData, on: boolean): PetData {
  if (d.telemetry.consent !== "on") return d;
  return { ...d, telemetry: { ...d.telemetry, consentV: on ? CONSENT_VERSION : 1, days: on ? d.telemetry.days : [] } };
}

/** Someone who agreed to the first wording is asked once or twice about the per-day numbers. */
export const shouldAskDaily = (d: PetData): boolean =>
  d.telemetry.consent === "on" && d.telemetry.consentV < CONSENT_VERSION && d.telemetry.dailyAsks < MAX_DAILY_ASKS;

export const recordDailyAsk = (d: PetData): PetData => ({ ...d, telemetry: { ...d.telemetry, dailyAsks: d.telemetry.dailyAsks + 1 } });

/** Adds `n` to today's counter. Nothing is recorded unless the user agreed to per-day counts. */
export function bumpDay(d: PetData, key: DayCounter, now: number, n = 1): PetData {
  if (!countsDaily(d) || n <= 0) return d;
  return { ...d, telemetry: { ...d.telemetry, days: bumpDays(d.telemetry.days, key, now, n) } };
}

export function recordEvent(d: PetData, name: string, now: number): PetData {
  const t = d.telemetry;
  if (t.consent !== "on" || t.done.includes(name)) return d;
  const queue = [...t.queue, { e: name, t: now }].slice(-TELEMETRY_QUEUE_MAX);
  return { ...d, telemetry: { ...t, queue, done: [...t.done, name] } };
}

const parseTelemetry = (o: unknown): Telemetry => {
  const x = (o && typeof o === "object" ? o : {}) as Record<string, unknown>;
  const consent: Consent = x.consent === "on" || x.consent === "off" ? x.consent : "unset";
  const queue = Array.isArray(x.queue)
    ? x.queue
        .filter(
          (q): q is TelemetryEvent =>
            !!q && typeof q.e === "string" && q.e.length > 0 && q.e.length <= 40 && typeof q.t === "number" && Number.isFinite(q.t)
        )
        .slice(-TELEMETRY_QUEUE_MAX)
        .map((q) => ({ e: q.e, t: q.t }))
    : [];
  const done = Array.isArray(x.done) ? x.done.filter((s): s is string => typeof s === "string" && s.length <= 40).slice(0, 50) : [];
  const asks = typeof x.asks === "number" && Number.isFinite(x.asks) ? clamp(Math.floor(x.asks), 0, 99) : 0;
  const installId = typeof x.installId === "string" && x.installId.length <= 64 ? x.installId : "";
  const dailyAsks = typeof x.dailyAsks === "number" && Number.isFinite(x.dailyAsks) ? clamp(Math.floor(x.dailyAsks), 0, 99) : 0;
  // A file without a version that says "on" was written under the first wording.
  const consentV = consent === "on" ? (typeof x.consentV === "number" && Number.isFinite(x.consentV) ? clamp(Math.floor(x.consentV), 1, CONSENT_VERSION) : 1) : 0;
  // No consent, no identifier, no stored events and no counters, whatever the file says.
  if (consent !== "on") return { consent, consentV: 0, asks, dailyAsks: 0, installId: "", queue: [], done: [], days: [] };
  return { consent, consentV, asks, dailyAsks, installId, queue, done, days: consentV >= CONSENT_VERSION ? parseDays(x.days) : [] };
};

/**
 * Gesture discovery. Gestures are invisible, so the pet nudges the user toward the head scratch
 * a few times (spaced out) until they have done it once.
 */
export interface GestureMeta {
  scratches: number; // head scratches done so far
  hints: number; // nudges shown
  lastHint: number;
  rubs: number; // belly rubs done so far
  bellyHints: number;
  lastBellyHint: number;
}

export const MAX_GESTURE_HINTS = 3;
export const GESTURE_HINT_GAP_MS = 20 * 3_600_000;

export const MAX_BELLY_HINTS = 2;

export const defaultGestures = (): GestureMeta => ({ scratches: 0, hints: 0, lastHint: 0, rubs: 0, bellyHints: 0, lastBellyHint: 0 });

/** The belly hint only comes after the head scratch is known (one thing at a time), and stops once they rub. */
export const shouldHintBelly = (d: PetData, now: number): boolean =>
  d.gestures.scratches > 0 && d.gestures.rubs === 0 && d.gestures.bellyHints < MAX_BELLY_HINTS && now - d.gestures.lastBellyHint >= GESTURE_HINT_GAP_MS;

export const recordBellyHint = (d: PetData, now: number): PetData => ({
  ...d,
  gestures: { ...d.gestures, bellyHints: d.gestures.bellyHints + 1, lastBellyHint: now },
});

export const recordRub = (d: PetData): PetData => ({ ...d, gestures: { ...d.gestures, rubs: d.gestures.rubs + 1 } });

export const shouldHintGesture = (d: PetData, now: number): boolean =>
  d.gestures.scratches === 0 && d.gestures.hints < MAX_GESTURE_HINTS && now - d.gestures.lastHint >= GESTURE_HINT_GAP_MS;

export const recordHint = (d: PetData, now: number): PetData => ({
  ...d,
  gestures: { ...d.gestures, hints: d.gestures.hints + 1, lastHint: now },
});

export const recordScratch = (d: PetData): PetData => ({
  ...d,
  gestures: { ...d.gestures, scratches: d.gestures.scratches + 1 },
});

/** Update offers: "Later" snoozes the same version for a day, so the pet never nags. */
export interface UpdateMeta {
  offered: string; // the version last offered
  snoozeUntil: number;
}

export const UPDATE_SNOOZE_MS = 24 * 3_600_000;

export const defaultUpdate = (): UpdateMeta => ({ offered: "", snoozeUntil: 0 });

export const shouldOfferUpdate = (d: PetData, version: string, now: number): boolean =>
  !(d.update.offered === version && now < d.update.snoozeUntil);

export const snoozeUpdate = (d: PetData, version: string, now: number): PetData => ({
  ...d,
  update: { offered: version, snoozeUntil: now + UPDATE_SNOOZE_MS },
});

/** The one-time question "start with Windows?": twice at most, days apart, never on the first day. */
export interface StartupMeta {
  asks: number;
  lastAsk: number;
  done: boolean; // they answered yes, or turned it on themselves
}
export const MAX_STARTUP_ASKS = 2;
export const STARTUP_ASK_GAP_MS = 3 * 24 * 3_600_000;
export const defaultStartup = (): StartupMeta => ({ asks: 0, lastAsk: 0, done: false });
export const shouldAskStartup = (d: PetData, now: number, daysUsed: number): boolean =>
  !d.startup.done && d.startup.asks < MAX_STARTUP_ASKS && daysUsed >= 2 && now - d.startup.lastAsk >= STARTUP_ASK_GAP_MS;
export const recordStartupAsk = (d: PetData, now: number): PetData => ({ ...d, startup: { ...d.startup, asks: d.startup.asks + 1, lastAsk: now } });
export const markStartupDone = (d: PetData): PetData => ({ ...d, startup: { ...d.startup, done: true } });

/** The first-run tour: shown once on a fresh install (and again whenever the user asks in Settings). */
export interface TourMeta {
  done: boolean;
}
export const defaultTour = (): TourMeta => ({ done: false });
export const finishTour = (d: PetData): PetData => ({ ...d, tour: { done: true } });

export const MAX_BRAIN_ASKS = 3;
export const BRAIN_SNOOZE_MS = 2 * 24 * 3_600_000;
export const MENU_OPENS_BEFORE_ASK = 3;

export interface PetData {
  v: 1;
  mood: number; // 25..100
  closeness: number; // 10..100
  firstSeen: number;
  lastSeen: number;
  lastCheckIn: string; // local day key of the last daily check-in
  gainDay: string;
  gainToday: number; // closeness gained from interactions today (capped)
  recent: string[];
  /** The shuffle bag per trigger (and stage): the ids said in the current round (LN-1). */
  bags: Record<string, string[]>;
  said: Record<string, number>; // trigger -> last time spoken (ms)
  /** Chose "Quiet" at the retired setting of how talkative Peak is (ADR-0047): it keeps from saying anything unprompted, as they chose. Read once from the old setting, kept here. */
  hush: boolean;
  settings: Settings;
  brain: BrainMeta;
  ai: AiUsage;
  telemetry: Telemetry;
  gestures: GestureMeta;
  update: UpdateMeta;
  startup: StartupMeta;
  tour: TourMeta;
}

export type InteractKind = "click" | "pet" | "snack" | "play" | "how";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export const DEFAULT_SETTINGS: Settings = {
  lang: "auto",
  gentle: false,
  updates: "ask",
  remarks: true,
  groundMap: true,
};

export function defaultData(now: number): PetData {
  return {
    v: 1,
    mood: 55,
    closeness: 10,
    firstSeen: now,
    lastSeen: now,
    lastCheckIn: "",
    gainDay: "",
    gainToday: 0,
    recent: [],
    bags: {},
    said: {},
    hush: false,
    settings: { ...DEFAULT_SETTINGS },
    brain: { asks: 0, snoozeUntil: 0, menuOpens: 0, chatTries: 0, connectedAt: 0 },
    ai: defaultAi(),
    telemetry: defaultTelemetry(),
    gestures: defaultGestures(),
    update: defaultUpdate(),
    startup: defaultStartup(),
    tour: defaultTour(),
  };
}

/** Parse stored JSON defensively; anything missing or invalid falls back to defaults. */
/** The shuffle bags from a saved file: only lists of strings, each at most 200 long, at most 60 bags. */
function parseBags(raw: unknown): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>).slice(0, 60)) {
    if (Array.isArray(v)) out[k] = v.filter((x) => typeof x === "string").slice(-200) as string[];
  }
  return out;
}

export function parse(json: string | null | undefined, now: number): PetData {
  const base = defaultData(now);
  if (!json) return base;
  try {
    const o = JSON.parse(json);
    if (!o || typeof o !== "object") return base;
    const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);
    const s = (o.settings ?? {}) as Partial<Settings>;
    return {
      v: 1,
      mood: clamp(num(o.mood, base.mood), 25, 100),
      closeness: clamp(num(o.closeness, base.closeness), 10, 100),
      firstSeen: num(o.firstSeen, now),
      lastSeen: num(o.lastSeen, now),
      lastCheckIn: typeof o.lastCheckIn === "string" ? o.lastCheckIn : "",
      gainDay: typeof o.gainDay === "string" ? o.gainDay : "",
      gainToday: Math.max(0, num(o.gainToday, 0)),
      recent: Array.isArray(o.recent) ? o.recent.filter((x: unknown) => typeof x === "string").slice(-24) : [],
      bags: parseBags(o.bags),
      said: o.said && typeof o.said === "object" ? { ...o.said } : {},
      hush: typeof o.hush === "boolean" ? o.hush : (s as { freq?: unknown }).freq === "quiet",
      settings: {
        lang: s.lang === "vi" || s.lang === "en" || s.lang === "ja" ? s.lang : "auto",
        gentle: !!s.gentle,
        updates: s.updates === "auto" || s.updates === "off" ? s.updates : "ask",
        remarks: s.remarks !== false,
        groundMap: s.groundMap !== false,
      },
      brain: {
        asks: clamp(Math.floor(num(o.brain?.asks, 0)), 0, 99),
        snoozeUntil: num(o.brain?.snoozeUntil, 0),
        menuOpens: clamp(Math.floor(num(o.brain?.menuOpens, 0)), 0, 9999),
        chatTries: clamp(Math.floor(num(o.brain?.chatTries, 0)), 0, 9999),
        connectedAt: num(o.brain?.connectedAt, 0),
      },
      ai: {
        day: typeof o.ai?.day === "string" ? o.ai.day : "",
        chat: clamp(Math.floor(num(o.ai?.chat, 0)), 0, 99999),
        proactive: clamp(Math.floor(num(o.ai?.proactive, 0)), 0, 99999),
        note: clamp(Math.floor(num(o.ai?.note, 0)), 0, 99999),
        coolUntil: num(o.ai?.coolUntil, 0),
      },
      telemetry: parseTelemetry(o.telemetry),
      update: {
        offered: typeof o.update?.offered === "string" ? o.update.offered.slice(0, 40) : "",
        snoozeUntil: num(o.update?.snoozeUntil, 0),
      },
      tour: { done: o.tour?.done === true },
      startup: {
        asks: clamp(Math.floor(num(o.startup?.asks, 0)), 0, 99),
        lastAsk: num(o.startup?.lastAsk, 0),
        done: o.startup?.done === true,
      },
      gestures: {
        scratches: clamp(Math.floor(num(o.gestures?.scratches, 0)), 0, 999999),
        hints: clamp(Math.floor(num(o.gestures?.hints, 0)), 0, 99),
        lastHint: num(o.gestures?.lastHint, 0),
        rubs: clamp(Math.floor(num(o.gestures?.rubs, 0)), 0, 999999),
        bellyHints: clamp(Math.floor(num(o.gestures?.bellyHints, 0)), 0, 99),
        lastBellyHint: num(o.gestures?.lastBellyHint, 0),
      },
    };
  } catch {
    return base;
  }
}

/** Local calendar day key, e.g. "2026-11-07". */
export function dayKey(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function tierOf(closeness: number): 1 | 2 | 3 | 4 {
  if (closeness >= 80) return 4;
  if (closeness >= 50) return 3;
  if (closeness >= 20) return 2;
  return 1;
}

/** The mood band that chooses the lines. Absence never changes it (spec 12, ADR-0059: there is no "lonely"). */
export function bandOf(d: PetData, hour: number): Band {
  if (hour >= 23 || hour < 5) return "sleepy";
  if (d.mood >= 65) return "playful";
  if (d.mood <= 35) return "bored";
  return "content";
}

/** The night, by the clock: Peak is sleepy and says nothing unprompted from 23:00 to 07:00. It replaced the setting of quiet hours (ADR-0047: a setting is not for an amount of behaviour). */
export const isNight = (hour: number): boolean => hour >= 23 || hour < 7;

/**
 * Should the pet ask for a brain now? Only without a key, at most MAX_BRAIN_ASKS times,
 * not while snoozed, and only after a behavioural signal (tried to type, or opened the menu
 * several times). Never at install.
 */
export function shouldAskBrain(d: PetData, now: number, hasKey: boolean): boolean {
  if (hasKey) return false;
  const b = d.brain;
  if (b.asks >= MAX_BRAIN_ASKS || now < b.snoozeUntil) return false;
  return b.chatTries > 0 || b.menuOpens >= MENU_OPENS_BEFORE_ASK;
}

export function recordAsk(d: PetData): PetData {
  return { ...d, brain: { ...d.brain, asks: d.brain.asks + 1, chatTries: 0 } };
}

export function snoozeAsk(d: PetData, now: number): PetData {
  return { ...d, brain: { ...d.brain, snoozeUntil: now + BRAIN_SNOOZE_MS, menuOpens: 0 } };
}

export interface SessionStart {
  data: PetData;
  absentMs: number;
  returned: boolean; // away for 3+ hours
  checkedIn: boolean; // first launch of a new day
}

/**
 * The app starts. Absence costs nothing (spec 12, ADR-0059): being away never lowers mood or closeness, there is no
 * count of days in a row and opening the app pays nothing; coming back after a few hours only makes it a little glad.
 */
export function startSession(prev: PetData, now: number): SessionStart {
  const d: PetData = { ...prev, said: { ...prev.said } };
  const isNew = prev.lastCheckIn === "";
  const absentMs = Math.max(0, now - prev.lastSeen);
  const returned = !isNew && absentMs >= 3 * HOUR;

  const today = dayKey(now);
  let checkedIn = false;
  if (d.lastCheckIn !== today) {
    checkedIn = true;
    d.gainDay = today;
    d.gainToday = 0;
    d.lastCheckIn = today;
  }

  if (returned) d.mood = clamp(d.mood + 15, 25, 100);
  d.lastSeen = now;
  return { data: d, absentMs, returned, checkedIn };
}

/**
 * Time passing within a session: high mood relaxes toward 50 (1 per 10 min);
 * low mood sinks slowly toward the floor of 25 (1 per 30 min) until the user interacts.
 */
export function tick(prev: PetData, now: number): PetData {
  const minutes = Math.max(0, (now - prev.lastSeen) / 60_000);
  let mood = prev.mood;
  if (mood > 50) mood = Math.max(50, mood - minutes / 10);
  else if (mood > 25) mood = Math.max(25, mood - minutes / 30);
  return { ...prev, mood, lastSeen: now };
}

const MOOD_GAIN: Record<InteractKind, number> = { click: 1, pet: 8, snack: 6, play: 10, how: 2 };
const CLOSENESS_GAIN: Record<InteractKind, number> = { click: 0, pet: 1, snack: 1, play: 1, how: 1 };
export const DAILY_CLOSENESS_CAP = 5;

export function interact(prev: PetData, kind: InteractKind, now: number): PetData {
  const d = { ...prev };
  const today = dayKey(now);
  if (d.gainDay !== today) {
    d.gainDay = today;
    d.gainToday = 0;
  }
  d.mood = clamp(d.mood + MOOD_GAIN[kind], 25, 100);
  const room = DAILY_CLOSENESS_CAP - d.gainToday;
  const gain = Math.min(room, CLOSENESS_GAIN[kind]);
  if (gain > 0) {
    d.closeness = clamp(d.closeness + gain, 10, 100);
    d.gainToday += gain;
  }
  d.lastSeen = now;
  return d;
}
