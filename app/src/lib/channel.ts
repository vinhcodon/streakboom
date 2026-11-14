// The release channel of a version (ADR-0090): an even middle number is Stable (0.4.x, 0.6.x), an odd one is Preview
// (0.5.x, 0.7.x). The Rust side has the same rule in `updater.rs` (`channel_of`); it picks the update manifest. Anything that is
// not three numbers counts as Stable, the safe side: Stable never reads the Preview manifest.

export type Channel = "stable" | "preview";

export type UpdateMode = "auto" | "ask" | "off";

/**
 * What the update setting does on this build (ADR-0095). Auto installs a newer Stable by itself on a Stable copy; on a Preview
 * copy it behaves as Ask, so that a tester is never moved to Stable silently.
 */
export function effectiveUpdateMode(mode: UpdateMode, channel: Channel): UpdateMode {
  return mode === "auto" && channel === "preview" ? "ask" : mode;
}

export function channelOf(version: string): Channel {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());
  if (!m) return "stable";
  return Number(m[2]) % 2 === 1 ? "preview" : "stable";
}
