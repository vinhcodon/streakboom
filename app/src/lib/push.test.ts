import { test } from "node:test";
import assert from "node:assert/strict";
import { DROP_MIN_PX, PUSH_REACH_PX, RECOVER_ODDS, dropFalls, isBruised, pushDirection, pushesTowardEdge, shoveDirection, shoveKind, teeterEnds } from "./push.ts";

test("a poke pushes away from the pointer; over the middle it is only a poke", () => {
  assert.equal(pushDirection(40), -1, "the pointer on the right pushes it left");
  assert.equal(pushDirection(-40), 1);
  assert.equal(pushDirection(3), null);
  assert.equal(pushDirection(null), null);
});

test("a push counts only when the end of the seat is close in the pushed direction", () => {
  const margin = 44;
  // 30 px of room to the right plus the margin = 74 px from the end: within reach
  assert.equal(pushesTowardEdge({ left: 200, right: 30 }, margin, 1), true);
  assert.equal(pushesTowardEdge({ left: 200, right: 30 }, margin, -1), false, "pushed the other way, the end is far");
  assert.equal(pushesTowardEdge({ left: 200, right: PUSH_REACH_PX }, margin, 1), false);
  assert.equal(pushesTowardEdge(null, margin, 1), false, "not on a seat");
  assert.equal(pushesTowardEdge({ left: 0, right: 0 }, margin, null), false);
});

test("a teeter ends in a recovery four times in five, and always when bruised", () => {
  assert.equal(teeterEnds(0, false), "recover");
  assert.equal(teeterEnds(RECOVER_ODDS - 0.001, false), "recover");
  assert.equal(teeterEnds(RECOVER_ODDS, false), "fall");
  assert.equal(teeterEnds(0.99, false), "fall");
  assert.equal(teeterEnds(0.99, true), "recover");
});

test("letting go makes it fall only high above the floor and off a seat", () => {
  assert.equal(dropFalls(DROP_MIN_PX, false), true);
  assert.equal(dropFalls(DROP_MIN_PX - 1, false), false, "nearly on the floor it just lands");
  assert.equal(dropFalls(500, true), false, "on a seat it stays");
});

test("bruised until a time", () => {
  assert.equal(isBruised(1000, 999), true);
  assert.equal(isBruised(1000, 1000), false);
  assert.equal(isBruised(0, 5), false);
});

test("a right-click push always has a direction, and only teeters near the end of a seat", () => {
  assert.equal(shoveDirection(40, 1), -1, "away from the pointer");
  assert.equal(shoveDirection(2, -1), -1, "over the middle: the way it faces");
  assert.equal(shoveDirection(null, 1), 1);
  assert.equal(shoveKind({ left: 200, right: 30 }, 44, 1), "teeter");
  assert.equal(shoveKind({ left: 200, right: 30 }, 44, -1), "stagger", "the end is far that way");
  assert.equal(shoveKind(null, 44, 1), "stagger", "on the floor it only staggers");
});
