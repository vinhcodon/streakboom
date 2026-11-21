import { test } from "node:test";
import assert from "node:assert/strict";
import { SCENES, SCENE_GAP_MS, ROLL, TIDY_BALL, cancel, due, isLive, mayStart, newDirector, onOutChanged, start, type StartContext } from "./scene.ts";

const T0 = 10_000_000;
const ctx = (o: Partial<StartContext> = {}): StartContext => ({ now: T0, mode: "free", quiet: false, reactionActive: false, busy: false, reducedMotion: false, out: ["peak", "paws"], ...o });

test("a scene starts only when both pets are out and nothing blocks it", () => {
  const d = newDirector();
  assert.equal(mayStart(d, ctx()), true);
  assert.equal(mayStart(d, ctx({ out: ["peak"] })), false);
  assert.equal(mayStart(d, ctx({ out: ["paws"] })), false);
  assert.equal(mayStart(d, ctx({ mode: "work" })), false, "the attention rule: no own-cause action while the person works");
  assert.equal(mayStart(d, ctx({ quiet: true })), false);
  assert.equal(mayStart(d, ctx({ reactionActive: true })), false, "one reaction at a time: the shared gate");
  assert.equal(mayStart(d, ctx({ busy: true })), false);
  assert.equal(mayStart(d, ctx({ reducedMotion: true })), false);
});

test("the beats come due in order on the fake clock and the scene ends at its duration", () => {
  let d = newDirector();
  const r = start(d, ctx(), TIDY_BALL)!;
  d = r.state;
  let got: string[] = [];
  for (let t = 0; t <= TIDY_BALL.durationMs + 1000; t += 500) {
    const x = due(d, r.token, T0 + t);
    d = x.state;
    got = got.concat(x.beats.map((b) => `${b.who}:${b.act}`));
    if (x.ended) break;
  }
  assert.equal(got.length, TIDY_BALL.beats.length);
  assert.equal(got[0], "ball:wait");
  assert.equal(d.scene, null);
  assert.equal(d.lastEndedAt > 0, true);
});

test("the gap: no new scene until SCENE_GAP_MS after the end", () => {
  let d = newDirector();
  const r = start(d, ctx(), ROLL)!;
  d = due(r.state, r.token, T0 + ROLL.durationMs + 1).state;
  assert.equal(mayStart(d, ctx({ now: T0 + ROLL.durationMs + 1000 })), false);
  assert.equal(mayStart(d, ctx({ now: T0 + ROLL.durationMs + 1 + SCENE_GAP_MS })), true);
});

test("15: a touch cancels the scene at once, the later beats never come, and an old callback is stale", () => {
  let d = newDirector();
  const r = start(d, ctx())!;
  d = r.state;
  d = due(d, r.token, T0 + 5000).state;
  const c = cancel(d, T0 + 5001, "touch");
  assert.equal(c.wasRunning, true);
  d = c.state;
  assert.equal(isLive(d, r.token), false);
  assert.deepEqual(due(d, r.token, T0 + 60_000).beats, [], "a callback of the old token delivers nothing");
  assert.equal(cancel(d, T0 + 5002, "touch").wasRunning, false, "cancelling twice is harmless");
});

test("6: when a pet goes in the scene is cancelled; with both out it keeps going", () => {
  let d = start(newDirector(), ctx())!.state;
  assert.equal(onOutChanged(d, T0 + 1, ["peak", "paws"]).wasRunning, false);
  const c = onOutChanged(d, T0 + 2, ["peak"]);
  assert.equal(c.wasRunning, true);
  assert.equal(c.state.scene, null);
});

test("the scenes are in turn, one at a time, and every one names two pets and has beats in time order", () => {
  let d = newDirector();
  const ids: string[] = [];
  let now = T0;
  for (let i = 0; i < 4; i++) {
    const r = start(d, ctx({ now }))!;
    ids.push(r.state.scene!.id);
    assert.equal(start(r.state, ctx({ now })), null, "a second start while one runs is refused");
    d = due(r.state, r.token, now + 60_000).state;
    now += 60_000 + SCENE_GAP_MS;
  }
  assert.deepEqual(ids, ["tidy-ball", "shift-away", "roll", "tidy-ball"]);
  for (const s of SCENES) {
    assert.equal(new Set(s.pets).size, 2);
    for (let i = 1; i < s.beats.length; i++) assert.ok(s.beats[i].t >= s.beats[i - 1].t, s.id);
    assert.ok(s.beats[s.beats.length - 1].t < s.durationMs, s.id);
  }
});

test("no scene speaks: a beat has no text and no bubble", () => {
  for (const s of SCENES) for (const b of s.beats) assert.equal("say" in b || "text" in b, false);
});

test("3 (roll): the reaction of Peak comes after the action of Paws, with a delay", () => {
  const push = ROLL.beats.find((b) => b.who === "paws" && b.act === "nudge")!;
  const look = ROLL.beats.find((b) => b.who === "peak" && b.act === "face")!;
  assert.ok(look.t - push.t >= 300);
});
