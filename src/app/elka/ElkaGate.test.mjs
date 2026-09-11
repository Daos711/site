import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const sizingSource = await readFile(new URL("./elka-frame-sizing.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(sizingSource, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
});
const { watchElkaFrame } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const battleHeight = "max(420px, calc(100dvh - 12rem))";

function harness(initialHeight = 1787, initiallyBattle = false) {
  const frames = new Map();
  const resizers = [];
  const mutations = [];
  const listeners = new Map();
  const writes = [];
  let nextFrame = 0;
  let height = "";

  function observerClass(collection) {
    return class {
      targets = new Map();
      constructor(callback) { this.callback = callback; collection.push(this); }
      observe(target, options) { this.targets.set(target, options); }
      disconnect() { this.targets.clear(); }
    };
  }
  const view = {
    ResizeObserver: observerClass(resizers),
    MutationObserver: observerClass(mutations),
    requestAnimationFrame(callback) { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame(id) { frames.delete(id); },
  };
  function makeDocument(contentHeight) {
    const state = { height: contentHeight, reads: 0, styles: new Set() };
    const app = { getBoundingClientRect() { state.reads++; return { height: state.height }; } };
    const battle = { hidden: true };
    return {
      state, app, battle,
      readyState: "complete",
      documentElement: { dataset: {} },
      getElementById(id) { return { app, battle }[id] ?? null; },
      head: { appendChild(style) { state.styles.add(style); } },
      createElement() { return { textContent: "", remove() { state.styles.delete(this); } }; },
    };
  }
  const document = makeDocument(initialHeight);
  document.battle.hidden = !initiallyBattle;
  const frame = {
    ownerDocument: { defaultView: view },
    contentDocument: document,
    style: { get height() { return height; }, set height(value) { height = value; writes.push(value); } },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const flush = () => {
    const pending = [...frames.values()];
    frames.clear();
    for (const callback of pending) callback();
  };
  const resize = () => {
    for (const observer of resizers) if (observer.targets.size) observer.callback();
  };
  const screen = (visible) => {
    frame.contentDocument.battle.hidden = !visible;
    for (const observer of mutations) {
      if (observer.targets.has(frame.contentDocument.battle)) observer.callback();
    }
  };
  const dispose = watchElkaFrame(frame, battleHeight, 420);
  return { document, frame, writes, frames, resizers, mutations, listeners, makeDocument, flush, resize, screen, dispose };
}

test("menu fits natural content, tracks reflow, and can shrink without a viewport floor", () => {
  const h = harness(1786.4);
  h.flush();
  assert.equal(h.frame.style.height, "1787px");
  assert.equal(h.document.documentElement.dataset.elkaFrameMode, "menu");
  h.document.state.height = 4200.2;
  h.resize(); h.flush();
  assert.equal(h.frame.style.height, "4201px");
  h.document.state.height = 950;
  h.resize(); h.flush();
  assert.equal(h.frame.style.height, "950px");
  assert.deepEqual([...h.resizers[0].targets.keys()], [h.document.app]);
  h.dispose();
});

test("loading and short non-battle screens keep a usable minimum height", () => {
  const h = harness(0);
  h.flush();
  assert.equal(h.frame.style.height, "420px");
  h.dispose();
});

test("attaching to an already visible battle skips menu sizing entirely", () => {
  const h = harness(1210, true);
  h.flush();
  assert.equal(h.frame.style.height, battleHeight);
  assert.equal(h.document.state.reads, 0);
  assert.equal(h.resizers[0].targets.size, 0);
  h.dispose();
});

test("battle never measures or feeds alternating 1210/1219 content back into the frame", () => {
  const h = harness();
  h.flush();
  const reads = h.document.state.reads;
  const writes = h.writes.length;
  h.screen(true);
  assert.equal(h.frame.style.height, battleHeight);
  assert.equal(h.resizers[0].targets.size, 0);
  assert.equal(h.document.documentElement.dataset.elkaFrameMode, "battle");
  for (let i = 0; i < 80; i++) {
    h.document.state.height = i % 2 ? 1210 : 1219;
    h.resizers[0].callback();
    h.screen(true);
    h.flush();
  }
  assert.equal(h.document.state.reads, reads);
  assert.deepEqual(h.writes.slice(writes), [battleHeight]);
  assert.deepEqual(h.mutations[0].targets.get(h.document.battle), {
    attributes: true, attributeFilter: ["hidden"],
  });
  h.dispose();
});

test("a queued menu measurement cannot run after the actual battle screen becomes visible", () => {
  const h = harness();
  h.document.battle.hidden = false;
  h.flush();
  assert.equal(h.document.state.reads, 0);
  h.screen(true);
  assert.equal(h.frame.style.height, battleHeight);
  h.dispose();
});

test("menu → battle → menu restores content sizing, including repeated starts", () => {
  const h = harness();
  h.flush();
  for (const menuHeight of [1900, 980, 3600]) {
    h.screen(true);
    h.document.state.height = menuHeight;
    h.screen(false);
    h.flush();
    assert.equal(h.frame.style.height, `${menuHeight}px`);
    assert.equal(h.document.documentElement.dataset.elkaFrameMode, "menu");
    assert.equal(h.resizers[0].targets.size, 1);
  }
  h.dispose();
});

test("reload and unmount remove observers, injected styles, and queued measurements", () => {
  const h = harness();
  const oldDocument = h.document;
  h.frame.contentDocument = h.makeDocument(2200);
  h.listeners.get("load")();
  assert.equal(oldDocument.state.styles.size, 0);
  assert.equal(oldDocument.documentElement.dataset.elkaFrameMode, undefined);
  assert.equal(h.resizers[0].targets.size, 0);
  assert.equal(h.mutations[0].targets.size, 0);
  h.flush();
  assert.equal(h.frame.style.height, "2200px");
  h.resize();
  h.dispose();
  assert.equal(h.frames.size, 0);
  assert.equal(h.listeners.size, 0);
  assert.equal(h.frame.contentDocument.state.styles.size, 0);
  assert.ok(h.resizers.every((observer) => observer.targets.size === 0));
  assert.ok(h.mutations.every((observer) => observer.targets.size === 0));
  const writes = h.writes.length;
  for (const observer of [...h.resizers, ...h.mutations]) observer.callback();
  h.flush();
  assert.equal(h.writes.length, writes);
});

test("ElkaFrame connects the screen adapter and disables the iframe's vertical scrollbar", async () => {
  const source = await readFile(new URL("./ElkaGate.tsx", import.meta.url), "utf8");
  const frameSource = source.match(/function ElkaFrame\([\s\S]*?(?=\/\* ─+\r?\n \* The gate\.)/)?.[0];
  assert.ok(frameSource);
  assert.match(frameSource, /watchElkaFrame\(frameRef.current, stableHeight, FRAME.minHeight\)/);
  assert.match(frameSource, /scrolling="no"/);
  assert.doesNotMatch(frameSource + sizingSource, /\b(?:transform|zoom)\b/);
});
