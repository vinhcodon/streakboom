import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ENTRY_DEADLINE_MS, Entries, Restorer, RestoreInbox, enterVisit, entryTurn, type EntryHost, type EntryPage } from "./entry.ts";
import { SendQueue } from "./send-queue.ts";

// T2a of ADR-0167 (issue 23): the fixtures frozen on the ticket. The page's whole continuation is entryTurn (lib/entry.ts); these tests drive it with a host
// whose native effects can be held, acknowledged, refused or never answered, a fake clock for the deadline, the real SendQueue and the real Restorer.

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const ticks = async (n = 8) => { for (let i = 0; i < n; i++) await tick(); };

/** A promise the test settles. */
function held<T>() {
  let resolve: (v: T) => void = () => {};
  let reject: (e: unknown) => void = () => {};
  const p = new Promise<T>((a, b) => { resolve = a; reject = b; });
  return { p, resolve, reject };
}

/** The native side of an entry, controlled by the test, plus a fake clock. */
function nativeSide() {
  let now = 0;
  const timers: { at: number; r: () => void }[] = [];
  const save = held<boolean>();
  const show = held<boolean>();
  let composing = false;
  let endComposition: (() => void)[] = [];
  const calls: string[] = [];
  const log: string[] = [];
  let quiet = false;
  const host: EntryHost = {
    composing: () => composing,
    compositionEnded: () => new Promise<void>((r) => { if (!composing) r(); else endComposition.push(r); }),
    saveMembership: () => { calls.push("save"); return save.p; },
    undoMembership: async () => { calls.push("undo"); },
    showBox: () => { calls.push("show"); return show.p; },
    sleep: (ms) => new Promise<void>((r) => timers.push({ at: now + ms, r })),
    quiet: () => quiet,
    log: (l) => log.push(l),
  };
  return {
    host, save, show, calls, log,
    compose: (on: boolean) => { composing = on; if (!on) { const w = endComposition; endComposition = []; for (const r of w) r(); } },
    advance: async (ms: number) => { now += ms; for (const t of timers.filter((x) => x.at <= now)) t.r(); await ticks(); },
    setQuiet: (q: boolean) => { quiet = q; },
  };
}

/** The page around an entry, as entryTurn sees it: a talk with the invitation's row, the real SendQueue holding what waits, the real Restorer, a box inbox. */
function pageSide(queued: string[] = []) {
  const rows = new Map<number, string>([[7, "@Paws hello"]]);
  const waiting = new Set<number>();
  const box = new RestoreInbox();
  let draft = "";
  const restorer = new Restorer(async (id, text) => { draft = box.apply(draft, id, text).draft; restorer.acked(id); });
  const dispatched: string[] = [];
  const sq = new SendQueue(async (t) => { dispatched.push(t); await new Promise<void>(() => {}); }, async () => {}); // the first dispatch is the invitation, held
  sq.send("@Paws hello", 0);
  for (const q of queued) sq.send(q, 0);
  const said: string[] = [];
  const pending: boolean[] = [];
  let deferred: string | null = null;
  const done: string[] = [];
  let quiet = false;
  const page: EntryPage = {
    inviteRow: (t) => ([...rows].find(([, x]) => x === t)?.[0] ?? null),
    markWaiting: (id, on) => { if (on) waiting.add(id); else waiting.delete(id); },
    removeRow: (id) => { rows.delete(id); },
    takeWaiting: () => sq.takeAll(),
    giveBack: (texts) => void restorer.give(texts),
    sayFailed: async () => { said.push("the call changed nothing"); },
    quiet: () => quiet,
    setPending: (on) => pending.push(on),
    takeDeferred: () => { const d = deferred; deferred = null; return d; },
    doDeferred: (press) => done.push(press),
    log: () => {},
  };
  return {
    page, rows, waiting, said, pending, done, dispatched,
    draft: () => draft,
    defer: (p: string) => { deferred = p; },
    setQuiet: (q: boolean) => { quiet = q; },
    queueLeft: () => sq.waiting().map((w) => w.text),
  };
}

test("the deadline is 5000 ms, owned by the page (engineering parameter frozen on issue 23)", () => {
  assert.equal(ENTRY_DEADLINE_MS, 5000);
});

test("commit: membership saved then box shown, and box shown then membership saved, both commit; the row waits until then and nothing is given back", async () => {
  for (const order of ["save-first", "show-first"] as const) {
    const n = nativeSide();
    const pg = pageSide(["B"]);
    const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
    await ticks();
    assert.ok(pg.waiting.has(7), "the invitation's row shows as waiting");
    if (order === "save-first") { n.save.resolve(true); await ticks(); n.show.resolve(true); } else { n.show.resolve(true); await ticks(); n.save.resolve(true); }
    assert.equal(await run, "committed", order);
    assert.equal(pg.waiting.size, 0);
    assert.ok(pg.rows.has(7), "the row stays in the history");
    assert.equal(pg.draft(), "", "nothing given back");
    assert.deepEqual(pg.queueLeft(), ["B"], "B still waits, to go FIFO after the commit (row 7)");
    assert.deepEqual(pg.pending, [true, false]);
    assert.ok(!n.calls.includes("undo"));
  }
});

test("nothing is shown or saved while a composition is active before the effects; then the entry goes on (note 1, row 11)", async () => {
  const n = nativeSide();
  const pg = pageSide();
  n.compose(true);
  const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
  await ticks();
  assert.deepEqual(n.calls, [], "no native effect while composing");
  await n.advance(ENTRY_DEADLINE_MS * 3);
  assert.deepEqual(n.calls, [], "the deadline does not run before the effects start");
  n.compose(false);
  await ticks();
  assert.deepEqual(n.calls.sort(), ["save", "show"]);
  n.save.resolve(true); n.show.resolve(true);
  assert.equal(await run, "committed");
});

test("an entry closed while it waits for a composition ends and never resumes", async () => {
  const n = nativeSide();
  const pg = pageSide(["B"]);
  const entries = new Entries();
  n.compose(true);
  const run = entryTurn(entries, "@Paws hello", n.host, pg.page);
  await ticks();
  entries.end(); // the box closed
  n.compose(false);
  assert.equal(await run, "closed");
  await ticks();
  assert.deepEqual(n.calls, [], "no membership, no show, ever");
  assert.equal(pg.draft(), "@Paws hello\nB", "the invitation then B, once");
  assert.ok(!pg.rows.has(7));
});

test("a composition that starts after both acknowledgements defers the commit, with no deadline", async () => {
  const n = nativeSide();
  const pg = pageSide();
  const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
  await ticks();
  n.compose(true);
  n.save.resolve(true); n.show.resolve(true);
  await ticks();
  await n.advance(ENTRY_DEADLINE_MS * 2);
  let settled = false;
  void run.then(() => { settled = true; });
  await ticks();
  assert.equal(settled, false, "the commit waits for the composition, past the deadline");
  n.compose(false);
  assert.equal(await run, "committed");
});

test("the deadline: acknowledgements at 4999 ms commit; none by 5000 ms fails, rolls back and gives the text back once", async () => {
  const a = nativeSide();
  const pa = pageSide();
  const ra = entryTurn(new Entries(), "@Paws hello", a.host, pa.page);
  await a.advance(4999);
  a.save.resolve(true); a.show.resolve(true);
  assert.equal(await ra, "committed");

  const b = nativeSide();
  const pb = pageSide(["B", "C"]);
  const rb = entryTurn(new Entries(), "@Paws hello", b.host, pb.page);
  await b.advance(4999);
  b.show.resolve(true); // the box showed, the membership never answered
  await b.advance(1);
  assert.equal(await rb, "failed");
  assert.equal(pb.draft(), "@Paws hello\nB\nC", "the invitation, B and C, in order, once");
  assert.deepEqual(pb.said, ["the call changed nothing"], "the existing line, no new text");
  assert.ok(!pb.rows.has(7));
  b.save.resolve(true); // a late success
  await ticks();
  assert.deepEqual(b.calls.filter((c) => c === "undo"), ["undo"], "a late success is undone, once");
});

test("a refused membership fails at once: no wait for the deadline, nothing kept, the text given back; a box that cannot show fails and undoes the save", async () => {
  const n = nativeSide();
  const pg = pageSide(["B"]);
  const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
  n.save.resolve(false);
  assert.equal(await run, "failed");
  assert.equal(pg.draft(), "@Paws hello\nB");
  assert.ok(!n.calls.includes("undo"), "nothing to undo");

  const m = nativeSide();
  const pm = pageSide();
  const rm = entryTurn(new Entries(), "@Paws hello", m.host, pm.page);
  m.save.resolve(true);
  await ticks();
  m.show.resolve(false);
  assert.equal(await rm, "failed");
  assert.deepEqual(m.calls.filter((c) => c === "undo"), ["undo"]);
});

test("a close during the acknowledgements ends the entry at that instant: membership undone (also when saved later), text back once, a deferred press dropped", async () => {
  const n = nativeSide();
  const pg = pageSide(["B"]);
  const entries = new Entries();
  pg.defer("double click");
  const run = entryTurn(entries, "@Paws hello", n.host, pg.page);
  await ticks();
  n.show.resolve(true);
  await ticks();
  entries.end(); // Esc on the box, still fading
  assert.equal(await run, "closed");
  assert.deepEqual(pg.done, [], "the press made before the close is dropped (decision 2)");
  assert.deepEqual(pg.said, [], "a close says nothing");
  assert.equal(pg.draft(), "@Paws hello\nB");
  n.save.resolve(true); // the save lands after the close
  await ticks();
  assert.deepEqual(n.calls.filter((c) => c === "undo"), ["undo"]);
  assert.equal(entries.busy(), false);
});

test("a deferred press waits for the entry and is done once after a commit or a failure (row 28a)", async () => {
  for (const ok of [true, false]) {
    const n = nativeSide();
    const pg = pageSide();
    pg.defer("shortcut");
    const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
    await ticks();
    assert.deepEqual(pg.done, [], "not before the outcome");
    n.save.resolve(ok); n.show.resolve(true);
    await run;
    assert.deepEqual(pg.done, ["shortcut"]);
  }
});

test("Quiet during the entry: it commits silently, no failure line, the waiting messages back; Quiet on then off before the commit commits normally (row 10)", async () => {
  const n = nativeSide();
  const pg = pageSide(["B", "C"]);
  const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
  await ticks();
  n.setQuiet(true); pg.setQuiet(true);
  n.save.resolve(true); n.show.resolve(true);
  assert.equal(await run, "committed-quiet");
  assert.equal(pg.draft(), "B\nC", "the other unsent messages go back; the invitation stays as its row");
  assert.ok(pg.rows.has(7));
  assert.deepEqual(pg.said, []);
  assert.ok(!n.calls.includes("undo"), "the membership is kept");

  const m = nativeSide();
  const pm = pageSide();
  const rm = entryTurn(new Entries(), "@Paws hello", m.host, pm.page);
  await ticks();
  m.setQuiet(true); await ticks(); m.setQuiet(false);
  m.save.resolve(true); m.show.resolve(true);
  assert.equal(await rm, "committed");
});

test("Quiet when an entry fails: the text goes back, no line is said", async () => {
  const n = nativeSide();
  const pg = pageSide();
  pg.setQuiet(true);
  const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
  n.save.resolve(false);
  assert.equal(await run, "failed");
  assert.deepEqual(pg.said, []);
  assert.equal(pg.draft(), "@Paws hello");
});

test("row 23: a late membership of an old entry does not undo the newer visit; an invitation after a closed one enters with a new g (row 22)", async () => {
  const entries = new Entries();
  const old = nativeSide();
  const po = pageSide();
  const ro = entryTurn(entries, "@Paws hello", old.host, po.page);
  await ticks();
  entries.end();
  assert.equal(await ro, "closed");
  const fresh = nativeSide();
  const pf = pageSide();
  const rf = entryTurn(entries, "@Paws hello", fresh.host, pf.page);
  await ticks();
  fresh.save.resolve(true); fresh.show.resolve(true);
  assert.equal(await rf, "committed");
  old.save.resolve(true); // the old entry's save lands now
  await ticks();
  assert.ok(!old.calls.includes("undo"), "the membership now belongs to the newer visit: it is not undone");
  assert.equal(entries.generation, 2);
});

test("duplicate and late acknowledgements after a commit change nothing", async () => {
  const n = nativeSide();
  const pg = pageSide();
  const run = entryTurn(new Entries(), "@Paws hello", n.host, pg.page);
  n.save.resolve(true); n.show.resolve(true);
  assert.equal(await run, "committed");
  n.save.resolve(false); n.show.resolve(false); // a second answer of either: ignored (a promise settles once; the machine records the first)
  await ticks();
  assert.ok(!n.calls.includes("undo"));
  assert.deepEqual(pg.said, []);
});

test("enterVisit alone: an entry ended before it starts makes no native effect", async () => {
  const entries = new Entries();
  const n = nativeSide();
  const t = entries.begin();
  entries.end();
  assert.equal(await enterVisit(t, n.host), "closed");
  assert.deepEqual(n.calls, []);
});

// ---------------------------------------------------------------- lossless returns (note 2)

test("a return is applied once per id, acknowledged, retried with its id when lost, and never cut at 300 characters", async () => {
  const box = new RestoreInbox();
  let draft = "typed";
  let online = false;
  const sent: string[] = [];
  const r = new Restorer(async (id, text) => {
    sent.push(id);
    if (!online) throw new Error("the box is not there");
    const a = box.apply(draft, id, text);
    draft = a.draft;
    r.acked(id);
  });
  const long = "x".repeat(450);
  const id = r.give(["first", long])!;
  await ticks();
  assert.equal(draft, "typed", "lost: nothing applied");
  assert.equal(r.waiting().length, 1, "kept for a retry");
  online = true;
  r.retry();
  await ticks();
  assert.equal(draft, `typed\nfirst\n${long}`, "the whole text, after the existing draft, beyond 300 characters");
  assert.equal(r.waiting().length, 0);
  assert.deepEqual(sent, [id, id], "the retry used the same id");
  assert.deepEqual(box.apply(draft, id, "first"), { draft, applied: false }, "a second delivery of the same id changes nothing");
  assert.equal(r.give([]), null, "nothing to give, no return");
});

// ---------------------------------------------------------------- the page uses this continuation

test("the page: invitations in the chat visit enter through entryTurn; nothing is dispatched unless committed; the box and the close feed the entry", () => {
  const src = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  const box = readFileSync(new URL("../routes/chatbox/+page.svelte", import.meta.url), "utf8");
  assert.ok(src.includes("return entryTurn(entries, text, entryHost(text), {"), "the page's continuation is entryTurn");
  assert.equal((src.match(/const outcome = await enterChatVisit\(text\);\s*await refreshPawsOut\(\);\s*if \(outcome !== "committed"\) return true;/g) ?? []).length, 2,
    "the mention and the typed command both stop on every outcome but a commit");
  const mention = src.slice(src.indexOf('if (p === "paws" && pawsMode === "chat") {'), src.indexOf('if (p === "paws" && pawsMode === "chat") {') + 700);
  assert.ok(mention.indexOf("enterChatVisit(text)") < mention.indexOf("called.push(p)"), "the held words are dispatched only after the commit");
  assert.ok(/listen\("chatbox-closed"[\s\S]{0,300}entries\.end\(\)/.test(src), "an explicit close ends the entry at once");
  assert.ok(/const back = entries\.busy\(\) \? \[\] : sendQueue\.takeAll\(\);/.test(src), "during an entry the end of a visit leaves the returns to the entry");
  assert.ok(src.includes('if (entries.pending()) { deferredOpen = "double click";'), "a double click during an entry waits");
  assert.ok(/listen<string>\("chatbox-restored", \(e\) => \{ restorer\.acked\(e\.payload\);/.test(src) && /chatbox-ready[\s\S]{0,80}restorer\.retry\(\)/.test(src), "returns are acknowledged and retried");
  assert.ok(box.includes("restores.apply(draft, e.payload.id, e.payload.text)") && box.includes('emitTo("main", "chatbox-restored", e.payload.id)'), "the box applies a return once and acknowledges it");
  assert.ok(box.includes('emitTo("main", "chatbox-composing", true)') && box.includes('emitTo("main", "chatbox-composing", false)'), "the box tells its composition");
  assert.ok(!src.includes('emitTo("chatbox", "chatbox-restore", back'), "no return without an id is left");
});
