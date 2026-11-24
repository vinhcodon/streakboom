import { test } from "node:test";
import assert from "node:assert/strict";
import { REACTION_MS, SPOKEN_MS, Stroke, decideView, gaze, isDrag, type LookInput } from "./paws-look.ts";

const base = (o: Partial<LookInput> = {}): LookInput => ({ now: 10_000, sceneLive: false, dragging: false, dragDir: 1, reactionUntil: 0, pointer: null, peak: null, spoken: null, current: { front: true, dir: 1 }, ...o });

test("it stands and looks at the person when nothing is near", () => {
  assert.deepEqual(decideView(base()), { front: true, dir: 1 });
  assert.deepEqual(decideView(base({ current: { front: false, dir: -1 } })), { front: true, dir: -1 });
});

test("a scene keeps the picture it set", () => {
  assert.deepEqual(decideView(base({ sceneLive: true, current: { front: false, dir: -1 }, dragging: true, pointer: { dx: 200, dy: 0 } })), { front: false, dir: -1 });
});

test("carried, it faces the way it is going; a reaction looks at the person", () => {
  assert.deepEqual(decideView(base({ dragging: true, dragDir: -1, reactionUntil: 20_000 })), { front: false, dir: -1 });
  assert.deepEqual(decideView(base({ reactionUntil: 10_000 + REACTION_MS, pointer: { dx: 200, dy: 0 } })), { front: true, dir: 1 });
});

test("it keeps the front view whatever is near: only the eyes follow (the author did not like the body turning)", () => {
  assert.deepEqual(decideView(base({ pointer: { dx: 200, dy: 0 } })), { front: true, dir: 1 });
  assert.deepEqual(decideView(base({ pointer: { dx: -200, dy: 0 }, current: { front: true, dir: -1 } })), { front: true, dir: -1 });
  assert.deepEqual(decideView(base({ spoken: { dir: -1, at: 9_900 }, peak: { dx: 100 } })), { front: true, dir: 1 });
});

test("the eyes: the pointer when near, else a pet that spoke a moment ago, else Peak when close, else straight ahead", () => {
  const g = (o: Partial<LookInput>) => gaze({ now: 10_000, pointer: null, peak: null, spoken: null, ...o });
  assert.equal(g({}), null);
  assert.deepEqual(g({ pointer: { dx: 140, dy: 0 } }), { x: 1, y: 0 });
  assert.deepEqual(g({ pointer: { dx: -70, dy: -110 } }), { x: -0.5, y: -1 });
  assert.deepEqual(g({ pointer: { dx: 900, dy: 900 } }), { x: 1, y: 1 }, "never beyond the edge");
  assert.deepEqual(g({ spoken: { dir: -1, at: 10_000 - SPOKEN_MS + 100 } }), { x: -1, y: 0 });
  assert.equal(g({ spoken: { dir: -1, at: 10_000 - SPOKEN_MS - 100 } }), null);
  assert.deepEqual(g({ peak: { dx: 120 } }), { x: 0.9, y: 0 });
  assert.deepEqual(g({ peak: { dx: 120 }, spoken: { dir: -1, at: 9_900 } }), { x: -1, y: 0 }, "a pet that spoke wins over Peak being near");
  assert.deepEqual(g({ peak: { dx: 120 }, spoken: { dir: -1, at: 9_900 }, pointer: { dx: 70, dy: 0 } }), { x: 0.5, y: 0 }, "the pointer wins over both");
});

test("a stroke is the pointer travelling enough over the pet within a short time, then it rests", () => {
  const s = new Stroke(100, 1500, 3000);
  let got = false; let t = 1000;
  for (let i = 0; i < 12 && !got; i++) { got = s.feed(30 + (i % 2) * 20, 50, t); t += 100; }
  assert.equal(got, true, "a back and forth is a stroke");
  assert.equal(s.feed(30, 50, t + 100), false, "it rests after a stroke");
  const slow = new Stroke(100, 1500, 3000);
  let any = false; t = 1000;
  for (let i = 0; i < 20; i++) { any = slow.feed(50 + i, 50, t) || any; t += 2000; } // one step in two seconds: not a stroke
  assert.equal(any, false);
});

test("a press that moves more than a few pixels is a drag", () => {
  assert.equal(isDrag(2, 2), false);
  assert.equal(isDrag(8, 0), true);
});
