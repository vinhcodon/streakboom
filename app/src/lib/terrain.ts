// The terrain of the screen (spec/10, TT-3): surfaces Peak can stand on, found as runs of edges in the ground map. A surface
// is a horizontal edge where a window (the support) has a different region above it (the air for Peak). Pure; the page and
// the developer overlay read it, nothing here takes a map.

import { headroomClear, ledges, regionAt, type GroundMap } from "./groundmap.ts";

export interface Surface {
  /** The cell row whose top edge it is, and the first and last cell column of the run. */
  row: number;
  c0: number;
  c1: number;
  /** The physical px of the edge: its height and its left and right ends. */
  y: number;
  x0: number;
  x1: number;
  /** The region of the window it stands on, and of what is above it. */
  below: string;
  above: string;
  /** The cat has room over it (two rows above are free of the supporting window and of the taskbar). */
  roomy: boolean;
}

/** Runs of neighbouring edge cells in a row with the same region below and above become one surface. */
export function surfaces(m: GroundMap, headroomRows = 2): Surface[] {
  const cellW = m.w / m.cols;
  const out: Surface[] = [];
  const edge = ledges(m);
  const key = (c: number, r: number) => `${c},${r}`;
  const set = new Map(edge.map((l) => [key(l.col, l.row), l]));
  for (const l of edge) {
    if (set.has(key(l.col - 1, l.row))) {
      const left = regionAt(m, l.col - 1, l.row);
      const leftAbove = regionAt(m, l.col - 1, l.row - 1);
      if (left === regionAt(m, l.col, l.row) && leftAbove === regionAt(m, l.col, l.row - 1)) continue; // not the start of a run
    }
    let c1 = l.col;
    while (set.has(key(c1 + 1, l.row)) && regionAt(m, c1 + 1, l.row) === regionAt(m, l.col, l.row) && regionAt(m, c1 + 1, l.row - 1) === regionAt(m, l.col, l.row - 1)) c1++;
    let roomy = true;
    for (let c = l.col; c <= c1; c++) if (!headroomClear(m, c, l.row, headroomRows)) roomy = false;
    out.push({
      row: l.row,
      c0: l.col,
      c1,
      y: l.y,
      x0: Math.round(m.x + l.col * cellW),
      x1: Math.round(m.x + (c1 + 1) * cellW),
      below: regionAt(m, l.col, l.row) ?? "",
      above: regionAt(m, l.col, l.row - 1) ?? "",
      roomy,
    });
  }
  return out;
}

/**
 * The next surface below a point (a fall lands on it, spec/10 section 11): the nearest edge under `feet` in the cell column
 * of `feet.x`, more than `minDrop` physical px lower than the feet. Null when there is none (it then falls to the floor).
 */
export function surfaceBelow(m: GroundMap, feet: { x: number; y: number }, minDrop = 8): { col: number; row: number; y: number } | null {
  const col = Math.floor(((feet.x - m.x) / m.w) * m.cols);
  if (col < 0 || col >= m.cols) return null;
  let best: { col: number; row: number; y: number } | null = null;
  for (const l of ledges(m)) {
    if (l.col !== col || l.y < feet.y + minDrop) continue;
    if (best === null || l.y < best.y) best = { col: l.col, row: l.row, y: l.y };
  }
  return best;
}
