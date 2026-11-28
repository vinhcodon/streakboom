import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ENTRY_DEADLINE_MS, Entries, Membership, Restorer, RestoreInbox, entryTurn, nativeEntryHost, tuckPaws, type EntryPage, type MemberAnswer } from "./entry.ts";
import { SendQueue } from "./send-queue.ts";

// T2a of ADR-0167 (issue 23), with the return of comment 7235779508. The page's whole continuation is entryTurn, its host is nativeEntryHost and its
// membership is the Membership chain (lib/entry.ts; the page passes only its native calls). These tests drive exactly those, with a native side whose
// every call can be held, answered late, refused or never answered, a fake clock, the real SendQueue, the real Restorer and the box's RestoreInbox.

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const ticks = async (n = 12) => { for (let i = 0; i < n; i++) await tick(); };

/** The program's native side, as the page's calls reach it: a membership on disk, a box, a clock; each call recorded and controllable. */
function program() {
  let now = 0;
  const timers: { at: number; r: () => void }[] = [];
  const sleep = (ms: number) => new Promise<void>((r) => timers.push({ at: now + ms, r }));
  let member = false;
  let boxVisible = false;
  let entryGen = 0; // what the native side was told (duo_entry_gen)
  let composing = false;
  let endComposition: (() => void)[] = [];
  const calls: string[] = [];
  const log: string[] = [];
  // the native membership answers: "auto" answers at once with the truth; "hold" keeps each answer for the test; "error" refuses (a write that fails)
  let memberMode: "auto" | "hold" | "error" = "auto";
  const heldMember: { out: boolean; done: (a: MemberAnswer) => void }[] = [];
  const native = (out: boolean): Promise<MemberAnswer> => {
    calls.push(out ? "join" : "leave");
    if (memberMode === "error") return Promise.resolve("error");
    if (memberMode === "hold") return new Promise<MemberAnswer>((r) => heldMember.push({ out, done: r }));
    if (member === out) return Promise.resolve("unchanged");
    member = out;
    return Promise.resolve("changed");
  };
  let queryMode: "auto" | "hold" = "auto";
  const heldQueries: ((v: boolean) => void)[] = [];
  const membership = new Membership(native, sleep, (l) => log.push(l));
  const showQueue: number[] = []; // native show threads not run yet
  // the native focus, as in the program: the command is accepted now, its worker does the effect later and reports it; the worker checks the generation and
  // the arming at that moment (EntryGate.guarded)
  let armed = 0;
  let focused = false;
  let focusMode: "auto" | "hold" = "auto";
  let focusBroken = false; // the window call itself fails
  const focusWorkers: { g: number; done: (ok: boolean) => void }[] = [];
  const runWorker = (w: { g: number; done: (ok: boolean) => void }) => {
    const ok = !focusBroken && w.g !== 0 && w.g === entryGen && armed === w.g;
    if (ok) { boxVisible = true; focused = true; } else log.push(`native: focus of g=${w.g} refused`);
    w.done(ok);
  };
  let quietFlag = false;
  const base = {
    composing: () => composing,
    compositionEnded: () => new Promise<void>((r) => { if (!composing) r(); else endComposition.push(r); }),
    showing: () => { calls.push("query"); if (queryMode === "hold") return new Promise<boolean>((r) => heldQueries.push(r)); return Promise.resolve(boxVisible); },
    show: (g: number) => { calls.push(`show g=${g}`); showQueue.push(g); },
    arm: async (g: number) => { calls.push(`arm g=${g}`); if (entryGen === g) armed = g; },
    focus: (g: number) => new Promise<boolean>((done) => {
      calls.push(`focus g=${g}`);
      const w = { g, done };
      if (focusMode === "auto") setTimeout(() => runWorker(w), 0); else focusWorkers.push(w);
    }),
    membership,
    sleep,
    quiet: () => quietFlag,
    log: (l: string) => log.push(l),
  };
  return {
    membership, calls, log,
    get member() { return member; },
    get boxVisible() { return boxVisible; }, set boxVisible(v: boolean) { boxVisible = v; },
    setGen: (g: number) => { entryGen = g; if (g === 0) armed = 0; },
    endGen: (g: number) => { if (entryGen === g) { entryGen = 0; armed = 0; } },
    /** the page's disarm (Quiet on, a composition) */
    disarm: () => { armed = 0; },
    set focusMode(m: "auto" | "hold") { focusMode = m; },
    set focusBroken(b: boolean) { focusBroken = b; },
    releaseFocus: () => { const w = focusWorkers.shift(); if (!w) throw new Error("no held focus worker"); runWorker(w); },
    heldFocusCount: () => focusWorkers.length,
    /** the native show threads run now: each shows the box only if its generation is still the entry in progress (duo_entry_show) */
    runShows: () => { while (showQueue.length) { const g = showQueue.shift()!; if (g === entryGen) boxVisible = true; else log.push(`native: show of g=${g} refused`); } },
    get focused() { return focused; },
    set memberMode(m: "auto" | "hold" | "error") { memberMode = m; },
    releaseMember: () => {
      const h = heldMember.shift();
      if (!h) throw new Error("no held membership call");
      if (member === h.out) h.done("unchanged"); else { member = h.out; h.done("changed"); }
    },
    heldMemberCount: () => heldMember.length,
    set queryMode(m: "auto" | "hold") { queryMode = m; },
    releaseQuery: (v: boolean) => { const r = heldQueries.shift(); if (!r) throw new Error("no held query"); r(v); },
    compose: (on: boolean) => { composing = on; if (!on) { const w = endComposition; endComposition = []; for (const r of w) r(); } },
    advance: async (ms: number) => { now += ms; for (const t of timers.filter((x) => x.at <= now)) { timers.splice(timers.indexOf(t), 1); t.r(); } await ticks(); },
    quiet: () => quietFlag,
    setQuiet: (q: boolean) => { quietFlag = q; },
    host: (o: { refuse?: boolean } = {}) => nativeEntryHost({ ...base, ...o }),
  };
}

/** The page around an entry: a talk with the invitation's row, the real SendQueue (the invitation's dispatch held), the real Restorer into a box inbox. */
function pageSide(prog: ReturnType<typeof program>, queued: string[] = []) {
  const rows = new Map<number, string>([[7, "@Paws hello"]]);
  const waiting = new Set<number>();
  const box = new RestoreInbox();
  let draft = "";
  const restorer = new Restorer(async (id, text) => { draft = box.apply(draft, id, text).draft; restorer.acked(id); });
  const sq = new SendQueue(async () => { await new Promise<void>(() => {}); }, async () => {});
  sq.send("@Paws hello", 0);
  for (const q of queued) sq.send(q, 0);
  const said: string[] = [];
  let deferred: string | null = null;
  const done: string[] = [];
  const stuck: number[] = [];
  const page: EntryPage = {
    inviteRow: (t) => ([...rows].find(([, x]) => x === t)?.[0] ?? null),
    markWaiting: (id, on) => { if (on) waiting.add(id); else waiting.delete(id); },
    removeRow: (id) => { rows.delete(id); },
    takeWaiting: () => sq.takeAll(),
    giveBack: (texts) => void restorer.give(texts),
    sayFailed: async () => { said.push("the call changed nothing"); },
    quiet: () => prog.quiet(),
    setGen: (g) => prog.setGen(g),
    endGen: (g) => prog.endGen(g),
    takeDeferred: () => { const d = deferred; deferred = null; return d; },
    doDeferred: (press) => done.push(press),
    memberStuck: () => stuck.push(1),
    log: () => {},
  };
  return { page, rows, waiting, said, done, stuck, draft: () => draft, defer: (p: string) => { deferred = p; }, queueLeft: () => sq.waiting().map((w) => w.text) };
}

test("the deadline is 5000 ms, owned by the page (engineering parameter frozen on issue 23)", () => assert.equal(ENTRY_DEADLINE_MS, 5000));

test("commit with the box already shown: the join, then committed; the row stays; B still waits for after the commit", async () => {
  const pr = program();
  pr.boxVisible = true;
  const pg = pageSide(pr, ["B"]);
  const r = await entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  assert.equal(r.outcome, "committed");
  assert.equal(pr.member, true);
  assert.ok(pg.rows.has(7));
  assert.equal(pg.draft(), "");
  assert.deepEqual(pg.queueLeft(), ["B"]);
});

test("either acknowledgement order commits: the join answered before the box shows, and the box shown before the join answers", async () => {
  for (const order of ["join-first", "show-first"] as const) {
    const pr = program();
    pr.memberMode = "hold";
    const pg = pageSide(pr);
    const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
    await ticks();
    if (order === "join-first") { pr.releaseMember(); await ticks(); pr.runShows(); await pr.advance(100); }
    else { pr.runShows(); await pr.advance(100); pr.releaseMember(); }
    assert.equal((await run).outcome, "committed", order);
    assert.equal(pr.member, true);
  }
});

test("R1: the box query held, the entry closed, the old query answers 'not showing': no show is asked for the old entry", async () => {
  const pr = program();
  pr.queryMode = "hold";
  const entries = new Entries();
  const pg = pageSide(pr);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  entries.end();
  const r = await run;
  assert.equal(r.outcome, "closed");
  pr.releaseQuery(false);
  await ticks();
  pr.runShows();
  assert.ok(!pr.calls.some((c) => c.startsWith("show")), "no show was asked after the close");
  assert.equal(pr.boxVisible, false);
  await pr.membership.idle();
  assert.equal(pr.member, false, "the closed entry's join was undone in its step");
});

test("R1: a native show asked by an entry that then ended is refused by the native side when its thread runs", async () => {
  const pr = program();
  pr.memberMode = "hold";
  const entries = new Entries();
  const pg = pageSide(pr);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  assert.ok(pr.calls.includes("show g=1"));
  entries.end(); pg.page.setGen(0); // the page's endEntry tells the native side at once
  pr.runShows();
  assert.equal(pr.boxVisible, false);
  assert.ok(pr.log.includes("native: show of g=1 refused"));
  pr.memberMode = "auto"; // the undo that follows answers at once
  pr.releaseMember();
  await run;
  await pr.membership.idle();
  assert.equal(pr.member, false, "the late join was undone in its own step");
});

test("R1: a composition that starts during an intermediate await stops the show until it ends", async () => {
  const pr = program();
  pr.queryMode = "hold";
  const pg = pageSide(pr);
  const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  await ticks();
  pr.compose(true);
  pr.queryMode = "auto"; // the later polls answer at once
  pr.releaseQuery(false);
  await ticks();
  assert.ok(!pr.calls.some((c) => c.startsWith("show")), "no show while composing");
  pr.compose(false);
  await ticks();
  assert.ok(pr.calls.includes("show g=1"));
  pr.runShows(); await pr.advance(100);
  assert.equal((await run).outcome, "committed");
});

test("R1: a composition active when the join's turn comes holds the native join until it ends", async () => {
  const pr = program();
  pr.boxVisible = true;
  const entries = new Entries();
  const pg = pageSide(pr);
  // an earlier membership step holds the chain; meanwhile a composition starts
  pr.memberMode = "hold";
  const blocker = pr.membership.leave(0);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  pr.compose(true);
  pr.releaseMember(); // the blocker ends; the entry's join now has its turn, with a composition active
  await blocker;
  await ticks();
  assert.equal(pr.calls.filter((c) => c === "join").length, 0, "no native join while composing");
  pr.memberMode = "auto";
  pr.compose(false);
  assert.equal((await run).outcome, "committed");
  assert.equal(pr.member, true);
});

test("nothing is shown or joined while composing before the effects; the deadline does not run then; an entry closed there never resumes", async () => {
  const pr = program();
  pr.compose(true);
  const entries = new Entries();
  const pg = pageSide(pr, ["B"]);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await pr.advance(ENTRY_DEADLINE_MS * 3);
  assert.deepEqual(pr.calls, []);
  entries.end();
  pr.compose(false);
  assert.equal((await run).outcome, "closed");
  await ticks();
  assert.deepEqual(pr.calls, []);
  assert.equal(pg.draft(), "@Paws hello\nB");
});

test("R2: an old entry closed with its join pending, a newer entry that FAILS, then the old join answers: no ghost member", async () => {
  const pr = program();
  pr.memberMode = "hold";
  const entries = new Entries();
  const p1 = pageSide(pr);
  const r1 = entryTurn(entries, "@Paws hello", pr.host(), p1.page);
  await ticks();
  entries.end();
  const p2 = pageSide(pr);
  const r2 = entryTurn(entries, "@Paws hello", pr.host({ refuse: true }), p2.page);
  assert.equal((await r2).outcome, "failed");
  pr.releaseMember(); // the OLD join answers now and is undone in the same step of the chain
  pr.memberMode = "auto";
  await ticks();
  await pr.membership.idle();
  await r1;
  assert.equal(pr.member, false, "no member without a visit");
  assert.deepEqual(pr.calls.filter((c) => c === "join" || c === "leave"), ["join", "leave"]);
});

test("R2: an old entry's undo held; a newer entry's join waits behind it in the chain, so the old undo never removes the newer member", async () => {
  const pr = program();
  const entries = new Entries();
  const p1 = pageSide(pr);
  const r1 = entryTurn(entries, "@Paws hello", pr.host(), p1.page); // its box never shows
  await ticks();
  assert.equal(pr.member, true);
  pr.memberMode = "hold";
  await pr.advance(ENTRY_DEADLINE_MS);
  await ticks();
  assert.equal(pr.heldMemberCount(), 1, "the old undo is in flight");
  const p2 = pageSide(pr);
  pr.boxVisible = true;
  const r2 = entryTurn(entries, "@Paws hello", pr.host(), p2.page);
  await ticks();
  assert.equal(pr.heldMemberCount(), 1, "the newer join has not run: it waits behind the old undo");
  pr.releaseMember(); // the old undo
  await ticks();
  pr.releaseMember(); // then the newer join
  assert.equal((await r1).outcome, "failed");
  assert.equal((await r2).outcome, "committed");
  assert.equal(pr.member, true, "the newer member stays");
});

test("R2: a refused undo is retried three times and then reported (stuck), never assumed done", async () => {
  const pr = program();
  const pg = pageSide(pr);
  const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page); // its box never shows
  await ticks();
  assert.equal(pr.member, true);
  pr.memberMode = "error";
  await pr.advance(ENTRY_DEADLINE_MS);
  for (let i = 0; i < 4; i++) await pr.advance(300);
  const r = await run;
  assert.equal(r.outcome, "failed");
  assert.equal(r.stuck, true);
  assert.deepEqual(pg.stuck, [1], "the page is told and shows the presence as the disk has it");
  assert.equal(pr.calls.filter((c) => c === "leave").length, 3);
});

test("R4 at the boundary: a join the native side refuses (its write failed) is not saved: no commit, the text back once, the existing line", async () => {
  const pr = program();
  pr.memberMode = "error";
  pr.boxVisible = true;
  const pg = pageSide(pr, ["B"]);
  const r = await entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  assert.equal(r.outcome, "failed");
  assert.equal(pr.member, false);
  assert.equal(pg.draft(), "@Paws hello\nB");
  assert.deepEqual(pg.said, ["the call changed nothing"]);
});

test("the deadline: answers at 4999 ms commit; a join never answered fails at 5000 ms, and its late answer is undone in the chain", async () => {
  const a = program();
  a.memberMode = "hold";
  const pa = pageSide(a);
  const ra = entryTurn(new Entries(), "@Paws hello", a.host(), pa.page);
  await ticks();
  a.runShows();
  await a.advance(4899);
  a.releaseMember();
  assert.equal((await ra).outcome, "committed");

  const b = program();
  b.memberMode = "hold";
  const pb = pageSide(b, ["B", "C"]);
  const rb = entryTurn(new Entries(), "@Paws hello", b.host(), pb.page);
  await ticks();
  b.runShows();
  await b.advance(ENTRY_DEADLINE_MS);
  await b.advance(ENTRY_DEADLINE_MS); // the rollback waits one more deadline for the join's answer, then reports it as not known
  const r = await rb;
  assert.equal(r.outcome, "failed");
  assert.equal(r.stuck, true);
  assert.equal(pb.draft(), "@Paws hello\nB\nC");
  b.releaseMember();
  b.memberMode = "auto";
  await ticks();
  await b.membership.idle();
  assert.equal(b.member, false);
});

test("a close during the acknowledgements: closed at once, the join undone, the text back once, no line, a deferred press dropped", async () => {
  const pr = program();
  pr.memberMode = "hold";
  const entries = new Entries();
  const pg = pageSide(pr, ["B"]);
  pg.defer("double click");
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  entries.end();
  pr.releaseMember();
  pr.memberMode = "auto";
  const r = await run;
  assert.equal(r.outcome, "closed");
  await pr.membership.idle();
  assert.equal(pr.member, false);
  assert.deepEqual(pg.done, []);
  assert.deepEqual(pg.said, []);
  assert.equal(pg.draft(), "@Paws hello\nB");
});

test("a deferred press waits and is done once after a commit or a failure (row 28a)", async () => {
  for (const ok of [true, false]) {
    const pr = program();
    pr.boxVisible = true;
    if (!ok) pr.memberMode = "error";
    const pg = pageSide(pr);
    pg.defer("shortcut");
    await entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
    assert.deepEqual(pg.done, ["shortcut"]);
  }
});

test("Quiet during the entry: it commits silently and the waiting messages go back (row 10)", async () => {
  const pr = program();
  pr.memberMode = "hold";
  pr.boxVisible = true;
  const pg = pageSide(pr, ["B", "C"]);
  const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  await ticks();
  pr.setQuiet(true);
  pr.releaseMember();
  const r = await run;
  assert.equal(r.outcome, "committed-quiet");
  assert.equal(pg.draft(), "B\nC");
  assert.equal(pr.member, true);
  assert.deepEqual(pg.said, []);
});

test("R3: the committed visit has an identity: a clear or the end of the visit after the outcome, before the words are sent, ends it", async () => {
  const pr = program();
  pr.boxVisible = true;
  const entries = new Entries();
  const r = await entryTurn(entries, "@Paws hello", pr.host(), pageSide(pr).page);
  assert.equal(r.outcome, "committed");
  assert.equal(entries.visitLive(r.g), true);
  entries.end();
  assert.equal(entries.visitLive(r.g), false);
});

test("R3: a clear while both acknowledgements are held ends the entry; the old acknowledgements then commit nothing", async () => {
  const pr = program();
  pr.memberMode = "hold";
  pr.queryMode = "hold";
  const entries = new Entries();
  const run = entryTurn(entries, "@Paws hello", pr.host(), pageSide(pr).page);
  await ticks();
  entries.end();
  pr.releaseQuery(true);
  pr.releaseMember();
  pr.memberMode = "auto";
  const r = await run;
  assert.equal(r.outcome, "closed");
  assert.equal(entries.visitLive(r.g), false);
  await pr.membership.idle();
  assert.equal(pr.member, false);
});

test("lossless returns (note 2): applied once per id, retried with the same id when lost, never cut at 300 characters", async () => {
  const box = new RestoreInbox();
  let draft = "typed";
  let online = false;
  const sent: string[] = [];
  const r = new Restorer(async (id, text) => { sent.push(id); if (!online) throw new Error("not there"); draft = box.apply(draft, id, text).draft; r.acked(id); });
  const long = "x".repeat(450);
  const id = r.give(["first", long])!;
  await ticks();
  assert.equal(draft, "typed");
  online = true;
  r.retry();
  await ticks();
  assert.equal(draft, `typed\nfirst\n${long}`);
  assert.deepEqual(sent, [id, id]);
  assert.deepEqual(box.apply(draft, id, "first"), { draft, applied: false });
});

test("the page and Rust: both invitation paths re-check the committed visit after their awaits; reasons end the entry, Quiet and a touch do not; truthful native effects", () => {
  const src = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  const box = readFileSync(new URL("../routes/chatbox/+page.svelte", import.meta.url), "utf8");
  const rust = readFileSync(new URL("../../src-tauri/src/duo.rs", import.meta.url), "utf8");
  assert.ok(src.includes("return entryTurn(entries, text, entryHost(text), {"));
  assert.ok(src.includes("return nativeEntryHost({"), "the page's host is the library's");
  assert.equal((src.match(/const entry = await enterChatVisit\(text\);\s*await refreshPawsOut\(\);[\s\S]{0,260}if \(entry\.outcome !== "committed" \|\| !entries\.takeHeld\(entry\.g\)\) return true;/g) ?? []).length, 2);
  assert.ok(/function cancelTalk\(reason: "quiet" \| "touch" \| "clear" \| "visit-end"[^)]*\) \{\s*if \(reason === "clear" \|\| reason === "visit-end"\) endEntry\(reason\);/.test(src));
  assert.ok(src.includes('cancelTalk("clear");') && src.includes('cancelTalk("visit-end");') && src.includes('cancelTalk("quiet");') && src.includes('cancelTalk("touch");'));
  assert.ok(!/cancelTalk\(\);/.test(src), "every call names its reason");
  assert.ok(/listen\("chatbox-closed"[\s\S]{0,300}endEntry\("the box was closed"\)/.test(src));
  assert.ok(src.includes('if (e.payload === "paws") endEntry("Paws tucked in");'));
  assert.ok(/function endEntry\(reason: string\) \{\s*const g = entries\.end\(\);\s*if \(g === null\) return;\s*void invoke\("duo_entry_gen", \{ g: 0 \}\)/.test(src));
  assert.ok(src.includes('show: (g) => void invoke("duo_entry_show", { g })'));
  assert.ok(src.includes('await invoke<string>("duo_membership", { out })'));
  assert.ok(rust.includes("let done = ENTRY.guarded(g, false, || match app.get_webview_window(BOX_LABEL) {"), "the show worker checks the generation under the gate's lock at the effect");
  assert.ok(rust.includes("if let Err(e) = persist(s) { s.pets.paws = before; return Err(e.to_string()); }"));
  assert.ok(box.includes("restores.apply(draft, e.payload.id, e.payload.text)") && box.includes('emitTo("main", "chatbox-composing", true)'));
  assert.ok(/listen\("chatbox-ready"[\s\S]{0,400}if \(boxComposing\) \{ boxComposing = false;/.test(src));
});

// ---------------------------------------------------------------- row 6 (ADR-0167; Vinh 2026-11-28): show AND focus at the commit

test("row 6: at the commit the box is shown and focused for this entry, also when it was hidden", async () => {
  const pr = program();
  const pg = pageSide(pr);
  const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  await ticks();
  pr.runShows(); await pr.advance(100);
  const r = await run;
  assert.equal(r.outcome, "committed");
  assert.ok(pr.calls.includes("focus g=1"), "the focus is asked with the entry's generation, after both acknowledgements");
  assert.ok(pr.calls.indexOf("focus g=1") > pr.calls.indexOf("join"), "not before the commit's acknowledgements");
  // the focus thread runs while the entry is still the one in progress (the page tells the native side 0 only after the outcome)
});

test("row 6: no focus in Quiet (row 10); the focus of the current entry is done; a focus for an ended entry is refused by the native command", async () => {
  const q = program();
  q.boxVisible = true;
  q.setQuiet(true);
  const rq = await entryTurn(new Entries(), "@Paws hello", q.host(), pageSide(q).page);
  assert.equal(rq.outcome, "committed-quiet");
  assert.ok(!q.calls.some((c) => c.startsWith("focus")), "Quiet: the box may show, it does not take the keyboard");

  const ok = program();
  const runOk = entryTurn(new Entries(), "@Paws hello", ok.host(), pageSide(ok).page);
  await ticks();
  ok.runShows(); await ok.advance(100); // the hidden box is shown by the native thread for this entry
  const rok = await runOk;
  assert.equal(rok.outcome, "committed");
  assert.equal(ok.focused, true, "shown and focused at the commit, although it was hidden");

  const gone = program();
  gone.setGen(0);
  await gone.host().focusBox({ g: 9, live: () => true, ended: new Promise(() => {}), abandon: () => {} }); // the native side does not hold g=9
  assert.equal(gone.focused, false);
  assert.ok(gone.log.includes("native: focus of g=9 refused"));
});

test("row 6: no focus while a composition is active; it is asked when the composition ends", async () => {
  const pr = program();
  pr.boxVisible = true;
  pr.memberMode = "hold";
  const pg = pageSide(pr);
  const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  await ticks();
  pr.compose(true);
  pr.releaseMember();
  await ticks();
  assert.ok(!pr.calls.some((c) => c.startsWith("focus")), "no focus while composing");
  pr.compose(false);
  const r = await run;
  assert.equal(r.outcome, "committed");
  assert.ok(pr.calls.includes("focus g=1"));
});

test("row 6, the page and Rust: the focus goes with the entry's generation and the native thread checks it", () => {
  const src = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  const rust = readFileSync(new URL("../../src-tauri/src/duo.rs", import.meta.url), "utf8");
  assert.ok(src.includes('void invoke("duo_entry_focus", { g })'), "the page asks the focus and waits for the worker's report");
  assert.ok(rust.includes("let ok = ENTRY.guarded(g, true, || { dismiss_tray_flyout(); open_box_now(&app); });"), "checked by the worker at the effect");
});

// ---------------------------------------------------------------- second return (comment 7237781628)

/** The page's Quiet handler, as the page does it: cancelTalk("quiet") (the entry continues), the native disarm, and the held words of a committed visit dropped
 *  with the waiting messages given back. */
function quietOn(pr: ReturnType<typeof program>, entries: Entries, giveBackWaiting: () => void) {
  pr.setQuiet(true);
  pr.disarm();
  if (entries.dropHeld() !== null) giveBackWaiting();
}

test("1: Quiet on during the held focus, the worker then runs: no focus, the commit is silent, B and C go back; Quiet off later replays nothing", async () => {
  const pr = program();
  pr.boxVisible = true;
  pr.focusMode = "hold";
  const entries = new Entries();
  const pg = pageSide(pr, ["B", "C"]);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  assert.equal(pr.heldFocusCount(), 1, "the focus was accepted; its worker has not run");
  quietOn(pr, entries, () => {});
  pr.releaseFocus(); // the worker runs while Quiet is on: disarmed, refused
  const r = await run;
  assert.equal(r.outcome, "committed-quiet", "the outcome says what was really committed");
  assert.equal(pr.focused, false);
  assert.equal(pg.draft(), "B\nC", "B and C go back");
  pr.setQuiet(false); // Quiet off again, while the caller awaits its refresh
  assert.equal(entries.takeHeld(r.g), false, "the caller sends nothing: the invitation of a silent commit is not replayed");
});

test("1: Quiet stays on: the same silent commit; with no Quiet the ordinary focus commits and the held words go once", async () => {
  const q = program();
  q.boxVisible = true;
  q.setQuiet(true);
  const rq = await entryTurn(new Entries(), "@Paws hello", q.host(), pageSide(q).page);
  assert.equal(rq.outcome, "committed-quiet");
  assert.ok(!q.calls.some((c) => c.startsWith("focus")));

  const ok = program();
  const entries = new Entries();
  const runOk = entryTurn(entries, "@Paws hello", ok.host(), pageSide(ok).page);
  await ticks();
  ok.runShows(); await ok.advance(100);
  const r = await runOk;
  assert.equal(r.outcome, "committed");
  assert.equal(ok.focused, true, "shown and focused at the commit, although it was hidden");
  assert.ok(ok.calls.indexOf("arm g=1") < ok.calls.indexOf("focus g=1"));
  assert.equal(entries.takeHeld(r.g), true);
  assert.equal(entries.takeHeld(r.g), false, "once");
});

test("1: Quiet after the commit, before the caller sends the held words: they are dropped; Quiet off later brings nothing back", async () => {
  const pr = program();
  pr.boxVisible = true;
  const entries = new Entries();
  const r = await entryTurn(entries, "@Paws hello", pr.host(), pageSide(pr).page);
  assert.equal(r.outcome, "committed");
  let gaveBack = 0;
  quietOn(pr, entries, () => gaveBack++); // during the caller's await refreshPawsOut()
  pr.setQuiet(false);
  assert.equal(entries.takeHeld(r.g), false);
  assert.equal(gaveBack, 1, "what waited behind the invitation goes back once");
});

test("2: the focus accepted, its worker held, the entry ended, the worker released: refused, no focus, and the entry is not committed", async () => {
  const pr = program();
  pr.boxVisible = true;
  pr.focusMode = "hold";
  const entries = new Entries();
  const pg = pageSide(pr);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  assert.equal(pr.heldFocusCount(), 1);
  entries.end(); pr.setGen(0); // the page's endEntry (a close, a clear, a tuck) and its native duo_entry_gen(0)
  pr.releaseFocus();
  const r = await run;
  assert.equal(r.outcome, "closed");
  assert.equal(pr.focused, false);
  assert.ok(pr.log.includes("native: focus of g=1 refused"));
  await pr.membership.idle();
  assert.equal(pr.member, false);
});

test("2: a focus the native side cannot do (it fails twice) is not a commit: the entry fails and its membership is undone", async () => {
  const pr = program();
  pr.boxVisible = true;
  pr.focusBroken = true;
  const pg = pageSide(pr, ["B"]);
  const r = await entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  assert.equal(r.outcome, "failed");
  assert.equal(pr.member, false);
  assert.equal(pg.draft(), "@Paws hello\nB");
  assert.deepEqual(pg.said, ["the call changed nothing"]);
});

test("2: a composition that starts while the focus worker is held disarms it; when the composition ends the focus is asked again and done", async () => {
  const pr = program();
  pr.boxVisible = true;
  pr.focusMode = "hold";
  const pg = pageSide(pr);
  const run = entryTurn(new Entries(), "@Paws hello", pr.host(), pg.page);
  await ticks();
  pr.compose(true); pr.disarm(); // the page's chatbox-composing handler disarms
  pr.releaseFocus(); // refused
  await ticks();
  assert.equal(pr.focused, false);
  pr.focusMode = "auto";
  pr.compose(false);
  const r = await run;
  assert.equal(r.outcome, "committed");
  assert.equal(pr.focused, true, "asked again after the composition and done");
});

test("3: Paws tucked by a command while the join is held: the entry ends, the late join is undone, the tuck lands after it; nothing commits", async () => {
  const pr = program();
  pr.memberMode = "hold";
  pr.boxVisible = true;
  const entries = new Entries();
  const pg = pageSide(pr);
  const run = entryTurn(entries, "@Paws hello", pr.host(), pg.page);
  await ticks();
  const tuck = tuckPaws(() => { entries.end(); pr.setGen(0); }, pr.membership); // the page passes its endEntry
  pr.memberMode = "auto";
  pr.releaseMember(); // the held join answers: the entry is over, so it is undone in its step; then the tuck step
  const r = await run;
  assert.equal(r.outcome, "closed");
  await tuck;
  await pr.membership.idle();
  assert.equal(pr.member, false);
  assert.equal(entries.visitLive(r.g), false);
});

test("3: Paws tucked by a command after the commit and before the words are sent: the visit ends, nothing is sent", async () => {
  const pr = program();
  pr.boxVisible = true;
  const entries = new Entries();
  const r = await entryTurn(entries, "@Paws hello", pr.host(), pageSide(pr).page);
  assert.equal(r.outcome, "committed");
  assert.equal(await tuckPaws(() => { entries.end(); }, pr.membership), true);
  assert.equal(entries.takeHeld(r.g), false);
  assert.equal(pr.member, false);
});

test("the page wires these: both command tucks use tuckPaws; Quiet disarms and drops the held words; a composition disarms; the focus waits for the worker's report", () => {
  const src = readFileSync(new URL("../routes/+page.svelte", import.meta.url), "utf8");
  const rust = readFileSync(new URL("../../src-tauri/src/duo.rs", import.meta.url), "utf8");
  assert.equal((src.match(/=== "paws" && (?:c|a)\.act === "in" && pawsMode === "chat" \? await tuckPaws\(endEntry, membership\)/g) ?? []).length, 2, "the typed and the slash-list tuck");
  assert.equal((src.match(/if \(entry\.outcome !== "committed" \|\| !entries\.takeHeld\(entry\.g\)\) return true;/g) ?? []).length, 2);
  assert.ok(/cancelTalk\("quiet"\);\s*void invoke\("duo_entry_disarm"\)[\s\S]{0,300}if \(entries\.dropHeld\(\) !== null\) \{ restorer\.give\(sendQueue\.takeAll\(\)\);/.test(src));
  assert.ok(/boxComposing = e\.payload;\s*if \(boxComposing\) void invoke\("duo_entry_disarm"\)/.test(src));
  assert.ok(src.includes('cleanups.push(await win.listen<{ g: number; ok: boolean }>("duo-entry-focused", (e) => focusWaiters.get(e.payload.g)?.(e.payload.ok)));'));
  assert.ok(rust.includes("let ok = ENTRY.guarded(g, true, || { dismiss_tray_flyout(); open_box_now(&app); });"), "the worker checks under the gate's lock at the effect");
  assert.ok(rust.includes('let _ = app.emit_to("main", "duo-entry-focused", serde_json::json!({ "g": g, "ok": ok }));'), "and reports the effect itself");
  assert.ok(rust.includes("pub async fn duo_entry_gen(g: u64)") && rust.includes("pub async fn duo_entry_disarm()"), "the page's end and disarm wait for the lock off the main thread");
});
