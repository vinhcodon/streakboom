// The talk among the person, Peak and Paws (ADR-0141). Pure logic, no window and no model: the model, the clock and the gates come in as
// dependencies, so the whole thing is tested with a scripted model and a fake clock (as scene.ts is).
//
// The cut: the model decides words; this file (the code) decides who may speak, in what order, how many lines, and what is dropped.
// One room log holds every turn; a pet is shown only the turns it heard (it spoke them, or they were said to it, or to both).

import { PETS, type PetId } from "./duo.ts";
import { loadProfiles, type Profiles } from "./pets.ts";

export type Party = "person" | PetId;
export type Act = "say" | "pass" | "gesture" | "turn"; // turn: a pet turns to the other (a relay)

export interface Turn { id: number; from: Party; to: Party[]; text: string; at: number; act: Act }
export interface Room { turns: Turn[]; nextId: number }

const KEEP = 40; // turns kept in the room
export function newRoom(): Room { return { turns: [], nextId: 1 }; }

export function addTurn(room: Room, t: Omit<Turn, "id">): { room: Room; turn: Turn } {
  const turn: Turn = { ...t, id: room.nextId };
  return { room: { turns: [...room.turns, turn].slice(-KEEP), nextId: room.nextId + 1 }, turn };
}

/** The turns the person can see: every "say" except the ones still waiting to be presented (#18). A pet's line is written into the room when the model answers,
 *  so the next pet hears it at once; it shows in the chat only when it is presented, on the same beat as Peak's expression for it. */
export function shownSays(room: Room, waiting: ReadonlySet<number>): Turn[] {
  return room.turns.filter((t) => t.act === "say" && !waiting.has(t.id));
}

/** The room without one turn: a line cancelled before it was presented is dropped from the talk, so that no pet later "remembers" saying what nobody saw (#18). */
export function withoutTurn(room: Room, id: number): Room {
  return { ...room, turns: room.turns.filter((t) => t.id !== id) };
}

/** What a pet heard: the turns it spoke, or that were said to it (a message to both is said to each). Gestures and passes carry no words. */
export function heard(room: Room, pet: PetId, limit = 8): Turn[] {
  return room.turns.filter((t) => t.act === "say" && (t.from === pet || t.to.includes(pet))).slice(-limit);
}

export interface Plan { speakers: PetId[]; absent: PetId[] }

/** Who answers a message to `to`: those addressed and present, the pet last spoken to first when both answer; the absent ones are listed. */
export function plan(to: PetId[], present: PetId[], lastSpoken: PetId | null): Plan {
  const asked = PETS.filter((p) => to.includes(p));
  const speakers = asked.filter((p) => present.includes(p));
  const absent = asked.filter((p) => !present.includes(p));
  if (speakers.length === 2 && lastSpoken && speakers[0] !== lastSpoken) speakers.reverse();
  return { speakers, absent };
}

export interface Utterance { text: string; mood: string; pass: boolean; to: PetId[] }

const MOOD_NAMES = ["neutral", "happy", "warm", "sassy", "surprised", "curious", "sad"];
/** A mood tag as a mood: a known one, a known one inside a misspelling ("ssad" is sad), else neutral. */
function moodOf(tag: string): string {
  return MOOD_NAMES.find((m) => m === tag) ?? MOOD_NAMES.find((m) => tag.includes(m)) ?? "neutral";
}

/** The reply of a model: leading tags `[mood]`, `[pass]` and `[to:paws]` (any order) and then the words. Untrusted: the director checks it. */
export function parseUtterance(raw: string): Utterance {
  let rest = raw.trim();
  let mood = "neutral";
  let pass = false;
  const to: PetId[] = [];
  for (;;) {
    const m = /^[\s"'*_]*\[([a-z:]+)\][*_]*\s*/i.exec(rest);
    if (!m) break;
    const tag = m[1].toLowerCase();
    if (tag === "pass") pass = true;
    else if (tag.startsWith("to:")) { const id = tag.slice(3) as PetId; if (PETS.includes(id) && !to.includes(id)) to.push(id); }
    else mood = moodOf(tag);
    rest = rest.slice(m[0].length);
  }
  // a known mood tag left in the middle or at the end of the words (a model sometimes puts it there) is taken out, never shown as text
  rest = rest.replace(new RegExp(String.raw`\s*\[(${MOOD_NAMES.join("|")})\]`, "gi"), "");
  return { text: rest.trim(), mood, pass, to };
}

function clip(text: string, maxWords: number): string {
  const w = text.split(/\s+/).filter(Boolean);
  return w.length <= maxWords ? text : w.slice(0, maxWords).join(" ");
}

/** A line as it may still be shown: one that waited in the queue is dropped when Quiet came meanwhile (a gesture is a nod and stays). */
export function presentable(l: Line, quietNow: boolean): Line | null {
  return quietNow && l.act === "say" ? null : l;
}

export interface Line { pet: PetId; act: Act; text: string; mood: string; to: Party[]; turnId: number }

export interface Deps {
  /** One model call for one pet: the turns it heard, and whether it speaks first or second. Rejects on any failure. */
  model(pet: PetId, view: Turn[], role: "first" | "second" | "relayed"): Promise<string>;
  /** The gate of quota and attention for one more call by this pet; false makes the line a gesture. */
  allow(pet: PetId): boolean;
  /** Quiet or no words wanted: gestures only, no call. */
  quiet(): boolean;
  sleep(ms: number): Promise<void>;
  /** The beat between the first line and the second (a short random range in the program, fixed in a test). */
  beat(): number;
  now(): number;
  /** A pet starts or stops writing (for the three dots of the box); null when none is. Optional. */
  writing?(pet: PetId | null): void;
}

export class Conversation {
  room: Room = newRoom();
  lastSpoken: PetId | null = null;
  private token = 0;
  private writes = 0;
  private gone = new Set<PetId>();
  /** The text of a person turn already put in the room the moment it was sent (so the box shows it at once); the turn that follows does not add it again. */
  private noted: string | null = null;

  private deps: Deps;
  private emit: (l: Line) => void;
  private profiles: Profiles;

  constructor(deps: Deps, emit: (l: Line) => void, profiles: Profiles = loadProfiles()) {
    this.deps = deps;
    this.emit = emit;
    this.profiles = profiles;
  }

  /** The person's message goes into the room at once, before any pet answers; `person` or `relay` with the same text then does not add it a second time. */
  notePerson(text: string, to: PetId[]) {
    this.room = addTurn(this.room, { from: "person", to, text, at: this.deps.now(), act: "say" }).room;
    this.noted = text;
  }

  /** One model call for one pet, with the "writing" signal on while it lasts. */
  private async ask(pet: PetId, role: "first" | "second" | "relayed"): Promise<string> {
    const mine = ++this.writes;
    this.deps.writing?.(pet);
    // an older call that ends after a newer one began must not switch the dots off for the newer one (issue 4)
    try { return await this.deps.model(pet, heard(this.room, pet), role); } finally { if (mine === this.writes) this.deps.writing?.(null); }
  }

  private takeNote(text: string): boolean {
    if (this.noted !== text) return false;
    this.noted = null;
    return true;
  }

  /** The person drops everything: a touch, a new message or the program closing. Lines still waiting for a model are thrown away. */
  cancel() {
    this.token++;
    // the three dots go off at once (Quiet, a touch): a call still pending must not keep them on until it returns, and its late end must not touch them (#11)
    this.writes++;
    this.deps.writing?.(null);
  }

  /** A pet went in: its line is dropped if it was still being written, and it speaks no more this turn. */
  tucked(pet: PetId) { this.gone.add(pet); }

  /** The person says something to `to` (one pet or both) while `present` are on the screen. Resolves when the turn is over or cancelled. */
  async person(text: string, to: PetId[], present: PetId[]): Promise<void> {
    const my = ++this.token;
    this.gone = new Set();
    if (!this.takeNote(text)) this.room = addTurn(this.room, { from: "person", to, text, at: this.deps.now(), act: "say" }).room;
    const p = plan(to, present, this.lastSpoken);
    const both = p.speakers.length === 2;
    if (p.speakers.length === 0 && present.length > 0) {
      // the pet addressed is away: the pet on the screen only glances; the call command stays local (ADR-0139)
      this.gesture(present[0]);
      return;
    }
    for (let i = 0; i < p.speakers.length; i++) {
      const pet = p.speakers[i];
      if (i > 0) { await this.deps.sleep(this.deps.beat()); if (my !== this.token) return; }
      if (my !== this.token || this.gone.has(pet)) return;
      const role = i === 0 ? "first" : "second";
      const prof = this.profiles[pet];
      if (!prof.speaksToPerson || this.deps.quiet() || !this.deps.allow(pet)) { this.gesture(pet); continue; } // a pet that never speaks, Quiet, or the gate: a gesture
      let raw: string;
      try { raw = await this.ask(pet, role); } catch { if (my === this.token && !this.gone.has(pet)) this.gesture(pet); continue; }
      if (my !== this.token || this.gone.has(pet)) return; // the turn was cancelled or the pet went in while it was being written
      if (this.deps.quiet()) { this.gesture(pet); break; } // Quiet turned on while the call was pending: no line, and the next pet is not asked (the cost of the call already made is not undone)
      const u = parseUtterance(raw);
      const text = clip(u.text, prof.maxWords);
      const mayPass = role === "second" && prof.mayPass;
      if (!text || (u.pass && mayPass)) { this.pass(pet, mayPass && u.pass); continue; }
      // an aside to the other pet: only the second speaker of a turn to both, one line, addressed to the other; anything else goes to the person
      const other = pet === "peak" ? "paws" : "peak";
      const aside = both && role === "second" && prof.speaksToPet && u.to.includes(other);
      // in a turn to both the first line is said in the room: the other pet hears it (and may pass or answer); in a turn to one pet nothing is overheard
      const first = both && role === "first";
      this.say(pet, text, u.mood, aside ? [other] : first ? ["person", other] : ["person"]);
    }
  }

  /** The person asks `via` to ask `target` (situation 8, one hop): `via` turns to `target` (one line of its own is not written: no call), then `target` answers the
   *  person. Both must be present and `via` must relay; otherwise it is an ordinary message to `via`. */
  async relay(text: string, via: PetId, target: PetId, present: PetId[]): Promise<void> {
    if (!present.includes(via) || !present.includes(target) || !this.profiles[via].relays) return this.person(text, [via], present.filter((p) => p === via || p === target));
    const my = ++this.token;
    this.gone = new Set();
    if (!this.takeNote(text)) this.room = addTurn(this.room, { from: "person", to: [via, target], text, at: this.deps.now(), act: "say" }).room;
    const t = addTurn(this.room, { from: via, to: [target], text: "", at: this.deps.now(), act: "turn" });
    this.room = t.room;
    this.emit({ pet: via, act: "turn", text: "", mood: "neutral", to: [target], turnId: t.turn.id });
    await this.deps.sleep(this.deps.beat());
    if (my !== this.token || this.gone.has(target) || this.gone.has(via)) return;
    const prof = this.profiles[target];
    if (!prof.speaksToPerson || this.deps.quiet() || !this.deps.allow(target)) { this.gesture(target); return; }
    let raw: string;
    try { raw = await this.ask(target, "relayed"); } catch { if (my === this.token && !this.gone.has(target)) this.gesture(target); return; }
    if (my !== this.token || this.gone.has(target)) return;
    if (this.deps.quiet()) { this.gesture(target); return; } // Quiet turned on while the call was pending
    const u = parseUtterance(raw);
    const line = clip(u.text, prof.maxWords);
    if (!line) { this.gesture(target); return; } // the pet asked must answer: an empty line is a gesture, never a pass
    this.say(target, line, u.mood, ["person"]);
  }

  private say(pet: PetId, text: string, mood: string, to: Party[]) {
    const r = addTurn(this.room, { from: pet, to, text, at: this.deps.now(), act: "say" });
    this.room = r.room;
    this.lastSpoken = pet;
    this.emit({ pet, act: "say", text, mood, to, turnId: r.turn.id });
  }

  private pass(pet: PetId, chosen: boolean) {
    const r = addTurn(this.room, { from: pet, to: ["person"], text: "", at: this.deps.now(), act: chosen ? "pass" : "gesture" });
    this.room = r.room;
    this.emit({ pet, act: chosen ? "pass" : "gesture", text: "", mood: "neutral", to: ["person"], turnId: r.turn.id });
  }

  private gesture(pet: PetId) { this.pass(pet, false); }
}

export interface HistoryTurn { role: "user" | "model"; text: string }

/** What a pet heard, as the turns a model is given: its own lines are the model's, the person's are the user's, and what the other pet said is
 *  told to it as heard in the room. Neighbours of one role are joined; the first turn is always the user's. */
export function toHistory(view: Turn[], pet: PetId, profiles: Profiles = loadProfiles()): HistoryTurn[] {
  const out: HistoryTurn[] = [];
  for (const t of view) {
    if (t.act !== "say") continue;
    const role: "user" | "model" = t.from === pet ? "model" : "user";
    const text = t.from === pet || t.from === "person" ? t.text : `(${profiles[t.from].name} said: ${t.text})`;
    const last = out[out.length - 1];
    if (last && last.role === role) last.text += `\n${text}`;
    else out.push({ role, text });
  }
  while (out.length > 0 && out[0].role === "model") out.shift();
  return out;
}

/** The situation layer (L3) for one call: who is present, who was spoken to, and what this pet may do now. Built by the code each time. */
export function situation(pet: PetId, role: "first" | "second" | "relayed", both: boolean, profiles: Profiles = loadProfiles(), callMe = "", lang = ""): string {
  const me = profiles[pet];
  const other = profiles[pet === "peak" ? "paws" : "peak"];
  const parts = [
    `Two pets live on this desktop: ${profiles.peak.name}, ${profiles.peak.species}, and ${profiles.paws.name}, ${profiles.paws.species}. You are ${me.name}.`,
    both ? "The person is talking to both of you." : "The person is talking to you.",
  ];
  if (role === "relayed") parts.splice(1, 1, `The person asked ${other.name} to ask you something, and ${other.name} has turned to you.`, "Answer the person's question as yourself, in one or two short lines.");
  else if (!both) parts.push("Answer in one or two short lines.");
  else if (role === "first") parts.push("Answer in one or two short lines; the other pet will hear you.");
  else {
    const say = `${other.name} has just answered in the room (you see it as a line in brackets). Add something of your own in one or two short lines`;
    const pass = me.mayPass ? ", or answer only [pass] if you have nothing to add" : "";
    const aside = me.speaksToPet ? `. To speak to ${other.name} instead of the person, start your line with [to:${other.id}]` : "";
    parts.push(`${say}${pass}${aside}.`);
  }
  parts.push("Never mention a pet's words as if the person had said them.");
  // the voice texts are written in English and a small model follows them into English: the language is said again, last, for every pet. It is the language
  // the person writes in (the model reads it from their last message); the language chosen in Settings is only the one to fall back on.
  const language = lang === "vi" ? "Vietnamese" : lang === "ja" ? "Japanese" : lang === "en" ? "English" : "";
  if (language) parts.push(`Always reply in the language the person is writing in, taken from their last message, even when it is not ${language}; if their message does not show a language, reply in ${language}. Whatever language the other pet or these notes use, do not follow it.`);
  if (callMe) parts.push(`The person likes to be called ${callMe}; both of you call them that.`);
  if (me.note) parts.push(me.note);
  return parts.join(" ");
}
