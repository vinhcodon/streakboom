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
