import { test } from "node:test";
import assert from "node:assert/strict";
import { Conversation, addTurn, heard, shownSays, withoutTurn, newRoom, parseUtterance, plan, type Deps, type Line } from "./conversation.ts";
import type { PetId } from "./duo.ts";
import { readFileSync } from "node:fs";

/** A scripted model: a reply per pet (or a function), every call recorded, a fake clock that only moves when asked to sleep. */
function rig(script: Partial<Record<PetId, string | (() => Promise<string>)>>, over: Partial<Deps> = {}) {
  const calls: { pet: PetId; role: string; heard: string[] }[] = [];
  const sleeps: number[] = [];
  let t = 1000;
  const deps: Deps = {
    model: async (pet, view, role) => {
      calls.push({ pet, role, heard: view.map((v) => `${v.from}:${v.text}`) });
      const r = script[pet];
      if (r === undefined) throw new Error("no key");
      return typeof r === "function" ? r() : r;
    },
    allow: () => true,
    quiet: () => false,
    sleep: async (ms) => { sleeps.push(ms); t += ms; },
    beat: () => 700,
    now: () => t,
    ...over,
  };
  const lines: Line[] = [];
  const talk = new Conversation(deps, (l) => lines.push(l));
  return { talk, lines, calls, sleeps };
}

test("a pet hears what it said, what was said to it, and what was said to both; nothing else", () => {
  let room = newRoom();
  room = addTurn(room, { from: "person", to: ["peak"], text: "to peak", at: 1, act: "say" }).room;
  room = addTurn(room, { from: "person", to: ["peak", "paws"], text: "to both", at: 2, act: "say" }).room;
  room = addTurn(room, { from: "paws", to: ["person"], text: "paws answers", at: 3, act: "say" }).room;
  room = addTurn(room, { from: "peak", to: ["person"], text: "", at: 4, act: "gesture" }).room;
  assert.deepEqual(heard(room, "peak").map((t) => t.text), ["to peak", "to both"]);
  assert.deepEqual(heard(room, "paws").map((t) => t.text), ["to both", "paws answers"]);
});

test("the plan: the pets named and present answer, the pet last spoken to first, the absent ones are listed", () => {
  assert.deepEqual(plan(["paws"], ["peak", "paws"], null), { speakers: ["paws"], absent: [] });
  assert.deepEqual(plan(["peak", "paws"], ["peak", "paws"], null), { speakers: ["peak", "paws"], absent: [] });
  assert.deepEqual(plan(["peak", "paws"], ["peak", "paws"], "paws").speakers, ["paws", "peak"]);
  assert.deepEqual(plan(["paws"], ["peak"], null), { speakers: [], absent: ["paws"] });
  assert.deepEqual(plan(["peak", "paws"], ["peak"], null), { speakers: ["peak"], absent: ["paws"] });
});

test("the tags of a reply: mood, pass and to, in any order, then the words", () => {
  assert.deepEqual(parseUtterance("[happy] Good morning."), { text: "Good morning.", mood: "happy", pass: false, to: [] });
  assert.deepEqual(parseUtterance("[pass]"), { text: "", mood: "neutral", pass: true, to: [] });
  assert.deepEqual(parseUtterance("[to:paws] [sassy] Do keep up."), { text: "Do keep up.", mood: "sassy", pass: false, to: ["paws"] });
  assert.deepEqual(parseUtterance("[to:dog] hi").to, []); // not a pet of the room
});

test("one pet addressed answers once and the other hears nothing", async () => {
  const { talk, lines, calls } = rig({ peak: "[neutral] Fine.", paws: "never" });
  await talk.person("how are you", ["peak"], ["peak", "paws"]);
  assert.equal(lines.length, 1);
  assert.deepEqual([lines[0].pet, lines[0].act, lines[0].text, lines[0].to], ["peak", "say", "Fine.", ["person"]]);
  assert.deepEqual(calls.map((c) => c.pet), ["peak"]);
  assert.equal(talk.lastSpoken, "peak");
});

test("to both: one call each, in order with a beat between, and the second sees the first line", async () => {
  const { talk, lines, calls, sleeps } = rig({ peak: "[neutral] Fine.", paws: "[happy] Splendid, as always." });
  await talk.person("how are you both", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "say"], ["paws", "say"]]);
  assert.deepEqual(calls.map((c) => c.role), ["first", "second"]);
  assert.deepEqual(sleeps, [700]);
  assert.ok(calls[1].heard.includes("peak:Fine."), "the second pet was shown the first line");
  assert.ok(!calls[0].heard.some((h) => h.startsWith("paws:")), "the first heard nothing of the second");
});

test("the second pet may pass with a nod; the first may not", async () => {
  const a = rig({ peak: "Fine.", paws: "[pass]" });
  await a.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(a.lines.map((l) => l.act), ["say", "pass"]);
  const b = rig({ peak: "[pass]", paws: "Yes." });
  await b.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(b.lines.map((l) => l.act), ["gesture", "say"]); // an empty first line is a gesture, not a chosen pass
});

test("an aside to the other pet is allowed once, only for the second speaker of a turn to both", async () => {
  const a = rig({ peak: "Fine.", paws: "[to:peak] Shall I arrange the cushion?" });
  await a.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(a.lines[1].to, ["peak"]);
  assert.equal(a.lines.length, 2, "no chain: nobody answers the aside");
  const b = rig({ peak: "[to:paws] Ahem.", paws: "Yes." }); // the first speaker may not aside
  await b.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(b.lines[0].to, ["person", "paws"]); // said in the room, not an aside
  const c = rig({ peak: "[to:paws] Ahem." }); // a turn to one pet has no aside
  await c.talk.person("you?", ["peak"], ["peak", "paws"]);
  assert.deepEqual(c.lines[0].to, ["person"]);
});

test("a failing key makes that pet a gesture and the other goes on", async () => {
  const { talk, lines } = rig({ paws: "Splendid." }); // peak has no key: its call rejects
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "gesture"], ["paws", "say"]]);
});

test("quiet, or a gate that says no, means gestures and no model call", async () => {
  const q = rig({ peak: "x", paws: "y" }, { quiet: () => true });
  await q.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(q.lines.map((l) => l.act), ["gesture", "gesture"]);
  assert.equal(q.calls.length, 0);
  const g = rig({ peak: "x", paws: "Splendid." }, { allow: (p) => p === "paws" });
  await g.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(g.lines.map((l) => [l.pet, l.act]), [["peak", "gesture"], ["paws", "say"]]);
});

test("a line is clipped to the word cap", async () => {
  const { talk, lines } = rig({ paws: Array.from({ length: 80 }, (_, i) => `w${i}`).join(" ") });
  await talk.person("hi", ["paws"], ["paws"]);
  assert.equal(lines[0].text.split(" ").length, 40);
});

test("the pet addressed is away: the pet on the screen only glances, no call", async () => {
  const { talk, lines, calls } = rig({ peak: "x", paws: "y" });
  await talk.person("Paws?", ["paws"], ["peak"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "gesture"]]);
  assert.equal(calls.length, 0);
});

test("a cancel while a line is being written drops it, and nothing else is said", async () => {
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines, calls } = rig({ peak: () => slow, paws: "Splendid." });
  const turn = talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  await Promise.resolve();
  talk.cancel(); // a touch
  release("Fine.");
  await turn;
  assert.equal(lines.length, 0);
  assert.deepEqual(calls.map((c) => c.pet), ["peak"]);
});

test("a pet that goes in while it is being written is dropped and speaks no more; the other is not made to fill the gap", async () => {
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines } = rig({ peak: () => slow, paws: "Splendid." });
  const turn = talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  await Promise.resolve();
  talk.tucked("peak");
  release("Fine.");
  await turn;
  assert.equal(lines.length, 0);
});

test("a new message cancels the one before it", async () => {
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines } = rig({ peak: () => slow, paws: "Splendid." });
  const first = talk.person("one", ["peak"], ["peak", "paws"]);
  await Promise.resolve();
  const second = talk.person("two", ["paws"], ["peak", "paws"]);
  release("late");
  await Promise.all([first, second]);
  assert.deepEqual(lines.map((l) => [l.pet, l.text]), [["paws", "Splendid."]]);
});

import { situation, toHistory } from "./conversation.ts";

test("the history of a pet: its lines are the model's, the other pet's are heard in brackets, neighbours are joined, the first turn is the user's", () => {
  let room = newRoom();
  const add = (from: "person" | PetId, to: ("person" | PetId)[], text: string) => { room = addTurn(room, { from, to, text, at: 0, act: "say" }).room; };
  add("peak", ["person"], "old line of peak");
  add("person", ["peak", "paws"], "how are you both");
  add("peak", ["person", "paws"], "Fine.");
  assert.deepEqual(toHistory(heard(room, "paws"), "paws"), [{ role: "user", text: "how are you both\n(Peak said: Fine.)" }]);
  assert.deepEqual(toHistory(heard(room, "peak"), "peak"), [{ role: "user", text: "how are you both" }, { role: "model", text: "Fine." }]); // the leading model turn is dropped
});

test("the situation layer says who the pet is, who was spoken to, and allows a pass only to the second pet", () => {
  assert.match(situation("paws", "first", false), /You are Paws.*talking to you/);
  assert.match(situation("paws", "second", true), /\[pass\].*\[to:peak\]/);
  assert.doesNotMatch(situation("peak", "first", true), /\[pass\]/);
});

// ---- issue 4: races, failures and the shared quota ----

test("an older call that ends late does not switch the writing dots off for the newer one", async () => {
  let releaseOld: (s: string) => void = () => {};
  const old = new Promise<string>((r) => { releaseOld = r; });
  let releaseNew: (s: string) => void = () => {};
  const fresh = new Promise<string>((r) => { releaseNew = r; });
  const signal: (string | null)[] = [];
  const { talk } = rig({ peak: () => old, paws: () => fresh }, { writing: (p) => signal.push(p) });
  const first = talk.person("one", ["peak"], ["peak", "paws"]);
  await Promise.resolve();
  const second = talk.person("two", ["paws"], ["peak", "paws"]);
  await Promise.resolve();
  releaseOld("late"); // the old turn was cancelled by the new message
  await first;
  assert.equal(signal[signal.length - 1], "paws", "the dots stay on for the pet that is still writing");
  releaseNew("Splendid.");
  await second;
  assert.equal(signal[signal.length - 1], null, "and go off when the current call ends");
});

test("replies that finish in the wrong order: only the current turn is shown", async () => {
  const done: ((s: string) => void)[] = [];
  const mk = () => () => new Promise<string>((r) => { done.push(r); });
  const { talk, lines } = rig({ peak: mk(), paws: mk() });
  const a = talk.person("one", ["peak"], ["peak", "paws"]);
  await Promise.resolve();
  const b = talk.person("two", ["paws"], ["peak", "paws"]);
  await Promise.resolve();
  done[1]("[happy] new answer"); // the newer call ends first
  await b;
  done[0]("old answer"); // then the older one
  await a;
  assert.deepEqual(lines.map((l) => [l.pet, l.text]), [["paws", "new answer"]]);
});

test("both calls fail: two gestures, two calls, no chain", async () => {
  const { talk, lines, calls } = rig({}); // no key for either: both reject
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "gesture"], ["paws", "gesture"]]);
  assert.equal(calls.length, 2);
});

test("the second call fails alone: the first line stays, the second pet gestures", async () => {
  const { talk, lines } = rig({ peak: "Fine." });
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "say"], ["paws", "gesture"]]);
});

test("one quota slot left for two pets: the first is answered by the model and the second is a gesture, one charge", async () => {
  let left = 1;
  const { talk, lines, calls } = rig({ peak: "Fine.", paws: "Splendid." }, { allow: () => left > 0 });
  // the page charges inside the model call (recordAi); the gate is asked before each call
  const model = (talk as unknown as { deps: Deps }).deps.model;
  (talk as unknown as { deps: Deps }).deps.model = async (...a) => { left--; return model(...a); };
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "say"], ["paws", "gesture"]]);
  assert.equal(calls.length, 1);
});

test("a refusal that starts a cooldown makes the other pet of the turn a gesture, not a second refused call", async () => {
  let cool = false;
  const { talk, lines, calls } = rig({ paws: "never" }, { allow: () => !cool });
  const model = (talk as unknown as { deps: Deps }).deps.model;
  (talk as unknown as { deps: Deps }).deps.model = async (...a) => { try { return await model(...a); } catch (e) { cool = true; throw e; } }; // what the page does on rate_limit
  await talk.person("both?", ["peak", "paws"], ["peak", "paws"]); // peak has no key: rejects
  assert.deepEqual(lines.map((l) => [l.pet, l.act]), [["peak", "gesture"], ["paws", "gesture"]]);
  assert.equal(calls.length, 1);
});

test("a message sent while a relay waits for its beat cancels it", async () => {
  let release = () => {};
  const { talk, lines, calls } = rig({ peak: "x", paws: "Splendid." }, { sleep: () => new Promise<void>((r) => { release = r; }) });
  const relayed = talk.relay("ask Paws", "peak", "paws", ["peak", "paws"]);
  await Promise.resolve();
  talk.cancel();
  release();
  await relayed;
  assert.equal(calls.length, 0);
  assert.deepEqual(lines.map((l) => l.act), ["turn"], "only the turn to Paws was shown, no answer follows");
});

test("the language the person writes in is said again, last, to each pet, with the chosen one as the fallback; none is said when it is not known", () => {
  assert.match(situation("paws", "first", false, undefined, "", "vi"), /language the person is writing in.*reply in Vietnamese/);
  assert.match(situation("peak", "second", true, undefined, "Vinh", "ja"), /language the person is writing in.*reply in Japanese.*likes to be called Vinh/);
  assert.doesNotMatch(situation("paws", "first", false), /language the person is writing in/);
});

test("a mood tag is a known mood or neutral; a misspelling keeps its mood; a stray known tag is never left in the words", () => {
  assert.equal(parseUtterance("[ssad] Oh dear.").mood, "sad");
  assert.equal(parseUtterance("[giggly] Hello.").mood, "neutral");
  assert.deepEqual(parseUtterance('"[happy] Hello there." [sad]').text, 'Hello there."');
  assert.equal(parseUtterance("**[warm]** Hi").text, "Hi");
  assert.equal(parseUtterance("Hi [sad] there").text, "Hi there");
});

// ---- issue 4, Codex's Quiet defect: Quiet turned on while a call is pending, or while a line waits to be shown ----

test("Quiet turned on while a call is pending: the late reply is a gesture, never a line (person)", async () => {
  let quiet = false;
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines } = rig({ peak: () => slow }, { quiet: () => quiet });
  const run = talk.person("hello", ["peak"], ["peak"]);
  await Promise.resolve();
  quiet = true;
  release("[happy] reply after Quiet");
  await run;
  assert.deepEqual(lines.map((l) => [l.act, l.text]), [["gesture", ""]]);
});

test("Quiet turned on while the first of two calls is pending: neither pet speaks", async () => {
  let quiet = false;
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines, calls } = rig({ peak: () => slow, paws: "Splendid." }, { quiet: () => quiet });
  const run = talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  await Promise.resolve();
  quiet = true;
  release("Fine.");
  await run;
  assert.ok(lines.every((l) => l.act !== "say"), "no line is said in Quiet");
  assert.equal(calls.length, 1, "the second pet is not even asked");
});

test("Quiet turned on while a relayed answer is pending: a gesture, not a line", async () => {
  let quiet = false;
  let release: (s: string) => void = () => {};
  const slow = new Promise<string>((r) => { release = r; });
  const { talk, lines } = rig({ peak: "x", paws: () => slow }, { quiet: () => quiet });
  const run = talk.relay("ask Paws", "peak", "paws", ["peak", "paws"]);
  await Promise.resolve(); await Promise.resolve();
  quiet = true;
  release("Splendid.");
  await run;
  assert.ok(lines.every((l) => l.act !== "say"), "no line is said in Quiet");
});

import { presentable } from "./conversation.ts";

test("a line that waited in the queue is not shown if Quiet came meanwhile; a gesture still is", () => {
  const say: Line = { pet: "peak", act: "say", text: "hi", mood: "neutral", to: ["person"], turnId: 1 };
  const nod: Line = { pet: "peak", act: "gesture", text: "", mood: "neutral", to: ["person"], turnId: 2 };
  assert.equal(presentable(say, true), null);
  assert.equal(presentable(say, false), say);
  assert.equal(presentable(nod, true), nod);
});

test("the page drops the pending turn when Quiet comes, and checks Quiet again before a queued line is shown", () => {
  const page = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  assert.ok(/if \(quiet && duoOn\) \{[\s\S]{0,220}cancelTalk\(\)/.test(page), "the quiet-changed handler cancels the talk");
  assert.ok(/presentable\(l, quiet \|\| away\)/.test(page), "the presentation checks Quiet again");
});

test("a line shows in the chat only once it is presented, and a cancelled one never shows nor stays in the talk (#18)", () => {
  let room = newRoom();
  room = addTurn(room, { from: "person", to: ["peak", "paws"], text: "both?", at: 1, act: "say" }).room;
  const paws = addTurn(room, { from: "paws", to: ["person"], text: "A long and earnest line from Paws.", at: 2, act: "say" });
  const peak = addTurn(paws.room, { from: "peak", to: ["person"], text: "Short.", at: 3, act: "say" });
  room = peak.room;
  const waiting = new Set([paws.turn.id, peak.turn.id]); // both answered, nothing presented yet
  assert.deepEqual(shownSays(room, waiting).map((t) => t.text), ["both?"]);
  waiting.delete(paws.turn.id); // Paws is presented first
  assert.deepEqual(shownSays(room, waiting).map((t) => t.from), ["person", "paws"], "Peak's short answer is not shown while Paws's line is being read");
  waiting.delete(peak.turn.id); // then Peak, on the beat of its expression
  assert.deepEqual(shownSays(room, waiting).map((t) => t.from), ["person", "paws", "peak"]);
  // cancelled before presentation: gone from the chat and from what the pets heard
  const cut = withoutTurn(room, peak.turn.id);
  assert.deepEqual(shownSays(cut, new Set()).map((t) => t.from), ["person", "paws"]);
  assert.ok(heard(cut, "peak").every((t) => t.text !== "Short."));
});
