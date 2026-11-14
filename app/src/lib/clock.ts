// What the pet tells the chat model about the time (the author's clock, never sent anywhere else).
//
// The first version of the unprompted AI line said "Bây giờ là 10 giờ." and nothing more: in Vietnamese "10 giờ" with no
// word for the part of the day was read as 10 at night while it was 10 in the morning. The model now gets the clock in a form
// that cannot be read two ways: the 24-hour time and the part of the day in words, worked out here, not guessed there.
import { partOf, type Part } from "./memory.ts";

const PART_WORDS: Record<string, Record<Part, string>> = {
  vi: { morning: "buổi sáng", afternoon: "buổi chiều", evening: "buổi tối", night: "ban đêm" },
  ja: { morning: "朝", afternoon: "午後", evening: "夜", night: "夜中" },
  en: { morning: "morning", afternoon: "afternoon", evening: "evening", night: "night" },
};

const hh = (n: number) => String(Math.min(23, Math.max(0, Math.trunc(n) || 0))).padStart(2, "0");

/** "It is 10:00 (morning)." in the app's language: the 24-hour time and the part of the day, in words. */
export function clockPhrase(lang: string, hour: number): string {
  const part = partOf(Math.min(23, Math.max(0, Math.trunc(hour) || 0)));
  const w = (PART_WORDS[lang] ?? PART_WORDS.en)[part];
  if (lang === "vi") return `Bây giờ là ${hh(hour)}:00 (${w}).`;
  if (lang === "ja") return `いまは${hh(hour)}:00（${w}）だよ。`;
  return `It is ${hh(hour)}:00 (${w}).`;
}

/** The line added to the chat's instructions: local time, the weekday and the part of the day, in English. Nothing else (no date, no zone, no place). */
export function clockLine(d: Date): string {
  const time = `${hh(d.getHours())}:${String(d.getMinutes()).padStart(2, "0")}`;
  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
  return `${time}, ${weekday}, ${PART_WORDS.en[partOf(d.getHours())]}`;
}
