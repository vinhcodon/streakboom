// Run with: node --test src/lib/focus.test.ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVE_MS,
  CALM_MS,
  GHOST_ALPHA,
  GHOST_OFF_MS,
  GHOST_ON_MS,
  LINE_MS,
  NEAR_PX,
  decideFocus,
  initialFocus,
  type FocusInput,
  type FocusState,
} from "./focus.ts";

const near = { dist: 80, over: false };
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
    assert.deepEqual(r.out, { walkAllowed: true, keepWalking: true, speakAllowed: true, ghost: false, alpha: 1, active: false }, String(idleMs));
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

test("the cat fades only after the user has been active near it for the hold time", () => {
  const out = run([
    [0, { idleMs: 100 }],
    [GHOST_ON_MS - 1, { idleMs: 200 }],
    [GHOST_ON_MS, { idleMs: 300 }],
  ]);
  assert.deepEqual(out.map((o) => o.ghost), [false, false, true]);
  assert.equal(out[2].alpha, GHOST_ALPHA);
  assert.equal(out[0].alpha, 1);
});

test('"near" is strictly under the radius; far, unknown or over the cat never fades it', () => {
  const faded = (pointer: FocusInput["pointer"]) => run([[0, { idleMs: 0, pointer }], [GHOST_ON_MS, { idleMs: 0, pointer }]])[1].ghost;
  assert.equal(faded({ dist: NEAR_PX - 1, over: false }), true);
  assert.equal(faded({ dist: NEAR_PX, over: false }), false);
  assert.equal(faded({ dist: 5000, over: false }), false);
  assert.equal(faded(null), false);
  assert.equal(faded({ dist: 10, over: true }), false); // the user is touching the cat
  assert.equal(faded({ dist: NaN, over: false }), false);
});

test("the pointer going onto the cat brings it back at once, even in the middle of typing", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [GHOST_ON_MS, { idleMs: 0 }],
    [GHOST_ON_MS + 1000, { idleMs: 0, pointer: { dist: 20, over: true } }],
  ]);
  assert.deepEqual(out.map((o) => o.ghost), [false, true, false]);
});

test("it comes back when the user stops, at the exact limit, and does not fade again until they type again", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [GHOST_ON_MS, { idleMs: 0 }], // faded
    [GHOST_ON_MS + 1000, { idleMs: GHOST_OFF_MS - 1 }], // a pause, still faded
    [GHOST_ON_MS + 2000, { idleMs: GHOST_OFF_MS }], // back
    [GHOST_ON_MS + 3000, { idleMs: GHOST_OFF_MS + 100 }], // still active by the 3 s rule, but no flicker
    [GHOST_ON_MS + 4000, { idleMs: GHOST_OFF_MS + 1100 }],
  ]);
  assert.deepEqual(out.map((o) => o.ghost), [false, true, true, false, false, false]);
});

test("typing again after coming back fades it again only after the hold time", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [GHOST_ON_MS, { idleMs: 0 }], // faded
    [2000, { idleMs: 2000 }], // back
    [2100, { idleMs: 50 }], // typing again: the hold starts
    [2100 + GHOST_ON_MS - 1, { idleMs: 60 }],
    [2100 + GHOST_ON_MS, { idleMs: 70 }],
  ]);
  assert.deepEqual(out.map((o) => o.ghost), [false, true, false, false, false, true]);
});

test("a break in 'active and near' restarts the hold (no fading from scattered moments)", () => {
  const out = run([
    [0, { idleMs: 0 }], // starts holding
    [200, { idleMs: 0, pointer: { dist: 500, over: false } }], // pointer away: reset
    [400, { idleMs: 0 }], // starts again
    [400 + GHOST_ON_MS - 1, { idleMs: 0 }],
    [400 + GHOST_ON_MS, { idleMs: 0 }],
  ]);
  assert.deepEqual(out.map((o) => o.ghost), [false, false, false, false, true]);
});

test("a pause before the hold is over cancels it", () => {
  const out = run([
    [0, { idleMs: 0 }],
    [250, { idleMs: GHOST_OFF_MS }], // stopped typing
    [300, { idleMs: 0 }], // typing again: a new hold, not the old one
    [320, { idleMs: 10 }],
  ]);
  assert.deepEqual(out.map((o) => o.ghost), [false, false, false, false]);
});

test("fullscreen, presentation, a locked session and Quiet mode keep it from fading", () => {
  for (const flag of ["busy", "quiet"] as const) {
    const out = run([
      [0, { idleMs: 0, [flag]: true }],
      [GHOST_ON_MS, { idleMs: 0, [flag]: true }],
    ]);
    assert.deepEqual(out.map((o) => o.ghost), [false, false], flag);
  }
  // a fade in progress ends when the cat is hidden anyway
  const out = run([[0, { idleMs: 0 }], [GHOST_ON_MS, { idleMs: 0 }], [GHOST_ON_MS + 10, { idleMs: 0, busy: true }]]);
  assert.deepEqual(out.map((o) => o.ghost), [false, true, false]);
});

test("the walk and line permissions do not depend on the pointer or on fading", () => {
  const a = decideFocus(initialFocus(), input({ idleMs: 10_000, pointer: near }), 0).out;
  const b = decideFocus(initialFocus(), input({ idleMs: 10_000, pointer: null }), 0).out;
  assert.equal(a.walkAllowed, true);
  assert.equal(a.speakAllowed, true);
  assert.deepEqual(a, b);
});

test("the previous state is never modified", () => {
  const prev: FocusState = { ghost: true, nearSince: 5 };
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
  let sawGhost = false;
  let sawNoGhostNear = false;
  for (let n = 0; n < 5000; n++) {
    now += Math.floor(rnd() * 1500);
    const i: FocusInput = {
      idleMs: rnd() < 0.05 ? null : Math.floor(rnd() * (rnd() < 0.5 ? 3000 : 12000)),
      pointer: rnd() < 0.1 ? null : { dist: rnd() * 600, over: rnd() < 0.15 },
      busy: rnd() < 0.05,
      quiet: rnd() < 0.05,
    };
    const r = decideFocus(state, i, now);
    state = r.state;
    const o = r.out;
    if (o.ghost) {
      sawGhost = true;
      // fading implies: known recent input, the pointer near and not on the cat, the cat shown
      assert.ok(i.idleMs !== null && i.idleMs < GHOST_OFF_MS, "ghost needs recent input");
      assert.ok(i.pointer && !i.pointer.over && i.pointer.dist < NEAR_PX, "ghost needs the pointer near and off the cat");
      assert.ok(!i.busy && !i.quiet, "ghost not while hidden");
    } else if (i.pointer && !i.pointer.over && i.pointer.dist < NEAR_PX && i.idleMs !== null && i.idleMs < GHOST_OFF_MS) sawNoGhostNear = true;
    assert.equal(o.alpha, o.ghost ? GHOST_ALPHA : 1);
    if (i.idleMs !== null) {
      assert.equal(o.walkAllowed, i.idleMs >= CALM_MS);
      assert.equal(o.speakAllowed, i.idleMs >= LINE_MS);
    } else assert.ok(o.walkAllowed && o.speakAllowed && !o.ghost);
    if (o.speakAllowed) assert.ok(o.walkAllowed, "a line waits longer than a walk");
  }
  assert.ok(sawGhost, "the random run did fade the cat at least once");
  assert.ok(sawNoGhostNear, "and sometimes held it back during the hold time");
});

test("the limits are ordered: hold < come back < active < walk < line", () => {
  assert.ok(GHOST_ON_MS < GHOST_OFF_MS);
  assert.ok(GHOST_OFF_MS < ACTIVE_MS);
  assert.ok(ACTIVE_MS < CALM_MS);
  assert.ok(CALM_MS < LINE_MS);
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
