// The cat as a set of parametric 2D shapes. A "key" is one hand-drawn pose, written as numbers
// in the 120x120 box (y points down). Every key has exactly the same shape, so any mix of keys
// is another valid drawing: moving between poses (and turning from front view to side view)
// is just blending numbers, never swapping pictures. The look stays the flat 2D mochi cat.

export type V = [number, number];
export interface Ell { x: number; y: number; rx: number; ry: number }
export interface Leg {
  hx: number; hy: number; // hip
  fx: number; fy: number; // foot
  t: number; // thickness of the limb (0 = just a foot)
  frx: number; fry: number; // foot ellipse radii (0 = none)
  a: number; // opacity
  d: number; // 0 = fur colour, 1 = darker (far side)
}
export interface Ear { a: V; b: V; c: V; ia: V; ib: V; ic: V; alpha: number }
export interface Key {
  shadow: Ell;
  tail: { p0: V; p1: V; p2: V; w: number };
  body: Ell & { rot: number };
  belly: Ell & { rot: number };
  legs: [Leg, Leg, Leg, Leg]; // far back, far front, near back, near front
  head: Ell;
  earL: Ear;
  earR: Ear;
  stripes: [Stripe, Stripe, Stripe];
  eyeL: Eye;
  eyeR: Eye;
  cheekL: Eye;
  cheekR: Eye;
  nose: { a: V; b: V; c: V };
  mouth: { l0: V; l1: V; l2: V; r0: V; r1: V; r2: V; ra: number; s: number };
  fx: { sweat: number; z: number };
}
export interface Stripe { x: number; y1: number; y2: number; a: number }
export interface Eye extends Ell { a: number }

const eye = (x: number, y: number, rx: number, ry: number, a = 1): Eye => ({ x, y, rx, ry, a });
const leg = (hx: number, hy: number, fx: number, fy: number, t: number, frx: number, fry: number, a: number, d: number): Leg => ({
  hx, hy, fx, fy, t, frx, fry, a, d,
});
const stripe = (x: number, y1: number, y2: number, a = 1): Stripe => ({ x, y1, y2, a });

/** Move every part of the head by (dx, dy). */
export function shiftHead(k: Key, dx: number, dy: number): Key {
  const m = (p: V): V => [p[0] + dx, p[1] + dy];
  const ear = (e: Ear): Ear => ({ ...e, a: m(e.a), b: m(e.b), c: m(e.c), ia: m(e.ia), ib: m(e.ib), ic: m(e.ic) });
  const el = <T extends Ell>(e: T): T => ({ ...e, x: e.x + dx, y: e.y + dy });
  return {
    ...k,
    head: el(k.head),
    earL: ear(k.earL),
    earR: ear(k.earR),
    stripes: k.stripes.map((s) => ({ ...s, x: s.x + dx, y1: s.y1 + dy, y2: s.y2 + dy })) as Key["stripes"],
    eyeL: el(k.eyeL),
    eyeR: el(k.eyeR),
    cheekL: el(k.cheekL),
    cheekR: el(k.cheekR),
    nose: { a: m(k.nose.a), b: m(k.nose.b), c: m(k.nose.c) },
    mouth: { ...k.mouth, l0: m(k.mouth.l0), l1: m(k.mouth.l1), l2: m(k.mouth.l2), r0: m(k.mouth.r0), r1: m(k.mouth.r1), r2: m(k.mouth.r2) },
  };
}

// ------------------------------------------------------------------------------- standing
export const STAND_F: Key = {
  shadow: { x: 60, y: 115, rx: 32, ry: 4.5 },
  tail: { p0: [86, 100], p1: [110, 100], p2: [108, 74], w: 10 },
  body: { x: 60, y: 92, rx: 34, ry: 24, rot: 0 },
  belly: { x: 60, y: 101, rx: 19, ry: 13, rot: 0 },
  legs: [leg(46, 108, 46, 110, 0, 11, 6.5, 0, 1), leg(74, 108, 74, 110, 0, 11, 6.5, 0, 1), leg(46, 108, 46, 110, 0, 11, 6.5, 1, 0), leg(74, 108, 74, 110, 0, 11, 6.5, 1, 0)],
  head: { x: 60, y: 64, rx: 42, ry: 34 },
  earL: { a: [26, 52], b: [30, 22], c: [54, 38], ia: [31, 48], ib: [34, 30], ic: [48, 40], alpha: 1 },
  earR: { a: [94, 52], b: [90, 22], c: [66, 38], ia: [89, 48], ib: [86, 30], ic: [72, 40], alpha: 1 },
  stripes: [stripe(53, 36, 43), stripe(60, 34, 43), stripe(67, 36, 43)],
  eyeL: eye(44, 66, 7.5, 9.5),
  eyeR: eye(76, 66, 7.5, 9.5),
  cheekL: eye(30, 78, 8, 4.6),
  cheekR: eye(90, 78, 8, 4.6),
  nose: { a: [56.5, 74], b: [63.5, 74], c: [60, 78.5] },
  mouth: { l0: [60, 78.5], l1: [56, 83.5], l2: [51, 80], r0: [60, 78.5], r1: [64, 83.5], r2: [69, 80], ra: 1, s: 1 },
  fx: { sweat: 0, z: 0 },
};

export const STAND_S: Key = {
  shadow: { x: 60, y: 115, rx: 34, ry: 4.5 },
  tail: { p0: [28, 90], p1: [8, 88], p2: [12, 60], w: 9 },
  body: { x: 56, y: 88, rx: 34, ry: 22, rot: 0 },
  belly: { x: 58, y: 99, rx: 20, ry: 9, rot: 0 },
  legs: [leg(51, 103.5, 51, 109.5, 11, 0, 0, 1, 1), leg(87, 103.5, 87, 109.5, 11, 0, 0, 1, 1), leg(37, 103.5, 37, 109.5, 11, 0, 0, 1, 0), leg(73, 103.5, 73, 109.5, 11, 0, 0, 1, 0)],
  head: { x: 92, y: 68, rx: 27, ry: 25 },
  earL: { a: [70, 52], b: [72, 28], c: [88, 44], ia: [74, 48], ib: [75, 34], ic: [85, 44], alpha: 0 },
  earR: { a: [76, 52], b: [80, 26], c: [98, 46], ia: [81, 48], ib: [83, 34], ic: [94, 46], alpha: 1 },
  stripes: [stripe(87, 46, 52), stripe(93, 45, 53), stripe(90, 45, 50, 0)],
  eyeL: eye(84, 66, 0, 9, 0),
  eyeR: eye(102, 66, 6.5, 8.5),
  cheekL: eye(78, 79, 0, 4, 0),
  cheekR: eye(94, 79, 7, 4),
  nose: { a: [116.5, 70.5], b: [119.5, 70.5], c: [118, 73.5] },
  mouth: { l0: [115, 78], l1: [112, 82], l2: [108, 79.5], r0: [115, 78], r1: [112, 82], r2: [108, 79.5], ra: 0, s: 0.55 },
  fx: { sweat: 0, z: 0 },
};

// ------------------------------------------------------------------------------- sitting
export const SIT_F: Key = {
  ...shiftHead(STAND_F, 0, -12),
  shadow: { x: 60, y: 115, rx: 30, ry: 4.5 },
  tail: { p0: [84, 106], p1: [108, 110], p2: [104, 97], w: 10 },
  body: { x: 60, y: 90, rx: 30, ry: 28, rot: 0 },
  belly: { x: 60, y: 98, rx: 17, ry: 18, rot: 0 },
  legs: [leg(34, 100, 34, 102, 0, 13, 12, 1, 1), leg(86, 100, 86, 102, 0, 13, 12, 1, 1), leg(50, 108, 50, 110, 0, 9.5, 6, 1, 0), leg(70, 108, 70, 110, 0, 9.5, 6, 1, 0)],
};

export const SIT_S: Key = {
  ...shiftHead(STAND_S, -18, -20),
  shadow: { x: 54, y: 115, rx: 34, ry: 4.5 },
  tail: { p0: [28, 106], p1: [8, 110], p2: [4, 98], w: 9 },
  body: { x: 50, y: 88, rx: 24, ry: 30, rot: 22 },
  belly: { x: 62, y: 86, rx: 13, ry: 19, rot: 22 },
  legs: [leg(36, 96, 54, 110, 18, 8, 5, 1, 1), leg(76, 84, 80, 108, 10, 5, 4, 1, 1), leg(40, 94, 60, 110, 20, 9, 5.5, 1, 0), leg(70, 84, 72, 108, 10, 6, 4, 1, 0)],
};

// ------------------------------------------------------------------------------- lying down
export const LOAF_F: Key = {
  ...shiftHead(STAND_F, 0, 18),
  shadow: { x: 60, y: 115, rx: 40, ry: 4.5 },
  tail: { p0: [86, 108], p1: [110, 110], p2: [106, 92], w: 9 },
  body: { x: 60, y: 100, rx: 40, ry: 17, rot: 0 },
  belly: { x: 60, y: 106, rx: 24, ry: 9, rot: 0 },
  legs: [leg(46, 108, 46, 110, 0, 11, 6.5, 0, 1), leg(74, 108, 74, 110, 0, 11, 6.5, 0, 1), leg(46, 108, 46, 110, 0, 11, 6.5, 0, 0), leg(74, 108, 74, 110, 0, 11, 6.5, 0, 0)],
  fx: { sweat: 0, z: 1 },
};

export const LOAF_S: Key = {
  ...shiftHead(STAND_S, 0, 0),
  shadow: { x: 56, y: 115, rx: 38, ry: 4.5 },
  tail: { p0: [18, 104], p1: [4, 104], p2: [8, 92], w: 9 },
  body: { x: 54, y: 100, rx: 38, ry: 16, rot: 0 },
  belly: { x: 58, y: 106, rx: 22, ry: 7, rot: 0 },
  legs: [leg(51, 108, 51, 110, 0, 0, 0, 0, 1), leg(87, 108, 87, 110, 0, 0, 0, 0, 1), leg(37, 108, 37, 110, 0, 0, 0, 0, 0), leg(90, 110, 90, 112, 0, 9, 5, 1, 0)],
  head: { x: 92, y: 92, rx: 24, ry: 20 },
  earL: { a: [72, 80], b: [74, 66], c: [86, 78], ia: [75, 78], ib: [76, 70], ic: [83, 78], alpha: 0 },
  earR: { a: [80, 82], b: [84, 68], c: [98, 80], ia: [84, 80], ib: [86, 72], ic: [94, 80], alpha: 1 },
  stripes: [stripe(88, 74, 80), stripe(94, 73, 81), stripe(91, 74, 79, 0)],
  eyeL: eye(86, 92, 0, 7.5, 0),
  eyeR: eye(100, 92, 6, 7.5),
  cheekL: eye(80, 100, 0, 3.5, 0),
  cheekR: eye(96, 100, 6, 3.5),
  nose: { a: [111, 92], b: [114, 92], c: [112.5, 95.5] },
  mouth: { l0: [110, 98], l1: [107, 101], l2: [103, 99], r0: [110, 98], r1: [107, 101], r2: [103, 99], ra: 0, s: 0.55 },
  fx: { sweat: 0, z: 1 },
};

// ------------------------------------------------------------------------------- picked up
export const HANG_F: Key = {
  ...shiftHead(STAND_F, 0, -8),
  shadow: { x: 60, y: 115, rx: 0, ry: 0 },
  tail: { p0: [82, 92], p1: [98, 98], p2: [94, 116], w: 9 },
  body: { x: 60, y: 86, rx: 30, ry: 27, rot: 0 },
  belly: { x: 60, y: 96, rx: 17, ry: 14, rot: 0 },
  legs: [leg(43, 106, 44, 113, 10, 0, 0, 1, 1), leg(56, 108, 56, 114, 10, 0, 0, 1, 1), leg(68, 108, 68, 114, 10, 0, 0, 1, 1), leg(80, 106, 79, 113, 10, 0, 0, 1, 1)],
  fx: { sweat: 1, z: 0 },
};

// ------------------------------------------------------------------------------- stretching
// A cat's stretch is the "play bow": the front end goes down with the front legs reaching far forward and the chin on
// the ground, the rump stays high over straight hind legs, the tail goes up, the eyes shut and the mouth opens in a yawn.
// (The first drawing was a flat tilted blob with the head sunk into it and read as a weird shape.)
const STRETCH_HEAD = shiftHead(STAND_S, -6, 22);
export const STRETCH_S: Key = {
  ...STRETCH_HEAD,
  shadow: { x: 58, y: 115, rx: 44, ry: 4.5 },
  tail: { p0: [16, 76], p1: [4, 62], p2: [10, 32], w: 9 },
  body: { x: 46, y: 86, rx: 34, ry: 20, rot: 22 },
  belly: { x: 56, y: 96, rx: 20, ry: 8, rot: 22 },
  legs: [leg(24, 84, 22, 110, 11, 0, 0, 1, 1), leg(72, 98, 106, 111, 10, 5, 3.5, 1, 1), leg(30, 86, 28, 111, 11, 0, 0, 1, 0), leg(66, 99, 98, 112, 10, 6, 4, 1, 0)],
  mouth: { ...STRETCH_HEAD.mouth, l0: [106, 96], r0: [106, 96], s: 0.85 }, // the yawn opens inside the face, under the nose
};

/** The front view of the stretch is derived from standing: lower front, higher tail. */
export const STRETCH_F: Key = {
  ...shiftHead(STAND_F, 0, 10),
  tail: { p0: [86, 98], p1: [112, 92], p2: [108, 62], w: 10 },
  body: { x: 60, y: 94, rx: 37, ry: 21, rot: 0 },
  belly: { x: 60, y: 102, rx: 21, ry: 10, rot: 0 },
};

/** Each pose has a front key and a side key; poses without a real side view reuse the front. */
export const POSE_KEYS = {
  stand: { f: STAND_F, s: STAND_S },
  sit: { f: SIT_F, s: SIT_S },
  loaf: { f: LOAF_F, s: LOAF_S },
  hang: { f: HANG_F, s: HANG_F },
  stretch: { f: STRETCH_F, s: STRETCH_S },
} as const;
export type PoseName = keyof typeof POSE_KEYS;
export const POSE_NAMES = Object.keys(POSE_KEYS) as PoseName[];
