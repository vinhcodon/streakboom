// Run with: node --test src/lib/reveal.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import { COMMA_MS, pauseAfter, speedFor, STOP_MS, totalMs, WORD_MS, words } from "./reveal.ts";

test("words keep their trailing space so joining restores the text", () => {
  const t = "Hừm, lại là bạn à.  Nói đi!";
  assert.equal(words(t).join(""), t.trimStart());
  assert.deepEqual(words(""), []);
  assert.deepEqual(words("   "), []);
  assert.equal(words("một hai ba").length, 3);
});

test("the pause is longer after punctuation", () => {
  assert.equal(pauseAfter("lại "), WORD_MS);
  assert.equal(pauseAfter("Hừm, "), WORD_MS + COMMA_MS);
  assert.equal(pauseAfter("à. "), WORD_MS + STOP_MS);
  assert.equal(pauseAfter("sao?\" "), WORD_MS + STOP_MS);
  assert.equal(pauseAfter("đi… "), WORD_MS + STOP_MS);
});

test("it is much slower than 90 characters per second, but a long answer is capped", () => {
  const short = words("Hừm, lại là bạn à. Nói đi, mình nghe đây.");
  assert.ok(totalMs(short) > 1000); // at least a second for ~40 chars (was ~0.5 s)
  assert.equal(speedFor(short), 1);
  const long = words(Array.from({ length: 120 }, (_, i) => `từ${i}`).join(" "));
  assert.ok(totalMs(long) > 6000);
  const sp = speedFor(long);
  assert.ok(sp > 1);
  assert.ok(Math.abs(totalMs(long) / sp - 6000) < 1);
});
