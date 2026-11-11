import { test } from "node:test";
import assert from "node:assert/strict";
import { POSE_KEYS, POSE_NAMES, type Key } from "./rig/keys.ts";
import { Rig, Spring, blendKeys, LOOKS, gaitLeg } from "./rig/engine.ts";
import { TIMED, type PetState } from "./sprites.ts";
import { stripTypeScriptTypes } from "node:module";
import { readFileSync } from "node:fs";

const shape = (v: unknown): unknown =>
  typeof v === "number" ? "n" : Array.isArray(v) ? v.map(shape) : Object.fromEntries(Object.keys(v as object).map((k) => [k, shape((v as Record<string, unknown>)[k])]));

test("every key has the same shape (so any two can be blended)", () => {
  const ref = JSON.stringify(shape(POSE_KEYS.stand.f));
  for (const n of POSE_NAMES) for (const s of ["f", "s"] as const) assert.equal(JSON.stringify(shape(POSE_KEYS[n][s])), ref, `${n}.${s}`);
});

test("blending is the identity for one key and the midpoint for two", () => {
  const a = POSE_KEYS.stand.f;
  const b = POSE_KEYS.sit.f;
  assert.deepEqual(blendKeys([a, b], [1, 0]), a);
  const m = blendKeys([a, b], [0.5, 0.5]);
  assert.ok(Math.abs(m.body.y - (a.body.y + b.body.y) / 2) < 1e-9);
});

test("a critically damped spring converges without overshoot", () => {
  const s = new Spring(0, 36);
  s.t = 1;
  let max = 0;
  for (let i = 0; i < 1200; i++) {
    s.step(1 / 120);
    max = Math.max(max, s.x);
  }
  assert.ok(max <= 1.001, `overshoot ${max}`);
  assert.ok(s.settled);
});

test("an idle cat is settled (no redraws needed)", () => {
  const r = new Rig();
  r.setPose("idle", 1, 0);
  assert.equal(r.mode, "idle");
});

const points = (k: Key): number[] => [k.head.x, k.head.y, k.body.x, k.body.y, ...k.legs.flatMap((l) => [l.fx, l.fy]), k.tail.p2[0], k.tail.p2[1]];

test("moving through every pose never jumps: per-frame displacement stays small", () => {
  const poses: PetState[] = ["idle", "walk", "idle", "held", "land", "idle", "drowsy", "sleep", "wake", "idle", "happy", "think", "look", "idle"];
  const r = new Rig();
  let prev = points(r.frame().key);
  let worst = 0;
  for (const p of poses) {
    r.setPose(p, 1, 0);
    for (let i = 0; i < 180; i++) {
      r.step(1 / 60);
      const cur = points(r.frame().key);
      for (let j = 0; j < cur.length; j++) worst = Math.max(worst, Math.abs(cur[j] - prev[j]));
      prev = cur;
    }
  }
  assert.ok(worst < 12, `largest single-frame move ${worst.toFixed(2)}px`);
});

test("turning around passes through the front view", () => {
  const r = new Rig();
  r.setPose("walk", 1, 0);
  for (let i = 0; i < 120; i++) r.step(1 / 60);
  assert.equal(r.frame().flip, false);
  r.setPose("walk", -1, 0);
  let sawFront = false;
  for (let i = 0; i < 120; i++) {
    r.step(1 / 60);
    if (Math.abs((r as unknown as { theta: Spring }).theta.x) < 0.2) sawFront = true;
  }
  assert.ok(sawFront);
  assert.equal(r.frame().flip, true);
});

test("the eyes follow the cursor when calm, and ignore it while sleeping", () => {
  const r = new Rig();
  r.setPose("idle", 1, 0);
  r.lookAt({ x: 1, y: -1 });
  for (let i = 0; i < 240; i++) r.step(1 / 120);
  const f = r.frame();
  assert.ok(f.gx > 3 && f.gy < -2, `gaze ${f.gx},${f.gy}`);
  assert.equal(r.mode, "idle"); // and it settles: no endless redrawing
  r.lookAt(null);
  for (let i = 0; i < 240; i++) r.step(1 / 120);
  assert.ok(Math.abs(r.frame().gx) < 0.05);
  r.setPose("sleep", 1, 0);
  r.lookAt({ x: 1, y: 1 });
  for (let i = 0; i < 600; i++) r.step(1 / 120);
  assert.ok(Math.abs(r.frame().gx) < 0.05);
});

test("belly-rub poses play, settle and come back to idle", () => {
  for (const p of ["purr", "huff"] as PetState[]) {
    const r = new Rig();
    r.setPose(p, 1, 0);
    for (let i = 0; i < 240; i++) r.step(1 / 120);
    r.setPose("idle", 1, 0);
    for (let i = 0; i < 1200; i++) r.step(1 / 120);
    assert.equal(r.mode, "idle", p);
  }
});

test("the mood poses play, settle and return to idle; sad folds the ears down", () => {
  for (const p of ["nod", "smirk", "gasp", "curious", "sad"] as PetState[]) {
    const r = new Rig();
    r.setPose(p, 1, 0);
    for (let i = 0; i < 240; i++) r.step(1 / 120);
    if (p === "sad") {
      const base = new Rig().frame().key.earL.b;
      const k = r.frame().key.earL.b;
      assert.ok(k[0] < base[0] - 3, `ear tip x ${k[0]} vs ${base[0]}`); // swung outward
    }
    r.setPose("idle", 1, 0);
    for (let i = 0; i < 1200; i++) r.step(1 / 120);
    assert.equal(r.mode, "idle", p);
    assert.ok(Math.abs(r.frame().key.earL.b[0] - new Rig().frame().key.earL.b[0]) < 0.1, "ears back up");
  }
});

test("every pose has a look", () => {
  for (const p of Object.keys(LOOKS)) assert.ok(POSE_NAMES.includes(LOOKS[p as PetState].base));
});

// The website copies keys.ts, engine.ts and draw.ts into plain JavaScript by only stripping the types
// (scripts/build-site.mjs). That fails on syntax that is not just types (enum, namespace, constructor parameter
// properties) or on imports of other modules, and then the site silently stops deploying. Check it here.
test("the rig files can be copied to the website by stripping types alone", () => {
  const dir = new URL("./rig/", import.meta.url);
  const allowed = new Set(["./keys.js", "./engine.js", "./draw.js"]);
  for (const name of ["keys", "engine", "draw"]) {
    const ts = readFileSync(new URL(`${name}.ts`, dir), "utf8");
    const js = stripTypeScriptTypes(ts, { mode: "strip" }).replace(/(from\s+["']\.\/\w+)\.ts(["'])/g, "$1.js$2"); // throws on non-erasable syntax
    for (const m of js.matchAll(/from\s+["']([^"']+)["']/g)) assert.ok(allowed.has(m[1]), `${name}.ts imports ${m[1]}; only the three rig files may be imported (types excepted)`);
    assert.ok(!/^\s*import\s+["']/m.test(js), `${name}.ts has a side-effect import`);
  }
});

// ---- redraw cost (PR-4): every painted frame costs real CPU with software drawing ----
const FRAME_S: Record<string, number> = { full: 1 / 60, soft: 0.041, walk: 0.033, light: 0.09, idle: Infinity };
/** Frames a loop would paint while the rig is stepped for `sec` seconds, as `PetRig.svelte` schedules them. */
function framesDuring(r: Rig, sec: number, events: (t: number) => void = () => {}): number {
  let frames = 0;
  let owed = 0; // time since the last painted frame
  for (let t = 0; t < sec; t += 1 / 120) {
    events(t);
    r.step(1 / 120);
    owed += 1 / 120;
    const gap = FRAME_S[r.mode];
    if (owed >= gap) {
      frames++;
      owed = 0;
    }
  }
  return frames;
}

test("a blink or a tail flick on a standing cat is soft motion that ends in about a second", () => {
  const r = new Rig();
  r.setPose("idle", 1, 0, true);
  for (let i = 0; i < 1200; i++) r.step(1 / 120);
  assert.equal(r.mode, "idle");
  r.blink();
  r.step(1 / 120);
  assert.equal(r.mode, "soft");
  let t = 0;
  while (r.mode !== "idle" && t < 3) { r.step(1 / 120); t += 1 / 120; }
  assert.ok(t < 1, `a blink settles in under a second, took ${t.toFixed(2)} s`);
  r.twitch();
  r.step(1 / 120);
  assert.equal(r.mode, "soft");
  t = 0;
  while (r.mode !== "idle" && t < 3) { r.step(1 / 120); t += 1 / 120; }
  assert.ok(t < 1.2, `a tail flick settles in about a second, took ${t.toFixed(2)} s`);
});

test("a pose change is a big motion (full speed); a turn or a hop too", () => {
  const r = new Rig();
  r.setPose("idle", 1, 0, true);
  for (let i = 0; i < 1200; i++) r.step(1 / 120);
  r.setPose("walk", 1, 0);
  r.step(1 / 120);
  assert.equal(r.mode, "full");
  r.setPose("held", 1, 0);
  r.step(1 / 120);
  assert.equal(r.mode, "full");
});

test("redraw budget: a standing cat that blinks every 4.5 s and flicks its tail every 13 s paints under 6 frames a second, a sleeping cat under 12", () => {
  const stand = new Rig();
  stand.setPose("idle", 1, 0, true);
  let nextBlink = 3;
  let n = 0;
  const f = framesDuring(stand, 120, (t) => {
    if (t >= nextBlink) {
      stand.blink();
      if (++n % 3 === 0) stand.twitch();
      nextBlink += 4.5;
    }
  });
  assert.ok(f / 120 < 6, `standing: ${(f / 120).toFixed(1)} frames per second`);
  const sleep = new Rig();
  sleep.setPose("sleep", 1, 0, true);
  framesDuring(sleep, 6); // falling asleep is a big motion; count the steady state after it
  const fs = framesDuring(sleep, 60);
  assert.ok(fs / 60 < 12, `sleeping: ${(fs / 60).toFixed(1)} frames per second`);
  assert.ok(fs / 60 > 8, "the z's keep a smooth pace (a slower rate looked choppy)");
});

test("in a hop or a fall the cat is painted at the walking rate, and for a moment after the landing", () => {
  const r = new Rig();
  r.setPose("idle", 1, 0, true);
  for (let i = 0; i < 1200; i++) r.step(1 / 120);
  r.setAir(true);
  r.setPose("walk", 1, 0); // the turn to the side view is a big motion, which would be painted every frame
  r.step(1 / 120);
  assert.equal(r.mode, "walk");
  r.setPose("gasp", 1, 0);
  r.step(1 / 120);
  assert.equal(r.mode, "walk");
  r.setAir(false);
  r.setPose("land", 1, 0);
  r.step(1 / 120);
  assert.equal(r.mode, "walk", "the landing squash is painted at the same rate");
  for (let i = 0; i < 120; i++) r.step(1 / 120); // 1 s later
  assert.notEqual(r.mode, "walk", "after the landing the usual rules apply again");
});

test("a hop costs far fewer frames in the air than at full speed", () => {
  const painted = (air: boolean) => {
    const r = new Rig();
    r.setPose("idle", 1, 0, true);
    for (let i = 0; i < 1200; i++) r.step(1 / 120);
    r.setAir(air);
    r.setPose("walk", 1, 0);
    return framesDuring(r, 0.57);
  };
  assert.ok(painted(true) < painted(false) * 0.7, `${painted(true)} frames in the air against ${painted(false)} at full speed`);
});

test("noticing: ears up, eyes a little wider, and a bigger turn of the eyes toward what it noticed", () => {
  const settle = (r: Rig, sec: number) => { for (let i = 0; i < sec * 120; i++) r.step(1 / 120); };
  const tip = (r: Rig) => { const e = r.frame().key.earL; const bx = (e.a[0] + e.c[0]) / 2; const by = (e.a[1] + e.c[1]) / 2; return Math.hypot(e.b[0] - bx, e.b[1] - by); };
  const calm = new Rig();
  calm.setPose("idle", 1, 0, true);
  settle(calm, 10);
  const n = new Rig();
  n.setPose("notice", 1, 0, true);
  settle(n, 0.6);
  assert.ok(tip(n) > tip(calm) * 1.12, `the ear tip is ${tip(n).toFixed(1)} px from its base against ${tip(calm).toFixed(1)} at rest`);
  assert.ok(n.frame().wide > calm.frame().wide + 0.3, "the eyes are wider");
  // looking toward something: the eyes turn further than a calm cat's follow
  const looking = new Rig();
  looking.setPose("idle", 1, 0, true);
  looking.lookAt({ x: 1, y: 0 });
  settle(looking, 1);
  const noticing = new Rig();
  noticing.setPose("notice", 1, 0, true);
  noticing.lookAt({ x: 1, y: 0 });
  settle(noticing, 1);
  assert.ok(noticing.frame().gx > looking.frame().gx * 1.3, `${noticing.frame().gx.toFixed(1)} against ${looking.frame().gx.toFixed(1)}`);
});

test("the notice beat is a short pose that ends on its own, and the ears come back down", () => {
  assert.ok(TIMED.notice && TIMED.notice.ms >= 500 && TIMED.notice.ms <= 1500, "a safety net longer than the page's 0.4 s beat");
  const r = new Rig();
  r.setPose("notice", 1, 0, true);
  for (let i = 0; i < 120; i++) r.step(1 / 120);
  r.setPose("idle", 1, 0);
  for (let i = 0; i < 600; i++) r.step(1 / 120);
  assert.equal(r.mode, "idle", "it settles: no endless redrawing");
});

test("a blink or a tail flick while walking keeps the walk pace (no change of rhythm)", () => {
  const r = new Rig();
  r.setPose("walk", 1, 0, true);
  for (let i = 0; i < 1200; i++) r.step(1 / 120);
  assert.equal(r.mode, "walk");
  r.blink();
  r.twitch();
  r.step(1 / 120);
  assert.equal(r.mode, "walk");
});

test("the gait: a lateral sequence, two or more feet always down, continuous, and a foot rises only while it swings", () => {
  // each foot lands a quarter step after the previous one on the same side: near back 0, near front 0.25, far back 0.5, far front 0.75
  const lands = { farBack: 0.5, farFront: 0.75, nearBack: 0, nearFront: 0.25 };
  let prev: Record<string, { ang: number; lift: number }> | null = null;
  for (let t = 0; t < 2; t += 0.01) {
    const g = Object.fromEntries(Object.entries(lands).map(([k, l]) => [k, gaitLeg(t - l)]));
    const down = Object.values(g).filter((x) => x.lift === 0).length;
    assert.ok(down >= 2, `at ${t.toFixed(2)} only ${down} feet are down`);
    for (const x of Object.values(g)) assert.ok(x.lift >= 0 && x.lift <= 3 && Math.abs(x.ang) <= 0.5);
    if (prev) for (const k of Object.keys(g)) assert.ok(Math.abs(g[k].ang - prev[k].ang) < 0.12, `${k} jumps at ${t.toFixed(2)}`);
    prev = g;
  }
  // a foot that has just landed is forward, and it moves back on the ground
  assert.ok(gaitLeg(0).ang < 0 && gaitLeg(0.3).ang > gaitLeg(0).ang && gaitLeg(0.3).lift === 0);
  // while it swings forward it is raised and comes back to the landing position
  assert.ok(gaitLeg(0.8).lift > 1);
  assert.ok(Math.abs(gaitLeg(0.9999).ang - gaitLeg(0).ang) < 0.02);
  // one cycle later is the same
  assert.deepEqual(gaitLeg(0.37), gaitLeg(1.37));
});

const thetaOf = (r: Rig) => Math.abs((r as unknown as { theta: { x: number } }).theta.x);
const asleep = () => {
  const r = new Rig();
  r.setPose("sleep", 1, 0, true);
  for (let i = 0; i < 1200; i++) r.step(1 / 120);
  return r;
};

test("waking is a stretch you can read: a full side-on play bow for over a second, eyes shut and yawning, mouth closed before the turn back", () => {
  const r = asleep();
  r.setPose("wake", 1, 0, true);
  let turned = -1;
  let sideOn = 0;
  let yawnAtOne = 0;
  for (let t = 0; t < 1.7; t += 1 / 120) {
    r.step(1 / 120);
    if (turned < 0 && thetaOf(r) > 0.9) turned = t;
    if (thetaOf(r) > 0.9) sideOn += 1 / 120;
    if (Math.abs(t - 1.0) < 1 / 240) yawnAtOne = r.frame().mouth.yawn;
  }
  // it turns fully side-on quickly (a slow blend of the front and side drawings shows both at once and looks wrong) ...
  assert.ok(turned >= 0 && turned < 0.5, `fully side-on after ${turned.toFixed(2)} s`);
  // ... and stays there: the stretch itself lasts more than a second
  assert.ok(sideOn > 1.1, `side-on for ${sideOn.toFixed(2)} s, a stretch needs more than a second`);
  const f = r.frame();
  assert.ok(f.lid < 0.2, "eyes shut");
  assert.ok(yawnAtOne > 0.8, `yawning in the middle of the stretch (${yawnAtOne.toFixed(2)})`);
  assert.ok(f.mouth.yawn < 0.25, `the yawn is over before the turn back (${f.mouth.yawn.toFixed(2)})`);
});

test("out of the stretch the eyes stay shut while it turns back (no dazed half-turned face) and open when it faces front", () => {
  const r = asleep();
  r.setPose("wake", 1, 0, true);
  for (let t = 0; t < 1.7; t += 1 / 120) r.step(1 / 120);
  r.setPose("idle", 1, 0, true);
  let hybridOpen = 0;
  let back = -1;
  for (let t = 0; t < 2; t += 1 / 120) {
    r.step(1 / 120);
    const th = thetaOf(r);
    // while the face is anywhere between the two drawings the eyes are (nearly) shut
    if (th > 0.1 && th < 0.9 && r.frame().lid > 0.3) hybridOpen += 1 / 120;
    if (back < 0 && th < 0.05) back = t;
  }
  assert.ok(hybridOpen < 0.05, `eyes open for ${hybridOpen.toFixed(2)} s while half-turned`);
  assert.ok(back >= 0 && back < 1, `facing front after ${back.toFixed(2)} s`);
  for (let t = 0; t < 1; t += 1 / 120) r.step(1 / 120);
  assert.ok(r.frame().lid > 0.9, "eyes open again once it faces front");
});

test("waking to walk keeps the eyes open (it stays side-on, there is no turn to hide)", () => {
  const r = asleep();
  r.setPose("wake", 1, 0, true);
  for (let t = 0; t < 1.7; t += 1 / 120) r.step(1 / 120);
  r.setPose("walk", 1, 0, true);
  for (let t = 0; t < 0.8; t += 1 / 120) r.step(1 / 120);
  assert.ok(r.frame().lid > 0.9, `eyes open while walking off (${r.frame().lid.toFixed(2)})`);
});

test("a held stretch is alive: it breathes and reaches a little further, and it is redrawn at the soft rate, not at full speed", () => {
  const r = asleep();
  r.setPose("wake", 1, 0, true);
  for (let t = 0; t < 0.6; t += 1 / 120) r.step(1 / 120);
  const early = r.frame();
  for (let t = 0; t < 0.8; t += 1 / 120) r.step(1 / 120);
  assert.equal(r.mode, "soft");
  const late = r.frame();
  assert.ok(late.key.body.rot > early.key.body.rot + 0.5, "the body tilts further the longer it is held");
  const rys = new Set<number>();
  for (let t = 0; t < 1; t += 0.1) {
    for (let i = 0; i < 12; i++) r.step(1 / 120);
    rys.add(Math.round(r.frame().key.body.ry * 100));
  }
  assert.ok(rys.size > 3, "the body breathes");
});

test("a wake is painted at the walking and soft rates, never at full speed (it costs about 90 frames, not 150)", () => {
  const r = asleep();
  r.setPose("wake", 1, 0, true);
  let frames = 0;
  let owed = 0;
  const gap: Record<string, number> = { full: 1 / 60, soft: 0.041, walk: 0.033, light: 0.09, idle: Infinity };
  let sawFull = false;
  let t = 0;
  for (; t < 4; t += 1 / 120) {
    if (Math.abs(t - 1.7) < 1 / 240) r.setPose("idle", 1, 0, true);
    r.step(1 / 120);
    if (r.mode === "full") sawFull = true;
    owed += 1 / 120;
    if (owed >= gap[r.mode]) {
      frames++;
      owed = 0;
    }
  }
  assert.equal(sawFull, false, "no full-speed frames");
  assert.ok(frames < 110, `${frames} frames for a wake and the rise after it`);
  assert.equal(r.mode, "idle", "and it ends still");
});

/** The box a pose draws in, from its shapes: the head, the nose, the ears, the body, the paws, the tail. */
function extent(k: Key): { x0: number; x1: number; y0: number; y1: number } {
  const xs: number[] = [];
  const ys: number[] = [];
  const ell = (e: { x: number; y: number; rx: number; ry: number }, rotDeg = 0) => {
    const t = (rotDeg * Math.PI) / 180;
    const hw = Math.hypot(e.rx * Math.cos(t), e.ry * Math.sin(t));
    const hh = Math.hypot(e.rx * Math.sin(t), e.ry * Math.cos(t));
    xs.push(e.x - hw, e.x + hw);
    ys.push(e.y - hh, e.y + hh);
  };
  ell(k.head);
  ell(k.body, k.body.rot);
  for (const l of k.legs) {
    if (l.a < 0.5) continue;
    ell({ x: l.fx, y: l.fy, rx: Math.max(l.t / 2, l.frx), ry: Math.max(l.t / 2, l.fry) });
    ell({ x: l.hx, y: l.hy, rx: l.t / 2, ry: l.t / 2 });
  }
  for (const e of [k.earL, k.earR]) if (e.alpha > 0.5) for (const p of [e.a, e.b, e.c]) (xs.push(p[0]), ys.push(p[1]));
  for (const p of [k.nose.a, k.nose.b, k.nose.c]) (xs.push(p[0]), ys.push(p[1]));
  for (const p of [k.tail.p0, k.tail.p1, k.tail.p2]) (xs.push(p[0] - k.tail.w / 2, p[0] + k.tail.w / 2), ys.push(p[1] - k.tail.w / 2, p[1] + k.tail.w / 2));
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

test("no pose draws outside the 120 x 120 box of the cat (what is outside is cut off by the window: the nose of the peek was)", () => {
  // every look of the rig: its body key in the view it uses, with the head turned by the look's roll and moved by its dy
  for (const [state, look] of Object.entries(LOOKS)) {
    const k0 = POSE_KEYS[look.base][look.theta > 0.5 ? "s" : "f"];
    const k = structuredClone(k0) as Key;
    const t = (look.roll * Math.PI) / 180;
    const rot = (p: [number, number]): [number, number] => {
      const dx = p[0] - k.head.x;
      const dy = p[1] - k.head.y;
      return [k.head.x + dx * Math.cos(t) - dy * Math.sin(t), k.head.y + dy * Math.cos(t) + dx * Math.sin(t) + look.dy];
    };
    for (const e of [k.earL, k.earR]) (e.a = rot(e.a), e.b = rot(e.b), e.c = rot(e.c));
    k.nose = { a: rot(k.nose.a), b: rot(k.nose.b), c: rot(k.nose.c) };
    k.head = { ...k.head, y: k.head.y + look.dy };
    const e = extent(k);
    const tol = 1.5;
    assert.ok(e.x0 >= -tol && e.x1 <= 120 + tol && e.y0 >= -tol && e.y1 <= 120 + tol, `${state}: x ${e.x0.toFixed(1)}..${e.x1.toFixed(1)}, y ${e.y0.toFixed(1)}..${e.y1.toFixed(1)}`);
  }
});

test("the teeter leans toward the edge and rocks: even at its furthest lean either way the drawing stays inside the 120 box", () => {
  const k = POSE_KEYS.teeter.f;
  // the points of the drawing that stick out: the head all round, the ears, the nose, the paws, the tail
  const pts: [number, number][] = [];
  for (let a = 0; a < 360; a += 15) pts.push([k.head.x + k.head.rx * Math.cos((a * Math.PI) / 180), k.head.y + k.head.ry * Math.sin((a * Math.PI) / 180)]);
  for (const e of [k.earL, k.earR]) pts.push(e.a, e.b, e.c);
  pts.push(k.nose.a, k.nose.b, k.nose.c);
  for (const l of k.legs) pts.push([l.fx + l.frx, l.fy], [l.fx, l.fy - Math.max(l.fry, l.t / 2)]);
  for (const p of [k.tail.p0, k.tail.p1, k.tail.p2]) pts.push([p[0] - k.tail.w / 2, p[1]]);
  const pivot = { x: 60, y: 110 }; // the feet (`tiltY` in the frame)
  for (const lean of [20, -20]) {
    const t = (lean * Math.PI) / 180; // 8 degrees of lean toward the edge and 12 of rocking at most, either way (engine.ts)
    for (const [x, y] of pts) {
      const rx = pivot.x + (x - pivot.x) * Math.cos(t) - (y - pivot.y) * Math.sin(t);
      const ry = pivot.y + (y - pivot.y) * Math.cos(t) + (x - pivot.x) * Math.sin(t);
      assert.ok(rx >= -1.5 && rx <= 121.5 && ry >= -1.5 && ry <= 121.5, `point ${x.toFixed(0)},${y.toFixed(0)} leaned ${lean} deg goes to ${rx.toFixed(0)},${ry.toFixed(0)}`);
    }
  }
});
