// Who is on the screen, Peak and Paws (ADR-0139). Pure logic; the window code and the file come later.
// The rule has no setting: the last state decides. Start with the pets that were out; with none out, the tray brings out the one
// tucked away last; the other comes out only when the person asks the pet on the screen to call it; a pet comes out where it went in;
// the tray sends everyone in. The state lives in its own file (duo.json), not in pet.json: a Stable build rewrites pet.json and
// drops the fields it does not know (see channel-data.test.ts), so a field there would be lost.

export type PetId = "peak" | "paws";
export const PETS: readonly PetId[] = ["peak", "paws"];

export type Edge = "left" | "right" | "top" | "bottom";
/** Where a pet last went in: an edge of a monitor and the position along it (0..1). `monitor` is an id the window layer gives. */
export interface Entrance { monitor: string | null; edge: Edge; along: number }

export interface PetPresence {
  out: boolean;
  /** When it last went in (ms since the epoch); 0 if never. The latest one comes out on a tray click. */
  tuckedAt: number;
  entrance: Entrance | null;
}
export interface DuoState { v: 1; pets: Record<PetId, PetPresence> }

const EDGES: readonly Edge[] = ["left", "right", "top", "bottom"];

function emptyPresence(out: boolean): PetPresence { return { out, tuckedAt: 0, entrance: null }; }

/** A new state is today's: Peak alone on the screen, Paws away and never tucked. */
export function defaultDuo(): DuoState {
  return { v: 1, pets: { peak: emptyPresence(true), paws: emptyPresence(false) } };
}

function parseEntrance(x: unknown): Entrance | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.edge !== "string" || !EDGES.includes(o.edge as Edge)) return null;
  const along = typeof o.along === "number" && Number.isFinite(o.along) ? Math.min(1, Math.max(0, o.along)) : 0.5;
  return { monitor: typeof o.monitor === "string" ? o.monitor : null, edge: o.edge as Edge, along };
}

/** Reads the file; anything missing or odd gets the default, so an older or hand-edited file never fails. */
export function parseDuo(raw: string | null | undefined): DuoState {
  const d = defaultDuo();
  if (!raw) return d;
  let o: unknown;
  try { o = JSON.parse(raw); } catch { return d; }
  const pets = o && typeof o === "object" ? (o as Record<string, unknown>).pets : null;
  if (!pets || typeof pets !== "object") return d;
  for (const id of PETS) {
    const p = (pets as Record<string, unknown>)[id];
    if (!p || typeof p !== "object") continue;
    const q = p as Record<string, unknown>;
    d.pets[id] = {
      out: typeof q.out === "boolean" ? q.out : d.pets[id].out,
      tuckedAt: typeof q.tuckedAt === "number" && Number.isFinite(q.tuckedAt) && q.tuckedAt > 0 ? q.tuckedAt : 0,
      entrance: parseEntrance(q.entrance),
    };
  }
  return d;
}

export function serializeDuo(s: DuoState): string { return JSON.stringify(s); }

function copy(s: DuoState): DuoState { return { v: 1, pets: { peak: { ...s.pets.peak }, paws: { ...s.pets.paws } } }; }

export function outPets(s: DuoState): PetId[] { return PETS.filter((id) => s.pets[id].out); }

/** At start: the pets that were out come out again. Nobody out means nobody. */
export function atStart(s: DuoState): PetId[] { return outPets(s); }

/** The pet tucked away last; with no tuck on record, Peak (the first pet). */
export function lastTucked(s: DuoState): PetId {
  let best: PetId = "peak";
  let at = -1;
  for (const id of PETS) if (s.pets[id].tuckedAt > at) { at = s.pets[id].tuckedAt; best = id; }
  return best;
}

export type TrayResult = { state: DuoState; sendIn: PetId[]; bringOut: PetId[] };

/** The tray click: with any pet out, everyone goes in; with none out, the one tucked last comes out. */
export function trayClick(s: DuoState, now: number): TrayResult {
  const out = outPets(s);
  if (out.length > 0) {
    const n = copy(s);
    for (const id of out) { n.pets[id].out = false; n.pets[id].tuckedAt = now; }
    return { state: n, sendIn: out, bringOut: [] };
  }
  const id = lastTucked(s);
  const n = copy(s);
  n.pets[id].out = true;
  return { state: n, sendIn: [], bringOut: [id] };
}

/** One pet goes in (shoved away, or told to in the chat). `entrance` is where it went in. */
export function tuck(s: DuoState, id: PetId, now: number, entrance: Entrance | null): DuoState {
  if (!s.pets[id].out) return s;
  const n = copy(s);
  n.pets[id] = { out: false, tuckedAt: now, entrance: entrance ?? s.pets[id].entrance };
  return n;
}

export type CallResult = { state: DuoState; ok: boolean };

/** The person asks the pet on the screen to call the other. It works only when the caller is out and the target is not. */
export function call(s: DuoState, caller: PetId, target: PetId): CallResult {
  if (caller === target || !s.pets[caller].out || s.pets[target].out) return { state: s, ok: false };
  const n = copy(s);
  n.pets[target].out = true;
  return { state: n, ok: true };
}

export interface Monitor { id: string; x: number; y: number; w: number; h: number }

/** Where a pet that comes out should stand: the remembered entrance if its monitor is present, else the nearest valid edge of a
 *  present monitor, else the first monitor's bottom edge. Never off the screen. Returns the monitor id, the edge and `along`. */
export function resolveEntrance(e: Entrance | null, monitors: readonly Monitor[]): Entrance | null {
  if (monitors.length === 0) return null;
  const first = monitors[0];
  if (!e) return { monitor: first.id, edge: "bottom", along: 0.5 };
  const same = monitors.find((m) => m.id === e.monitor);
  return { monitor: (same ?? first).id, edge: e.edge, along: Math.min(1, Math.max(0, e.along)) };
}

export interface Rect { x: number; y: number; w: number; h: number }
/** The rectangle of a pet of size `pet` standing at an entrance, flush with the edge and inside the monitor. */
export function entranceRect(e: Entrance, mon: Monitor, pet: { w: number; h: number }): Rect {
  const span = (len: number, size: number) => Math.round(Math.max(0, len - size) * e.along);
  switch (e.edge) {
    case "left": return { x: mon.x, y: mon.y + span(mon.h, pet.h), w: pet.w, h: pet.h };
    case "right": return { x: mon.x + mon.w - pet.w, y: mon.y + span(mon.h, pet.h), w: pet.w, h: pet.h };
    case "top": return { x: mon.x + span(mon.w, pet.w), y: mon.y, w: pet.w, h: pet.h };
    default: return { x: mon.x + span(mon.w, pet.w), y: mon.y + mon.h - pet.h, w: pet.w, h: pet.h };
  }
}
