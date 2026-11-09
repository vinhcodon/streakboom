// Motion for the 2D cat. Nothing here swaps pictures: every pose is a weight on a hand-drawn key
// (see keys.ts), turning is one number (theta: 0 = facing you, 1 = facing right, -1 = facing
// left), and each of those numbers follows its target like a spring. So a change of pose is a
// smooth, continuous morph, with the head, tail and ears arriving a little at different times.

import { POSE_KEYS, POSE_NAMES, type Key, type PoseName } from "./keys.ts";
import type { PetState } from "../sprites.ts";

// ----------------------------------------------------------------------------- blending
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mix(vals: any[], ws: number[]): any {
  const v0 = vals[0];
  if (typeof v0 === "number") {
    let s = 0;
    for (let i = 0; i < vals.length; i++) s += vals[i] * ws[i];
    return s;
  }
  if (Array.isArray(v0)) return v0.map((_, j) => mix(vals.map((v) => v[j]), ws));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out: any = {};
  for (const k of Object.keys(v0)) out[k] = mix(vals.map((v) => v[k]), ws);
  return out;
}

/** The weighted mix of keys (weights should sum to 1). Every key has the same shape. */
export const blendKeys = (keys: Key[], ws: number[]): Key => mix(keys, ws) as Key;

// ----------------------------------------------------------------------------- springs
const EPS_X = 0.01;
const EPS_V = 0.15;
/** A critically damped spring by default: arrives without overshoot. */
export class Spring {
  x: number;
  v = 0;
  t: number;
  k: number;
  zeta: number;
  constructor(x: number, k: number, zeta = 1) {
    this.x = x;
    this.t = x;
    this.k = k;
    this.zeta = zeta;
  }
  step(dt: number) {
    const d = 2 * this.zeta * Math.sqrt(this.k);
    this.v += (this.k * (this.t - this.x) - d * this.v) * dt;
    this.x += this.v * dt;
    // Close enough to the target to be invisible (under 1% of a weight, a hundredth of a pixel):
    // land on it and stop, so the last slow part of the approach does not keep the redraw loop running.
    if (Math.abs(this.t - this.x) < EPS_X && Math.abs(this.v) < EPS_V) {
      this.x = this.t;
      this.v = 0;
    }
  }
  get settled() {
    return Math.abs(this.t - this.x) < EPS_X && Math.abs(this.v) < EPS_V;
  }
}

export type Mouth = "smile" | "open" | "flat" | "o" | "yawn";
const MOUTHS: Mouth[] = ["smile", "open", "flat", "o", "yawn"];
// A cat walks with a lateral sequence: each foot lands a quarter of a cycle after the one before it on the
// same side (near back, near front, far back, far front), and a foot is on the ground longer than in the air.
// (The legs used to swing as a diagonal pair, a trot, with no foot lift, which read as a pendulum.)
// Order of the legs here: far back, far front, near back, near front; the value is when each lands (cycle fraction).
const LEG_LANDS = [0.5, 0.75, 0, 0.25];
const GAIT_RATE = 11; // radians of gait phase per second at full walk (about 1.75 steps a second)
const STANCE = 0.62; // the share of a step a foot is on the ground
const SWING_ANGLE = 0.45; // radians each leg swings forward and back around the hip
const FOOT_LIFT = 2.6; // how far a foot rises while it swings forward (cat units; a leg is about 6 long)

/**
 * One leg at cycle position u (0 = the foot has just landed). On the ground the foot moves steadily from
 * forward to back (positive angle = back, the cat faces +x); in the air it swings forward, eased, and rises.
 */
export function gaitLeg(u: number): { ang: number; lift: number } {
  const f = ((u % 1) + 1) % 1;
  if (f < STANCE) return { ang: -SWING_ANGLE + (2 * SWING_ANGLE * f) / STANCE, lift: 0 };
  const s = (f - STANCE) / (1 - STANCE);
  const e = s * s * (3 - 2 * s);
  return { ang: SWING_ANGLE - 2 * SWING_ANGLE * e, lift: FOOT_LIFT * Math.sin(Math.PI * s) };
}

interface Look {
  base: PoseName;
  theta: number; // multiplied by the facing direction
  walk: number;
  roll: number;
  dy: number;
  gx: number;
  gy: number;
  lid: number;
  happy: number;
  wide: number;
  cheek: number;
  mouth: Mouth;
  dots: number;
  droop: number; // ears folded down, 0..1
}
const REST: Look = { base: "stand", theta: 0, walk: 0, roll: 0, dy: 0, gx: 0, gy: 0, lid: 1, happy: 0, wide: 0, cheek: 0.6, mouth: "smile", dots: 0, droop: 0 };
/** What each pose looks like. Poses that only differ in expression share the same body key. */
export const LOOKS: Record<PetState, Look> = {
  idle: REST,
  look: REST,
  think: { ...REST, roll: 6, gx: 4, gy: -4, mouth: "flat", dots: 1 },
  happy: { ...REST, happy: 1, mouth: "open", cheek: 0.85 },
  land: REST,
  walk: { ...REST, theta: 1, walk: 1 },
  held: { ...REST, base: "hang", wide: 1, mouth: "o" },
  sleep: { ...REST, base: "loaf", lid: 0.06, mouth: "flat" },
  drowsy: { ...REST, base: "sit", roll: -3, dy: 4, lid: 0.45, mouth: "yawn" },
  wake: { ...REST, base: "stretch", theta: 1, lid: 0.08, mouth: "yawn" }, // the play-bow stretch, side-on, eyes shut, yawning
  purr: { ...REST, happy: 1, roll: -5, dy: 2, cheek: 0.95, mouth: "smile" },
  nod: { ...REST, dy: 3 },
  smirk: { ...REST, lid: 0.62, roll: 4, gx: 2, mouth: "smile", cheek: 0.8 },
  gasp: { ...REST, wide: 1, mouth: "o", cheek: 0.4 },
  curious: { ...REST, roll: 8, gx: 3, gy: -3, wide: 0.45, mouth: "flat", dots: 0 },
  sad: { ...REST, roll: -6, dy: 5, gy: 2, lid: 0.7, mouth: "flat", cheek: 0.2, droop: 1 },
  huff: { ...REST, roll: 7, dy: -1, lid: 0.55, mouth: "flat", cheek: 0.3 },
};

/**
 * How quickly the turn between the front and the side view happens. Waking turns the cat side-on for its stretch and
 * back to face front afterwards; at the usual speed (0.25 s) that read as turning and snapping back, so both ways
 * are slow (spec/08, author's report 2026-11-09).
 */
const THETA_K_DEFAULT = 230;
const THETA_K_WAKE = 140; // into the stretch (a slow blend of the front and side drawings shows both at once and looks wrong)
const THETA_K_AFTER_WAKE = 110; // out of it

/** How quickly the body arrives, by the pose it is heading to. */
const BODY_K: Partial<Record<PetState, number>> = { held: 320, wake: 70, land: 60, happy: 60, sleep: 26, drowsy: 30 };

export interface Frame {
  key: Key;
  flip: boolean;
  roll: number; // head tilt, degrees
  headDy: number;
  gx: number;
  gy: number;
  lid: number;
  happy: number;
  wide: number;
  cheek: number;
  mouth: Record<Mouth, number>;
  hop: number;
  sq: number;
  tilt: number; // lean of the whole body while carried, degrees
  dots: number;
  time: number;
}

export class Rig {
  pose: PetState = "idle";
  dir: 1 | -1 = 1;
  time = 0;
  phase = 0;
  private pw = Object.fromEntries(POSE_NAMES.map((n) => [n, new Spring(n === "stand" ? 1 : 0, 36)])) as Record<PoseName, Spring>;
  private theta = new Spring(0, 230);
  private walk = new Spring(0, 90);
  private roll = new Spring(0, 70);
  private headDy = new Spring(0, 70);
  private gx = new Spring(0, 130);
  private gy = new Spring(0, 130);
  private lid = new Spring(1, 260);
  private happy = new Spring(0, 150);
  private wide = new Spring(0, 200);
  private cheek = new Spring(0.6, 60);
  private dots = new Spring(0, 90);
  private tail = new Spring(0, 50);
  private droop = new Spring(0, 70);
  private hop = new Spring(0, 380, 0.28);
  private sq = new Spring(0, 320, 0.32);
  private tilt = new Spring(0, 130, 0.8);
  private mouths = Object.fromEntries(MOUTHS.map((m) => [m, new Spring(m === "smile" ? 1 : 0, 170)])) as Record<Mouth, Spring>;
  private poseT = 0; // seconds since the pose last changed
  private afterWake = false; // just out of the stretch and still turning back to face front: the eyes stay shut
  private stretchDeep = 0; // 0..1: the stretch reaches a little further the longer it is held
  private easeUntil = 0; // until this time the rise out of the stretch is painted at the walking rate, not every frame
  private lookT = -1; // seconds into the "look around" gesture, -1 = not playing
  private blinkT = -1;

  /** The springs whose motion is big on screen: the body blend, the turn, the walk, hops, squash, being held. */
  private major(): Spring[] {
    return [...Object.values(this.pw), this.theta, this.walk, this.hop, this.sq, this.tilt];
  }

  private all(): Spring[] {
    return [
      ...Object.values(this.pw), this.theta, this.walk, this.roll, this.headDy, this.gx, this.gy, this.lid, this.happy,
      this.wide, this.cheek, this.dots, this.tail, this.droop, this.hop, this.sq, this.tilt, ...Object.values(this.mouths),
    ];
  }

  /** Aim the cat at a pose. `replay` re-triggers the one-shot moves even if the pose did not change. */
  setPose(pose: PetState, dir: 1 | -1, tilt: number, replay = false) {
    const changed = pose !== this.pose;
    // a small hop makes a turn or a start/stop read as intentional, not as a slide
    if ((changed && (pose === "walk" || this.pose === "walk")) || (pose === "walk" && dir !== this.dir)) this.hop.v = -90;
    const look = LOOKS[pose];
    const k = BODY_K[pose] ?? 36;
    for (const n of POSE_NAMES) {
      this.pw[n].t = n === look.base ? 1 : 0;
      this.pw[n].k = k;
    }
    this.theta.k = pose === "wake" ? THETA_K_WAKE : this.pose === "wake" ? THETA_K_AFTER_WAKE : THETA_K_DEFAULT;
    // Out of the stretch and turning back to face front: a face half-way between the side and the front drawing has two
    // eyes in the wrong places and looks dazed, so the eyes stay shut (a closed arc is tidy at any angle) until it faces front.
    this.afterWake = this.pose === "wake" && pose !== "wake" && look.theta < 0.3;
    if (this.pose === "wake" && pose !== "wake") this.easeUntil = this.time + 1.5;
    if (changed) this.poseT = 0;
    this.pose = pose;
    this.dir = dir;
    this.theta.t = look.theta * dir;
    this.walk.t = look.walk;
    this.roll.t = look.roll;
    this.headDy.t = look.dy;
    this.gx.t = look.gx;
    this.gy.t = look.gy;
    this.lid.t = look.lid;
    this.happy.t = look.happy;
    this.wide.t = look.wide;
    this.cheek.t = look.cheek;
    this.dots.t = look.dots;
    this.droop.t = look.droop;
    for (const m of MOUTHS) this.mouths[m].t = m === look.mouth ? 1 : 0;
    this.tilt.t = pose === "held" ? tilt : 0;
    if (changed || replay) this.kick(pose, changed);
  }

  /** One-shot moves, as impulses on springs. */
  private kick(pose: PetState, changed: boolean) {
    if (pose === "happy") this.hop.v = -300; // bounces up and settles
    else if (pose === "purr") this.sq.v = 0.9; // a slow, soft sway
    else if (pose === "gasp") this.hop.v = -330; // a startled jump
    else if (pose === "smirk") this.twitch(); // a flick of the tail
    else if (pose === "huff") {
      this.hop.v = -260; // flinches...
      this.twitch(); // ...and flicks its tail
    }
    else if (pose === "land") this.sq.x = -0.2; // squashes, then springs back past rest
    else if (pose === "held" && changed) this.sq.v = 2.4; // yanked up: stretches
    if (pose === "look") this.lookT = 0;
  }

  /**
   * Where the eyes look while the cursor is over the cat (x, y in -1..1, null = nowhere). Only a
   * calm cat follows it; the head and eyes ease toward it like every other move.
   */
  gaze: { x: number; y: number } | null = null;
  lookAt(g: { x: number; y: number } | null) {
    this.gaze = g;
  }
  private followGaze() {
    if (this.lookT >= 0) return;
    const look = LOOKS[this.pose];
    const calm = this.pose === "idle" || this.pose === "look";
    const g = calm ? this.gaze : null;
    this.gx.t = look.gx + (g ? g.x * 4.5 : 0);
    this.gy.t = look.gy + (g ? g.y * 3.5 : 0);
    this.roll.t = look.roll + (g ? g.x * 2 : 0);
  }

  blink() {
    this.blinkT = 0;
  }
  twitch() {
    this.tail.x = 1;
    this.tail.t = 0;
  }

  step(dt: number) {
    this.time += dt;
    this.poseT += dt;
    // the stretch reaches a little further the longer it is held, and lets go when it ends
    this.stretchDeep += ((this.pose === "wake" ? Math.min(1, this.poseT / 1.0) : 0) - this.stretchDeep) * Math.min(1, dt * 4);
    // the yawn ends before the turn back, so no open mouth is caught half-way between the two drawings
    if (this.pose === "wake" && this.poseT > 1.25) for (const m of MOUTHS) this.mouths[m].t = m === "smile" ? 1 : 0;
    this.walk.x > 0.02 && (this.phase += dt * GAIT_RATE * this.walk.x);
    // blink: the lid closes for 130 ms, then follows the pose again
    let lidTarget = LOOKS[this.pose].lid;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      if (this.blinkT < 0.13) lidTarget = Math.min(lidTarget, 0.08);
      else this.blinkT = -1;
    }
    if (this.afterWake) {
      if (Math.abs(this.theta.x) < 0.06 || this.poseT > 0.7) this.afterWake = false;
      else lidTarget = Math.min(lidTarget, 0.08);
    }
    this.lid.t = lidTarget;
    // "look around": the eyes drift left, right, then back
    if (this.lookT >= 0) {
      this.lookT += dt;
      const s = this.lookT;
      this.gx.t = s < 0.4 ? 0 : s < 0.75 ? -5 : s < 1.1 ? -5 : s < 1.35 ? 5 : s < 1.6 ? 5 : 0;
      this.roll.t = s < 0.4 ? 0 : s < 1.1 ? -4 : s < 1.6 ? 4 : 0;
      if (s > 1.7) {
        this.lookT = -1;
        this.gx.t = 0;
        this.roll.t = LOOKS[this.pose].roll;
      }
    }
    this.followGaze();
    for (const s of this.all()) s.step(dt);
  }

  /**
   * How much redrawing is needed (each painted frame is costly with software drawing, so every
   * mode is the slowest rate that still reads as smooth): nothing (standing still), a trickle
   * (z's and dots, about 11 fps), a steady walk (about 30 fps, two paints per window move so the
   * steps stay even), "soft" for small motion only (a blink, a tail flick, the eyes looking
   * around: about 24 fps), or full speed while a big motion runs (a pose change, a turn, a hop,
   * being carried). While walking, the walk rate also covers the small motions: a blink must not
   * change the pace of the steps.
   */
  get mode(): "idle" | "light" | "walk" | "soft" | "full" {
    // Waking is slow, smooth motion (a stretch held and then a rise): 30 frames a second read fine and a full-speed
    // wake cost about 150 frames; the held part, which only breathes and sways, is painted at the soft rate.
    if (this.pose === "wake") return this.poseT > 0.5 ? "soft" : "walk";
    if (this.time < this.easeUntil) return "walk";
    if (this.major().some((s) => !s.settled)) return "full";
    if (this.walk.x > 0.01) return "walk";
    if (this.all().some((s) => !s.settled) || this.lookT >= 0 || this.blinkT >= 0) return "soft";
    if (this.pose === "sleep" || this.pose === "think") return "light";
    return "idle";
  }

  frame(): Frame {
    const th = this.theta.x;
    const a = Math.min(1, Math.abs(th));
    const ws = POSE_NAMES.map((n) => Math.max(0, this.pw[n].x));
    const sum = ws.reduce((s, w) => s + w, 0) || 1;
    const keys: Key[] = [];
    const weights: number[] = [];
    POSE_NAMES.forEach((n, i) => {
      if (ws[i] / sum < 0.001) return;
      keys.push(blendKeys([POSE_KEYS[n].f, POSE_KEYS[n].s], [1 - a, a]));
      weights.push(ws[i] / sum);
    });
    const key = blendKeys(keys, weights);

    // walking, only meaningful from the side: swing the legs, bob the body, nod, wag
    const wk = this.walk.x * (0.4 + 0.6 * a);
    const swing = Math.sin(this.phase);
    let nod = 0;
    if (wk > 0.001) {
      key.legs.forEach((l, i) => {
        const g = gaitLeg(this.phase / (2 * Math.PI) - LEG_LANDS[i]);
        const ang = g.ang * wk;
        const c = Math.cos(ang);
        const s = Math.sin(ang);
        const dx = l.fx - l.hx;
        const dy = l.fy - l.hy;
        l.fx = l.hx + dx * c - dy * s;
        l.fy = l.hy + dx * s + dy * c - g.lift * wk;
      });
      key.body.y -= 1.7 * Math.abs(swing) * wk;
      nod = 2 * swing * wk;
    }
    // the tail sways a little all the time it is moving, and more in a twitch or a walk
    // a held stretch is alive: a slow breath, a gentle sway of the raised tail, and it reaches a little further
    const sw = Math.max(0, Math.min(1, this.pw.stretch.x));
    if (sw > 0.01) {
      const breath = Math.sin(this.time * 2.4);
      key.body.ry += 0.8 * sw * breath;
      key.belly.ry += 0.5 * sw * breath;
      key.body.rot += 3 * sw * this.stretchDeep;
      key.belly.rot += 3 * sw * this.stretchDeep;
    }
    const wag = 0.22 * this.tail.x + 0.18 * wk + 0.12 * sw;
    if (wag > 0.002) {
      const ang = wag * Math.sin(this.time * 9);
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const [ox, oy] = key.tail.p0;
      for (const p of [key.tail.p1, key.tail.p2]) {
        const dx = p[0] - ox;
        const dy = p[1] - oy;
        p[0] = ox + dx * c - dy * s;
        p[1] = oy + dx * s + dy * c;
      }
    }
    // ears fold down about their base: each tip swings outward and down
    const dr = Math.max(0, Math.min(1, this.droop.x));
    if (dr > 0.01) {
      for (const [ear, sign] of [[key.earL, -1], [key.earR, 1]] as const) {
        const bx = (ear.a[0] + ear.c[0]) / 2;
        const by = (ear.a[1] + ear.c[1]) / 2;
        const ang = sign * 0.85 * dr;
        const cs = Math.cos(ang);
        const sn = Math.sin(ang);
        for (const p of [ear.b, ear.ib]) {
          const dx = p[0] - bx;
          const dy = p[1] - by;
          p[0] = bx + dx * cs - dy * sn;
          p[1] = by + dx * sn + dy * cs;
        }
      }
    }
    const hang = this.pw.hang.x;
    const mouth = Object.fromEntries(MOUTHS.map((m) => [m, Math.max(0, this.mouths[m].x)])) as Record<Mouth, number>;
    return {
      key,
      flip: th < 0,
      roll: this.roll.x + nod,
      headDy: this.headDy.x + 2 * sw * this.stretchDeep,
      gx: this.gx.x,
      gy: this.gy.x,
      lid: Math.min(1, Math.max(0.05, this.lid.x)),
      happy: Math.min(1, Math.max(0, this.happy.x)),
      wide: Math.min(1, Math.max(0, this.wide.x)),
      cheek: this.cheek.x,
      mouth,
      hop: this.hop.x,
      sq: this.sq.x,
      tilt: this.tilt.x * hang + 4 * Math.sin(this.time * 3.5) * hang,
      dots: Math.max(0, this.dots.x),
      time: this.time,
    };
  }
}
