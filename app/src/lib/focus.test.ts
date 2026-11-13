// Run with: node --test src/lib/focus.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_MS,
  CALM_MS,
  CROWD_MS,
  CROWD_OFF_MS,
  LEAVE_MIN_ROOM_PX,
  LINE_MS,
  NEAR_PX,
  SLEEP_CROWD_MS,
  decideFocus,
  initialFocus,
  type FocusInput,
  type FocusState,
  wakesToMakeWay,
} from "./focus.ts";

const near = { dist: 80, over: false, dx: 60 };
const input = (o: Partial<FocusInput> = {}): FocusInput => ({ idleMs: 0, pointer: near, busy: false, quiet: false, ...o });

/** Feed a list of [time, input] probes and return the answers. */
function run(steps: [number, Partial<FocusInput>][], start: FocusState = initialFocus()) {
  let state = start;
  return steps.map(([t, i]) => {
    const r = decideFocus(state, input(i), t);
    state = r.state;
    return r.out;
  });
}

test("unknown idle time means no restriction at all (a platform without the probe behaves as before)", () => {
  for (const idleMs of [null, NaN, -5, Infinity]) {
    const r = decideFocus(initialFocus(), input({ idleMs: idleMs as number | null }), 1000);
    assert.equal(r.out.walkAllowed, true, String(idleMs));
    assert.equal(r.out.keepWalking, true);
    assert.equal(r.out.speakAllowed, true);
    assert.equal(r.out.crowded, false);
    assert.equal(r.out.active, false);
    assert.deepEqual(r.state, initialFocus());
  }
});

test("walking and speaking need a pause: both limits are exact", () => {
  const w = (idleMs: number) => decideFocus(initialFocus(), input({ idleMs, pointer: null }), 0).out;
  assert.equal(w(CALM_MS - 1).walkAllowed, false);
  assert.equal(w(CALM_MS).walkAllowed, true);
  assert.equal(w(LINE_MS - 1).speakAllowed, false);
  assert.equal(w(LINE_MS).speakAllowed, true);
  assert.equal(w(0).walkAllowed, false);
  assert.equal(w(0).speakAllowed, false);
  assert.equal(w(ACTIVE_MS - 1).active, true);
  assert.equal(w(ACTIVE_MS).active, false);
});

test("the cat feels crowded only after the user has worked near it for the hold time", () => {
  const out = run([
    [0, { idleMs: 100 }],
    [CROWD_MS - 1, { idleMs: 200 }],
    [CROWD_MS, { idleMs: 300 }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, false, true]);
});

test('"near" is strictly under the radius; far, unknown or over the cat never crowds it', () => {
  const crowded = (pointer: FocusInput["pointer"]) => run([[0, { idleMs: 0, pointer }], [CROWD_MS, { idleMs: 0, pointer }]])[1].crowded;
  assert.equal(crowded({ dist: NEAR_PX - 1, over: false }), true);
  assert.equal(crowded({ dist: NEAR_PX, over: false }), false);
  assert.equal(crowded({ dist: 5000, over: false }), false);
  assert.equal(crowded(null), false);
  assert.equal(crowded({ dist: 10, over: true }), false); // the user is touching the cat
  assert.equal(crowded({ dist: NaN, over: false }), false);
});

test("the pointer going onto the cat ends it at once, even in the middle of typing", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [CROWD_MS, { idleMs: 0 }],
    [CROWD_MS + 1000, { idleMs: 0, pointer: { dist: 20, over: true } }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, true, false]);
});

test("it ends when the user stops, at the exact limit, and does not start again until they type again", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [CROWD_MS, { idleMs: 0 }], // crowded
    [CROWD_MS + 1000, { idleMs: CROWD_OFF_MS - 1 }], // a pause, still crowded
    [CROWD_MS + 2000, { idleMs: CROWD_OFF_MS }], // over
    [CROWD_MS + 3000, { idleMs: CROWD_OFF_MS + 100 }], // still active by the 3 s rule, but no flicker
    [CROWD_MS + 4000, { idleMs: CROWD_OFF_MS + 1100 }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, true, true, false, false, false]);
});

test("typing again after it ended starts the hold again", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [CROWD_MS, { idleMs: 0 }], // crowded
    [3000, { idleMs: 2000 }], // over
    [3100, { idleMs: 50 }], // typing again: the hold starts
    [3100 + CROWD_MS - 1, { idleMs: 60 }],
    [3100 + CROWD_MS, { idleMs: 70 }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, true, false, false, false, true]);
});

test("a moving pointer is the user reaching for something: it never crowds the cat and restarts the hold", () => {
  const still = { dist: 100, over: false };
  const moving = { dist: 100, over: false, moving: true };
  const out = run([
    [0, { idleMs: 0, pointer: moving }],
    [CROWD_MS * 2, { idleMs: 0, pointer: moving }], // moving for a long time: still not crowded
    [CROWD_MS * 2 + 100, { idleMs: 0, pointer: still }], // stops: the hold starts now
    [CROWD_MS * 2 + 100 + CROWD_MS - 1, { idleMs: 0, pointer: still }],
    [CROWD_MS * 2 + 100 + CROWD_MS, { idleMs: 0, pointer: still }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, false, false, false, true]);
  // already crowded: a jittering pointer does not end it
  const kept = run([
    [0, { idleMs: 0, pointer: still }],
    [CROWD_MS, { idleMs: 0, pointer: still }],
    [CROWD_MS + 200, { idleMs: 0, pointer: moving }],
  ]);
  assert.deepEqual(kept.map((o) => o.crowded), [false, true, true]);
});

test("a break in 'active and near' restarts the hold (no crowding from scattered moments)", () => {
  const out = run([
    [0, { idleMs: 0 }], // starts holding
    [200, { idleMs: 0, pointer: { dist: 500, over: false } }], // pointer away: reset
    [400, { idleMs: 0 }], // starts again
    [400 + CROWD_MS - 1, { idleMs: 0 }],
    [400 + CROWD_MS, { idleMs: 0 }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, false, false, false, true]);
});

test("a pause before the hold is over cancels it", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [250, { idleMs: CROWD_OFF_MS }], // stopped typing
    [300, { idleMs: 0 }], // typing again: a new hold, not the old one
    [320, { idleMs: 10 }],
  ]);
  assert.deepEqual(out.map((o) => o.crowded), [false, false, false, false]);
});

test("fullscreen, presentation, a locked session and Quiet mode keep the cat from reacting", () => {
  for (const flag of ["busy", "quiet"] as const) {
    const out = run([
      [0, { idleMs: 0, [flag]: true }],
      [CROWD_MS, { idleMs: 0, [flag]: true }],
    ]);
    assert.deepEqual(out.map((o) => o.crowded), [false, false], flag);
  }
  const out = run([[0, { idleMs: 0 }], [CROWD_MS, { idleMs: 0 }], [CROWD_MS + 10, { idleMs: 0, busy: true }]]);
  assert.deepEqual(out.map((o) => o.crowded), [false, true, false]);
});

test("the cat leaves away from the pointer: the pointer on its right means walk left", () => {
  const dir = (dx?: number) => decideFocus(initialFocus(), input({ pointer: { dist: Math.abs(dx ?? 50), over: false, dx } }), 0).out.leaveDir;
  assert.equal(dir(60), -1);
  assert.equal(dir(1), -1);
  assert.equal(dir(-60), 1);
  assert.equal(dir(0), 1);
  assert.equal(dir(undefined), 1);
  assert.equal(decideFocus(initialFocus(), input({ pointer: null }), 0).out.leaveDir, 1);
});

test("the distance is passed on (the page walks until it is far enough)", () => {
  assert.equal(decideFocus(initialFocus(), input({ pointer: { dist: 123, over: false } }), 0).out.dist, 123);
  assert.equal(decideFocus(initialFocus(), input({ pointer: null }), 0).out.dist, null);
  assert.equal(decideFocus(initialFocus(), input({ pointer: { dist: NaN, over: false } }), 0).out.dist, null);
});

test("the walk permissions do not depend on the pointer or on feeling crowded", () => {
  const a = decideFocus(initialFocus(), input({ idleMs: 10_000, pointer: near }), 0).out;
  const b = decideFocus(initialFocus(), input({ idleMs: 10_000, pointer: null }), 0).out;
  assert.equal(a.walkAllowed, true);
  assert.equal(a.speakAllowed, true);
  assert.equal(a.walkAllowed, b.walkAllowed);
  assert.equal(a.speakAllowed, b.speakAllowed);
});

test("a walk in progress goes on unless the user is active near the cat (no stopping in mid-step for work far away)", () => {
  const keep = (idleMs: number, pointer: FocusInput["pointer"]) => decideFocus(initialFocus(), input({ idleMs, pointer }), 0).out.keepWalking;
  assert.equal(keep(100, { dist: 600, over: false }), true); // active, but far from the cat
  assert.equal(keep(100, { dist: NEAR_PX - 1, over: false }), false); // active and near
  assert.equal(keep(100, { dist: 10, over: true }), false); // active, on the cat
  assert.equal(keep(100, null), false); // active, pointer unknown: be careful
  assert.equal(keep(ACTIVE_MS, { dist: 10, over: false }), true); // not active any more
  assert.equal(keep(60_000, null), true);
});

test("the previous state is never modified", () => {
  const prev: FocusState = { crowded: true, nearSince: 5 };
  const copy = { ...prev };
  decideFocus(prev, input({ idleMs: 0 }), 100);
  decideFocus(prev, input({ idleMs: 9999 }), 100);
  assert.deepEqual(prev, copy);
});

test("invariants over thousands of random probes", () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let state = initialFocus();
  let now = 0;
  let sawCrowded = false;
  let sawHeld = false;
  for (let n = 0; n < 5000; n++) {
    now += Math.floor(rnd() * 1500);
    const i: FocusInput = {
      idleMs: rnd() < 0.05 ? null : Math.floor(rnd() * (rnd() < 0.5 ? 3000 : 12000)),
      pointer: rnd() < 0.1 ? null : { dist: rnd() * 600, over: rnd() < 0.15, moving: rnd() < 0.2, dx: rnd() * 600 - 300 },
      busy: rnd() < 0.05,
      quiet: rnd() < 0.05,
    };
    const r = decideFocus(state, i, now);
    state = r.state;
    const o = r.out;
    if (o.crowded) {
      sawCrowded = true;
      assert.ok(i.idleMs !== null && i.idleMs < CROWD_OFF_MS, "crowded needs recent input");
      assert.ok(i.pointer && !i.pointer.over && i.pointer.dist < NEAR_PX, "crowded needs the pointer near and off the cat");
      assert.ok(!i.busy && !i.quiet, "not while hidden");
    } else if (i.pointer && !i.pointer.over && i.pointer.dist < NEAR_PX && i.idleMs !== null && i.idleMs < CROWD_OFF_MS && !i.busy && !i.quiet) sawHeld = true;
    if (i.busy) {
      assert.ok(!o.walkAllowed && !o.keepWalking && !o.speakAllowed && !o.crowded, "busy keeps the cat still and quiet");
    } else if (i.idleMs !== null) {
      assert.equal(o.walkAllowed, i.idleMs >= CALM_MS);
      assert.equal(o.speakAllowed, i.idleMs >= LINE_MS);
    } else assert.ok(o.walkAllowed && o.speakAllowed && !o.crowded);
    if (o.speakAllowed) assert.ok(o.walkAllowed, "a line waits longer than a walk");
    assert.ok(o.leaveDir === 1 || o.leaveDir === -1);
  }
  assert.ok(sawCrowded, "the random run did crowd the cat at least once");
  assert.ok(sawHeld, "and sometimes held it back during the hold time");
});

test("the limits are ordered: hold < active < walk < line, and it ends before the user counts as idle", () => {
  assert.ok(CROWD_MS < ACTIVE_MS);
  assert.ok(CROWD_OFF_MS < ACTIVE_MS);
  assert.ok(ACTIVE_MS < CALM_MS);
  assert.ok(CALM_MS < LINE_MS);
});

test("a sleeping cat wakes to make way only after being crowded for several seconds and only if it can leave", () => {
  const room = LEAVE_MIN_ROOM_PX;
  assert.equal(wakesToMakeWay(true, SLEEP_CROWD_MS, room), true);
  assert.equal(wakesToMakeWay(true, SLEEP_CROWD_MS - 1, room), false); // not yet: a passing pointer does not wake it
  assert.equal(wakesToMakeWay(true, null, room), false); // not crowded
  assert.equal(wakesToMakeWay(true, SLEEP_CROWD_MS * 5, room - 1), false); // nowhere to go: it stays curled up
  assert.equal(wakesToMakeWay(false, SLEEP_CROWD_MS * 5, room * 5), false); // an awake cat is handled by making way
  assert.ok(SLEEP_CROWD_MS > CROWD_MS, "waking needs more than the hold that makes it crowded");
});

// AP-08 (spec 14): fullscreen, presentation mode or a locked session keeps the cat still and quiet.
test("busy: no walk may start, a walk in progress stops and no line is shown, however long the user has been idle", () => {
  for (const idleMs of [0, 500, CALM_MS, LINE_MS, 10 * 60_000]) {
    const { out } = decideFocus(initialFocus(), input({ idleMs, busy: true, pointer: null }), 1000);
    assert.equal(out.walkAllowed, false, `walk, idle ${idleMs}`);
    assert.equal(out.keepWalking, false, `keep walking, idle ${idleMs}`);
    assert.equal(out.speakAllowed, false, `speak, idle ${idleMs}`);
    assert.equal(out.crowded, false);
  }
});

test("busy holds even when the idle time is unknown (the probe cannot read it)", () => {
  const { out } = decideFocus(initialFocus(), input({ idleMs: null, busy: true }), 1000);
  assert.equal(out.walkAllowed, false);
  assert.equal(out.keepWalking, false);
  assert.equal(out.speakAllowed, false);
});

test("not busy changes nothing: the same answers as before this rule", () => {
  const a = decideFocus(initialFocus(), input({ idleMs: CALM_MS, busy: false, pointer: null }), 1000).out;
  assert.equal(a.walkAllowed, true);
  assert.equal(a.speakAllowed, CALM_MS >= LINE_MS);
  const b = decideFocus(initialFocus(), input({ idleMs: null, busy: false }), 1000).out;
  assert.equal(b.walkAllowed && b.keepWalking && b.speakAllowed, true);
});

test("when busy ends the cat may act again at once and the hold on feeling crowded starts over", () => {
  let s = initialFocus();
  s = decideFocus(s, input({ idleMs: 0 }), 0).state;
  const busy = decideFocus(s, input({ idleMs: 0, busy: true }), CROWD_MS + 10);
  assert.equal(busy.state.crowded, false);
  assert.equal(busy.state.nearSince, null);
  const after = decideFocus(busy.state, input({ idleMs: LINE_MS + 1, busy: false, pointer: null }), CROWD_MS + 20).out;
  assert.equal(after.walkAllowed, true);
  assert.equal(after.speakAllowed, true);
});
