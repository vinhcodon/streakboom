// How the pet's answer appears in the bubble: word by word, each word fading in, with a
// longer pause after punctuation, roughly the rhythm of a chat assistant streaming a reply.
// (Pure helpers so the rhythm is testable; the bubble page runs the timer.)

/** Split into words, each keeping its trailing whitespace so joining them restores the text. */
export function words(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [];
}

export const WORD_MS = 110; // base pause between words
export const COMMA_MS = 120; // extra after , ; :
export const STOP_MS = 260; // extra after . ! ? …

/** Pause before showing the word that follows `word`. */
export function pauseAfter(word: string): number {
  const w = word.trimEnd();
  if (/[.!?…]["')\]]*$/.test(w)) return WORD_MS + STOP_MS;
  if (/[,;:]["')\]]*$/.test(w)) return WORD_MS + COMMA_MS;
  return WORD_MS;
}

/** Total time to reveal everything (used to cap very long answers). */
export function totalMs(ws: string[]): number {
  return ws.reduce((a, w) => a + pauseAfter(w), 0);
}

/**
 * Speed factor so a long answer does not take forever: 1 up to `capMs`, then faster so the
 * whole reveal fits in `capMs` (never slower than normal).
 */
export function speedFor(ws: string[], capMs = 6000): number {
  const t = totalMs(ws);
  return t > capMs ? t / capMs : 1;
}
