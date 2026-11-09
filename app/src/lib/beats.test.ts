import { test } from "node:test";
import assert from "node:assert/strict";
import { STARTLE, WORDS_DELAY_MS, afterBody, beatMs, wordsAtMs, type Beat } from "./beats.ts";

const POSES = ["idle", "look", "walk", "sleep", "held", "happy", "think", "land", "drowsy", "purr", "huff", "nod", "smirk", "gasp", "notice", "curious", "sad", "wake"];

test("the startle: the body moves first, the words come 100 to 300 ms into the jolt, and a reflex is under 1.5 s", () => {
  assert.equal(STARTLE.steps[0].sayAt, undefined, "no words in the freeze");
  const at = wordsAtMs(STARTLE)!;
  assert.ok(at >= 150, "words come after the freeze");
  assert.ok(at - STARTLE.steps[0].ms >= 100 && at - STARTLE.steps[0].ms <= 300, "100 to 300 ms after the jolt begins");
  assert.ok(beatMs(STARTLE) <= 1500);
});

test("a beat uses existing poses and never starts with words", () => {
  const beats: Beat[] = [STARTLE, ...Object.entries(WORDS_DELAY_MS).map(([k, d]) => afterBody(k, "happy", d))];
  for (const b of beats) {
    for (const s of b.steps) {
      assert.ok(POSES.includes(s.pose), `${b.id}: ${s.pose}`);
      assert.ok(s.ms > 0);
    }
    assert.notEqual(wordsAtMs(b), 0, `${b.id}: words at 0 ms`);
    assert.ok(beatMs(b) <= 1500);
  }
});

test("the reflexes that speak all let the body move first, by 100 to 600 ms", () => {
  for (const [k, d] of Object.entries(WORDS_DELAY_MS)) assert.ok(d >= 100 && d <= 600, k);
});

test("a beat without words says so", () => {
  assert.equal(wordsAtMs({ id: "x", steps: [{ pose: "nod", ms: 500 }] }), null);
});
