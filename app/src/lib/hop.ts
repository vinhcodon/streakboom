// Vertical movement (spec/07 section 2.3, ADR-0032): the cat's sprite has only a side and a front view, so it cannot
// walk diagonally. It changes row with a **hop** (a short arc, the window moves along a parabola) or a **fall**
// (gravity). Pure arithmetic: no I/O and no timers; the pet window samples the path every frame and asks Rust to put
// the window there (`move_to`). All distances are logical px, right and down positive.
//
// The numbers are first guesses; the author looks at a test build and the CPU is measured per kind before they are
// kept (spec/06: motion chosen by arithmetic alone was wrong once already).

/** The longest single hop (the larger of the two distances); a longer way is split into several hops in a row. */
export const HOP_MAX_PX = 240;
/** The arc rises at least this far above the straight line between the two places, and at most this far. */
export const HOP_APEX_MIN = 36;
export const HOP_APEX_MAX = 80;
/** Duration of a hop: a base plus a time per px, so a short hop is quick and a long one is not a dash. */
export const HOP_BASE_MS = 320;
export const HOP_MS_PER_PX = 1.4;
export const HOP_MIN_MS = 380;
export const HOP_MAX_MS = 800;
/** Gravity for a fall, logical px per second squared (a cat is not in a hurry, but a drop must not float). */
export const GRAVITY = 2600;

export interface Flight {
  /** Where the flight ends, relative to where it starts. */
  dx: number;
  dy: number;
  durationMs: number;
  /** How far the path rises above the straight line (0 for a fall). */
  apex: number;
  kind: "hop" | "fall";
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** One hop to a place `dx`, `dy` away (at most HOP_MAX_PX: longer ways go through `splitHop`). */
export function planHop(dx: number, dy: number): Flight {
  const dist = Math.hypot(dx, dy);
  // a hop up needs a little more lift than a hop down of the same size
  const apex = clamp(0.3 * dist + (dy < 0 ? 0.15 * -dy : 0), HOP_APEX_MIN, HOP_APEX_MAX);
  const durationMs = clamp(HOP_BASE_MS + HOP_MS_PER_PX * dist, HOP_MIN_MS, HOP_MAX_MS);
  return { dx, dy, durationMs, apex, kind: "hop" };
}

/** A fall of `dist` px straight down (a negative or zero distance is no flight at all). */
export function planFall(dist: number): Flight {
  const d = Math.max(0, dist);
  return { dx: 0, dy: d, durationMs: Math.sqrt((2 * d) / GRAVITY) * 1000, apex: 0, kind: "fall" };
}

/** A way longer than one hop is a chain of equal hops in a row. */
export function splitHop(dx: number, dy: number): Flight[] {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / HOP_MAX_PX));
  return Array.from({ length: n }, () => planHop(dx / n, dy / n));
}

/** Where the cat is `ms` after the flight began, relative to its start; `done` when the flight is over. */
export function flightAt(f: Flight, ms: number): { x: number; y: number; done: boolean } {
  if (f.durationMs <= 0 || ms >= f.durationMs) return { x: f.dx, y: f.dy, done: true };
  const t = Math.max(0, ms) / f.durationMs;
  if (f.kind === "fall") return { x: 0, y: f.dy * t * t, done: false }; // y = g t^2 / 2 with the duration fitted to the distance
  return { x: f.dx * t || 0, y: f.dy * t - 4 * f.apex * t * (1 - t) || 0, done: false }; // `|| 0` turns a -0 into 0
}

/** The total time of a chain of flights. */
export const totalMs = (fs: Flight[]): number => fs.reduce((a, f) => a + f.durationMs, 0);

/** Where a chain of flights has got to `ms` after it began (each flight starts where the last one ended). */
export function chainAt(fs: Flight[], ms: number): { x: number; y: number; done: boolean } {
  let ox = 0;
  let oy = 0;
  let t = Math.max(0, ms);
  for (const f of fs) {
    if (t < f.durationMs) {
      const p = flightAt(f, t);
      return { x: ox + p.x, y: oy + p.y, done: false };
    }
    t -= f.durationMs;
    ox += f.dx;
    oy += f.dy;
  }
  return { x: ox, y: oy, done: true };
}
