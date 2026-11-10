// The ground map (PC-6, ADR-0043): a coarse grid of what is where on the monitor the cat is on. Taken only when the user
// allowed it and the cat is about to move, kept in memory, never written or sent. This module reads a map; it takes none.

/** The kinds the ground sense reports (ground.rs). */
export type GroundKind = "desktop" | "taskbar" | "app" | "foreground" | "own" | "unknown";

export interface GroundMap {
  /** The monitor's work area, physical px. */
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  rows: number;
  /** The kind at the centre of each cell, row by row from the top left. */
  cells: GroundKind[];
}

export const kindAt = (m: GroundMap, col: number, row: number): GroundKind | null => (col < 0 || row < 0 || col >= m.cols || row >= m.rows ? null : m.cells[row * m.cols + col]);
const solid = (k: GroundKind | null) => k === "app" || k === "foreground";
const open = (k: GroundKind | null) => k === "desktop";

/**
 * Where Peak could stand: a cell that is a window with the bare desktop right above it (a ledge, the top edge of a window
 * with nothing in front of the wallpaper over it). Returns the cell and the physical point at the middle of its top edge.
 */
export function ledges(m: GroundMap): { col: number; row: number; x: number; y: number }[] {
  const out: { col: number; row: number; x: number; y: number }[] = [];
  for (let r = 1; r < m.rows; r++)
    for (let c = 0; c < m.cols; c++)
      if (solid(kindAt(m, c, r)) && open(kindAt(m, c, r - 1)))
        out.push({ col: c, row: r, x: Math.round(m.x + ((c + 0.5) * m.w) / m.cols), y: Math.round(m.y + (r * m.h) / m.rows) });
  return out;
}

/** The share of the monitor that is bare desktop, 0..1 (a covered screen has none, so there is nowhere quiet to go). */
export const desktopShare = (m: GroundMap): number => (m.cells.length ? m.cells.filter(open).length / m.cells.length : 0);

/** A one-line summary for the debugger and the log, with no more than counts. */
export function summary(m: GroundMap): string {
  const n = (k: GroundKind) => m.cells.filter((c) => c === k).length;
  return `${m.cols}x${m.rows}: desktop ${n("desktop")}, taskbar ${n("taskbar")}, window ${n("app")}, in front ${n("foreground")}, other ${m.cells.length - n("desktop") - n("taskbar") - n("app") - n("foreground")}`;
}
