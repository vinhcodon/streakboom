import { test } from "node:test";
import assert from "node:assert/strict";
import { INTENT_CONFIDENCE, LANE_HOLD_MS, believe, responseFor, startBelief } from "./perception.ts";
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

test("a lane guess first calls for a reflex and only for the intent once it has held for long enough", () => {
  let st = startBelief();
  const at = (t: number) => {
    const r = believe(st, focus(), lane(true), null, t);
    st = r.state;
    return responseFor(r.belief);
  };
  assert.equal(at(1000), "reflex");
  assert.equal(at(1000 + 20), "reflex", "a second probe a few milliseconds later does not make it sure");
  assert.equal(at(1000 + LANE_HOLD_MS - 1), "reflex");
  assert.equal(at(1000 + LANE_HOLD_MS), "intent");
  assert.equal(at(1000 + LANE_HOLD_MS + 250), "intent");
});

test("a flickering guess never reaches the intent: one miss starts the time again", () => {
  let st = startBelief();
  st = believe(st, focus(), lane(true), null, 0).state;
  st = believe(st, focus(), lane(true), null, LANE_HOLD_MS - 50).state;
  const miss = believe(st, focus(), lane(false), null, LANE_HOLD_MS);
  assert.equal(miss.belief.crowded, null);
  assert.equal(miss.state.laneSince, null);
  const again = believe(miss.state, focus(), lane(true), null, LANE_HOLD_MS + 100);
  assert.equal(responseFor(again.belief), "reflex");
});

test("the confidence of a guess stays below the intent threshold until it has held, and a fact outranks a guess", () => {
  let st = startBelief();
  const r1 = believe(st, focus(), lane(true), null, 0);
  st = r1.state;
  assert.ok(r1.belief.confidence < INTENT_CONFIDENCE);
  const r2 = believe(st, focus(), lane(true), null, LANE_HOLD_MS - 1);
  assert.ok(r2.belief.confidence < INTENT_CONFIDENCE);
  const both = believe(r2.state, focus({ crowded: true }), lane(true), null, LANE_HOLD_MS);
  assert.equal(both.belief.crowded, "pointer");
  assert.equal(both.belief.confidence, 1);
});
