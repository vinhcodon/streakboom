// The budget and the priority of reactions (spec/09 section 3, RX-8): one reaction at a time, a higher one may break in,
// the same event does not repeat within its cool-down, and the reactions Peak starts by itself (the user did nothing) are
// few and spaced out. What the user does (a poke, a scratch) is never held back here. Pure; the page keeps one gate.

import type { EventDef } from "./events.ts";

export interface Gate {
  /** The reaction under way (null: none), with its priority. */
  active: { id: string; priority: number } | null;
  /** When each event last started, ms. */
  last: Record<string, number>;
  /** Start times of the automatic reactions in the last minute. */
  autoTimes: number[];
  /** When the last reaction ended, ms (-Infinity: none yet). */
  endedAt: number;
}

export const newGate = (): Gate => ({ active: null, last: {}, autoTimes: [], endedAt: -Infinity });

/** At most this many reactions that Peak starts by itself in a minute. */
export const AUTO_PER_MINUTE = 4;
/** After a reaction ends, an automatic one waits this long. */
export const AUTO_GAP_MS = 3_000;

/** How much a reaction matters: sudden and energetic ones outrank gentle ones (0 to 100). */
export const priorityOf = (ev: EventDef): number => Math.round(100 * (0.6 * ev.appraisal.surprise + 0.4 * ev.appraisal.arousal));

/**
 * May this event start now? A reaction the user caused always may, unless a higher one is under way. One Peak starts by
 * itself must also be past its cool-down, past the gap after the last reaction, and within the budget of a minute.
 */
export function mayReact(g: Gate, ev: EventDef, now: number): boolean {
  const p = priorityOf(ev);
  if (g.active && g.active.priority >= p) return false;
  if (!ev.automatic) return true;
  if (ev.cooldownMs && now - (g.last[ev.id] ?? -Infinity) < ev.cooldownMs) return false;
  if (now - g.endedAt < AUTO_GAP_MS) return false;
  if (g.autoTimes.filter((t) => now - t < 60_000).length >= AUTO_PER_MINUTE) return false;
  return true;
}

/** Record that the event started (call only after `mayReact` said yes). */
export function startReaction(g: Gate, ev: EventDef, now: number): Gate {
  return {
    active: { id: ev.id, priority: priorityOf(ev) },
    last: { ...g.last, [ev.id]: now },
    autoTimes: ev.automatic ? [...g.autoTimes.filter((t) => now - t < 60_000), now] : g.autoTimes.filter((t) => now - t < 60_000),
    endedAt: g.endedAt,
  };
}

/** Record that the reaction under way ended. */
export const endReaction = (g: Gate, now: number): Gate => ({ ...g, active: null, endedAt: now });
