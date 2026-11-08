// What the pet remembers about the user. Pure data and rules, no I/O; the pet window owns it and
// saves it to its own file (memory.json), separate from the pet's mood state.
//
// Principles (see spec): only things the user did with the pet or told it; habits are kept as
// coarse counts (hour of day, weekday), never a log of events; the pet never claims a memory it
// does not hold; and the user can look at everything, change it, or wipe it.

import { dayKey } from "./state.ts";

const DAY = 24 * 3_600_000;
export const MAX_NAME = 20;

export interface Memory {
  v: 1;
  learn: boolean; // false = habits, counts and milestones are not recorded at all
  petName: string; // what the user named the pet ("" = not named)
  callMe: string; // what the pet should call the user ("" = unknown)
  asks: { name: number; nameAt: number; callMe: number; callMeAt: number };
  hours: number[]; // how many sessions started in each hour of the day (24)
  weekdays: number[]; // ...and on each weekday, 0 = Sunday (7)
  sessions: number;
  days: number; // distinct days the pet was opened
  lastDay: string;
  bestStreak: number;
  longestAwayDays: number;
  touches: { poke: number; scratch: number; chat: number };
  marks: { id: string; t: number }[]; // milestones shared with the user
  said: Record<string, number>; // memory line kind -> last time spoken, for cooldowns
}

export const defaultMemory = (): Memory => ({
  v: 1,
  learn: true,
  petName: "",
  callMe: "",
  asks: { name: 0, nameAt: 0, callMe: 0, callMeAt: 0 },
  hours: Array(24).fill(0),
  weekdays: Array(7).fill(0),
  sessions: 0,
  days: 0,
  lastDay: "",
  bestStreak: 0,
  longestAwayDays: 0,
  touches: { poke: 0, scratch: 0, chat: 0 },
  marks: [],
  said: {},
});

/** A name typed by the user: trimmed, single line, no control characters, at most MAX_NAME. */
export function cleanName(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_NAME).trim();
}

const num = (v: unknown, d = 0, max = 1e9) => (typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : d);
const counts = (v: unknown, n: number): number[] =>
  Array.isArray(v) && v.length === n ? v.map((x) => num(x, 0, 1e6)) : Array(n).fill(0);

export function parseMemory(json: string | null | undefined): Memory {
  const base = defaultMemory();
  if (!json) return base;
  try {
    const o = JSON.parse(json);
    if (!o || typeof o !== "object") return base;
    return {
      v: 1,
      learn: o.learn !== false,
      petName: typeof o.petName === "string" ? cleanName(o.petName) : "",
      callMe: typeof o.callMe === "string" ? cleanName(o.callMe) : "",
      asks: {
        name: num(o.asks?.name, 0, 9),
        nameAt: num(o.asks?.nameAt),
        callMe: num(o.asks?.callMe, 0, 9),
        callMeAt: num(o.asks?.callMeAt),
      },
      hours: counts(o.hours, 24),
      weekdays: counts(o.weekdays, 7),
      sessions: num(o.sessions),
      days: num(o.days),
      lastDay: typeof o.lastDay === "string" ? o.lastDay.slice(0, 12) : "",
      bestStreak: num(o.bestStreak, 0, 99999),
      longestAwayDays: num(o.longestAwayDays, 0, 99999),
      touches: { poke: num(o.touches?.poke), scratch: num(o.touches?.scratch), chat: num(o.touches?.chat) },
      marks: Array.isArray(o.marks)
        ? o.marks
            .filter((m: unknown): m is { id: string; t: number } => !!m && typeof (m as { id?: unknown }).id === "string" && typeof (m as { t?: unknown }).t === "number")
            .slice(0, 50)
            .map((m: { id: string; t: number }) => ({ id: m.id.slice(0, 30), t: m.t }))
        : [],
      said: o.said && typeof o.said === "object" ? Object.fromEntries(Object.entries(o.said).filter(([, v]) => typeof v === "number").slice(0, 40)) as Record<string, number> : {},
    };
  } catch {
    return base;
  }
}

// ------------------------------------------------------------------ recording
/** A session started (the app opened). `streak` and `absentMs` come from the pet state. */
export function recordSession(m: Memory, now: number, streak: number, absentMs: number): Memory {
  if (!m.learn) return m;
  const d = new Date(now);
  const hours = [...m.hours];
  hours[d.getHours()]++;
  const weekdays = [...m.weekdays];
  weekdays[d.getDay()]++;
  const today = dayKey(now);
  return {
    ...m,
    hours,
    weekdays,
    sessions: m.sessions + 1,
    days: m.lastDay === today ? m.days : m.days + 1,
    lastDay: today,
    bestStreak: Math.max(m.bestStreak, streak),
    longestAwayDays: Math.max(m.longestAwayDays, Math.floor(absentMs / DAY)),
  };
}

export type Touch = "poke" | "scratch" | "chat";
export const recordTouch = (m: Memory, kind: Touch): Memory =>
  m.learn ? { ...m, touches: { ...m.touches, [kind]: m.touches[kind] + 1 } } : m;

// --------------------------------------------------------------------- habits
export type Part = "morning" | "afternoon" | "evening" | "night";
export const partOf = (hour: number): Part => (hour >= 5 && hour < 12 ? "morning" : hour >= 12 && hour < 18 ? "afternoon" : hour >= 18 && hour < 23 ? "evening" : "night");

export const MIN_SESSIONS_FOR_HABIT = 8;

/** The part of the day the user most often shows up in, if there is a clear favourite. */
export function usualPart(m: Memory): Part | null {
  if (!m.learn || m.sessions < MIN_SESSIONS_FOR_HABIT) return null;
  const by: Record<Part, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  m.hours.forEach((n, h) => (by[partOf(h)] += n));
  const total = m.hours.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const [best, n] = (Object.entries(by) as [Part, number][]).sort((a, b) => b[1] - a[1])[0];
  return n / total >= 0.5 ? best : null;
}

// ----------------------------------------------------------------- milestones
export interface MarkDef {
  id: string;
  reached: (m: Memory) => boolean;
}
export const MARKS: MarkDef[] = [
  { id: "days.7", reached: (m) => m.days >= 7 },
  { id: "days.30", reached: (m) => m.days >= 30 },
  { id: "days.100", reached: (m) => m.days >= 100 },
  { id: "touch.100", reached: (m) => m.touches.poke + m.touches.scratch >= 100 },
  { id: "touch.500", reached: (m) => m.touches.poke + m.touches.scratch >= 500 },
  { id: "chat.1", reached: (m) => m.touches.chat >= 1 },
  { id: "chat.25", reached: (m) => m.touches.chat >= 25 },
];

/** The first milestone that is reached and not yet shared. Does not change the memory. */
export function nextMark(m: Memory): string | null {
  if (!m.learn) return null;
  return MARKS.find((d) => d.reached(m) && !m.marks.some((x) => x.id === d.id))?.id ?? null;
}
export const shareMark = (m: Memory, id: string, now: number): Memory =>
  m.marks.some((x) => x.id === id) ? m : { ...m, marks: [...m.marks, { id, t: now }] };

// --------------------------------------------------------------------- naming
export const NAME_ASK_GAP = 2 * DAY;
export const MAX_ASKS = 2;

/** Should the pet ask the user to name it / say how to address them? Only after a day, politely, twice at most. */
export function shouldAsk(m: Memory, field: "name" | "callMe", now: number, ageDays: number, tier: number): boolean {
  if (ageDays < 1) return false;
  if (field === "name") {
    return m.petName === "" && m.asks.name < MAX_ASKS && now - m.asks.nameAt >= NAME_ASK_GAP && (ageDays >= 2 || tier >= 2);
  }
  // ask how to address the user only once the pet has been named or has been around a while
  return m.callMe === "" && m.asks.callMe < MAX_ASKS && now - m.asks.callMeAt >= NAME_ASK_GAP && (m.petName !== "" || ageDays >= 3);
}
export const recordAsked = (m: Memory, field: "name" | "callMe", now: number): Memory =>
  field === "name"
    ? { ...m, asks: { ...m.asks, name: m.asks.name + 1, nameAt: now } }
    : { ...m, asks: { ...m.asks, callMe: m.asks.callMe + 1, callMeAt: now } };

/** Setting a name also ends the asking for it. Empty clears it. */
export function setName(m: Memory, field: "petName" | "callMe", raw: string): Memory {
  const v = cleanName(raw);
  return { ...m, [field]: v };
}

// --------------------------------------------------------------------- cooldown
export const sayKind = (m: Memory, kind: string, now: number): Memory => ({ ...m, said: { ...m.said, [kind]: now } });
export const cooled = (m: Memory, kind: string, now: number, ms: number): boolean => now - (m.said[kind] ?? 0) >= ms;

// ----------------------------------------------------------------------- forget
/** Forget what was learned from use; keeps the names and the on/off switch. */
export function forgetHabits(m: Memory): Memory {
  const d = defaultMemory();
  return { ...d, learn: m.learn, petName: m.petName, callMe: m.callMe, asks: m.asks };
}
/** Forget everything, names included; keeps only the on/off switch. */
export const forgetAll = (m: Memory): Memory => ({ ...defaultMemory(), learn: m.learn });
