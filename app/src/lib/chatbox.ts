// The chat box of the person (ADR-0142): what the main page sends it, and how the turns are laid out like a common chat application.
// Pure logic: the page only draws what `groupTurns` returns.

export type BoxWho = "person" | "peak" | "paws";
export type Recipient = "peak" | "paws" | "both";

export interface BoxTurn { id: number; who: BoxWho; text: string; at: number }
export interface BoxView {
  turns: BoxTurn[];
  /** The pet that is writing now (three dots), or null. */
  typing: "peak" | "paws" | null;
  recipient: Recipient;
  /** false: no brain is connected; the box still takes the local commands. */
  canChat: boolean;
}

export const EMPTY_VIEW: BoxView = { turns: [], typing: null, recipient: "peak", canChat: false };

/** A time is shown between turns more than this far apart (and before the first one). */
export const TIME_GAP_MS = 10 * 60 * 1000;

export type Item =
  | { kind: "time"; at: number }
  | { kind: "group"; who: BoxWho; lines: { id: number; text: string }[] };

/** Turns of the same speaker in a row are one group (one avatar); a time comes first and after each long gap. */
export function groupTurns(turns: readonly BoxTurn[]): Item[] {
  const out: Item[] = [];
  let lastAt = -Infinity;
  for (const t of turns) {
    if (t.at - lastAt > TIME_GAP_MS) out.push({ kind: "time", at: t.at });
    const last = out[out.length - 1];
    if (last && last.kind === "group" && last.who === t.who) last.lines.push({ id: t.id, text: t.text });
    else out.push({ kind: "group", who: t.who, lines: [{ id: t.id, text: t.text }] });
    lastAt = t.at;
  }
  return out;
}

/** "Today 14:02" for the same day as `now`, else the date and the time. `locale` and the clock come in, so a test is steady. */
export function timeLabel(at: number, now: number, locale: string, today: string): string {
  const d = new Date(at), n = new Date(now);
  const clock = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  const same = d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  return same ? `${today} ${clock}` : `${d.toLocaleDateString(locale, { day: "numeric", month: "short" })} ${clock}`;
}

/** A message from the box: the text and who it is for (the main page checks it again). */
export type BoxAction = { type: "send"; text: string; to: Recipient } | { type: "recipient"; to: Recipient };
