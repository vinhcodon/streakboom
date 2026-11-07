// Gesture detection for stroking the pet with the mouse (pure, no DOM): feed it pointer
// positions relative to the pet's sprite box, it tells you when the user is "scratching".
// A scratch is a quick back-and-forth sweep (several direction reversals, enough distance)
// within a short window. The y position picks the zone: head (upper part) or belly (lower).

export interface Pt {
  x: number;
  y: number;
  t: number; // ms
}

export interface ScratchState {
  pts: Pt[];
  lastFire: number;
}

export type Zone = "head" | "belly";

export const SCRATCH = {
  windowMs: 1300, // only the recent movement counts
  minSegment: 10, // px a stroke must travel before a turn-around is counted
  minReversals: 3,
  minPath: 110, // total distance in the window
  cooldownMs: 4500, // after a scratch fires, wait before the next one
  headZone: 0.55, // fraction of the sprite height; above this line is the head
};

// lastFire starts at -Infinity so the cooldown never blocks the very first scratch
// (pointer timestamps are small right after the page loads).
export const newScratch = (): ScratchState => ({ pts: [], lastFire: -Infinity });

/** Number of direction reversals along x, ignoring jitter smaller than `minSegment`. */
export function reversals(pts: Pt[], minSegment = SCRATCH.minSegment): number {
  if (pts.length < 2) return 0;
  let dir = 0; // -1 left, +1 right, 0 unknown
  let extreme = pts[0].x;
  let count = 0;
  for (const p of pts) {
    if (dir === 0) {
      if (Math.abs(p.x - extreme) >= minSegment) {
        dir = p.x > extreme ? 1 : -1;
        extreme = p.x;
      }
    } else if (dir === 1) {
      if (p.x > extreme) extreme = p.x;
      else if (extreme - p.x >= minSegment) {
        dir = -1;
        extreme = p.x;
        count++;
      }
    } else {
      if (p.x < extreme) extreme = p.x;
      else if (p.x - extreme >= minSegment) {
        dir = 1;
        extreme = p.x;
        count++;
      }
    }
  }
  return count;
}

export function pathLength(pts: Pt[]): number {
  let sum = 0;
  for (let i = 1; i < pts.length; i++) sum += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return sum;
}

/**
 * Add a pointer position. `size` is the sprite's height in px. Returns the new state and, when a
 * scratch just completed, the zone it happened in. Points outside the sprite reset the stroke.
 */
export function scratchStep(
  s: ScratchState,
  p: Pt,
  size: number,
  width = size
): { state: ScratchState; zone: Zone | null } {
  if (p.x < 0 || p.y < 0 || p.x > width || p.y > size) return { state: { ...s, pts: [] }, zone: null };
  const pts = [...s.pts, p].filter((q) => p.t - q.t <= SCRATCH.windowMs);
  if (p.t - s.lastFire < SCRATCH.cooldownMs) return { state: { ...s, pts }, zone: null };
  if (reversals(pts) >= SCRATCH.minReversals && pathLength(pts) >= SCRATCH.minPath) {
    const meanY = pts.reduce((a, q) => a + q.y, 0) / pts.length;
    const zone: Zone = meanY / size < SCRATCH.headZone ? "head" : "belly";
    return { state: { pts: [], lastFire: p.t }, zone };
  }
  return { state: { ...s, pts }, zone: null };
}
