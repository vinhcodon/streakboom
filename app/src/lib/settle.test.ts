import { test } from "node:test";
import assert from "node:assert/strict";
import { SETTLE, boxCoverage, chooseSettle } from "./settle.ts";
import type { Seen, StandSpot } from "./picture.ts";

/** A picture of gw by gh cells, all empty except the rectangles given (x0, y0, x1, y1), which are busy. */
function pic(gw: number, gh: number, busy: [number, number, number, number][]): Seen {
  const empty = new Uint8Array(gw * gh).fill(1);
  for (const [x0, y0, x1, y1] of busy) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) empty[y * gw + x] = 0;
  return { gw, gh, threshold: 20, edgeCells: 0, hsegs: [], bands: 0, vsegs: [], empty, kinds: new Uint8Array(gw * gh), regions: [] };
}

test("coverage counts the busy cells of the cat's box, and off-screen cells as empty", () => {
  const s = pic(40, 20, [[10, 10, 19, 19]]);
  assert.equal(boxCoverage(s, 15, 19, 10, 10), 1);
  assert.equal(boxCoverage(s, 30, 19, 10, 10), 0);
  assert.ok(boxCoverage(s, 5, 19, 10, 10) < 0.1); // half off the left edge: counts as empty, no throw
  assert.equal(boxCoverage(s, 0, 5, 10, 10), 0);
});

test("a cat that covers nothing stays where it is", () => {
  const s = pic(40, 20, []);
  assert.equal(chooseSettle(s, { col: 20, row: 19 }, 6, [], 12), null);
});

test("a cat on busy floor walks to the nearest clear stretch", () => {
  const s = pic(60, 20, [[10, 12, 30, 19]]); // busy block from col 10 to 30
  const m = chooseSettle(s, { col: 20, row: 19 }, 6, [], 12)!;
  assert.equal(m.kind, "walk");
  assert.ok(m.hereCover >= SETTLE.coverHigh);
  assert.ok(m.col <= 9 || m.col >= 33);
  assert.ok(Math.abs(m.col - 20) <= 14); // the nearest of the two sides
});

test("a clear spot one hop up wins over a far walk", () => {
  const s = pic(80, 40, [[0, 30, 79, 39]]); // the whole floor is busy
  const spot: StandSpot = { x0: 22, x1: 40, y: 25, headroom: 10 };
  const m = chooseSettle(s, { col: 30, row: 39 }, 6, [spot], 20)!;
  assert.equal(m.kind, "hop");
  assert.equal(m.row, 25);
});

test("a spot that is too high, or narrower than the cat, or without room, is not chosen", () => {
  const s = pic(80, 40, [[0, 30, 79, 39]]);
  assert.equal(chooseSettle(s, { col: 30, row: 39 }, 6, [{ x0: 22, x1: 40, y: 10, headroom: 10 }], 12), null); // 29 rows up
  assert.equal(chooseSettle(s, { col: 30, row: 39 }, 6, [{ x0: 30, x1: 32, y: 30, headroom: 10 }], 20), null); // 3 wide
  assert.equal(chooseSettle(s, { col: 30, row: 39 }, 6, [{ x0: 22, x1: 40, y: 30, headroom: 2 }], 20), null); // no room above
});

test("on a ledge that covers something, the cat walks along the same ledge to a clear stretch, never down", () => {
  const s = pic(80, 40, [[20, 20, 30, 24]]); // a block of content on the ledge at row 25 (feet row 25)
  const ledge: StandSpot = { x0: 10, x1: 60, y: 25, headroom: 10 };
  const m = chooseSettle(s, { col: 25, row: 25 }, 6, [ledge], 12)!;
  assert.equal(m.kind, "walk");
  assert.equal(m.row, 25);
  assert.ok(m.col >= 10 + 3 && m.col <= 60 - 3);
  assert.ok(m.col < 19 || m.col > 32); // one column of overlap is within the 15% allowed
});
