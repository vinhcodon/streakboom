// "A day of Peak": the scenes the hero plays by itself, in order. Each scene is a pose of the app's own cat rig and one
// caption (`cap_<id>` in site/strings.mjs, in every language) that describes something the app really does (README).
// The chips under the cat are these scenes, in this order (`pose_<id>` is the chip label).
//   pose  the rig pose            dir  1 faces right, -1 faces left (a walk to the left is "making way")
//   ms    how long the scene lasts   hold  after this many ms the cat goes back to standing (the caption stays)
export const SCENES = [
  { id: "idle", pose: "idle", dir: 1, ms: 4200 },
  { id: "walk", pose: "walk", dir: 1, ms: 5000 },
  { id: "makeway", pose: "walk", dir: -1, ms: 5000 },
  { id: "happy", pose: "happy", dir: 1, ms: 4500, hold: 2200 },
  { id: "purr", pose: "purr", dir: 1, ms: 4500, hold: 3200 },
  { id: "gasp", pose: "gasp", dir: 1, ms: 4800, hold: 1100 },
  { id: "curious", pose: "curious", dir: 1, ms: 4500, hold: 2200 },
  { id: "sad", pose: "sad", dir: 1, ms: 4500, hold: 2600 },
  { id: "sleep", pose: "sleep", dir: 1, ms: 5000 },
  { id: "wake", pose: "wake", dir: 1, ms: 4200, hold: 1500 },
];

/** How many times the whole day plays by itself before Peak settles into standing still. */
export const LOOPS = 2;
/** After the visitor takes control, the tour waits this long without any interaction, then plays this many more rounds. */
export const RESUME_MS = 10000;
export const RESUME_LOOPS = 1;
/** After the pointer leaves the cat, the tour waits this long before it goes on. */
export const HOVER_GRACE_MS = 2500;
