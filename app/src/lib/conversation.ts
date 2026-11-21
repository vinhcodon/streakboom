// The talk among the person, Peak and Paws (ADR-0141). Pure logic, no window and no model: the model, the clock and the gates come in as
// dependencies, so the whole thing is tested with a scripted model and a fake clock (as scene.ts is).
//
// The cut: the model decides words; this file (the code) decides who may speak, in what order, how many lines, and what is dropped.
// One room log holds every turn; a pet is shown only the turns it heard (it spoke them, or they were said to it, or to both).

import { PETS, type PetId } from "./duo.ts";

export type Party = "person" | PetId;
export type Act = "say" | "pass" | "gesture";

export interface Turn { id: number; from: Party; to: Party[]; text: string; at: number; act: Act }
export interface Room { turns: Turn[]; nextId: number }

const KEEP = 40; // turns kept in the room
export function newRoom(): Room { return { turns: [], nextId: 1 }; }

export function addTurn(room: Room, t: Omit<Turn, "id">): { room: Room; turn: Turn } {
  const turn: Turn = { ...t, id: room.nextId };
  return { room: { turns: [...room.turns, turn].slice(-KEEP), nextId: room.nextId + 1 }, turn };
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

/** The reply of a model: leading tags `[mood]`, `[pass]` and `[to:paws]` (any order) and then the words. Untrusted: the director checks it. */
export function parseUtterance(raw: string): Utterance {
  let rest = raw.trim();
  let mood = "neutral";
  let pass = false;
  const to: PetId[] = [];
  for (;;) {
    const m = /^\[([a-z:]+)\]\s*/i.exec(rest);
    if (!m) break;
    const tag = m[1].toLowerCase();
    if (tag === "pass") pass = true;
    else if (tag.startsWith("to:")) { const id = tag.slice(3) as PetId; if (PETS.includes(id) && !to.includes(id)) to.push(id); }
    else mood = tag;
    rest = rest.slice(m[0].length);
  }
  return { text: rest.trim(), mood, pass, to };
}

function clip(text: string, maxWords: number): string {
  const w = text.split(/\s+/).filter(Boolean);
  return w.length <= maxWords ? text : w.slice(0, maxWords).join(" ");
}

export interface Line { pet: PetId; act: Act; text: string; mood: string; to: Party[]; turnId: number }

export interface Deps {
  /** One model call for one pet: the turns it heard, and whether it speaks first or second. Rejects on any failure. */
  model(pet: PetId, view: Turn[], role: "first" | "second"): Promise<string>;
  /** The gate of quota and attention for one more call by this pet; false makes the line a gesture. */
  allow(pet: PetId): boolean;
  /** Quiet or no words wanted: gestures only, no call. */
  quiet(): boolean;
  sleep(ms: number): Promise<void>;
  /** The beat between the first line and the second (a short random range in the program, fixed in a test). */
  beat(): number;
  now(): number;
}

export class Conversation {
  room: Room = newRoom();
  lastSpoken: PetId | null = null;
  private token = 0;
  private gone = new Set<PetId>();

  private deps: Deps;
  private emit: (l: Line) => void;
  private maxWords: number;

  constructor(deps: Deps, emit: (l: Line) => void, maxWords = 40) {
    this.deps = deps;
    this.emit = emit;
    this.maxWords = maxWords;
  }

  /** The person drops everything: a touch, a new message or the program closing. Lines still waiting for a model are thrown away. */
  cancel() { this.token++; }

  /** A pet went in: its line is dropped if it was still being written, and it speaks no more this turn. */
  tucked(pet: PetId) { this.gone.add(pet); }

  /** The person says something to `to` (one pet or both) while `present` are on the screen. Resolves when the turn is over or cancelled. */
  async person(text: string, to: PetId[], present: PetId[]): Promise<void> {
    const my = ++this.token;
    this.gone = new Set();
    this.room = addTurn(this.room, { from: "person", to, text, at: this.deps.now(), act: "say" }).room;
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
      if (this.deps.quiet() || !this.deps.allow(pet)) { this.gesture(pet); continue; }
      let raw: string;
      try { raw = await this.deps.model(pet, heard(this.room, pet), role); } catch { if (my === this.token && !this.gone.has(pet)) this.gesture(pet); continue; }
      if (my !== this.token || this.gone.has(pet)) return; // the turn was cancelled or the pet went in while it was being written
      const u = parseUtterance(raw);
      const text = clip(u.text, this.maxWords);
      if (!text || (u.pass && role === "second")) { this.pass(pet, role === "second" && u.pass); continue; }
      // an aside to the other pet: only the second speaker of a turn to both, one line, addressed to the other; anything else goes to the person
      const other = pet === "peak" ? "paws" : "peak";
      const aside = both && role === "second" && u.to.includes(other);
      // in a turn to both the first line is said in the room: the other pet hears it (and may pass or answer); in a turn to one pet nothing is overheard
      const first = both && role === "first";
      this.say(pet, text, u.mood, aside ? [other] : first ? ["person", other] : ["person"]);
    }
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
