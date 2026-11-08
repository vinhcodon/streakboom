// The pet's poses. The art itself is the canvas rig in PetRig.svelte (rig/); the rest of the app only
// needs the pose names and how the timed poses chain into one another.

export type PetState =
  | "idle"
  | "look"
  | "walk"
  | "sleep"
  | "held"
  | "happy"
  | "think"
  | "land"
  | "drowsy" // eyes droop and it yawns, on the way to sleep
  | "purr" // belly rub: eyes closed in bliss, a slow sway
  | "huff" // the belly rub was a trap: flinch, half-lidded glare, tail flick
  | "wake"; // stretches and opens its eyes, on the way out of sleep

export interface TimedPose {
  ms: number;
  /** Pose to go to afterwards (default: idle, or sleep when Quiet mode is on). */
  next?: PetState;
}

/** Poses that play for a while and then move on. Others last until something changes them. */
export const TIMED: Partial<Record<PetState, TimedPose>> = {
  look: { ms: 1700 },
  happy: { ms: 1200 },
  land: { ms: 400 },
  think: { ms: 60_000 }, // a safety net: thinking normally ends when the answer arrives
  drowsy: { ms: 900, next: "sleep" },
  wake: { ms: 650 },
  purr: { ms: 2400 },
  huff: { ms: 1500 },
};

/**
 * A sleeping pet never jumps straight into another pose: it wakes up first (stretch, eyes
 * open) and then carries on. Being picked up is the one exception (a startle is fine).
 */
export const needsWakeFirst = (from: PetState, to: PetState): boolean =>
  from === "sleep" && to !== "sleep" && to !== "wake" && to !== "drowsy" && to !== "held";
