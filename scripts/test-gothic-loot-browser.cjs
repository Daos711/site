/* eslint-disable @typescript-eslint/no-require-imports -- Optional CommonJS acceptance harness. */
// Serve the production export; external pages are not downloaded by this test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const repo = process.env.GOTHIC_REPO || path.resolve(__dirname, '..');
const ts = require(path.join(repo, 'node_modules/typescript'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const moduleCache = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
  const compiledModule = { exports: {} };
  moduleCache.set(filename, compiledModule);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const localRequire = name => {
    if (!name.startsWith('.')) return require(name);
    const resolved = path.resolve(path.dirname(filename), name);
    return name.endsWith('.json') ? JSON.parse(fs.readFileSync(resolved, 'utf8')) : loadTs(resolved + (path.extname(resolved) ? '' : '.ts'));
  };
  new Function('exports', 'require', 'module', outputText)(compiledModule.exports, localRequire, compiledModule);
  return compiledModule.exports;
}
const lib = path.join(repo, 'src/lib/gothic-locks');
const { LOCK_CATALOG: catalog, filterCatalog } = loadTs(path.join(lib, 'catalog.ts'));
const { readyFor, solutionSignature } = loadTs(path.join(lib, 'ready-solutions.ts'));
const { groupMoves } = loadTs(path.join(lib, 'simulator.ts'));
const chests = catalog.filter(entry => entry.type === 'chest' || entry.type === 'underwater');
const base = new URL(process.env.GOTHIC_TEST_URL || 'http://127.0.0.1:8765/apps/gothic-locks');
base.hash = ''; base.search = '';
const output = process.env.GOTHIC_TEST_OUTPUT || path.join(repo, 'work/gothic-loot-browser');
const STORAGE = 'lab.gothic-locks.v1';
const results = [], errors = [], visited = new Set();
const pass = name => { results.push(name); console.log('PASS ' + name); };
const sorted = values => [...values].sort();
const compact = text => text.replace(/\s+/g, ' ').trim();
const sourcePairs = references => sorted(references.map(source => JSON.stringify([source.name, source.url])));
const lootStatus = entry => entry.loot?.coverage || (entry.contents.length ? 'partial' : 'missing');
async function compareRows(page, expected) {
  const ids = expected.map(entry => entry.id);
  await page.waitForFunction(ids => JSON.stringify([...document.querySelectorAll('[data-lock-id]')].map(el => el.dataset.lockId).sort()) === JSON.stringify([...ids].sort()), ids);
  assert.deepEqual(sorted(await page.locator('[data-lock-id]').evaluateAll(els => els.map(el => el.dataset.lockId))), sorted(ids));
}
async function openEntry(page, entry) {
  assert.ok(entry, 'Requested catalog entry exists');
  await page.evaluate(id => { location.hash = 'lock=' + encodeURIComponent(id); }, entry.id);
  await page.getByRole('heading', { name: entry.name, exact: true }).waitFor();
  const details = page.locator('details').filter({ has: page.getByText('Добыча, источники и статус проверки', { exact: true }) }).first();
  if (!await details.evaluate(el => el.open)) await details.locator('summary').first().click();
  const block = page.getByTestId('loot-details');
  await block.waitFor({ state: 'visible' });
  // A hash navigation can reuse the same heading; wait for its actual loot render.
  await page.waitForFunction(expected => {
    const node = document.querySelector('[data-testid="loot-details"]');
    return node?.getAttribute('data-loot-status') === expected.status && JSON.stringify([...node.querySelectorAll('li')].map(li => li.textContent)) === JSON.stringify(expected.items);
  }, { status: lootStatus(entry), items: entry.contents });
  assert.equal(new URLSearchParams(new URL(page.url()).hash.slice(1)).get('lock'), entry.id);
  return block;
}
async function checkLoot(page, entry) {
  const block = await openEntry(page, entry);
  const status = lootStatus(entry), text = compact(await block.innerText());
  assert.equal(await block.getAttribute('data-loot-status'), status, entry.id);
  assert.deepEqual(await block.locator('li').allTextContents(), entry.contents, entry.id);
  const references = [...(entry.loot?.sources || []), ...(entry.lootExternal || [])];
  const links = await block.locator('a').evaluateAll(els => els.map(el => ({ name: el.textContent.replace(/\s*↗\s*$/, '').trim(), url: el.getAttribute('href'), target: el.getAttribute('target'), rel: el.getAttribute('rel') || '' })));
  assert.deepEqual(sourcePairs(links), sourcePairs(references), entry.id + ': exact source names and URLs, with no foreign attribution');
  for (const link of links) {
    assert.equal(link.target, '_blank', entry.id + ': source opens separately');
    assert.ok(link.rel.split(/\s+/).includes('noreferrer'), entry.id + ': source rel');
  }
  const labels = {
    listed: 'Содержимое по источнику', partial: 'Известная часть добычи',
    empty: 'По сообщению источника сундук пуст', missing: 'Сверенный список добычи пока отсутствует',
  };
  for (const [kind, label] of Object.entries(labels)) assert.equal(text.includes(label), kind === status, entry.id + ': distinct ' + kind + ' label');
  if (status === 'partial') assert.ok(text.includes('Список неполный или содержит неуточнённые сведения'), entry.id + ': partial disclaimer');
  if (entry.loot?.note) assert.ok(text.includes(compact(entry.loot.note)), entry.id + ': loot note');
  for (const reference of entry.loot?.sources || []) if (reference.author) assert.ok(text.includes('(автор: ' + compact(reference.author) + ')'), entry.id + ': author');
  if (entry.loot) {
    assert.ok(entry.loot.sources.length > 0, entry.id + ': evidence requires a source');
    assert.ok(text.includes('Сведения сверены ' + entry.loot.reviewedAt.split('-').reverse().join('.')), entry.id + ': review date');
    assert.ok(text.includes('В игре нами не проверено'), entry.id + ': no claim of in-game verification');
  }
  for (const link of await block.locator('a[href*="landofgames.ru"]').all()) {
    assert.ok(!(await link.getAttribute('rel') || '').split(/\s+/).includes('nofollow'));
    const sourceSize = await link.evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    const itemSizes = await block.locator('li, li *').evaluateAll(els => els.map(el => parseFloat(getComputedStyle(el).fontSize)));
    assert.ok(itemSizes.every(size => size <= sourceSize), entry.id + ': LoG source credit no smaller than borrowed item text');
  }
  visited.add(entry.id);
  return block;
}
async function checkSavedStep(page, entry, solution, step) {
  await page.waitForFunction(expected => {
    const node = document.querySelector('[data-testid="ready-solution"]');
    const saved = JSON.parse(localStorage.getItem(expected.key) || 'null');
    const skillButton = [...document.querySelectorAll('button')].find(button => button.textContent === 'Обучен');
    return node?.getAttribute('data-solution-id') === expected.solutionId && node.querySelector('progress')?.value === expected.step && skillButton?.getAttribute('aria-pressed') === 'true' && saved?.skill === 'trained' && saved.progress?.[expected.entryId]?.step === expected.step && saved.progress[expected.entryId].signature === expected.signature;
  }, { key: STORAGE, solutionId: solution.id, entryId: entry.id, signature: solutionSignature(solution), step });
  const ready = page.getByTestId('ready-solution');
  assert.equal(await ready.getAttribute('data-solution-id'), solution.id);
  assert.equal(Number(await ready.getByRole('progressbar', { name: 'Прогресс открытия' }).getAttribute('value')), step);
  assert.equal(Number(await ready.getByRole('progressbar', { name: 'Прогресс открытия' }).getAttribute('max')), groupMoves(solution.moves).length);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);
  assert.equal(saved.skill, 'trained');
  assert.deepEqual(saved.progress[entry.id], { signature: solutionSignature(solution), step });
  assert.ok(compact(await ready.locator('[aria-live="polite"]').innerText()).includes(`ШАГ ${step + 1} ИЗ ${groupMoves(solution.moves).length}`));
}
async function noOverflow(page, label) {
  const sizes = await page.evaluate(() => ({ width: innerWidth, root: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(sizes.root <= sizes.width + 1 && sizes.body <= sizes.width + 1, label + ': ' + JSON.stringify(sizes));
}
(async () => {
  assert.equal(chests.length, 246, 'The approved catalog contains all 246 chests');
  assert.equal(new Set(chests.map(entry => entry.id)).size, 246, 'Chest IDs are unique');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'allow' });
  const page = await context.newPage(); page.setDefaultTimeout(30000);
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort());
    await page.goto(base.href, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByText('Доступно офлайн', { exact: true }).waitFor({ timeout: 60000 });
    await compareRows(page, catalog);
    pass('Catalog exposes every approved object ID exactly once, including all 246 unique chests');
    for (const entry of chests) await checkLoot(page, entry);
    assert.deepEqual(sorted(visited), sorted(chests.map(entry => entry.id)));
    pass('All 246 chests render exact items, four evidence states, notes, dates, authors and direct sources');
    const first = catalog.find(entry => entry.id === 'tower-chest-first'), upper = catalog.find(entry => entry.id === 'tower-chest-second');
    assert.ok(first.contents.some(item => /руды × 26/.test(item)));
    assert.ok(upper.contents.some(item => /Кольцо железной кожи/.test(item)));
    assert.ok(!first.contents.some(item => /Кольцо железной кожи/.test(item)));
    for (const id of ['silas-tavern-basement-chest', 'silas-storeroom-chest']) await checkLoot(page, catalog.find(entry => entry.id === id));
    assert.ok(!catalog.find(entry => entry.id === 'silas-tavern-basement-chest').contents.some(item => /Топор Брана/.test(item)));
    assert.ok(catalog.find(entry => entry.id === 'silas-storeroom-chest').contents.some(item => /Топор Брана/.test(item)));
    pass('Upper/lower tower loot and the two Silas chests remain distinct');
    await page.getByRole('button', { name: 'Все замки', exact: true }).click();
    const query = 'Кольцо железной кожи', expectedSearch = filterCatalog({ query });
    assert.ok(expectedSearch.some(entry => entry.id === upper.id), 'Loot query finds its known upper-tower chest');
    assert.ok(!expectedSearch.some(entry => entry.id === first.id), 'Loot query does not conflate the lower-tower chest');
    await page.getByRole('textbox', { name: 'Поиск сундука или персонажа', exact: true }).fill(query);
    await compareRows(page, expectedSearch);
    pass('Loot item search finds the known chest and returns the exact matching catalog IDs');
    const partial = chests.find(entry => entry.loot?.coverage === 'partial');
    const empty = chests.find(entry => entry.loot?.coverage === 'empty');
    const missing = chests.find(entry => !entry.loot && !entry.contents.length);
    const listed = chests.find(entry => entry.loot?.coverage === 'listed');
    assert.ok(partial && empty && missing && listed, 'All four evidence states remain represented');
    const longestList = chests.reduce((a, b) => a.contents.join(' ').length >= b.contents.join(' ').length ? a : b);
    const longestNote = chests.reduce((a, b) => (a.loot?.note || '').length >= (b.loot?.note || '').length ? a : b);
    const longestSources = chests.reduce((a, b) => JSON.stringify([a.loot?.sources, a.lootExternal]).length >= JSON.stringify([b.loot?.sources, b.lootExternal]).length ? a : b);
    const mobileEntries = [...new Map([upper, partial, empty, missing, listed, longestList, longestNote, longestSources].map(entry => [entry.id, entry])).values()];
    for (const width of [320, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const entry of mobileEntries) {
        const block = await checkLoot(page, entry);
        await noOverflow(page, entry.id + ' at ' + width);
        if (entry.id === longestList.id || entry.id === longestSources.id) {
          await block.scrollIntoViewIfNeeded();
          await page.screenshot({ path: path.join(output, 'loot-' + width + '-' + entry.id + '.png') });
        }
      }
      await openEntry(page, upper);
      await page.getByTestId('loot-details').scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(output, 'loot-' + width + '.png') });
    }
    pass('All evidence states and longest loot/provenance fit 320/390 px without horizontal overflow');
    const shack = catalog.find(entry => entry.id === 'old-camp-abandoned-shack-chest');
    const solution = readyFor(shack.id, 'trained')[0];
    assert.ok(solution && solution.moves.length > 0);
    await openEntry(page, shack);
    await page.getByRole('button', { name: 'Обучен', exact: true }).click();
    await page.waitForFunction(id => document.querySelector('[data-testid="ready-solution"]')?.getAttribute('data-solution-id') === id && [...document.querySelectorAll('button')].some(button => button.textContent === 'Обучен' && button.getAttribute('aria-pressed') === 'true'), solution.id);
    await page.getByTestId('ready-solution').getByRole('button', { name: 'Следующий шаг', exact: true }).click();
    await checkSavedStep(page, shack, solution, 1);
    // Visiting another loot card must preserve the saved route just like a reload.
    await checkLoot(page, upper);
    await checkLoot(page, shack);
    await checkSavedStep(page, shack, solution, 1);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await checkLoot(page, shack);
    await checkSavedStep(page, shack, solution, 1);
    pass('Loot navigation and reload preserve the exact trained solution, signature and nonzero saved step');
    await context.setOffline(true);
    await page.getByText('Без интернета', { exact: true }).waitFor();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await checkLoot(page, shack);
    await checkSavedStep(page, shack, solution, 1);
    for (const entry of [...new Map([upper, partial, empty, missing, longestSources].map(entry => [entry.id, entry])).values()]) await checkLoot(page, entry);
    assert.equal(await page.evaluate(async () => { try { await fetch('/__uncached-loot-network-probe__' + Date.now(), { cache: 'no-store' }); return true; } catch { return false; } }), false);
    await checkLoot(page, shack);
    await checkSavedStep(page, shack, solution, 1);
    pass('Verified offline reload retains loot states, source links and the exact trained saved step');
    assert.equal(errors.length, 0); pass('No browser JavaScript errors');
    const report = { passed: results.length, results, errors, chests: chests.length, checkedChestIds: sorted(visited), withLootEvidence: chests.filter(entry => entry.loot).length, withItems: chests.filter(entry => entry.contents.length).length, empty: chests.filter(entry => entry.loot?.coverage === 'empty').length, mobileIds: mobileEntries.map(entry => entry.id), base: base.href };
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report));
  } catch (error) {
    fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({ error: String(error), stack: error.stack, results, errors, checkedChestIds: sorted(visited), url: page.url() }, null, 2));
    await page.screenshot({ path: path.join(output, 'failure.png') }).catch(() => {});
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
