import { test } from "node:test";
import assert from "node:assert/strict";
import { RIGHT_DOUBLE_MS, clickResolver, type Timers } from "./clickresolver.ts";

// A fake clock: timers fire only when the test says so.
function fake() {
  const q = new Map<number, () => void>();
  let id = 0;
  const timers: Timers = {
    set: (fn) => {
      q.set(++id, fn);
      return id;
    },
    clear: (h) => void q.delete(h as number),
  };
  return { timers, fire: () => [...q.values()].forEach((f) => f()), size: () => q.size, drop: () => q.clear() };
}

test("one click is a single once the wait has passed, not before", () => {
  const f = fake();
  const got: string[] = [];
  const r = clickResolver<number>((p) => got.push(`s${p}`), (p) => got.push(`d${p}`), f.timers);
  r.click(5);
  assert.deepEqual(got, []);
  assert.equal(r.pending, true);
  f.fire();
  assert.deepEqual(got, ["s5"]);
  assert.equal(r.pending, false);
});

test("two clicks inside the wait are one double, and no single", () => {
  const f = fake();
  const got: string[] = [];
  const r = clickResolver<number>((p) => got.push(`s${p}`), (p) => got.push(`d${p}`), f.timers);
  r.click(1);
  r.click(2);
  assert.deepEqual(got, ["d2"]);
  assert.equal(f.size(), 0);
  f.fire();
  assert.deepEqual(got, ["d2"]);
});

test("a third click after a double starts a new pair", () => {
  const f = fake();
  const got: string[] = [];
  const r = clickResolver<number>((p) => got.push(`s${p}`), (p) => got.push(`d${p}`), f.timers);
  r.click(1);
  r.click(2);
  r.click(3);
  f.fire();
  assert.deepEqual(got, ["d2", "s3"]);
});

test("cancel drops a pending click without acting", () => {
  const f = fake();
  const got: string[] = [];
  const r = clickResolver<number>((p) => got.push(`s${p}`), (p) => got.push(`d${p}`), f.timers);
  r.click(1);
  r.cancel();
  f.fire();
  assert.deepEqual(got, []);
  assert.equal(r.pending, false);
});

test("the wait is about a quarter of a second, as the left click's", () => {
  assert.ok(RIGHT_DOUBLE_MS >= 200 && RIGHT_DOUBLE_MS <= 300);
});
