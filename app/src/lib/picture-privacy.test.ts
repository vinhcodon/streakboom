// PS-9: the privacy checks of the screen picture, on the page's side. The picture (a grey grid of at most 192 by 108 cells) is read for
// empty cells and dropped; these tests read the sources so that a later change that saves, logs or sends it fails here. They are checks of
// the code, not a proof of what a person's machine does (that stays in docs/plans/verification-debt.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DEFAULT_SETTINGS, defaultData, parse } from "./state.ts";

const src = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");

test("the pure modules of the picture and of the clear-place rule touch no storage, network or log", () => {
  for (const file of ["./picture.ts", "./settle.ts"]) {
    const t = src(file).replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const bad of ["fetch(", "XMLHttpRequest", "WebSocket", "sendBeacon", "localStorage", "sessionStorage", "indexedDB", "console.", "invoke(", "@tauri-apps", "writeFile", "emitTo"]) {
      assert.ok(!t.includes(bad), `${file} must not use ${bad}`);
    }
  }
});

test("every note into the loop and perch traces is made of fixed words and numbers, never the picture or a name", () => {
  const page = src("../routes/+page.svelte");
  const calls = [...page.matchAll(/\b(?:lp|pt|lt|ct)\(`([^`]*)`\)/g)].map((m) => m[1]);
  assert.ok(calls.length > 20, "the trace calls were found");
  for (const t of calls) {
    for (const m of t.matchAll(/\$\{([^}]*)\}/g)) {
      const e = m[1];
      const bare = e.replace(/data\.(ai\.chat|settings\.\w+)/g, "0").replace(/shortEnoughForSkill\(text\)/g, "0").replace(/boxCoverage\([^)]*\)/g, "0"); // a number or a yes/no computed from the picture or from the length of a command is allowed, the picture and the words themselves are not
      assert.ok(!/\b(grid|seen|spots|data|text|title|name|label|words?|reply|prompt|history)\b/.test(bare), `a trace line uses ${e} in: ${t}`);
    }
  }
  // the two invoke calls that write the loop and chat traces pass only a step string
  assert.ok(/invoke\("loop_trace", \{ step:/.test(page) && /invoke\("chat_trace", \{ step:/.test(page));
});

test("the chat trace has the gate, a number of characters and a count of the day, and not the words", () => {
  const page = src("../routes/+page.svelte");
  const line = page.match(/invoke\("chat_trace", \{ step: `([^`]*)`/)![1];
  assert.equal(line.replace(/\$\{[^}]*\}/g, "N"), "chat gate=N chars=N day=N");
  assert.ok(line.includes("text.length"), "it counts the characters");
  assert.ok(!/\$\{text\}/.test(line), "it never holds the text");
});

test("the screen picture switch is off by default, kept only when it is exactly true, and the file stays readable by an older build", () => {
  assert.equal(DEFAULT_SETTINGS.screenPicture, false);
  assert.equal(defaultData(0).settings.screenPicture, false);
  const old = JSON.stringify({ settings: { lang: "vi", gentle: true } }); // a file written before the switch existed
  assert.equal(parse(old, 0).settings.screenPicture, false);
  for (const v of ['"yes"', "1", "null", "false"]) {
    assert.equal(parse(`{"settings":{"screenPicture":${v}}}`, 0).settings.screenPicture, false, `not true: ${v}`);
  }
  assert.equal(parse('{"settings":{"screenPicture":true}}', 0).settings.screenPicture, true);
});

test("the page asks for the picture only when a switch is on", () => {
  const page = src("../routes/+page.svelte");
  const fn = page.slice(page.indexOf("async function readScene()"), page.indexOf("/** Walk or hop to the place the chooser gave."));
  assert.ok(fn.includes('invoke<PictureGrid | null>("screen_grid")'));
  // the readers of the picture are called only behind pictureOn
  assert.ok(/async function settleNow[\s\S]{0,400}readScene\(\)/.test(page));
  assert.ok(page.includes("if (!pictureOn || settleOff || flying) return false;"), "clearAside and clearOutOfLane check the switch");
  assert.ok(/pictureOn = pictureTray \|\| user;/.test(page), "the switch is the person's choice or the tray of a test build");
});

test("the fine sampler of the pointer (ADR-0135) is a test build only, keeps its ring in memory and writes only fixed numbers", () => {
  const pure = src("../../src-tauri/src/fastpass.rs").replace(/\/\/.*$/gm, "");
  for (const bad of ["std::fs", "File::", "write(", "println!", "eprintln!", "emit(", "reqwest", "TcpStream", "serde_json", "invoke"]) {
    assert.ok(!pure.includes(bad), `fastpass.rs must not use ${bad}`);
  }
  const lib = src("../../src-tauri/src/lib.rs");
  const fn = lib.slice(lib.indexOf("fn spawn_fast_pass"), lib.indexOf("// ---------------------------------------------------------------------- tray"));
  assert.ok(fn.includes("if !overlay_allowed()"), "the sampler starts only in a test build");
  assert.ok(!fn.includes(".emit(") && !fn.includes("percept"), "nothing is told to the page in IR-4a");
  const writes = [...fn.matchAll(/append_trace\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(writes.length >= 1 && writes.every((w) => w.includes('"loop-trace.log"') && w.includes("&line")), "the only thing written is the line of numbers");
});
