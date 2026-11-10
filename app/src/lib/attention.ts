// The attention mode (spec/11 section 3, the charter's article 2, ADR-0047): is the person working, resting, or playing with
// Peak? Pure logic, no I/O and no timers: the page feeds it what it already reads (the time since the last input, whether the
// pointer is near the cat) and the moments the person touches Peak, and acts on the answer.
//
//   work: the person is active and not with Peak (or nothing is known). Still things only; Peak makes way, says nothing.
//   free: nothing has been touched for a good while (reading, away): unhurried things, a perch, a short unprompted line.
//   play: the person touched Peak; it ends after PLAY_FOR_MS, or after WORK_BREAKS_PLAY_MS of working elsewhere.
//
// The rule that decides every doubt: **when unsure, work**. A false play (Peak lively beside someone who is working) costs
// their attention; a false work costs one touch to correct, because the touch itself is what starts play.

/** Idle this long without any input and the person is resting rather than pausing between two words. */
export const FREE_AFTER_MS = 45_000;
/** A touch starts play and it lasts this long unless it is renewed by another touch. */
export const PLAY_FOR_MS = 120_000;
/** Input elsewhere (the pointer far from the cat) for this long ends play. */
export const WORK_BREAKS_PLAY_MS = 20_000;
/** Input within this long ago is "the person is active" (the same number as focus.ts's ACTIVE_MS). */
export const ACTIVE_NOW_MS = 3_000;

export type Mode = "work" | "free" | "play";

export interface AttentionState {
  /** Play lasts until this time (ms); 0 or in the past: no play. */
  playUntil: number;
  /** Since when the person has been working away from the cat without a break (ms), or null. */
  awaySince: number | null;
}

export const initialAttention = (): AttentionState => ({ playUntil: 0, awaySince: null });

export interface AttentionInput {
  /** Ms since the last keyboard or mouse input; null when unknown. */
  idleMs: number | null;
  /** The pointer is near the cat or over it (the person may be with Peak); false when far; null when unknown. */
  pointerNear: boolean | null;
}

/** The person touched Peak (a stroke, a poke, a drag, the chat opened): play begins or is renewed. */
export function touched(s: AttentionState, now: number): AttentionState {
  return { playUntil: now + PLAY_FOR_MS, awaySince: null };
}

/** The mode now, and the state to keep. */
export function stepAttention(s: AttentionState, input: AttentionInput, now: number): { state: AttentionState; mode: Mode } {
  let { playUntil, awaySince } = s;
  const active = input.idleMs !== null && input.idleMs < ACTIVE_NOW_MS;
  if (playUntil > now) {
    // working somewhere else (input, the pointer known to be far) for long enough ends the play
    if (active && input.pointerNear === false) {
      awaySince ??= now;
      if (now - awaySince >= WORK_BREAKS_PLAY_MS) {
        playUntil = 0;
        awaySince = null;
      }
    } else {
      awaySince = null;
    }
  } else {
    playUntil = 0;
    awaySince = null;
  }
  const state = { playUntil, awaySince };
  if (playUntil > now) return { state, mode: "play" };
  if (input.idleMs !== null && input.idleMs >= FREE_AFTER_MS) return { state, mode: "free" };
  return { state, mode: "work" };
}

/** How sudden a thing is (spec/11 section 2): the cost to the person beside Peak. */
export type Tier = 0 | 1 | 2 | 3;
/** Why it is done: by its own wish, to get out of the person's way (or from under a cover), or because the world or the person caused it. */
export type Cause = "own" | "way" | "caused";

/**
 * May Peak do a thing of this tier now? Still things (tier 0) always. Unhurried and brisk things by its own wish only when the
 * person is not working; to get out of the way, always (that is what it is for). A sudden thing (tier 3) only when something
 * caused it, never by its own wish, in any mode. `quiet` (Quiet mode) allows still things only.
 */
export function mayAct(mode: Mode, tier: Tier, cause: Cause, quiet = false): boolean {
  if (tier === 0) return true;
  if (quiet) return false;
  if (tier === 3) return cause === "caused";
  if (cause === "way" || cause === "caused") return true;
  return mode !== "work"; // by its own wish: unhurried and brisk things wait for free or play
}

/** May an unprompted line be said now? Not while the person is working; a reply to a touch is not asked about here. */
export const mayChatter = (mode: Mode): boolean => mode !== "work";

/** Should a reaction caused by the world (a lost seat) be silent: no cry, no bubble, no remark? In work it is. */
export const silentReaction = (mode: Mode): boolean => mode === "work";
