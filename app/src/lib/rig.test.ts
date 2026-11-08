import { test } from "node:test";
import assert from "node:assert/strict";
import { POSE_KEYS, POSE_NAMES, type Key } from "./rig/keys.ts";
import { Rig, Spring, blendKeys, LOOKS } from "./rig/engine.ts";
import type { PetState } from "./sprites.ts";
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
