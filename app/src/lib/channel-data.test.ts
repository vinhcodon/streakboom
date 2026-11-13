import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultData, parse } from "./state.ts";
import { defaultMemory, parseMemory } from "./memory.ts";

// ADR-0090: Stable and Preview share one pet.json and one memory.json. A Preview may only ADD fields, so a Stable build
// (which knows fewer) must read what a Preview wrote, keep what it knows, and not fail. It drops the fields it does not know
// when it writes the file back: the person loses only what the Preview alone had.

const NOW = Date.UTC(2026, 10, 14);

function previewPet(): string {
  const d = defaultData(NOW);
  const o = JSON.parse(JSON.stringify(d)) as Record<string, any>;
  o.mood = 77;
  o.closeness = 42;
  o.settings.lang = "vi";
  o.settings.gentle = true;
  // fields only a later build knows (invented here; the shapes are deliberately odd)
  o.skin = "pink";
  o.accessory = { id: "bow", worn: true };
  o.learnedSpots = [[1, 2, 3], [4, 5, 6]];
  o.settings.skin = "pink";
  o.settings.voice = { hotkey: "Ctrl+Alt+Space", on: false };
  o.brain.futureCounter = 7;
  o.telemetry.somethingNew = { a: [1, 2, { b: null }] };
  o.ai.extra = "x";
  o.unknownNull = null;
  return JSON.stringify(o);
}

test("Stable reads a pet.json with fields it does not know, and keeps the ones it knows", () => {
  const p = parse(previewPet(), NOW);
  assert.equal(p.mood, 77);
  assert.equal(p.closeness, 42);
  assert.equal(p.settings.lang, "vi");
  assert.equal(p.settings.gentle, true);
});

test("the unknown fields are not kept when Stable writes the file back, and the written file is valid", () => {
  const p = parse(previewPet(), NOW);
  const text = JSON.stringify(p);
  const o = JSON.parse(text) as Record<string, any>;
  for (const k of ["skin", "accessory", "learnedSpots", "unknownNull"]) assert.equal(k in o, false, k);
  assert.equal("skin" in o.settings, false);
  assert.equal("futureCounter" in o.brain, false);
  // and parsing its own output changes nothing
  assert.deepEqual(parse(text, NOW), p);
});

test("a pet.json from an older build (fewer fields) still reads: what is missing takes its default", () => {
  const old = JSON.stringify({ v: 1, mood: 60, closeness: 30, firstSeen: NOW - 1000, lastSeen: NOW - 500 });
  const p = parse(old, NOW);
  assert.equal(p.mood, 60);
  assert.equal(p.settings.lang, "auto");
});

function previewMemory(): string {
  const m = JSON.parse(JSON.stringify(defaultMemory())) as Record<string, any>;
  m.petName = "Tít";
  m.callMe = "Vinh";
  m.touches = { poke: 5, scratch: 4, chat: 3, newTouch: 9 };
  m.spots = { m0: [0, 1, 0, 0, 5, 0, 0, 0, 0] };
  m.asks.skin = 2;
  m.futureThing = { nested: [1, 2, 3] };
  return JSON.stringify(m);
}

test("Stable reads a memory.json with fields it does not know, and keeps the ones it knows", () => {
  const m = parseMemory(previewMemory());
  assert.equal(m.petName, "Tít");
  assert.equal(m.callMe, "Vinh");
  assert.equal(m.touches.poke, 5);
  assert.equal(m.touches.scratch, 4);
  assert.equal(m.touches.chat, 3);
});

test("the memory written back by Stable has no unknown fields and is read the same", () => {
  const m = parseMemory(previewMemory());
  const o = JSON.parse(JSON.stringify(m)) as Record<string, any>;
  for (const k of ["spots", "futureThing"]) assert.equal(k in o, false, k);
  assert.equal("newTouch" in o.touches, false);
  assert.deepEqual(parseMemory(JSON.stringify(m)), m);
});

test("a damaged or empty file is still safe", () => {
  assert.doesNotThrow(() => parse("{not json", NOW));
  assert.doesNotThrow(() => parseMemory("[1,2,3]"));
  assert.equal(parse(null, NOW).mood, defaultData(NOW).mood);
});
