// Tests of the hero's tour sequencer (site/tour.js) with a fake clock. Run: node --test scripts/site/
import test from "node:test";
import assert from "node:assert/strict";
import { createTour } from "../../site/tour.js";
import { SCENES, LOOPS, RESUME_LOOPS, RESUME_MS } from "../../site/scenes.js";

/** A fake clock: timers fire in time order when the clock is advanced. */
function clock() {
  let now = 0, id = 0;
  const jobs = new Map();
  return {
    timers: {
      set(fn, ms) { const k = ++id; jobs.set(k, { at: now + ms, fn }); return k; },
      clear(k) { jobs.delete(k); },
    },
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = [...jobs.entries()].filter(([, j]) => j.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
        if (!due) break;
        now = due[1].at;
        jobs.delete(due[0]);
        due[1].fn();
      }
      now = end;
    },
    get pending() { return jobs.size; },
  };
}

const scenes = [
  { id: "a", ms: 1000 },
  { id: "b", ms: 1000, hold: 400 },
  { id: "c", ms: 1000 },
];

function make(opts = {}) {
  const c = clock();
  const log = [];
  const tour = createTour({
    scenes, loops: 2, resumeMs: 5000, resumeLoops: 1, timers: c.timers,
    onScene: (i, o) => log.push(`${scenes[i].id}${o.user ? "!" : ""}`),
    onHold: (i) => log.push(`hold:${scenes[i].id}`),
    onSettle: () => log.push("settle"),
    ...opts,
  });
  return { c, log, tour };
}

test("it plays the scenes in order, loops times, then settles once", () => {
  const { c, log, tour } = make();
  tour.start();
  c.advance(10_000);
  assert.deepEqual(log, ["a", "b", "hold:b", "c", "a", "b", "hold:b", "c", "settle"]);
  assert.equal(tour.settled, true);
  assert.equal(c.pending, 0, "no timer is left running once it has settled");
});

test("a block pauses it, and when it ends the tour goes on with the next scene", () => {
  const { c, log, tour } = make();
  tour.start();
  c.advance(1500); // a, then b
  tour.block("hidden");
  c.advance(60_000);
  assert.deepEqual(log, ["a", "b", "hold:b"], "nothing changes while blocked");
  assert.equal(c.pending, 0);
  tour.unblock("hidden");
  assert.deepEqual(log.slice(-1), ["c"]);
});

test("several blocks must all end", () => {
  const { c, log, tour } = make();
  tour.start();
  tour.block("hidden");
  tour.block("paused");
  tour.unblock("hidden");
  c.advance(5000);
  assert.deepEqual(log, ["a"], "still blocked by the pause button");
  tour.unblock("paused");
  assert.equal(log.at(-1), "b");
});

test("a block that ends with a grace period waits, and a new block cancels the wait", () => {
  const { c, log, tour } = make();
  tour.start();
  tour.block("hover");
  tour.unblock("hover", 2500);
  c.advance(2000);
  assert.deepEqual(log, ["a"]);
  tour.block("hover");
  c.advance(10_000);
  assert.deepEqual(log, ["a"], "the pointer came back: still waiting");
  tour.unblock("hover", 2500);
  c.advance(2500);
  assert.equal(log.at(-1), "b");
});

test("starting while blocked shows nothing until the block ends", () => {
  const { c, log, tour } = make();
  tour.block("offscreen");
  tour.start();
  c.advance(5000);
  assert.deepEqual(log, []);
  tour.unblock("offscreen");
  assert.deepEqual(log, ["a"]);
});

test("a visitor who takes control stops the tour; after the quiet time it plays the resume rounds and settles", () => {
  const { c, log, tour } = make();
  tour.start();
  c.advance(500);
  tour.select(2); // chose scene c
  assert.equal(log.at(-1), "c!");
  c.advance(4900);
  assert.deepEqual(log, ["a", "c!"], "nothing happens during the quiet time");
  tour.interact(); // a second interaction restarts the quiet time
  c.advance(4900);
  assert.equal(log.length, 2);
  c.advance(200);
  // resumes after the chosen scene: the day was at its last scene, so it starts again with a
  c.advance(10_000);
  assert.deepEqual(log.slice(2), ["a", "b", "hold:b", "c", "settle"]);
});

test("after it has settled, an interaction and the quiet time start one more round from the beginning", () => {
  const { c, log, tour } = make();
  tour.start();
  c.advance(10_000);
  assert.equal(tour.settled, true);
  log.length = 0;
  tour.interact(); // a click on the cat
  c.advance(5000);
  assert.deepEqual(log, ["a", "b"].slice(0, 1), "it begins the day again");
  c.advance(10_000);
  assert.equal(log.at(-1), "settle");
  assert.equal(log.filter((x) => x === "a").length, 1, "only one round");
});

test("the Pause button blocks even when the quiet time ends", () => {
  const { c, log, tour } = make();
  tour.start();
  tour.block("paused");
  tour.interact();
  c.advance(30_000);
  assert.deepEqual(log, ["a"]);
  tour.unblock("paused");
  assert.ok(log.length > 1, "it goes on once Pause is released");
});

test("destroy stops every timer", () => {
  const { c, tour } = make();
  tour.start();
  tour.interact();
  tour.destroy();
  assert.equal(c.pending, 0);
});

test("the real scenes: ordered ids, durations, holds shorter than the scene, and settings in range", () => {
  assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  for (const s of SCENES) {
    assert.ok(s.ms >= 3000 && s.ms <= 6000, `${s.id}: a scene lasts 3 to 6 seconds`);
    if (s.hold) assert.ok(s.hold < s.ms, `${s.id}: the hold ends before the scene`);
    assert.ok(s.dir === 1 || s.dir === -1);
  }
  assert.equal(LOOPS, 1);
  assert.equal(RESUME_LOOPS, 1);
  assert.ok(RESUME_MS >= 5000);
  const total = SCENES.reduce((n, s) => n + s.ms, 0) * LOOPS;
  assert.ok(total < 60_000, `the tour settles within a minute (${total} ms)`);
});

test("with the default (real) timers it runs and settles", async () => {
  const seen = [];
  const quick = [{ id: "a", ms: 5 }, { id: "b", ms: 5 }];
  await new Promise((resolve) => {
    const tour = createTour({ scenes: quick, loops: 1, resumeMs: 50, resumeLoops: 1, onScene: (i) => seen.push(i), onSettle: () => resolve() });
    tour.start();
  });
  assert.deepEqual(seen, [0, 1]);
});
