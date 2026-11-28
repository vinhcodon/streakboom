import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ChargeNotSaved, DUO_CAP_SCALE, NotIssued, PetWriter, SendGate, SoloWork, chargeSolo, chargedRequest, quota, routeBoxSend, soloTurn } from "./dispatch.ts";
import { Conversation, type Deps, type Line } from "./conversation.ts";
import { SendQueue } from "./send-queue.ts";
import { AI_CHAT_DAILY_CAP, AI_COOLDOWN_MS, dayKey, defaultData, parse, type PetData } from "./state.ts";
import type { PetId } from "./duo.ts";

// T2d of ADR-0167 (issue 22): the fixtures frozen on the ticket, and the return of comment 7234025168 (R1: a late or replayed send; R2: the charge is an
// acknowledged write before the request). The page's boundaries are the functions of dispatch.ts; these tests drive them with the page's own wiring:
// PetWriter over a native write that can be held or rejected, quota over it, chargedRequest inside the Conversation's model, routeBoxSend into a SendQueue.

const at = (h: number, m = 0, s = 0, ms = 0, day = 28) => new Date(2026, 10, day, h, m, s, ms).getTime();
const tick = () => new Promise<void>((r) => setTimeout(r, 0));

/** A native write of pet.json that the test controls: "ok" acknowledges at once, "hold" waits for release(), "fail" rejects (a write or rename error). */
function disk(initial: string) {
  let stored = initial;
  let mode: "ok" | "hold" | "fail" = "ok";
  const held: (() => void)[] = [];
  let writes = 0;
  const write = (json: string) => {
    writes++;
    if (mode === "fail") return Promise.reject(new Error("rename failed"));
    if (mode === "hold") return new Promise<void>((r) => held.push(() => { stored = json; r(); }));
    stored = json;
    return Promise.resolve();
  };
  return {
    write,
    stored: () => stored,
    chat: () => (JSON.parse(stored) as PetData).ai.chat,
    set mode(m: "ok" | "hold" | "fail") { mode = m; },
    release: () => { while (held.length) held.shift()!(); },
    writes: () => writes,
  };
}

/** The page in miniature, with the page's own wiring: pet data, the clock, one PetWriter over the disk, the quota over the writer, a Conversation whose model
 *  goes through chargedRequest with the Conversation's own `live`. */
function page(opts: { chat?: number; day?: string; now?: number; duo?: boolean; reply?: (pet: PetId) => Promise<string>; quiet?: () => boolean; brain?: boolean } = {}) {
  let now = opts.now ?? at(12);
  let data: PetData = defaultData(now);
  data = { ...data, ai: { ...data.ai, day: opts.day ?? dayKey(now), chat: opts.chat ?? 0 } };
  const d = disk(JSON.stringify(data));
  const writer = new PetWriter(d.write, () => JSON.stringify(data));
  const requests: PetId[] = [];
  const storedAtRequest: number[] = [];
  const log: string[] = [];
  const q = quota({ get: () => data, set: (x) => { data = x; }, persist: () => writer.save(), now: () => now, duo: opts.duo ?? true, log: (l) => log.push(l) });
  const kindOf = (e: unknown) => (e as { kind?: string } | null)?.kind ?? "unknown";
  const deps: Deps = {
    model: (pet, _view, _role, live) => chargedRequest(q, () => {
      requests.push(pet);
      storedAtRequest.push(d.chat()); // what a restart at this moment would read
      return (opts.reply ?? (async () => "[happy] Fine."))(pet);
    }, kindOf, live ?? (() => true)),
    allow: () => (opts.brain ?? true) && q.gate() === "ok",
    quiet: opts.quiet ?? (() => false),
    sleep: async (ms) => { now += ms; },
    beat: () => 700,
    now: () => now,
  };
  const lines: Line[] = [];
  const talk = new Conversation(deps, (l) => lines.push(l));
  return {
    talk, lines, requests, storedAtRequest, q, disk: d, writer, log,
    data: () => data,
    setData: (x: PetData) => { data = x; },
    restart: () => { data = parse(d.stored(), now); },
    setNow: (t: number) => { now = t; },
  };
}

// ---------------------------------------------------------------- the count and the cap (fixtures of the claim)

test("the cap is 120 a day with the experiment and 60 without it (ADR-0165)", () => {
  assert.equal(AI_CHAT_DAILY_CAP * DUO_CAP_SCALE, 120);
  assert.equal(page({ chat: 119 }).q.gate(), "ok");
  assert.equal(page({ chat: 120 }).q.gate(), "cap");
  assert.equal(page({ chat: 59, duo: false }).q.gate(), "ok");
  assert.equal(page({ chat: 60, duo: false }).q.gate(), "cap", "with the experiment off the cap stays 60");
});

test("119 used with two pets eligible: one request, the count reaches 120 (stored before the request), the second pet makes a gesture (no 121st)", async () => {
  const p = page({ chat: 119 });
  await p.talk.person("how are you both", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.deepEqual(p.storedAtRequest, [120], "the charge was on disk when the request was issued");
  assert.equal(p.data().ai.chat, 120);
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}`), ["peak:say", "paws:gesture"]);
});

test("a request that fails is charged; the pet makes a gesture", async () => {
  const p = page({ chat: 10, reply: async () => { throw { kind: "network" }; } });
  await p.talk.person("hello", ["peak"], ["peak"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.equal(p.data().ai.chat, 11);
  assert.equal(p.disk.chat(), 11, "the charge made before the request stays, on disk");
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}`), ["peak:gesture"]);
});

test("a reply dropped because Quiet came while it was pending is still charged, and the next pet is not asked", async () => {
  let quiet = false;
  const p = page({ chat: 3, quiet: () => quiet, reply: async () => { quiet = true; return "[happy] late"; } });
  await p.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.equal(p.disk.chat(), 4);
});

test("a rate limit starts the cooldown: the second pet makes a gesture with no request, and so does the next turn", async () => {
  const p = page({ chat: 5, reply: async () => { throw { kind: "rate_limit" }; } });
  const t0 = p.data().ai.coolUntil;
  await p.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.equal(p.data().ai.chat, 6);
  assert.ok(p.data().ai.coolUntil > t0);
  assert.ok((JSON.parse(p.disk.stored()) as PetData).ai.coolUntil > t0, "the cooldown is written too");
  assert.equal(p.q.gate(), "cooldown");
  await p.talk.person("again", ["peak"], ["peak"]);
  assert.deepEqual(p.requests, ["peak"]);
  p.setNow(p.data().ai.coolUntil + 1);
  assert.equal(p.q.gate(), "ok");
  assert.equal(AI_COOLDOWN_MS, 120_000);
});

test("Quiet, group and solo: no request, no charge, a gesture (rows 14a and solo Quiet, ADR-0169)", async () => {
  const g = page({ chat: 7, quiet: () => true });
  await g.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  const s = page({ chat: 7, quiet: () => true });
  await s.talk.person("just you", ["peak"], ["peak"]);
  for (const p of [g, s]) {
    assert.deepEqual(p.requests, []);
    assert.equal(p.data().ai.chat, 7);
    assert.equal(p.disk.writes(), 0);
    assert.ok(p.lines.every((l) => l.act === "gesture"));
  }
});

test("no brain: no request and no charge (row 14b)", async () => {
  const p = page({ chat: 2, brain: false });
  await p.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, []);
  assert.equal(p.data().ai.chat, 2);
});

test("an invitation, the end of a visit and a restart on the same day never refill the count", async () => {
  const p = page({ chat: 40 });
  await p.talk.person("@Paws hello", ["paws"], ["peak", "paws"]);
  assert.equal(p.data().ai.chat, 41);
  p.talk.cancel();
  p.setNow(at(18));
  p.restart();
  assert.equal(p.data().ai.chat, 41);
  assert.equal(p.q.gate(), "ok");
});

test("rollover: just before midnight the day's count holds; the first gate or charge after it starts a new day and keeps the cooldown (row 25)", async () => {
  const p = page({ chat: 120, now: at(23, 59, 59, 900) });
  assert.equal(p.q.gate(), "cap");
  await p.q.rateLimited();
  const cool = p.data().ai.coolUntil;
  p.setNow(at(0, 0, 0, 100, 29));
  assert.equal(p.q.gate(), "cooldown", "the cooldown is kept across midnight");
  p.setNow(cool + 1);
  assert.equal(p.q.gate(), "ok");
  await p.q.charge();
  const a = p.data().ai;
  assert.equal(a.day, dayKey(at(0, 0, 0, 100, 29)));
  assert.deepEqual([a.chat, a.proactive, a.note, a.coolUntil], [1, 0, 0, cool]);
});

test("a call pending across midnight is charged to the day it was issued on", async () => {
  let release: (s: string) => void = () => {};
  const p = page({ chat: 50, now: at(23, 59, 59, 900), reply: () => new Promise<string>((r) => { release = r; }) });
  const run = p.talk.person("late", ["peak"], ["peak"]);
  for (let i = 0; i < 5; i++) await tick();
  assert.equal(p.data().ai.chat, 51);
  assert.equal(p.data().ai.day, dayKey(at(23)));
  p.setNow(at(0, 0, 1, 0, 29));
  release("[happy] ok");
  await run;
  await p.q.charge();
  assert.equal(p.data().ai.chat, 1, "the first charge of the new day starts from 0");
});

// ---------------------------------------------------------------- R2: the charge is an acknowledged write before the request

test("R2: while the charge is being written no request is issued; after the acknowledgement exactly one, and a restart then reads the count", async () => {
  const p = page({ chat: 10 });
  p.disk.mode = "hold";
  const run = p.talk.person("hello", ["peak"], ["peak"]);
  for (let i = 0; i < 5; i++) await tick();
  assert.deepEqual(p.requests, [], "no provider call while the write is pending");
  assert.equal(p.disk.chat(), 10);
  p.disk.mode = "ok";
  p.disk.release();
  await run;
  assert.deepEqual(p.requests, ["peak"]);
  assert.deepEqual(p.storedAtRequest, [11], "the request went out only once 11 was on disk");
  p.restart();
  assert.equal(p.data().ai.chat, 11, "a same-day restart reads the charge");
});

test("R2: a failed write issues no request; the in-memory count goes back and nothing unrecorded is sent", async () => {
  const p = page({ chat: 10 });
  p.disk.mode = "fail";
  await p.talk.person("hello", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, [], "no request for either pet");
  assert.equal(p.data().ai.chat, 10);
  assert.equal(p.disk.chat(), 10);
  assert.ok(p.log.some((l) => l.startsWith("charge not saved")));
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}`), ["peak:gesture", "paws:gesture"], "ADR-0170: each pet addressed makes a gesture, no text is spoken");
  await assert.rejects(p.q.charge(), ChargeNotSaved);
});

test("ADR-0170, solo: a charge that cannot be saved sends nothing, Peak makes a gesture and no text is spoken (through soloTurn, the page's continuation)", async () => {
  const p = page({ chat: 10 });
  p.disk.mode = "fail";
  const work = new SoloWork().begin();
  const issue = await soloTurn(p.q, work, () => false, { gesture: () => p.talk.gestureFor("peak"), notSaved: () => p.talk.gestureFor("peak") });
  assert.equal(issue, false);
  assert.deepEqual(p.requests, []);
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}:${l.text}`), ["peak:gesture:"]);
  assert.equal(p.disk.chat(), 10);
});

test("R2: Quiet during the held write: no request, the charge given back, no line spoken", async () => {
  let quiet = false;
  const p = page({ chat: 10, quiet: () => quiet });
  p.disk.mode = "hold";
  const run = p.talk.person("hello", ["peak"], ["peak"]);
  for (let i = 0; i < 5; i++) await tick();
  quiet = true;
  p.disk.mode = "ok";
  p.disk.release();
  await run;
  for (let i = 0; i < 5; i++) await tick();
  assert.deepEqual(p.requests, []);
  assert.equal(p.data().ai.chat, 10, "the charge of a request that was not issued is given back");
  assert.equal(p.disk.chat(), 10, "and written");
  assert.ok(p.lines.every((l) => l.act !== "say"));
});

test("R2: a cancel (a touch, a new message, the end) during the held write: no request, nothing of the old turn appears, the charge given back", async () => {
  const p = page({ chat: 10 });
  p.disk.mode = "hold";
  const run = p.talk.person("hello", ["peak"], ["peak"]);
  for (let i = 0; i < 5; i++) await tick();
  p.talk.cancel();
  p.disk.mode = "ok";
  p.disk.release();
  await run;
  for (let i = 0; i < 5; i++) await tick();
  assert.deepEqual(p.requests, []);
  assert.deepEqual(p.lines, [], "no gesture or line of a cancelled turn");
  assert.equal(p.disk.chat(), 10);
});

test("R2: writes are ordered and each takes its snapshot at its turn: an older snapshot never lands after a newer charge", async () => {
  const p = page({ chat: 10 });
  p.disk.mode = "hold";
  const first = p.writer.save(); // an ordinary save (a scratch, a setting) started before the charge
  const charge = p.q.charge();
  p.disk.mode = "ok";
  p.disk.release();
  await first;
  await charge;
  assert.equal(p.disk.chat(), 11, "the last write on disk carries the charge");
});

test("R2, solo with the experiment: held, rejected and Quiet during the write", async () => {
  const held = page({ chat: 10 });
  held.disk.mode = "hold";
  let issued = false;
  const go = chargeSolo(held.q, () => true).then((r) => { issued = r === "issue"; return r; });
  for (let i = 0; i < 5; i++) await tick();
  assert.equal(issued, false, "no solo request while the write is pending");
  held.disk.mode = "ok";
  held.disk.release();
  assert.equal(await go, "issue");
  assert.equal(held.disk.chat(), 11);

  const failed = page({ chat: 10 });
  failed.disk.mode = "fail";
  assert.equal(await chargeSolo(failed.q, () => true), "not-saved");
  assert.equal(failed.data().ai.chat, 10);

  let quiet = false;
  const q = page({ chat: 10 });
  q.disk.mode = "hold";
  const r = chargeSolo(q.q, () => !quiet);
  for (let i = 0; i < 5; i++) await tick();
  quiet = true;
  q.disk.mode = "ok";
  q.disk.release();
  assert.equal(await r, "not-issued");
  assert.equal(q.disk.chat(), 10, "refunded and written");
});

test("chargedRequest: a request no longer wanted after the write is not issued (NotIssued) and its charge is given back", async () => {
  const p = page({ chat: 3 });
  let called = 0;
  await assert.rejects(chargedRequest(p.q, async () => { called++; return 1; }, () => "unknown", () => false), NotIssued);
  assert.equal(called, 0);
  assert.equal(p.disk.chat(), 3);
});

// ---------------------------------------------------------------- R1: one send, one dispatch, also after its visit ended

/** The page's boundary for box sends: routeBoxSend into the real SendQueue, whose dispatch is a person turn of the Conversation through the quota. */
function boxPage(chat = 0) {
  const p = page({ chat });
  const queued: string[] = [];
  const givenBack: string[] = [];
  const gate = new SendGate();
  const sq = new SendQueue(async (t) => { queued.push(t); await p.talk.person(t, ["peak", "paws"], ["peak", "paws"]); }, async () => {});
  const send = (s: { text: string; mid?: string; at?: number }) => routeBoxSend(gate, s, { queue: (t) => sq.send(t, 0), giveBack: (t) => givenBack.push(t), log: () => {} });
  return { p, queued, givenBack, gate, send };
}

test("R1: a replayed send is dropped in its visit and after the visit ended: no queue entry, request or charge; a new send still goes once", async () => {
  const b = boxPage(0);
  assert.equal(b.send({ text: "@Paws hello", mid: "old-mid", at: at(12) }), "new");
  await tick(); await tick();
  assert.equal(b.send({ text: "@Paws hello", mid: "old-mid", at: at(12) }), "replay");
  b.gate.end(at(12, 1)); // the visit ends
  assert.equal(b.send({ text: "@Paws hello", mid: "old-mid", at: at(12) }), "replay", "the old mid is not rebound to the next visit");
  for (let i = 0; i < 10; i++) await tick();
  assert.deepEqual(b.queued, ["@Paws hello"], "one queue entry in all");
  const requests = b.p.requests.length;
  const chat = b.p.data().ai.chat;
  assert.equal(b.send({ text: "@Paws hello", mid: "new-mid", at: at(12, 2) }), "new", "a genuinely new send after the end goes");
  for (let i = 0; i < 10; i++) await tick();
  assert.deepEqual(b.queued, ["@Paws hello", "@Paws hello"]);
  assert.ok(b.p.requests.length > requests && b.p.data().ai.chat > chat, "and it is requested and charged once more");
});

test("R1: a send that left the box before the visit ended and arrives after it is not sent into the next visit; its text goes back once", async () => {
  const b = boxPage(0);
  b.gate.end(at(12, 5));
  assert.equal(b.send({ text: "late words", mid: "m-late", at: at(12, 4) }), "stale");
  assert.equal(b.send({ text: "late words", mid: "m-late", at: at(12, 4) }), "replay", "a second delivery of it is not returned twice");
  for (let i = 0; i < 5; i++) await tick();
  assert.deepEqual(b.queued, []);
  assert.deepEqual(b.p.requests, []);
  assert.equal(b.p.data().ai.chat, 0);
  assert.deepEqual(b.givenBack, ["late words"]);
});

test("R1: two deliberate sends with the same text have their own ids and both go", async () => {
  const b = boxPage(0);
  assert.equal(b.send({ text: "hi", mid: "a", at: at(12) }), "new");
  assert.equal(b.send({ text: "hi", mid: "b", at: at(12) }), "new");
  for (let i = 0; i < 20; i++) await tick();
  assert.deepEqual(b.queued, ["hi", "hi"]);
});

// ---------------------------------------------------------------- the page uses these boundaries (source checks beside the behaviour above)

test("the page uses these boundaries: box sends with mid and time, routeBoxSend, the end of a visit, acknowledged ordered writes, awaited charges", () => {
  const src = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  const box = readFileSync(new URL("../routes/chatbox/+page.svelte", import.meta.url), "utf8");
  assert.ok(/act\(\{ type: "send", text, mid: newMid\(\), at: Date\.now\(\) \}\)/.test(box), "the box gives every deliberate send its id and the moment it left");
  assert.ok(src.includes("routeBoxSend(sendGate, { text, mid, at }"), "the page's send boundary is routeBoxSend");
  assert.ok(/duo-visit-ended[\s\S]{0,200}sendGate\.end\(Date\.now\(\)\)/.test(src), "the end of a visit closes its sends");
  assert.ok(src.includes("persist: () => petWriter.save()"), "the quota waits for the acknowledged write");
  assert.ok(/if \(duoOn\) await petWriter\.save\(\);\s*else await invoke\("save_pet"/.test(src), "with the experiment every pet.json write goes through the ordered writer; without it, as before");
  const model = src.slice(src.indexOf("const talk = new Conversation("), src.indexOf("const talk = new Conversation(") + 2600);
  assert.ok(model.indexOf("chargedRequest(") >= 0 && model.indexOf("chargedRequest(") < model.indexOf("call ${pet} ${role}") && model.indexOf("call ${pet} ${role}") < model.indexOf("if (duoFake)"),
    "the request (and its log line) is issued inside chargedRequest, after the charge, for canned and real replies alike");
  assert.ok(model.includes("live ?? (() => true)"), "the Conversation's live test is asked after the write");
  assert.ok(/allow: \(\) => duoQuota\.gate\(\) === "ok"/.test(model));
  assert.ok(src.includes('if (!(await soloTurn(duoQuota, work, () => quiet || away, { gesture: () => talk.gestureFor("peak"), notSaved: () => chargeNotSaved("peak", text) }))) return;'),
    "solo with the experiment: soloTurn decides, and every outcome but issue returns");
  assert.ok(src.includes("const work = soloWork.begin();"), "each solo turn has its own identity");
  assert.ok(!/talk\.person\(text, \["peak"\], \["peak"\]\)/.test(src), "no solo outcome re-enters a turn that can call the model");
  assert.ok(/function cancelTalk\(\) \{\s*soloWork\.cancel\(\);/.test(src), "Quiet, a touch, a clear and the end of a visit (all through cancelTalk) move the solo work on");
  assert.equal((src.match(/if \((?:c|a|e\.payload|a\.target|c\.target)[^)]*=== "peak"\) soloWork\.cancel\(\)/g) ?? []).length, 3, "Peak tucked in moves it on, on all three paths");
  assert.ok(/quiet: a solo message makes no request[\s\S]{0,120}talk\.gestureFor\("peak"\)/.test(src), "the solo Quiet gesture is local");
  assert.ok(/\} else data = recordAi\(data, "chat", Date\.now\(\)\);/.test(src), "without the experiment the solo charge is as before");
  assert.ok(!src.includes('duoFake ? "ok"'), "no gate is bypassed for canned replies");
});

// ---------------------------------------------------------------- second return (comment 7234808588)

test("R1, second return: more than 512 sends in one visit do not make the first one new again (through routeBoxSend and the queue)", async () => {
  const gate = new SendGate();
  const queued: string[] = [];
  const sq = new SendQueue(async (t) => { queued.push(t); }, async () => {});
  const send = (s: { text: string; mid?: string; at?: number }) => routeBoxSend(gate, s, { queue: (t) => sq.send(t, 0), giveBack: () => {}, log: () => {} });
  assert.equal(send({ text: "same", mid: "first", at: 100 }), "new");
  for (let i = 0; i < 1500; i++) assert.equal(send({ text: `m${i}`, mid: `mid-${i}`, at: 101 + i }), "new");
  for (let i = 0; i < 20; i++) await tick();
  assert.equal(send({ text: "same", mid: "first", at: 100 }), "replay", "the original event, delivered again after 1500 others, is still a replay");
  assert.equal(send({ text: "same", mid: "fresh", at: 2000 }), "new", "a genuinely fresh send with the same text still goes");
  for (let i = 0; i < 20; i++) await tick();
  assert.equal(queued.length, 1 + 1500 + 1);
  assert.equal(queued.filter((t) => t === "same").length, 2);
  assert.equal(gate.held, 1502);
});

/** The solo page continuation in miniature: soloWork, a quiet flag, the page's Quiet handler (which cancels through cancelTalk), and soloTurn with the page's
 *  gesture. After soloTurn returns false the page returns; providerCalls counts anything that would reach the model after it (nothing may). */
function soloPage(chat = 10) {
  const p = page({ chat });
  const work = new SoloWork();
  let quiet = false;
  let providerCalls = 0;
  const run = async () => {
    const w = work.begin();
    const issue = await soloTurn(p.q, w, () => quiet, { gesture: () => p.talk.gestureFor("peak"), notSaved: () => p.talk.gestureFor("peak") });
    if (!issue) return false; // the page returns here
    providerCalls++; // the page would issue its solo request now
    return true;
  };
  return { p, work, run, quietOn: () => { quiet = true; work.cancel(); }, quietOff: () => { quiet = false; }, calls: () => providerCalls };
}

test("R2, second return: Quiet on during the charge write, then off during the held refund: nothing is requested, nothing is shown, the count stays", async () => {
  const s = soloPage(10);
  s.p.disk.mode = "hold";
  const r = s.run();
  for (let i = 0; i < 5; i++) await tick();
  s.quietOn();
  s.p.disk.release(); // the charge write is acknowledged; the refund write is now held
  for (let i = 0; i < 5; i++) await tick();
  s.quietOff(); // Quiet off again while the refund is held
  s.p.disk.mode = "ok";
  s.p.disk.release();
  assert.equal(await r, false);
  for (let i = 0; i < 5; i++) await tick();
  assert.equal(s.calls(), 0, "no provider call");
  assert.deepEqual(s.p.requests, []);
  assert.equal(s.p.disk.chat(), 10, "the refund is on disk");
  assert.deepEqual(s.p.lines, [], "work moved on by Quiet shows nothing");
});

test("R2, second return: Quiet on and off again before the charge is acknowledged: the work stays over", async () => {
  const s = soloPage(10);
  s.p.disk.mode = "hold";
  const r = s.run();
  for (let i = 0; i < 5; i++) await tick();
  s.quietOn();
  s.quietOff();
  s.p.disk.mode = "ok";
  s.p.disk.release();
  assert.equal(await r, false);
  assert.equal(s.calls(), 0);
  assert.equal(s.p.disk.chat(), 10);
});

test("R2, second return: a cancel, a clear, the end of a visit, Peak tucked in or a newer turn during the held write: no request, nothing shown, refunded", async () => {
  for (const what of ["cancel", "newer"] as const) {
    const s = soloPage(10);
    s.p.disk.mode = "hold";
    const r = s.run();
    for (let i = 0; i < 5; i++) await tick();
    if (what === "cancel") s.work.cancel(); // cancelTalk (a touch, a clear, the end of a visit) and a tuck of Peak all do this
    else s.work.begin(); // a newer solo turn
    s.p.disk.mode = "ok";
    s.p.disk.release();
    assert.equal(await r, false, what);
    assert.equal(s.calls(), 0, what);
    assert.deepEqual(s.p.lines, [], what);
    assert.equal(s.p.disk.chat(), 10, what);
  }
});

test("R2, second return: away (or Quiet without a cancel) during the write: no request, the charge given back, Peak's gesture", async () => {
  const p = page({ chat: 10 });
  let away = false;
  p.disk.mode = "hold";
  const r = soloTurn(p.q, new SoloWork().begin(), () => away, { gesture: () => p.talk.gestureFor("peak"), notSaved: () => {} });
  for (let i = 0; i < 5; i++) await tick();
  away = true;
  p.disk.mode = "ok";
  p.disk.release();
  assert.equal(await r, false);
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}`), ["peak:gesture"]);
  assert.equal(p.disk.chat(), 10);
});

test("R2, second return: the normal solo turn issues once after the acknowledged charge; a failed write of moved-on work shows nothing", async () => {
  const ok = soloPage(10);
  assert.equal(await ok.run(), true);
  assert.equal(ok.calls(), 1);
  assert.equal(ok.p.disk.chat(), 11);
  const gone = soloPage(10);
  gone.p.disk.mode = "hold";
  const r = gone.run();
  for (let i = 0; i < 5; i++) await tick();
  gone.work.cancel();
  gone.p.disk.mode = "fail";
  gone.p.disk.release(); // the held charge write is acknowledged... then the refund write fails
  assert.equal(await r, false);
  assert.deepEqual(gone.p.lines, []);
  assert.equal(gone.calls(), 0);
});

test("R2, second return, the visit path: Quiet on (a cancel) during the held charge, off during the held refund: no request, no line, refunded", async () => {
  let quiet = false;
  const p = page({ chat: 10, quiet: () => quiet });
  p.disk.mode = "hold";
  const run = p.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  for (let i = 0; i < 5; i++) await tick();
  quiet = true; p.talk.cancel(); // the page's Quiet handler: cancelTalk
  p.disk.release();
  for (let i = 0; i < 5; i++) await tick();
  quiet = false;
  p.disk.mode = "ok";
  p.disk.release();
  await run;
  for (let i = 0; i < 10; i++) await tick();
  assert.deepEqual(p.requests, []);
  assert.deepEqual(p.lines, []);
  assert.equal(p.disk.chat(), 10);
});
