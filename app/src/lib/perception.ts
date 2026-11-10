// What Peak believes about the space around it (spec/08 sections 1 and 3, PC-1, ADR-0031): the readings of the senses
// (the focus probe, the typing lane, the ground) merged into one belief with a confidence, and the response that belief
// calls for: nothing, a reflex (look, ears up) or an intent (walk away, hop). A *fact* (the pointer is right by the cat
// and the user is typing) calls for the intent at once; a *guess* (the predicted caret reaches the cat) calls for the
// reflex first and for the intent only when it has held for a moment (hysteresis), so a flickering guess never moves
// the cat. Pure. The decisions of `focus.ts` and `lane.ts` still make the cat move; this module is the single place that
// says how sure Peak is, used for the debugger and the trail now and for the decisions as each is moved here.

import type { FocusOut } from "./focus.ts";
import type { LaneOut } from "./lane.ts";
import type { GroundKind } from "./groundmap.ts";

export type Crowd = "pointer" | "lane" | null;
export type Response = "none" | "reflex" | "intent";

export interface Belief {
  /** The user has been working near the cat: by the pointer (a fact) or by the predicted caret (a guess). */
  crowded: Crowd;
  /** 0..1: how sure Peak is that it is in the way. A fact is 1; a guess grows with the probes it has held for. */
  confidence: number;
  /** The user is active now (input within a few seconds). */
  userActive: boolean;
  /** What is under the cat's feet, if known. */
  ground: GroundKind | null;
}

export interface BeliefState {
  /** Consecutive probes in which the lane guess said "crowded". */
  laneStreak: number;
}

export const startBelief = (): BeliefState => ({ laneStreak: 0 });

/** Probes in a row the lane guess must hold before it counts as sure (a probe is about a quarter of a second while engaged). */
export const LANE_SURE_PROBES = 3;
/** The confidence at or above which the cat acts (the intent); below it only a reflex. */
export const INTENT_CONFIDENCE = 0.8;

/**
 * One reading in, one belief out. The pointer being near the cat while the user is active is a fact (confidence 1). The
 * lane (where the text may be heading) is a guess: its confidence is the share of `LANE_SURE_PROBES` it has held for,
 * capped below the intent threshold until it has held for all of them.
 */
export function believe(state: BeliefState, focus: FocusOut, lane: LaneOut, ground: GroundKind | null): { state: BeliefState; belief: Belief } {
  const streak = lane.crowded ? state.laneStreak + 1 : 0;
  const next: BeliefState = { laneStreak: streak };
  let crowded: Crowd = null;
  let confidence = 0;
  if (focus.crowded) {
    crowded = "pointer";
    confidence = 1;
  } else if (lane.crowded) {
    crowded = "lane";
    confidence = streak >= LANE_SURE_PROBES ? 0.9 : Math.min(0.7, (streak / LANE_SURE_PROBES) * 0.9);
  }
  return { state: next, belief: { crowded, confidence, userActive: focus.active, ground } };
}

/** What the belief calls for: nothing, a reflex (the cat shows it noticed), or the intent (it acts). */
export function responseFor(b: Belief): Response {
  if (b.crowded === null) return "none";
  return b.confidence >= INTENT_CONFIDENCE ? "intent" : "reflex";
}
