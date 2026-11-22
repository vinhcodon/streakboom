import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCallMe } from "./callme.ts";

test("a message that tells the pets what to call the person gives the name, in three languages", () => {
  assert.equal(parseCallMe("call me Vinh"), "Vinh");
  assert.equal(parseCallMe("Please call me Vinh."), "Vinh");
  assert.equal(parseCallMe("my name is Vinh"), "Vinh");
  assert.equal(parseCallMe("gọi tôi là Vinh"), "Vinh");
  assert.equal(parseCallMe("Hãy gọi mình là Vinh Codon"), "Vinh Codon");
  assert.equal(parseCallMe("tên mình là Vinh"), "Vinh");
  assert.equal(parseCallMe("Vinhと呼んで"), "Vinh");
  assert.equal(parseCallMe("Vinhと呼んでください"), "Vinh");
});

test("anything else is just a message: a sentence, no name, too long", () => {
  assert.equal(parseCallMe("hôm nay tớ vui lắm"), null);
  assert.equal(parseCallMe("call me later when you have time to talk about the project"), null); // more than a name
  assert.equal(parseCallMe("call me"), null);
  assert.equal(parseCallMe(""), null);
  assert.equal(parseCallMe("x".repeat(200)), null);
});

test("the name is cleaned: quotes off, marks off, at most twenty characters", () => {
  assert.equal(parseCallMe('call me "Vinh"'), "Vinh");
  assert.ok(!/[<>]/.test(parseCallMe("call me <b>Vinh</b>") ?? ""));
  assert.ok((parseCallMe("call me Abcdefghijklmnopqrstuvwxyz") ?? "").length <= 20);
});
