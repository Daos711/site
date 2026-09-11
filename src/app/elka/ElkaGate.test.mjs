import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./ElkaGate.tsx", import.meta.url), "utf8");
const frameSource = source.match(
  /function ElkaFrame\([\s\S]*?(?=\/\* ─+\r?\n \* The gate\.)/,
)?.[0];

test("ElkaFrame has a stable, outer-viewport-owned height contract", () => {
  assert.ok(frameSource, "ElkaFrame source must be present");
  assert.match(
    frameSource,
    /const stableHeight = `max\(\$\{FRAME\.minHeight\}px, calc\(100dvh - \$\{FRAME\.reserved\}\)\)`/,
  );
  assert.match(frameSource, /style=\{\{ height: stableHeight \}\}/);
});

test("ElkaFrame cannot feed embedded content measurements back into its viewport", () => {
  assert.ok(frameSource, "ElkaFrame source must be present");

  for (const feedbackMechanism of [
    "contentDocument",
    "contentWindow",
    "ResizeObserver",
    "MutationObserver",
    "documentContentHeight",
    "probeHeight",
    "frame.style.height",
  ]) {
    assert.doesNotMatch(frameSource, new RegExp(feedbackMechanism));
  }

  assert.doesNotMatch(frameSource, /\b(?:transform|zoom)\b/);
});

test("long menus retain native iframe scrolling so Play remains reachable", () => {
  assert.ok(frameSource, "ElkaFrame source must be present");
  assert.doesNotMatch(frameSource, /scrolling\s*=\s*["']no["']/);
  assert.doesNotMatch(frameSource, /overflow(?:Y|Block)?\s*:\s*["'](?:hidden|clip)["']/);
  assert.doesNotMatch(frameSource, /overflow(?:-y)?-(?:hidden|clip)/);
});
