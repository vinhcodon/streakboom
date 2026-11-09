// Escalation of a repeated action (LN-2, spec/09 section 11): the same poke, scratch or belly rub repeated within a short
// time moves through stages, each with its own lines. The counter lives in memory only (it is not saved and sends nothing).

export interface Repeat {
  /** How many times in a row (each one spoken). */
  n: number;
  /** When the last one was. */
  t: number;
}

/** How long a pause ends a run of repeats, per action, in ms. */
export const REPEAT_WINDOW_MS = {
  click: 25_000, // pokes
  pet: 40_000, // head scratches
  belly: 40_000, // belly rubs
} as const;
export type RepeatKind = keyof typeof REPEAT_WINDOW_MS;

/** The run after one more: it continues if the last one was within the window, else it starts over at 1. */
export function bump(prev: Repeat | undefined, now: number, windowMs: number): Repeat {
  return prev && now - prev.t >= 0 && now - prev.t < windowMs ? { n: prev.n + 1, t: now } : { n: 1, t: now };
}

/** The stage of the n-th repeat in a run: 1 ordinary (1 to 3), 2 (4 to 6), 3 (7 to 9), 4 (10 and more). */
export function stageFor(n: number): 1 | 2 | 3 | 4 {
  return n >= 10 ? 4 : n >= 7 ? 3 : n >= 4 ? 2 : 1;
}
