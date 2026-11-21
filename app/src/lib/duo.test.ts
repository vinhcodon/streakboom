import { test } from "node:test";
import assert from "node:assert/strict";
import { atStart, call, defaultDuo, entranceRect, lastTucked, outPets, parseDuo, resolveEntrance, serializeDuo, trayClick, tuck, type DuoState, type Monitor } from "./duo.ts";

const T0 = 1_000_000;
function both(): DuoState { const s = defaultDuo(); s.pets.paws.out = true; return s; }
function none(): DuoState { const s = defaultDuo(); s.pets.peak.out = false; return s; }

test("1: a new state is Peak alone, as today", () => {
  assert.deepEqual(atStart(defaultDuo()), ["peak"]);
  assert.deepEqual(atStart(parseDuo(null)), ["peak"]);
  assert.deepEqual(atStart(parseDuo("not json")), ["peak"]);
});

test("2, 3, 4: the start restores who was out, nobody if nobody was", () => {
  assert.deepEqual(atStart(both()), ["peak", "paws"]);
  const only = defaultDuo(); only.pets.peak.out = false; only.pets.paws.out = true;
  assert.deepEqual(atStart(only), ["paws"]);
  assert.deepEqual(atStart(none()), []);
});

test("the state survives the file", () => {
  const s = both();
  s.pets.paws.entrance = { monitor: "m2", edge: "left", along: 0.25 };
  s.pets.peak.tuckedAt = 5;
  assert.deepEqual(parseDuo(serializeDuo(s)), s);
});

test("a file with odd values gets defaults, never an error", () => {
  const s = parseDuo(JSON.stringify({ pets: { peak: { out: "yes", tuckedAt: -3, entrance: { edge: "middle" } }, paws: 7 } }));
  assert.equal(s.pets.peak.out, true);
  assert.equal(s.pets.peak.tuckedAt, 0);
  assert.equal(s.pets.peak.entrance, null);
  assert.equal(s.pets.paws.out, false);
  const t = parseDuo(JSON.stringify({ pets: { paws: { out: true, entrance: { edge: "left", along: 9 } } } }));
  assert.equal(t.pets.paws.entrance?.along, 1);
});

test("19: the tray click with any pet out sends everyone in and stamps the time", () => {
  const r = trayClick(both(), T0);
  assert.deepEqual(r.sendIn, ["peak", "paws"]);
  assert.deepEqual(outPets(r.state), []);
  assert.equal(r.state.pets.peak.tuckedAt, T0);
  const one = trayClick(defaultDuo(), T0);
  assert.deepEqual(one.sendIn, ["peak"]);
});

test("7: with none out, the tray click brings out the one tucked last, and only that one", () => {
  let s = both();
  s = tuck(s, "paws", T0, null);
  s = tuck(s, "peak", T0 + 10, null);
  assert.equal(lastTucked(s), "peak");
  let r = trayClick(s, T0 + 20);
  assert.deepEqual(r.bringOut, ["peak"]);
  assert.deepEqual(outPets(r.state), ["peak"]);
  // Paws was tucked last this time
  s = tuck(r.state, "peak", T0 + 30, null);
  s = { ...s, pets: { ...s.pets, paws: { ...s.pets.paws, tuckedAt: T0 + 40 } } };
  r = trayClick(s, T0 + 50);
  assert.deepEqual(r.bringOut, ["paws"]);
});

test("a state that never had a tuck brings out Peak", () => {
  assert.deepEqual(trayClick(none(), T0).bringOut, ["peak"]);
});

test("5: shoving one away leaves the other out", () => {
  const s = tuck(both(), "paws", T0, { monitor: "m1", edge: "right", along: 0.8 });
  assert.deepEqual(outPets(s), ["peak"]);
  assert.deepEqual(s.pets.paws.entrance, { monitor: "m1", edge: "right", along: 0.8 });
  assert.equal(tuck(s, "paws", T0 + 1, null), s, "tucking a pet that is not out changes nothing");
});

test("8: the pet on the screen may call the other, nobody else", () => {
  const r = call(defaultDuo(), "peak", "paws");
  assert.equal(r.ok, true);
  assert.deepEqual(outPets(r.state), ["peak", "paws"]);
  assert.equal(call(none(), "peak", "paws").ok, false, "a pet that is not out cannot call");
  assert.equal(call(both(), "peak", "paws").ok, false, "the target is already out");
  assert.equal(call(defaultDuo(), "peak", "peak").ok, false);
});

const M1: Monitor = { id: "m1", x: 0, y: 0, w: 1920, h: 1080 };
const M2: Monitor = { id: "m2", x: 1920, y: 0, w: 1280, h: 1024 };

test("9, 16: the entrance is kept on its monitor, and moves to a present one when the monitor is gone", () => {
  const e = { monitor: "m2", edge: "left" as const, along: 0.5 };
  assert.equal(resolveEntrance(e, [M1, M2])?.monitor, "m2");
  assert.equal(resolveEntrance(e, [M1])?.monitor, "m1");
  assert.equal(resolveEntrance(null, [M1])?.edge, "bottom");
  assert.equal(resolveEntrance(e, []), null);
});

test("the entrance rectangle is flush with the edge and always inside the monitor", () => {
  const pet = { w: 160, h: 160 };
  for (const edge of ["left", "right", "top", "bottom"] as const) {
    for (const along of [0, 0.5, 1]) {
      const r = entranceRect({ monitor: "m1", edge, along }, M1, pet);
      assert.ok(r.x >= M1.x && r.y >= M1.y && r.x + r.w <= M1.x + M1.w && r.y + r.h <= M1.y + M1.h, `${edge} ${along}`);
    }
  }
  assert.equal(entranceRect({ monitor: "m1", edge: "right", along: 0 }, M1, pet).x, 1760);
  assert.equal(entranceRect({ monitor: "m1", edge: "bottom", along: 1 }, M1, pet).y, 920);
});
