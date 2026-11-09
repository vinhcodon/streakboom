// The typing lane (spec/07 section 3.1, ADR-0030, ADR-0031): the band along the row where the user is typing, found
// without reading the screen. The real caret is not available (Chromium and Electron do not report it), so it is
// *predicted* from three things the app already knows: where the user last clicked (the caret was put there), how
// long the user has been typing since (only the time, never keys) and a typist's speed. The cat should not stand in
// that band: the text is about to run through it.
//
// Pure logic: no I/O, no timers. The pet window feeds it the probe (idle time, the cat's place, the pointer, the
// last click) and uses the answer. All positions are logical px in one common frame (the screen, x right, y down), so
// the lane stays where it is while the cat walks. Nothing here is stored or sent; the state is a few numbers.
//
// The constants are proposals from the spec, to be tuned with real use (hypothesis H9).

/** A click or a pointer anchor expires after this long without any input. */
export const ANCHOR_TTL_MS = 60_000;
/** Typing counts as continuous while input is more recent than this. */
export const TYPING_GAP_MS = 1500;
/** The typing time is capped (a long line wraps in real text, so the prediction stops growing). */
export const TAU_CAP_S = 120;
/**
 * A typist makes 5 to 7 characters a second at about 8 to 9 px each. The first value, 45 px/s, was too slow: the
 * author found that the text reached the cat before it moved (2026-11-09), so the prediction runs a little fast, which
 * only costs an earlier hop.
 */
export const CARET_PX_PER_S = 60;
/**
 * The cat needs a moment to start (a probe every 0.25 s, a decision, the hop itself) and, since PC-2, a notice beat of
 * 0.4 s before it hops (it looks toward the text, ears up): the lane looks this far ahead. The beat is paid for here so
 * the hop starts as early as it did before, which the author had found right.
 */
export const LANE_LEAD_S = 1.9;
/** Half the height of the band around the anchor row: half the cat plus a margin. */
export const LANE_HALF_H = 100;
/** The band reaches this far to the left of the anchor (what is typed already) and this far past the caret. */
export const LANE_BEHIND = 100;
export const LANE_AHEAD = 200;
/** One step of the typing time is at most this long (a polling gap must not make the caret jump). */
export const STEP_CAP_MS = 500;
/** To leave the band the cat goes to a row at least this far above or below the anchor row. */
export const ESCAPE_PX = 160;
/** A click this much newer than the one on record counts as a new click (the age is read a little late). */
const NEW_CLICK_SLACK_MS = 100;

export interface LaneInput {
  /** Milliseconds since the last keyboard or mouse input; null = unknown (no lane). */
  idleMs: number | null;
  /** The cat's centre in the common frame. */
  cat: { x: number; y: number };
  /** The pointer relative to the cat's centre (the probe's dx and dy); null = unknown. */
  pointer: { dx: number; dy: number } | null;
  /** The last click away from the cat, in the common frame, and how long ago it happened; null = none. */
  click: { x: number; y: number; ageMs: number } | null;
  /**
   * The pointer has just been moving. Moving the mouse also resets the idle time, but it is not typing: only activity with a
   * still pointer counts as typing (a scroll wheel still does, which cannot be told apart without reading keys).
   */
  pointerMoving?: boolean;
}

export interface LaneState {
  /** Where the caret is thought to have been put. */
  anchor: { x: number; y: number } | null;
  /** When the click that set the anchor happened (to tell a new click from the same one read again). */
  clickAt: number | null;
  /** Typing time since the anchor was set, in ms. */
  tauMs: number;
  /** Time of the last step and whether typing was going on then (to add only continuous typing). */
  t: number | null;
  typing: boolean;
}

export interface Lane {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface LaneOut {
  /** The band, or null when there is no anchor. */
  lane: Lane | null;
  /** Where the caret is thought to be now (x on the anchor's row); null when there is no anchor. */
  caretX: number | null;
  /** The user is active and the cat's centre is inside the band: the cat should leave it. */
  crowded: boolean;
}

export const initialLane = (): LaneState => ({ anchor: null, clickAt: null, tauMs: 0, t: null, typing: false });

/** The band for an anchor and a typing time. */
export function laneFor(anchor: { x: number; y: number }, tauMs: number): Lane {
  const tau = Math.min(Math.max(tauMs, 0) / 1000, TAU_CAP_S);
  return {
    x0: anchor.x - LANE_BEHIND,
    x1: anchor.x + CARET_PX_PER_S * (tau + LANE_LEAD_S) + LANE_AHEAD,
    y0: anchor.y - LANE_HALF_H,
    y1: anchor.y + LANE_HALF_H,
  };
}

/** Is the point inside the band? */
export function inLane(l: Lane, x: number, y: number): boolean {
  return x >= l.x0 && x <= l.x1 && y >= l.y0 && y <= l.y1;
}

/** One step: feed the probe at time `now` (ms) and get the new state and the answer. */
export function stepLane(prev: LaneState, input: LaneInput, now: number): { state: LaneState; out: LaneOut } {
  const idle = input.idleMs;
  if (idle === null || !Number.isFinite(idle)) {
    // idle time unknown: no prediction (a platform where it cannot be read)
    return { state: { ...initialLane(), clickAt: prev.clickAt }, out: { lane: null, caretX: null, crowded: false } };
  }

  let s: LaneState = { ...prev };
  if (idle >= ANCHOR_TTL_MS) s = { ...initialLane(), clickAt: prev.clickAt }; // long idle: forget the anchor

  // a click newer than the one on record puts the caret there and starts counting again
  if (input.click && input.click.ageMs < ANCHOR_TTL_MS) {
    const at = now - input.click.ageMs;
    if (s.clickAt === null || at > s.clickAt + NEW_CLICK_SLACK_MS) {
      s = { anchor: { x: input.click.x, y: input.click.y }, clickAt: at, tauMs: 0, t: now, typing: false };
    }
  }

  // typing now: input within the gap and the pointer still (the author saw Peak hop while he only moved the mouse and clicked far from it)
  const typing = idle < TYPING_GAP_MS && !input.pointerMoving;
  if (typing) {
    // typing with no click on record: the pointer's place when typing began is the best guess
    if (s.anchor === null && input.pointer) {
      s.anchor = { x: input.cat.x + input.pointer.dx, y: input.cat.y + input.pointer.dy };
      s.tauMs = 0;
    }
    if (s.anchor !== null && s.typing && s.t !== null) {
      s.tauMs = Math.min(s.tauMs + Math.min(Math.max(now - s.t, 0), STEP_CAP_MS), TAU_CAP_S * 1000);
    }
  }
  s.t = now;
  s.typing = typing;

  if (s.anchor === null) return { state: s, out: { lane: null, caretX: null, crowded: false } };
  const lane = laneFor(s.anchor, s.tauMs);
  const caretX = s.anchor.x + CARET_PX_PER_S * Math.min(s.tauMs / 1000, TAU_CAP_S);
  // crowded only while the user is typing now: a lane left by an earlier burst of typing, or a click and some mouse moving,
  // must not make the cat hop
  const crowded = typing && inLane(lane, input.cat.x, input.cat.y);
  return { state: s, out: { lane, caretX, crowded } };
}

/**
 * Where the cat should hop to leave the band: a row at least ESCAPE_PX above or below the anchor row, **up if it can**, down
 * only when there is no room above (the author found a hop down looked like a fall, 2026-11-09). `roomUp` and `roomDown` are
 * how far the cat's centre can move that way before the screen edge.
 * Returns the direction (-1 up, 1 down) and how far to move, or null when neither side has the room.
 */
export function escapeRow(lane: Lane, catY: number, roomUp: number, roomDown: number): { dir: -1 | 1; dist: number } | null {
  const anchorY = (lane.y0 + lane.y1) / 2;
  const up = catY - (anchorY - ESCAPE_PX); // how far to rise so the cat's centre is ESCAPE_PX above the row
  const down = anchorY + ESCAPE_PX - catY;
  const canUp = up >= 0 && roomUp >= up;
  const canDown = down >= 0 && roomDown >= down;
  if (canUp) return { dir: -1, dist: up };
  if (canDown) return { dir: 1, dist: down };
  return null;
}
