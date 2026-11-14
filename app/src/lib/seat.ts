// Peak's usual place (ADR-0117): where "go to your spot" sends it. A place is a number: how far along the floor of the work area
// it is, from the left end (0) to the right end (1), so that a changed resolution, scale or taskbar keeps its meaning. It is taught
// by saying "sit here" where Peak stands; until then it is the right end of the floor. Pure rules; the page walks.

/** The place before the person teaches one: near the right end of the floor (not at the very edge). */
export const DEFAULT_SEAT = 0.9;
/** Less walkable room than this (logical px) and there is nowhere to walk to. */
export const MIN_SEAT_ROOM_PX = 60;
/** Closer than this (logical px) to the place counts as already there. */
export const AT_SEAT_PX = 24;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Where Peak stands along the floor, from the room to its left and right (logical px); null when there is no room to tell. */
export function seatFraction(roomLeft: number, roomRight: number): number | null {
  const total = roomLeft + roomRight;
  if (!(total >= MIN_SEAT_ROOM_PX) || !Number.isFinite(total)) return null;
  return clamp01(roomLeft / total);
}

/** The place as stored: a number from 0 to 1, or null (not taught). Anything else is read as not taught. */
export function parseSeat(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1 ? v : null;
}

/** The way and the distance (logical px) from where Peak stands to its place; null when it is there already or cannot tell. */
export function seatMove(roomLeft: number, roomRight: number, seat: number | null): { dir: 1 | -1; px: number } | null {
  const f = seatFraction(roomLeft, roomRight);
  if (f === null) return null;
  const total = roomLeft + roomRight;
  const move = (clamp01(seat ?? DEFAULT_SEAT) - f) * total;
  return Math.abs(move) < AT_SEAT_PX ? null : { dir: move < 0 ? -1 : 1, px: Math.abs(move) };
}

/** A time to give a walk of `px` logical px at `pace` px a second: half as long again, and two and a half seconds more. */
export const seatWalkMs = (px: number, pace: number): number => Math.round((px / pace) * 1.5 * 1000 + 2500);
