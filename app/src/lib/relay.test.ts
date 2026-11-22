import { test } from "node:test";
import assert from "node:assert/strict";
import { Conversation, situation, type Deps, type Line } from "./conversation.ts";
import { withProfiles } from "./pets.ts";
import type { PetId } from "./duo.ts";

function rig(script: Partial<Record<PetId, string | (() => Promise<string>)>>, over: Partial<Deps> = {}, profiles = withProfiles({})) {
  const calls: { pet: PetId; role: string; heard: string[] }[] = [];
  const deps: Deps = {
    model: async (pet, view, role) => {
      calls.push({ pet, role, heard: view.map((v) => `${v.from}:${v.text}`) });
      const r = script[pet];
      if (r === undefined) throw new Error("no key");
      return typeof r === "function" ? r() : r;
    },
    allow: () => true, quiet: () => false, sleep: async () => {}, beat: () => 0, now: () => 0, ...over,
  };
  const lines: Line[] = [];
  return { talk: new Conversation(deps, (l) => lines.push(l), profiles), lines, calls };
}

test("a relay: the asked pet turns to the other, which answers the person; one call, one hop", async () => {
  const { talk, lines, calls } = rig({ paws: "[happy] The cushion is in perfect order.", peak: "never" });
  await talk.relay("ask Paws what he did today", "peak", "paws", ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act, l.to.join("+")]), [["peak", "turn", "paws"], ["paws", "say", "person"]]);
  assert.deepEqual(calls.map((c) => [c.pet, c.role]), [["paws", "relayed"]]);
  assert.ok(calls[0].heard.includes("person:ask Paws what he did today"), "the pet that answers was shown the question");
});

test("a pet that does not relay answers for itself, once", async () => {
  const { talk, lines, calls } = rig({ peak: "I do not know what he did.", paws: "never" }, {}, withProfiles({ peak: { relays: false } }));
  await talk.relay("ask Paws what he did today", "peak", "paws", ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "say"]]);
  assert.deepEqual(calls.map((c) => c.pet), ["peak"]);
});

test("with the other pet away the asked pet answers for itself", async () => {
  const { talk, lines } = rig({ peak: "He is away." });
  await talk.relay("ask Paws what he did today", "peak", "paws", ["peak"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "say"]]);
});

test("quiet: the turn is shown, the answer is a gesture, no call", async () => {
  const { talk, lines, calls } = rig({ paws: "x" }, { quiet: () => true });
  await talk.relay("ask Paws what he did today", "peak", "paws", ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "turn"], ["paws", "gesture"]]);
  assert.equal(calls.length, 0);
});

test("the pet asked cannot pass: an empty answer is a gesture", async () => {
  const { talk, lines } = rig({ paws: "[pass]" });
  await talk.relay("ask Paws", "peak", "paws", ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => l.act), ["turn", "gesture"]);
});

test("a touch while the answer is being written drops it", async () => {
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines } = rig({ paws: () => slow });
  const turn = talk.relay("ask Paws", "peak", "paws", ["peak", "paws"]);
  await Promise.resolve(); await Promise.resolve();
  talk.cancel();
  release("late");
  await turn;
  assert.deepEqual(lines.map((l) => l.act), ["turn"]);
});

test("the prompt for a relayed question says who asked", () => {
  const s = situation("paws", "relayed", true);
  assert.match(s, /asked Peak to ask you something, and Peak has turned to you/);
  assert.doesNotMatch(s, /\[pass\]/);
});
