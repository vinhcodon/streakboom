import { test } from "node:test";
import assert from "node:assert/strict";
import { startGroundWatch, stepGround, type FootSample, type GroundWatch } from "./groundwatch.ts";

const on = (id: number): FootSample => ({ id, x: 100, y: 200 });

/** Feed samples as [what is under the feet now, whether the remembered window still holds the point]. */
function run(steps: [number, boolean | null][]): boolean[] {
  let w: GroundWatch = startGroundWatch();
  return steps.map(([id, holds]) => {
    const r = stepGround(w, on(id), holds);
    w = r.w;
    return r.lost;
  });
}

test("a window is adopted when seen twice, and lost when it stops holding the point twice in a row", () => {
  assert.deepEqual(
    run([[7, null], [7, null], [7, true], [9, false], [9, false]]),
    [false, false, false, false, true]
  );
});

test("one odd answer is not believed", () => {
  assert.deepEqual(run([[7, null], [7, null], [7, false], [7, true], [7, false], [7, true]]), [false, false, false, false, false, false]);
});

test("another window raised over it is not a loss: the remembered one still holds the point", () => {
  assert.deepEqual(run([[7, null], [7, null], [9, true], [9, true], [9, true]]), [false, false, false, false, false]);
});

test("nothing is lost before a window was known (the bare desktop, the taskbar)", () => {
  assert.deepEqual(run([[0, null], [0, null], [0, null]]), [false, false, false]);
});

test("a window seen once and then another is not adopted", () => {
  const r1 = stepGround(startGroundWatch(), on(7), null);
  const r2 = stepGround(r1.w, on(9), null);
  assert.equal(r2.w.id, 0);
  assert.equal(r2.w.pending, 9);
});

test("after a loss the watch starts over and adopts the next window", () => {
  assert.deepEqual(
    run([[7, null], [7, null], [7, false], [7, false], [5, null], [5, null], [5, false], [5, false]]),
    [false, false, false, true, false, false, false, true]
  );
});

test("when the system could not be asked, nothing changes", () => {
  assert.deepEqual(run([[7, null], [7, null], [7, null], [7, null]]), [false, false, false, false]);
});
