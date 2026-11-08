# ADR-0009: Telemetry is opt-in, anonymous and local; nothing is sent

- **Status:** accepted
- **Date:** alpha 1.0 planning (original requirements, undated) and 2026-11-08
- **Decided by:** Vinh (author), with Claude

## Context
The alpha needs funnel data without a server and without collecting content.

## Decision
Off by default. On consent a random install id is created; funnel event names with timestamps are recorded once per install in a local queue. Settings > Privacy has Copy stats so testers hand it over by hand. Opting out deletes the id and the data. No sending backend is chosen. Per-day counters (Bond Days) need new wording and a new consent version (ADR-0022).

## Alternatives considered
An analytics service from day one (deferred); always-on collection (rejected).

## Consequences and when to revisit
The funnel is only as good as testers' willingness to paste stats. The README and specs must always match what is recorded.

## Sources
spec/01 section 3b, spec/02 funnel, spec/05 section 6
