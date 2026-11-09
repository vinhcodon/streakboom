// Noticing that the ground under the cat is gone (PC-7, ADR-0041). The first version waited for the bare desktop to show
// under the cat; on a screen covered with windows (the usual one) closing the window it stood on shows another window,
// never the desktop, so it never fired. Now the cat remembers *which* window it stands on, as an opaque number from the
// system that says only "the same window?" (nothing about the window is read), and the ground is gone when that window
// no longer holds the point under the cat's feet (closed, minimized or dragged away). Another window raised over it does
// not count: the cat is not on that one. Pure: the page feeds samples in and acts on the answer.

export interface GroundWatch {
  /** The window the cat stands on (0: none known yet). */
  id: number;
  /** The point under its middle foot, physical px, where that window was seen. */
  x: number;
  y: number;
  /** A window seen once, waiting for a second sample to be believed. */
  pending: number;
  /** In a row, the samples in which the window did not hold the point. */
  gone: number;
}

export const startGroundWatch = (): GroundWatch => ({ id: 0, x: 0, y: 0, pending: 0, gone: 0 });

/** Samples in a row that must say "gone" before it is believed (a window is briefly odd while it is being moved). */
export const GONE_SAMPLES = 2;

/** What the system said about the cat's feet: the ordinary window there (0: none, the desktop, the taskbar) and the point. */
export interface FootSample {
  id: number;
  x: number;
  y: number;
}

/**
 * One sample. With no window known, a window is adopted when seen twice in a row. With one known, `holds` (the system's
 * answer for that window and point; null when it could not be asked) decides: GONE_SAMPLES "no" in a row is a loss, and
 * the watch starts over. A "yes" clears the count.
 */
export function stepGround(w: GroundWatch, s: FootSample, holds: boolean | null): { w: GroundWatch; lost: boolean } {
  if (w.id === 0) {
    if (s.id === 0) return { w: startGroundWatch(), lost: false };
    if (s.id !== w.pending) return { w: { ...startGroundWatch(), pending: s.id }, lost: false };
    return { w: { id: s.id, x: s.x, y: s.y, pending: 0, gone: 0 }, lost: false };
  }
  if (holds === null) return { w, lost: false };
  if (holds) return { w: { ...w, gone: 0 }, lost: false };
  const gone = w.gone + 1;
  if (gone >= GONE_SAMPLES) return { w: startGroundWatch(), lost: true };
  return { w: { ...w, gone }, lost: false };
}
