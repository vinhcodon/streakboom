// The ground map (PC-6, ADR-0043, ADR-0044): a coarse grid of what is where on the monitor the cat is on, with an opaque
// number per cell for the window there (spec/10). Taken only when the user allowed it and the cat is about to move, kept in
// memory, never written or sent. This module reads a map; it takes none.

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
  /** An opaque number for the window at each cell (0: none, the desktop, the taskbar): cells with the same number are the
   *  same window, so a boundary between two numbers is an edge. Absent in a map made without it (then only kinds are known). */
  ids?: number[];
}

export const kindAt = (m: GroundMap, col: number, row: number): GroundKind | null => (col < 0 || row < 0 || col >= m.cols || row >= m.rows ? null : m.cells[row * m.cols + col]);
const solid = (k: GroundKind | null) => k === "app" || k === "foreground";
const open = (k: GroundKind | null) => k === "desktop";

/** Which region a cell belongs to: "w<id>" for a window, else its kind ("desktop", "taskbar"...); null outside the map. */
export function regionAt(m: GroundMap, col: number, row: number): string | null {
  const k = kindAt(m, col, row);
  if (k === null) return null;
  const id = m.ids?.[row * m.cols + col] ?? 0;
  return id ? `w${id}` : k;
}

/**
 * Whether a window cell has an edge on its top: with region numbers, the cell above belongs to a different region (a window
 * in front of another, a dialog, a popup, bare desktop: any boundary), and it is not the taskbar; without them, only bare
 * desktop above counts (the first version of the perch, before the full-screen screens were thought of).
 */
function topEdge(m: GroundMap, col: number, row: number): boolean {
  if (!solid(kindAt(m, col, row))) return false;
  const above = kindAt(m, col, row - 1);
  if (above === null || above === "taskbar") return false;
  if (m.ids) return regionAt(m, col, row - 1) !== regionAt(m, col, row);
  return open(above);
}

/**
 * Where Peak could stand: a window cell with an edge on its top (see `topEdge`). Returns the cell and the physical point at
 * the middle of its top edge.
 */
export function ledges(m: GroundMap): { col: number; row: number; x: number; y: number }[] {
  const out: { col: number; row: number; x: number; y: number }[] = [];
  for (let r = 1; r < m.rows; r++)
    for (let c = 0; c < m.cols; c++)
      if (topEdge(m, c, r)) out.push({ col: c, row: r, x: Math.round(m.x + ((c + 0.5) * m.w) / m.cols), y: Math.round(m.y + (r * m.h) / m.rows) });
  return out;
}

/**
 * Room for the cat over a ledge: `rows` cell rows above it that are not the window it stands on and not the taskbar (with
 * region numbers), or bare desktop (without). The rows above must exist: a ledge in the top rows has no room.
 */
export function headroomClear(m: GroundMap, col: number, row: number, rows: number): boolean {
  const below = regionAt(m, col, row);
  for (let k = 1; k <= rows; k++) {
    const k2 = kindAt(m, col, row - k);
    if (k2 === null || k2 === "taskbar") return false;
    if (m.ids ? regionAt(m, col, row - k) === below : !open(k2)) return false;
  }
  return true;
}

/** The share of the monitor that is bare desktop, 0..1 (a covered screen has none, so there is nowhere quiet to go). */
export const desktopShare = (m: GroundMap): number => (m.cells.length ? m.cells.filter(open).length / m.cells.length : 0);

/** A one-line summary for the debugger and the log, with no more than counts. */
export function summary(m: GroundMap): string {
  const n = (k: GroundKind) => m.cells.filter((c) => c === k).length;
  const regions = m.ids ? new Set(m.ids.filter((i) => i !== 0)).size : null;
  return `${m.cols}x${m.rows}: desktop ${n("desktop")}, taskbar ${n("taskbar")}, window ${n("app")}, in front ${n("foreground")}, other ${m.cells.length - n("desktop") - n("taskbar") - n("app") - n("foreground")}${regions === null ? "" : `, ${regions} windows`}`;
}
