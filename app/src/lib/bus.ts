// Messages between the three windows. The pet window ("main") owns all state and logic; the
// bubble and settings windows are views that send actions back. Everything is plain JSON.

import { emitTo } from "@tauri-apps/api/event";
import type { Lang } from "./lines.ts";
import type { Consent, Settings } from "./state.ts";

/** What the bubble window should show. The pet window resolves all text (language included). */
export type BubbleView =
  | { kind: "none" }
  | { kind: "say"; text: string }
  | {
      kind: "chat";
      phase: "compose" | "thinking" | "reply";
      canChat: boolean;
      placeholder: string;
      user: string; // the user's last message, shown small above the answer
      reply: string; // the pet's answer
      thinking: string; // text shown next to the dots
      slow: string; // extra hint when the answer takes long ("" = none)
    }
  | { kind: "ask"; text: string; yes: string; later: string }
  | { kind: "consent"; text: string; note: string; yes: string; no: string }
  | { kind: "update"; text: string; yes: string; later: string }
  // a yes/not-now question about a setting (currently only "start with Windows")
  | { kind: "choice"; id: "startup"; text: string; yes: string; later: string }
  // one step of the first-run tour
  | { kind: "tour"; step: number; total: number; text: string; next: string; skip: string }
  // a one-line question the user answers by typing (the pet's name, what to call the user)
  | { kind: "input"; field: MemField; text: string; placeholder: string; ok: string; skip: string };

export type MemField = "petName" | "callMe";

/** Bubble window -> pet window. */
export type BubbleAction =
  | { type: "chat-send"; text: string }
  | { type: "chat-blocked" } // the disabled text box was clicked (no brain yet)
  | { type: "typing"; nonEmpty: boolean }
  | { type: "choice"; id: "startup"; yes: boolean }
  | { type: "tour"; action: "next" | "skip" }
  | { type: "alive" } // the user is still here (clicked, focused or pressed a key in the bubble)
  | { type: "close" }
  | { type: "ask-yes" }
  | { type: "ask-later" }
  | { type: "update-yes" }
  | { type: "update-later" }
  | { type: "consent"; yes: boolean }
  | { type: "input"; field: MemField; value: string }
  | { type: "input-skip"; field: MemField };

/** What the "What the pet remembers" page shows. Plain numbers and names, nothing else. */
export interface MemoryView {
  learn: boolean;
  petName: string;
  callMe: string;
  days: number;
  sessions: number;
  bestStreak: number;
  usualPart: "morning" | "afternoon" | "evening" | "night" | null;
  touches: { poke: number; scratch: number; chat: number };
  marks: string[]; // ids of shared milestones
  aiLearn: boolean;
  facts: { id: string; text: string }[];
}

/** Pet window -> settings window, answering `settings-ready` and after every change. */
export interface SettingsSnapshot {
  lang: Lang;
  settings: Settings;
  consent: Consent;
  queued: number; // telemetry events recorded locally
  hasKey: boolean;
  brainBad: boolean;
  tier: number; // closeness tier, for the tone of the first AI line
  memory: MemoryView;
  /** What "Copy stats" puts on the clipboard. Empty unless the user opted in. */
  stats: { installId: string; events: { e: string; t: number }[] };
}

/** Settings window -> pet window. */
export type SettingsPatch =
  | { type: "setting"; key: keyof Settings; value: Settings[keyof Settings] }
  | { type: "consent"; yes: boolean }
  | { type: "tour" } // "show the tour again"
  | { type: "startup"; on: boolean } // they changed "start with Windows" in Settings
  | { type: "mem"; action: "set"; field: MemField; value: string }
  | { type: "mem"; action: "learn"; value: boolean }
  | { type: "mem"; action: "fact-set"; id: string; value: string }
  | { type: "mem"; action: "fact-del"; id: string }
  | { type: "mem"; action: "ai"; value: boolean }
  | { type: "mem"; action: "forget-habits" | "forget-facts" | "forget-all" }
  | { type: "track"; event: "get_key_clicked" | "returned_to_app" | "key_pasted" };

/** Settings window -> pet window, after the key or model changed (calls go straight to Rust). */
export type BrainChange =
  | { type: "connected"; reply: string; model: string }
  | { type: "removed" };

export const toBubble = (view: BubbleView) => emitTo("bubble", "bubble-view", view).catch(() => {});
export const fromBubble = (a: BubbleAction) => emitTo("main", "bubble-action", a).catch(() => {});
export const toSettings = (s: SettingsSnapshot) => emitTo("settings", "settings-snapshot", s).catch(() => {});
export const fromSettings = (p: SettingsPatch) => emitTo("main", "settings-patch", p).catch(() => {});
export const brainChanged = (c: BrainChange) => emitTo("main", "brain-changed", c).catch(() => {});
