// Dispatch and the daily quota of the group visit (T2d of ADR-0167; rows 1, 12, 13, 14a-d and 25). Pure logic: the page holds the pet data and the clock.
// - one counter (`ai.chat` in pet.json) and one cap a day: 120 with the experiment, for solo and visits alike (ADR-0165); 60 without it (unchanged)
// - a request is charged once, before it is issued, also if it fails or its reply is dropped; inviting, ending or restarting never refills
// - one deliberate send (`mid`) is dispatched once in a visit generation (`g`); two sends with the same text stay two

import { aiGate, coolDown, recordAi, type PetData } from "./state.ts";

/** The cap scale of the experiment: 60 x 2 = 120 chats a day (ADR-0165, decision 1). */
export const DUO_CAP_SCALE = 2;

/** The messages already dispatched in the current visit generation. A repeated delivery of one `mid` (a duplicate or a retried event) is dropped; a new `g`
 *  forgets the old ones, since nothing of an old visit can be dispatched again (ADR-0167, row 13). */
export class SendIds {
  private g = 0;
  private seen = new Set<string>();

  /** True the first time `mid` is seen in generation `g`; false for a repeat in the same generation. */
  accept(mid: string, g: number): boolean {
    if (g !== this.g) { this.g = g; this.seen = new Set(); }
    if (this.seen.has(mid)) return false;
    this.seen.add(mid);
    return true;
  }
}

/** The quota as the Conversation's `allow` and the model call see it. `get` and `set` reach the page's pet data; `save` writes it at once, so that a restart soon
 *  after a charge does not give the call back (ADR-0165: restarting never refills). */
export interface QuotaHost { get(): PetData; set(d: PetData): void; save(): void; now(): number; duo: boolean }

export function quota(h: QuotaHost) {
  const scale = h.duo ? DUO_CAP_SCALE : 1;
  return {
    /** "ok", "cooldown" or "cap", for one more chat request now. */
    gate: () => aiGate(h.get(), "chat", h.now(), scale),
    /** One request is about to be issued: it is counted now, before it can fail (ADR-0167, row 14d). */
    charge() { h.set(recordAi(h.get(), "chat", h.now())); h.save(); },
    /** The provider said rate limit: no request until the cooldown ends (row 14d). */
    rateLimited() { h.set(coolDown(h.get(), h.now())); h.save(); },
  };
}

/** A request through the quota: charged once before it is issued; a rate limit starts the cooldown; the failure is passed on (the pet then makes its gesture). */
export async function chargedRequest<T>(q: ReturnType<typeof quota>, request: () => Promise<T>, kindOf: (e: unknown) => string): Promise<T> {
  q.charge();
  try {
    return await request();
  } catch (e) {
    if (kindOf(e) === "rate_limit") q.rateLimited();
    throw e;
  }
}
