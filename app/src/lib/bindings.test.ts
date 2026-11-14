import { test } from "node:test";
import assert from "node:assert/strict";
import { BINDINGS, GESTURES, bindingByName, resolveGesture, type BindState } from "./bindings.ts";
import { SKILL_FILES } from "./skills.ts";
import { normalize } from "./intents.ts";

const calm: BindState = { held: false, quiet: false, flying: false, away: false, leaving: false, cooldownOk: true };

test("a name is snake_case and used once", () => {
  const names = BINDINGS.map((b) => b.name);
  assert.equal(new Set(names).size, names.length);
  for (const n of names) assert.match(n, /^[a-z]+(_[a-z]+)*$/);
});

test("every gesture of the closed list reaches exactly one action, and no action uses a gesture outside it", () => {
  for (const g of GESTURES) {
    assert.equal(BINDINGS.filter((b) => b.gesture === g).length, 1, g);
  }
  for (const b of BINDINGS) if (b.gesture) assert.ok((GESTURES as readonly string[]).includes(b.gesture), b.name);
});

test("an action that names a skill has that skill file, unless it is only proposed", () => {
  const files = SKILL_FILES.map((s) => s.skill);
  for (const b of BINDINGS) {
    if (b.skill && b.status === "built") assert.ok(files.includes(b.skill), b.name);
  }
});

test("every skill file is the skill of exactly one built action", () => {
  for (const s of SKILL_FILES) {
    assert.equal(BINDINGS.filter((b) => b.skill === s.skill && b.status === "built").length, 1, s.skill);
  }
});

test("a typed phrase belongs to one skill file only", () => {
  const seen = new Map<string, string>();
  for (const s of SKILL_FILES) {
    for (const p of s.phrases) {
      const k = normalize(p);
      assert.ok(!seen.has(k) || seen.get(k) === s.skill, `${p} is in ${seen.get(k)} and ${s.skill}`);
      seen.set(k, s.skill);
    }
  }
});

test("the gestures reach what the page does today", () => {
  assert.equal(resolveGesture("click", calm), "poke");
  assert.equal(resolveGesture("double_click", calm), "open_chat");
  assert.equal(resolveGesture("drag", calm), "carry");
  assert.equal(resolveGesture("sweep_head", calm), "scratch");
  assert.equal(resolveGesture("sweep_belly", calm), "belly_rub");
  assert.equal(resolveGesture("right_click", calm), "shove");
  assert.equal(resolveGesture("tray_click", calm), "toggle_visibility");
});

test("a gate that is closed refuses the gesture", () => {
  assert.equal(resolveGesture("click", { ...calm, held: true }), null);
  assert.equal(resolveGesture("click", { ...calm, quiet: true }), null);
  assert.equal(resolveGesture("right_click", { ...calm, cooldownOk: false }), null);
  assert.equal(resolveGesture("tray_click", { ...calm, quiet: true, held: true, away: true }), "toggle_visibility");
});

test("step aside is built: the double right click reaches it when the gates are open", () => {
  assert.equal(bindingByName("step_aside")?.status, "built");
  assert.equal(resolveGesture("right_double_click", calm), "step_aside");
  assert.equal(resolveGesture("right_double_click", { ...calm, away: true }), null);
  assert.equal(resolveGesture("right_double_click", { ...calm, cooldownOk: false }), null);
});

test("the typed commands have no gesture and are never a setting", () => {
  assert.equal(bindingByName("leave")?.gesture, null);
  assert.equal(bindingByName("seat")?.gesture, null);
});
