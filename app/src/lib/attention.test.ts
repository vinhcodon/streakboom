import { test } from "node:test";
import assert from "node:assert/strict";
import { FREE_AFTER_MS, PLAY_FOR_MS, WORK_BREAKS_PLAY_MS, initialAttention, mayAct, mayChatter, silentReaction, stepAttention, touched } from "./attention.ts";

const T0 = 1_000_000;
const typing = { idleMs: 500, pointerNear: false };

test("unknown or active means work; a long idle means free; a short pause is still work", () => {
  let s = initialAttention();
  assert.equal(stepAttention(s, { idleMs: null, pointerNear: null }, T0).mode, "work", "when unsure, work");
  assert.equal(stepAttention(s, typing, T0).mode, "work");
  assert.equal(stepAttention(s, { idleMs: 6_000, pointerNear: false }, T0).mode, "work", "6 s is a pause in typing, not a rest");
  assert.equal(stepAttention(s, { idleMs: FREE_AFTER_MS, pointerNear: false }, T0).mode, "free");
});

test("a touch starts play, it lasts two minutes, and another touch renews it", () => {
  let s = touched(initialAttention(), T0);
  assert.equal(stepAttention(s, { idleMs: 2_000, pointerNear: true }, T0 + 1000).mode, "play");
  s = stepAttention(s, { idleMs: 2_000, pointerNear: true }, T0 + 1000).state;
  assert.equal(stepAttention(s, { idleMs: 90_000, pointerNear: false }, T0 + PLAY_FOR_MS - 1).mode, "play", "idle does not end it early");
  assert.equal(stepAttention(s, { idleMs: 90_000, pointerNear: false }, T0 + PLAY_FOR_MS + 1).mode, "free");
  const renewed = touched(s, T0 + PLAY_FOR_MS - 500);
  assert.equal(stepAttention(renewed, { idleMs: 1_000, pointerNear: true }, T0 + PLAY_FOR_MS + 10_000).mode, "play");
});

test("twenty seconds of work away from the cat end play; a moment near it does not", () => {
  let s = touched(initialAttention(), T0);
  let t = T0;
  for (let i = 0; i < 15; i++) {
    t += 1000;
    const r = stepAttention(s, typing, t);
    s = r.state;
    assert.equal(r.mode, "play", `still play after ${i + 1} s of work`);
  }
  // the pointer comes back near the cat: the count starts again
  t += 1000;
  s = stepAttention(s, { idleMs: 500, pointerNear: true }, t).state;
  assert.equal(s.awaySince, null);
  for (let i = 0; i < 19; i++) {
    t += 1000;
    s = stepAttention(s, typing, t).state;
  }
  assert.equal(stepAttention(s, typing, t + 500).mode, "play", "19.5 s is not enough");
  assert.equal(stepAttention(s, typing, t + WORK_BREAKS_PLAY_MS).mode, "work");
});

test("a sudden thing needs a cause in every mode; unhurried and brisk things by its own wish wait for free or play", () => {
  for (const m of ["work", "free", "play"] as const) {
    assert.equal(mayAct(m, 3, "own"), false, `no spontaneous tier 3 in ${m}`);
    assert.equal(mayAct(m, 3, "caused"), true);
    assert.equal(mayAct(m, 0, "own"), true);
    assert.equal(mayAct(m, 2, "way"), true, "getting out of the way is always allowed");
  }
  assert.equal(mayAct("work", 1, "own"), false);
  assert.equal(mayAct("work", 2, "own"), false);
  assert.equal(mayAct("free", 1, "own"), true);
  assert.equal(mayAct("free", 2, "own"), true);
  assert.equal(mayAct("play", 2, "own"), true);
  assert.equal(mayAct("free", 1, "own", true), false, "Quiet mode: still things only");
  assert.equal(mayAct("free", 0, "own", true), true);
});

test("no unprompted line and a silent reaction while working", () => {
  assert.equal(mayChatter("work"), false);
  assert.equal(mayChatter("free"), true);
  assert.equal(mayChatter("play"), true);
  assert.equal(silentReaction("work"), true);
  assert.equal(silentReaction("play"), false);
});
