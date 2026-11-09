// The sequencer of the hero's automatic tour. Pure logic with injectable timers, so it can be tested in Node
// (scripts/site/tour.test.mjs); site/peak.js connects it to the cat, the caption and the buttons.
// (The default timers are wrapped: a browser's setTimeout throws "Illegal invocation" when it is called as a method of another object.)
//
// Rules (they follow Peak's character: polite, still when you work, frugal):
//  - it plays the scenes in order, `loops` times, and then settles (`onSettle`): the cat stands still and only blinks;
//  - while something blocks it (the page is hidden or scrolled away, the pointer is over the cat, the visitor pressed
//    Pause) nothing changes on screen; when the block ends it goes on with the next scene;
//  - when the visitor takes control (`interact`: a click, a chip) it stops; after `resumeMs` without any further
//    interaction it plays `resumeLoops` more rounds and settles again.
export function createTour({ scenes, loops, resumeMs, resumeLoops, onScene, onHold, onSettle, timers = { set: (fn, ms) => setTimeout(fn, ms), clear: (id) => clearTimeout(id) } }) {
  const blocks = new Set();
  let index = -1; // the scene shown last
  let loopsLeft = loops;
  let sceneTimer = null;
  let holdTimer = null;
  let resumeTimer = null;
  let graceTimer = null;
  let control = false; // the visitor is in charge
  let settled = false;
  let started = false;

  const clearScene = () => {
    timers.clear(sceneTimer);
    timers.clear(holdTimer);
    sceneTimer = holdTimer = null;
  };

  function show(i) {
    clearScene();
    index = i;
    settled = false;
    const scene = scenes[i];
    onScene(i, { user: false });
    if (scene.hold) holdTimer = timers.set(() => onHold && onHold(i), scene.hold);
    sceneTimer = timers.set(advance, scene.ms);
  }

  function advance() {
    sceneTimer = null;
    const next = index + 1;
    if (next >= scenes.length) {
      loopsLeft -= 1;
      if (loopsLeft <= 0) {
        settled = true;
        clearScene();
        onSettle && onSettle();
        return;
      }
      return show(0);
    }
    show(next);
  }

  /** Go on if nothing blocks it, the visitor is not in charge, and it has not settled. */
  function maybeRun() {
    if (!started || settled || control || blocks.size) return;
    if (sceneTimer !== null) return; // already running
    advance();
  }

  return {
    start() {
      started = true;
      loopsLeft = loops;
      if (!blocks.size && !control) show(0);
    },
    /** Something stops the tour (the page is hidden, scrolled away, the pointer is over the cat, the visitor pressed Pause). */
    block(reason) {
      blocks.add(reason);
      timers.clear(graceTimer);
      graceTimer = null;
      clearScene();
    },
    /** The block ends; with `delay` the tour waits that long first (and a new block cancels the wait). */
    unblock(reason, delay = 0) {
      const end = () => {
        blocks.delete(reason);
        maybeRun();
      };
      if (!delay) return end();
      timers.clear(graceTimer);
      graceTimer = timers.set(() => {
        graceTimer = null;
        end();
      }, delay);
    },
    /** The visitor took control: stop, and play more rounds only after `resumeMs` of quiet. */
    interact() {
      control = true;
      clearScene();
      timers.clear(resumeTimer);
      resumeTimer = timers.set(() => {
        resumeTimer = null;
        control = false;
        loopsLeft = resumeLoops;
        settled = false;
        if (index >= scenes.length - 1) index = -1; // the day was over: begin it again
        maybeRun();
      }, resumeMs);
    },
    /** The visitor chose a scene (a chip): show it, and take control. */
    select(i) {
      index = i;
      onScene(i, { user: true });
      this.interact();
    },
    get index() { return index; },
    get settled() { return settled; },
    get running() { return sceneTimer !== null; },
    get blocked() { return blocks.size > 0; },
    destroy() {
      clearScene();
      timers.clear(resumeTimer);
      timers.clear(graceTimer);
    },
  };
}
