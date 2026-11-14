import { test } from "node:test";
import assert from "node:assert/strict";
import { PICTURE, analyse, hasRoom, type Grid } from "./picture.ts";

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
  assert.deepEqual(Object.keys(s).sort(), ["edgeCells", "empty", "gh", "gw", "hsegs", "threshold", "vsegs"]);
  for (const h of s.hsegs) assert.deepEqual(Object.keys(h).sort(), ["brighterBelow", "roomAbove", "strength", "x0", "x1", "y"]);
});

test("a too small or a short grid is read as nothing", () => {
  assert.equal(analyse({ gw: 3, gh: 3, data: new Uint8Array(9) }).hsegs.length, 0);
  assert.equal(analyse({ gw: 40, gh: 30, data: new Uint8Array(10) }).hsegs.length, 0);
  assert.ok(PICTURE.minThreshold > 0);
});
