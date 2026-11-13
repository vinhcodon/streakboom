import { test } from "node:test";
import assert from "node:assert/strict";
import { channelOf, effectiveUpdateMode } from "./channel.ts";

test("an even middle number is Stable and an odd one is Preview", () => {
  for (const v of ["0.4.0", "0.4.2", "0.6.0", "0.6.7", "0.0.1", "1.2.3", "2.0.0"]) assert.equal(channelOf(v), "stable", v);
  for (const v of ["0.5.0", "0.5.12", "0.7.1", "1.1.0", "0.3.2"]) assert.equal(channelOf(v), "preview", v);
});

test("the version in hand today is on the Stable line", () => {
  assert.equal(channelOf("0.4.2"), "stable");
});

test("a leading v and a suffix do not change the channel; anything else is Stable", () => {
  assert.equal(channelOf("v0.5.1"), "preview");
  assert.equal(channelOf(" 0.5.1 "), "preview");
  assert.equal(channelOf("0.5.1-rc.1"), "preview");
  for (const v of ["", "abc", "0.5", "5", "0.x.1", "0.5.x", "-0.5.1"]) assert.equal(channelOf(v), "stable", `"${v}"`);
});

test("the middle number of the app itself is read the same way as the Rust side reads it (a table both share)", () => {
  // The same cases are asserted in updater.rs; if one side changes, both tests must change together.
  const table: [string, "stable" | "preview"][] = [["0.4.2", "stable"], ["0.5.0", "preview"], ["0.6.0", "stable"], ["0.7.3", "preview"], ["junk", "stable"]];
  for (const [v, ch] of table) assert.equal(channelOf(v), ch, v);
});

test("Auto installs by itself only on a Stable copy; on a Preview copy it asks (ADR-0095)", () => {
  assert.equal(effectiveUpdateMode("auto", "stable"), "auto");
  assert.equal(effectiveUpdateMode("auto", "preview"), "ask");
  assert.equal(effectiveUpdateMode("ask", "stable"), "ask");
  assert.equal(effectiveUpdateMode("ask", "preview"), "ask");
  assert.equal(effectiveUpdateMode("off", "stable"), "off");
  assert.equal(effectiveUpdateMode("off", "preview"), "off");
});
