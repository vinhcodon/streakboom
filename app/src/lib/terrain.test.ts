import { test } from "node:test";
import assert from "node:assert/strict";
import { surfaceBelow, surfaces, wallFor } from "./terrain.ts";
import { choosePerch } from "./perch.ts";
import { headroomClear, ledges, regionAt, type GroundKind, type GroundMap } from "./groundmap.ts";

const A: GroundKind = "app";
const F: GroundKind = "foreground";
const D: GroundKind = "desktop";
/** An 8 x 6 map of an 800 x 600 area at (0, 0): cells are 100 x 100 physical px. kinds and ids are given as rows of strings. */
function map(kindRows: string[], idRows: number[][]): GroundMap {
  const kinds: Record<string, GroundKind> = { ".": D, w: A, F };
  return { x: 0, y: 0, w: 800, h: 600, cols: 8, rows: 6, cells: kindRows.join("").split("").map((c) => kinds[c]), ids: idRows.flat() };
}
const ids = (rows: string[], by: Record<string, number>) => rows.map((r) => [...r].map((c) => by[c] ?? 0));

// A full-screen window (id 1) with a dialog (id 2) in front of it: no bare desktop anywhere.
const k = ["wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww", "wwFFFFww", "wwFFFFww"];
const i = ["11111111", "11111111", "11111111", "11111111", "11222211", "11222211"];
const withDialog = map(k, ids(i, { "1": 1, "2": 2 }));
// the same screen with nothing but the full-screen window
const alone = map(["wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww"], ids(["11111111", "11111111", "11111111", "11111111", "11111111", "11111111"], { "1": 1 }));

test("a full-screen window alone has no surface; a dialog in front of it has a ledge on its top edge", () => {
  assert.deepEqual(surfaces(alone), []);
  assert.deepEqual(ledges(alone), []);
  const s = surfaces(withDialog);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0].row, s[0].c0, s[0].c1], [4, 2, 5]);
  assert.equal(s[0].y, 400, "the top edge of row 4");
  assert.deepEqual([s[0].x0, s[0].x1], [200, 600]);
  assert.equal(s[0].below, "w2");
  assert.equal(s[0].above, "w1");
  assert.equal(s[0].roomy, true, "two rows above it belong to the window behind");
});

test("without region numbers the old rule holds: only bare desktop above counts", () => {
  const noIds: GroundMap = { ...withDialog, ids: undefined };
  assert.deepEqual(ledges(noIds), [], "a window over a window is not a ledge when numbers are not known");
  const desk = map([".......w", ".......w", "........", "..wwww..", "..wwww..", "..wwww.."], ids(["", "", "", "", "", ""].map(() => "00000000"), {}));
  assert.ok(ledges({ ...desk, ids: undefined }).length > 0);
});

test("headroom: rows above that are the same window (inside it) or the taskbar are no room", () => {
  // the dialog's own cells above row 5 are the dialog: no room over a ledge at row 5
  assert.equal(headroomClear(withDialog, 3, 4, 2), true);
  assert.equal(headroomClear(withDialog, 3, 5, 2), false);
  assert.equal(headroomClear(withDialog, 3, 1, 2), false, "no room over the top rows");
});

test("regions: a number makes a window, the kind names the rest", () => {
  assert.equal(regionAt(withDialog, 3, 4), "w2");
  assert.equal(regionAt(withDialog, 0, 0), "w1");
  const desk = map(["........", "........", "........", "........", "........", "........"], ids(Array(6).fill("00000000"), {}));
  assert.equal(regionAt(desk, 0, 0), "desktop");
  assert.equal(regionAt(desk, 9, 0), null);
});

test("the perch is chosen on a dialog's edge on a screen with a full-screen window and no bare desktop", () => {
  // the cat's feet on the floor at (250, 600): the dialog's top edge is at y = 400 (200 px up), its cells span x 200..600
  const p = choosePerch(withDialog, { x: 250, y: 600 }, 1, { maxDx: 700, maxRise: 420, minRise: 70, headroomRows: 2, edgeMargin: 60 });
  assert.ok(p, "a dialog is a perch");
  assert.equal(p!.row, 4);
  assert.equal(p!.dy, -200);
  assert.equal(choosePerch(alone, { x: 250, y: 600 }, 1), null, "alone, nothing to stand on");
});

test("two windows side by side make a wall between them and ledges on both tops", () => {
  const k2 = ["........", "........", "........", "wwww....", "wwww....", "wwww...."];
  const m = map(k2, ids(["........", "........", "........", "1111....", "1111....", "1111...."], { "1": 1 }));
  const s = surfaces(m);
  assert.equal(s.length, 1);
  assert.deepEqual([s[0].c0, s[0].c1], [0, 3]);
});

test("a wall to climb: the side of the window nearer to the cat, none when the window fills the screen's width", () => {
  // the dialog's run is columns 2..5 of row 4: its left face is at x = 200, its right face at x = 600
  const l = wallFor(withDialog, 3, 4, 50);
  assert.deepEqual(l, { dir: 1, x: 200, top: 400, width: 400 });
  const r = wallFor(withDialog, 3, 4, 750);
  assert.deepEqual(r, { dir: -1, x: 600, top: 400, width: 400 });
  // a window across the whole width has no side to climb
  const wide = map(["........", "........", "........", "wwwwwwww", "wwwwwwww", "wwwwwwww"], ids(["........", "........", "........", "11111111", "11111111", "11111111"], { "1": 1 }));
  assert.equal(wallFor(wide, 3, 3, 50), null);
  assert.equal(wallFor(withDialog, 3, 2, 50), null, "no surface there");
});

test("a fall lands on the next surface below at the same column, and on the floor when there is none", () => {
  // the dialog (ids 2) has its top edge at y = 400; the cat's feet are above it at y = 150, over its columns
  const s = surfaceBelow(withDialog, { x: 350, y: 150 });
  assert.ok(s);
  assert.equal(s!.y, 400);
  assert.equal(s!.row, 4);
  assert.equal(surfaceBelow(withDialog, { x: 50, y: 150 }), null, "no edge under column 0: the floor");
  assert.equal(surfaceBelow(withDialog, { x: 350, y: 395 }), null, "an edge less than a few px below is where it already is");
  assert.equal(surfaceBelow(withDialog, { x: 5000, y: 150 }), null, "outside the map");
  // with two edges below, the nearer one
  const stairs = map(["wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww", "wwwwwwww"], ids(["11111111", "11111111", "11111111", "11222211", "11233211", "11233211"], { "1": 1, "2": 2, "3": 3 }));
  assert.equal(surfaceBelow(stairs, { x: 350, y: 50 })!.y, 300, "the first edge down, not the one in the middle of the stair");
});
