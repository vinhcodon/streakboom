// Run with: node --test src/lib/presentation.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Conversation, shownSays, type Deps, type Line } from "./conversation.ts";
import { Presenter } from "./presentation.ts";
import type { PetId } from "./duo.ts";

/** The page's wiring around the real Conversation: lines are written into the talk and queued; the queue is held (not run) until the test releases it. */
function harness(withPresenter: boolean) {
  const inputs: { pet: PetId; heard: string[] }[] = [];
  const answers: Record<PetId, string[]> = { paws: ["Presented Paws"], peak: ["UNPRESENTED PEAK", "Fresh answer"] };
  let t = 1000;
  const deps: Deps = {
    model: async (pet, view) => { inputs.push({ pet, heard: view.map((v) => v.text) }); return answers[pet].shift() ?? "…"; },
    allow: () => true, quiet: () => false, sleep: async () => {}, beat: () => 0, now: () => (t += 10),
  };
  const presenter = new Presenter();
  const queue: { l: Line; gen: number }[] = [];
  const talk = new Conversation(deps, (l) => { if (l.act === "say") presenter.written(l.turnId, l.pet); queue.push({ l, gen: presenter.gen }); });
  // what cancelTalk does: the generation moves on and the talk is cancelled; with the presenter the waiting lines also leave the talk at once
  const cancel = () => { talk.cancel(); if (withPresenter) talk.room = presenter.cancel(talk.room); else presenter.gen++; };
  return { talk, presenter, queue, inputs, cancel };
}

async function scenario(withPresenter: boolean) {
  const h = harness(withPresenter);
  h.talk.lastSpoken = "paws"; // Paws speaks first, Peak second
  h.talk.notePerson("Both of you?", ["paws", "peak"]);
  await h.talk.person("Both of you?", ["paws", "peak"], ["peak", "paws"]);
  const pawsLine = h.queue.find((q) => q.l.pet === "paws" && q.l.act === "say")!;
  const peakLine = h.queue.find((q) => q.l.pet === "peak" && q.l.act === "say")!;
  assert.ok(h.presenter.present(pawsLine.l.turnId, pawsLine.gen), "Paws's line is presented");
  assert.equal(h.presenter.writer(), "peak", "Peak's answer is written and waits; the box shows Peak writing");
  // Esc, the chat reopened, and a fresh question to Peak at once, with the old queue held
  h.cancel();
  const writerAfterCancel = h.presenter.writer();
  h.talk.notePerson("Fresh question", ["peak"]);
  await h.talk.person("Fresh question", ["peak"], ["peak", "paws"]);
  const fresh = h.inputs[h.inputs.length - 1];
  const freshLine = h.queue.find((q) => q.l.pet === "peak" && q.l.act === "say" && q.l.text === "Fresh answer")!;
  // now the old queue runs late: its presentation must be refused and must not disturb the new turn
  const stale = h.presenter.present(peakLine.l.turnId, peakLine.gen);
  return { h, fresh, writerAfterCancel, stale, freshLine };
}

test("after a cancelled turn, the next model input has the presented lines and the new question, never the unpresented line; a late old callback changes nothing (#18)", async () => {
  const { h, fresh, writerAfterCancel, stale, freshLine } = await scenario(true);
  assert.equal(fresh.pet, "peak");
  assert.deepEqual(fresh.heard, ["Both of you?", "Presented Paws", "Fresh question"], "the person's messages and Paws's presented line, nothing of the cancelled Peak line");
  assert.equal(writerAfterCancel, null, "the cancelled turn's writing cue is gone at once");
  assert.equal(stale, false, "the old queue's presentation is refused");
  assert.equal(h.presenter.writer(), "peak", "the new turn's Peak line still waits, untouched by the stale callback");
  assert.ok(h.presenter.present(freshLine.l.turnId, freshLine.gen), "and it is presented normally");
  assert.deepEqual(shownSays(h.talk.room, h.presenter.hidden()).map((t) => t.text), ["Both of you?", "Presented Paws", "Fresh question", "Fresh answer"]);
});

test("the race as it was (only the generation moved on at cancel): the unpresented line reached the next model input (#18, the before)", async () => {
  const { fresh } = await scenario(false);
  assert.deepEqual(fresh.heard, ["Both of you?", "Presented Paws", "UNPRESENTED PEAK", "Fresh question"]);
});

test("a member sent away while its answer waits: its line leaves the talk and the cue at once, a reinvite starts clean, the late callback changes nothing (#18)", async () => {
  const inputs: { pet: PetId; heard: string[] }[] = [];
  const answers: Record<PetId, string[]> = { paws: ["STALE PAWS", "New Paws"], peak: ["Peak stays"] };
  let t = 1000;
  const deps: Deps = { model: async (pet, view) => { inputs.push({ pet, heard: view.map((v) => v.text) }); return answers[pet].shift() ?? "…"; }, allow: () => true, quiet: () => false, sleep: async () => {}, beat: () => 0, now: () => (t += 10) };
  const presenter = new Presenter();
  const queue: { l: Line; gen: number }[] = [];
  const talk = new Conversation(deps, (l) => { if (l.act === "say") presenter.written(l.turnId, l.pet); queue.push({ l, gen: presenter.gen }); });
  talk.lastSpoken = "paws";
  talk.notePerson("Both of you?", ["paws", "peak"]);
  await talk.person("Both of you?", ["paws", "peak"], ["peak", "paws"]); // both answered; nothing presented yet (the queue is held)
  const stalePaws = queue.find((q) => q.l.text === "STALE PAWS")!;
  const peak = queue.find((q) => q.l.text === "Peak stays")!;
  // `/in paws` succeeds while the chat stays open: what the page now does at that boundary
  talk.tucked("paws");
  const r = presenter.dropPet(talk.room, "paws");
  talk.room = r.room;
  assert.equal(r.dropped, 1);
  assert.equal(presenter.writer(), "peak", "Paws's cue is gone; Peak's valid line still waits");
  // reinvited before the old callback runs, and asked again
  talk.notePerson("Paws again?", ["paws"]);
  await talk.person("Paws again?", ["paws"], ["peak", "paws"]);
  const pawsInput = inputs[inputs.length - 1];
  assert.ok(!pawsInput.heard.includes("STALE PAWS"), "the new turn does not hear the line Paws never got to say");
  // the old callbacks run late
  assert.equal(presenter.present(stalePaws.l.turnId, stalePaws.gen), false, "the stale Paws line is refused");
  assert.ok(!talk.room.turns.some((x) => x.text === "STALE PAWS"), "and it is not in the talk");
  const fresh = queue.find((q) => q.l.text === "New Paws")!;
  assert.equal(presenter.present(peak.l.turnId, peak.gen), true, "Peak's valid line still presents");
  assert.equal(presenter.present(fresh.l.turnId, fresh.gen), true, "and the new Paws line presents normally");
});
