// The input map (spec 17, ADR-0109): every action Peak has a name for, the gesture that reaches it, the skill that
// implements it, and the gates that may refuse it. The table is fixed in the program; there is no setting to remap it
// (charter: few settings). Pure data and one pure resolver; the page runs the action by name.

/** The closed list of gestures. A new gesture is an ADR: it is a new thing the person must learn and Peak must sense. */
export const GESTURES = [
  "click",
  "double_click",
  "drag",
  "sweep_head",
  "sweep_belly",
  "right_click",
  "right_double_click",
  "tray_click",
] as const;
export type Gesture = (typeof GESTURES)[number];

export type Gate = "not_held" | "not_quiet" | "not_flying" | "not_away" | "not_leaving" | "cooldown";

export type BindingStatus = "built" | "proposed";

export interface Binding {
  /** snake_case, never changes: counts, the trace and the skill files call the action by this. */
  name: string;
  gesture: Gesture | null;
  /** The skill file that implements it and carries its typed phrases, if any. */
  skill: string | null;
  gates: readonly Gate[];
  status: BindingStatus;
}

export const BINDINGS: readonly Binding[] = [
  { name: "poke", gesture: "click", skill: null, gates: ["not_held", "not_quiet"], status: "built" },
  { name: "scratch", gesture: "sweep_head", skill: null, gates: ["not_held", "not_quiet"], status: "built" },
  { name: "belly_rub", gesture: "sweep_belly", skill: null, gates: ["not_held", "not_quiet"], status: "built" },
  { name: "carry", gesture: "drag", skill: null, gates: ["not_quiet"], status: "built" },
  { name: "open_chat", gesture: "double_click", skill: null, gates: ["not_quiet"], status: "built" },
  { name: "shove", gesture: "right_click", skill: null, gates: ["not_quiet", "not_held", "cooldown"], status: "built" },
  { name: "step_aside", gesture: "right_double_click", skill: "aside", gates: ["not_held", "not_flying", "not_away", "not_leaving", "cooldown"], status: "proposed" },
  { name: "leave", gesture: null, skill: "leave", gates: ["not_held", "not_flying", "not_away", "not_leaving"], status: "built" },
  { name: "seat", gesture: null, skill: "seat", gates: ["not_held", "not_flying", "not_away"], status: "built" },
  { name: "toggle_visibility", gesture: "tray_click", skill: null, gates: [], status: "built" },
  { name: "quiet_toggle", gesture: null, skill: null, gates: [], status: "built" },
  { name: "settings", gesture: null, skill: null, gates: [], status: "built" },
  { name: "quit", gesture: null, skill: null, gates: [], status: "built" },
  { name: "make_way", gesture: null, skill: null, gates: [], status: "built" },
  { name: "escape_cover", gesture: null, skill: null, gates: [], status: "built" },
];

/** What the gates look at; the page fills it in from its own state. */
export interface BindState {
  held: boolean;
  quiet: boolean;
  flying: boolean;
  away: boolean;
  leaving: boolean;
  /** False while the shared cooldown of the push and the step aside (2.5 s) is running. */
  cooldownOk: boolean;
}

export function gateOpen(gate: Gate, s: BindState): boolean {
  switch (gate) {
    case "not_held": return !s.held;
    case "not_quiet": return !s.quiet;
    case "not_flying": return !s.flying;
    case "not_away": return !s.away;
    case "not_leaving": return !s.leaving;
    case "cooldown": return s.cooldownOk;
  }
}

export const bindingByName = (name: string): Binding | undefined => BINDINGS.find((b) => b.name === name);

/**
 * The action a gesture reaches right now, or null when a gate refuses it. A proposed action is not reachable yet, so
 * adding a row to the table changes no behaviour until its status is "built".
 */
export function resolveGesture(gesture: Gesture, s: BindState): string | null {
  const b = BINDINGS.find((x) => x.gesture === gesture && x.status === "built");
  if (!b) return null;
  return b.gates.every((g) => gateOpen(g, s)) ? b.name : null;
}
