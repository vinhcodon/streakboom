// The chat box of the person (ADR-0142): what the main page sends it, and how the turns are laid out like a common chat application.
// Pure logic: the page only draws what `groupTurns` returns.

export type BoxWho = "person" | "peak" | "paws";

export interface BoxTurn { id: number; who: BoxWho; text: string; at: number }
export interface BoxView {
  /** The language chosen in Settings ("vi", "en", "ja"): the box speaks it. */
  lang: string;
  /** What the pets call the person ("" when unknown): the empty box tells how to set it (ADR-0144). */
  callMe: string;
  turns: BoxTurn[];
  /** The pet that is writing now (three dots), or null. */
  typing: "peak" | "paws" | null;
  /** false: no brain is connected; the box still takes the local commands. */
  canChat: boolean;
}

export const EMPTY_VIEW: BoxView = { lang: "en", callMe: "", turns: [], typing: null, canChat: false };

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
  | { type: "send"; text: string }
  | { type: "command"; act: "out" | "in"; target: "peak" | "paws" } // a command of the slash list: bring a pet out or send it in (local, no model)
  | { type: "clear" } // clear this chat: the talk is forgotten, by the box and by the pets
  | { type: "name"; value: string }; // `/name Vinh`: what the pets call the person (the main page cleans it again)

// ------------------------------------------------------------------ keys of the box (ADR-0142, step 2)

export type PetKey = "peak" | "paws";
export interface Presence { peak: boolean; paws: boolean }

/** A command of the list that opens when the field starts with a slash. */
export type SlashAct = { kind: "out"; target: PetKey } | { kind: "in"; target: PetKey } | { kind: "pin" } | { kind: "clear" } | { kind: "name"; value: string };
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
  // `/name Vinh`: tell the pets what to call the person (ADR-0144); offered as soon as a name follows the verb
  const nm = nameFromSlash(query);
  if (nm) return [{ id: "name", label: `Call me ${nm}`, hint: "/name", act: { kind: "name", value: nm } }];
  const kindOf = (a: SlashAct) => a.kind;
  return all.filter((it) => {
    if (it.act.kind === "name") return false;
    const verbs = ALIASES[kindOf(it.act) as "out" | "in" | "pin" | "clear"];
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

/** The mentions a message may open with: a pet, or everyone (`@everyone`, `@all`, `@both`, as in common chat applications). */
const LEADING_MENTIONS = /^\s*(?:@(?:peak|paws|everyone|all|both)\b[ \t,]*)+/i;

/** The text the field gets when a pet is double clicked (ADR-0145, amended by ADR-0152): `@Peak ` or `@Paws ` in front of what is there, only when both pets
 *  are out (with one out there is nobody to pick). A mention already at the start (of the other pet, or of everyone) is replaced by the one of the pet clicked,
 *  and what the person typed after it is kept: a click on a pet says who they want to speak to. Plain text: the person may delete it. */
export function withMention(draft: string, pet: PetKey, out: Presence): string {
  if (!(out.peak && out.paws)) return draft;
  const name = pet === "paws" ? "Paws" : "Peak";
  const rest = draft.replace(LEADING_MENTIONS, "");
  return `@${name} ${rest}`;
}

/** Where a mention is being typed (ADR-0152): the `@` just before the caret, at the start or after a space, and the letters after it. Null when the caret is not in one. */
export function mentionToken(draft: string, caret: number): { start: number; query: string } | null {
  const before = draft.slice(0, caret);
  const m = /(^|\s)@([^\s@]*)$/u.exec(before);
  return m ? { start: before.length - m[2].length - 1, query: m[2] } : null;
}

export interface MentionItem { id: "peak" | "paws" | "everyone"; text: string; resting: boolean }

/** The mentions already in a message, except the one being typed (`token`): who is named by `@Peak`, `@Paws`, or everyone (`@everyone`, `@all`, `@both`). */
export function mentionsIn(draft: string, token?: { start: number; query: string } | null): Set<"peak" | "paws" | "everyone"> {
  const text = token ? draft.slice(0, token.start) + " " + draft.slice(token.start + 1 + token.query.length) : draft;
  const out = new Set<"peak" | "paws" | "everyone">();
  for (const m of text.matchAll(/(?:^|\s)@(peak|paws|everyone|all|both)(?![\p{L}\p{N}_])/giu)) {
    const w = m[1].toLowerCase();
    out.add(w === "peak" ? "peak" : w === "paws" ? "paws" : "everyone");
  }
  return out;
}

/** The names offered after an `@`, those that begin with what is typed (letters of Peak, Paws, everyone; "all" and "both" find everyone). A pet that is in is
 *  offered too, marked as resting (a message goes to whoever is out, ADR-0145). A name already in the message is not offered again, and once the message names
 *  anyone `@everyone` is not offered (it would add nothing); once it names everyone nothing is offered. */
export function mentionItems(query: string, out: Presence, taken: Set<"peak" | "paws" | "everyone"> = new Set()): MentionItem[] {
  const q = query.toLowerCase();
  if (taken.has("everyone")) return [];
  const all: (MentionItem & { keys: string[] })[] = [
    { id: "peak", text: "@Peak", resting: !out.peak, keys: ["peak"] },
    { id: "paws", text: "@Paws", resting: !out.paws, keys: ["paws"] },
    { id: "everyone", text: "@everyone", resting: false, keys: ["everyone", "all", "both"] },
  ];
  return all
    .filter((i) => !taken.has(i.id) && !(i.id === "everyone" && taken.size > 0))
    .filter((i) => i.keys.some((k) => k.startsWith(q)))
    .map(({ id, text, resting }) => ({ id, text, resting }));
}

/** The draft with the token typed so far replaced by the chosen mention and a space; the caret goes after it. */
export function applyMention(draft: string, caret: number, token: { start: number; query: string }, item: MentionItem): { text: string; caret: number } {
  const head = draft.slice(0, token.start) + item.text + " ";
  const tail = draft.slice(caret).replace(/^ /, "");
  return { text: head + tail, caret: head.length };
}

/** The text the list of commands and the height of the field follow: it keeps the last settled text while a typing program is composing a word (Vietnamese Telex or VNI send back-spaces and new letters for one word), and follows the field otherwise. */
export function settled(previous: string, now: string, composing: boolean): string {
  return composing ? previous : now;
}

/** A key combination pressed in the Settings field, as the text the program registers ("Ctrl+Alt+P"), or null when it cannot be a global shortcut:
 *  it needs Ctrl, Alt or Win (Shift alone would take a letter away from typing) and one key: a letter, a digit, F1 to F12 or Space. */
export function comboFromEvent(e: { ctrlKey: boolean; altKey: boolean; shiftKey: boolean; metaKey: boolean; code: string }): string | null {
  if (!(e.ctrlKey || e.altKey || e.metaKey)) return null;
  let key: string | null = null;
  const m = /^Key([A-Z])$/.exec(e.code) ?? /^Digit([0-9])$/.exec(e.code);
  if (m) key = m[1];
  else if (/^F([1-9]|1[0-2])$/.test(e.code)) key = e.code;
  else if (e.code === "Space") key = "Space";
  if (!key) return null;
  return [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Win", key].filter(Boolean).join("+");
}

/** The `/name Vinh` command of the slash list: the name typed after the verb, with its case kept (the rest of the query, not the lowered one). */
export function nameFromSlash(query: string): string | null {
  const m = /^\s*(?:name|ten|tên|名前)\s+(\S.*)$/iu.exec(query);
  return m ? m[1].trim() : null;
}
