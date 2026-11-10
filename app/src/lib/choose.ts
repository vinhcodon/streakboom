// Choosing a beat from an appraisal (spec/09 section 2.3, RX-2): the beat whose home point is nearest. Pure and
// deterministic: on a tie the beat listed first wins.

import { BEATS } from "./beats.ts";
import type { Appraisal, Beat } from "./beats.ts";

/** Squared distance between two appraisals. */
export function distance(x: Appraisal, y: Appraisal): number {
  return (x.surprise - y.surprise) ** 2 + (x.valence - y.valence) ** 2 + (x.arousal - y.arousal) ** 2 + (x.aboutUser - y.aboutUser) ** 2 + (x.control - y.control) ** 2;
}

/** The beat that suits an appraisal best. */
export function chooseBeat(ap: Appraisal, beats: Beat[] = BEATS): Beat {
  let best = beats[0];
  let bestD = Infinity;
  for (const b of beats) {
    const d = distance(ap, b.home);
    if (d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}
