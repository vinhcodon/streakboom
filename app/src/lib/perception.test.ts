import { test } from "node:test";
import assert from "node:assert/strict";
import { INTENT_CONFIDENCE, LANE_SURE_PROBES, believe, responseFor, startBelief } from "./perception.ts";
import type { FocusOut } from "./focus.ts";
import type { LaneOut } from "./lane.ts";

const focus = (over: Partial<FocusOut> = {}): FocusOut => ({ walkAllowed: true, keepWalking: true, speakAllowed: true, crowded: false, leaveDir: 1, dist: 500, active: false, ...over });
const lane = (crowded: boolean): LaneOut => ({ lane: crowded ? { y0: 0, y1: 100, x0: 0, x1: 100 } as never : null, caretX: crowded ? 50 : null, crowded });

test("nobody near: no belief of being in the way, no response", () => {
  const { belief } = believe(startBelief(), focus(), lane(false), null);
  assert.equal(belief.crowded, null);
  assert.equal(belief.confidence, 0);
  assert.equal(responseFor(belief), "none");
});

test("the pointer right by the cat while the user is active is a fact: the intent at once", () => {
  const { belief } = believe(startBelief(), focus({ crowded: true, active: true }), lane(false), "app");
  assert.equal(belief.crowded, "pointer");
  assert.equal(belief.confidence, 1);
  assert.equal(responseFor(belief), "intent");
  assert.equal(belief.ground, "app");
  assert.equal(belief.userActive, true);
});

test("a lane guess first calls for a reflex and only for the intent once it has held for several probes", () => {
  let st = startBelief();
  const seen: string[] = [];
  for (let i = 0; i < LANE_SURE_PROBES + 1; i++) {
    const r = believe(st, focus(), lane(true), null);
    st = r.state;
    seen.push(responseFor(r.belief));
  }
  assert.deepEqual(seen.slice(0, LANE_SURE_PROBES - 1), Array(LANE_SURE_PROBES - 1).fill("reflex"));
  assert.equal(seen[LANE_SURE_PROBES - 1], "intent");
  assert.equal(seen[LANE_SURE_PROBES], "intent");
});

test("a flickering guess never reaches the intent: one miss starts the count again", () => {
  let st = startBelief();
  for (let i = 0; i < LANE_SURE_PROBES - 1; i++) st = believe(st, focus(), lane(true), null).state;
  const miss = believe(st, focus(), lane(false), null);
  assert.equal(miss.belief.crowded, null);
  assert.equal(miss.state.laneStreak, 0);
  const again = believe(miss.state, focus(), lane(true), null);
  assert.equal(responseFor(again.belief), "reflex");
});

test("the confidence of a guess stays below the intent threshold until it has held, and a fact outranks a guess", () => {
  let st = startBelief();
  for (let i = 0; i < LANE_SURE_PROBES - 1; i++) {
    const r = believe(st, focus(), lane(true), null);
    st = r.state;
    assert.ok(r.belief.confidence < INTENT_CONFIDENCE);
  }
  const both = believe(st, focus({ crowded: true }), lane(true), null);
  assert.equal(both.belief.crowded, "pointer");
  assert.equal(both.belief.confidence, 1);
});
