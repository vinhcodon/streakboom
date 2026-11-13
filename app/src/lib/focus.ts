// Focus-safety (spec/06 section 3, ADR-0029, ADR-0030): when must the cat keep still, keep quiet or make way because
// the user is working near it? Pure logic, no I/O and no timers: the pet window feeds it a probe (when a decision
// is needed, and a few times a second while the user may be working near the cat) and acts on the answer.
//
// The only signals are how long ago the user last did anything (one number, no key identity: not a hook) and
// where the pointer is relative to the cat. Nothing is stored; the state below is two small values.
//
// The first version made the cat fade when the user worked near it; the author found a see-through cat unnatural
// (2026-11-09), so the answer is now "crowded": the cat gets up and walks away from the user's work, and curls up
// where it is if it cannot (decided in the page, `leave` in `+page.svelte`).

/** Constants of the first version (agreed as starting values, spec/06 D7); tuned in the manual checks. */
export const ACTIVE_MS = 3000; // input within this long ago = the user is active
export const CALM_MS = 5000; // the cat starts a walk only after this long without input
export const LINE_MS = 6000; // an unprompted line is spoken only after this long without input
export const NEAR_PX = 200; // logical px from the cat's centre: "near"
export const CROWD_MS = 1200; // active and near, pointer still, for this long before the cat feels crowded
export const CROWD_OFF_MS = 1500; // no input for this long and it no longer feels crowded
export const LEAVE_PX = 260; // the cat walks away until the pointer is at least this far (logical px)
export const SLEEP_CROWD_MS = 4000; // a sleeping cat's senses are dull: it wakes only after being crowded this long
export const LEAVE_MIN_ROOM_PX = 120; // room to walk the chosen way; less than this and the cat curls up instead

/**
 * Should a sleeping (or dozing) cat wake up and make way? Only if it has been crowded for several seconds (a distant
 * or passing pointer does not wake it) **and** it could actually leave: with no room to walk away it stays curled up,
 * because waking would only put it in the same place awake (spec/08, ADR-0031).
 */
export function wakesToMakeWay(asleep: boolean, crowdedForMs: number | null, roomPx: number): boolean {
  return asleep && crowdedForMs !== null && crowdedForMs >= SLEEP_CROWD_MS && roomPx >= LEAVE_MIN_ROOM_PX;
}

export interface FocusInput {
  /** Milliseconds since the last keyboard or mouse input; null or not a number = unknown (no restriction). */
  idleMs: number | null;
  /** Where the pointer is relative to the cat; null = unknown. `over` = it is on the cat itself. `moving` = the
   *  pointer has been moving just now: the user is reaching for something (perhaps the cat), not typing.
   *  `dx` = the pointer's offset to the right of the cat's centre (negative = to the left). */
  pointer: { dist: number; over: boolean; moving?: boolean; dx?: number } | null;
  /** Fullscreen, presentation or locked (the existing `is_busy`): the cat is not shown or does not react. */
  busy: boolean;
  /** Quiet mode: the pet sleeps and says nothing. */
  quiet: boolean;
}

/** The two values the decision remembers between probes. */
export interface FocusState {
  crowded: boolean;
  /** When "active and near" started to hold without a break; null if it does not hold now. */
  nearSince: number | null;
}

export interface FocusOut {
  /** May the cat start a walk? (The user has paused.) */
  walkAllowed: boolean;
  /** May a walk in progress go on? False only when the user is active and the pointer is near the cat (or unknown):
   *  working far away from the cat is no reason to stop it in the middle of a step. */
  keepWalking: boolean;
  /** May an unprompted line be shown now? When false it waits and is tried again later. */
  speakAllowed: boolean;
  /** The user has been working near the cat for a moment: it should make way. */
  crowded: boolean;
  /** Which way to walk to get away from the pointer: -1 left, 1 right. */
  leaveDir: -1 | 1;
  /** The pointer's distance from the cat in logical px; null = unknown. */
  dist: number | null;
  /** The user did something within ACTIVE_MS: a walk in progress should stop, a hop should wait. */
  active: boolean;
}

export const initialFocus = (): FocusState => ({ crowded: false, nearSince: null });

const known = (n: number | null): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

interface Rest {
  walkAllowed: boolean;
  keepWalking: boolean;
  speakAllowed: boolean;
  active: boolean;
  leaveDir: -1 | 1;
  dist: number | null;
}

/**
 * One probe. Returns the new state and the answer. `now` is any monotonic clock in ms (only differences
 * matter). The previous state is not modified.
 *
 * - walkAllowed: the user has been idle for CALM_MS (to start a walk).
 * - keepWalking: a walk in progress stops only if the user is active and the pointer is near the cat (or unknown).
 * - speakAllowed: the user has been idle for LINE_MS.
 * - crowded: turns on when the user did something within CROWD_OFF_MS and the pointer is near (and not on the cat,
 *   and not moving: a pointer on its way somewhere is not typing) for CROWD_MS; turns off at once when the pointer
 *   is on the cat or far or unknown, or when the user has been idle for CROWD_OFF_MS. Fullscreen, presentation, a
 *   locked session and Quiet mode keep it off (those rules already hide the cat).
 * - leaveDir: away from the pointer (the pointer to the right means walk left).
 * - busy (fullscreen, presentation mode or a locked session, spec 14 AP-08): the cat starts no walk, hop or perch, stops a
 *   walk in progress and shows no unprompted line, whatever the idle time and whether or not it is known. This comes first.
 * - unknown idle time (and not busy): no restriction at all (a platform without the probe behaves as before).
 */
export function decideFocus(prev: FocusState, input: FocusInput, now: number): { state: FocusState; out: FocusOut } {
  const p = input.pointer;
  const dist = p !== null && Number.isFinite(p.dist) ? p.dist : null;
  const leaveDir: -1 | 1 = p !== null && typeof p.dx === "number" && p.dx > 0 ? -1 : 1;
  const idle = input.idleMs;
  if (input.busy) {
    // The person is in something full-screen, presenting, or away from a locked screen: Peak keeps still and quiet.
    return done({ crowded: false, nearSince: null }, { walkAllowed: false, keepWalking: false, speakAllowed: false, active: known(idle) && idle < ACTIVE_MS, leaveDir, dist });
  }
  if (!known(idle)) {
    return done({ crowded: false, nearSince: null }, { walkAllowed: true, keepWalking: true, speakAllowed: true, active: false, leaveDir, dist });
  }

  const active = idle < ACTIVE_MS;
  const walkAllowed = idle >= CALM_MS;
  const speakAllowed = idle >= LINE_MS;
  const close = dist !== null && dist < NEAR_PX; // on the cat counts as close
  const keepWalking = !(active && (p === null || close)); // unknown pointer: be careful
  const rest: Rest = { walkAllowed, keepWalking, speakAllowed, active, leaveDir, dist };

  const near = p !== null && dist !== null && !p.over && dist < NEAR_PX;
  const hidden = input.busy || input.quiet;
  if (hidden || !near) return done({ crowded: false, nearSince: null }, rest);

  if (prev.crowded) {
    // already crowded: stays so while the user keeps working near the cat; no longer when they stop
    if (idle >= CROWD_OFF_MS) return done({ crowded: false, nearSince: null }, rest);
    return done({ crowded: true, nearSince: prev.nearSince }, rest);
  }

  // Feeling crowded needs the user to be working right now: the same limit that ends it (CROWD_OFF_MS).
  if (idle >= CROWD_OFF_MS) return done({ crowded: false, nearSince: null }, rest);
  // A moving pointer is the user reaching for something, often the cat itself: not crowded, and the hold starts over.
  if (p?.moving === true) return done({ crowded: false, nearSince: null }, rest);
  const since = prev.nearSince ?? now;
  return done({ crowded: now - since >= CROWD_MS, nearSince: since }, rest);
}

function done(state: FocusState, r: Rest): { state: FocusState; out: FocusOut } {
  return { state, out: { ...r, crowded: state.crowded } };
}
