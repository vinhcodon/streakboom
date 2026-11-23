import { test } from "node:test";
import assert from "node:assert/strict";
import { REACTION_MS, SIDE_PX, SPOKEN_MS, Stroke, decideView, isDrag, type LookInput } from "./paws-look.ts";

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

test("the pointer near turns the head to its side, or looks at the person when it is in front", () => {
  assert.deepEqual(decideView(base({ pointer: { dx: SIDE_PX + 1, dy: 0 } })), { front: false, dir: 1 });
  assert.deepEqual(decideView(base({ pointer: { dx: -(SIDE_PX + 1), dy: 0 } })), { front: false, dir: -1 });
  assert.deepEqual(decideView(base({ pointer: { dx: 10, dy: -90 } })), { front: true, dir: 1 });
  assert.deepEqual(decideView(base({ pointer: null })), { front: true, dir: 1 }, "the pointer gone: it looks at the person again");
});

test("a pet that spoke, or Peak close by, turns it that way for a while; the pointer wins over both", () => {
  assert.deepEqual(decideView(base({ spoken: { dir: -1, at: 10_000 - SPOKEN_MS + 100 } })), { front: false, dir: -1 });
  assert.deepEqual(decideView(base({ spoken: { dir: -1, at: 10_000 - SPOKEN_MS - 100 } })), { front: true, dir: 1 });
  assert.deepEqual(decideView(base({ peak: { dx: 120 } })), { front: false, dir: 1 });
  assert.deepEqual(decideView(base({ peak: { dx: 120 }, pointer: { dx: -200, dy: 0 } })), { front: false, dir: -1 });
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
