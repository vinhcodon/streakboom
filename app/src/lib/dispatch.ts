// Dispatch and the daily quota of the group visit (T2d of ADR-0167; rows 1, 12, 13, 14a-d and 25). Pure logic: the page holds the pet data, the clock and the
// native write; everything the page does at these boundaries goes through the functions below, so the tests run the same wiring.
// - one counter (`ai.chat` in pet.json) and one cap a day: 120 with the experiment, for solo and visits alike (ADR-0165); 60 without it (unchanged)
// - a request is charged once, and the charge is WRITTEN and acknowledged before the request is issued (a restart cannot give it back); a failed write issues
//   no request; a charge for a request that is then not issued (Quiet, a cancel, a newer turn during the write) is given back
// - one deliberate send (`mid`) is dispatched at most once, also after the visit it belongs to has ended; a send that left the box before the visit ended is
//   stale: it is not dispatched in the next visit, and its text goes back to the field

import { aiGate, coolDown, dayKey, recordAi, type PetData } from "./state.ts";

/** The cap scale of the experiment: 60 x 2 = 120 chats a day (ADR-0165, decision 1). */
export const DUO_CAP_SCALE = 2;

// ---------------------------------------------------------------- sends (row 13)

/** One deliberate send as the box delivers it: its id and the moment it left the box. */
export interface BoxSend { text: string; mid?: string; at?: number }
export type Admission = "new" | "replay" | "stale";

/** The sends already dispatched, and the moment the last visit ended. A consumed `mid` stays consumed in every later generation (ADR-0167 row 13: a repeated
 *  delivery is never a new send); a send that left the box before the end of the visit it was made in belongs to that visit and is not dispatched after it. */
export class SendGate {
  private consumed = new Set<string>();
  private order: string[] = [];
  private endedAt = -Infinity;
  /** The visit generation: it moves when a visit ends. T2a owns entry and commit; this slice only needs the boundary. */
  g = 0;
  private keep: number;
  constructor(keep = 512) { this.keep = keep; }

  /** The visit ended at `now`: the generation moves, and every send made before this moment is stale from now on. */
  end(now: number) { this.g++; this.endedAt = now; }

  /** "new" (dispatch it, once), "replay" (already dispatched: drop) or "stale" (made before the last end: not dispatched, its text goes back). */
  admit(s: BoxSend): Admission {
    if (s.mid !== undefined && this.consumed.has(s.mid)) return "replay";
    if (s.at !== undefined && s.at <= this.endedAt) {
      if (s.mid !== undefined) this.remember(s.mid); // returned once: a second delivery of the same stale send is a replay, not a second return
      return "stale";
    }
    if (s.mid !== undefined) this.remember(s.mid);
    return "new";
  }

  private remember(mid: string) {
    this.consumed.add(mid);
    this.order.push(mid);
    while (this.order.length > this.keep) this.consumed.delete(this.order.shift()!); // bounded: far older than any delivery can be late
  }
}

/** The page's boundary for a send from the box: admitted sends go to the queue, a replay is dropped, a stale send's text goes back to the field. */
export function routeBoxSend(gate: SendGate, s: BoxSend, to: { queue(text: string): void; giveBack(text: string): void; log(line: string): void }): Admission {
  const v = gate.admit(s);
  if (v === "new") to.queue(s.text);
  else if (v === "replay") to.log(`duplicate send ignored (${s.mid})`);
  else { to.log(`stale send from an ended visit: not sent, given back (${s.mid ?? "no id"})`); to.giveBack(s.text); }
  return v;
}

// ---------------------------------------------------------------- acknowledged, ordered writes of pet.json

/** Every write of the pet data goes through one chain: each write takes its snapshot when its turn comes (never an older one after a newer one) and its
 *  promise settles with the native write's own result, so a caller can wait for the acknowledgement and see a failure. */
export class PetWriter {
  private chain: Promise<unknown> = Promise.resolve();
  private write: (json: string) => Promise<void>;
  private snapshot: () => string;
  constructor(write: (json: string) => Promise<void>, snapshot: () => string) { this.write = write; this.snapshot = snapshot; }
  /** Resolves once this write (with the data as it is when the write starts) is acknowledged; rejects with the write's error. */
  save(): Promise<void> {
    const run = this.chain.then(() => this.write(this.snapshot()));
    this.chain = run.catch(() => {}); // a failed write does not block the next one
    return run;
  }
}

// ---------------------------------------------------------------- the quota

/** The charge could not be written: no request is issued (ADR-0165: the count must survive a restart). What the person then sees is the page's choice. */
export class ChargeNotSaved extends Error { readonly reason: unknown; constructor(reason: unknown) { super("the charge could not be saved"); this.reason = reason; } }
/** The request was no longer wanted when the charge had been written (Quiet, a cancel, a newer turn): no request, the charge given back. */
export class NotIssued extends Error { constructor() { super("not issued"); } }

/** The quota as the Conversation's `allow` and the model call see it. `persist` is the page's acknowledged write (PetWriter.save). */
export interface QuotaHost { get(): PetData; set(d: PetData): void; persist(): Promise<void>; now(): number; duo: boolean; log?(line: string): void }

/** The charge taken back: the in-memory count of the day it was made goes down by one (never below zero, never on another day). */
export function unrecordChat(d: PetData, day: string): PetData {
  if (d.ai.day !== day || d.ai.chat <= 0) return d;
  return { ...d, ai: { ...d.ai, chat: d.ai.chat - 1 } };
}

export function quota(h: QuotaHost) {
  const scale = h.duo ? DUO_CAP_SCALE : 1;
  const usage = () => { const a = h.get().ai; return `usage chat=${a.chat} day=${a.day} cool=${a.coolUntil > h.now() ? "on" : "off"}`; };
  return {
    /** "ok", "cooldown" or "cap", for one more chat request now. */
    gate: () => aiGate(h.get(), "chat", h.now(), scale),
    /** One request is about to be issued: it is counted and the count is written; resolves when the write is acknowledged (the day it was charged to).
     *  A failed write takes the count back in memory and rejects with ChargeNotSaved: the request must not be issued. */
    async charge(): Promise<string> {
      h.set(recordAi(h.get(), "chat", h.now()));
      const day = h.get().ai.day;
      try {
        await h.persist();
      } catch (e) {
        h.set(unrecordChat(h.get(), day));
        h.log?.(`charge not saved: no request (${String((e as { message?: string })?.message ?? e)})`);
        throw new ChargeNotSaved(e);
      }
      h.log?.(usage());
      return day;
    },
    /** A charge whose request was not issued is given back, and written (best effort: if that write fails, the stored count is one too high, never too low). */
    async refund(day: string): Promise<void> {
      h.set(unrecordChat(h.get(), day));
      try { await h.persist(); h.log?.(`refund: ${usage()}`); } catch { h.log?.("refund not saved: the stored count stays one higher"); }
    },
    /** The provider said rate limit: no request until the cooldown ends (row 14d). */
    async rateLimited(): Promise<void> {
      h.set(coolDown(h.get(), h.now()));
      try { await h.persist(); } catch { /* the cooldown holds in memory for this run */ }
      h.log?.(usage());
    },
    today: () => dayKey(h.now()),
  };
}

/** Peak's solo chat with the experiment (row 1, cap 120): the charge is written and acknowledged before the request; "issue" lets the page send it,
 *  "not-saved" means the write failed (no request), "not-issued" means Quiet or away came during the write (no request, the charge given back). */
export async function chargeSolo(q: ReturnType<typeof quota>, live: () => boolean): Promise<"issue" | "not-saved" | "not-issued"> {
  let day: string;
  try { day = await q.charge(); } catch (e) { if (e instanceof ChargeNotSaved) return "not-saved"; throw e; }
  if (!live()) { await q.refund(day); return "not-issued"; }
  return "issue";
}

/** A request through the quota: the charge is written and acknowledged first; then, if the request is still wanted (`live`), it is issued; a rate limit starts
 *  the cooldown; a failure is passed on (the pet then makes its gesture). ChargeNotSaved and NotIssued mean no request was issued. */
export async function chargedRequest<T>(q: ReturnType<typeof quota>, request: () => Promise<T>, kindOf: (e: unknown) => string, live: () => boolean = () => true): Promise<T> {
  const day = await q.charge();
  if (!live()) { await q.refund(day); throw new NotIssued(); }
  try {
    return await request();
  } catch (e) {
    if (kindOf(e) === "rate_limit") await q.rateLimited();
    throw e;
  }
}
