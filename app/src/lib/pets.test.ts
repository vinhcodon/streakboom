import { test } from "node:test";
import assert from "node:assert/strict";
import { Conversation, situation, type Deps, type Line } from "./conversation.ts";
import { MAX_WORDS_MAX, MAX_WORDS_MIN, NOTE_MAX, loadProfiles, parseProfile, withProfiles } from "./pets.ts";
import type { PetId } from "./duo.ts";

test("the files of Peak and Paws are read as they are written", () => {
  const p = loadProfiles();
  assert.deepEqual([p.peak.name, p.peak.species, p.paws.name, p.paws.species], ["Peak", "a cat", "Paws", "a small dog"]);
  assert.ok(p.peak.speaksToPerson && p.paws.mayPass && p.paws.speaksToPet);
});

test("a hand-edited profile is bounded: a number is clamped, a wrong type falls back, an unknown key is ignored, a note is cut", () => {
  const d = parseProfile({ id: "x", name: "  ", maxWords: 9999, speaksToPerson: "yes", mayPass: false, hack: "rm -rf", note: "n".repeat(900) }, "paws");
  assert.equal(d.id, "paws"); // the id is the pet's, never the file's
  assert.equal(d.name, "Paws"); // blank falls back
  assert.equal(d.maxWords, MAX_WORDS_MAX);
  assert.equal(d.speaksToPerson, true); // not a boolean: the default
  assert.equal(d.mayPass, false);
  assert.equal(d.note.length, NOTE_MAX);
  assert.equal("hack" in d, false);
  assert.equal(parseProfile({ maxWords: 1 }, "peak").maxWords, MAX_WORDS_MIN);
  assert.equal(parseProfile(null, "peak").name, "Peak");
  assert.equal(parseProfile("junk", "paws").maxWords, 40);
});

function rig(script: Partial<Record<PetId, string>>, profiles = loadProfiles()) {
  const calls: PetId[] = [];
  const deps: Deps = {
    model: async (pet) => { calls.push(pet); return script[pet] ?? "x"; },
    allow: () => true, quiet: () => false, sleep: async () => {}, beat: () => 0, now: () => 0,
  };
  const lines: Line[] = [];
  const talk = new Conversation(deps, (l) => lines.push(l), profiles);
  return { talk, lines, calls };
}

test("a pet that never speaks to the person only gestures and costs no call", async () => {
  const { talk, lines, calls } = rig({ peak: "Fine.", paws: "Splendid." }, withProfiles({ paws: { speaksToPerson: false } }));
  await talk.person("how are you both", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "say"], ["paws", "gesture"]]);
  assert.deepEqual(calls, ["peak"]);
});

test("a pet that may not pass answers with its words (or a gesture when it has none)", async () => {
  const a = rig({ peak: "Fine.", paws: "[pass] Still, I shall add this." }, withProfiles({ paws: { mayPass: false } }));
  await a.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(a.lines.map((l) => [l.pet, l.act]), [["peak", "say"], ["paws", "say"]]);
  const b = rig({ peak: "Fine.", paws: "[pass]" }, withProfiles({ paws: { mayPass: false } }));
  await b.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(b.lines.map((l) => l.act), ["say", "gesture"]); // not a chosen pass
});

test("a pet that does not speak to the other pet has its aside turned into a line to the person", async () => {
  const { talk, lines } = rig({ peak: "Fine.", paws: "[to:peak] Shall I fetch the ball?" }, withProfiles({ paws: { speaksToPet: false } }));
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines[1].to, ["person"]);
});

test("each pet has its own word cap", async () => {
  const long = Array.from({ length: 50 }, (_, i) => `w${i}`).join(" ");
  const { talk, lines } = rig({ peak: long, paws: long }, withProfiles({ peak: { maxWords: 10 }, paws: { maxWords: 20 } }));
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => l.text.split(" ").length), [10, 20]);
});

test("the capability layer of the prompt follows the profile", () => {
  const base = loadProfiles();
  assert.match(situation("paws", "second", true, base), /\[pass\].*\[to:peak\]/);
  const quiet = withProfiles({ paws: { mayPass: false, speaksToPet: false, note: "You like to keep your answers to a single sentence." } });
  const s = situation("paws", "second", true, quiet);
  assert.doesNotMatch(s, /\[pass\]/);
  assert.doesNotMatch(s, /\[to:peak\]/);
  assert.match(s, /single sentence/);
  assert.match(situation("peak", "first", false, base), /Peak, a cat, and Paws, a small dog/);
});
