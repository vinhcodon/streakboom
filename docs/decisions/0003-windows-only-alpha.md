# ADR-0003: Windows 10/11 only for the alpha

- **Status:** accepted
- **Date:** alpha 1.0 planning (original requirements, undated)
- **Decided by:** Vinh (author), with Claude

## Context
Transparent click-through windows, fullscreen detection and the credential store differ per OS; one platform keeps the alpha small.

## Decision
Windows with WebView2 first. macOS after the alpha validates the funnel. Linux is out of scope.

## Alternatives considered
Shipping macOS in the alpha (deferred).

## Consequences and when to revisit
A macOS port needs the private-API option for transparency (App Store implications) and a Keychain path; both are unverified.

## Sources
spec/04 section 7
