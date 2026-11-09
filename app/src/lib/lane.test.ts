// Run with: node --test src/lib/lane.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  ANCHOR_TTL_MS,
  CARET_PX_PER_S,
  ESCAPE_PX,
  LANE_AHEAD,
  LANE_LEAD_S,
  LANE_BEHIND,
  LANE_HALF_H,
  STEP_CAP_MS,
  TAU_CAP_S,
  escapeRow,
  initialLane,
  inLane,
  laneFor,
  stepLane,
  type LaneInput,
  type LaneState,
} from "./lane.ts";

const base = (o: Partial<LaneInput> = {}): LaneInput => ({
  idleMs: 0,
  cat: { x: 1000, y: 500 },
  pointer: { dx: -200, dy: 0 }, // the pointer is 200 px to the left of the cat: (800, 500)
  click: null,
  ...o,
});

/** A cat at (x, y) with the pointer at the fixed place (800, 500): the probe gives the pointer relative to the cat. */
const catAt = (x: number, y: number): Partial<LaneInput> => ({ cat: { x, y }, pointer: { dx: 800 - x, dy: 500 - y } });

/** Feed [time, input] pairs and return the last answer and state. */
function run(steps: [number, Partial<LaneInput>][], start: LaneState = initialLane()) {
  let state = start;
  let out = stepLane(state, base(), 0).out;
  for (const [t, i] of steps) {
    const r = stepLane(state, base(i), t);
    state = r.state;
    out = r.out;
  }
  return { state, out };
}

test("there is no lane until the user types or clicks", () => {
  const r = run([[0, { idleMs: 10_000 }]]);
  assert.equal(r.out.lane, null);
  assert.equal(r.out.crowded, false);
});

test("without a click, typing anchors the lane at the pointer", () => {
  const r = run([[0, {}]]);
  assert.deepEqual(r.state.anchor, { x: 800, y: 500 });
  assert.equal(r.out.caretX, 800); // no typing time yet
});

test("the caret moves along the row at a typist's speed while the user types", () => {
  const steps: [number, Partial<LaneInput>][] = [];
  for (let t = 0; t <= 4000; t += 250) steps.push([t, { idleMs: 100 }]);
  const r = run(steps);
  assert.equal(r.state.tauMs, 4000);
  assert.equal(r.out.caretX, 800 + CARET_PX_PER_S * 4);
});

test("typing time is only counted while the user types, and a long polling gap cannot make the caret jump", () => {
  let r = run([[0, { idleMs: 100 }], [250, { idleMs: 100 }]]);
  assert.equal(r.state.tauMs, 250);
  // the user pauses (idle 2 s): nothing is added, the anchor stays
  r = run([[500, { idleMs: 2000 }]], r.state);
  assert.equal(r.state.tauMs, 250);
  // typing again after a long gap between probes: one step adds at most STEP_CAP_MS
  r = run([[600, { idleMs: 100 }], [20_000, { idleMs: 100 }]], r.state);
  assert.equal(r.state.tauMs, 250 + STEP_CAP_MS);
});

test("the typing time is capped", () => {
  let state = initialLane();
  for (let t = 0; t <= 200_000; t += 500) state = stepLane(state, base({ idleMs: 50 }), t).state;
  assert.equal(state.tauMs, TAU_CAP_S * 1000);
});

test("the band reaches behind the anchor and past the predicted caret, and half a cat above and below the row", () => {
  const l = laneFor({ x: 800, y: 500 }, 4000);
  assert.deepEqual(l, { x0: 800 - LANE_BEHIND, x1: 800 + CARET_PX_PER_S * (4 + LANE_LEAD_S) + LANE_AHEAD, y0: 500 - LANE_HALF_H, y1: 500 + LANE_HALF_H });
  assert.ok(inLane(l, 800, 500));
  assert.ok(!inLane(l, 800, 500 + LANE_HALF_H + 1));
  assert.ok(!inLane(l, 800 - LANE_BEHIND - 1, 500));
});

test("a click puts the anchor there and restarts the typing time", () => {
  let r = run([[0, { idleMs: 100 }], [250, { idleMs: 100 }], [500, { idleMs: 100 }]]);
  assert.equal(r.state.tauMs, 500);
  r = run([[600, { idleMs: 100, click: { x: 300, y: 200, ageMs: 50 } }]], r.state);
  assert.deepEqual(r.state.anchor, { x: 300, y: 200 });
  assert.equal(r.state.tauMs, 0);
});

test("the same click read again is not a new click", () => {
  let r = run([[1000, { idleMs: 100, click: { x: 300, y: 200, ageMs: 100 } }]]);
  r = run([[1250, { idleMs: 100, click: { x: 300, y: 200, ageMs: 350 } }], [1500, { idleMs: 100, click: { x: 300, y: 200, ageMs: 600 } }]], r.state);
  assert.ok(r.state.tauMs > 0, "the typing time keeps growing");
  // a click made after that one is a new click
  r = run([[2000, { idleMs: 100, click: { x: 700, y: 400, ageMs: 100 } }]], r.state);
  assert.deepEqual(r.state.anchor, { x: 700, y: 400 });
  assert.equal(r.state.tauMs, 0);
});

test("the cat is crowded only when the user is active and it stands inside the band", () => {
  // anchor (800, 500), cat at (1000, 500): inside the band (x up to 800 + 200)
  assert.equal(run([[0, {}]]).out.crowded, true);
  // above the band
  assert.equal(run([[0, catAt(1000, 500 - LANE_HALF_H - 5)]]).out.crowded, false);
  // far past where the text can reach
  assert.equal(run([[0, catAt(800 + LANE_AHEAD + CARET_PX_PER_S * LANE_LEAD_S + 50, 500)]]).out.crowded, false);
  // behind the anchor, outside the band
  assert.equal(run([[0, catAt(800 - LANE_BEHIND - 50, 500)]]).out.crowded, false);
});

test("the cat inside the band is not crowded while the user rests, and the band is forgotten after a long pause", () => {
  const typed = run([[0, {}]]);
  const rest = run([[4000, { idleMs: 4000 }]], typed.state);
  assert.ok(rest.out.lane !== null);
  assert.equal(rest.out.crowded, false);
  const gone = run([[70_000, { idleMs: ANCHOR_TTL_MS }]], typed.state);
  assert.equal(gone.out.lane, null);
  assert.equal(gone.state.anchor, null);
});

test("the text reaches a cat that stands ahead of the caret as the user keeps typing", () => {
  // the cat is 500 px to the right of the anchor, clear of the band at first
  const cat = catAt(1300, 500);
  let state = initialLane();
  let first = stepLane(state, base(cat), 0);
  state = first.state;
  assert.equal(first.out.crowded, false);
  let crowdedAt = -1;
  for (let t = 250; t <= 20_000 && crowdedAt < 0; t += 250) {
    const r = stepLane(state, base({ ...cat, idleMs: 50 }), t);
    state = r.state;
    if (r.out.crowded) crowdedAt = t;
  }
  assert.ok(crowdedAt > 0, "the band eventually reaches the cat");
  // the band reaches 1300 when 800 + 60 (t + 1.5 s) + 200 = 1300
  assert.ok(Math.abs(crowdedAt / 1000 - ((500 - LANE_AHEAD) / CARET_PX_PER_S - LANE_LEAD_S)) < 0.6);
});

test("with the idle time unknown there is no lane and no wrong crowding", () => {
  const r = run([[0, { idleMs: null }]]);
  assert.equal(r.out.lane, null);
  assert.equal(r.out.crowded, false);
});

test("an old click on record is not re-applied after the lane expired", () => {
  let r = run([[0, { idleMs: 100, click: { x: 300, y: 200, ageMs: 10 } }]]);
  r = run([[ANCHOR_TTL_MS + 5000, { idleMs: ANCHOR_TTL_MS + 1000, click: { x: 300, y: 200, ageMs: ANCHOR_TTL_MS + 5010 } }]], r.state);
  assert.equal(r.state.anchor, null);
});

test("escaping: the side with more room is taken, a row ESCAPE_PX from the anchor row", () => {
  const lane = laneFor({ x: 800, y: 500 }, 0);
  const up = escapeRow(lane, 520, 600, 200);
  assert.deepEqual(up, { dir: -1, dist: 520 - (500 - ESCAPE_PX) });
  const down = escapeRow(lane, 520, 100, 400);
  assert.deepEqual(down, { dir: 1, dist: 500 + ESCAPE_PX - 520 });
});

test("escaping: only the side that has the room, and none when neither does", () => {
  const lane = laneFor({ x: 800, y: 500 }, 0);
  assert.equal(escapeRow(lane, 500, 10, 400)?.dir, 1);
  assert.equal(escapeRow(lane, 500, 400, 10)?.dir, -1);
  assert.equal(escapeRow(lane, 500, 10, 10), null);
});
