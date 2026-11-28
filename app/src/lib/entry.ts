// Entering a group visit (T2a of ADR-0167; rows 2, 6-11, 22, 23 and 28a, with Codex's T1 notes 1-4). Pure logic: the page supplies the native effects and
// the box's state through EntryHost; everything the page does between an invitation and an active visit goes through enterVisit, so the tests run the same
// continuation. Only the chat-member visit uses it (the walking Paws and the portrait are the old paths, unreachable until the trial: ADR-0165 Q3).
//
// - eligibility BEFORE any native effect: the entry is current and no composition is active in the box (note 1)
// - commit: the membership saved AND the box shown, in either order, the entry still current, no composition; a duplicate acknowledgement does nothing
// - no model request before the commit (the page dispatches the held words only on "committed")
// - failure or the deadline before the commit: the entry ends, a saved membership is undone, and so is one saved later (row 8)
// - an explicit close ends the entry at once, even if the box is still fading (note 3); a late acknowledgement creates nothing
// - Quiet: the entry commits silently (row 10); the page then sends no greeting and gives the waiting messages back

/** The entry deadline (engineering parameter, frozen on issue 23): owned by the pet page; from the start of the native effects until both acknowledgements. */
export const ENTRY_DEADLINE_MS = 5000;

export interface EntryToken {
  /** The visit generation of this entry. */
  readonly g: number;
  /** True while this entry is the one in progress and has not ended. */
  live(): boolean;
  /** Resolves when this entry is ended from outside (a close, a clear, the end of a visit, Paws tucked in) or abandoned by its own rollback. */
  readonly ended: Promise<void>;
  /** The entry's own rollback (a failure, the deadline): from now on it is not live, so a membership saved late for it is undone in the membership chain. */
  abandon(): void;
}

/** The owner of the entry generation and of the visit it commits (the page). One entry at a time: the send queue serialises messages. */
export class Entries {
  private n = 0;
  private cur = 0;
  private closing = 0;
  private visit = 0;
  private stop: (() => void) | null = null;

  begin(): EntryToken {
    const g = ++this.n;
    this.cur = g;
    let resolve: () => void = () => {};
    const ended = new Promise<void>((r) => { resolve = r; });
    this.stop = resolve;
    return { g, live: () => this.cur === g, ended, abandon: () => { if (this.cur === g) { this.cur = 0; this.closing = g; resolve(); } } };
  }
  /** A reason that ends the entry in progress (a close, the tray, a clear, the end of a visit, Paws tucked in): its `g` is invalid now, and so is a visit it
   *  committed whose words have not been sent yet. Returns the `g` ended, or null. Quiet and a touch are not such reasons (rows 10 and 29). */
  end(): number | null {
    const had = this.cur || this.visit || 0;
    if (this.cur) { this.closing = this.cur; this.cur = 0; this.stop?.(); this.stop = null; }
    this.visit = 0;
    return had || null;
  }
  /** The entry committed: its visit is current until a reason ends it. */
  commit(g: number) { if (this.cur === g || this.closing === g) this.visit = g; }
  /** The visit committed by `g` is still the current one (checked after every await of the page that follows the commit). */
  visitLive(g: number): boolean { return this.visit === g; }
  /** The entry `g` reached its outcome and its cleanup is done. */
  settle(g: number) {
    if (this.cur === g) { this.cur = 0; this.stop = null; }
    if (this.closing === g) this.closing = 0;
  }
  /** An entry is in progress, or its close is still being cleaned up: the page's own cleanup of a visit leaves the unsent text to the entry. */
  busy(): boolean { return this.cur !== 0 || this.closing !== 0; }
  pending(): boolean { return this.cur !== 0; }
  get generation(): number { return this.n; }
}

/** The native answer to a membership change (the Rust command `duo_membership`, truthful about the disk write since T2a R4). */
export type MemberAnswer = "changed" | "unchanged" | "error";

/** Every change of Paws's membership goes through this one chain, in order (R2): a join and its compensation are one step, so nothing of a newer entry can
 *  run between an old join and its undo. The join is done only if the entry is still live when its turn comes, and checked again when the native answer
 *  arrives: an entry that ended meanwhile has its join undone in the same step. An undo is retried; a refused undo is reported, never assumed. */
export class Membership {
  private chain: Promise<unknown> = Promise.resolve();
  private native: (out: boolean) => Promise<MemberAnswer>;
  private sleep: (ms: number) => Promise<void>;
  private log: (line: string) => void;
  constructor(native: (out: boolean) => Promise<MemberAnswer>, sleep: (ms: number) => Promise<void>, log: (line: string) => void) {
    this.native = native; this.sleep = sleep; this.log = log;
  }
  private step<T>(f: () => Promise<T>): Promise<T> {
    const run = this.chain.then(f);
    this.chain = run.catch(() => {});
    return run;
  }
  /** Paws out once, gone again with retries: true when Paws is not a member afterwards. */
  private async undoNow(g: number): Promise<boolean> {
    for (let i = 0; i < 3; i++) {
      const a = await this.native(false).catch((): MemberAnswer => "error");
      if (a !== "error") return true;
      this.log(`entry g=${g}: the membership could not be undone (try ${i + 1} of 3)`);
      await this.sleep(300);
    }
    return false;
  }
  /** The join of entry `t`. `eligible` is asked at its turn (it waits for a composition to end and says whether the entry is still live). "saved": this entry
   *  owns the membership now; "refused": the write failed or was refused; "skipped": the entry was over at its turn or by the answer (any join undone here);
   *  "stuck": the entry ended, its join could not be undone (Paws stays a member, as the disk says). */
  join(t: EntryToken, eligible: () => Promise<boolean>, beforeNative: () => Promise<void> = async () => {}): Promise<"saved" | "refused" | "skipped" | "stuck"> {
    return this.step(async () => {
      if (!(await eligible())) return "skipped";
      await beforeNative(); // the developer channel's slow join: the native answer then arrives late, after its check
      const a = await this.native(true).catch((): MemberAnswer => "error");
      if (a === "error") return "refused";
      if (a === "unchanged") return "refused"; // already a member without this entry: not this entry's to own (an entry starts only when Paws is not a member)
      if (t.live()) return "saved";
      this.log(`entry g=${t.g}: the membership arrived after the entry ended; undone in the same step`);
      return (await this.undoNow(t.g)) ? "skipped" : "stuck";
    });
  }
  /** The undo of entry `g`'s own membership, in order: true when Paws is not a member afterwards; false when it could not be undone (stuck). */
  leave(g: number): Promise<boolean> { return this.step(() => this.undoNow(g)); }
  /** Resolves when every change asked so far is done (the tests and the page's own ordering). */
  idle(): Promise<void> { return this.step(async () => {}); }
}

export interface EntryHost {
  /** A composition (a word being formed by an input method) is active in the box. */
  composing(): boolean;
  /** Resolves when the box's composition ends (at once if there is none). */
  compositionEnded(): Promise<void>;
  /** The membership join for this entry, through the Membership chain (identity and composition checked at the effect). */
  saveMembership(t: EntryToken): Promise<"saved" | "refused" | "skipped" | "stuck">;
  /** This entry's membership undone, through the same chain: true when Paws is not a member afterwards. */
  undoMembership(t: EntryToken): Promise<boolean>;
  /** The box shown for this entry (identity and composition checked at the effect, and by the native side when it shows): true when it is on the screen. */
  showBox(t: EntryToken): Promise<boolean>;
  sleep(ms: number): Promise<void>;
  quiet(): boolean;
  log(line: string): void;
}

/** The page's native side of an entry, given to `nativeEntryHost`: what can be asked of the program (each call may be held, refused or answered late). */
export interface EntryNative {
  composing(): boolean;
  compositionEnded(): Promise<void>;
  /** Whether the box is on the screen now. */
  showing(): Promise<boolean>;
  /** Show the box for entry `g`, without the keyboard; the native side shows it only while `g` is still the entry in progress. */
  show(g: number): void;
  membership: Membership;
  /** The developer channel refuses the join without asking the native side. */
  refuse?: boolean;
  /** Before the native join (the developer channel's slow join). */
  beforeJoin?: () => Promise<void>;
  /** After an undo (the page refreshes who is out). */
  afterUndo?: () => Promise<void>;
  sleep(ms: number): Promise<void>;
  quiet(): boolean;
  log(line: string): void;
}

/** The host the page gives an entry, with the entry's identity and the composition checked at each effect itself, after every await (R1). */
export function nativeEntryHost(n: EntryNative): EntryHost {
  const host: EntryHost = {
    composing: () => n.composing(),
    compositionEnded: () => n.compositionEnded(),
    saveMembership: (t) => {
      if (n.refuse) { n.log("entry: membership refused (canned)"); return Promise.resolve("refused" as const); }
      return n.membership.join(t, () => eligibleAtEffect(t, host), n.beforeJoin);
    },
    undoMembership: async (t) => { const ok = await n.membership.leave(t.g); await n.afterUndo?.(); return ok; },
    showBox: async (t) => {
      if (!(await eligibleAtEffect(t, host))) return false;
      if (await n.showing().catch(() => false)) return true;
      if (!(await eligibleAtEffect(t, host))) return false; // checked again after the await, at the effect
      n.show(t.g);
      for (let i = 0; i < 48; i++) {
        await n.sleep(100);
        if (!t.live()) return false;
        if (await n.showing().catch(() => false)) return true;
      }
      return false;
    },
    sleep: (ms) => n.sleep(ms),
    quiet: () => n.quiet(),
    log: (l) => n.log(l),
  };
  return host;
}

export type EntryOutcome = "committed" | "committed-quiet" | "failed" | "closed";
export interface EntryResult { outcome: EntryOutcome; g: number; stuck: boolean }

/** Waits for a composition to end before an effect, then says whether the entry is still live (note 1, at the effect itself). */
export async function eligibleAtEffect(t: EntryToken, h: Pick<EntryHost, "composing" | "compositionEnded">): Promise<boolean> {
  while (t.live() && h.composing()) await Promise.race([h.compositionEnded(), t.ended]);
  return t.live();
}

/** The whole entry, from the invitation to its outcome. "committed" lets the caller dispatch the held words once (after checking `visitLive` again after its
 *  own awaits); "committed-quiet" sends nothing; "failed" and "closed" are terminal, with this entry's membership undone and awaited. */
export async function enterVisit(t: EntryToken, h: EntryHost, deadlineMs = ENTRY_DEADLINE_MS): Promise<EntryOutcome> {
  return (await enterVisitResult(t, h, deadlineMs)).outcome;
}

export async function enterVisitResult(t: EntryToken, h: EntryHost, deadlineMs = ENTRY_DEADLINE_MS): Promise<EntryResult> {
  const res = (outcome: EntryOutcome, stuck = false): EntryResult => ({ outcome, g: t.g, stuck });
  // eligibility before any native effect: current entry, no composition (note 1; row 11)
  if (h.composing()) h.log(`entry g=${t.g}: a composition is active; nothing is shown or saved until it ends`);
  if (!(await eligibleAtEffect(t, h))) { h.log(`entry g=${t.g}: ended before any effect, never resumed`); return res("closed"); }

  let saved: "saved" | "refused" | "skipped" | "stuck" | null = null;
  let shown: boolean | null = null;
  let wake: () => void = () => {};
  const acks = new Promise<void>((r) => { wake = r; });
  const check = () => { if (saved === "refused" || saved === "skipped" || saved === "stuck" || shown === false || (saved === "saved" && shown === true)) wake(); };
  const joining = h.saveMembership(t).then((v) => { saved = v; check(); return v; }, () => { saved = "refused"; check(); return "refused" as const; });
  h.showBox(t).then((v) => { if (shown === null) shown = v; check(); }, () => { if (shown === null) shown = false; check(); });
  let timedOut = false;
  await Promise.race([acks, t.ended, h.sleep(deadlineMs).then(() => { timedOut = true; })]);

  /** The rollback: the entry stops being live (so a join still to come is undone in the chain), and this entry's own membership is undone and awaited. */
  const rollback = async (why: EntryOutcome, reason: string): Promise<EntryResult> => {
    t.abandon();
    h.log(`entry g=${t.g}: ${reason}`);
    if (saved === null) {
      // the join has not answered yet: it is undone in its own step when it does (the entry is not live any more); its answer is awaited, so that the
      // outcome is reported only once the membership is known
      // bounded: a native join that never answers would hold the queue; past one more deadline the membership is reported as not known (stuck)
      let late: string | null = null;
      await Promise.race([joining.then((v) => { late = v; }), h.sleep(deadlineMs)]);
      if (late === null) h.log(`entry g=${t.g}: the membership has not answered; it is undone in its own step if it ever does`);
      return res(why, late === null || late === "stuck");
    }
    if (saved === "saved") {
      const ok = await h.undoMembership(t);
      if (!ok) h.log(`entry g=${t.g}: the membership could not be undone; Paws stays a member as the disk has it`);
      return res(why, !ok);
    }
    return res(why, saved === "stuck");
  };
  if (!t.live()) return rollback("closed", "closed before the commit");
  if (saved === "refused") return rollback("failed", "the membership was refused");
  if (saved === "skipped" || saved === "stuck") return rollback("closed", "the entry was over when its membership arrived");
  if (shown === false) return rollback("failed", "the box could not be shown");
  if (!(saved === "saved" && shown === true)) return rollback("failed", timedOut ? `no commit within ${deadlineMs} ms` : "not acknowledged");

  // both acknowledgements are in: a composition that started meanwhile defers the commit (no deadline); an entry ended meanwhile never resumes
  if (!(await eligibleAtEffect(t, h))) return rollback("closed", "closed while the commit waited for a composition");
  const quiet = h.quiet();
  h.log(`entry g=${t.g}: committed${quiet ? " in Quiet (no greeting)" : ""}`);
  return res(quiet ? "committed-quiet" : "committed");
}

// ---------------------------------------------------------------- returned text (Codex's T1 note 2)

/** Unsent text given back to the box's field, losslessly: every return has an id; the box applies an id once and acknowledges it; an unacknowledged return is
 *  sent again with the same id when the box is ready. The whole text goes back, also beyond the field's 300 characters (ADR-0167 decision 1): returning is
 *  not sending. Held in process memory only. */
export class Restorer {
  private pending = new Map<string, string>();
  private n = 0;
  private send: (id: string, text: string) => Promise<unknown>;
  constructor(send: (id: string, text: string) => Promise<unknown>) { this.send = send; }

  /** Give back these texts in order, as one return (line breaks between them). Nothing for an empty list. Returns its id. */
  give(texts: readonly string[]): string | null {
    const parts = texts.filter((t) => t.length > 0);
    if (parts.length === 0) return null;
    const id = `r${++this.n}`;
    this.pending.set(id, parts.join(String.fromCharCode(10)));
    this.deliver(id);
    return id;
  }
  /** The box acknowledged this return. */
  acked(id: string) { this.pending.delete(id); }
  /** The box is ready again (made or reloaded): every return not yet acknowledged is sent again, with its own id. */
  retry() { for (const id of this.pending.keys()) this.deliver(id); }
  /** What is not acknowledged yet, oldest first (for the tests and the log). */
  waiting(): { id: string; text: string }[] { return [...this.pending].map(([id, text]) => ({ id, text })); }

  private deliver(id: string) {
    const text = this.pending.get(id);
    if (text === undefined) return;
    this.send(id, text).catch(() => { /* kept: retried when the box is ready */ });
  }
}

/** The box's side of a return: an id is applied once (a second delivery of the same id changes nothing); the text is appended to the draft whole. */
export class RestoreInbox {
  private seen = new Set<string>();
  /** The draft after this return, and whether it was applied now. */
  apply(draft: string, id: string, text: string): { draft: string; applied: boolean } {
    if (this.seen.has(id)) return { draft, applied: false };
    this.seen.add(id);
    return { draft: draft ? `${draft}${String.fromCharCode(10)}${text}` : text, applied: true };
  }
}

// ---------------------------------------------------------------- the page's continuation around an entry

/** What the page lends to an entry: its rows, its queue of waiting messages, the returns, the line said on a failure, the native pending flag and the presses
 *  that waited (row 28a). `entryTurn` is the whole continuation the page runs for an invitation; the page acts only on the outcome it returns. */
export interface EntryPage {
  /** The invitation's row in the talk (its id), if it is there: shown as waiting until the commit. */
  inviteRow(text: string): number | null;
  markWaiting(id: number, on: boolean): void;
  /** The row of an entry that did not commit leaves the history: its text goes back to the field instead. */
  removeRow(id: number): void;
  /** The messages waiting behind the entry, taken out of the queue (each once). */
  takeWaiting(): string[];
  giveBack(texts: string[]): void;
  /** The existing line for a call that changed nothing, said by Peak (never in Quiet; ADR-0171). */
  sayFailed(): Promise<void>;
  quiet(): boolean;
  /** The native side is told which entry is in progress (its g), or none (0): it shows the box only for that entry, and defers presses meanwhile. */
  setGen(g: number): void;
  /** A press that waited for this entry (or null), taken once. */
  takeDeferred(): string | null;
  /** The press done after the outcome: the second start's own effect, then the box focused. */
  doDeferred(press: string): void;
  /** The membership of an ended entry could not be undone: the page shows the presence as the disk has it. */
  memberStuck(): void;
  log(line: string): void;
}

export async function entryTurn(entries: Entries, text: string, h: EntryHost, p: EntryPage, deadlineMs = ENTRY_DEADLINE_MS): Promise<EntryResult> {
  const t = entries.begin();
  p.setGen(t.g);
  const row = p.inviteRow(text);
  if (row !== null) p.markWaiting(row, true);
  let r: EntryResult = { outcome: "closed", g: t.g, stuck: false };
  try {
    r = await enterVisitResult(t, h, deadlineMs);
  } finally {
    if (row !== null) p.markWaiting(row, false);
    p.setGen(0);
  }
  if (r.outcome === "committed" || r.outcome === "committed-quiet") entries.commit(t.g);
  if (r.stuck) { p.log(`entry g=${t.g}: membership stuck after the rollback`); p.memberStuck(); }
  if (r.outcome === "failed" || r.outcome === "closed") {
    if (row !== null) p.removeRow(row);
    p.giveBack([text, ...p.takeWaiting()]); // the invitation, then what waited behind it, in order, once (row 8, row 9)
    p.log(`entry ${r.outcome}: the invitation and the waiting messages given back, no request`);
  } else if (r.outcome === "committed-quiet") {
    p.giveBack(p.takeWaiting()); // row 10: no greeting; the other unsent messages go back
    p.log("entry committed in Quiet: no greeting, the waiting messages given back");
  }
  const press = p.takeDeferred();
  if (press) {
    if (r.outcome === "closed") p.log(`entry: a ${press} made before the close is dropped`); // decision 2
    else p.doDeferred(press);
  }
  entries.settle(t.g);
  if (r.outcome === "failed" && !p.quiet()) await p.sayFailed();
  return r;
}
