// The release channel of a version (ADR-0090): an even middle number is Stable (0.4.x, 0.6.x), an odd one is Preview
// (0.5.x, 0.7.x). The Rust side has the same rule in `updater.rs` (`channel_of`); it picks the update manifest. Anything that is
// not three numbers counts as Stable, the safe side: Stable never reads the Preview manifest.

export type Channel = "stable" | "preview";

export function channelOf(version: string): Channel {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version.trim());
  if (!m) return "stable";
  return Number(m[2]) % 2 === 1 ? "preview" : "stable";
}
