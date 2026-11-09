// Beats (spec/09, ADR-0041): how a reaction is shown *in time*. A beat is a short script of poses and the moment the
// words begin; the page runs it. The shape of a feeling is written once here, not once per event. Pure data and two
// small functions, so it can be tested without the rig.

import type { PetState } from "./sprites.ts";

export interface BeatStep {
  /** The pose held during this step. */
  pose: PetState;
  /** How long it is held, in ms. */
  ms: number;
  /** If set, the words begin this many ms into the step (never in the first step at 0: the body moves first). */
  sayAt?: number;
}

export interface Beat {
  id: string;
  steps: BeatStep[];
}

/**
 * A sudden loss (the floor goes): the cat freezes with its ears up for a moment, then jolts (the startled jump of the
 * `gasp` pose) and cries out a moment after the jolt begins, and holds the startled face while it takes in what happened;
 * the page then acts (it falls). Total 0.85 s, words 270 ms in.
 */
export const STARTLE: Beat = {
  id: "startle",
  steps: [
    { pose: "notice", ms: 150 },
    { pose: "gasp", ms: 700, sayAt: 120 },
  ],
};

/** The words follow the body (RX-3a): the pose starts, and the words come `delayMs` later. One step; the page uses
 * `wordsDelay` and the pose's own timer, so this is only the description used by the tests and the docs. */
export const afterBody = (id: string, pose: PetState, delayMs: number): Beat => ({ id, steps: [{ pose, ms: delayMs + 1, sayAt: delayMs }] });

/** Total length of a beat in ms. */
export const beatMs = (b: Beat): number => b.steps.reduce((s, x) => s + x.ms, 0);

/** Ms from the start of the beat to the moment the words begin (null: the beat has no words). */
export function wordsAtMs(b: Beat): number | null {
  let t = 0;
  for (const s of b.steps) {
    if (s.sayAt !== undefined) return t + s.sayAt;
    t += s.ms;
  }
  return null;
}

/** The delays after which the words follow the body for the reflexes that speak (RX-3a), in ms: the first guesses, to
 * be judged by eye on a test build. */
export const WORDS_DELAY_MS = {
  click: 150, // a poke
  pet: 200, // a head scratch
  belly: 500, // a belly rub enjoyed: after the purr has settled
  huff: 250, // the belly trap: the flinch first
  named: 200, // being named or called by name
} as const;
