// Run with: node --test src/lib/sprites.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { needsWakeFirst, TIMED } from "./sprites.ts";
import type { PetState } from "./sprites.ts";

const ALL: PetState[] = ["idle", "look", "walk", "sleep", "held", "happy", "think", "land", "drowsy", "wake"];

test("a sleeping pet wakes up first, except when picked up or already easing in or out of sleep", () => {
  for (const to of ALL) {
    const expected = !["sleep", "wake", "drowsy", "held"].includes(to);
    assert.equal(needsWakeFirst("sleep", to), expected, `sleep -> ${to}`);
  }
  // only sleep needs waking
  for (const from of ALL.filter((p) => p !== "sleep")) assert.equal(needsWakeFirst(from, "idle"), false, `${from} -> idle`);
});

test("timed poses chain sensibly: drowsy falls asleep, everything else returns to idle", () => {
  assert.equal(TIMED.drowsy?.next, "sleep");
  for (const p of ["look", "happy", "land", "wake", "think"] as PetState[]) {
    assert.ok(TIMED[p] && TIMED[p]!.ms > 0, `${p} is timed`);
    assert.equal(TIMED[p]!.next, undefined, `${p} goes back to idle by default`);
  }
  // poses that last until something changes them are not timed
  for (const p of ["idle", "walk", "sleep", "held"] as PetState[]) assert.equal(TIMED[p], undefined, `${p} is not timed`);
  // a yawn is short enough not to feel stuck, a wake-up long enough to read
  assert.ok(TIMED.drowsy!.ms >= 600 && TIMED.drowsy!.ms <= 1500);
  assert.ok(TIMED.wake!.ms >= 400 && TIMED.wake!.ms <= 1000);
});

import { moodPose, MOODS } from "./sprites.ts";

test("every mood has a reaction, unknown moods are a plain nod, and gentle tone drops sass", () => {
  for (const m of MOODS) assert.ok(moodPose(m, false));
  assert.equal(moodPose("neutral", false), "nod");
  assert.equal(moodPose("whatever", false), "nod");
  assert.equal(moodPose(undefined, false), "nod");
  assert.equal(moodPose("sassy", false), "smirk");
  assert.equal(moodPose("sassy", true), "nod");
  assert.equal(moodPose("sad", true), "sad");
});
