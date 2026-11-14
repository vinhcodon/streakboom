// "Lượn đi" (spec 14, story S2, ADR-0086, ADR-0095): the person types a command to go away, Peak says a short goodbye, walks to the
// nearest side edge, leaves, and comes back by itself after AWAY_MINUTES at the edge it left by, or at once when the person
// shows it from the tray. Pure rules and the goodbye lines; the page does the walking and Rust hides and shows the window.
//
// On a Preview build from the start (ADR-0097); on every build from Stable 0.8.0 on (ADR-0100: the Stable got it when its line was promoted).
// The goodbyes are NOT part of the counted pools of scripted lines (the README says how many those are); they have their own
// list and their own test against the banned patterns (banned.ts): no guilt, no counting of time, no "missed you", no "come
// back soon". Peak asks nothing and promises nothing; it just goes for a walk.

import { matchIntent } from "./intents.ts";

export type FarewellLang = "vi" | "en" | "ja";

/** How long Peak stays away before it comes back by itself (the author's answer, ADR-0086). */
export const AWAY_MINUTES = 20;
/** The goodbye stays this long on the screen before the walk to the edge begins. */
export const FAREWELL_BUBBLE_MS = 2400;
/**
 * The pace of the walk to the edge (logical px a second), about three times the ordinary walk (36): the pace Peak already uses to
 * walk to a wall it will climb. At the ordinary pace half a screen took 20 to 40 seconds.
 */
export const LEAVE_PACE_PX_S = 110;
/** The walk to the edge gets its time from the distance (`leaveDeadlineMs`), within these bounds. */
export const LEAVE_DEADLINE_MIN_MS = 6000;
export const LEAVE_DEADLINE_MAX_MS = 20_000;

/**
 * How long the walk to the edge may take for `roomPx` logical px to go: the walking time with a margin of 30 % and two seconds,
 * never less than 6 s and never more than 20 s. A walk that has not reached the edge by then is NOT finished by hiding Peak where
 * it stands: Peak stays, and the leaving is cancelled (ADR-0101). The first version gave every walk 12 s and, at the ordinary pace,
 * let it vanish in the middle of the screen when the edge was farther than about 430 px.
 */
export function leaveDeadlineMs(roomPx: number): number {
  const room = Number.isFinite(roomPx) ? Math.max(0, roomPx) : 0;
  const ms = Math.round((room / LEAVE_PACE_PX_S) * 1.3 * 1000 + 2000);
  return Math.min(LEAVE_DEADLINE_MAX_MS, Math.max(LEAVE_DEADLINE_MIN_MS, ms));
}
/** If the moment of the return is not right (a full-screen program), try again after this many seconds. */
export const RETRY_SECS = 300;

export const FAREWELLS: Record<FarewellLang, string[]> = {
  vi: [
    "Ừ, mình đi chơi chỗ khác nhé.",
    "Được rồi, mình đi dạo một lát.",
    "Mình lượn đây. Làm việc vui nha.",
    "Okê, mình đi tìm chỗ nắng.",
    "Mình đi đây, bạn cứ làm việc.",
    "Mình ra ngoài hóng gió nhé.",
  ],
  en: [
    "Okay, off I go.",
    "Sure, I'll wander off for a bit.",
    "Alright, going for a stroll.",
    "Off to find a sunny spot.",
    "I'll leave you to it.",
    "Going for a little walk.",
  ],
  ja: [
    "うん、ちょっとお散歩してくるね。",
    "わかった、あっちで遊んでくるよ。",
    "じゃあ、ひなたぼっこしてくるね。",
    "ちょっと出かけてくるね。",
    "お仕事がんばってね。じゃあね。",
    "ぶらっとしてくるよ。",
  ],
};

/** One goodbye, not the one just said (`last`), chosen with `rand` (a number in [0, 1), so that a test can fix it). */
export function pickFarewell(lang: FarewellLang, last: string | null, rand: () => number = Math.random): string {
  const pool = FAREWELLS[lang].filter((l) => l !== last);
  const from = pool.length ? pool : FAREWELLS[lang];
  return from[Math.min(from.length - 1, Math.floor(rand() * from.length))];
}

/** Is this whole message the command to go away? Only an exact phrase of the table acts; a pattern match would need a confirmation (not built). */
export function isLeaveCommand(text: string, names?: readonly string[]): boolean {
  const m = matchIntent(text, names);
  return m !== null && m.skill === "leave" && m.kind === "exact";
}

export interface LeaveGate {
  quiet: boolean;
  held: boolean;
  flying: boolean;
  /** Already away, or already on the way out. */
  away: boolean;
  leaving: boolean;
}

/** May Peak leave now? Not while it is in Quiet mode, carried, in the air, away or already leaving (any build: ADR-0100). */
export function mayLeave(g: LeaveGate): boolean {
  return !g.quiet && !g.held && !g.flying && !g.away && !g.leaving;
}

/** Which side edge is nearer: -1 (left) or 1 (right), from the room left to each edge in px; a tie goes right. */
export function nearerEdge(roomLeft: number, roomRight: number): -1 | 1 {
  return roomLeft < roomRight ? -1 : 1;
}
