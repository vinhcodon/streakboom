// Which picture of Paws to show, and when it reacts (DU-11, step 1, ADR-0154). Pure: the page of Paws feeds it what it hears and shows what it decides.
// Paws has two pictures (front, looking at the person; side, looking left or right), so the whole of its "looking" is a choice between them and a direction.

export type Dir = 1 | -1;
export interface View { front: boolean; dir: Dir }

export const SIDE_PX = 50; // the pointer this far to one side of Paws makes it turn to that side; nearer than this it looks at the person
// The program tells where the pointer and Peak are only when that changes (and tells `null` when they are gone), so the last word stands until the next.
export const SPOKEN_MS = 3000; // the time it keeps its head turned to a pet that spoke
export const REACTION_MS = 900; // a poke or a stroke: it looks at the person for this long

export interface LookInput {
  now: number;
  sceneLive: boolean; // a scene decides the picture itself
  dragging: boolean;
  dragDir: Dir;
  reactionUntil: number;
  pointer: { dx: number; dy: number } | null; // relative to the middle of Paws; null when it is not near
  peak: { dx: number } | null; // Peak is near: how far to the side; null when it is not
  spoken: { dir: Dir; at: number } | null; // a pet spoke: the way to it
  current: View;
}

/** The picture now: a scene keeps what it set; carried, it faces the way it is going; a reaction looks at the person; the pointer near turns the head to it (or looks at
 *  the person when it is in front); a pet that spoke, or Peak close by, turns it that way for a while; otherwise it stands and looks at the person. */
export function decideView(i: LookInput): View {
  if (i.sceneLive) return i.current;
  if (i.dragging) return { front: false, dir: i.dragDir };
  if (i.now < i.reactionUntil) return { front: true, dir: i.current.dir };
  if (i.pointer) {
    return Math.abs(i.pointer.dx) > SIDE_PX ? { front: false, dir: i.pointer.dx > 0 ? 1 : -1 } : { front: true, dir: i.current.dir };
  }
  if (i.spoken && i.now - i.spoken.at < SPOKEN_MS) return { front: false, dir: i.spoken.dir };
  if (i.peak) return { front: false, dir: i.peak.dx > 0 ? 1 : -1 };
  return { front: true, dir: i.current.dir };
}

/** A stroke: the pointer moving over the pet without a button. It counts the way travelled; enough of it within a short time is one stroke, and then it rests. */
export class Stroke {
  private last: { x: number; y: number; t: number } | null = null;
  private way = 0;
  private since = 0;
  private restUntil = 0;
  private readonly need: number;
  private readonly within: number;
  private readonly rest: number;
  constructor(need = 180, within = 1600, rest = 4000) { this.need = need; this.within = within; this.rest = rest; }

  /** Feed one pointer position over the pet; true when this makes a stroke. */
  feed(x: number, y: number, t: number): boolean {
    if (t < this.restUntil) { this.last = { x, y, t }; return false; }
    if (this.last && t - this.last.t < 400) {
      if (this.since === 0 || t - this.since > this.within) { this.since = t; this.way = 0; }
      this.way += Math.hypot(x - this.last.x, y - this.last.y);
    } else { this.since = t; this.way = 0; }
    this.last = { x, y, t };
    if (this.way >= this.need) { this.way = 0; this.since = 0; this.restUntil = t + this.rest; return true; }
    return false;
  }
  /** The pointer left the pet. */
  leave() { this.last = null; this.way = 0; this.since = 0; }
}

/** A press that moved less than this far is a click (a poke); more is a drag. */
export const DRAG_PX = 6;
export const isDrag = (dx: number, dy: number): boolean => Math.hypot(dx, dy) > DRAG_PX;
