// What no line of Peak may say (spec 12 sections 1 and 2, ADR-0059): a count of days away, missing the person, loneliness, a
// streak, or asking the person for attention out of boredom. One table, used by the tests of every pool of lines
// (`pet.test.ts` for the scripted and memory lines, `farewell.test.ts` for the goodbyes of "Lượn đi").

export const BANNED: Record<"en" | "vi" | "ja", RegExp[]> = {
  en: [/miss(ed)? you/i, /\bmiss\b/i, /lonel/i, /without you/i, /totally fine/i, /in a row/i, /days? running/i, /streak/i, /entertain me/i, /not even a/i, /remembered i exist/i, /took you long/i],
  vi: [/nhớ bạn/i, /cô đơn/i, /buồn quá/i, /buồn lắm/i, /hoàn toàn ổn/i, /liên tục/i, /ngày liền/i, /giải trí cho mình/i, /nhớ ra là mình/i, /lâu thật/i, /không có \{me\}/i],
  ja: [/さびしが/, /さびしかったよ/, /さびしくなんか/, /さみしが/, /恋しい/, /ぜんぜん平気/, /連続/, /相手して/, /思い出したんだ/, /遅かったね/, /日ぶり/],
};
