// Lines the pet says because it remembers something. They are only used right after the app
// starts and when the user touches the pet (never in unprompted chatter, which may be on a
// shared screen), and every line only appears if the memory behind it really exists.
// `{me}` is what the pet calls the user, `{pet}` its own name, `{n}` a number.
// A leading "~" marks a sarcastic line (dropped in gentle tone), as in lines.ts.

import { partOf, usualPart, type Memory, type Part } from "./memory.ts";
import type { Lang } from "./lines.ts";

export type MemKind = "greet" | "habit" | "away" | "named" | "calledMe" | "pet" | `mark.${string}`;

type Pool = string[];
const POOLS: Record<Lang, Record<string, Pool>> = {
  en: {
    greet: ["Hey {me}. Good to see you.", "{me}! There you are.", "Welcome back, {me}. I kept the desktop warm.", "~Oh, {me}. I almost got used to the quiet."],
    away: [
      "{n} days, {me}. I counted. Twice.",
      "~{n} days. I started talking to the icons again.",
      "You're back after {n} days. I'm fine. Totally fine.",
      "{n} days without you. The pixels got lonely, {me}.",
    ],
    "habit.morning": ["Morning again. You and I are early birds, it seems.", "Our usual morning shift. Coffee first?"],
    "habit.afternoon": ["The afternoon crowd again. Our usual.", "Afternoon, as usual. I know your type."],
    "habit.evening": ["Evening again. This is becoming our thing.", "Our usual evening spot. I saved it."],
    "habit.night": ["~Late again. This is becoming a habit. Mine too, apparently.", "Night owl hours. I'm awake for you."],
    named: ["{pet}. Hm. I'll answer to it. Mostly.", "{pet}... I like it. Don't tell anyone.", "I'm {pet} now. Official. Irreversible."],
    calledMe: ["{me}. Got it. I won't forget.", "Okay, {me}. It suits you.", "{me}, noted. In permanent ink. Well, in a file."],
    pet: ["Right there, {me}. That's the spot.", "~{me}, you know exactly where to scratch."],
    "mark.days.7": ["A week together, {me}. I'm not emotional. You are."],
    "mark.days.30": ["{n} different days with me. That's basically a relationship."],
    "mark.days.100": ["100 days, {me}. I'm putting that on the fridge."],
    "mark.touch.100": ["That's 100 pokes and scratches. I've lost count of the rest."],
    "mark.touch.500": ["500 touches. Is this how you check I'm real?"],
    "mark.chat.1": ["Our first real chat. I'll remember that one."],
    "mark.chat.25": ["25 conversations. You talk to me more than to some coworkers."],
  },
  vi: {
    greet: ["Chào {me}. Mừng gặp lại.", "{me}! Đây rồi.", "{me} về rồi. Mình giữ ấm màn hình nãy giờ.", "~Ồ, {me}. Mình suýt quen với yên tĩnh rồi."],
    away: [
      "{n} ngày rồi đó {me}. Mình đếm hai lần.",
      "~{n} ngày. Mình lại nói chuyện với mấy cái icon.",
      "{n} ngày mới thấy {me}. Mình ổn. Hoàn toàn ổn.",
      "{n} ngày không có {me}, màn hình buồn lắm.",
    ],
    "habit.morning": ["Lại buổi sáng. Hai đứa mình dậy sớm nhỉ.", "Ca sáng quen thuộc. Cà phê trước nhé?"],
    "habit.afternoon": ["Lại buổi chiều rồi. Quen quá.", "Buổi chiều như mọi khi. Mình biết tỏng."],
    "habit.evening": ["Lại buổi tối. Thành thói quen của mình rồi.", "Chỗ buổi tối quen thuộc. Mình giữ sẵn rồi."],
    "habit.night": ["~Lại khuya nữa. Thành thói quen rồi, mình cũng vậy.", "Giờ cú đêm. Mình thức cùng bạn."],
    named: ["{pet}. Ừm. Mình sẽ trả lời... phần lớn thời gian.", "{pet}... mình thích. Đừng kể ai.", "Từ giờ mình là {pet}. Chính thức, không đổi được."],
    calledMe: ["{me}. Mình nhớ rồi.", "Được, {me}. Hợp đó.", "{me}, ghi sổ rồi. Mực vĩnh viễn. À, ghi vào tệp."],
    pet: ["Đúng chỗ đó, {me}. Chính xác.", "~{me} biết gãi đúng chỗ ghê."],
    "mark.days.7": ["Một tuần bên nhau rồi, {me}. Mình không xúc động đâu. {me} thì có."],
    "mark.days.30": ["{n} ngày khác nhau bên mình. Gần như là một mối quan hệ."],
    "mark.days.100": ["100 ngày, {me}. Mình dán lên tủ lạnh."],
    "mark.touch.100": ["100 lần chọc và gãi rồi. Mấy lần sau mình không đếm nổi."],
    "mark.touch.500": ["500 lần chạm. Bạn kiểm tra xem mình có thật không à?"],
    "mark.chat.1": ["Lần đầu mình trò chuyện thật. Mình sẽ nhớ."],
    "mark.chat.25": ["25 cuộc trò chuyện. Bạn nói chuyện với mình nhiều hơn với vài đồng nghiệp đó."],
  },
};

export interface MemCtx {
  lang: Lang;
  gentle: boolean;
  hour: number;
  absentDays?: number;
  n?: number;
}

function fill(t: string, m: Memory, ctx: MemCtx): string {
  return t.replace(/\{me\}/g, m.callMe).replace(/\{pet\}/g, m.petName).replace(/\{n\}/g, String(ctx.n ?? ctx.absentDays ?? ""));
}

/** A line for this kind, or null if the memory behind it does not exist. */
export function memLine(kind: MemKind, m: Memory, ctx: MemCtx, rnd: () => number = Math.random): string | null {
  let key: string = kind;
  if (kind === "habit") {
    const p = usualPart(m);
    if (!p || partOf(ctx.hour) !== p) return null; // only when it is that time of day now
    key = `habit.${p satisfies Part}`;
  }
  const needsMe = kind === "greet" || kind === "pet" || kind === "calledMe";
  if (needsMe && !m.callMe) return null;
  if (kind === "named" && !m.petName) return null;
  if (kind === "away" && (ctx.absentDays ?? 0) < 2) return null;
  const pool = (POOLS[ctx.lang][key] ?? []).filter((t) => !(ctx.gentle && t.startsWith("~")));
  // lines that use {me} need a name; fall back to those without when it is unknown
  const usable = pool.filter((t) => m.callMe || !t.includes("{me}"));
  if (usable.length === 0) return null;
  const raw = usable[Math.floor(rnd() * usable.length)];
  return fill(raw.startsWith("~") ? raw.slice(1) : raw, m, ctx).replace(/\s+([.,!?])/g, "$1");
}

/** All keys that exist, for tests. */
export const allMemTexts = (lang: Lang): string[] => Object.values(POOLS[lang]).flat();
export const memKeys = (lang: Lang): string[] => Object.keys(POOLS[lang]);
