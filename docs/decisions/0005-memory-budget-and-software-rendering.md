# ADR-0005: About 120 MB total memory; WebView2 runs with --disable-gpu

- **Status:** accepted
- **Date:** alpha 1.0 spikes (measured)
- **Decided by:** Vinh (author), with Claude

## Context
Spikes measured a continuous animation on a transparent window at 19 to 72% of a core with GPU compositing, against about 5% with software rendering of a 120 px pet; total memory was 95 to 121 MB, never near 40 MB.

## Decision
Target at most 120 MB for all processes. WebView2 is started with --disable-gpu (set through additionalBrowserArgs, which also repeats wry's default disable-features list). A standing pet does not repaint at all.

## Alternatives considered
Keeping GPU compositing (measured as far more expensive); a native toolkit (rejected, see ADR-0004).

## Consequences and when to revisit
Walking is still the costly state (about 7 to 15% of one core across processes). Only one machine has been measured.

## Sources
docs/engineering-log.md (spikes M0, M0b, M0c, and the CPU entry)
