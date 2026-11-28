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
  /** Resolves when this entry is ended from outside (a close, the tray, the end of a visit). */
  readonly ended: Promise<void>;
  /** A newer entry has begun: old-`g` work must change nothing of it (row 23), not even undo the membership it now owns. */
  newer(): boolean;
}

/** The owner of the entry generation (the page). One entry at a time: the send queue serialises messages, so a second invitation waits behind the first. */
export class Entries {
  private n = 0;
  private cur = 0;
  private closing = 0;
  private stop: (() => void) | null = null;

  begin(): EntryToken {
    const g = ++this.n;
    this.cur = g;
    let resolve: () => void = () => {};
    const ended = new Promise<void>((r) => { resolve = r; });
    this.stop = resolve;
    return { g, live: () => this.cur === g, ended, newer: () => this.n > g };
  }
  /** An explicit close, the tray, the end of a visit, Paws tucked in: the entry in progress ends now (its `g` is invalid at once). Returns its `g`, or null. */
  end(): number | null {
    if (!this.cur) return null;
    const g = this.cur;
    this.closing = g;
    this.cur = 0;
    this.stop?.();
    this.stop = null;
    return g;
  }
  /** The entry `g` reached its outcome (committed, failed or closed) and its cleanup is done. */
  settle(g: number) {
    if (this.cur === g) { this.cur = 0; this.stop = null; }
    if (this.closing === g) this.closing = 0;
  }
  /** An entry is in progress, or its close is still being cleaned up: the page's own cleanup of a visit leaves the unsent text to the entry. */
  busy(): boolean { return this.cur !== 0 || this.closing !== 0; }
  pending(): boolean { return this.cur !== 0; }
  get generation(): number { return this.n; }
}

export interface EntryHost {
  /** A composition (a word being formed by an input method) is active in the box. */
  composing(): boolean;
  /** Resolves when the box's composition ends (at once if there is none). */
  compositionEnded(): Promise<void>;
  /** The native membership save (Paws joins the chat): true when saved, false when refused. */
  saveMembership(): Promise<boolean>;
  /** The membership undone (Paws sent in again). */
  undoMembership(): Promise<void>;
  /** The box shown: true when it is on the screen, false when it could not be shown. */
  showBox(): Promise<boolean>;
  sleep(ms: number): Promise<void>;
  quiet(): boolean;
  log(line: string): void;
}

export type EntryOutcome = "committed" | "committed-quiet" | "failed" | "closed";

/** The whole entry, from the invitation to its outcome. The caller acts on the outcome: "committed" dispatches the held words once; "committed-quiet" sends
 *  nothing and gives the waiting messages back; "failed" and "closed" give the invitation and the waiting messages back (the page says the existing line on
 *  "failed"). Every outcome but the two commits is terminal: no membership stays, and nothing of this `g` may later show, focus, request or charge. */
export async function enterVisit(t: EntryToken, h: EntryHost, deadlineMs = ENTRY_DEADLINE_MS): Promise<EntryOutcome> {
  // eligibility before any native effect: current entry, no composition (note 1; row 11)
  while (h.composing()) {
    h.log(`entry g=${t.g}: a composition is active; nothing is shown or saved until it ends`);
    await Promise.race([h.compositionEnded(), t.ended]);
    if (!t.live()) { h.log(`entry g=${t.g}: ended while composing, never resumed`); return "closed"; }
  }
  if (!t.live()) return "closed";

  // the native effects, both at once; each acknowledgement is recorded once (a duplicate changes nothing)
  let saved: boolean | null = null;
  let shown: boolean | null = null;
  let over = false; // the entry reached a terminal outcome other than a commit: a membership saved after this is undone
  let undone = false;
  const undo = () => { if (!undone) { undone = true; void h.undoMembership(); } };
  let wake: () => void = () => {};
  const acks = new Promise<void>((r) => { wake = r; });
  const check = () => { if (saved === false || shown === false || (saved === true && shown === true)) wake(); };
  h.saveMembership().then((v) => {
    if (saved === null) saved = v;
    if (v && over) {
      if (t.newer()) h.log(`entry g=${t.g}: membership saved late, kept for the newer entry (row 23)`);
      else { h.log(`entry g=${t.g}: membership saved late, undone`); undo(); }
    }
    check();
  },
    () => { if (saved === null) saved = false; check(); });
  h.showBox().then((v) => { if (shown === null) shown = v; check(); }, () => { if (shown === null) shown = false; check(); });
  let timedOut = false;
  await Promise.race([acks, t.ended, h.sleep(deadlineMs).then(() => { timedOut = true; })]);

  const rollback = (why: EntryOutcome, reason: string): EntryOutcome => {
    over = true;
    if (saved === true) undo();
    h.log(`entry g=${t.g}: ${reason}`);
    return why;
  };
  if (!t.live()) return rollback("closed", "closed before the commit");
  if (saved === false) return rollback("failed", "the membership was refused");
  if (shown === false) return rollback("failed", "the box could not be shown");
  if (!(saved === true && shown === true)) return rollback("failed", timedOut ? `no commit within ${deadlineMs} ms` : "not acknowledged");

  // both acknowledgements are in: a composition that started meanwhile defers the commit (no deadline); an entry ended meanwhile never resumes
  while (h.composing()) {
    await Promise.race([h.compositionEnded(), t.ended]);
    if (!t.live()) return rollback("closed", "closed while the commit waited for a composition");
  }
  if (!t.live()) return rollback("closed", "closed before the commit");
  const quiet = h.quiet();
  h.log(`entry g=${t.g}: committed${quiet ? " in Quiet (no greeting)" : ""}`);
  return quiet ? "committed-quiet" : "committed";
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
  /** The existing line for a call that changed nothing, said by Peak (never in Quiet). */
  sayFailed(): Promise<void>;
  quiet(): boolean;
  setPending(on: boolean): void;
  /** A press that waited for this entry (or null), taken once. */
  takeDeferred(): string | null;
  /** The press done after the outcome: the second start's own effect, then the box focused. */
  doDeferred(press: string): void;
  log(line: string): void;
}

export async function entryTurn(entries: Entries, text: string, h: EntryHost, p: EntryPage, deadlineMs = ENTRY_DEADLINE_MS): Promise<EntryOutcome> {
  const t = entries.begin();
  p.setPending(true);
  const row = p.inviteRow(text);
  if (row !== null) p.markWaiting(row, true);
  let outcome: EntryOutcome = "closed";
  try {
    outcome = await enterVisit(t, h, deadlineMs);
  } finally {
    if (row !== null) p.markWaiting(row, false);
    p.setPending(false);
  }
  if (outcome === "failed" || outcome === "closed") {
    if (row !== null) p.removeRow(row);
    p.giveBack([text, ...p.takeWaiting()]); // the invitation, then what waited behind it, in order, once (row 8, row 9)
    p.log(`entry ${outcome}: the invitation and the waiting messages given back, no request`);
  } else if (outcome === "committed-quiet") {
    p.giveBack(p.takeWaiting()); // row 10: no greeting; the other unsent messages go back
    p.log("entry committed in Quiet: no greeting, the waiting messages given back");
  }
  const press = p.takeDeferred();
  if (press) {
    if (outcome === "closed") p.log(`entry: a ${press} made before the close is dropped`); // decision 2
    else p.doDeferred(press);
  }
  entries.settle(t.g);
  if (outcome === "failed" && !p.quiet()) await p.sayFailed();
  return outcome;
}
