// Getting out from under a window that covers the cat (the Start menu, Search: windows of a higher layer that Peak cannot be
// raised over). The shape of such a window cannot be had from its rectangle (the Start menu's window is as big as the whole
// screen, only its flyout answers a touch), so the page tries places: this module lists them, nearest first, and the page asks
// Rust which of them are free of the cover. Pure; all boxes are physical px, the moves are logical px (right and down positive).

export interface Box {
  x: number;
  y: number;
  r: number;
  b: number;
}

/** The points of the cat's body that are asked about: its middle and four points around it. */
export function bodyPoints(cat: Box): [number, number][] {
  const w = cat.r - cat.x;
  const h = cat.b - cat.y;
  const at = (fx: number, fy: number): [number, number] => [Math.round(cat.x + w * fx), Math.round(cat.y + h * fy)];
  return [at(0.5, 0.5), at(0.25, 0.3), at(0.75, 0.3), at(0.25, 0.8), at(0.75, 0.8)];
}

/**
 * The places the cat could hop to, nearest first, that stay inside the work area: sideways in steps, then up and down in steps.
 * A vertical place comes before a sideways one only when it is much shorter (`VERTICAL_BONUS_PX`), because a cat hops along the
 * floor more naturally than up into the air.
 */
export const VERTICAL_BONUS_PX = 160;
export function escapePlaces(cat: Box, work: Box, scale: number, stepPx = 80, max = 40): { dx: number; dy: number }[] {
  const step = stepPx * scale;
  const out: { dx: number; dy: number; cost: number }[] = [];
  for (let k = 1; k <= max; k++) {
    for (const sign of [1, -1]) {
      const dx = sign * k * step;
      if (cat.x + dx >= work.x && cat.r + dx <= work.r) out.push({ dx, dy: 0, cost: Math.abs(dx) });
      const dy = sign * k * step;
      if (cat.y + dy >= work.y && cat.b + dy <= work.b) out.push({ dx: 0, dy, cost: Math.abs(dy) + VERTICAL_BONUS_PX * scale });
    }
  }
  out.sort((a, b) => a.cost - b.cost);
  return out.map((p) => ({ dx: Math.round(p.dx / scale), dy: Math.round(p.dy / scale) }));
}
