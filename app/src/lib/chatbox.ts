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
export type BoxAction =
  | { type: "send"; text: string; to: Recipient }
  | { type: "recipient"; to: Recipient }
  | { type: "command"; act: "out" | "in"; target: "peak" | "paws" } // a command of the slash list: bring a pet out or send it in (local, no model)
  | { type: "clear" }; // clear this chat: the talk is forgotten, by the box and by the pets

// ------------------------------------------------------------------ keys of the box (ADR-0142, step 2)

export type PetKey = "peak" | "paws";
export interface Presence { peak: boolean; paws: boolean }

/** A command of the list that opens when the field starts with a slash. */
export type SlashAct = { kind: "out"; target: PetKey } | { kind: "in"; target: PetKey } | { kind: "pin" } | { kind: "clear" };
export interface SlashItem { id: string; label: string; hint: string; act: SlashAct }

const ALIASES: Record<"out" | "in" | "pin" | "clear", string[]> = {
  out: ["call", "out", "goi", "ra", "出して", "呼"],
  in: ["in", "send", "tuck", "vao", "duoi", "戻", "入"],
  pin: ["pin", "keep", "ghim", "固定"],
  clear: ["clear", "wipe", "xoa", "消"],
};

function plain(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").toLowerCase().trim();
}

/** The commands that fit what is typed after the slash. A verb in English, Vietnamese or Japanese (a start of it is enough), then perhaps a pet.
 *  Only what can happen is offered: a pet that is away can be called out, a pet that is out can be sent in. Local: no model, no key. */
export function slashItems(query: string, presence: Presence): SlashItem[] {
  const [verbQ = "", petQ = ""] = plain(query).split(/\s+/);
  const all: SlashItem[] = [];
  for (const t of ["paws", "peak"] as const) {
    const name = t === "paws" ? "Paws" : "Peak";
    if (!presence[t]) all.push({ id: `out-${t}`, label: `Call ${name} out`, hint: `/call ${t}`, act: { kind: "out", target: t } });
  }
  for (const t of ["paws", "peak"] as const) {
    const name = t === "paws" ? "Paws" : "Peak";
    if (presence[t]) all.push({ id: `in-${t}`, label: `Send ${name} in`, hint: `/in ${t}`, act: { kind: "in", target: t } });
  }
  all.push({ id: "pin", label: "Keep the box open", hint: "/pin", act: { kind: "pin" } });
  all.push({ id: "clear", label: "Clear this chat", hint: "/clear", act: { kind: "clear" } });
  if (!verbQ) return all;
  const kindOf = (a: SlashAct) => a.kind;
  return all.filter((it) => {
    const verbs = ALIASES[kindOf(it.act)];
    if (!verbs.some((v) => plain(v).startsWith(verbQ) || verbQ.startsWith(plain(v)) && plain(v).length >= 2)) return false;
    if (petQ && "target" in it.act) return it.act.target.startsWith(petQ);
    return true;
  });
}

/** Arrow up and down in the field: step through what was sent before. `idx` is -1 when not browsing. Returns the new place and the text to show
 *  (null: nothing changes). Past the newest message the field becomes empty again. */
export function recallStep(list: readonly string[], idx: number, dir: -1 | 1): { idx: number; text: string | null } {
  if (list.length === 0) return { idx: -1, text: null };
  if (dir === -1) {
    const n = idx === -1 ? list.length - 1 : Math.max(0, idx - 1);
    return { idx: n, text: list[n] };
  }
  if (idx === -1) return { idx: -1, text: null };
  const n = idx + 1;
  return n >= list.length ? { idx: -1, text: "" } : { idx: n, text: list[n] };
}

/** Tab and Shift+Tab: Peak, Paws, Both in turn. With Paws away only Peak can be written to, so nothing changes. */
export function nextRecipient(cur: Recipient, dir: 1 | -1, pawsOut: boolean): Recipient {
  if (!pawsOut) return "peak";
  const order: Recipient[] = ["peak", "paws", "both"];
  const i = order.indexOf(cur);
  return order[(i + dir + order.length) % order.length];
}

/** Ctrl+1, 2, 3: Peak, Paws, Both directly; Paws and Both only while Paws is out. */
export function recipientByNumber(n: number, pawsOut: boolean): Recipient | null {
  if (n === 1) return "peak";
  if (!pawsOut) return null;
  return n === 2 ? "paws" : n === 3 ? "both" : null;
}
