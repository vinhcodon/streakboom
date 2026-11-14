import test from "node:test";
import assert from "node:assert/strict";
import { clockLine, clockPhrase } from "./clock.ts";

test("10 in the morning is said as the morning in every language, never as the night (the 10 PM mistake)", () => {
  assert.equal(clockPhrase("vi", 10), "Bây giờ là 10:00 (buổi sáng).");
  assert.equal(clockPhrase("en", 10), "It is 10:00 (morning).");
  assert.equal(clockPhrase("ja", 10), "いまは10:00（朝）だよ。");
  assert.equal(clockPhrase("vi", 22), "Bây giờ là 22:00 (buổi tối).");
});

test("every hour has exactly one part of the day and the same boundaries as the rest of the app", () => {
  const expect = (h: number) => (h >= 5 && h < 12 ? "morning" : h >= 12 && h < 18 ? "afternoon" : h >= 18 && h < 23 ? "evening" : "night");
  for (let h = 0; h < 24; h++) {
    assert.ok(clockPhrase("en", h).includes(`(${expect(h)})`), String(h));
    assert.ok(clockPhrase("en", h).startsWith(`It is ${String(h).padStart(2, "0")}:00`));
  }
});

test("odd input and an unknown language stay sane", () => {
  assert.ok(clockPhrase("fr", 7).includes("morning"));
  for (const bad of [NaN, -3, 99, Infinity]) assert.match(clockPhrase("en", bad), /^It is \d\d:00 \(\w+\)\.$/);
});

test("the line for the chat holds the time, the weekday and the part of the day, and nothing else", () => {
  assert.equal(clockLine(new Date(2026, 10, 14, 10, 5)), "10:05, Saturday, morning");
  assert.equal(clockLine(new Date(2026, 10, 14, 23, 59)), "23:59, Saturday, night");
  assert.ok(!/2026|GMT|UTC/.test(clockLine(new Date(2026, 10, 14, 10, 5))));
});
