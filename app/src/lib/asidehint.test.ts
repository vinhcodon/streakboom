import { test } from "node:test";
import assert from "node:assert/strict";
import { HINT_PUSHES, HINT_WINDOW_MS, recordPush, shouldHintAside } from "./asidehint.ts";
import { LINES } from "./lines.ts";
import { BANNED } from "./banned.ts";

test("three pushes in a short while earn the hint, two do not, slow ones do not", () => {
  let t: number[] = [];
  t = recordPush(t, 1000);
  t = recordPush(t, 4000);
  assert.equal(shouldHintAside(t, {}), false);
  t = recordPush(t, 8000);
  assert.equal(t.length, HINT_PUSHES);
  assert.equal(shouldHintAside(t, {}), true);
  let slow: number[] = [];
  for (const at of [0, HINT_WINDOW_MS, 2 * HINT_WINDOW_MS, 3 * HINT_WINDOW_MS]) slow = recordPush(slow, at);
  assert.equal(shouldHintAside(slow, {}), false);
});

test("it is said once in a lifetime", () => {
  const t = [1, 2, 3];
  assert.equal(shouldHintAside(t, { hintaside: 12345 }), false);
});

test("the hint line exists in the three languages, names the way to ask, and breaks no banned pattern", () => {
  const say = { en: /step aside/i, vi: /xê ra/i, ja: /どいて/ };
  for (const lang of ["en", "vi", "ja"] as const) {
    const ls = LINES.filter((l) => l.lang === lang && l.trigger === "hintaside");
    assert.ok(ls.length >= 2, lang);
    for (const l of ls) {
      assert.match(l.text, say[lang], l.id);
      for (const re of BANNED[lang]) assert.doesNotMatch(l.text, re, l.id);
    }
  }
});
