import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, existingLines, filterCandidates, parseCandidates, similarity, toSnippet, SITUATION } from "./linefactory.ts";
import { LINES } from "./lines.ts";

test("the request holds the character, the situation and the existing lines, and nothing about a user", () => {
  const p = buildPrompt({ lang: "vi", trigger: "click", count: 30, existing: ["Ê, nhột đó!", "Bíp."], voice: "witty and loyal" });
  assert.match(p, /Write 30 NEW lines in Vietnamese/);
  assert.match(p, /pokes Peak/);
  assert.match(p, /- Ê, nhột đó!/);
  assert.match(p, /witty and loyal/);
  assert.match(p, /never the person/);
  assert.doesNotMatch(p, /api[-_ ]?key|password|@/i);
});

test("the situation of a mood band and of a tier is filled in", () => {
  assert.match(buildPrompt({ lang: "en", trigger: "idle", count: 5, existing: [], band: "lonely", voice: "x" }), /mood band: lonely/);
  assert.match(buildPrompt({ lang: "en", trigger: "greeting", count: 5, existing: [], tier: 3, voice: "x" }), /tier 3/);
  for (const t of ["click", "pet", "belly", "idle", "greeting", "how", "return"] as const) assert.ok(SITUATION[t], t);
});

test("the answer is split into lines without list marks or quotes", () => {
  assert.deepEqual(parseCandidates('1. "Hello there."\n- Another one\n\n* “Third”\n• Fourth'), ["Hello there.", "Another one", "Third", "Fourth"]);
});

test("a repeat of an existing line, a near repeat, a long line and assistant talk are thrown away", () => {
  const ex = ["Hey, that tickles a lot!"];
  const v = filterCandidates(["Hey, that tickles a lot!", "Hey that tickles a lot", "A completely new thought about socks.", "x".repeat(120), "As an AI assistant I like pokes.", "A completely new thought about socks.", "Pokes make my whiskers hum \u{1F600}"], "en", ex);
  assert.deepEqual(v.map((x) => x.ok), [false, false, true, false, false, false, false]);
  assert.match(v[0].reason!, /existing/);
  assert.match(v[5].reason!, /earlier candidate/);
});

test("Japanese must be Japanese and in the casual voice; Vietnamese must look Vietnamese", () => {
  const ja = filterCandidates(["今日もいい天気だね。", "お元気ですか。", "Just English", "元気だよ、ありがとう！", "これは猫です。"], "ja", []);
  assert.deepEqual(ja.map((x) => x.ok), [true, true, false, true, false]);
  assert.equal(filterCandidates(["Bạn ơi, mình đói rồi nè."], "vi", [])[0].ok, true);
  assert.equal(filterCandidates(["Just an english sentence here."], "vi", [])[0].ok, false);
});

test("similarity is 1 for the same words in another order and low for different lines", () => {
  assert.equal(similarity("poke me again", "again poke me", "en"), 1);
  assert.ok(similarity("poke me again", "the weather is nice", "en") < 0.2);
});

test("the survivors become code to paste, and the existing lines come from the pools", () => {
  assert.equal(toSnippet("vi", "click", ["a", 'b "c"'], "f1", "{ tiers: [2] }"), '...mk("vi", "click", ["a", "b \\"c\\""], { tiers: [2] }, "f1"),');
  const ex = existingLines(LINES, "vi", "click");
  assert.ok(ex.length >= 20 && ex.every((t) => typeof t === "string"));
  assert.ok(!existingLines(LINES, "vi", "click").some((t) => t.includes("{pokes}")), "stage lines are not part of the plain pool");
});
