// Run with: node --test src/lib/pet.test.ts   (Node 22+ strips TypeScript types natively)
import test from "node:test";
import assert from "node:assert/strict";
import { LINES } from "./lines.ts";
import type { Band, Lang, Trigger } from "./lines.ts";
import { candidates, pick, remember, resolveLang } from "./selector.ts";
import type { Ctx } from "./selector.ts";
import {
  AI_CHAT_DAILY_CAP,
  AI_COOLDOWN_MS,
  AI_NOTE_DAILY_CAP,
  AI_PROACTIVE_DAILY_CAP,
  aiGate,
  coolDown,
  defaultAi,
  recordAi,
  recordConsentAsk,
  recordEvent,
  recordHint,
  recordScratch,
  shouldHintGesture,
  shouldOfferUpdate,
  snoozeUpdate,
  setConsent,
  shouldAskConsent,
  TELEMETRY_QUEUE_MAX,
  DAILY_CLOSENESS_CAP,
  defaultData,
  isNight,
  interact,
  parse,
  recordAsk,
  shouldAskBrain,
  snoozeAsk,
  startSession,
  tick,
  tierOf,
  dayKey,
} from "./state.ts";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T0 = new Date(2026, 10, 7, 12, 0, 0).getTime();

const LANGS: Lang[] = ["vi", "en", "ja"];
const BANDS: Band[] = ["sleepy", "content", "playful", "bored", "lonely"];
const ctx = (over: Partial<Ctx> = {}): Ctx => ({ lang: "en", tier: 1, band: "content", hour: 12, gentle: false, ...over });

test("every core trigger has a line for every language, tier, band and tone", () => {
  const triggers: Trigger[] = ["greeting", "return", "morning", "long", "idle", "click", "pet", "snack", "play", "how"];
  for (const lang of LANGS)
    for (const tier of [1, 2, 3, 4])
      for (const band of BANDS)
        for (const gentle of [false, true])
          for (const t of triggers)
            assert.ok(candidates(t, ctx({ lang, tier, band, gentle })).length > 0, `${lang} ${t} tier${tier} ${band} gentle=${gentle}`);
});

test("night lines exist at night hours, brain hints for tier 3+, milestones for 3/7/30", () => {
  for (const lang of LANGS) {
    for (const hour of [23, 0, 3, 4]) assert.ok(candidates("night", ctx({ lang, hour })).length > 0);
    assert.equal(candidates("night", ctx({ lang, hour: 12 })).length, 0);
    assert.equal(candidates("brainhint", ctx({ lang, tier: 1 })).length, 0);
    assert.ok(candidates("brainhint", ctx({ lang, tier: 3 })).length > 0);
    for (const days of [3, 7, 30]) assert.ok(candidates("milestone", ctx({ lang, days })).length > 0);
    assert.equal(candidates("milestone", ctx({ lang, days: 5 })).length, 0);
  }
});

test("line ids are unique and no line is empty", () => {
  const ids = new Set(LINES.map((l) => l.id));
  assert.equal(ids.size, LINES.length);
  for (const l of LINES) assert.ok(l.text.trim().length > 0 && !l.text.startsWith("~"));
});

test("line pools are rich enough, readable and free of repeats", () => {
  for (const lang of LANGS) {
    const mine = LINES.filter((l) => l.lang === lang);
    assert.ok(mine.length >= 150, `${lang} has ${mine.length} lines`);
    const texts = mine.map((l) => l.text.trim().toLowerCase());
    assert.equal(new Set(texts).size, texts.length, `${lang} has repeated lines`);
    for (const l of mine) assert.ok(l.text.length <= 110, `${l.id} is too long for a bubble (${l.text.length})`);
    // not all sarcasm: gentle users must still get plenty
    const spicy = mine.filter((l) => l.spicy).length;
    assert.ok(spicy / mine.length < 0.4 && spicy > 10, `${lang} spicy share ${spicy}/${mine.length}`);
    // the triggers that are actually used need real variety (at least 8 lines each)
    for (const t of ["greeting", "return", "morning", "night", "long", "idle", "click", "pet", "how", "hint"] as Trigger[])
      assert.ok(mine.filter((l) => l.trigger === t).length >= (t === "hint" ? 6 : 8), `${lang} ${t}`);
  }
  // all the languages should be about the same size
  const n = (lang: Lang) => LINES.filter((l) => l.lang === lang).length;
  assert.ok(Math.abs(n("vi") - n("en")) <= 4);
  assert.ok(Math.abs(n("ja") - n("en")) <= 4, `ja has ${n("ja")} lines, en ${n("en")}`);
});

test("gentle tone excludes spicy lines", () => {
  for (const lang of LANGS)
    for (const t of ["greeting", "return", "click", "pet"] as Trigger[])
      for (const l of candidates(t, ctx({ lang, gentle: true }))) assert.equal(l.spicy, false);
  assert.ok(LINES.some((l) => l.spicy));
});

test("pick avoids recent lines and falls back when all were used", () => {
  const c = ctx({ lang: "en" });
  const all = candidates("snack", c).map((l) => l.id);
  const seen = pick("snack", c, all.slice(0, -1), () => 0)!;
  assert.equal(seen.id, all[all.length - 1]);
  const again = pick("snack", c, all, () => 0)!;
  assert.notEqual(again.id, all[all.length - 1]);
  assert.equal(pick("night", ctx({ hour: 12 }), []), null);
});

test("remember keeps a rolling window without duplicates", () => {
  let r: string[] = [];
  for (let i = 0; i < 30; i++) r = remember(r, "id" + i, 24);
  assert.equal(r.length, 24);
  assert.deepEqual(remember(["a", "b"], "a"), ["b", "a"]);
});

test("resolveLang follows the setting, then the system language", () => {
  assert.equal(resolveLang("auto", "vi-VN"), "vi");
  assert.equal(resolveLang("auto", "en-US"), "en");
  assert.equal(resolveLang("vi", "en-US"), "vi");
  assert.equal(resolveLang("auto", "ja-JP"), "ja");
  assert.equal(resolveLang("auto", "ja"), "ja");
  assert.equal(resolveLang("ja", "en-US"), "ja");
  assert.equal(resolveLang("auto", "fr-FR"), "en");
});

test("tiers", () => {
  assert.deepEqual([0, 19, 20, 49, 50, 79, 80, 100].map(tierOf), [1, 1, 2, 2, 3, 3, 4, 4]);
});

test("new user: no return, first check-in gives closeness and streak 1", () => {
  const r = startSession(defaultData(T0), T0);
  assert.equal(r.returned, false);
  assert.equal(r.checkedIn, true);
  assert.equal(r.data.streak, 1);
  assert.equal(r.data.closeness, 13);
});

test("streak continues on consecutive days, resets after a gap, milestones fire once", () => {
  let d = startSession(defaultData(T0), T0).data;
  d = startSession(d, T0 + DAY).data;
  const third = startSession(d, T0 + 2 * DAY);
  assert.equal(third.data.streak, 3);
  assert.equal(third.milestone, 3);
  const sameDay = startSession(third.data, T0 + 2 * DAY + HOUR);
  assert.equal(sameDay.checkedIn, false);
  assert.equal(sameDay.milestone, null);
  const gap = startSession(sameDay.data, T0 + 5 * DAY);
  assert.equal(gap.data.streak, 1);
});

test("absence: returned after 3h, lonely after 24h, mood floor 25, closeness floor 10", () => {
  let d = { ...defaultData(T0), lastCheckIn: dayKey(T0), closeness: 12, mood: 60 };
  const short = startSession(d, T0 + 4 * HOUR);
  assert.equal(short.returned, true);
  assert.equal(short.lonely, false);
  const long = startSession(d, T0 + 30 * DAY);
  assert.equal(long.lonely, true);
  assert.ok(long.data.mood >= 25);
  assert.ok(long.data.closeness >= 10);
});

test("mood relaxes toward 50 from above and sinks slowly toward 25 from below", () => {
  const hi = tick({ ...defaultData(T0), mood: 80 }, T0 + 100 * 60_000);
  assert.equal(hi.mood, 70);
  const far = tick({ ...defaultData(T0), mood: 80 }, T0 + 10 * DAY);
  assert.equal(far.mood, 50);
  const lo = tick({ ...defaultData(T0), mood: 40 }, T0 + 10 * DAY);
  assert.equal(lo.mood, 25);
});

test("interaction raises mood; closeness gain is capped per day and resets next day", () => {
  let d = defaultData(T0);
  for (let i = 0; i < 20; i++) d = interact(d, "pet", T0);
  assert.equal(d.closeness, 10 + DAILY_CLOSENESS_CAP);
  assert.equal(d.mood, 100);
  d = interact(d, "pet", T0 + DAY);
  assert.equal(d.closeness, 10 + DAILY_CLOSENESS_CAP + 1);
});

test("parse is defensive", () => {
  assert.equal(parse("not json", T0).closeness, 10);
  assert.equal(parse(null, T0).hush, false);
  const odd = parse(JSON.stringify({ mood: 9999, closeness: -5, settings: { freq: "bogus", qhStart: 99 } }), T0);
  assert.equal(odd.mood, 100);
  assert.equal(odd.closeness, 10);
  assert.equal(odd.hush, false, "an odd old value is not Quiet");
  assert.equal("freq" in odd.settings || "qhStart" in odd.settings, false, "the retired settings are gone");
});

test("the night is 23:00 to 07:00 by the clock, with no setting", () => {
  assert.equal(isNight(23), true);
  assert.equal(isNight(0), true);
  assert.equal(isNight(6), true);
  assert.equal(isNight(7), false);
  assert.equal(isNight(12), false);
  assert.equal(isNight(22), false);
});

test("a person who had chosen Quiet at the retired setting of chattiness stays hushed, once and for good; others are not", () => {
  const old = (freq: string) => parse(JSON.stringify({ mood: 60, settings: { freq, qhOn: true, qhStart: 20, qhEnd: 6 } }), T0);
  assert.equal(old("quiet").hush, true);
  assert.equal(old("normal").hush, false);
  assert.equal(old("chatty").hush, false);
  // once saved, the new flag decides and the old value is not looked at again
  assert.equal(parse(JSON.stringify({ hush: false, settings: { freq: "quiet" } }), T0).hush, false);
  assert.equal(parse(JSON.stringify({ hush: true }), T0).hush, true);
  // and it survives a round trip
  assert.equal(parse(JSON.stringify(old("quiet")), T0).hush, true);
});

test("brain ask: only after a signal, never with a key, max 3 asks, respects snooze", () => {
  let d = defaultData(T0);
  assert.equal(shouldAskBrain(d, T0, false), false); // never at install
  d = { ...d, brain: { ...d.brain, menuOpens: 2 } };
  assert.equal(shouldAskBrain(d, T0, false), false);
  d = { ...d, brain: { ...d.brain, menuOpens: 3 } };
  assert.equal(shouldAskBrain(d, T0, false), true);
  assert.equal(shouldAskBrain(d, T0, true), false); // already has a key
  d = { ...defaultData(T0), brain: { ...defaultData(T0).brain, chatTries: 1 } };
  assert.equal(shouldAskBrain(d, T0, false), true); // tried to type
  d = recordAsk(d);
  assert.equal(d.brain.asks, 1);
  assert.equal(d.brain.chatTries, 0);
  d = snoozeAsk({ ...d, brain: { ...d.brain, chatTries: 1 } }, T0);
  assert.equal(shouldAskBrain(d, T0 + DAY, false), false); // snoozed 2 days
  assert.equal(shouldAskBrain(d, T0 + 2 * DAY + 1, false), true);
  d = { ...d, brain: { ...d.brain, asks: 3 } };
  assert.equal(shouldAskBrain(d, T0 + 30 * DAY, false), false); // limit reached
});

test("AI usage: daily caps, cooldown after a rate limit, reset next day", () => {
  let d = defaultData(T0);
  assert.equal(aiGate(d, "chat", T0), "ok");
  for (let i = 0; i < AI_PROACTIVE_DAILY_CAP; i++) d = recordAi(d, "proactive", T0);
  assert.equal(aiGate(d, "proactive", T0), "cap");
  assert.equal(aiGate(d, "chat", T0), "ok"); // caps are independent
  assert.equal(aiGate(d, "proactive", T0 + DAY), "ok"); // new day
  for (let i = 0; i < AI_CHAT_DAILY_CAP; i++) d = recordAi(d, "chat", T0);
  assert.equal(aiGate(d, "chat", T0), "cap");
  // fact-noting requests have their own counter and never use up the chat cap
  let n = defaultData(T0);
  for (let i = 0; i < AI_NOTE_DAILY_CAP; i++) n = recordAi(n, "note", T0);
  assert.equal(aiGate(n, "note", T0), "cap");
  assert.equal(aiGate(n, "chat", T0), "ok");
  assert.equal(n.ai.chat, 0);
  assert.equal(aiGate(n, "note", T0 + DAY), "ok");
  // data saved before the note counter existed still works
  const old = { ...defaultData(T0), ai: { day: dayKey(T0), chat: 5, proactive: 1, coolUntil: 0 } as unknown as ReturnType<typeof defaultAi> };
  assert.equal(aiGate(old, "note", T0), "ok");
  assert.equal(recordAi(old, "note", T0).ai.note, 1);
  d = coolDown(defaultData(T0), T0);
  assert.equal(aiGate(d, "chat", T0 + 1000), "cooldown");
  assert.equal(aiGate(d, "chat", T0 + AI_COOLDOWN_MS + 1), "ok");
});

test("telemetry: nothing is recorded without consent", () => {
  const d = defaultData(T0);
  assert.equal(d.telemetry.consent, "unset");
  assert.deepEqual(recordEvent(d, "first_interaction", T0).telemetry.queue, []);
  const off = setConsent(d, "off", "id-1");
  assert.deepEqual(recordEvent(off, "first_interaction", T0).telemetry.queue, []);
  assert.equal(off.telemetry.installId, "");
});

test("telemetry: consent creates an id, backfills first_launch, records each event once", () => {
  let d = setConsent(defaultData(T0), "on", "id-1");
  assert.equal(d.telemetry.installId, "id-1");
  assert.deepEqual(d.telemetry.queue, [{ e: "first_launch", t: T0 }]);
  d = recordEvent(d, "first_interaction", T0 + 5);
  d = recordEvent(d, "first_interaction", T0 + 9); // once only
  d = recordEvent(d, "first_launch", T0 + 9); // already backfilled
  assert.deepEqual(d.telemetry.queue.map((q) => q.e), ["first_launch", "first_interaction"]);
  assert.equal(setConsent(d, "on", "other").telemetry.installId, "id-1"); // id is stable
});

test("telemetry: turning off deletes the id and the queue; asks are limited", () => {
  let d = setConsent(defaultData(T0), "on", "id-1");
  d = recordEvent(d, "key_valid", T0);
  d = setConsent(d, "off", "x");
  assert.equal(d.telemetry.consent, "off");
  assert.equal(d.telemetry.installId, "");
  assert.deepEqual(d.telemetry.queue, []);
  assert.equal(shouldAskConsent(d), false); // answered
  let u = defaultData(T0);
  assert.equal(shouldAskConsent(u), true);
  u = recordConsentAsk(recordConsentAsk(u));
  assert.equal(shouldAskConsent(u), false); // max asks reached without an answer
});

test("telemetry: queue is capped and parse never trusts the file", () => {
  let d = setConsent(defaultData(T0), "on", "id-1");
  for (let i = 0; i < 300; i++) d = { ...d, telemetry: { ...d.telemetry, done: [] } }, (d = recordEvent(d, "e" + i, T0 + i));
  assert.equal(d.telemetry.queue.length, TELEMETRY_QUEUE_MAX);
  assert.equal(d.telemetry.queue.at(-1)!.e, "e299");
  // a file with events but no consent must not keep an id or a queue
  const p = parse(JSON.stringify({ telemetry: { consent: "off", installId: "leak", queue: [{ e: "x", t: 1 }] } }), T0);
  assert.equal(p.telemetry.installId, "");
  assert.deepEqual(p.telemetry.queue, []);
  const junk = parse(JSON.stringify({ telemetry: { consent: "on", installId: "id", queue: [{ e: 5, t: "a" }, { e: "ok", t: 1 }, null, { e: "a".repeat(80), t: 2 }] } }), T0);
  assert.deepEqual(junk.telemetry.queue, [{ e: "ok", t: 1 }]);
  assert.equal(parse(JSON.stringify({ mood: 50 }), T0).telemetry.consent, "unset");
});

test("gesture hints: spaced out, limited, and stop once the user has scratched", () => {
  let d = defaultData(T0);
  assert.equal(shouldHintGesture(d, T0), true);
  d = recordHint(d, T0);
  assert.equal(shouldHintGesture(d, T0 + HOUR), false); // too soon
  assert.equal(shouldHintGesture(d, T0 + 21 * HOUR), true);
  d = recordHint(recordHint(d, T0 + 21 * HOUR), T0 + 42 * HOUR);
  assert.equal(shouldHintGesture(d, T0 + 90 * HOUR), false); // max 3 hints
  const learned = recordScratch(defaultData(T0));
  assert.equal(shouldHintGesture(learned, T0 + 90 * HOUR), false);
  assert.equal(learned.gestures.scratches, 1);
  assert.deepEqual(parse(JSON.stringify({ mood: 50 }), T0).gestures, { scratches: 0, hints: 0, lastHint: 0, rubs: 0, bellyHints: 0, lastBellyHint: 0 });
});

test("update offers: a snooze silences that version for a day, a newer version is offered at once", () => {
  let d = defaultData(T0);
  assert.equal(shouldOfferUpdate(d, "0.2.0", T0), true);
  d = snoozeUpdate(d, "0.2.0", T0);
  assert.equal(shouldOfferUpdate(d, "0.2.0", T0 + HOUR), false);
  assert.equal(shouldOfferUpdate(d, "0.2.0", T0 + 25 * HOUR), true);
  assert.equal(shouldOfferUpdate(d, "0.2.1", T0 + HOUR), true); // a newer version is a new offer
  assert.deepEqual(parse(JSON.stringify({ mood: 50 }), T0).update, { offered: "", snoozeUntil: 0 });
  assert.equal(parse(JSON.stringify({ update: { offered: 5, snoozeUntil: "x" } }), T0).update.snoozeUntil, 0);
});

test("hint lines exist in both languages and in gentle tone", () => {
  for (const lang of LANGS)
    for (const gentle of [false, true]) assert.ok(candidates("hint", ctx({ lang, gentle })).length > 0, `${lang} gentle=${gentle}`);
});

test("parse keeps AI usage and defaults old saves", () => {
  assert.deepEqual(parse(JSON.stringify({ mood: 50 }), T0).ai, defaultAi());
  const p = parse(JSON.stringify({ ai: { day: "2026-11-07", chat: 3, proactive: 2, coolUntil: 9 } }), T0);
  assert.deepEqual(p.ai, { day: "2026-11-07", chat: 3, proactive: 2, note: 0, coolUntil: 9 });
});

test("parse restores brain bookkeeping and defaults old saves", () => {
  const old = parse(JSON.stringify({ mood: 50 }), T0);
  assert.equal(old.brain.asks, 0);
  const saved = parse(JSON.stringify({ brain: { asks: 2, snoozeUntil: 5, menuOpens: 4, chatTries: 1, connectedAt: 9 } }), T0);
  assert.deepEqual(saved.brain, { asks: 2, snoozeUntil: 5, menuOpens: 4, chatTries: 1, connectedAt: 9 });
  assert.equal(parse(JSON.stringify({ brain: { asks: "x" } }), T0).brain.asks, 0);
});

import { recordBellyHint, recordRub, shouldHintBelly } from "./state.ts";

test("belly lines exist in every language, in gentle tone, and stay short", () => {
  for (const lang of ["en", "vi", "ja"] as const)
    for (const trig of ["belly", "huff", "hintbelly"] as Trigger[]) {
      for (const gentle of [false, true]) assert.ok(candidates(trig, ctx({ lang, gentle })).length > 0, `${lang} ${trig} gentle=${gentle}`);
      for (const l of LINES.filter((x) => x.lang === lang && x.trigger === trig)) assert.ok(l.text.length <= 110, l.text);
    }
});

test("the belly hint waits for the head scratch, is spaced out, limited, and stops after a rub", () => {
  const T = Date.UTC(2026, 10, 8);
  let d = defaultData(T);
  assert.equal(shouldHintBelly(d, T + 90 * HOUR), false); // head scratch not discovered yet
  d = recordScratch(d);
  assert.equal(shouldHintBelly(d, T + 90 * HOUR), true);
  d = recordBellyHint(d, T + 90 * HOUR);
  assert.equal(shouldHintBelly(d, T + 91 * HOUR), false); // too soon
  d = recordBellyHint(d, T + 120 * HOUR);
  assert.equal(shouldHintBelly(d, T + 200 * HOUR), false); // max 2
  assert.equal(shouldHintBelly(recordRub(recordScratch(defaultData(T))), T + 90 * HOUR), false);
});

import { markStartupDone, recordStartupAsk, shouldAskStartup } from "./state.ts";

test("the 'start with Windows' question is polite: not on day one, twice at most, spaced, never after yes", () => {
  const T = Date.UTC(2026, 10, 8);
  let d = defaultData(T);
  assert.equal(shouldAskStartup(d, T, 1), false); // first day of use
  assert.equal(shouldAskStartup(d, T + 5 * HOUR, 2), true);
  d = recordStartupAsk(d, T);
  assert.equal(shouldAskStartup(d, T + 10 * HOUR, 3), false); // too soon
  assert.equal(shouldAskStartup(d, T + 80 * HOUR, 3), true);
  d = recordStartupAsk(d, T + 80 * HOUR);
  assert.equal(shouldAskStartup(d, T + 400 * HOUR, 9), false); // twice is enough
  assert.equal(shouldAskStartup(markStartupDone(defaultData(T)), T + 400 * HOUR, 9), false);
  assert.deepEqual(parse(JSON.stringify({ mood: 50 }), T).startup, { asks: 0, lastAsk: 0, done: false });
});

import { finishTour } from "./state.ts";

test("the tour is shown once: a fresh state has not seen it, finishing marks it, old files parse as not seen", () => {
  const d = defaultData(1);
  assert.equal(d.tour.done, false);
  assert.equal(finishTour(d).tour.done, true);
  assert.equal(parse(JSON.stringify({ mood: 50 }), 1).tour.done, false); // the page marks existing users as done on load
  assert.equal(parse(JSON.stringify({ tour: { done: true } }), 1).tour.done, true);
});

import { bumpDay, countsDaily, setDailyCounts, shouldAskDaily, recordDailyAsk, CONSENT_VERSION } from "./state.ts";

test("per-day counters need consent at the current wording", () => {
  const off = defaultData(1);
  assert.equal(bumpDay(off, "scratch", 1000), off); // never agreed: nothing recorded
  const on2 = setConsent(defaultData(1), "on", "id");
  assert.equal(on2.telemetry.consentV, CONSENT_VERSION);
  assert.equal(bumpDay(on2, "scratch", 1000).telemetry.days[0].scratch, 1);
  const old = parse(JSON.stringify({ telemetry: { consent: "on", installId: "x", queue: [], done: [], days: [{ d: "2026-11-08", scratch: 3 }] } }), 1);
  assert.equal(old.telemetry.consentV, 1); // written under the first wording
  assert.deepEqual(old.telemetry.days, []); // so its counters are not honoured
  assert.equal(countsDaily(old), false);
  assert.equal(bumpDay(old, "scratch", 1000), old);
});

test("opting out, or turning daily counts off, deletes the counters; the funnel stays", () => {
  let d = setConsent(defaultData(1), "on", "id");
  d = bumpDay(d, "poke", 1000);
  d = recordEvent(d, "first_interaction", 1000);
  const noDaily = setDailyCounts(d, false);
  assert.deepEqual(noDaily.telemetry.days, []);
  assert.equal(noDaily.telemetry.consent, "on");
  assert.equal(noDaily.telemetry.queue.length >= 1, true);
  assert.equal(countsDaily(noDaily), false);
  assert.equal(countsDaily(setDailyCounts(noDaily, true)), true);
  const off = setConsent(d, "off", "");
  assert.deepEqual(off.telemetry.days, []);
  assert.equal(off.telemetry.consentV, 0);
  assert.equal(setDailyCounts(defaultData(1), true).telemetry.consent, "unset"); // cannot turn on without consent
});

test("a version-1 user is asked about daily counts at most twice; others never", () => {
  const old = parse(JSON.stringify({ telemetry: { consent: "on", installId: "x" } }), 1);
  assert.equal(shouldAskDaily(old), true);
  assert.equal(shouldAskDaily(recordDailyAsk(recordDailyAsk(old))), false);
  assert.equal(shouldAskDaily(setConsent(defaultData(1), "on", "id")), false); // already at the current wording
  assert.equal(shouldAskDaily(defaultData(1)), false); // never agreed
});

test("a saved file round-trips the counters and the consent version", () => {
  let d = setConsent(defaultData(5), "on", "id");
  d = bumpDay(bumpDay(d, "rub", 86_400_000 * 20000), "chat", 86_400_000 * 20000, 2);
  const again = parse(JSON.stringify(d), 5);
  assert.deepEqual(again.telemetry.days, d.telemetry.days);
  assert.equal(again.telemetry.consentV, CONSENT_VERSION);
});

test("Japanese lines: written in Japanese, with the same triggers, tiers, bands and sarcasm as the English ones", () => {
  const ja = LINES.filter((l) => l.lang === "ja");
  const en = LINES.filter((l) => l.lang === "en");
  const jp = /[぀-ヿ一-鿿]/;
  for (const l of ja) assert.ok(jp.test(l.text), `${l.id} has no Japanese characters: ${l.text}`);
  // the lines are translated one to one: the same ids apart from the language, the same spicy marks
  const key = (l: { id: string }) => l.id.slice(l.id.indexOf(".") + 1);
  assert.deepEqual(ja.map(key), en.map(key));
  assert.deepEqual(ja.map((l) => l.spicy), en.map((l) => l.spicy));
  // no Vietnamese diacritics and no plain English sentence left behind
  for (const l of ja) assert.ok(!/[ăâêôơưđạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữự]/i.test(l.text), l.text);
  // the voice (ADR-0038): casual, warm; no polite です/ます endings and no cat-speak にゃ in the scripted lines
  for (const l of ja) {
    assert.ok(!/です[。！？…」）]|ます[。！？…」）]|にゃ/.test(l.text), `${l.id} is not in the casual voice: ${l.text}`);
  }
});
