// Run with: node --test src/lib/gestures.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { newScratch, pathLength, reversals, scratchStep, SCRATCH } from "./gestures.ts";
import type { Pt, ScratchState, Zone } from "./gestures.ts";

const SIZE = 120;

/** Sweep back and forth along x at height y: `strokes` strokes of `span` px, one point per `dt` ms. */
function sweep(y: number, strokes: number, span = 50, dt = 30, t0 = 0, x0 = 30): Pt[] {
  const pts: Pt[] = [];
  let t = t0;
  let x = x0;
  pts.push({ x, y, t });
  for (let s = 0; s < strokes; s++) {
    const dir = s % 2 === 0 ? 1 : -1;
    for (let i = 0; i < 5; i++) {
      x += (dir * span) / 5;
      t += dt;
      pts.push({ x, y, t });
    }
  }
  return pts;
}

function feed(pts: Pt[], state: ScratchState = newScratch()): { state: ScratchState; zones: Zone[] } {
  const zones: Zone[] = [];
  for (const p of pts) {
    const r = scratchStep(state, p, SIZE);
    state = r.state;
    if (r.zone) zones.push(r.zone);
  }
  return { state, zones };
}

test("reversals ignore small jitter and count real turn-arounds", () => {
  const jitter: Pt[] = Array.from({ length: 20 }, (_, i) => ({ x: 50 + (i % 2) * 3, y: 30, t: i * 20 }));
  assert.equal(reversals(jitter), 0);
  assert.equal(reversals(sweep(30, 5)), 4); // 5 strokes -> 4 turn-arounds
  assert.equal(reversals([{ x: 0, y: 0, t: 0 }]), 0);
});

test("pathLength sums segment lengths", () => {
  assert.equal(pathLength([{ x: 0, y: 0, t: 0 }, { x: 3, y: 4, t: 1 }, { x: 3, y: 10, t: 2 }]), 11);
});

test("a back-and-forth sweep over the upper part fires a head scratch exactly once", () => {
  const { zones } = feed(sweep(30, 6));
  assert.deepEqual(zones, ["head"]);
});

test("the same sweep low on the sprite is the belly zone", () => {
  assert.deepEqual(feed(sweep(95, 6)).zones, ["belly"]);
});

test("a straight pass, a single stroke or tiny wiggles do not fire", () => {
  assert.deepEqual(feed(sweep(30, 1, 100)).zones, []);
  assert.deepEqual(feed(sweep(30, 2, 60)).zones, []);
  assert.deepEqual(feed(sweep(30, 12, 6)).zones, []); // 6 px strokes are below the threshold
});

test("a slow sweep (outside the time window) does not fire", () => {
  assert.deepEqual(feed(sweep(30, 6, 50, 400)).zones, []);
});

test("cooldown: continuing to scratch does not re-fire until it elapses", () => {
  const first = feed(sweep(30, 6));
  assert.equal(first.zones.length, 1);
  const soon = feed(sweep(30, 6, 50, 30, first.state.lastFire + 100), first.state);
  assert.deepEqual(soon.zones, []);
  const later = feed(sweep(30, 6, 50, 30, first.state.lastFire + SCRATCH.cooldownMs + 100), first.state);
  assert.deepEqual(later.zones, ["head"]);
});

test("leaving the sprite resets the stroke", () => {
  let s = feed(sweep(30, 2)).state;
  assert.ok(s.pts.length > 0);
  s = scratchStep(s, { x: 500, y: 30, t: 9999 }, SIZE).state;
  assert.equal(s.pts.length, 0);
});
