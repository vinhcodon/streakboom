// How fast the pet window moves while the cat walks, so the window and the legs agree: the window eases in as the
// legs start and eases out as they stop, instead of starting and stopping at full speed (a slide, then a jolt).
// Pure functions; the pet window applies them to the steps it asks Rust to move.

export const RAMP_IN_MS = 500; // from standing to the full walking speed
export const GLIDE_MS = 600; // from the full speed to a stop

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** The share of the full speed `ms` after a walk started (smooth from 0 to 1). */
export const rampIn = (ms: number): number => {
  const k = clamp01(ms / RAMP_IN_MS);
  return k * k * (3 - 2 * k);
};

/** The share of the full speed `ms` after the decision to stop (smooth from 1 to 0). */
export const glideOut = (ms: number): number => {
  const k = clamp01(ms / GLIDE_MS);
  return (1 - k) * (1 - k);
};

/**
 * Whole pixels to move this tick when the wanted movement is fractional: the remainder is carried to the next
 * tick, so a slow speed still moves smoothly (some ticks 0 px, some 1 px) instead of rounding to nothing or to a jump.
 */
export function takeSteps(carry: number, want: number): { move: number; carry: number } {
  const total = carry + want;
  const move = Math.trunc(total);
  return { move, carry: total - move };
}
