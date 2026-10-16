import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = join(root, "public");
const outRoot = join(root, "out");
const origin = "https://locks.test";
execFileSync(process.execPath, [join(root, "scripts", "build-gothic-locks.mjs"), "--prepare"], { cwd: root });

test("manifest uses scoped standalone start URL and real 192/512 PNG icons", async () => {
  const manifest = JSON.parse(await readFile(join(publicRoot, "apps/gothic-locks.webmanifest"), "utf8"));
  assert.equal(manifest.start_url, "/apps/gothic-locks");
  assert.equal(manifest.scope, "/apps/gothic-locks");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "ru");
  for (const icon of manifest.icons) {
    const metadata = await sharp(join(publicRoot, icon.src)).metadata();
    const [width, height] = icon.sizes.split("x").map(Number);
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, height);
    assert.equal(metadata.format, "png");
  }
});

test("distributed notices preserve complete upstream license texts", async () => {
  const notices = await readFile(join(publicRoot, "apps/gothic-locks-licenses.txt"), "utf8");
  for (const name of ["Murzav-LICENSE.txt", "Arminek-NOTICE.txt"]) {
    const original = await readFile(join(root, "src/lib/gothic-locks/vendor", name), "utf8");
    assert.ok(notices.includes(original.trimEnd()), name + " remains complete");
  }
});

test("generated module worker returns independently verified safe moves and handles invalid config", async () => {
  const replies = [];
  const previousSelf = globalThis.self;
  globalThis.self = { postMessage: (data) => replies.push(data) };
  try {
    await import(pathToFileURL(join(publicRoot, "apps/gothic-locks-worker.js")).href);
    const config = {
      positions: [1, 7, 2, 6],
      links: Array.from({ length: 4 }, () => [0, 0, 0, 0]),
      direction: "right-increases",
    };
    globalThis.self.onmessage({ data: { id: "valid", config } });
    assert.equal(replies[0].id, "valid");
    assert.equal(replies[0].result.status, "solved");
    const positions = config.positions.slice();
    for (const move of replies[0].result.moves) {
      positions[move.plate] += move.direction;
      assert.ok(positions.every((value) => value >= 1 && value <= 7));
    }
    assert.deepEqual(positions, [4, 4, 4, 4]);
    globalThis.self.onmessage({ data: { id: "invalid", config: null } });
    assert.equal(replies[1].id, "invalid");
    assert.equal(replies[1].result.status, "invalid");
    assert.deepEqual(replies[1].result.moves, []);
  } finally {
    if (previousSelf === undefined) delete globalThis.self;
    else globalThis.self = previousSelf;
  }
});

async function serviceWorkerHarness({ missing = false } = {}) {
  const paths = ["/apps/gothic-locks.html", "/apps/gothic-locks-worker.js", "/apps/gothic-locks-licenses.txt"];
  const template = await readFile(join(publicRoot, "apps/gothic-locks-sw.js"), "utf8");
  const source = template.replace("__GOTHIC_CACHE_VERSION__", "test-version").replace("/* GOTHIC_PRECACHE */ []", JSON.stringify(paths));
  const stores = new Map([
    ["other-app-cache", new Map()],
    ["gothic-locks-v1-old", new Map()],
  ]);
  const handlers = {};
  const state = { skipped: false, claimed: false, messages: [], networkCalls: 0 };
  const absolute = (input) => new URL(typeof input === "string" ? input : input.url, origin).href;
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(requests) {
          // Real Cache.addAll commits only if all responses are successful.
          if (missing) throw new Error("A resource returned 404");
          for (const request of requests) entries.set(absolute(request), new Response(request.url.includes(".html") ? "<html>offline app</html>" : request.url.endsWith("-licenses.txt") ? "MIT notices" : "worker"));
        },
        async match(input) { return entries.get(absolute(input))?.clone(); },
      };
    },
  };
  const serviceWorker = {
    location: { origin },
    addEventListener: (type, handler) => { handlers[type] = handler; },
    async skipWaiting() { state.skipped = true; },
    clients: {
      async claim() { state.claimed = true; },
      async matchAll() { return [{ postMessage: (message) => state.messages.push(message) }]; },
    },
  };
  vm.runInNewContext(source, {
    self: serviceWorker,
    caches,
    URL,
    Request: class {
      constructor(input) { this.url = absolute(input); }
    },
    fetch: async () => { state.networkCalls++; throw new Error("Offline"); },
  });
  return {
    stores, state,
    async dispatch(type, extra = {}) {
      const pending = [];
      const event = { ...extra, waitUntil: (promise) => pending.push(promise) };
      handlers[type](event);
      await Promise.all(pending);
    },
    async request(path, mode = "navigate", method = "GET") {
      let response;
      handlers.fetch({ request: { url: new URL(path, origin).href, mode, method }, respondWith: (promise) => { response = promise; } });
      return response;
    },
  };
}

test("complete install waits for old clients; activation removes only this app's old cache", async () => {
  const harness = await serviceWorkerHarness();
  await harness.dispatch("install");
  assert.equal(harness.state.skipped, false, "an update must not take over a running app");
  assert.ok(harness.stores.has("gothic-locks-v1-old"), "installation preserves the running version");
  assert.equal(harness.state.claimed, false);
  await harness.dispatch("activate");
  assert.equal(harness.state.claimed, true);
  assert.ok(harness.stores.has("other-app-cache"));
  assert.ok(harness.stores.has("gothic-locks-v1-test-version"));
  assert.ok(!harness.stores.has("gothic-locks-v1-old"));
  assert.equal(harness.state.messages[0].type, "GOTHIC_OFFLINE_READY");
});

test("offline reload serves the app and worker; unrelated routes, domains and POST pass through", async () => {
  const harness = await serviceWorkerHarness();
  await harness.dispatch("install");
  await harness.dispatch("activate");
  for (const path of ["/apps/gothic-locks", "/apps/gothic-locks/", "/apps/gothic-locks.html", "/apps/gothic-locks?from=home"]) {
    assert.equal(await (await harness.request(path)).text(), "<html>offline app</html>");
  }
  assert.equal(await (await harness.request("/apps/gothic-locks-worker.js?version=1", "cors")).text(), "worker");
  assert.equal(await (await harness.request("/apps/gothic-locks-licenses.txt")).text(), "MIT notices");
  assert.equal(await harness.request("/apps/another-app"), undefined);
  assert.equal(await harness.request("/apps/gothic-locks-unrelated"), undefined);
  assert.equal(await harness.request("https://external.test/apps/gothic-locks"), undefined);
  assert.equal(await harness.request("/apps/gothic-locks", "navigate", "POST"), undefined);
  assert.equal(harness.state.networkCalls, 0);
  let status;
  await harness.dispatch("message", { data: { type: "GOTHIC_CHECK_OFFLINE" }, ports: [{ postMessage: (message) => { status = message; } }] });
  assert.equal(status.ready, true);
  harness.stores.get("gothic-locks-v1-test-version").delete(origin + "/apps/gothic-locks-worker.js");
  await harness.dispatch("message", { data: { type: "GOTHIC_CHECK_OFFLINE" }, ports: [{ postMessage: (message) => { status = message; } }] });
  assert.equal(status.ready, false, "partial eviction must not claim offline readiness");
});

test("failed asset download cannot activate a partial offline version", async () => {
  const harness = await serviceWorkerHarness({ missing: true });
  await assert.rejects(harness.dispatch("install"), /404/);
  assert.equal(harness.state.skipped, false);
  assert.equal(harness.state.claimed, false);
  assert.ok(harness.stores.has("other-app-cache"));
  assert.ok(harness.stores.has("gothic-locks-v1-old"));
});

test("exported precache contains existing local files and all worker modules", async (context) => {
  const reportPath = join(outRoot, "apps/gothic-locks-precache.json");
  try { await access(reportPath); } catch {
    context.skip("Run npm run build to validate the production export.");
    return;
  }
  const report = JSON.parse(await readFile(reportPath, "utf8"));
  assert.equal(report.urls.length, report.files);
  assert.ok(!report.urls.includes("/apps/gothic-locks-sw.js"), "SW does not precache its own template");
  assert.ok(!report.urls.includes("/index.txt"), "other pages are not precached");
  assert.equal(new Set(report.urls).size, report.files);
  let bytes = 0;
  for (const url of report.urls) {
    assert.ok(url.startsWith("/"));
    assert.ok(!url.includes(".."));
    const file = await stat(join(outRoot, url));
    assert.ok(file.isFile());
    bytes += file.size;
  }
  assert.equal(bytes, report.bytes);
  for (const required of [
    "/apps/gothic-locks.html", "/apps/gothic-locks.webmanifest", "/apps/gothic-locks-licenses.txt",
    "/apps/gothic-locks-worker.js", "/apps/gothic-locks-core/solver.js",
    "/apps/gothic-locks-core/simulator.js",
    "/apps/gothic-locks-icons/icon-192.png", "/apps/gothic-locks-icons/icon-512.png",
  ]) assert.ok(report.urls.includes(required), required + " is precached");
  assert.ok(report.urls.some((url) => url.startsWith("/_next/static/") && url.endsWith(".js")));
  assert.ok(report.urls.some((url) => url.endsWith(".css")));
  const serviceWorker = await readFile(join(outRoot, "apps/gothic-locks-sw.js"), "utf8");
  assert.ok(serviceWorker.includes(report.version));
  assert.ok(!serviceWorker.includes("__GOTHIC_CACHE_VERSION__"));
});
