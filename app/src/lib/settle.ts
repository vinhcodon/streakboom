// Where the cat stands so that it does not cover anything (E29, round 4; the author's idea: Peak leans toward places with room, so that
// it does not hide the content). Pure: it reads the picture of the screen (the mask of empty cells and the stand spots) and says whether the
// cat's body covers something and, if so, the nearest place that is clear and that one walk along the floor or one hop reaches.
// It never reads what is drawn, only whether cells are empty (the picture's own rule, ADR-0119).
import type { Seen, StandSpot } from "./picture.ts";

export const SETTLE = {
  /** The cat covers something when at least this share of the cells under its body are not empty. */
  coverHigh: 0.3,
  /** A place is clear when at most this share is not empty. */
  coverLow: 0.15,
  /** When no place is clear, the least covering place is taken if it covers at least this much less than here, and no more than `fallbackMax` (H31). */
  fallbackGain: 0.25,
  fallbackMax: 0.5,
  /** Before it dozes off the bar is lower: a cat that is about to sleep should not cover even a little (H29). */
  coverBeforeSleep: 0.15,
};

/** The share of cells that are not empty in the cat's box: `w` cells wide centred on `col`, `h` rows up from the feet row `row`. Off-screen cells count as empty. */
export function boxCoverage(seen: Seen, col: number, row: number, w: number, h: number): number {
  const x0 = Math.round(col - w / 2);
  const x1 = x0 + w - 1;
  const y0 = row - h + 1;
  let n = 0;
  let busy = 0;
  for (let y = y0; y <= row; y++) {
    for (let x = x0; x <= x1; x++) {
      n++;
      if (x < 0 || x >= seen.gw || y < 0 || y >= seen.gh) continue;
      if (!seen.empty[y * seen.gw + x]) busy++;
    }
  }
  return n === 0 ? 0 : busy / n;
}

export interface SettleMove {
  kind: "walk" | "hop";
  /** The cell column and the feet row of the place. */
  col: number;
  row: number;
  /** How much the cat covers where it is now. */
  hereCover: number;
}

/**
 * `cat`: the cell of the feet; `catCells`: the cat's size in cells; `spots`: the stand spots (`headroom` rows of empty space above each);
 * `hopCells`: the longest hop in cells. Null when the cat covers little where it is, or there is no better place within reach.
 */
export function chooseSettle(seen: Seen, cat: { col: number; row: number }, catCells: number, spots: readonly StandSpot[], hopCells: number, coverHigh: number = SETTLE.coverHigh): SettleMove | null {
  const here = boxCoverage(seen, cat.col, cat.row, catCells, catCells);
  if (here < coverHigh) return null;
  const half = Math.ceil(catCells / 2);
  let best: SettleMove | null = null;
  let bestCost = Infinity;
  let least: SettleMove | null = null; // the least covering place seen, the fallback when none is clear (H31)
  let leastCover = Infinity;
  let leastCost = Infinity;
  const consider = (m: Omit<SettleMove, "hereCover">, cost: number, cover: number) => {
    if (cover <= SETTLE.coverLow && cost < bestCost) {
      bestCost = cost;
      best = { ...m, hereCover: here };
    }
    if (cover < leastCover - 1e-9 || (Math.abs(cover - leastCover) < 1e-9 && cost < leastCost)) {
      leastCover = cover;
      leastCost = cost;
      least = { ...m, hereCover: here };
    }
  };
  // along the floor: the same row, the nearest clear stretch
  if (cat.row >= seen.gh - 4) {
    for (let col = half; col < seen.gw - half; col++) {
      if (col === cat.col) continue;
      consider({ kind: "walk", col, row: cat.row }, Math.abs(col - cat.col), boxCoverage(seen, col, cat.row, catCells, catCells));
    }
  }
  // along the ledge it stands on: a clear stretch of the same run (round 6)
  const own = spots.find((u) => Math.abs(u.y - cat.row) <= 1 && cat.col >= u.x0 && cat.col <= u.x1);
  if (own) {
    for (let col = own.x0 + half; col <= own.x1 - half; col++) {
      if (col === cat.col) continue;
      consider({ kind: "walk", col, row: cat.row }, Math.abs(col - cat.col), boxCoverage(seen, col, cat.row, catCells, catCells));
    }
  }
  // one hop to a spot with room above it, at the same level or higher
  for (const s of spots) {
    if (s.headroom < catCells) continue;
    const rise = cat.row - s.y;
    if (rise < 0 || rise > hopCells) continue;
    const col = Math.min(Math.max(cat.col, s.x0 + half), s.x1 - half);
    if (col < s.x0 + half - 1 || col > s.x1 - half + 1) continue; // the spot is narrower than the cat
    if (Math.max(0, Math.max(cat.col, col) - Math.min(cat.col, col)) > hopCells) continue;
    consider({ kind: "hop", col, row: s.y }, Math.abs(col - cat.col) + 2 * rise + 10, boxCoverage(seen, col, s.y, catCells, catCells));
  }
  if (best) return best;
  const l = least as SettleMove | null;
  return l && here - leastCover >= SETTLE.fallbackGain && leastCover <= SETTLE.fallbackMax ? l : null;
}

/** The back-off (ADR-0123, manners 3 and 6): at least `restMs` after a move, and after `burst` moves within `windowMs` no more for `pauseMs`. `moves`: the times of the moves so far. */
export const BACKOFF = { restMs: 60_000, burst: 3, windowMs: 10 * 60_000, pauseMs: 10 * 60_000 };
export function settleAllowed(moves: readonly number[], now: number): boolean {
  if (moves.length === 0) return true;
  const last = Math.max(...moves);
  if (now - last < BACKOFF.restMs) return false;
  const recent = moves.filter((t) => now - t < BACKOFF.windowMs);
  if (recent.length >= BACKOFF.burst && now - last < BACKOFF.pauseMs) return false;
  return true;
}
