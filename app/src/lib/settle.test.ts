import { test } from "node:test";
import assert from "node:assert/strict";
import { BACKOFF, SETTLE, boxCoverage, chooseSettle, settleAllowed } from "./settle.ts";
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

test("the back-off: a minute of rest after a move, and ten minutes of calm after three moves in ten minutes", () => {
  const T = 1_000_000;
  assert.equal(settleAllowed([], T), true);
  assert.equal(settleAllowed([T - 30_000], T), false); // 30 s after a move
  assert.equal(settleAllowed([T - 90_000], T), true); // 90 s after one move
  const three = [T - 400_000, T - 250_000, T - 90_000]; // three moves in ten minutes, the last 90 s ago
  assert.equal(settleAllowed(three, T), false);
  assert.equal(settleAllowed(three, T + BACKOFF.pauseMs), true); // ten minutes after the last
});

test("when no place is clear, the least covering one is taken if it covers much less, and nothing is taken for a small gain", () => {
  // the floor is busy at the cat (100%) and 40% busy over a stretch to the right: no clear place, a better one
  const gw = 80, gh = 20;
  const s = pic(gw, gh, [[0, 8, 79, 19]]);
  for (let y = 14; y <= 19; y++) for (let x = 50; x <= 70; x++) if ((x + y) % 5 < 3) s.empty[y * gw + x] = 1; // thin the busy cells to about 40%
  const m = chooseSettle(s, { col: 20, row: 19 }, 6, [], 12)!;
  assert.equal(m.kind, "walk");
  assert.ok(m.col >= 50 && m.col <= 70);
  // a gain smaller than 25 points is not worth a move
  const t = pic(gw, gh, [[0, 8, 79, 19]]);
  for (let y = 14; y <= 19; y++) for (let x = 50; x <= 70; x++) if ((x + y) % 10 === 0) t.empty[y * gw + x] = 1;
  assert.equal(chooseSettle(t, { col: 20, row: 19 }, 6, [], 12), null);
});

test("before dozing the bar is lower: a cat that covers 20% moves, one that covers 5% does not", () => {
  const s = pic(60, 20, [[27, 16, 29, 19]]); // 12 busy cells of the 6 by 6 box of a cat at col 30 (cells 27 to 32): 33%
  const t = pic(60, 20, [[27, 19, 27, 19]]); // 1 busy cell: 3%
  assert.equal(chooseSettle(s, { col: 30, row: 19 }, 6, [], 12) !== null, true);
  const u = pic(60, 20, [[27, 18, 28, 19], [60, 0, 60, 0]]); // 4 cells: 11%
  assert.equal(chooseSettle(u, { col: 30, row: 19 }, 6, [], 12), null); // under 30%: nothing
  assert.equal(chooseSettle(u, { col: 30, row: 19 }, 6, [], 12, SETTLE.coverBeforeSleep), null); // 11% is under 15% too
  const v = pic(60, 20, [[27, 17, 28, 19]]); // 6 cells: 17%
  assert.equal(chooseSettle(v, { col: 30, row: 19 }, 6, [], 12), null);
  assert.ok(chooseSettle(v, { col: 30, row: 19 }, 6, [], 12, SETTLE.coverBeforeSleep) !== null);
  assert.equal(chooseSettle(t, { col: 30, row: 19 }, 6, [], 12, SETTLE.coverBeforeSleep), null);
});

test("stepping aside: the place lies beyond the pointer on the chosen side, near, and clear; none when there is none", () => {
  const s = pic(80, 20, [[0, 12, 79, 19]]); // a busy floor...
  for (let y = 12; y <= 19; y++) for (let x = 56; x <= 70; x++) s.empty[y * 80 + x] = 1; // ...with a clear stretch at cols 56 to 70
  const cat = { col: 30, row: 19 };
  const m = chooseSettle(s, cat, 6, [], 12, 0, { col: 34, gap: 8, side: 1, maxCols: 40 })!;
  assert.equal(m.kind, "walk");
  assert.ok(m.col >= 56 && m.col <= 70);
  assert.equal(chooseSettle(s, cat, 6, [], 12, 0, { col: 34, gap: 8, side: -1, maxCols: 40 }), null); // nothing clear to the left
  assert.equal(chooseSettle(s, cat, 6, [], 12, 0, { col: 34, gap: 8, side: 1, maxCols: 20 }), null); // too far for a step
});
