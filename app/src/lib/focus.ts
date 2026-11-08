// Focus-safety (spec/06 section 3, ADR-0029): when must the cat keep still, keep quiet or fade because the
// user is working near it? Pure logic, no I/O and no timers: the pet window feeds it a probe (about once a
// second, and before a walk or an unprompted line) and acts on the answer.
//
// The only signals are how long ago the user last did anything (one number, no key identity: not a hook) and
// where the pointer is relative to the cat. Nothing is stored; the state below is two small values.

/** Constants of the first version (agreed as starting values, spec/06 D7); tuned in the manual checks. */
export const ACTIVE_MS = 3000; // input within this long ago = the user is active
export const CALM_MS = 5000; // the cat starts a walk only after this long without input
export const LINE_MS = 6000; // an unprompted line is spoken only after this long without input
export const NEAR_PX = 200; // logical px from the cat's centre: "near"
export const GHOST_ON_MS = 300; // active and near for this long before the cat fades
export const GHOST_OFF_MS = 1500; // no input for this long and the cat comes back
export const GHOST_ALPHA = 0.35; // opacity while faded

export interface FocusInput {
  /** Milliseconds since the last keyboard or mouse input; null or not a number = unknown (no restriction). */
  idleMs: number | null;
  /** Where the pointer is relative to the cat; null = unknown. `over` = it is on the cat itself. */
  pointer: { dist: number; over: boolean } | null;
  /** Fullscreen, presentation or locked (the existing `is_busy`): the cat is not shown or does not fade. */
  busy: boolean;
  /** Quiet mode: the pet sleeps and says nothing. */
  quiet: boolean;
}

/** The two values the decision remembers between probes. */
export interface FocusState {
  ghost: boolean;
  /** When "active and near" started to hold without a break; null if it does not hold now. */
  nearSince: number | null;
}

export interface FocusOut {
  /** May the cat start (or keep) a walk? Walks end within a tick when this turns false. */
  walkAllowed: boolean;
  /** May a walk in progress go on? False only when the user is active and the pointer is near the cat (or unknown):
   *  working far away from the cat is no reason to stop it in the middle of a step. */
  keepWalking: boolean;
  /** May an unprompted line be shown now? When false it waits and is tried again later. */
  speakAllowed: boolean;
  /** Fade the cat and let clicks pass through it. */
  ghost: boolean;
  /** The opacity to show: 1, or GHOST_ALPHA while faded. */
  alpha: number;
  /** The user did something within ACTIVE_MS: a walk in progress should stop, a hop should wait. */
  active: boolean;
}

export const initialFocus = (): FocusState => ({ ghost: false, nearSince: null });

const known = (n: number | null): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

/**
 * One probe. Returns the new state and the answer. `now` is any monotonic clock in ms (only differences
 * matter). The previous state is not modified.
 *
 * - walkAllowed: the user has been idle for CALM_MS (to start a walk).
 * - keepWalking: a walk in progress stops only if the user is active and the pointer is near the cat (or unknown).
 * - speakAllowed: the user has been idle for LINE_MS.
 * - ghost: turns on when the user did something within GHOST_OFF_MS and the pointer is near (and not on the cat)
 *   for GHOST_ON_MS; turns off at once when the pointer is on the cat or far or unknown, or when the user has been
 *   idle for GHOST_OFF_MS.
 *   Fullscreen, presentation, a locked session and Quiet mode keep it off (those rules already hide the cat).
 * - unknown idle time: no restriction at all (a platform without the probe behaves as before).
 */
export function decideFocus(prev: FocusState, input: FocusInput, now: number): { state: FocusState; out: FocusOut } {
  const idle = input.idleMs;
  if (!known(idle)) return done({ ghost: false, nearSince: null }, true, true, false, true);

  const active = idle < ACTIVE_MS;
  const walkAllowed = idle >= CALM_MS;
  const close = input.pointer !== null && Number.isFinite(input.pointer.dist) && input.pointer.dist < NEAR_PX; // on the cat counts as close
  const keepWalking = !(active && (input.pointer === null || close)); // unknown pointer: be careful
  const speakAllowed = idle >= LINE_MS;

  const p = input.pointer;
  const near = p !== null && Number.isFinite(p.dist) && !p.over && p.dist < NEAR_PX;
  const hidden = input.busy || input.quiet;

  if (hidden || !near) return done({ ghost: false, nearSince: null }, walkAllowed, speakAllowed, active, keepWalking);

  if (prev.ghost) {
    // already faded: stay so while the user keeps working near it; come back when they stop
    if (idle >= GHOST_OFF_MS) return done({ ghost: false, nearSince: null }, walkAllowed, speakAllowed, active, keepWalking);
    return done({ ghost: true, nearSince: prev.nearSince }, walkAllowed, speakAllowed, active, keepWalking);
  }

  // Fading needs the user to be working right now: the same limit that brings the cat back (GHOST_OFF_MS), so it
  // cannot fade again in the gap between "come back" and "no longer active" (that would flicker).
  if (idle >= GHOST_OFF_MS) return done({ ghost: false, nearSince: null }, walkAllowed, speakAllowed, active, keepWalking);
  const since = prev.nearSince ?? now;
  const ghost = now - since >= GHOST_ON_MS;
  return done({ ghost, nearSince: since }, walkAllowed, speakAllowed, active, keepWalking);
}

function done(state: FocusState, walkAllowed: boolean, speakAllowed: boolean, active: boolean, keepWalking: boolean): { state: FocusState; out: FocusOut } {
  return { state, out: { walkAllowed, keepWalking, speakAllowed, ghost: state.ghost, alpha: state.ghost ? GHOST_ALPHA : 1, active } };
}
