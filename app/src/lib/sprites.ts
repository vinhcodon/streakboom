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
  // reactions to what the pet says (see moodPose)
  | "nod" // a small nod: nothing special
  | "smirk" // playful teasing
  | "gasp" // surprise
  | "notice" // looks toward the user's work, ears up, a moment before it makes way (PC-2)
  | "curious" // head tilted, eyes up
  | "sad" // ears down, eyes low: sympathy
  | "climb" // up or down a vertical surface, paws over paws (spec/10, TT-14)
  | "cling" // holds on to the wall and rests
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
  wake: { ms: 1700 }, // a real stretch: 650 ms read as a turn to the side and a snap back to standing
  purr: { ms: 2400 },
  huff: { ms: 1500 },
  nod: { ms: 550 },
  smirk: { ms: 1900 },
  gasp: { ms: 1400 },
  notice: { ms: 900 }, // a safety net: the page normally moves on after about 0.4 s (NOTICE_MS in +page.svelte)
  curious: { ms: 2100 },
  sad: { ms: 2800 },
};

/** The feelings a chat answer can carry (the model names one; see brain.rs). */
export const MOODS = ["neutral", "happy", "warm", "sassy", "surprised", "curious", "sad"] as const;
export type Mood = (typeof MOODS)[number];

/**
 * The body language for an answer's mood. Anything unknown is a plain nod, so an answer never
 * triggers a big reaction by accident. Sarcasm is dropped in the gentle tone.
 */
export function moodPose(mood: string | undefined, gentle: boolean): PetState {
  switch (mood) {
    case "happy":
      return "happy";
    case "warm":
      return "purr";
    case "sassy":
      return gentle ? "nod" : "smirk";
    case "surprised":
      return "gasp";
    case "curious":
      return "curious";
    case "sad":
      return "sad";
    default:
      return "nod";
  }
}

/**
 * A sleeping pet never jumps straight into another pose: it wakes up first (stretch, eyes
 * open) and then carries on. Being picked up is the one exception (a startle is fine).
 */
export const needsWakeFirst = (from: PetState, to: PetState): boolean =>
  from === "sleep" && to !== "sleep" && to !== "wake" && to !== "drowsy" && to !== "held";

/** Asleep or dozing off: the pet must not start an unprompted line now (a sleeping cat does not talk). */
export const isDozing = (p: PetState): boolean => p === "sleep" || p === "drowsy";
