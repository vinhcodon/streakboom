// Choosing a perch (TE-10c, ADR-0043): from the coarse ground map (`groundmap.ts`), a ledge near the cat that it can hop up
// to: a window's top edge (a boundary with whatever is above it: bare desktop, or another window it stands in front of), enough room over it for the cat, and not too far or too
// high for one hop chain. Pure: it returns the way to go in logical px, the page does the hopping. Only used when the
// user switched the ground map on.

import { headroomClear, ledges, type GroundMap } from "./groundmap.ts";

export interface PerchLimits {
  /** The farthest sideways, logical px. */
  maxDx: number;
  /** The highest rise, logical px, and the lowest (a ledge below is a fall, not a hop). */
  maxRise: number;
  minRise: number;
  /** Rows of bare desktop needed above the ledge for the cat to sit (the cat is about 120 px high). */
  headroomRows: number;
  /** Keep this far from the left and right edges of the map, logical px. */
  edgeMargin: number;
}

export const PERCH_LIMITS: PerchLimits = { maxDx: 700, maxRise: 420, minRise: 70, headroomRows: 2, edgeMargin: 60 };

export interface Perch {
  /** The way to go from where the cat stands, logical px: dx sideways, dy up is negative. */
  dx: number;
  dy: number;
  col: number;
  row: number;
}

/**
 * The ledge to hop up to, or null. `feet` is where the cat's feet are, in physical px (the same space as the map); `scale`
 * turns physical px into logical ones. Of the usable ledges the nearest sideways wins; `pick` (0..1) breaks ties and
 * lets the page choose among the two nearest now and then.
 */
export function choosePerch(map: GroundMap, feet: { x: number; y: number }, scale: number, lim: PerchLimits = PERCH_LIMITS, pick = 0): Perch | null {
  const usable = ledges(map)
    .filter((l) => headroomClear(map, l.col, l.row, lim.headroomRows))
    .map((l) => ({ l, dx: (l.x - feet.x) / scale, dy: (l.y - feet.y) / scale }))
    .filter(({ l, dx, dy }) => {
      const rise = -dy;
      const left = (l.x - map.x) / scale;
      const right = (map.x + map.w - l.x) / scale;
      return Math.abs(dx) <= lim.maxDx && rise >= lim.minRise && rise <= lim.maxRise && left >= lim.edgeMargin && right >= lim.edgeMargin;
    })
    .sort((a, b) => Math.abs(a.dx) - Math.abs(b.dx) || a.l.col - b.l.col);
  if (usable.length === 0) return null;
  const chosen = usable[Math.min(usable.length - 1, Math.floor(pick * Math.min(2, usable.length)))];
  return { dx: Math.round(chosen.dx), dy: Math.round(chosen.dy), col: chosen.l.col, row: chosen.l.row };
}
