// A repetition report for the scripted lines (LN-8, spec/09 section 11): for each trigger and language, how many lines the
// smallest pool has, how often the action is thought to happen in a week, and so how often one line is seen. It says where
// the next batch of writing should go. The weekly uses are guesses (see USES_PER_WEEK), to be replaced by what the author
// observes. Pure; `scripts/line-report.mjs` prints it.

import { LINES, LANGS } from "./lines.ts";
import type { Band, Lang, Line, Trigger } from "./lines.ts";
import { candidates } from "./selector.ts";

/** Guesses of how many times a week each trigger is spoken for a regular user. */
export const USES_PER_WEEK: Partial<Record<Trigger, number>> = {
  click: 70,
  pet: 25,
  belly: 20,
  huff: 4,
  greeting: 14,
  return: 10,
  morning: 7,
  night: 5,
  long: 10,
  idle: 50,
  how: 15,
  milestone: 1,
  brainhint: 3,
  hint: 3,
  hintbelly: 2,
};

/** A line seen more often than this in a week, on average, feels repeated. */
export const MAX_SEEN_PER_WEEK = 3;

export interface ReportRow {
  lang: Lang;
  trigger: Trigger;
  /** Lines in the smallest pool a user can be in (over closeness tiers, moods and tones, with no name known). */
  smallest: number;
  /** Lines in the largest pool. */
  largest: number;
  usesPerWeek: number;
  /** How often one line of the smallest pool is seen in a week. */
  perLinePerWeek: number;
  /** More than MAX_SEEN_PER_WEEK. */
  tooFew: boolean;
  /** Lines to add to the smallest pool to bring it under the limit. */
  toAdd: number;
}

const BANDS: Band[] = ["sleepy", "content", "playful", "bored", "lonely"];

export function lineReport(lines: Line[] = LINES, uses: Partial<Record<Trigger, number>> = USES_PER_WEEK): ReportRow[] {
  const rows: ReportRow[] = [];
  for (const lang of LANGS) {
    for (const [trigger, perWeek] of Object.entries(uses) as [Trigger, number][]) {
      let smallest = Infinity;
      let largest = 0;
      for (const tier of [1, 2, 3, 4])
        for (const band of BANDS)
          for (const gentle of [false, true]) {
            const n = candidates(trigger, { lang, tier, band, hour: trigger === "night" ? 0 : 12, gentle, days: trigger === "milestone" ? 7 : undefined }, lines).length;
            // a context with no line at all is one where the trigger is not spoken by design (brain hints below tier 3)
            if (n > 0) smallest = Math.min(smallest, n);
            largest = Math.max(largest, n);
          }
      if (!Number.isFinite(smallest)) smallest = 0;
      const perLine = smallest > 0 ? perWeek / smallest : Infinity;
      const tooFew = perLine > MAX_SEEN_PER_WEEK;
      rows.push({
        lang,
        trigger,
        smallest,
        largest,
        usesPerWeek: perWeek,
        perLinePerWeek: perLine,
        tooFew,
        toAdd: tooFew ? Math.ceil(perWeek / MAX_SEEN_PER_WEEK) - smallest : 0,
      });
    }
  }
  return rows;
}

/** The report as text, the worst first, for one language (the three are translated one to one). */
export function formatReport(rows: ReportRow[], lang: Lang = "vi"): string {
  const mine = rows.filter((r) => r.lang === lang).sort((a, b) => b.perLinePerWeek - a.perLinePerWeek);
  const out = [`trigger     smallest pool  uses/week  seen per line/week  add`];
  for (const r of mine) {
    const seen = Number.isFinite(r.perLinePerWeek) ? r.perLinePerWeek.toFixed(1) : "inf";
    out.push(`${r.trigger.padEnd(11)} ${String(r.smallest).padStart(6)} (max ${String(r.largest).padStart(2)})  ${String(r.usesPerWeek).padStart(8)}  ${seen.padStart(18)}  ${r.tooFew ? "+" + r.toAdd : ""}`);
  }
  const need = mine.reduce((s, r) => s + r.toAdd, 0);
  out.push(`${mine.filter((r) => r.tooFew).length} of ${mine.length} triggers under the limit of ${MAX_SEEN_PER_WEEK} sightings per line per week; ${need} lines to add per language (smallest pool of each).`);
  return out.join("\n");
}
