// Run with: node --test src/lib/send-queue.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { SendQueue } from "./send-queue.ts";

/** A held promise the test releases by hand. */
function held() { let release: () => void = () => {}; const p = new Promise<void>((r) => { release = r; }); return { p, release }; }
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

test("Peak alone: A uses the last call while B and C wait; B and C each get the cap answer exactly once, in order; nothing stalls (#19)", async () => {
  let left = 1; // calls left today
  const answers: string[] = [];
  const a = held();
  const dispatch = async (text: string) => {
    if (left <= 0) { answers.push(`${text}:cap`); return; } // the cap line: an early return, no busy, no model call
    left--;
    if (text === "A") await a.p; // A's model call is in flight
    answers.push(`${text}:ok`);
  };
  const q = new SendQueue(dispatch, async () => {});
  assert.equal(q.send("A", 1), "now");
  assert.equal(q.send("B", 2), "queued");
  assert.equal(q.send("C", 3), "queued");
  assert.deepEqual(q.waiting().map((w) => w.text), ["B", "C"]);
  a.release();
  await flush(); await flush(); await flush();
  assert.deepEqual(answers, ["A:ok", "B:cap", "C:cap"]);
  assert.equal(q.waiting().length, 0);
});

test("a command handled at once and a message sent during the hand-over keep their order (#19)", async () => {
  const log: string[] = [];
  const a = held();
  let q: SendQueue;
  const dispatch = async (text: string) => {
    log.push(`start ${text}`);
    if (text === "A") await a.p;
    if (text === "/in paws") { q.send("D", 9); return; } // an immediate command; the person sends D while the queue moves on
    log.push(`end ${text}`);
  };
  q = new SendQueue(dispatch, async () => {});
  q.send("A", 1); q.send("/in paws", 2); q.send("C", 3);
  a.release();
  for (let i = 0; i < 6; i++) await flush();
  assert.deepEqual(log.filter((x) => x.startsWith("start")), ["start A", "start /in paws", "start C", "start D"]);
});

test("a group answer still being presented: B waits for it, A's answers stay, then B and C go once each in order (#19)", async () => {
  const shown: string[] = []; // the rows the person actually sees
  const pending: string[] = []; // answers written, not yet presented
  const pres = held();
  const dispatch = async (text: string) => { pending.push(`${text}: Paws`, `${text}: Peak`); }; // the model answers at once, the presentation lags
  const presented = async () => { if (pending[0]?.startsWith("A")) await pres.p; shown.push(...pending.splice(0)); };
  const q = new SendQueue(dispatch, presented);
  q.send("A", 1); q.send("B", 2); q.send("C", 3);
  await flush(); await flush();
  assert.deepEqual(shown, [], "A's answers are held");
  assert.deepEqual(q.waiting().map((w) => w.text), ["B", "C"], "B has not replaced them");
  pres.release();
  for (let i = 0; i < 6; i++) await flush();
  assert.deepEqual(shown, ["A: Paws", "A: Peak", "B: Paws", "B: Peak", "C: Paws", "C: Peak"]);
});

test("the visit dismissed while messages wait: they are given back, not sent (#19)", async () => {
  const sent: string[] = [];
  const a = held();
  const q = new SendQueue(async (t) => { sent.push(t); if (t === "A") await a.p; }, async () => {});
  q.send("A", 1); q.send("@Paws hi", 2); q.send("C", 3);
  assert.deepEqual(q.takeAll(), ["@Paws hi", "C"]);
  a.release();
  for (let i = 0; i < 4; i++) await flush();
  assert.deepEqual(sent, ["A"], "the queued invite is not sent after the dismissal");
});
