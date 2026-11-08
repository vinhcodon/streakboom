// "Bond Days": the north star, and the per-day counters behind it. Pure functions, no I/O.
// Definitions are in spec/05-north-star-metrics.md. Counts only, never content: a counter is a
// number for a local date. Whether anything is recorded at all is decided in state.ts (consent).

export interface DayStat {
  d: string; // local date, "YYYY-MM-DD"
  scratch: number; // head scratches
  rub: number; // belly rubs (a trap counts: the act of care is the user's)
  poke: number; // plain single clicks that registered
  chat: number; // messages the user sent to the model
  shown: number; // unprompted pet lines shown
  engaged: number; // ...that the user reacted to within ENGAGE_WINDOW_MS, once per line
  min: number; // minutes the app ran with the machine awake
  quiet: number; // times Quiet mode was switched on
}
export type DayCounter = Exclude<keyof DayStat, "d">;
export const DAY_COUNTERS: DayCounter[] = ["scratch", "rub", "poke", "chat", "shown", "engaged", "min", "quiet"];

export const TELEMETRY_DAYS_MAX = 60;
export const ENGAGE_WINDOW_MS = 30_000;
export const PRESENT_MIN = 5; // minutes in a day to count as "present"
export const MAX_COUNT = 1_000_000;
const MAX_MIN = 1_440;
/** A minute tick counts only if the previous tick was at most this long ago (a machine that slept does not). */
export const MINUTE_GAP_MS = 120_000;

const p2 = (n: number) => String(n).padStart(2, "0");

/** Local calendar date of a timestamp, "YYYY-MM-DD". */
export function dateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A date key moved by whole calendar days. Done on the date itself (UTC arithmetic), so a daylight-saving change cannot skip or repeat a date. */
export function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${p2(t.getUTCMonth() + 1)}-${p2(t.getUTCDate())}`;
}

/** The `n` local dates ending today, newest first. */
export function lastDates(now: number, n: number): string[] {
  const today = dateKey(now);
  return Array.from({ length: n }, (_, i) => addDays(today, -i));
}

const blank = (d: string): DayStat => ({ d, scratch: 0, rub: 0, poke: 0, chat: 0, shown: 0, engaged: 0, min: 0, quiet: 0 });

/** Adds `n` to a counter of `now`'s date. Finds the entry by date (the clock may go backwards), keeps the array ascending and unique, capped. */
export function bumpDays(days: DayStat[], key: DayCounter, now: number, n = 1): DayStat[] {
  const d = dateKey(now);
  const out = days.slice();
  const i = out.findIndex((x) => x.d === d);
  const cap = key === "min" ? MAX_MIN : MAX_COUNT;
  if (i >= 0) {
    out[i] = { ...out[i], [key]: Math.min(cap, out[i][key] + n) };
  } else {
    out.push({ ...blank(d), [key]: Math.min(cap, n) });
    out.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  }
  return out.slice(-TELEMETRY_DAYS_MAX);
}

/** Validates stored days: bad dates and numbers dropped or clamped, duplicates merged, sorted, capped. */
export function parseDays(v: unknown): DayStat[] {
  if (!Array.isArray(v)) return [];
  const num = (x: unknown, cap: number) => (typeof x === "number" && Number.isFinite(x) ? Math.min(cap, Math.max(0, Math.floor(x))) : 0);
  const byDate = new Map<string, DayStat>();
  for (const x of v) {
    if (!x || typeof x !== "object") continue;
    const r = x as Record<string, unknown>;
    if (typeof r.d !== "string" || !DATE_RE.test(r.d)) continue;
    const cur = byDate.get(r.d) ?? blank(r.d);
    for (const k of DAY_COUNTERS) cur[k] = Math.min(k === "min" ? MAX_MIN : MAX_COUNT, cur[k] + num(r[k], k === "min" ? MAX_MIN : MAX_COUNT));
    byDate.set(r.d, cur);
  }
  return [...byDate.values()].sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-TELEMETRY_DAYS_MAX);
}

const care = (x: DayStat) => x.scratch + x.rub + x.engaged;

/**
 * Bond Days: how many of the last 7 days (today included) had a voluntary act of care: a head
 * scratch, a belly rub, or a reaction to one of the pet's unprompted lines. Chat and plain pokes do
 * not count, so the number does not reward using the pet as an assistant.
 */
export function bondDays(days: DayStat[], now: number): number {
  const recent = new Set(lastDates(now, 7));
  return days.filter((x) => recent.has(x.d) && care(x) > 0).length;
}

function sumRecent(days: DayStat[], now: number, n: number, f: (x: DayStat) => number): number {
  const recent = new Set(lastDates(now, n));
  return days.filter((x) => recent.has(x.d)).reduce((a, x) => a + f(x), 0);
}

/** Guardrail: chat / (chat + scratch + rub) over the last 7 days. Null when there is nothing yet. */
export function chatShare(days: DayStat[], now: number): number | null {
  const chat = sumRecent(days, now, 7, (x) => x.chat);
  const gestures = sumRecent(days, now, 7, (x) => x.scratch + x.rub);
  return chat + gestures === 0 ? null : chat / (chat + gestures);
}

/** Share of unprompted lines the user reacted to over the last 7 days. Null when none were shown. */
export function engagementRate(days: DayStat[], now: number): number | null {
  const shown = sumRecent(days, now, 7, (x) => x.shown);
  const engaged = sumRecent(days, now, 7, (x) => x.engaged);
  return shown === 0 ? null : Math.min(1, engaged / shown);
}

/** Days in the last 7 on which the app ran at least PRESENT_MIN minutes. */
export function presenceDays(days: DayStat[], now: number): number {
  const recent = new Set(lastDates(now, 7));
  return days.filter((x) => recent.has(x.d) && x.min >= PRESENT_MIN).length;
}

/**
 * Dn retention: present on some date in [n, n+1] calendar days after the first-launch date (one
 * day of tolerance, because a pet is used irregularly). Null when the first launch is unknown.
 */
export function retention(days: DayStat[], firstLaunchTs: number | null, n: number): boolean | null {
  if (firstLaunchTs === null) return null;
  const first = dateKey(firstLaunchTs);
  const want = new Set([addDays(first, n), addDays(first, n + 1)]);
  return days.some((x) => want.has(x.d) && x.min >= PRESENT_MIN);
}

/** Minutes to add for this tick: 1 when the previous tick was recent, 0 after a sleep or a first tick. */
export function minuteIncrement(prevTickMs: number, nowMs: number): number {
  const gap = nowMs - prevTickMs;
  return gap > 0 && gap <= MINUTE_GAP_MS ? 1 : 0;
}

// ---- "engaged": a reaction to an unprompted line, once per line, within the window
export interface ShownState {
  at: number; // when the last unprompted line was shown
  open: boolean; // it has not been reacted to yet
}
export const noShown = (): ShownState => ({ at: 0, open: false });
export const markShown = (_s: ShownState, now: number): ShownState => ({ at: now, open: true });

/** A reaction (poke, scratch, rub, double-click) now. Never called for a typed message. */
export function engage(s: ShownState, now: number): { state: ShownState; engaged: boolean } {
  if (!s.open) return { state: s, engaged: false };
  const engaged = now >= s.at && now - s.at <= ENGAGE_WINDOW_MS;
  return { state: { ...s, open: false }, engaged };
}
