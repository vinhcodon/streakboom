// The screen picture sense, stage 1 and 2 (ADR-0119, docs/plans/screen-picture-plan.md): from a small grey grid (see picture.rs)
// find where the brightness changes sharply (edges), group the edge cells into horizontal and vertical segments (candidate ledges and
// walls), and mark the empty space. Pure: it reads the grid, returns plain numbers and a mask, and keeps nothing; the grid is the
// caller's to drop. No colour, no text, no identity: a segment is a line and nothing more.

export interface Grid {
  gw: number;
  gh: number;
  /** Grey levels 0 to 255, row by row, gw * gh of them. */
  data: ArrayLike<number>;
}

export const PICTURE = {
  /** The weakest change of grey (of 255) that counts as an edge, however flat the picture is. */
  minThreshold: 16,
  /** The threshold is this share of the 95th percentile of the strengths, so a dark theme and a light one are read alike. */
  relative: 0.35,
  /** A horizontal segment is at least this many cells long (about 60 px on a 1920 px screen). */
  minRunH: 6,
  /** A vertical segment is at least this many cells long. */
  minRunV: 8,
  /** A gap of this many cells inside a run does not break it. */
  gap: 1,
  /** The most rows looked at above a segment for room. */
  roomMax: 60,
  /** Share of cells that may be edges in a band that still counts as empty. */
  emptyShare: 0.1,
};

export interface HSeg {
  x0: number; // first cell (inclusive)
  x1: number; // last cell (inclusive)
  y: number;
  strength: number; // mean change of grey across the line
  roomAbove: number; // empty rows right above it, at most PICTURE.roomMax
  brighterBelow: boolean; // true: darker above the line, brighter below
}

export interface VSeg {
  x: number;
  y0: number;
  y1: number;
  strength: number;
}

export interface Seen {
  gw: number;
  gh: number;
  threshold: number;
  edgeCells: number;
  hsegs: HSeg[];
  vsegs: VSeg[];
  /** 1 where the cell and its eight neighbours have no real change, gw * gh. */
  empty: Uint8Array;
}

/** The 95th percentile of the strengths, by a histogram of the 0..255 levels. */
function percentile95(strength: Uint8Array): number {
  const hist = new Array<number>(256).fill(0);
  for (let i = 0; i < strength.length; i++) hist[strength[i]]++;
  const target = strength.length * 0.95;
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += hist[v];
    if (acc >= target) return v;
  }
  return 255;
}

export function analyse(g: Grid, opt: Partial<typeof PICTURE> = {}): Seen {
  const P = { ...PICTURE, ...opt };
  const { gw, gh, data } = g;
  const empty = new Uint8Array(gw * gh);
  const none: Seen = { gw, gh, threshold: P.minThreshold, edgeCells: 0, hsegs: [], vsegs: [], empty };
  if (gw < 5 || gh < 5 || data.length < gw * gh) return none;
  const at = (x: number, y: number) => data[y * gw + x] as number;
  // central differences on the inside; strength = the larger, and which way the change goes
  const gx = new Int16Array(gw * gh);
  const gy = new Int16Array(gw * gh);
  const str = new Uint8Array(gw * gh);
  for (let y = 1; y < gh - 1; y++)
    for (let x = 1; x < gw - 1; x++) {
      const i = y * gw + x;
      gx[i] = at(x + 1, y) - at(x - 1, y);
      gy[i] = at(x, y + 1) - at(x, y - 1);
      str[i] = Math.min(255, Math.max(Math.abs(gx[i]), Math.abs(gy[i])));
    }
  const T = Math.max(P.minThreshold, Math.round(P.relative * percentile95(str)));
  // thin the edges: a horizontal edge cell is the strongest of its column neighbours (and a vertical one of its row neighbours)
  const hEdge = new Uint8Array(gw * gh);
  const vEdge = new Uint8Array(gw * gh);
  let edgeCells = 0;
  for (let y = 1; y < gh - 1; y++)
    for (let x = 1; x < gw - 1; x++) {
      const i = y * gw + x;
      const ay = Math.abs(gy[i]);
      const ax = Math.abs(gx[i]);
      if (ay >= T && ay >= ax && ay >= Math.abs(gy[i - gw]) && ay > Math.abs(gy[i + gw])) {
        hEdge[i] = 1;
        edgeCells++;
      } else if (ax >= T && ax > ay && ax >= Math.abs(gx[i - 1]) && ax > Math.abs(gx[i + 1])) {
        vEdge[i] = 1;
        edgeCells++;
      }
    }
  // empty space: no change worth a third of the threshold in the cell or around it
  const calm = new Uint8Array(gw * gh);
  for (let i = 0; i < calm.length; i++) calm[i] = str[i] * 3 < T ? 1 : 0;
  for (let y = 1; y < gh - 1; y++)
    for (let x = 1; x < gw - 1; x++) {
      let all = 1;
      for (let dy = -1; dy <= 1 && all; dy++) for (let dx = -1; dx <= 1; dx++) if (!calm[(y + dy) * gw + x + dx]) all = 0;
      empty[y * gw + x] = all;
    }
  // horizontal runs
  const hsegs: HSeg[] = [];
  for (let y = 1; y < gh - 1; y++) {
    let x = 1;
    while (x < gw - 1) {
      if (!hEdge[y * gw + x]) {
        x++;
        continue;
      }
      let x1 = x;
      let miss = 0;
      for (let k = x + 1; k < gw - 1; k++) {
        if (hEdge[y * gw + k]) {
          x1 = k;
          miss = 0;
        } else if (++miss > P.gap) break;
      }
      if (x1 - x + 1 >= P.minRunH) {
        let sum = 0;
        let n = 0;
        let sign = 0;
        for (let k = x; k <= x1; k++) {
          sum += Math.abs(gy[y * gw + k]);
          n++;
          sign += gy[y * gw + k];
        }
        hsegs.push({ x0: x, x1, y, strength: Math.round(sum / n), roomAbove: roomAbove(str, gw, y, x, x1, T, P), brighterBelow: sign > 0 });
      }
      x = x1 + 1;
    }
  }
  // vertical runs
  const vsegs: VSeg[] = [];
  for (let x = 1; x < gw - 1; x++) {
    let y = 1;
    while (y < gh - 1) {
      if (!vEdge[y * gw + x]) {
        y++;
        continue;
      }
      let y1 = y;
      let miss = 0;
      for (let k = y + 1; k < gh - 1; k++) {
        if (vEdge[k * gw + x]) {
          y1 = k;
          miss = 0;
        } else if (++miss > P.gap) break;
      }
      if (y1 - y + 1 >= P.minRunV) {
        let sum = 0;
        let n = 0;
        for (let k = y; k <= y1; k++) {
          sum += Math.abs(gx[k * gw + x]);
          n++;
        }
        vsegs.push({ x, y0: y, y1, strength: Math.round(sum / n) });
      }
      y = y1 + 1;
    }
  }
  return { gw, gh, threshold: T, edgeCells, hsegs, vsegs, empty };
}

/** How many rows right above the segment are empty: a band of the segment's width with at most `emptyShare` of its cells changing. */
function roomAbove(str: Uint8Array, gw: number, y: number, x0: number, x1: number, T: number, P: typeof PICTURE): number {
  let rows = 0;
  const half = Math.max(1, Math.round(T / 2));
  for (let r = y - 2; r >= 1 && rows < P.roomMax; r--) {
    let busy = 0;
    for (let x = x0; x <= x1; x++) if (str[r * gw + x] >= half) busy++;
    if (busy > (x1 - x0 + 1) * P.emptyShare) break;
    rows++;
  }
  return rows;
}

/** A ledge has room for the cat when the empty rows above it are at least the cat's height in cells. */
export const hasRoom = (s: HSeg, catCells: number): boolean => s.roomAbove >= catCells;
