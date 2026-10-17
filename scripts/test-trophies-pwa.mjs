import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';
import sharp from 'sharp';
import { buildOffline, prepare } from './build-trophies.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://trophies.test';
const template = await readFile(join(root, 'public/trophies/sw.js'), 'utf8');
const paths = ['/trophies.html', '/trophies/gothic-remake.html', '/_next/static/chunks/guide.js'];
const routes = { '/trophies': paths[0], '/trophies/': paths[0], '/trophies/gothic-remake': paths[1], '/trophies/gothic-remake/': paths[1] };
const source = (version = 'test') => template.replace('__TROPHIES_CACHE_VERSION__', version).replace('/* TROPHIES_PRECACHE */ []', JSON.stringify(paths)).replace('/* TROPHIES_ROUTES */ {}', JSON.stringify(routes));

function harness({ fail = false } = {}) {
  const handlers = {};
  const stores = new Map([['other-application-cache', new Map()], ['lab-trophies-v1-old', new Map([[origin + '/_next/static/chunks/old.js', new Response('old-tab-chunk')]])]]);
  const state = { fetched: [], skipped: 0, claimed: 0 };
  const urlOf = value => new URL(typeof value === 'string' ? value : value.url, origin).href;
  const cacheApi = {
    keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    open: async name => {
      if (!stores.has(name)) stores.set(name, new Map());
      const values = stores.get(name);
      return {
        match: async request => values.get(urlOf(request))?.clone(),
        addAll: async requests => {
          const responses = [];
          for (const request of requests) {
            state.fetched.push(urlOf(request));
            if (fail && request.url.endsWith('guide.js')) throw new Error('missing chunk');
            responses.push([urlOf(request), new Response('cached:' + request.url)]);
          }
          for (const [url, response] of responses) values.set(url, response);
        },
      };
    },
  };
  class LocalRequest extends Request { constructor(value, options) { super(typeof value === 'string' ? new URL(value, origin) : value, options); } }
  const self = { location: { origin }, clients: { claim: async () => { state.claimed++; } }, skipWaiting: async () => { state.skipped++; }, addEventListener: (name, callback) => { handlers[name] = callback; } };
  vm.runInNewContext(source(), { self, caches: cacheApi, Request: LocalRequest, URL, Set, fetch: async request => { state.fetched.push(request.url); return new Response('network'); } });
  const trigger = async (name, data = {}) => { let work; handlers[name]({ ...data, waitUntil: promise => { work = promise; } }); await work; };
  const fetchRequest = async (path, options = {}) => {
    const request = { url: new URL(path, origin).href, method: 'GET', mode: 'cors', headers: new Headers(), ...options };
    let response;
    handlers.fetch({ request, respondWith: promise => { response = promise; } });
    return response ? (await response).text() : undefined;
  };
  return { stores, state, trigger, fetchRequest };
}

test('install requires every resource and preserves the previous release on failure', async () => {
  const app = harness({ fail: true });
  await assert.rejects(app.trigger('install'), /missing chunk/);
  assert.equal(app.stores.has('lab-trophies-v1-test'), false);
  assert.equal(app.stores.has('lab-trophies-v1-old'), true);
  assert.equal(app.stores.has('other-application-cache'), true);
  assert.equal(app.state.skipped, 0);
});

test('coherent offline shells, slash aliases and static assets come from the installed release', async () => {
  const app = harness();
  await app.trigger('install');
  await app.trigger('activate');
  const fetched = app.state.fetched.length;
  assert.match(await app.fetchRequest('/trophies', { mode: 'navigate' }), /cached:.*trophies.html/);
  assert.match(await app.fetchRequest('/trophies/gothic-remake/', { mode: 'navigate' }), /gothic-remake.html/);
  assert.match(await app.fetchRequest('/_next/static/chunks/guide.js?version=1'), /cached:/);
  assert.equal(app.state.fetched.length, fetched);
  assert.equal(app.state.claimed, 1);
});

test('API, auth, external, POST, unrelated paths and sensitive callbacks bypass caches', async () => {
  const app = harness();
  await app.trigger('install');
  for (const url of ['/api/progress', '/auth/v1/user', '/trophies?code=secret', '/trophies?access_token=secret', '/apps/gothic-locks', '/trophies-other', '/trophies/unknown', 'https://database.example/rest/v1/trophy_events']) {
    assert.equal(await app.fetchRequest(url, { mode: 'navigate' }), undefined, url);
  }
  assert.equal(await app.fetchRequest('/trophies.html', { method: 'POST' }), undefined);
  assert.equal(await app.fetchRequest('/trophies.html', { headers: new Headers({ authorization: 'Bearer test' }) }), undefined);
});

test('updates require an explicit message from a Trophy Tracker client', async () => {
  const app = harness();
  await app.trigger('install');
  assert.equal(app.state.skipped, 0);
  for (const url of ['https://external.test/trophies', origin + '/apps/gothic-locks', origin + '/trophies-other']) {
    await app.trigger('message', { data: { type: 'TROPHIES_APPLY_UPDATE' }, source: { url } });
  }
  assert.equal(app.state.skipped, 0);
  await app.trigger('message', { data: { type: 'TROPHIES_APPLY_UPDATE' }, source: { url: origin + '/trophies/gothic-remake' } });
  assert.equal(app.state.skipped, 1);
});

test('activation retains other caches and lazy chunks used by older tabs', async () => {
  const app = harness();
  await app.trigger('install');
  await app.trigger('activate');
  assert.equal(await app.fetchRequest('/_next/static/chunks/old.js'), 'old-tab-chunk');
  assert.deepEqual([...app.stores.keys()].sort(), ['lab-trophies-v1-old', 'lab-trophies-v1-test', 'other-application-cache'].sort());
  assert.equal(await app.fetchRequest('/_next/static/chunks/not-in-any-cache.js'), 'network');
  assert.equal(app.stores.get('lab-trophies-v1-test').has(origin + '/_next/static/chunks/not-in-any-cache.js'), false);
});

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'trophies-pwa-'));
  const put = async (name, content) => { const path = join(directory, name); await mkdir(dirname(path), { recursive: true }); await writeFile(path, content); };
  for (const name of ['sw.js', 'manifest.webmanifest', 'icons/icon.svg']) {
    await mkdir(dirname(join(directory, 'public/trophies', name)), { recursive: true });
    await copyFile(join(root, 'public/trophies', name), join(directory, 'public/trophies', name));
  }
  await prepare(directory);
  await put('out/trophies.html', '<!doctype html><html><head><link rel="manifest" href="/trophies/manifest.webmanifest"><script src="/_next/static/chunks/guide.js"></script></head><body><h1>Catalog release 1</h1></body></html>');
  await put('out/trophies/gothic-remake.html', '<!doctype html><html><head><link rel="stylesheet" href="/_next/static/css/guide.css"></head><body><h1>Gothic guide</h1></body></html>');
  await put('out/trophies/gothic-remake.txt', 'static flight payload');
  await put('out/_next/static/chunks/guide.js', 'window.fixtureRelease = 1; const dynamic = "static/chunks/lazy.js";');
  await put('out/_next/static/chunks/lazy.js', 'window.lazyGuide = true;');
  await put('out/_next/static/css/guide.css', '@font-face{font-family:guide;src:url("../media/font.woff2")}');
  await put('out/_next/static/media/font.woff2', 'fixture-font');
  return { directory, put, cleanup: () => { assert.equal(dirname(resolve(directory)), resolve(tmpdir())); assert.ok(basename(directory).startsWith('trophies-pwa-')); return rm(directory, { recursive: true, force: true }); } };
}

test('build collects all route shells and recursive chunks/fonts with deterministic content versions', async t => {
  const files = await fixture();
  t.after(files.cleanup);
  const report = await buildOffline(files.directory);
  assert.equal(report.scope, '/trophies');
  assert.equal(report.worker, '/trophies-sw.js');
  for (const url of ['/trophies.html', '/trophies/gothic-remake.html', '/trophies/gothic-remake.txt', '/_next/static/chunks/lazy.js', '/_next/static/media/font.woff2']) assert.ok(report.urls.includes(url), url);
  assert.equal(report.routes['/trophies/gothic-remake/'], '/trophies/gothic-remake.html');
  assert.equal((await buildOffline(files.directory)).version, report.version);
  await files.put('out/_next/static/chunks/lazy.js', 'window.lazyGuide = "changed";');
  assert.notEqual((await buildOffline(files.directory)).version, report.version);
  const manifest = JSON.parse(await readFile(join(files.directory, 'public/trophies/manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.scope, '/trophies');
  assert.equal(manifest.start_url, '/trophies');
  for (const icon of manifest.icons) {
    const metadata = await sharp(join(files.directory, 'public', icon.src)).metadata();
    assert.equal(`${metadata.width}x${metadata.height}`, icon.sizes);
    assert.equal(metadata.format, 'png');
  }
});

test('build rejects an incomplete export instead of creating a broken offline release', async t => {
  const files = await fixture();
  t.after(files.cleanup);
  await files.put('out/trophies/gothic-remake.html', '<link rel="stylesheet" href="/_next/static/css/missing.css">');
  await assert.rejects(buildOffline(files.directory), /Linked resource is missing/);
});

test('real Chromium installs scoped worker, opens guide offline, waits for update, preserves IndexedDB and unrelated caches', { skip: !process.env.PLAYWRIGHT_MODULE }, async t => {
  const files = await fixture();
  t.after(files.cleanup);
  const first = await buildOffline(files.directory);
  const server = createServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      const target = path === '/trophies' || path === '/trophies/' ? '/trophies.html' : path === '/trophies/gothic-remake' ? '/trophies/gothic-remake.html' : path;
      const body = await readFile(join(files.directory, 'out', target));
      const mime = { '.js': 'application/javascript', '.html': 'text/html', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' }[extname(target)] ?? 'text/plain';
      response.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
      response.end(body);
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => new Promise(done => server.close(done)));
  const base = 'http://127.0.0.1:' + server.address().port;
  const modulePath = process.env.PLAYWRIGHT_MODULE.endsWith('.js') ? process.env.PLAYWRIGHT_MODULE : join(process.env.PLAYWRIGHT_MODULE, 'index.mjs');
  const { chromium } = await import(pathToFileURL(modulePath).href);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
  t.after(() => browser.close());
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(base + '/trophies');
  await page.evaluate(async () => {
    await caches.open('gothic-locks-v1-do-not-touch');
    const database = await new Promise((resolve, reject) => { const request = indexedDB.open('trophy-pwa-test', 1); request.onupgradeneeded = () => request.result.createObjectStore('progress'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    await new Promise((resolve, reject) => { const transaction = database.transaction('progress', 'readwrite'); transaction.objectStore('progress').put('kept', 'proof'); transaction.oncomplete = resolve; transaction.onerror = reject; });
    database.close();
    await navigator.serviceWorker.register('/trophies-sw.js', { scope: '/trophies', updateViaCache: 'none' });
    await navigator.serviceWorker.ready;
  });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  assert.equal(await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).scope), base + '/trophies');
  await context.setOffline(true);
  await page.goto(base + '/trophies/gothic-remake');
  assert.equal(await page.locator('h1').textContent(), 'Gothic guide');
  await page.goto(base + '/trophies');
  assert.equal(await page.locator('h1').textContent(), 'Catalog release 1');
  await context.setOffline(false);
  await files.put('out/trophies.html', '<!doctype html><html><body><h1>Catalog release 2</h1></body></html>');
  const second = await buildOffline(files.directory);
  assert.notEqual(second.version, first.version);
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await page.waitForFunction(async () => Boolean((await navigator.serviceWorker.getRegistration()).waiting));
  await page.reload();
  assert.equal(await page.locator('h1').textContent(), 'Catalog release 1');
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    await new Promise(resolve => { navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }); registration.waiting.postMessage({ type: 'TROPHIES_APPLY_UPDATE' }); });
  });
  await page.reload();
  assert.equal(await page.locator('h1').textContent(), 'Catalog release 2');
  assert.equal(await page.evaluate(async () => { const database = await new Promise(resolve => { const request = indexedDB.open('trophy-pwa-test'); request.onsuccess = () => resolve(request.result); }); return new Promise(resolve => { const request = database.transaction('progress').objectStore('progress').get('proof'); request.onsuccess = () => { database.close(); resolve(request.result); }; }); }), 'kept');
  const names = await page.evaluate(() => caches.keys());
  assert.ok(names.includes('gothic-locks-v1-do-not-touch'));
  assert.ok(names.includes('lab-trophies-v1-' + first.version));
  assert.ok(names.includes('lab-trophies-v1-' + second.version));
  const other = await context.newPage();
  await other.goto(base + '/other');
  assert.equal(await other.evaluate(() => navigator.serviceWorker.controller), null);
});
