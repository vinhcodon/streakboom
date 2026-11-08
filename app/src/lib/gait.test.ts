// Run with: node --test src/lib/gait.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { GLIDE_MS, RAMP_IN_MS, glideOut, rampIn, takeSteps } from "./gait.ts";

test("the window eases in from a standstill to full speed and never overshoots", () => {
  assert.equal(rampIn(0), 0);
  assert.equal(rampIn(RAMP_IN_MS), 1);
  assert.equal(rampIn(RAMP_IN_MS * 3), 1);
  assert.equal(rampIn(-50), 0);
  let prev = 0;
  for (let ms = 0; ms <= RAMP_IN_MS; ms += 10) {
    const v = rampIn(ms);
    assert.ok(v >= prev && v <= 1, `monotonic at ${ms}`);
    prev = v;
  }
});

test("the window eases out from full speed to a stop and never goes backwards", () => {
  assert.equal(glideOut(0), 1);
  assert.equal(glideOut(GLIDE_MS), 0);
  assert.equal(glideOut(GLIDE_MS * 2), 0);
  let prev = 1;
  for (let ms = 0; ms <= GLIDE_MS; ms += 10) {
    const v = glideOut(ms);
    assert.ok(v <= prev && v >= 0, `monotonic at ${ms}`);
    prev = v;
  }
});

test("a fractional speed moves whole pixels and keeps the remainder (no lost or invented distance)", () => {
  let carry = 0;
  let moved = 0;
  const want = 0.37;
  for (let i = 0; i < 1000; i++) {
    const r = takeSteps(carry, want);
    assert.ok(Number.isInteger(r.move) && r.move >= 0 && r.move <= 1);
    moved += r.move;
    carry = r.carry;
  }
  assert.ok(Math.abs(moved + carry - 1000 * want) < 1e-6);
  assert.deepEqual(takeSteps(0.6, 0.6), { move: 1, carry: 0.19999999999999996 });
  assert.deepEqual(takeSteps(0, 0), { move: 0, carry: 0 });
});

test("a whole walk (ease in, steady, ease out) covers about the distance of the steady part plus the ramps", () => {
  const stepPx = 2.4; // per tick at full speed
  const tick = 66;
  let carry = 0;
  let moved = 0;
  for (let t = 0; t < 4000; t += tick) {
    const r = takeSteps(carry, stepPx * rampIn(t));
    moved += r.move;
    carry = r.carry;
  }
  for (let t = 0; t < GLIDE_MS; t += tick) {
    const r = takeSteps(carry, stepPx * glideOut(t));
    moved += r.move;
    carry = r.carry;
  }
  const ideal = stepPx * ((4000 - RAMP_IN_MS / 2) / tick + GLIDE_MS / 3 / tick);
  assert.ok(Math.abs(moved - ideal) < 6, `moved ${moved}, ideal about ${ideal.toFixed(1)}`);
});
