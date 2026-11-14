// The one-time hint after repeated pushes (ADR-0109, IM-4): a person who pushes Peak again and again is probably saying
// "move"; Peak says once, in its whole life, that they can also say it. Pure: the page keeps the push times in memory and
// the "said" time in `data.said`, which is saved. No setting.

export const HINT_PUSHES = 3; // pushes ...
export const HINT_WINDOW_MS = 25_000; // ... within this long

/** The push times still inside the window, with `now` added. */
export function recordPush(times: readonly number[], now: number): number[] {
  return [...times.filter((t) => now - t < HINT_WINDOW_MS && t <= now), now];
}

/** Is it time for the hint? Enough recent pushes, and it was never said (a time in `said.hintaside`). */
export function shouldHintAside(times: readonly number[], said: Record<string, number>): boolean {
  return times.length >= HINT_PUSHES && !said.hintaside;
}
