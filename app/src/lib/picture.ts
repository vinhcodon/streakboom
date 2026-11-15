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
  /** Regions (stage 2a, plan section 8): a cell with a change of at least this share of the threshold (and at least weakMin) is texture. */
  weakShare: 0.25,
  weakMin: 6,
  /** Texture is looked at in a window of 2 * roughRadius + 1 cells; a cell is rough when this share of the window is texture. */
  roughRadius: 4,
  roughDensity: 0.3,
  /** A rough or calm area smaller than this many cells is noise and is dropped. */
  minRough: 16,
  minArea: 14,
  /** A calm area with at least this share of its outline made of borders (edges or rough ground) and at least minPanel cells is a panel. */
  panelShare: 0.6,
  minPanel: 20,
  /** A panel is a rectangle: its area is at least this share of its bounding box (a pocket of empty space between lines of text is not). */
  panelFill: 0.8,
  /** Text bands (round 1 of stage 2b): horizontal segments within bandRows rows of each other that overlap form a chain; a chain of
   * bandSize or more is lines of text, not ledges (a button has two edges, text has many). */
  bandSize: 3,
  bandRows: 5,
  /** At most this many regions are listed (the largest first). */
  maxRegions: 80,
};

/** The kind of a cell: 0 none (an edge, or noise), 1 plain, 2 panel, 3 rough. */
export const KIND = { none: 0, plain: 1, panel: 2, rough: 3 } as const;
export type Kind = "plain" | "panel" | "rough";

export interface Region {
  kind: Kind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  area: number; // cells
  grey: number; // mean grey 0..255
  borderShare: number; // 0..1, how much of the outline is a border
  fill: number; // 0..1, the area over the area of its bounding box: 1 is a rectangle
}

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
  /** How many horizontal segments were taken for lines of text and left out. */
  bands: number;
  vsegs: VSeg[];
  /** 1 where the cell and its eight neighbours have no real change, gw * gh. */
  empty: Uint8Array;
  /** The kind of each cell (KIND), gw * gh. */
  kinds: Uint8Array;
  /** The areas the borders enclose, the largest first. */
  regions: Region[];
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
  const none: Seen = { gw, gh, threshold: P.minThreshold, edgeCells: 0, hsegs: [], bands: 0, vsegs: [], empty, kinds: new Uint8Array(gw * gh), regions: [] };
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
  const { kinds, regions } = findRegions(str, data, gw, gh, T, P);
  const kept = withoutBands(hsegs, P);
  return { gw, gh, threshold: T, edgeCells, hsegs: kept, bands: hsegs.length - kept.length, vsegs, empty, kinds, regions };
}

/**
 * Lines of text come out of the picture as a stack of short horizontal segments, one under the other every few rows, and none of them is
 * a ledge: segments that chain up within `bandRows` rows of each other, `bandSize` or more, are dropped.
 */
function withoutBands(segs: HSeg[], P: typeof PICTURE): HSeg[] {
  const parent = segs.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < segs.length; i++)
    for (let j = i + 1; j < segs.length; j++) {
      const a = segs[i];
      const b = segs[j];
      if (a.y === b.y || Math.abs(a.y - b.y) > P.bandRows) continue;
      const lap = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + 1;
      if (lap >= 0.4 * Math.min(a.x1 - a.x0 + 1, b.x1 - b.x0 + 1)) parent[find(i)] = find(j);
    }
  const size = new Map<number, number>();
  for (let i = 0; i < segs.length; i++) size.set(find(i), (size.get(find(i)) ?? 0) + 1);
  return segs.filter((_, i) => (size.get(find(i)) ?? 0) < P.bandSize);
}

/**
 * Stage 2a (plan section 8): the areas the borders enclose, and what kind each is. Texture (many weak changes in a window) is rough
 * ground: text, icons, a detailed wallpaper. What is neither a border nor rough is calm, and its connected pieces are the areas: one
 * whose outline is mostly border is a panel (a card, a toolbar, a pane), the others are plains. Small pieces are noise and dropped.
 */
function findRegions(str: Uint8Array, data: ArrayLike<number>, gw: number, gh: number, T: number, P: typeof PICTURE): { kinds: Uint8Array; regions: Region[] } {
  const n = gw * gh;
  const kinds = new Uint8Array(n);
  const weakT = Math.max(P.weakMin, Math.round(T * P.weakShare));
  // texture density in a window, by an integral image. Texture is the change from one cell to the next (a forward difference): the
  // central difference used for the edges reads fine stripes, one cell wide, as flat
  const integ = new Int32Array((gw + 1) * (gh + 1));
  for (let y = 0; y < gh; y++) {
    let row = 0;
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x;
      const here = data[i] as number;
      const tex = Math.max(x < gw - 1 ? Math.abs((data[i + 1] as number) - here) : 0, y < gh - 1 ? Math.abs((data[i + gw] as number) - here) : 0);
      row += tex >= weakT ? 1 : 0;
      integ[(y + 1) * (gw + 1) + x + 1] = integ[y * (gw + 1) + x + 1] + row;
    }
  }
  const R = P.roughRadius;
  const roughCell = new Uint8Array(n);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const x0 = Math.max(0, x - R);
      const y0 = Math.max(0, y - R);
      const x1 = Math.min(gw, x + R + 1);
      const y1 = Math.min(gh, y + R + 1);
      const sum = integ[y1 * (gw + 1) + x1] - integ[y0 * (gw + 1) + x1] - integ[y1 * (gw + 1) + x0] + integ[y0 * (gw + 1) + x0];
      roughCell[y * gw + x] = sum >= P.roughDensity * (x1 - x0) * (y1 - y0) ? 1 : 0;
    }
  const regions: Region[] = [];
  const label = new Int32Array(n); // 0 none, else the id of the piece
  const stack: number[] = [];
  const cells: number[] = []; // the cells of the piece being grown, to forget them if it turns out to be noise
  const grow = (start: number, member: (i: number) => boolean, id: number) => {
    let area = 0, x0 = gw, y0 = gh, x1 = 0, y1 = 0, grey = 0;
    stack.length = 0;
    cells.length = 0;
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const i = stack.pop()!;
      cells.push(i);
      const x = i % gw;
      const y = (i / gw) | 0;
      area++;
      grey += data[i] as number;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
      if (x > 0 && !label[i - 1] && member(i - 1)) (label[i - 1] = id), stack.push(i - 1);
      if (x < gw - 1 && !label[i + 1] && member(i + 1)) (label[i + 1] = id), stack.push(i + 1);
      if (y > 0 && !label[i - gw] && member(i - gw)) (label[i - gw] = id), stack.push(i - gw);
      if (y < gh - 1 && !label[i + gw] && member(i + gw)) (label[i + gw] = id), stack.push(i + gw);
    }
    return { area, x0, y0, x1, y1, grey: Math.round(grey / area) };
  };
  let next = 1;
  // a piece that was too small is noise: its cells go back to none (and are not taken up again by the scan, which has passed them)
  const drop = () => {
    for (const i of cells) label[i] = -1;
  };
  // rough ground first
  const isRough = (i: number) => roughCell[i] === 1;
  const roughIds = new Map<number, Region>();
  for (let i = 0; i < n; i++) {
    if (label[i] || !isRough(i)) continue;
    const id = next++;
    const r = grow(i, isRough, id);
    if (r.area < P.minRough) drop();
    else roughIds.set(id, { kind: "rough", x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1, area: r.area, grey: r.grey, borderShare: 1, fill: Math.round((r.area / ((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1))) * 100) / 100 });
  }
  // calm pieces: not a strong change and not rough
  const isCalm = (i: number) => str[i] < T && !roughCell[i] && !label[i];
  const calmIds = new Map<number, Omit<Region, "kind" | "borderShare" | "fill">>();
  for (let i = 0; i < n; i++) {
    if (label[i] || !isCalm(i)) continue;
    const id = next++;
    const r = grow(i, isCalm, id);
    if (r.area < P.minArea) drop();
    else calmIds.set(id, r);
  }
  // how much of each calm piece's outline is a border: a neighbour that is an edge or rough ground; outside the grid is open
  const bordered = new Map<number, number>();
  const total = new Map<number, number>();
  for (let i = 0; i < n; i++) {
    const id = label[i];
    if (!id || !calmIds.has(id)) continue;
    const x = i % gw;
    const y = (i / gw) | 0;
    const look = (j: number | null) => {
      if (j === null) return void total.set(id, (total.get(id) ?? 0) + 1); // outside: open
      if (label[j] === id) return;
      total.set(id, (total.get(id) ?? 0) + 1);
      if (!label[j] || label[j] < 0 || roughIds.has(label[j])) bordered.set(id, (bordered.get(id) ?? 0) + 1); // an edge, noise or rough ground
    };
    look(x > 0 ? i - 1 : null);
    look(x < gw - 1 ? i + 1 : null);
    look(y > 0 ? i - gw : null);
    look(y < gh - 1 ? i + gw : null);
  }
  const kindOf = new Map<number, number>();
  for (const [id, r] of roughIds) {
    regions.push(r);
    kindOf.set(id, KIND.rough);
  }
  for (const [id, r] of calmIds) {
    const share = (bordered.get(id) ?? 0) / Math.max(1, total.get(id) ?? 1);
    const fill = r.area / ((r.x1 - r.x0 + 1) * (r.y1 - r.y0 + 1));
    const kind: Kind = share >= P.panelShare && r.area >= P.minPanel && fill >= P.panelFill ? "panel" : "plain";
    regions.push({ kind, ...r, borderShare: Math.round(share * 100) / 100, fill: Math.round(fill * 100) / 100 });
    kindOf.set(id, kind === "panel" ? KIND.panel : KIND.plain);
  }
  for (let i = 0; i < n; i++) if (label[i] > 0) kinds[i] = kindOf.get(label[i]) ?? 0;
  regions.sort((a, b) => b.area - a.area);
  return { kinds, regions: regions.slice(0, P.maxRegions) };
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
