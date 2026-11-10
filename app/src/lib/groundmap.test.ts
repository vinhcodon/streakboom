import { test } from "node:test";
import assert from "node:assert/strict";
import { desktopShare, kindAt, ledges, summary, type GroundKind, type GroundMap } from "./groundmap.ts";

const D: GroundKind = "desktop";
const A: GroundKind = "app";
const F: GroundKind = "foreground";
/** A 4 x 3 map of a 400 x 300 work area at (100, 50). */
const map = (cells: GroundKind[]): GroundMap => ({ x: 100, y: 50, w: 400, h: 300, cols: 4, rows: 3, cells });

test("a ledge is a window cell with the bare desktop right above it", () => {
  const m = map([D, D, D, D, D, A, A, D, D, A, F, D]);
  const l = ledges(m);
  assert.deepEqual(l.map((x) => [x.col, x.row]), [[1, 1], [2, 1]]);
  // the middle of the top edge of cell (1, 1): x = 100 + 1.5 * 100, y = 50 + 1 * 100
  assert.deepEqual([l[0].x, l[0].y], [250, 150]);
});

test("no ledge on a covered screen, none in the top row, none under another window", () => {
  assert.deepEqual(ledges(map(Array(12).fill(A))), []);
  assert.deepEqual(ledges(map([A, A, A, A, D, D, D, D, D, D, D, D])), [], "windows in the top row have nothing above them to stand on");
  assert.deepEqual(ledges(map([D, D, D, D, A, A, A, A, A, A, A, A])).map((x) => x.row), [1, 1, 1, 1], "only the top edge counts, not the cells below it");
});

test("the share of bare desktop, and a map with nothing in it", () => {
  assert.equal(desktopShare(map([D, D, D, D, A, A, A, A, A, A, A, A])), 1 / 3);
  assert.equal(desktopShare(map(Array(12).fill(F))), 0);
  assert.equal(desktopShare({ ...map([]), cells: [] }), 0);
});

test("cells outside the map are unknown and the summary holds only counts", () => {
  const m = map([D, A, F, "taskbar", D, D, D, D, D, D, D, "unknown"]);
  assert.equal(kindAt(m, -1, 0), null);
  assert.equal(kindAt(m, 4, 0), null);
  assert.equal(kindAt(m, 2, 0), F);
  assert.equal(summary(m), "4x3: desktop 8, taskbar 1, window 1, in front 1, other 1");
});
