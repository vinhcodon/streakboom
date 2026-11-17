// The speed of the pointer as it passes over Peak (spec 17 and docs/plans/input-map-revision.md, E33). A fast, decisive flick is to become the
// shove, but its thresholds cannot be guessed: they have to be read from the author's own hand and trackpad. This is the measuring half: it turns
// the pointer positions seen over the sprite into one line of numbers per pass (the time, the length of the path, the top and mean speed, the
// reversals, the net move), and nothing else. Pure; the page writes the line into loop-trace.log (a Preview or developer build only).

export interface Sample {
  x: number;
  y: number;
  t: number; // ms
}

export interface PassState {
  pts: Sample[];
}

/** A gap longer than this ends a pass. */
export const PASS_GAP_MS = 250;
/** A pass slower than this top speed (px per second) is not written: a slow drift over Peak is not what is being measured. */
export const PASS_MIN_VMAX = 300;

export const newPass = (): PassState => ({ pts: [] });

export interface PassStats {
  n: number; // pointer events seen
  ms: number; // first to last
  path: number; // px along the way
  vmax: number; // px per second, the fastest step between two events
  vavg: number; // px per second over the whole pass
  rev: number; // direction reversals along x (steps of at least 8 px)
  dx: number; // net move in x
  dy: number;
}

/** Add a pointer position. Returns the new state and, when the previous pass has just ended (a gap), its numbers. */
export function passStep(s: PassState, p: Sample): { state: PassState; done: PassStats | null } {
  const last = s.pts[s.pts.length - 1];
  if (last && p.t - last.t > PASS_GAP_MS) return { state: { pts: [p] }, done: passStats(s.pts) };
  return { state: { pts: [...s.pts, p] }, done: null };
}

/** The pointer left the sprite: the pass is over. */
export function passEnd(s: PassState): { state: PassState; done: PassStats | null } {
  return { state: newPass(), done: passStats(s.pts) };
}

export function passStats(pts: readonly Sample[]): PassStats | null {
  if (pts.length < 2) return null;
  let path = 0;
  let vmax = 0;
  let dir = 0;
  let extreme = pts[0].x;
  let rev = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const dt = Math.max(1, pts[i].t - pts[i - 1].t);
    path += d;
    vmax = Math.max(vmax, (d * 1000) / dt);
  }
  for (const p of pts) {
    if (dir === 0) {
      if (Math.abs(p.x - extreme) >= 8) {
        dir = p.x > extreme ? 1 : -1;
        extreme = p.x;
      }
    } else if (dir === 1) {
      if (p.x > extreme) extreme = p.x;
      else if (extreme - p.x >= 8) {
        dir = -1;
        extreme = p.x;
        rev++;
      }
    } else if (p.x < extreme) extreme = p.x;
    else if (p.x - extreme >= 8) {
      dir = 1;
      extreme = p.x;
      rev++;
    }
  }
  const ms = Math.max(1, pts[pts.length - 1].t - pts[0].t);
  return {
    n: pts.length,
    ms: Math.round(ms),
    path: Math.round(path),
    vmax: Math.round(vmax),
    vavg: Math.round((path * 1000) / ms),
    rev,
    dx: Math.round(pts[pts.length - 1].x - pts[0].x),
    dy: Math.round(pts[pts.length - 1].y - pts[0].y),
  };
}

/** The trace line of a pass, or null when it is too slow to be of interest. Fixed words and numbers only. */
export function passLine(st: PassStats | null, width: number): string | null {
  if (!st || st.vmax < PASS_MIN_VMAX) return null;
  return `pass n=${st.n} ms=${st.ms} path=${st.path} vmax=${st.vmax} vavg=${st.vavg} rev=${st.rev} dx=${st.dx} dy=${st.dy} w=${Math.round(width)}`;
}
