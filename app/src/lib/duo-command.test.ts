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

import { addressedPet } from "./duo-command.ts";

test("the pet named answers; with no name the one last spoken to; Paws only while out", () => {
  assert.equal(addressedPet("Paws ơi, hôm nay thế nào?", "peak", true), "paws");
  assert.equal(addressedPet("Peak, còn bạn?", "paws", true), "peak");
  assert.equal(addressedPet("hôm nay thế nào?", "paws", true), "paws");
  assert.equal(addressedPet("hôm nay thế nào?", "peak", true), "peak");
  assert.equal(addressedPet("Paws và Peak nghĩ sao?", "paws", true), "paws"); // both named: the last spoken to
  assert.equal(addressedPet("Paws ơi", "peak", false), "peak"); // Paws is away: Peak answers
});

import { addressees } from "./duo-command.ts";

test("who a message is for: both when both are named or a word for both is used, only while Paws is out", () => {
  assert.deepEqual(addressees("Paws và Peak nghĩ sao?", "peak", true), ["peak", "paws"]);
  assert.deepEqual(addressees("hai đứa đang làm gì đấy", "peak", true), ["peak", "paws"]);
  assert.deepEqual(addressees("how are you both?", "peak", true), ["peak", "paws"]);
  assert.deepEqual(addressees("二人とも元気？", "peak", true), ["peak", "paws"]);
  assert.deepEqual(addressees("Paws ơi", "peak", true), ["paws"]);
  assert.deepEqual(addressees("Peak, what do you think of Paws?", "paws", true), ["peak"]); // opens with one name: for that pet
  assert.deepEqual(addressees("Paws, and Peak, how are you?", "peak", true), ["peak", "paws"]);
  assert.deepEqual(addressees("Paws và Peak nghĩ sao?", "peak", true), ["peak", "paws"]);
  assert.deepEqual(addressees("hôm nay thế nào", "paws", true), ["paws"]);
  assert.deepEqual(addressees("hai đứa đang làm gì đấy", "peak", false), ["peak"]);
  assert.deepEqual(addressees("hôm nay thế nào", "both", true), ["peak", "paws"]); // the Both chip
  assert.deepEqual(addressees("Paws ơi", "both", true), ["paws"]); // a name in the text overrides the chip
  assert.deepEqual(addressees("hôm nay thế nào", "both", false), ["peak"]); // nobody else is out
});

import { parseRelay } from "./duo-command.ts";

test("a relay: the person asks one pet to ask the other", () => {
  assert.deepEqual(parseRelay("Peak, hỏi Paws xem hôm nay nó làm gì"), { target: "paws", via: "peak" });
  assert.deepEqual(parseRelay("ask Peak what he thinks"), { target: "peak", via: "paws" });
  assert.deepEqual(parseRelay("Pawsに聞いてみて"), { target: "paws", via: "peak" });
  assert.equal(parseRelay("hôm nay thế nào"), null);
  assert.equal(parseRelay("I asked Paws about it yesterday and he never answered me at all, which was rude of him, honestly, as a matter of fact"), null);
});
