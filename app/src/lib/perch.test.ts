import { test } from "node:test";
import assert from "node:assert/strict";
import { PERCH_LIMITS, choosePerch } from "./perch.ts";
import type { GroundKind, GroundMap } from "./groundmap.ts";

const D: GroundKind = "desktop";
const A: GroundKind = "app";
/** A 8 x 6 map of an 800 x 600 work area at (0, 0): cells are 100 x 100 physical px. */
const map = (rows: GroundKind[][]): GroundMap => ({ x: 0, y: 0, w: 800, h: 600, cols: 8, rows: 6, cells: rows.flat() });
const row = (s: string): GroundKind[] => [...s].map((c) => (c === "." ? D : A));
// rows from the top; a window block in the middle with a ledge at row 3 (its top edge at y = 300)
const m = map([row("........"), row("........"), row("........"), row("..####.."), row("..####.."), row("..####..")]);

test("a window with two rows of bare desktop above it is a perch, and the way there is in logical px", () => {
  // the cat's feet on the ground at the bottom (y = 600) at x = 100; scale 1.25: the ledge's top edge is at y = 300
  const p = choosePerch(m, { x: 100, y: 600 }, 1.25)!;
  assert.ok(p);
  assert.equal(p.row, 3);
  assert.equal(p.col, 2, "the nearest ledge sideways");
  assert.equal(p.dy, Math.round((300 - 600) / 1.25));
  assert.equal(p.dx, Math.round((250 - 100) / 1.25));
});

test("no perch on a covered screen, below the cat, too far, too high or without room over it", () => {
  assert.equal(choosePerch(map(Array.from({ length: 6 }, () => row("########"))), { x: 100, y: 600 }, 1), null);
  assert.equal(choosePerch(m, { x: 100, y: 250 }, 1), null, "the ledge (y 300) is below the feet: that is a fall");
  assert.equal(choosePerch(m, { x: 100, y: 600 }, 1, { ...PERCH_LIMITS, maxDx: 100 }), null, "too far sideways");
  assert.equal(choosePerch(m, { x: 100, y: 600 }, 1, { ...PERCH_LIMITS, maxRise: 200 }), null, "too high");
  const low = map([row("........"), row("..####.."), row("..####.."), row("..####.."), row("..####.."), row("..####..")]);
  assert.equal(choosePerch(low, { x: 100, y: 600 }, 1), null, "only one row of desktop over the window: no room to sit");
});

test("a ledge too near the edge of the screen is left alone", () => {
  const edge = map([row("........"), row("........"), row("........"), row("#......."), row("#......."), row("#.......")]);
  assert.equal(choosePerch(edge, { x: 400, y: 600 }, 1), null);
});

test("with two usable ledges the nearest wins, and pick lets the page take the second now and then", () => {
  const two = map([row("........"), row("........"), row("........"), row(".##..##."), row(".##..##."), row(".##..##.")]);
  const near = choosePerch(two, { x: 200, y: 600 }, 1, { ...PERCH_LIMITS, edgeMargin: 0 })!;
  const other = choosePerch(two, { x: 200, y: 600 }, 1, { ...PERCH_LIMITS, edgeMargin: 0 }, 0.9)!;
  assert.ok(Math.abs(near.dx) <= Math.abs(other.dx));
  assert.notDeepEqual([near.col, near.row], [other.col, other.row]);
});
