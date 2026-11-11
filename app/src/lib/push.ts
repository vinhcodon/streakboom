// The person's push and drop (spec/11 section 1, ADR-0047, CH-5): the only things besides a lost seat that make Peak fall. Pure
// rules; the page does the teetering and the falling. A fall is a strong feeling, so it is spent rarely: a push near an edge
// gets a teeter first and Peak recovers most of the time; and for a while after a fall it is wary, and a push only teeters.

/** A poke counts as a push when the cat is this close (logical px) to the end of its seat in the direction it would be pushed. */
export const PUSH_REACH_PX = 100;
/** A teeter ends in a recovery this often (4 in 5), a fall otherwise; after a fall only a recovery. */
export const RECOVER_ODDS = 0.8;
/** After a fall of at least `BRUISE_FALL_PX` Peak is wary for this long: no walks to the edge, a push only teeters. */
export const BRUISE_MS = 10 * 60_000;
export const BRUISE_FALL_PX = 120;
/** Let go of Peak this high above the floor (and not on a seat) and it falls; lower and it just lands. */
export const DROP_MIN_PX = 90;

/**
 * Which way a poke pushes: away from the side the pointer is on (the pointer's offset from the cat's centre, logical px;
 * positive is to the right). Null when the pointer is nearly over the middle of the cat: that is a poke, not a push.
 */
export function pushDirection(pointerDx: number | null): 1 | -1 | null {
  if (pointerDx === null || Math.abs(pointerDx) < 10) return null;
  return pointerDx > 0 ? -1 : 1;
}

/**
 * Is this poke a push toward an edge? `room` is the room left to walk on the seat on each side (logical px, as `seatRoom`
 * gives it, which stops `margin` short of the end), `margin` that stop distance, `dir` the way it is pushed.
 */
export function pushesTowardEdge(room: { left: number; right: number } | null, margin: number, dir: 1 | -1 | null): boolean {
  if (!room || dir === null) return false;
  return (dir > 0 ? room.right : room.left) + margin <= PUSH_REACH_PX;
}

/** How a teeter ends: `roll` is a number in 0..1 (a random draw); a bruised Peak always recovers. */
export function teeterEnds(roll: number, bruised: boolean): "recover" | "fall" {
  if (bruised) return "recover";
  return roll < RECOVER_ODDS ? "recover" : "fall";
}

/** Does letting go of Peak make it fall? Not when it is on a seat, and not when it is nearly on the floor. */
export function dropFalls(downPx: number, onSeat: boolean): boolean {
  return !onSeat && downPx >= DROP_MIN_PX;
}

/** Is it wary now? */
export const isBruised = (bruisedUntil: number, now: number): boolean => now < bruisedUntil;
