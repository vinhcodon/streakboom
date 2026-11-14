// The remind skill, first slice (ADR-0106, ADR-0115): Peak keeps a few days the person told it (a birthday, an anniversary),
// celebrates each once on the day, and says a missed one once when it is back. Pure data and rules, no I/O; the pet window
// owns the list (in memory.json, add-only) and the Settings window shows it and can remove any row.
//
// A day is kept as month and day (every year) or, when the person named a future year, once. No streak, no count shown, no
// chasing: a day is said once, never repeated, never escalated.

import type { Lang } from "./lines.ts";
import { dayKey } from "./state.ts";
import { normalize } from "./intents.ts";

export const MAX_KEPT = 24;
export const MAX_LABEL = 40;
/** A question to confirm a day waits this long for the answer (the chat box closes by itself after 20 s; the question stays open, and is shown again when the box is opened). */
export const PENDING_MS = 30 * 60_000;
/** A missed day is still said when Peak is back within this many days. */
export const MISSED_WINDOW_DAYS = 7;

export interface KeptDay {
  id: string;
  md: string; // "MM-DD"
  year: number; // 0 = every year; else the one year it is for
  label: string; // a few words the person said
  t: number; // when it was kept
  done: string; // the date key of the last celebration, "" = never
}

export interface Pending {
  md: string;
  year: number;
  label: string;
  t: number;
  /** The person told more than one day in the message: Peak takes the first and says the others come one at a time. */
  more?: boolean;
}

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** The words of a day as kept: one line, no control characters or markup, bounded. */
export function cleanLabel(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f<>[\]{}|]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL).trim();
}

/** Is "MM-DD" a real day of a year (29 February is allowed)? */
export function validMd(md: string): boolean {
  const m = /^(\d{2})-(\d{2})$/.exec(md);
  if (!m) return false;
  const mo = Number(m[1]);
  const d = Number(m[2]);
  return mo >= 1 && mo <= 12 && d >= 1 && d <= DAYS_IN_MONTH[mo - 1];
}

/**
 * What the model put after `[skill:remind|`: `MM-DD|label` (every year) or `YYYY-MM-DD|label` (that year only), with a last part `|more` when the person told several days at once. Anything that
 * is not exactly that is refused, so a model that invents a form keeps nothing.
 */
export function parseRemindArgs(args: string | null | undefined): Pending | null {
  if (!args) return null;
  const parts = args.split("|");
  if (parts.length < 2 || parts.length > 3) return null;
  const date = parts[0].trim();
  const label = cleanLabel(parts[1]);
  if (!label) return null;
  if (parts.length === 3 && parts[2].trim().toLowerCase() !== "more") return null;
  const more = parts.length === 3;
  const full = /^(\d{4})-(\d{2}-\d{2})$/.exec(date);
  const md = full ? full[2] : date;
  const year = full ? Number(full[1]) : 0;
  if (!validMd(md)) return null;
  if (full && (year < 2000 || year > 2100)) return null;
  return more ? { md, year, label, t: 0, more: true } : { md, year, label, t: 0 };
}

const YES = ["đúng", "đúng rồi", "đúng vậy", "đúng đó", "phải", "phải rồi", "ừ", "ừm", "ừa", "ờ", "uh", "uhm", "uh huh", "um", "uk", "vâng", "dạ", "dạ vâng", "được", "được rồi", "ok", "okay", "oke", "okie", "yup", "yes", "yep", "yeah", "right", "correct", "that's right", "sure", "keep it", "keep", "please", "do it", "giữ", "giữ đi", "giữ nhé", "nhớ đi", "はい", "うん", "そう", "そうだよ", "合ってる", "あってる", "お願い", "覚えて"];
const NO = ["không", "không phải", "không đúng", "sai", "sai rồi", "chưa đúng", "no", "nope", "wrong", "not right", "that's wrong", "don't", "no thanks", "đừng", "đừng giữ", "thôi", "ko", "hông", "nah", "いいえ", "ちがう", "違う", "ううん", "ちがうよ", "やめて"];
const norm = (xs: string[]) => new Set(xs.map(normalize));
const YES_SET = norm(YES);
const NO_SET = norm(NO);

/** The whole message is a yes or a no to the question about a day; anything else is neither. */
export function answerOf(text: string): "yes" | "no" | null {
  const n = normalize(text);
  if (YES_SET.has(n)) return "yes";
  if (NO_SET.has(n)) return "no";
  return null;
}

/** How many times a short reply that is neither a yes nor a no is answered with "say it again" before the question is dropped. */
export const MAX_CLARIFY = 2;

/**
 * What a message is to the question about a day: a yes, a no, "short" (a few words that are neither: probably an answer in words
 * Peak does not know, such as "uh"), or "other" (a real new message). A short reply is not sent on to the model, which does not
 * know there is a question and would ask it again (Preview 0.11.2: it asked three times).
 */
export function replyKind(text: string): "yes" | "no" | "short" | "other" {
  const a = answerOf(text);
  if (a) return a;
  const n = normalize(text);
  const words = n.split(" ").filter(Boolean);
  return words.length > 0 && words.length <= 3 && n.length <= 24 ? "short" : "other";
}

/** What the model put after `[skill:remind|` when it read the reply to the open question: exactly "yes" or "no". */
export function parseRemindAnswer(args: string | null | undefined): "yes" | "no" | null {
  const a = (args ?? "").trim().toLowerCase();
  return a === "yes" || a === "no" ? a : null;
}

/** Is this day (same month and day, same year, same words) already kept? */
export const hasKept = (list: readonly KeptDay[], p: Pending): boolean => list.some((k) => k.md === p.md && k.year === p.year && k.label.toLowerCase() === p.label.toLowerCase());

export function pendingAlive(p: Pending | null, now: number): p is Pending {
  return p !== null && now - p.t >= 0 && now - p.t < PENDING_MS;
}

/** Keep a confirmed day. The same day with the same words is not kept twice; the list has a limit. */
export function addKept(list: readonly KeptDay[], p: Pending, now: number, id: string): { list: KeptDay[]; result: "added" | "same" | "full" } {
  if (hasKept(list, p)) return { list: [...list], result: "same" };
  if (list.length >= MAX_KEPT) return { list: [...list], result: "full" };
  return { list: [...list, { id, md: p.md, year: p.year, label: p.label, t: now, done: "" }], result: "added" };
}

export const removeKept = (list: readonly KeptDay[], id: string): KeptDay[] => list.filter((k) => k.id !== id);

/** Is `day` (a date) the day this one is for? 29 February is kept on 28 February in a year that has no 29th. */
export function fallsOn(k: KeptDay, day: Date): boolean {
  const y = day.getFullYear();
  if (k.year !== 0 && k.year !== y) return false;
  const md = `${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  if (md === k.md) return true;
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return k.md === "02-29" && !leap && md === "02-28";
}

const dayAgo = (now: number, n: number) => {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0); // noon: a daylight-saving change cannot move the date
  d.setDate(d.getDate() - n);
  return d;
};

/** Days for today that were not yet celebrated today. */
export function dueToday(list: readonly KeptDay[], now: number): KeptDay[] {
  const today = dayKey(now);
  return list.filter((k) => fallsOn(k, dayAgo(now, 0)) && k.done !== today);
}

/**
 * Days that came by since `lastCheck` (a date key; "" = Peak never checked, so nothing is "missed") and before today, within
 * the window, and were never celebrated. Said once when Peak is back.
 */
export function missedSince(list: readonly KeptDay[], lastCheck: string, now: number): KeptDay[] {
  if (!lastCheck) return [];
  const out: KeptDay[] = [];
  for (const k of list) {
    for (let n = 1; n <= MISSED_WINDOW_DAYS; n++) {
      const d = dayAgo(now, n);
      const key = dayKey(d.getTime());
      if (key <= lastCheck) break; // earlier than what Peak already saw
      if (fallsOn(k, d)) {
        if (k.done < key) out.push(k);
        break;
      }
    }
  }
  return out;
}

/** Mark days as celebrated today. */
export const markDone = (list: readonly KeptDay[], ids: readonly string[], now: number): KeptDay[] =>
  list.map((k) => (ids.includes(k.id) ? { ...k, done: dayKey(now) } : k));

/** One-off days whose date is more than the window in the past are dropped (a kept day that never comes again). */
export function pruneOneOff(list: readonly KeptDay[], now: number): KeptDay[] {
  const cutoff = dayKey(dayAgo(now, MISSED_WINDOW_DAYS + 1).getTime());
  return list.filter((k) => k.year === 0 || `${k.year}-${k.md}` >= cutoff);
}

// ------------------------------------------------------------------ the words

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** A date for the person to read in their language ("12 March", "ngày 12 tháng 3", "3月12日"), with the year if it has one. */
export function describeDate(md: string, year: number, lang: Lang): string {
  const mo = Number(md.slice(0, 2));
  const d = Number(md.slice(3, 5));
  if (lang === "vi") return `ngày ${d} tháng ${mo}${year ? ` năm ${year}` : ""}`;
  if (lang === "ja") return `${year ? `${year}年` : ""}${mo}月${d}日`;
  return `${d} ${MONTHS_EN[mo - 1]}${year ? ` ${year}` : ""}`;
}

export type RemindLine = "today" | "missed" | "ask" | "kept" | "same" | "full" | "dropped" | "clarify" | "later" | "baddate" | "stale";

/** Scripted lines, three languages, no key needed (ADR-0106 point 6). {label} and {date} are filled in by `say`. */
export const REMIND_LINES: Record<RemindLine, Record<Lang, string[]>> = {
  today: {
    en: ["Today is {label}. A small cheer from me.", "It's {label} today. Happy day to you."],
    vi: ["Hôm nay là {label} đó. Chúc mừng nha!", "Nay là {label} rồi. Chúc bạn một ngày vui nhé."],
    ja: ["今日は{label}だよ。おめでとう！", "{label}の日だね。いい一日になりますように。"],
  },
  missed: {
    en: ["{label} came by a few days ago. Late cheers!", "I think {label} was just before I got back. Cheers, a bit late."],
    vi: ["{label} vừa qua mấy hôm trước. Chúc mừng muộn nha!", "Mình nhớ {label} mới qua đây thôi. Chúc muộn một chút nhé."],
    ja: ["{label}、少し前だったね。遅ればせながらおめでとう！", "{label}は数日前だったかな。遅くなったけど、おめでとう。"],
  },
  ask: {
    en: ["{date}: {label}. Shall I keep that day?", "So {label} is on {date}. Keep it?"],
    vi: ["{date}: {label}. Mình giữ ngày này nhé?", "{label} vào {date}. Giữ lại nhé?"],
    ja: ["{date}：{label}。この日を覚えておく？", "{label}は{date}だね。覚えておこうか？"],
  },
  kept: {
    en: ["Got it. I'll keep {date}.", "Done. {date} is kept."],
    vi: ["Ghi nhớ rồi. Mình sẽ giữ {date}.", "Xong rồi. Mình nhớ {date} nha."],
    ja: ["覚えたよ。{date}だね。", "わかった。{date}を覚えておくね。"],
  },
  same: {
    en: ["I already keep that one.", "That one is already with me."],
    vi: ["Ngày đó mình giữ rồi nha.", "Mình có ngày đó sẵn rồi."],
    ja: ["その日はもう覚えてるよ。", "それはもう覚えてるよ。"],
  },
  full: {
    en: ["I keep as many days as I can. You can remove some in Settings, Memory.", "My list of days is full. You can clear some in Settings, Memory."],
    vi: ["Mình giữ hết sức rồi. Bạn có thể xóa bớt trong Cài đặt, Bộ nhớ.", "Danh sách ngày của mình đầy rồi. Bạn xóa bớt trong Cài đặt, Bộ nhớ nhé."],
    ja: ["これ以上は覚えられないよ。設定のメモリーで減らせるよ。", "日付のリストがいっぱい。設定のメモリーで消してね。"],
  },
  clarify: {
    en: ["Not sure I got that. Say 'keep it' to keep the day, or 'no' to skip it.", "I did not catch that. 'Keep it' or 'no'?"],
    vi: ["Mình chưa rõ nè. Giữ ngày này thì nói 'giữ đi', không thì nói 'không' nhé.", "Mình chưa hiểu ý. 'Giữ đi' hay 'không' nhỉ?"],
    ja: ["ごめん、わからなかった。覚えるなら「お願い」、やめるなら「やめて」って言ってね。", "うまく伝わらなかったみたい。「お願い」か「やめて」で教えてね。"],
  },
  later: {
    en: ["One day at a time: I'll take the others after this one.", "I keep one day at a time. Tell me the next one after this."],
    vi: ["Mình nhận từng ngày một nha, các ngày kia mình hỏi sau.", "Mình giữ từng ngày một. Ngày còn lại bạn kể sau nhé."],
    ja: ["一日ずつ覚えるね。ほかの日はそのあとで。", "日付は一つずつ覚えるよ。次の日はそのあとで教えてね。"],
  },
  baddate: {
    en: ["I could not make out the day. Could you tell me the date again?", "That day did not come out clearly for me. What is the date?"],
    vi: ["Mình chưa rõ ngày đó. Bạn nói lại ngày giúp mình nhé?", "Ngày đó mình chưa nắm được. Là ngày mấy nhỉ?"],
    ja: ["その日がよくわからなかった。もう一度日付を教えてくれる？", "日付がはっきりしなかったよ。何日かな？"],
  },
  stale: {
    en: ["I am not waiting on a day right now. Tell me the day again and I'll ask.", "No day is waiting for an answer. Tell me the date again?"],
    vi: ["Mình đang không chờ ngày nào cả. Bạn kể lại ngày giúp mình nhé.", "Không có ngày nào đang chờ trả lời. Bạn nói lại ngày nhé?"],
    ja: ["いま返事を待っている日はないよ。もう一度日付を教えてね。", "待っている日はないみたい。日付をもう一度教えてくれる？"],
  },
  dropped: {
    en: ["Okay, I won't keep it.", "No problem, I'll leave it out."],
    vi: ["Ok, mình không giữ nữa.", "Không sao, mình bỏ qua nhé."],
    ja: ["わかった、覚えないね。", "了解、やめておくね。"],
  },
};

/** One line of a kind, in the language, with the label and the date put in. `last` is not repeated; `rand` is in [0, 1). */
export function remindSay(kind: RemindLine, lang: Lang, v: { label?: string; date?: string }, last: string | null = null, rand: () => number = Math.random): string {
  const pool = REMIND_LINES[kind][lang].map((t) => t.replaceAll("{label}", v.label ?? "").replaceAll("{date}", v.date ?? ""));
  const rest = pool.filter((l) => l !== last);
  const from = rest.length ? rest : pool;
  return from[Math.min(from.length - 1, Math.floor(rand() * from.length))];
}

// ---------------------------------------------------------------- the stored list

/** The list as read from memory.json: bounded, every field checked; a bad row is dropped, never fixed up. */
export function parseKept(raw: unknown): KeptDay[] {
  if (!Array.isArray(raw)) return [];
  const out: KeptDay[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const md = typeof o.md === "string" ? o.md : "";
    const label = typeof o.label === "string" ? cleanLabel(o.label) : "";
    if (!validMd(md) || !label || typeof o.id !== "string") continue;
    const year = typeof o.year === "number" && Number.isInteger(o.year) && (o.year === 0 || (o.year >= 2000 && o.year <= 2100)) ? o.year : 0;
    out.push({
      id: o.id.slice(0, 40),
      md,
      year,
      label,
      t: typeof o.t === "number" && Number.isFinite(o.t) ? Math.max(0, Math.floor(o.t)) : 0,
      done: typeof o.done === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.done) ? o.done : "",
    });
    if (out.length >= MAX_KEPT) break;
  }
  return out;
}
