/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS browser regression harness. */
/* Regression for upgrading an already-controlled legacy (20-card) installation.
 * Runs an isolated HTTP server on a free localhost port. Requires a fresh out/
 * build and PLAYWRIGHT_MODULE / CHROMIUM_PATH when not installed locally.
 * No real browser profile, deployment, or user's saved data is modified. */
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'out');
const artifacts = process.env.GOTHIC_UPDATE_OUTPUT || path.join(root, 'work', 'gothic-update');
const legacyVersion = 'update-regression-legacy20';
const legacyCache = 'gothic-locks-v1-' + legacyVersion;
const otherCache = 'unrelated-app-update-regression';
const appPath = '/apps/gothic-locks';
const shellPath = appPath + '.html';
const workerPath = appPath + '-sw.js';
const legacyAssetPath = '/_next/static/chunks/gothic-update-regression-legacy.js';
const legacyAsset = 'window.__legacyAssetValue = "retained-legacy-asset";\n';
const results = [];
const record = (name) => { results.push(name); console.log('PASS ' + name); };
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.webp': 'image/webp',
};
async function expectedCatalogCount() {
  const source = await fs.readFile(path.join(root, 'src/lib/gothic-locks/catalog.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  const compiledModule = { exports: {} };
  new Function('exports', 'require', 'module', outputText)(compiledModule.exports, require, compiledModule);
  return compiledModule.exports.LOCK_CATALOG.length;
}
const oldTemplate = execFileSync('git', ['show', '557085b:public/apps/gothic-locks-sw.js'], { cwd: root, encoding: 'utf8' });
const oldWorker = oldTemplate.replace('__GOTHIC_CACHE_VERSION__', legacyVersion)
  .replace('/* GOTHIC_PRECACHE */ []', JSON.stringify([shellPath, legacyAssetPath]));
assert.ok(!oldWorker.includes('__GOTHIC_CACHE_VERSION__'));
const oldShell = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Legacy Gothic fixture</title></head>
<body><main data-release="legacy20"><h1>Gothic Remake — Замки</h1><p id="old-count">20 карточек</p>
<p>Старый лагерь: 3 · Новый лагерь: 1 · Болотный лагерь: 2</p><p id="legacy-session"></p></main>
<script src="${legacyAssetPath}"></script>
<script>
window.__legacyLoadToken = crypto.randomUUID();
document.getElementById('legacy-session').textContent = window.__legacyLoadToken;
navigator.serviceWorker.register('${workerPath}', { scope: '${appPath}' }).catch(error => { window.__legacyError = String(error); });
</script></body></html>`;
let mode = 'legacy';
let nextWorker = '';
const requests = [];
async function serve(request, response) {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  requests.push({ mode, path: pathname });
  response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  if (pathname === workerPath) response.setHeader('Service-Worker-Allowed', '/apps/');
  if (mode === 'next' && pathname === workerPath) {
    response.setHeader('Content-Type', mime['.js']); response.end(nextWorker); return;
  }
  if (mode === 'legacy') {
    if (pathname === workerPath) { response.setHeader('Content-Type', mime['.js']); response.end(oldWorker); return; }
    if ([appPath, appPath + '/', shellPath, appPath + '/index.html'].includes(pathname)) {
      response.setHeader('Content-Type', mime['.html']); response.end(oldShell); return;
    }
    if (pathname === legacyAssetPath) { response.setHeader('Content-Type', mime['.js']); response.end(legacyAsset); return; }
  }
  // A removed old chunk must be recovered from retained caches, not the server.
  if (pathname === legacyAssetPath) { response.writeHead(404); response.end('legacy asset no longer deployed'); return; }
  let filename = path.resolve(out, '.' + pathname);
  const relative = path.relative(out, filename);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) { response.writeHead(403); response.end(); return; }
  try {
    const info = await fs.stat(filename).catch(() => null);
    if (info?.isDirectory()) filename = path.join(filename, 'index.html');
    else if (!info && !path.extname(filename)) filename += '.html';
    const content = await fs.readFile(filename);
    response.setHeader('Content-Type', mime[path.extname(filename)] || 'application/octet-stream');
    response.end(content);
  } catch { response.writeHead(404); response.end('not found'); }
}
const server = http.createServer((request, response) => {
  serve(request, response).catch((error) => { response.writeHead(500); response.end(String(error)); });
});
async function waitForSavedMaster(page) {
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((button) =>
    button.textContent.trim() === 'Мастер' && button.getAttribute('aria-pressed') === 'true'), undefined, { timeout: 15000 });
}
async function swStatus(page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration('/apps/gothic-locks');
    if (!registration?.active) return null;
    const active = registration.active;
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); reject(new Error('SW status timed out')); }, 10000);
      channel.port1.onmessage = (event) => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
      active.postMessage({ type: 'GOTHIC_CHECK_OFFLINE' }, [channel.port2]);
    });
  });
}
(async () => {
  await fs.mkdir(artifacts, { recursive: true });
  const expectedCount = await expectedCatalogCount();
  assert.ok(expectedCount > 20);
  const currentReport = JSON.parse(await fs.readFile(path.join(out, 'apps/gothic-locks-precache.json'), 'utf8'));
  const currentWorker = await fs.readFile(path.join(out, 'apps/gothic-locks-sw.js'), 'utf8');
  assert.ok(currentWorker.includes('GOTHIC_APPLY_UPDATE'), 'Build the new service worker before running this regression');
  const nextVersion = currentReport.version + '-next';
  nextWorker = currentWorker.replace(JSON.stringify(currentReport.version), JSON.stringify(nextVersion));
  assert.notEqual(nextWorker, currentWorker, 'next fixture changes only the cache-version string');
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 412, height: 915 } });
  const page = await context.newPage();
  const errors = [];
  context.on('page', (client) => client.on('pageerror', (error) => errors.push(error.message)));
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route(/https:\/\/(cdn\.jsdelivr\.net|www\.googletagmanager\.com)\//, (route) => route.abort());
  try {
    await page.goto(origin + appPath + '/', { waitUntil: 'networkidle' });
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/apps/gothic-locks');
      return navigator.serviceWorker.controller && registration?.active?.state === 'activated';
    });
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#old-count').innerText(), '20 карточек');
    assert.equal((await swStatus(page)).version, legacyVersion);
    await page.evaluate(async ({ cacheName }) => {
      localStorage.setItem('lab.gothic-locks.v1', JSON.stringify({ skill: 'master', opened: ['scatty-chest'], recent: ['scatty-chest'], changed: [], progress: {} }));
      const cache = await caches.open(cacheName);
      await cache.put('/unrelated-update-proof', new Response('unrelated-cache-kept'));
    }, { cacheName: otherCache });
    const legacyTab = await context.newPage();
    await legacyTab.goto(origin + appPath + '/', { waitUntil: 'networkidle' });
    await legacyTab.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
    const oldTabToken = await legacyTab.evaluate(() => window.__legacyLoadToken);
    assert.equal(await legacyTab.locator('#old-count').innerText(), '20 карточек');
    record('Two tabs really run the old cache-first worker and its synthetic 20-card shell');

    mode = 'current';
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration('/apps/gothic-locks'); await registration.update(); });
    await page.waitForFunction(async () => {
      const registration = await navigator.serviceWorker.getRegistration('/apps/gothic-locks');
      return registration?.waiting?.state === 'installed';
    }, undefined, { timeout: 60000 });
    assert.equal((await swStatus(page)).version, legacyVersion, 'new complete worker must initially wait');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('#old-count').innerText(), '20 карточек', 'ordinary reload reproduces the stale-cache report');
    const waiting = await page.evaluate(async () => Boolean((await navigator.serviceWorker.getRegistration('/apps/gothic-locks'))?.waiting));
    assert.equal(waiting, true);
    record('Publishing current assets leaves the new worker waiting and an ordinary reload still displays 20');

    const helper = new URL(origin + '/apps/g/'); helper.search = '?from=legacy-update-test'; helper.hash = '#proof=preserved';
    await page.goto(helper.href, { waitUntil: 'domcontentloaded' });
    await page.getByTestId('catalog-coverage').waitFor({ timeout: 60000 });
    await page.waitForFunction((expected) => document.querySelectorAll('[data-lock-id]').length === expected, expectedCount, { timeout: 60000 });
    const target = new URL(page.url());
    assert.equal(target.pathname, appPath + '/'); assert.equal(target.search, helper.search); assert.equal(target.hash, helper.hash);
    assert.match(await page.getByTestId('catalog-coverage').innerText(), new RegExp(expectedCount + ' карточек'));
    assert.equal((await swStatus(page)).version, currentReport.version);
    await waitForSavedMaster(page);
    assert.equal(await page.getByRole('button', { name: 'Мастер', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('[data-lock-id="scatty-chest"]').innerText(), /Уже вскрыт/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('lab.gothic-locks.v1')));
    assert.equal(saved.skill, 'master'); assert.ok(saved.opened.includes('scatty-chest'));
    record('The /apps/g/ bootstrap activates the complete waiting update, shows the current catalog and preserves route/settings');

    assert.equal(await legacyTab.evaluate(() => window.__legacyLoadToken), oldTabToken, 'other tab must not reload automatically');
    assert.equal(await legacyTab.locator('#old-count').innerText(), '20 карточек', 'existing legacy DOM remains intact');
    const cacheNames = await page.evaluate(() => caches.keys());
    assert.ok(cacheNames.includes(legacyCache), 'old assets are retained while the old tab stays open');
    assert.ok(cacheNames.includes(otherCache), 'another app cache is preserved');
    assert.ok(cacheNames.includes('gothic-locks-v1-' + currentReport.version));
    const proof = await page.evaluate(async (cacheName) => (await (await caches.open(cacheName)).match('/unrelated-update-proof')).text(), otherCache);
    assert.equal(proof, 'unrelated-cache-kept');
    const assetResponse = await legacyTab.evaluate(async (assetPath) => { const response = await fetch(assetPath, { cache: 'no-store' }); return { status: response.status, text: await response.text() }; }, legacyAssetPath);
    assert.equal(assetResponse.status, 200, 'newly controlling worker must still serve an old tab\'s cached chunk');
    assert.equal(assetResponse.text, legacyAsset);
    record('Another open legacy tab is not forced to reload; its old chunks and unrelated caches remain usable');

    const currentUiToken = await page.evaluate(() => { window.__currentUiToken = crypto.randomUUID(); return window.__currentUiToken; });
    mode = 'next';
    await page.evaluate(async () => { const registration = await navigator.serviceWorker.getRegistration('/apps/gothic-locks'); await registration.update(); });
    await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration('/apps/gothic-locks'))?.waiting?.state === 'installed', undefined, { timeout: 60000 });
    const updateButton = page.getByRole('button', { name: 'Обновить справочник', exact: true });
    await updateButton.waitFor({ state: 'visible', timeout: 15000 });
    assert.equal((await swStatus(page)).version, currentReport.version, 'installing a future version must not silently activate it');
    assert.equal(await page.evaluate(() => window.__currentUiToken), currentUiToken, 'the current UI must not reload before the user clicks');
    assert.equal(await page.locator('[data-lock-id]').count(), expectedCount);
    assert.match(await page.locator('[data-lock-id="scatty-chest"]').innerText(), /Уже вскрыт/);
    assert.equal(await legacyTab.evaluate(() => window.__legacyLoadToken), oldTabToken);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }),
      updateButton.click(),
    ]);
    await page.getByTestId('catalog-coverage').waitFor();
    await waitForSavedMaster(page);
    assert.equal((await swStatus(page)).version, nextVersion);
    assert.equal(await page.locator('[data-lock-id]').count(), expectedCount);
    assert.equal(await page.evaluate(() => window.__currentUiToken), undefined, 'the explicit button reloads only this document');
    assert.match(await page.locator('[data-lock-id="scatty-chest"]').innerText(), /Уже вскрыт/);
    assert.equal(await legacyTab.evaluate(() => window.__legacyLoadToken), oldTabToken);
    assert.equal(await legacyTab.locator('#old-count').innerText(), '20 карточек');
    assert.ok((await page.evaluate(() => caches.keys())).includes(otherCache));
    record('A future waiting release shows the update button; only an explicit click activates it and reloads this tab with marks intact');

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('catalog-coverage').waitFor();
    assert.equal(await page.locator('[data-lock-id]').count(), expectedCount);
    await context.setOffline(true);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('catalog-coverage').waitFor();
    assert.equal(await page.locator('[data-lock-id]').count(), expectedCount);
    await waitForSavedMaster(page);
    assert.equal(await page.getByRole('button', { name: 'Мастер', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.match(await page.locator('[data-lock-id="scatty-chest"]').innerText(), /Уже вскрыт/);
    record('After upgrading, online and offline reloads stay on the new catalog with saved marks');

    const freshContext = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 412, height: 915 } });
    await freshContext.route(/https:\/\/(cdn\.jsdelivr\.net|www\.googletagmanager\.com)\//, (route) => route.abort());
    const freshPage = await freshContext.newPage();
    freshPage.on('pageerror', (error) => errors.push(error.message));
    await freshPage.goto(origin + '/__gothic-fresh-probe');
    assert.equal(await freshPage.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length), 0);
    const freshHelper = new URL(origin + '/apps/g/'); freshHelper.search = '?from=fresh-install'; freshHelper.hash = '#proof=fresh';
    await freshPage.goto(freshHelper.href, { waitUntil: 'domcontentloaded' });
    await freshPage.getByTestId('catalog-coverage').waitFor({ timeout: 60000 });
    await freshPage.getByText('Доступно офлайн', { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 60000 });
    assert.equal(await freshPage.locator('[data-lock-id]').count(), expectedCount);
    const freshTarget = new URL(freshPage.url());
    assert.equal(freshTarget.pathname, appPath + '/'); assert.equal(freshTarget.search, freshHelper.search); assert.equal(freshTarget.hash, freshHelper.hash);
    assert.equal((await swStatus(freshPage)).version, nextVersion);
    assert.equal(await freshPage.getByRole('button', { name: 'Без навыка', exact: true }).getAttribute('aria-pressed'), 'true');
    assert.doesNotMatch(await freshPage.locator('[data-lock-id="scatty-chest"]').innerText(), /Уже вскрыт/);
    await freshContext.close();
    record('A fresh /apps/g/ visit with no existing registration installs and activates successfully, preserving the incoming route');
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(artifacts, 'upgraded-mobile.png'), fullPage: false });
    await fs.writeFile(path.join(artifacts, 'result.json'), JSON.stringify({ passed: results.length, results, expectedCatalogCount: expectedCount, oldVersion: legacyVersion, currentVersion: currentReport.version, nextVersion, errors, requests }, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: false }).catch(() => {});
    await fs.writeFile(path.join(artifacts, 'failure.json'), JSON.stringify({ passed: results.length, results, error: String(error), mode, url: page.url(), errors, requests }, null, 2));
    throw error;
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1; });

