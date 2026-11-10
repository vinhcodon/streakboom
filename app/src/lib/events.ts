// Events (spec/09 section 2.1, 2.2, RX-2): what happened, how it reads for Peak, and which pool its words come from.
// Adding a situation means adding one entry here, not a rule in the page.

import type { Appraisal } from "./beats.ts";
import type { RepeatKind } from "./escalation.ts";
import type { Trigger } from "./lines.ts";
import type { Mood } from "./sprites.ts";

export type EventId = "poked" | "scratched" | "belly_enjoyed" | "belly_trap" | "named" | "ground_lost";

export interface EventDef {
  id: EventId;
  appraisal: Appraisal;
  /** The line pool its words come from (null: the words come from elsewhere, such as a memory line). */
  words: Trigger | null;
  /** If it can be repeated within a short time, which counter moves its lines through stages (LN-2). */
  repeat?: RepeatKind;
  /** Peak started it by itself (the user did nothing): it is then subject to the budget of `reactions.ts`. */
  automatic?: boolean;
  /** An automatic event does not start again within this long, ms. */
  cooldownMs?: number;
}

const a = (surprise: number, valence: number, arousal: number, aboutUser: number, control: number): Appraisal => ({ surprise, valence, arousal, aboutUser, control });

export const EVENTS: Record<EventId, EventDef> = {
  poked: { id: "poked", appraisal: a(0.25, 0.3, 0.4, 1, 0.6), words: "click", repeat: "click" },
  scratched: { id: "scratched", appraisal: a(0.15, 0.8, 0.4, 1, 0.7), words: "pet", repeat: "pet" },
  belly_enjoyed: { id: "belly_enjoyed", appraisal: a(0.15, 0.9, 0.15, 1, 0.6), words: "belly", repeat: "belly" },
  belly_trap: { id: "belly_trap", appraisal: a(0.7, -0.6, 0.6, 1, 0.2), words: "huff" },
  named: { id: "named", appraisal: a(0.15, 0.8, 0.4, 1, 0.7), words: null },
  ground_lost: { id: "ground_lost", appraisal: a(0.95, -0.5, 0.9, 0.3, 0.05), words: "fall", automatic: true, cooldownMs: 20_000 },
};

/**
 * The six feelings a brain can name (ADR-0016) as points of the same space: a mood tag sets an appraisal instead of
 * selecting a separate reaction. Sassy is shown as a smirk (the Gentle tone turns it into a nod outside of here).
 */
export const MOOD_APPRAISAL: Record<Mood, Appraisal> = {
  neutral: a(0.05, 0, 0.1, 0.5, 0.5),
  happy: a(0.15, 0.8, 0.4, 1, 0.7),
  warm: a(0.15, 0.9, 0.15, 1, 0.6),
  sassy: a(0.2, 0.2, 0.5, 1, 0.9),
  surprised: a(0.8, 0.3, 0.7, 0.5, 0.3),
  curious: a(0.5, 0.4, 0.5, 0.5, 0.5),
  sad: a(0.1, -0.8, 0.1, 0.5, 0.2),
};
