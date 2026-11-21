// The duo scenes (ADR-0139, job C of docs/handoff/duo-prototype-and-cross-review.md): two pets, one shared ball, wordless, no bubble.
// Pure logic. A scene is a list of beats on a clock; the Director runs one at a time, only when both pets are out, spends the existing
// attention rule (attention.ts `mayAct`) and one slot of the shared reaction gate (the caller does `startReaction`), cancels at once when the
// person touches a pet or a pet goes in, and gives every scene a token so that a late callback can never bring back a pet that has gone in.
// Positions are on a floor strip, -1 (left end) to 1 (right end) around the centre of the stage; the window code turns them into pixels.
import { mayAct, type Mode } from "./attention.ts";
import type { PetId } from "./duo.ts";

export type Actor = PetId | "ball" | "cushion";
export type Act =
  | "walk"   // go to `to`
  | "face"   // turn to `to` (-1 left, 1 right, 0 the other pet), or to the person (front view) when `to` is "front"
  | "nudge"  // push the object a little, towards `to`
  | "carry"  // pick the object up (it moves with the pet)
  | "drop"   // put the object down where the pet is
  | "rest"   // lay the head on the object / lie by it
  | "shift"  // step aside, away from the other pet
  | "wait";  // stand still

export interface Beat { t: number; who: Actor; act: Act; to?: number | "front"; obj?: "ball" | "cushion" }
export interface Scene { id: string; pets: readonly [PetId, PetId]; beats: readonly Beat[]; durationMs: number }

/** Scene 1: Paws sets the ball down neatly; Peak takes it for a pillow; Paws looks for something else to put under Peak's head, to get the ball back. */
export const TIDY_BALL: Scene = {
  id: "tidy-ball", pets: ["paws", "peak"], durationMs: 24_000,
  beats: [
    { t: 0, who: "ball", act: "wait", to: 0 },
    { t: 500, who: "paws", act: "walk", to: -0.2 },
    { t: 3000, who: "paws", act: "nudge", to: 0, obj: "ball" },     // sets the ball in the middle
    { t: 4500, who: "paws", act: "face", to: "front" },             // stands straight, pleased
    { t: 7000, who: "peak", act: "walk", to: 0.1 },
    { t: 9000, who: "peak", act: "carry", obj: "ball" },            // takes the ball...
    { t: 10500, who: "peak", act: "rest", obj: "ball" },            // ...and lays its head on it
    { t: 12500, who: "paws", act: "walk", to: -0.8 },               // consequence: Paws goes to find something else
    { t: 15500, who: "paws", act: "carry", obj: "cushion" },
    { t: 17000, who: "paws", act: "walk", to: -0.1 },
    { t: 19000, who: "paws", act: "drop", obj: "cushion" },         // offers the cushion
    { t: 20500, who: "peak", act: "shift", to: 0.6 },               // Peak moves off, leaving the ball
    { t: 22000, who: "paws", act: "carry", obj: "ball" },           // Paws takes the ball back and tidies it
  ],
};

/** Scene 2: Peak shifts away; Paws does not follow; a few seconds later Peak comes back by itself. */
export const SHIFT_AWAY: Scene = {
  id: "shift-away", pets: ["paws", "peak"], durationMs: 16_000,
  beats: [
    { t: 0, who: "paws", act: "face", to: "front" },
    { t: 1500, who: "peak", act: "shift", to: 0.7 },
    { t: 3500, who: "paws", act: "wait" },                          // Paws does not chase
    { t: 9000, who: "peak", act: "walk", to: 0.25 },                // Peak comes back on its own
    { t: 12000, who: "peak", act: "face", to: 0 },
  ],
};

/** Scene 3: Paws pushes the ball, it rolls; Peak watches, then stops it with a paw. The reaction comes after the action, with a delay. */
export const ROLL: Scene = {
  id: "roll", pets: ["paws", "peak"], durationMs: 14_000,
  beats: [
    { t: 0, who: "paws", act: "walk", to: -0.5 },
    { t: 2500, who: "paws", act: "nudge", to: 1, obj: "ball" },     // action
    { t: 3000, who: "peak", act: "face", to: -1 },                  // Peak sees it only after a beat
    { t: 5500, who: "peak", act: "walk", to: 0.4 },                 // consequence: Peak steps to the ball
    { t: 7500, who: "peak", act: "nudge", to: -1, obj: "ball" },    // stops it and sends it back
    { t: 10000, who: "paws", act: "face", to: "front" },
  ],
};

export const SCENES: readonly Scene[] = [TIDY_BALL, SHIFT_AWAY, ROLL];

/** At least this long between the end of one scene and the start of the next. */
export const SCENE_GAP_MS = 5 * 60_000;

export type CancelReason = "touch" | "tuck" | "busy" | "work" | "hidden" | "end";

export interface DirectorState {
  token: number;            // 0 means no scene
  scene: Scene | null;
  startedAt: number;
  next: number;             // index of the next beat to deliver
  lastEndedAt: number;
  rotation: number;         // which scene comes next
}
export const newDirector = (): DirectorState => ({ token: 0, scene: null, startedAt: 0, next: 0, lastEndedAt: -Infinity, rotation: 0 });

export interface StartContext {
  now: number;
  mode: Mode;
  quiet: boolean;
  /** a reaction of the shared gate is running (reactions.ts `Gate.active`), or the person is busy / fullscreen */
  reactionActive: boolean;
  busy: boolean;
  reducedMotion: boolean;
  out: readonly PetId[];
}

/** Whether a scene may start now. The caller then spends one slot of the shared gate (`startReaction`), so scenes never add a second quota. */
export function mayStart(d: DirectorState, c: StartContext): boolean {
  if (d.scene || c.reactionActive || c.busy || c.reducedMotion) return false;
  if (!c.out.includes("peak") || !c.out.includes("paws") || c.out.length !== 2) return false;
  if (c.now - d.lastEndedAt < SCENE_GAP_MS) return false;
  return mayAct(c.mode, 1, "own", c.quiet);
}

export function start(d: DirectorState, c: StartContext, pick?: Scene): { state: DirectorState; token: number } | null {
  if (!mayStart(d, c)) return null;
  const scene = pick ?? SCENES[d.rotation % SCENES.length];
  const token = d.token + 1;
  return { state: { ...d, token, scene, startedAt: c.now, next: 0, rotation: d.rotation + 1 }, token };
}

/** The beats that have come due, in order. Nothing for a token that is not the current one (a stale callback). */
export function due(d: DirectorState, token: number, now: number): { state: DirectorState; beats: Beat[]; ended: boolean } {
  if (!d.scene || token !== d.token) return { state: d, beats: [], ended: false };
  const at = now - d.startedAt;
  const beats: Beat[] = [];
  let next = d.next;
  while (next < d.scene.beats.length && d.scene.beats[next].t <= at) beats.push(d.scene.beats[next++]);
  const ended = at >= d.scene.durationMs;
  if (ended) return { state: { ...d, scene: null, next, lastEndedAt: now }, beats, ended: true };
  return { state: { ...d, next }, beats, ended: false };
}

/** Whether a callback of `token` may still act. A pet that has gone in must never be brought back by an old timer. */
export const isLive = (d: DirectorState, token: number): boolean => d.scene !== null && token === d.token;

/** The scene ends at once. What the window code must do: both pets stand still where they are, the ball and the cushion are put down
 *  or removed, and nothing is said. A touch from the person does not start a reaction aimed at the person. */
export function cancel(d: DirectorState, now: number, _reason: CancelReason): { state: DirectorState; wasRunning: boolean } {
  if (!d.scene) return { state: d, wasRunning: false };
  return { state: { ...d, scene: null, token: d.token + 1, lastEndedAt: now }, wasRunning: true };
}

/** After every change of who is out: a scene needs both. */
export function onOutChanged(d: DirectorState, now: number, out: readonly PetId[]): { state: DirectorState; wasRunning: boolean } {
  return out.length === 2 ? { state: d, wasRunning: false } : cancel(d, now, "tuck");
}
