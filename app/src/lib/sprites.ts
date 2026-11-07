// The pet's poses. The art itself is the vector rig in Pet.svelte; the rest of the app only
// needs the pose names and how long the one-shot poses last.

export type PetState = "idle" | "look" | "walk" | "sleep" | "held" | "happy" | "think" | "land";

/** Poses that play once and then return to idle (ms). Others last until changed. */
export const ONE_SHOT_MS: Partial<Record<PetState, number>> = {
  look: 1700,
  happy: 1200,
  land: 400,
  think: 60_000, // a safety net: thinking normally ends when the answer arrives
};
