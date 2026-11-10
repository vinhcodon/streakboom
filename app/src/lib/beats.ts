// Beats (spec/09, ADR-0041): how a reaction is shown *in time*. A beat is a short script of poses and the moment the
// words begin; each beat also has a home point in the space of the five appraisal axes, so that a reaction can be chosen
// by what an event feels like instead of by a rule per event (`choose.ts`). Pure data and two small functions.

import type { PetState } from "./sprites.ts";

/** How an event reads for Peak, five numbers (spec/09 section 2.2). */
export interface Appraisal {
  /** 0..1: how unexpected. */
  surprise: number;
  /** -1..1: pleasant to unpleasant. */
  valence: number;
  /** 0..1: how much energy it calls for. */
  arousal: number;
  /** 0..1: does it concern the user (1) or only Peak (0). */
  aboutUser: number;
  /** 0..1: could Peak have done something (1) or does it just happen to it (0). */
  control: number;
}

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
  /** Where this beat sits in the appraisal space: the events nearest to it are shown with it. */
  home: Appraisal;
  steps: BeatStep[];
}

const a = (surprise: number, valence: number, arousal: number, aboutUser: number, control: number): Appraisal => ({ surprise, valence, arousal, aboutUser, control });

/**
 * A sudden loss (the floor goes): the cat freezes with its ears up for a moment, then jolts (the startled jump of the
 * `gasp` pose) and cries out a moment after the jolt begins, and holds the startled face while it takes in what happened;
 * the page then acts (it falls). Total 0.85 s, words 270 ms in.
 */
export const STARTLE: Beat = {
  id: "startle",
  home: a(0.95, -0.5, 0.9, 0.3, 0.05),
  steps: [
    { pose: "notice", ms: 150 },
    { pose: "gasp", ms: 700, sayAt: 120 },
  ],
};

/**
 * The beats. The single-step ones play a pose that lasts as long as its timed pose does (`TIMED` in sprites.ts), with the
 * words a moment after the body moves (RX-3a); the durations here only describe that and are not used to time it.
 */
export const BEATS: Beat[] = [
  STARTLE,
  { id: "flinch", home: a(0.7, -0.6, 0.6, 1, 0.2), steps: [{ pose: "huff", ms: 1500, sayAt: 250 }] }, // the belly was a trap
  { id: "perk", home: a(0.25, 0.3, 0.4, 1, 0.6), steps: [{ pose: "happy", ms: 1200, sayAt: 150 }] }, // a poke
  { id: "glad", home: a(0.15, 0.8, 0.4, 1, 0.7), steps: [{ pose: "happy", ms: 1200, sayAt: 200 }] }, // a scratch, being named
  { id: "purr", home: a(0.15, 0.9, 0.15, 1, 0.6), steps: [{ pose: "purr", ms: 2400, sayAt: 500 }] }, // a belly rub it enjoys
  { id: "surprise", home: a(0.8, 0.3, 0.7, 0.5, 0.3), steps: [{ pose: "gasp", ms: 1400 }] }, // a pleasant surprise, the "surprised" mood
  { id: "smirk", home: a(0.2, 0.2, 0.5, 1, 0.9), steps: [{ pose: "smirk", ms: 1900 }] }, // playful teasing
  { id: "curious", home: a(0.5, 0.4, 0.5, 0.5, 0.5), steps: [{ pose: "curious", ms: 2100 }] },
  { id: "sad", home: a(0.1, -0.8, 0.1, 0.5, 0.2), steps: [{ pose: "sad", ms: 2800 }] },
  { id: "nod", home: a(0.05, 0, 0.1, 0.5, 0.5), steps: [{ pose: "nod", ms: 550 }] }, // nothing special
];

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
