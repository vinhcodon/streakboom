// What a pet can do in a talk (ADR-0141, layer L2): a profile file for each pet, read by the code that decides who may speak and rendered as a short
// layer of the prompt. The file holds wishes within bounds; the code keeps the bounds (a number is clamped, a switch that is not a boolean is off, an unknown
// key is ignored), so a hand-edited file can make a pet quieter or shorter but never louder than the charter allows. A new pet, or a pet that never
// speaks (a sticker), is a new file, not new code.

import peakJson from "./pets/peak.profile.json" with { type: "json" };
import pawsJson from "./pets/paws.profile.json" with { type: "json" };
import { PETS, type PetId } from "./duo.ts";

export interface PetProfile {
  id: PetId;
  name: string;
  /** "a cat", "a small dog": said to the model so that it knows who it is among the others. */
  species: string;
  /** false: the pet only gestures; it never has words for the person. */
  speaksToPerson: boolean;
  /** false: the pet never speaks to the other pet (no aside). */
  speaksToPet: boolean;
  /** false: the pet may not answer with a pass (a nod) when it speaks second. */
  mayPass: boolean;
  /** The longest line, in words. Clamped to 8..60. */
  maxWords: number;
  /** One more sentence for the prompt about how this pet takes part in a talk; at most 300 characters, never code. */
  note: string;
}

export const MAX_WORDS_MIN = 8;
export const MAX_WORDS_MAX = 60;
export const NOTE_MAX = 300;

function str(x: unknown, fallback: string, max: number): string {
  return typeof x === "string" && x.trim() ? x.trim().slice(0, max) : fallback;
}

/** Reads one profile: anything missing or odd gets the default of that pet, nothing throws. */
export function parseProfile(raw: unknown, id: PetId, fallback: PetProfile = defaultProfile(id)): PetProfile {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const bool = (k: string, d: boolean) => (typeof o[k] === "boolean" ? (o[k] as boolean) : d);
  const words = typeof o.maxWords === "number" && Number.isFinite(o.maxWords) ? Math.round(o.maxWords) : fallback.maxWords;
  return {
    id,
    name: str(o.name, fallback.name, 24),
    species: str(o.species, fallback.species, 40),
    speaksToPerson: bool("speaksToPerson", fallback.speaksToPerson),
    speaksToPet: bool("speaksToPet", fallback.speaksToPet),
    mayPass: bool("mayPass", fallback.mayPass),
    maxWords: Math.min(MAX_WORDS_MAX, Math.max(MAX_WORDS_MIN, words)),
    note: typeof o.note === "string" ? o.note.trim().slice(0, NOTE_MAX) : fallback.note,
  };
}

export function defaultProfile(id: PetId): PetProfile {
  return { id, name: id === "paws" ? "Paws" : "Peak", species: id === "paws" ? "a small dog" : "a cat", speaksToPerson: true, speaksToPet: true, mayPass: true, maxWords: 40, note: "" };
}

export type Profiles = Record<PetId, PetProfile>;

/** The profiles of the files in the program. */
export function loadProfiles(): Profiles {
  return { peak: parseProfile(peakJson, "peak"), paws: parseProfile(pawsJson, "paws") };
}

/** The same with overrides (a test, or a file read from elsewhere later). */
export function withProfiles(over: Partial<Record<PetId, unknown>>): Profiles {
  const base = loadProfiles();
  const out = { ...base };
  for (const id of PETS) if (over[id] !== undefined) out[id] = parseProfile(over[id], id, base[id]);
  return out;
}
