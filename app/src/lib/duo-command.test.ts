import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDuoCommand } from "./duo-command.ts";

const c = (t: string) => parseDuoCommand(t);

test("calling Paws out, in the three languages", () => {
  for (const t of ["gọi Paws ra đi", "Gọi Paws ra", "cho Paws ra nào", "Paws ra đây", "call Paws out", "Bring Paws out!", "Paws, come out", "let Paws out", "Pawsを呼んで", "Pawsを呼んでください", "Pawsおいで", "Pawsを出して"]) {
    assert.deepEqual(c(t), { target: "paws", act: "out" }, t);
  }
});

test("sending Paws in", () => {
  for (const t of ["Paws vào đi", "cho Paws vào đi", "Paws go in", "send Paws in", "bring Paws in", "tuck Paws away", "Paws, go away", "Pawsは戻って", "Pawsをしまって", "Pawsは引っ込んで"]) {
    assert.deepEqual(c(t), { target: "paws", act: "in" }, t);
  }
});

test("the same words for Peak", () => {
  assert.deepEqual(c("Peak vào đi"), { target: "peak", act: "in" });
  assert.deepEqual(c("send Peak in"), { target: "peak", act: "in" });
  assert.deepEqual(c("Peak出てきて"), { target: "peak", act: "out" });
});

test("a message is not a command unless it names one pet and says out or in", () => {
  assert.equal(c("hôm nay tớ vui lắm"), null);
  assert.equal(c("Paws là con chó của bạn à"), null);
  assert.equal(c("gọi cho mẹ nhé"), null); // no pet named
  assert.equal(c("Paws và Peak ra đi"), null); // two pets: not a command for one
  assert.equal(c("I wonder what Paws did all day"), null);
  assert.equal(c(""), null);
});

test("a long sentence is a conversation, not a command", () => {
  assert.equal(c("hôm qua tớ định gọi Paws ra nhưng tớ bận quá nên thôi, để mai"), null);
});

import { addressees } from "./duo-command.ts";

const both = { peak: true, paws: true };
test("a message goes to every pet that is out; a name or an @ picks one; a word for both keeps both", () => {
  assert.deepEqual(addressees("hôm nay thế nào", both), ["peak", "paws"]); // no name: everyone out hears
  assert.deepEqual(addressees("Paws ơi", both), ["paws"]);
  assert.deepEqual(addressees("@Paws how are you", both), ["paws"]);
  assert.deepEqual(addressees("Peak, còn bạn?", both), ["peak"]);
  assert.deepEqual(addressees("Peak, what do you think of Paws?", both), ["peak"]); // opens with one name: for that pet
  assert.deepEqual(addressees("@Paws, what does Peak think?", both), ["paws"]);
  assert.deepEqual(addressees("Paws, and Peak, how are you?", both), ["peak", "paws"]);
  assert.deepEqual(addressees("@Paws và @Peak nghĩ sao?", both), ["peak", "paws"]);
  assert.deepEqual(addressees("Paws và Peak nghĩ sao?", both), ["peak", "paws"]);
  assert.deepEqual(addressees("hai đứa đang làm gì đấy", both), ["peak", "paws"]);
  assert.deepEqual(addressees("how are you both?", both), ["peak", "paws"]);
  assert.deepEqual(addressees("二人とも元気？", both), ["peak", "paws"]);
});

test("with one pet out it hears everything, also what names the other; with none out nobody is addressed", () => {
  assert.deepEqual(addressees("Paws ơi", { peak: true, paws: false }), ["peak"]); // Paws is in: whoever is out answers
  assert.deepEqual(addressees("hôm nay thế nào", { peak: false, paws: true }), ["paws"]);
  assert.deepEqual(addressees("Peak ơi", { peak: false, paws: true }), ["paws"]);
  assert.deepEqual(addressees("anyone there", { peak: false, paws: false }), []);
});

import { parseRelay } from "./duo-command.ts";

test("a relay: the person asks one pet to ask the other", () => {
  assert.deepEqual(parseRelay("Peak, hỏi Paws xem hôm nay nó làm gì"), { target: "paws", via: "peak" });
  assert.deepEqual(parseRelay("ask Peak what he thinks"), { target: "peak", via: "paws" });
  assert.deepEqual(parseRelay("Pawsに聞いてみて"), { target: "paws", via: "peak" });
  assert.equal(parseRelay("hôm nay thế nào"), null);
  assert.equal(parseRelay("I asked Paws about it yesterday and he never answered me at all, which was rude of him, honestly, as a matter of fact"), null);
});
