import { test } from "node:test";
import assert from "node:assert/strict";
import { bodyPoints, escapePlaces, VERTICAL_BONUS_PX } from "./escape.ts";

const work = { x: 0, y: 0, r: 1920, b: 1040 };
const cat = { x: 800, y: 800, r: 950, b: 950 };

test("five points of the body: the middle and four around it, inside the cat's box", () => {
  const p = bodyPoints(cat);
  assert.equal(p.length, 5);
  assert.deepEqual(p[0], [875, 875]);
  for (const [x, y] of p) assert.ok(x > cat.x && x < cat.r && y > cat.y && y < cat.b);
});

test("places come nearest first, sideways before a vertical place of about the same distance, none outside the work area", () => {
  const p = escapePlaces(cat, work, 1);
  assert.deepEqual(p[0], { dx: 80, dy: 0 });
  assert.deepEqual(p[1], { dx: -80, dy: 0 });
  // a vertical place costs the bonus on top: the first one comes only after sideways ones up to that distance
  const firstV = p.findIndex((q) => q.dy !== 0);
  assert.ok(firstV > 0 && Math.abs(p[firstV - 1].dx) >= VERTICAL_BONUS_PX - 80);
  for (const q of p) {
    assert.ok(cat.x + q.dx >= 0 && cat.r + q.dx <= 1920);
    assert.ok(cat.y + q.dy >= 0 && cat.b + q.dy <= 1040);
  }
});

test("the places are in logical px on a scaled screen, and a cat at the left edge has only places to the right", () => {
  const p = escapePlaces({ x: 0, y: 800, r: 150, b: 950 }, work, 1.25);
  assert.ok(p.every((q) => q.dx >= 0));
  assert.deepEqual(p[0], { dx: 80, dy: 0 });
});
