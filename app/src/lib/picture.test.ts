import { test } from "node:test";
import assert from "node:assert/strict";
import { KIND, PICTURE, analyse, edgeSpots, fuseSpots, hasRoom, reachability, scaled, standSpots, type Grid, type Seen } from "./picture.ts";

/** A grid with a rectangle of one grey on a background of another. */
function box(gw: number, gh: number, bg: number, fg: number, x0: number, y0: number, x1: number, y1: number): Grid {
  const data = new Uint8Array(gw * gh).fill(bg);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) data[y * gw + x] = fg;
  return { gw, gh, data };
}

test("a bright box on a dark background gives its top and bottom as horizontal segments and its sides as vertical ones", () => {
  const s = analyse(box(48, 32, 20, 220, 12, 10, 35, 22));
  const near = (a: number, b: number) => Math.abs(a - b) <= 1;
  const top = s.hsegs.find((h) => near(h.y, 10));
  const bottom = s.hsegs.find((h) => near(h.y, 22));
  assert.ok(top && bottom, JSON.stringify(s.hsegs));
  assert.ok(top!.x0 <= 14 && top!.x1 >= 33, "the top spans the box");
  assert.equal(top!.brighterBelow, true, "darker above the top edge");
  assert.equal(bottom!.brighterBelow, false, "brighter above the bottom edge");
  assert.ok(s.vsegs.some((v) => near(v.x, 12)) && s.vsegs.some((v) => near(v.x, 35)), JSON.stringify(s.vsegs));
});

test("there is room above the top of the box (the empty background) and the empty mask marks the inside and the outside", () => {
  const s = analyse(box(48, 32, 20, 220, 12, 10, 35, 22));
  const top = s.hsegs.find((h) => Math.abs(h.y - 10) <= 1)!;
  assert.ok(top.roomAbove >= 7, `room above the top ${top.roomAbove}`);
  assert.equal(hasRoom(top, 6), true);
  assert.equal(hasRoom(top, 30), false);
  assert.equal(s.empty[16 * 48 + 24], 1, "the middle of the box is empty");
  assert.equal(s.empty[3 * 48 + 3], 1, "the corner of the background is empty");
  assert.equal(s.empty[10 * 48 + 24], 0, "the edge itself is not empty");
});

test("a flat picture and a smooth ramp have no segments", () => {
  assert.equal(analyse({ gw: 40, gh: 30, data: new Uint8Array(1200).fill(128) }).hsegs.length, 0);
  const ramp = new Uint8Array(192 * 108);
  for (let y = 0; y < 108; y++) for (let x = 0; x < 192; x++) ramp[y * 192 + x] = Math.round((x / 191) * 255);
  const s = analyse({ gw: 192, gh: 108, data: ramp });
  assert.equal(s.hsegs.length + s.vsegs.length, 0);
});

test("a dark theme with a faint box is read as well as a light one (the threshold is relative)", () => {
  const dark = analyse(box(48, 32, 18, 44, 12, 10, 35, 22));
  assert.ok(dark.hsegs.length >= 2 && dark.vsegs.length >= 2, "a faint box is seen");
  const light = analyse(box(48, 32, 235, 205, 12, 10, 35, 22));
  assert.ok(light.hsegs.length >= 2, "a light page with a darker box is seen");
});

test("a short line is not a ledge, and a gap of one cell does not break a long one", () => {
  const short = analyse(box(48, 32, 20, 220, 20, 14, 22, 20)); // 3 cells wide
  assert.equal(short.hsegs.length, 0);
  const g = box(48, 32, 20, 220, 10, 10, 37, 22);
  (g.data as Uint8Array)[10 * 48 + 22] = 20; // one cell of the top row is missing
  const s = analyse(g);
  const top = s.hsegs.filter((h) => Math.abs(h.y - 10) <= 1);
  assert.equal(top.length, 1, "one segment, not two");
});

test("noise gives few segments", () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const data = new Uint8Array(192 * 108);
  for (let i = 0; i < data.length; i++) data[i] = 120 + Math.round(rnd() * 12); // +-6 grey levels of noise
  const s = analyse({ gw: 192, gh: 108, data });
  assert.ok(s.hsegs.length + s.vsegs.length <= 3, `${s.hsegs.length} + ${s.vsegs.length}`);
});

test("the result holds numbers and its own mask, never the grid", () => {
  const g = box(48, 32, 20, 220, 12, 10, 35, 22);
  const s = analyse(g);
  assert.notEqual(s.empty.buffer, (g.data as Uint8Array).buffer);
  assert.deepEqual(Object.keys(s).sort(), ["bands", "edgeCells", "empty", "gh", "gw", "hsegs", "kinds", "regions", "threshold", "vsegs"]);
  assert.notEqual(s.kinds.buffer, (g.data as Uint8Array).buffer);
  for (const h of s.hsegs) assert.deepEqual(Object.keys(h).sort(), ["brighterBelow", "roomAbove", "strength", "x0", "x1", "y"]);
});

test("a too small or a short grid is read as nothing", () => {
  assert.equal(analyse({ gw: 3, gh: 3, data: new Uint8Array(9) }).hsegs.length, 0);
  assert.equal(analyse({ gw: 40, gh: 30, data: new Uint8Array(10) }).hsegs.length, 0);
  assert.ok(PICTURE.minThreshold > 0);
});

const kindAt = (s: ReturnType<typeof analyse>, x: number, y: number) => s.kinds[y * s.gw + x];

test("a flat picture is one plain", () => {
  const s = analyse({ gw: 60, gh: 40, data: new Uint8Array(2400).fill(90) });
  assert.equal(s.regions.length, 1);
  assert.equal(s.regions[0].kind, "plain");
  assert.ok(s.regions[0].area > 2200);
  assert.equal(kindAt(s, 30, 20), KIND.plain);
});

test("a bordered box on a plain is a panel, and what is around it stays a plain", () => {
  const s = analyse(box(60, 40, 30, 200, 15, 10, 44, 29));
  assert.equal(kindAt(s, 30, 20), KIND.panel, JSON.stringify(s.regions));
  assert.equal(kindAt(s, 3, 3), KIND.plain);
  const panel = s.regions.find((r) => r.kind === "panel")!;
  assert.ok(panel.borderShare >= 0.6, String(panel.borderShare));
  assert.ok(panel.x0 >= 15 && panel.x1 <= 44 && panel.y0 >= 10 && panel.y1 <= 29, "the panel is inside the box");
  const plain = s.regions.find((r) => r.kind === "plain")!;
  assert.ok(plain.borderShare < 0.6, String(plain.borderShare));
});

test("a patch of fine stripes is rough ground", () => {
  const g = box(60, 40, 40, 40, 0, 0, 0, 0);
  const d = g.data as Uint8Array;
  for (let y = 10; y < 30; y++) for (let x = 15; x < 45; x++) d[y * 60 + x] = x % 2 === 0 ? 40 : 130;
  const s = analyse(g);
  assert.equal(kindAt(s, 30, 20), KIND.rough, JSON.stringify(s.regions));
  const rough = s.regions.find((r) => r.kind === "rough")!;
  assert.ok(rough.area >= PICTURE.minRough && rough.x0 >= 10 && rough.x1 <= 50, JSON.stringify(rough));
  assert.equal(kindAt(s, 3, 3), KIND.plain);
});

test("a speck is noise: no region of its own, and the plain around it closes over it (round 3)", () => {
  const g = box(60, 40, 40, 200, 30, 20, 31, 21); // 2 x 2 bright
  const s = analyse(g);
  assert.equal(s.regions.filter((r) => r.kind !== "plain").length, 0, JSON.stringify(s.regions));
  assert.equal(kindAt(s, 30, 20), KIND.plain);
});

test("the regions are listed largest first and a screen of noise is read quickly", () => {
  const s = analyse(box(60, 40, 30, 200, 15, 10, 44, 29));
  for (let i = 1; i < s.regions.length; i++) assert.ok(s.regions[i - 1].area >= s.regions[i].area);
  let seed = 11;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const data = new Uint8Array(192 * 108);
  for (let i = 0; i < data.length; i++) data[i] = Math.round(rnd() * 255); // the worst case: every cell an edge
  const t0 = Date.now();
  const big = analyse({ gw: 192, gh: 108, data });
  assert.ok(Date.now() - t0 < 500, "slow: " + (Date.now() - t0) + " ms");
  assert.ok(big.regions.length <= PICTURE.maxRegions);
});

test("an L-shaped pocket of empty space is a plain, not a panel (a panel is a rectangle)", () => {
  const g = box(60, 40, 30, 30, 0, 0, 0, 0);
  const d = g.data as Uint8Array;
  for (let y = 6; y <= 17; y++) for (let x = 6; x <= 50; x++) d[y * 60 + x] = 200;
  for (let y = 6; y <= 34; y++) for (let x = 6; x <= 17; x++) d[y * 60 + x] = 200;
  const s = analyse(g);
  const pocket = s.regions.find((r) => r.area > 150 && r.x0 >= 6 && r.x1 <= 50);
  assert.ok(pocket, JSON.stringify(s.regions));
  assert.ok(pocket!.fill < 0.8, String(pocket!.fill));
  assert.equal(pocket!.kind, "plain");
  const rect = analyse(box(60, 40, 30, 200, 15, 10, 44, 29)).regions.find((r) => r.kind === "panel")!;
  assert.ok(rect.fill >= 0.8, String(rect.fill));
});

test("lines of text (a stack of short bands) are not ledges, a lone box top still is", () => {
  const g = box(80, 60, 235, 235, 0, 0, 0, 0);
  const d = g.data as Uint8Array;
  for (let line = 0; line < 6; line++) for (let y = 6 + line * 6; y < 9 + line * 6; y++) for (let x = 8; x < 34; x++) d[y * 80 + x] = 120; // six text-like bands
  const s = analyse(g);
  assert.ok(s.bands > 0, "the bands were noticed");
  assert.equal(s.hsegs.filter((h) => h.x0 >= 6 && h.x1 <= 36).length, 0, JSON.stringify(s.hsegs));
  const lone = analyse(box(80, 60, 235, 120, 40, 20, 70, 50));
  assert.ok(lone.hsegs.some((h) => Math.abs(h.y - 20) <= 1), "a lone box top is kept");
  assert.equal(lone.bands, 0);
});

/** The upper part flat (empty space), the lower part fine stripes (text-like content). */
function pocketOverContent(gw: number, gh: number, split: number): Grid {
  const data = new Uint8Array(gw * gh).fill(235);
  for (let y = split; y < gh; y++) for (let x = 0; x < gw; x++) data[y * gw + x] = x % 2 === 0 ? 235 : 120;
  return { gw, gh, data };
}

test("the floor of a pocket of empty space over content is a place to stand, when the pocket is tall and wide enough", () => {
  const s = analyse(pocketOverContent(80, 60, 30));
  const spots = standSpots(s, 15);
  assert.ok(spots.length >= 1, JSON.stringify(s.regions));
  const best = spots[0];
  assert.ok(best.y >= 26 && best.y <= 30, "the feet are in the last rows of the pocket: " + best.y);
  assert.ok(best.x1 - best.x0 + 1 >= 50, "wide: " + (best.x1 - best.x0 + 1));
  assert.ok(best.headroom >= 15);
  assert.equal(standSpots(s, 40).length, 0, "a pocket shorter than the cat is no place to stand");
});

test("a narrow pocket and the floor of the screen itself are not stand spots", () => {
  const narrow = pocketOverContent(80, 60, 30);
  const d = narrow.data as Uint8Array;
  for (let y = 0; y < 30; y++) for (let x = 0; x < 80; x++) if (x < 36 || x > 43) d[y * 80 + x] = 235 - (x % 2 ? 90 : 0); // stripes on both sides: an 8-cell gap
  assert.equal(standSpots(analyse(narrow), 15).length, 0);
  const flat = analyse({ gw: 60, gh: 40, data: new Uint8Array(2400).fill(200) });
  assert.equal(standSpots(flat, 10).length, 0, "an empty screen has no content floor");
  assert.equal(standSpots(flat, 0).length, 0);
});

test("stand spots are listed largest first and standSpots leaves the picture as it was", () => {
  const s = analyse(pocketOverContent(80, 60, 30));
  const before = Array.from(s.kinds);
  const spots = standSpots(s, 12);
  assert.deepEqual(Array.from(s.kinds), before);
  for (let i = 1; i < spots.length; i++) assert.ok((spots[i - 1].x1 - spots[i - 1].x0) * spots[i - 1].headroom >= (spots[i].x1 - spots[i].x0) * spots[i].headroom);
});

test("a ragged floor still counts: pocket bottoms that wobble by a cell make one place to stand", () => {
  const gw = 80;
  const gh = 60;
  const data = new Uint8Array(gw * gh).fill(235);
  for (let x = 0; x < gw; x++) {
    const bottom = 30 + (x % 3 === 0 ? 1 : 0) + (x % 7 === 0 ? 1 : 0); // a staircase of one or two cells
    for (let y = bottom; y < gh; y++) data[y * gw + x] = x % 2 === 0 ? 235 : 120;
  }
  const s = analyse({ gw, gh, data });
  const spots = standSpots(s, 15);
  assert.ok(spots.length >= 1, JSON.stringify(s.regions.slice(0, 3)));
  assert.ok(spots[0].x1 - spots[0].x0 + 1 >= 50, "one wide floor, not many short ones: " + JSON.stringify(spots));
  assert.ok(spots[0].y >= 27 && spots[0].y <= 32);
});

test("a hole of a cell or two inside empty space does not break it, and a line between two pockets stays a line", () => {
  const gw = 60;
  const gh = 40;
  const data = new Uint8Array(gw * gh).fill(220);
  for (let y = 18; y < 20; y++) for (let x = 20; x < 22; x++) data[y * gw + x] = 60; // a 2 x 2 speck
  const before = analyse({ gw, gh, data: new Uint8Array(gw * gh).fill(220) });
  const s = analyse({ gw, gh, data });
  assert.equal(s.kinds[19 * gw + 20], KIND.plain, "the speck is closed");
  assert.ok(s.kinds.filter((k) => k === KIND.plain).length >= before.kinds.filter((k) => k === KIND.plain).length - 40);
  // a vertical rule between two empty halves is kept as a wall
  const two = new Uint8Array(gw * gh).fill(220);
  for (let y = 0; y < gh; y++) for (let x = 30; x < 32; x++) two[y * gw + x] = 60;
  const t = analyse({ gw, gh, data: two });
  assert.ok(t.vsegs.length >= 1, "the rule is still a wall");
  assert.notEqual(t.kinds[20 * gw + 30] + t.kinds[20 * gw + 31], 2 * KIND.plain, "the line itself is not filled");
});

/** A Seen with only what reachability reads. */
const fakeSeen = (gw: number, gh: number, vsegs: Seen["vsegs"] = []): Seen => ({ gw, gh, threshold: 20, edgeCells: 0, hsegs: [], bands: 0, vsegs, empty: new Uint8Array(gw * gh), kinds: new Uint8Array(gw * gh), regions: [] });

test("a spot within one hop of the floor is reached by a hop, and a chain of spots takes Peak higher", () => {
  const seen = fakeSeen(100, 100);
  const spots = [
    { x0: 10, x1: 30, y: 80, headroom: 20 }, // rise 19
    { x0: 25, x1: 50, y: 55, headroom: 20 }, // rise 44: 25 above the first
    { x0: 60, x1: 90, y: 5, headroom: 20 }, // rise 94: far above everything
  ];
  const r = reachability(spots, seen, 30);
  assert.deepEqual(r.map((s) => s.reach), ["hop", "hop", null]);
});

test("a wall beside a high spot lets Peak climb to it, and a wall that stops short does not", () => {
  const spot = { x0: 40, x1: 70, y: 20, headroom: 20 }; // rise 79
  const climbable = reachability([spot], fakeSeen(100, 100, [{ x: 38, y0: 18, y1: 95, strength: 50 }]), 30);
  assert.equal(climbable[0].reach, "climb");
  const short = reachability([spot], fakeSeen(100, 100, [{ x: 38, y0: 18, y1: 40, strength: 50 }]), 30); // its foot is 59 cells above the floor
  assert.equal(short[0].reach, null);
  const far = reachability([spot], fakeSeen(100, 100, [{ x: 5, y0: 18, y1: 95, strength: 50 }]), 30); // not beside the spot
  assert.equal(far[0].reach, null);
});

test("a spot right on the floor of the screen is left out", () => {
  const r = reachability([{ x0: 10, x1: 40, y: 96, headroom: 20 }, { x0: 10, x1: 40, y: 60, headroom: 20 }], fakeSeen(100, 100), 30);
  assert.equal(r.length, 1);
  assert.equal(r[0].y, 60);
});

test("a strong block of colour does not make the faint border of a card vanish (the threshold has a ceiling)", () => {
  // a solid black bar on white (a contrast of 255) and, elsewhere, a card whose border is a faint 40 levels
  const g = box(80, 60, 235, 235, 0, 0, 0, 0);
  const d = g.data as Uint8Array;
  for (let y = 4; y < 14; y++) for (let x = 5; x < 75; x++) d[y * 80 + x] = 0;
  for (let y = 30; y < 50; y++) for (let x = 20; x < 60; x++) d[y * 80 + x] = 195; // the faint card
  const s = analyse(g);
  assert.ok(s.threshold <= PICTURE.maxThreshold, String(s.threshold));
  assert.ok(s.hsegs.some((h) => Math.abs(h.y - 30) <= 1), "the faint card is seen: " + JSON.stringify(s.hsegs.map((h) => h.y)));
  assert.ok(analyse(g, { maxThreshold: 255 }).threshold > 60, "without the ceiling the bar sets a high threshold");
});

test("the same screen at twice the grid is read the same: parameters scale with the grid", () => {
  const p2 = scaled(PICTURE, 2);
  assert.equal(p2.minRunH, PICTURE.minRunH * 2);
  assert.equal(p2.minArea, PICTURE.minArea * 4);
  assert.equal(scaled(PICTURE, 1), PICTURE);
  const twice = (g: Grid): Grid => {
    const data = new Uint8Array(g.gw * 2 * g.gh * 2);
    for (let y = 0; y < g.gh * 2; y++) for (let x = 0; x < g.gw * 2; x++) data[y * g.gw * 2 + x] = g.data[((y >> 1) * g.gw + (x >> 1))] as number;
    return { gw: g.gw * 2, gh: g.gh * 2, data };
  };
  const small = analyse(box(192, 108, 30, 200, 40, 20, 150, 80));
  const big = analyse(twice(box(192, 108, 30, 200, 40, 20, 150, 80)));
  assert.equal(big.regions.filter((r) => r.kind === "panel").length, small.regions.filter((r) => r.kind === "panel").length);
  assert.ok(big.vsegs.length >= 2 && big.hsegs.length >= 2);
});

test("window surfaces and picture spots become one list, a picture spot on the same place as a window surface is dropped", () => {
  const win = [{ x0: 10, x1: 60, y: 40, headroom: 20 }];
  const pic = [
    { x0: 12, x1: 58, y: 41, headroom: 20, src: "picture" as const }, // the same place
    { x0: 100, x1: 140, y: 40, headroom: 20, src: "picture" as const }, // elsewhere
    { x0: 10, x1: 60, y: 70, headroom: 20, src: "picture" as const }, // same x, another height
  ];
  const f = fuseSpots(win, pic);
  assert.equal(f.length, 3);
  assert.deepEqual(f.map((s) => s.src), ["window", "picture", "picture"]);
});

test("the empty inside of a panel has a floor too, and the top of a block with room above is a stand spot (round 8)", () => {
  // a bordered box (a panel): its inside is empty and its bottom border is a floor
  const s = analyse(box(80, 60, 30, 200, 15, 10, 64, 49));
  const inside = standSpots(s, 8);
  assert.ok(inside.some((p) => p.y >= 40 && p.y <= 49 && p.x1 - p.x0 + 1 >= 20), JSON.stringify(inside));
  // a bright block on a dark ground: its top edge has the empty ground above it
  const bar = analyse(box(80, 60, 30, 200, 20, 30, 59, 54));
  const edges = edgeSpots(bar, 8);
  assert.ok(edges.some((p) => Math.abs(p.y - 29) <= 1 && p.x1 - p.x0 + 1 >= 20 && p.src === "edge"), JSON.stringify(edges));
  assert.equal(edgeSpots(bar, 40).length, 0, "a block with less room above than the cat is no place to stand");
  // fusing: the edge spot and the plain spot on the same place are one
  const fused = fuseSpots(edges, standSpots(bar, 8), 2, "edge");
  assert.ok(fused.length <= edges.length + standSpots(bar, 8).length);
  assert.equal(fused[0].src, "edge");
});
