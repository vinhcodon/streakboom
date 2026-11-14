# ADR-0105: The chat model is told the local time, the weekday and the part of the day

- **Status:** accepted (the author chose "yes, time and weekday" on 2026-11-14); built on branch `vanish`, shipped in Preview 0.9.3, **not yet seen** (V-135).
- **Date:** 2026-11-14
- **Decided by:** Vinh (author), recorded by Claude (the app session)

## Context
The author saw Peak say it was 10 at night at 10 in the morning. The unprompted AI line (`aiProactive`) told the model "Bây giờ là 10 giờ." with no part of the day: in Vietnamese "10 giờ" alone was read as 10 PM. The chat itself was given no clock, so a question like "mấy giờ rồi" could only be guessed. The scripted lines were not affected (they use the 24-hour clock).

## Decision
1. **The unprompted AI line states the time without ambiguity:** the 24-hour time and the part of the day in words, worked out in the program (`app/src/lib/clock.ts`, `clockPhrase`), in the app's language ("Bây giờ là 10:00 (buổi sáng).").
2. **The chat gets one added line** after the instructions: the local time, the weekday and the part of the day, in English, such as `10:05, Saturday, morning` (`clockLine`, `brain::with_clock`), with the rule to use it only when it fits (asked the time, a greeting) and never to guess another time or date. Nothing else is added: no date, no time zone, no place.
3. **Privacy:** the clock is the person's own and is already used by the scripted lines; it is now also sent to the model they connected, in the same request as the chat, and only when they chat or when the optional unprompted line is on. `docs/privacy.md` says so. It is not a new sense (the program already reads the time).

## Consequences
- One short line more per chat turn (about 15 tokens).
- The part-of-day boundaries are those of the rest of the app (`partOf`: morning 5 to 12, afternoon 12 to 18, evening 18 to 23, night 23 to 5).
- **Not verified:** the model's behaviour with the line, in the three languages, on a real model (V-135).

## Addendum (2026-11-15): the date is told too
The author tried the remind skill (ADR-0115) and saw that the model did not know today's date: asked "what day is it" it answered wrongly, and "today is my daughter's birthday" could not become a day to keep. Point 2 above said "no date"; that is reversed. The line is now `10:05, Saturday 14 November 2026, morning` (the local date in words, so that 14/11 and 11/14 cannot be mixed up), Rust keeps at most 64 characters, and the sentence that follows it says it may be used for the time, the date, a greeting and to turn "today", "tomorrow" or a weekday into a date. Still no time zone and no place. The date is the person's own computer date, sent only with a chat the person started, like the time (docs/privacy.md says so).
