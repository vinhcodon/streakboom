import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DUO_CAP_SCALE, SendIds, chargedRequest, quota } from "./dispatch.ts";
import { Conversation, type Deps, type Line } from "./conversation.ts";
import { AI_CHAT_DAILY_CAP, AI_COOLDOWN_MS, dayKey, defaultData, parse, type PetData } from "./state.ts";
import type { PetId } from "./duo.ts";

// T2d of ADR-0167 (issue 22): the fixtures frozen on the ticket before the change.

/** Local time on the 28th of November 2026 (the fixtures are local calendar dates, as `dayKey` is). */
const at = (h: number, m = 0, s = 0, ms = 0, day = 28) => new Date(2026, 10, day, h, m, s, ms).getTime();

/** The page in miniature: pet data, the clock, a save that writes the JSON (what a restart reads back), and a Conversation whose model goes through the quota. */
function page(opts: { chat?: number; day?: string; now?: number; duo?: boolean; reply?: (pet: PetId) => Promise<string>; quiet?: () => boolean; brain?: boolean } = {}) {
  let now = opts.now ?? at(12);
  let data: PetData = defaultData(now);
  data = { ...data, ai: { ...data.ai, day: opts.day ?? dayKey(now), chat: opts.chat ?? 0 } };
  let stored = JSON.stringify(data);
  const requests: PetId[] = [];
  const q = quota({ get: () => data, set: (d) => { data = d; }, save: () => { stored = JSON.stringify(data); }, now: () => now, duo: opts.duo ?? true });
  const kindOf = (e: unknown) => (e as { kind?: string } | null)?.kind ?? "unknown";
  const deps: Deps = {
    model: (pet) => chargedRequest(q, () => { requests.push(pet); return (opts.reply ?? (async () => "[happy] Fine."))(pet); }, kindOf),
    allow: () => (opts.brain ?? true) && q.gate() === "ok",
    quiet: opts.quiet ?? (() => false),
    sleep: async (ms) => { now += ms; },
    beat: () => 700,
    now: () => now,
  };
  const lines: Line[] = [];
  const talk = new Conversation(deps, (l) => lines.push(l));
  return {
    talk, lines, requests, q,
    data: () => data,
    restart: () => { data = parse(stored, now); },
    setNow: (t: number) => { now = t; },
  };
}

test("the cap is 120 a day with the experiment and 60 without it (ADR-0165)", () => {
  assert.equal(AI_CHAT_DAILY_CAP * DUO_CAP_SCALE, 120);
  const on = page({ chat: 119 });
  assert.equal(on.q.gate(), "ok");
  const on120 = page({ chat: 120 });
  assert.equal(on120.q.gate(), "cap");
  const off59 = page({ chat: 59, duo: false });
  assert.equal(off59.q.gate(), "ok");
  const off60 = page({ chat: 60, duo: false });
  assert.equal(off60.q.gate(), "cap", "with the experiment off the cap stays 60");
});

test("119 used with two pets eligible: one request, the count reaches 120, the second pet makes a gesture (no 121st)", async () => {
  const p = page({ chat: 119 });
  await p.talk.person("how are you both", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.equal(p.data().ai.chat, 120);
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}`), ["peak:say", "paws:gesture"]);
});

test("a request that fails is charged; the pet makes a gesture", async () => {
  const p = page({ chat: 10, reply: async () => { throw { kind: "network" }; } });
  await p.talk.person("hello", ["peak"], ["peak"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.equal(p.data().ai.chat, 11, "the charge made before the request stays");
  assert.deepEqual(p.lines.map((l) => `${l.pet}:${l.act}`), ["peak:gesture"]);
});

test("a reply dropped because Quiet came while it was pending is still charged, and the next pet is not asked", async () => {
  let quiet = false;
  const p = page({ chat: 3, quiet: () => quiet, reply: async () => { quiet = true; return "[happy] late"; } });
  await p.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, ["peak"]);
  assert.equal(p.data().ai.chat, 4);
});

test("a rate limit starts the cooldown: the second pet of the turn makes a gesture with no request, and so does the next turn", async () => {
  const p = page({ chat: 5, reply: async () => { throw { kind: "rate_limit" }; } });
  const t0 = p.data().ai.coolUntil;
  await p.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  assert.deepEqual(p.requests, ["peak"], "one request; the second pet is not asked during the cooldown");
  assert.equal(p.data().ai.chat, 6);
  assert.ok(p.data().ai.coolUntil > t0);
  assert.equal(p.q.gate(), "cooldown");
  await p.talk.person("again", ["peak"], ["peak"]);
  assert.deepEqual(p.requests, ["peak"], "no request while cooling down");
  p.setNow(p.data().ai.coolUntil + 1);
  assert.equal(p.q.gate(), "ok", "the gate opens when the cooldown ends");
  assert.ok(AI_COOLDOWN_MS === 120_000);
});

test("Quiet, group and solo: no request and no charge, a gesture (rows 14a and solo Quiet)", async () => {
  const g = page({ chat: 7, quiet: () => true });
  await g.talk.person("both?", ["peak", "paws"], ["peak", "paws"]);
  const s = page({ chat: 7, quiet: () => true });
  await s.talk.person("just you", ["peak"], ["peak"]);
  for (const p of [g, s]) {
    assert.deepEqual(p.requests, []);
    assert.equal(p.data().ai.chat, 7);
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
  await p.talk.person("@Paws hello", ["paws"], ["peak", "paws"]); // the invitation: one request to Paws
  assert.equal(p.data().ai.chat, 41);
  p.talk.cancel(); // the visit ends: pending work is dropped, nothing is given back
  assert.equal(p.data().ai.chat, 41);
  p.setNow(at(18));
  p.restart(); // the program starts again: what was saved after the charge is read back
  assert.equal(p.data().ai.chat, 41);
  assert.equal(p.q.gate(), "ok");
});

test("rollover: just before midnight the day's count holds; the first gate or charge after it starts a new day and keeps the cooldown (row 25)", async () => {
  const p = page({ chat: 120, now: at(23, 59, 59, 900) });
  assert.equal(p.q.gate(), "cap");
  p.q.rateLimited();
  const cool = p.data().ai.coolUntil;
  p.setNow(at(0, 0, 0, 100, 29));
  assert.equal(p.q.gate(), "cooldown", "the cooldown is kept across midnight");
  p.setNow(cool + 1);
  assert.equal(p.q.gate(), "ok", "the new day's count starts at 0");
  p.q.charge();
  const a = p.data().ai;
  assert.equal(a.day, dayKey(at(0, 0, 0, 100, 29)));
  assert.equal(a.chat, 1);
  assert.equal(a.proactive, 0);
  assert.equal(a.note, 0);
  assert.equal(a.coolUntil, cool);
});

test("a call pending across midnight is charged to the day it was issued on", async () => {
  let release: (s: string) => void = () => {};
  const p = page({ chat: 50, now: at(23, 59, 59, 900), reply: () => new Promise<string>((r) => { release = r; }) });
  const run = p.talk.person("late", ["peak"], ["peak"]);
  await Promise.resolve();
  assert.equal(p.data().ai.chat, 51);
  assert.equal(p.data().ai.day, dayKey(at(23)));
  p.setNow(at(0, 0, 1, 0, 29));
  release("[happy] ok");
  await run;
  assert.equal(p.q.gate(), "ok");
  p.q.charge();
  assert.equal(p.data().ai.chat, 1, "the first charge of the new day starts from 0");
});

test("one send is dispatched once in a generation; a repeat of its mid is dropped; two sends with the same text stay two (row 13)", () => {
  const ids = new SendIds();
  assert.equal(ids.accept("m1", 1), true);
  assert.equal(ids.accept("m1", 1), false, "a duplicate or retried delivery of one send");
  assert.equal(ids.accept("m2", 1), true, "a second send with the same text has its own mid");
  assert.equal(ids.accept("m2", 1), false);
  assert.equal(ids.accept("m1", 2), true, "a new visit generation forgets the old one");
});

test("the page: the box sends a mid, the page drops a repeat, and the canned replies go through the same gate and charge (T2d)", () => {
  const pageSrc = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  const box = readFileSync(new URL("../routes/chatbox/+page.svelte", import.meta.url), "utf8");
  assert.ok(/act\(\{ type: "send", text, mid: /.test(box), "the box gives every deliberate send its own mid");
  assert.ok(pageSrc.includes("sendIds.accept(mid, visitG)"), "the page dispatches one mid once in a generation");
  assert.ok(/duo-visit-ended[\s\S]{0,200}visitG\+\+/.test(pageSrc), "the end of a visit moves the generation");
  const model = pageSrc.slice(pageSrc.indexOf("const talk = new Conversation("), pageSrc.indexOf("const talk = new Conversation(") + 2400);
  assert.ok(model.indexOf("chargedRequest(") >= 0 && model.indexOf("chargedRequest(") < model.indexOf("if (duoFake)"), "a canned reply is charged like a real one");
  assert.ok(/allow: \(\) => duoQuota\.gate\(\) === "ok"/.test(model), "the canned replies do not skip the gate");
  assert.ok(!pageSrc.includes('duoFake ? "ok"'), "no gate is bypassed for canned replies");
});
