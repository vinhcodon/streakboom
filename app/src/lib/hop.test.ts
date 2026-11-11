// Run with: node --test src/lib/hop.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  GRAVITY,
  HOP_APEX_MAX,
  HOP_APEX_MIN,
  HOP_MAX_MS,
  HOP_MAX_PX,
  HOP_MIN_MS,
  chainAt,
  flightAt,
  planFall,
  planCrawl,
  planHop,
  splitHop,
  totalMs,
} from "./hop.ts";

test("a hop starts at the start and ends exactly at the target", () => {
  const f = planHop(120, -90);
  assert.deepEqual(flightAt(f, 0), { x: 0, y: 0, done: false });
  assert.deepEqual(flightAt(f, f.durationMs), { x: 120, y: -90, done: true });
  assert.deepEqual(flightAt(f, f.durationMs + 500), { x: 120, y: -90, done: true });
});

test("a hop rises above the straight line, and the rise is limited", () => {
  for (const [dx, dy] of [[0, -160], [160, 0], [0, 160], [100, -100], [10, 10]]) {
    const f = planHop(dx, dy);
    assert.ok(f.apex >= HOP_APEX_MIN && f.apex <= HOP_APEX_MAX, `apex ${f.apex} for ${dx},${dy}`);
    // the highest point above the line is the apex, halfway through
    const mid = flightAt(f, f.durationMs / 2);
    const lineY = dy / 2;
    assert.ok(Math.abs(lineY - mid.y - f.apex) < 1e-9, "the middle of the arc is the apex above the line");
  }
});

test("a hop up lifts the cat higher than a hop down of the same size", () => {
  assert.ok(planHop(0, -160).apex > planHop(0, 160).apex);
});

test("a hop takes longer the farther it goes, within limits", () => {
  const near = planHop(20, 0).durationMs;
  const far = planHop(200, 0).durationMs;
  assert.ok(near >= HOP_MIN_MS && far <= HOP_MAX_MS && far > near);
  assert.equal(planHop(5000, 0).durationMs, HOP_MAX_MS);
});

test("a hop going up first rises and then comes down to the target; it never goes through a straight line", () => {
  const f = planHop(0, -160);
  let minY = 0;
  for (let ms = 0; ms <= f.durationMs; ms += 10) minY = Math.min(minY, flightAt(f, ms).y);
  assert.ok(minY < -160, "the path goes above the place it is heading to");
  assert.equal(flightAt(f, f.durationMs).y, -160);
});

test("a fall speeds up: the distance covered grows with the square of the time, and it ends on the ground", () => {
  const f = planFall(400);
  assert.ok(Math.abs(f.durationMs - Math.sqrt((2 * 400) / GRAVITY) * 1000) < 1e-9);
  const half = flightAt(f, f.durationMs / 2).y;
  assert.ok(Math.abs(half - 100) < 1e-9, "a quarter of the way at half the time");
  assert.deepEqual(flightAt(f, f.durationMs), { x: 0, y: 400, done: true });
  assert.equal(flightAt(f, 100).x, 0);
});

test("a fall of nothing is over at once", () => {
  assert.equal(planFall(0).durationMs, 0);
  assert.equal(planFall(-50).dy, 0);
  assert.equal(flightAt(planFall(0), 0).done, true);
});

test("a long way is split into equal hops no longer than the limit", () => {
  const fs = splitHop(0, -500);
  assert.equal(fs.length, Math.ceil(500 / HOP_MAX_PX));
  for (const f of fs) assert.ok(Math.hypot(f.dx, f.dy) <= HOP_MAX_PX + 1e-9);
  assert.ok(Math.abs(fs.reduce((a, f) => a + f.dy, 0) + 500) < 1e-9);
  assert.equal(splitHop(30, 20).length, 1);
});

test("a chain is continuous and ends exactly at the target", () => {
  const fs = splitHop(300, -400);
  const end = chainAt(fs, totalMs(fs));
  assert.ok(end.done && Math.abs(end.x - 300) < 1e-9 && Math.abs(end.y + 400) < 1e-9);
  // across the join of two hops the position does not jump
  const t0 = fs[0].durationMs;
  const a = chainAt(fs, t0 - 0.01);
  const b = chainAt(fs, t0 + 0.01);
  assert.ok(Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5);
});

test("per-frame displacement of a hop at 60 fps stays small enough to look continuous", () => {
  const f = planHop(0, -160);
  let prev = flightAt(f, 0);
  let worst = 0;
  for (let ms = 16; ms <= f.durationMs; ms += 16) {
    const p = flightAt(f, ms);
    worst = Math.max(worst, Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  assert.ok(worst < 22, `a frame moves at most ${worst.toFixed(1)} px`);
});

test("a hop of 240 px along either axis is one hop", () => {
  assert.equal(splitHop(0, HOP_MAX_PX).length, 1);
  assert.equal(splitHop(HOP_MAX_PX + 1, 0).length, 2);
  assert.ok(HOP_APEX_MAX > HOP_APEX_MIN);
});

test("a crawl is a straight line at a steady speed and ends exactly at its target", () => {
  const f = planCrawl(0, -210, 105);
  assert.equal(f.durationMs, 2000);
  assert.deepEqual(flightAt(f, 1000), { x: 0, y: -105, done: false });
  assert.deepEqual(flightAt(f, 2000), { x: 0, y: -210, done: true });
  assert.equal(planCrawl(0, 0, 105).durationMs, 0);
});

test("a fall that slides goes sideways fast at first: most of the way across before it has dropped far, and it ends exactly at its target", () => {
  const f = { ...planFall(400), dx: 150, slide: true };
  const early = flightAt(f, f.durationMs * 0.4);
  assert.ok(early.x >= 0.75 * 150, "78% of the way across at 40% of the time");
  assert.ok(early.y <= 0.17 * 400, "having dropped only 16%");
  assert.deepEqual(flightAt(f, f.durationMs), { x: 150, y: 400, done: true });
  // a plain fall with a drift is linear, as before
  assert.equal(flightAt({ ...planFall(400), dx: 100 }, planFall(400).durationMs / 2).x, 50);
});
