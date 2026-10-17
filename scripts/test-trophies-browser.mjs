/** Guest UI/PWA in real Chromium. Cloud/auth integration is tested separately
 * by test-trophies-sync-integration.mjs with local PostgreSQL, never production.
 * Run against a built local export: TROPHIES_TEST_URL=http://127.0.0.1:8765.
 */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';

test('real guest walkthrough, save branches, durable progress and mobile offline UI', { skip: !process.env.PLAYWRIGHT_MODULE, timeout: 120000 }, async t => {
  const base = new URL(process.env.TROPHIES_TEST_URL || 'http://127.0.0.1:8765');
  assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Browser tests are restricted to localhost.');
  const modulePath = process.env.PLAYWRIGHT_MODULE.endsWith('.js') ? process.env.PLAYWRIGHT_MODULE : join(process.env.PLAYWRIGHT_MODULE, 'index.mjs');
  const { chromium } = await import(pathToFileURL(modulePath).href);
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, headless: true });
  t.after(() => browser.close());
  const artifacts = process.env.TROPHIES_ARTIFACT_DIR ? resolve(process.env.TROPHIES_ARTIFACT_DIR) : await mkdtemp(join(tmpdir(), 'trophies-browser-'));
  await mkdir(artifacts, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 920 }, acceptDownloads: true });
  const pageErrors = [], checked = []; const mark = message => { checked.push(message); console.log('PASS ' + message); };
  // A test cannot accidentally invoke production OAuth, database or analytics.
  const localOnly = async route => { if (new URL(route.request().url()).origin === base.origin) await route.continue(); else await route.abort(); };
  await context.route('**/*', localOnly);
  const page = await context.newPage();
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('dialog', dialog => void dialog.accept());
  const eventually = async (read, expected, label) => { const deadline = Date.now() + 6000; while (Date.now() < deadline) { if (await read() === expected) return; await new Promise(done => setTimeout(done, 35)); } assert.equal(await read(), expected, label); };
  const tracker = page.getByTestId('trophy-tracker');
  const guide = page.getByTestId('interactive-guide');
  const tab = name => tracker.getByRole('navigation', { name: 'Раздел трекера' }).getByRole('button', { name, exact: true }).click();
  const ready = () => page.getByTestId('interactive-guide').waitFor({ state: 'visible' });
  const record = () => page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => { const request = indexedDB.open('lab-trophies-v1'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
    try { return await new Promise((resolve, reject) => { const request = db.transaction('workspaces').objectStore('workspaces').get('guest'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
    finally { db.close(); }
  });
  const field = (row, runId, entityId, name) => row.events.filter(event => event.gameId === 'gothic-remake' && event.runId === runId && event.entityId === entityId && event.field === name).sort((a, b) => b.clock - a.clock)[0]?.value;
  const changed = async count => {
    await page.waitForFunction(async before => {
      const db = await new Promise(resolve => { const request = indexedDB.open('lab-trophies-v1'); request.onsuccess = () => resolve(request.result); });
      const row = await new Promise(resolve => { const request = db.transaction('workspaces').objectStore('workspaces').get('guest'); request.onsuccess = () => resolve(request.result); });
      db.close(); return row.events.length > before;
    }, count);
  };
  const confirmTransitionIfShown = async () => { const dialog = page.getByRole('dialog', { name: 'Проверка перед сюжетным решением' }); if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Подтвердить выполненное действие', exact: true }).click(); };
  const reveal = async locator => { await locator.evaluate(element => { for (let parent = element.parentElement; parent; parent = parent.parentElement) if (parent.tagName === 'DETAILS') parent.open = true; }); };
  const selectVisible = async (locator, value) => { await reveal(locator); await locator.selectOption(value); };
  const currentRecommendation = () => guide.locator('article[data-route-id]').filter({ hasText: 'Следующий рекомендуемый шаг' }).first();

  await page.goto(new URL('/trophies/gothic-remake', base).href);
  await page.getByTestId('onboarding').waitFor();
  assert.equal(await tracker.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('value'), '0');
  await tracker.getByRole('button', { name: 'Загрузить мой начальный прогресс', exact: true }).click();
  await ready();
  const runId = await tracker.getByLabel('Прохождение', { exact: true }).inputValue();
  assert.equal(runId, 'first-playthrough');
  assert.equal(await tracker.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('value'), '1');
  assert.equal(await tracker.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('max'), '41');
  let row = await record();
  assert.equal(row.events.filter(e => e.runId === null && e.field === 'observed' && e.entityId.startsWith('lesson-') && e.value === true).length, 5);
  assert.equal(field(row, runId, 'run', 'reportedLessons'), 6);
  assert.equal(row.events.filter(e => e.runId === null && e.field === 'observed' && e.entityId.startsWith('map-') && e.value === true).length, 1);
  assert.equal(field(row, runId, 'run', 'reportedMaps'), 3);
  mark('Initial progress: 41 PSN trophies, 5 identified lessons vs 6 reported, 1 map vs 3 reported.');

  const initialRecommendation = await currentRecommendation().getAttribute('data-route-id');
  assert.ok(initialRecommendation, 'A real recommended action is shown.');
  const firstTitle = await currentRecommendation().getByRole('heading', { level: 3 }).textContent();
  await currentRecommendation().getByRole('button', { name: 'Подтвердить выполнение', exact: true }).click(); await confirmTransitionIfShown();
  await page.waitForFunction(id => {
    const card = [...document.querySelectorAll('[data-testid="interactive-guide"] article[data-route-id]')].find(element => element.textContent.includes('Следующий рекомендуемый шаг'));
    return card?.getAttribute('data-route-id') !== id;
  }, initialRecommendation);
  await tracker.getByRole('button', { name: 'Отменить', exact: true }).click();
  await page.waitForFunction(id => [...document.querySelectorAll('[data-testid="interactive-guide"] article[data-route-id]')].some(element => element.getAttribute('data-route-id') === id && element.textContent.includes('Следующий рекомендуемый шаг')), initialRecommendation);
  await currentRecommendation().getByRole('button', { name: 'Отложить', exact: true }).click();
  await guide.getByRole('button', { name: 'Полный маршрут', exact: true }).click();
  await guide.getByLabel('Поиск по маршруту').fill(firstTitle);
  const postponed = guide.locator(`[data-route-id="${initialRecommendation}"]`);
  await eventually(() => postponed.getAttribute('data-route-status'), 'postponed');
  await postponed.getByRole('button', { name: 'Вернуть в маршрут' }).click();
  await guide.getByLabel('Поиск по маршруту').fill('');
  const arbitrary = guide.locator(`article[data-route-status="available"]:not([data-route-id="${initialRecommendation}"])`).first();
  const arbitraryId = await arbitrary.getAttribute('data-route-id');
  await arbitrary.getByRole('button', { name: 'Подтвердить выполнение', exact: true }).click(); await confirmTransitionIfShown();
  await page.waitForFunction(id => document.querySelector(`[data-route-id="${id}"]`)?.getAttribute('data-route-status') === 'done', arbitraryId);
  await guide.getByRole('button', { name: 'Продолжить', exact: true }).click();
  mark('Recommendation advances after explicit completion, undo restores it, postpone/return and arbitrary order work.');

  await selectVisible(guide.getByLabel('Глава в гайде'), '2');
  const checkpoint = page.getByRole('dialog', { name: 'Перед переходом в следующую главу' });
  await checkpoint.waitFor();
  assert.match(await checkpoint.textContent(), /Создайте отдельное сохранение на PS5/);
  assert.match(await checkpoint.textContent(), /Незавершённые цепочки/);
  await checkpoint.getByRole('button', { name: 'Остаться в главе 1' }).click();
  assert.equal(await guide.getByLabel('Глава в гайде').inputValue(), '1');
  mark('Chapter transition requires an explicit checkpoint and can be cancelled.');

  await reveal(tracker.getByRole('button', { name: 'Создать ветку', exact: true, includeHidden: true }));
  await tracker.getByRole('button', { name: 'Создать ветку', exact: true }).click();
  await tracker.getByLabel('Название ветки сохранения').fill('Тестовая ветка — Новый лагерь');
  await tracker.getByRole('button', { name: 'Создать ветку из текущей', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[aria-label="Сохранение персонажа"]').value !== 'main');
  const branch = await tracker.getByLabel('Сохранение персонажа').inputValue();
  await tab('Гайд к платине');
  await selectVisible(guide.getByLabel('Лагерь персонажа', { exact: true }), 'new');
  await tab('Чек-лист');
  await selectVisible(tracker.getByLabel('Категория', { exact: true }), 'lessons');
  const diving = tracker.locator('[data-item-id="lesson-diving"]');
  await diving.getByRole('checkbox', { name: /^Выполнено:/ }).click(); await eventually(() => diving.getByRole('checkbox', { name: /^Выполнено:/ }).isChecked(), false);
  assert.equal(await diving.getByRole('checkbox', { name: /^Изучение записано:/ }).isChecked(), true);
  await selectVisible(tracker.getByLabel('Категория', { exact: true }), 'trophies');
  await tracker.getByRole('checkbox', { name: 'Показывать спойлеры следующих глав' }).check();
  assert.equal(await tracker.locator('[data-item-id]').count(), 41);
  await tracker.locator('[data-item-id="trophy-new-camp"]').getByRole('checkbox').click();
  await eventually(() => tracker.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('value'), '2');
  await selectVisible(tracker.getByLabel('Сохранение персонажа'), 'main');
  await selectVisible(tracker.getByLabel('Категория', { exact: true }), 'lessons');
  assert.equal(await tracker.locator('[data-item-id]').count(), 46);
  await eventually(() => diving.getByRole('checkbox', { name: /^Выполнено:/ }).isChecked(), true);
  assert.equal(await diving.getByRole('checkbox', { name: /^Изучение записано:/ }).isChecked(), true);
  await eventually(() => tracker.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('value'), '2');
  await tab('Гайд к платине');
  await eventually(() => guide.getByLabel('Лагерь персонажа', { exact: true }).inputValue(), 'none');
  await selectVisible(tracker.getByLabel('Сохранение персонажа'), branch);
  await eventually(() => guide.getByLabel('Лагерь персонажа', { exact: true }).inputValue(), 'new');
  await selectVisible(tracker.getByLabel('Сохранение персонажа'), 'main');
  await selectVisible(tracker.getByLabel('Прохождение', { exact: true }), 'permadeath-plan');
  await page.reload(); await ready();
  assert.equal(await tracker.getByLabel('Прохождение', { exact: true }).inputValue(), 'permadeath-plan');
  await eventually(() => tracker.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('value'), '2');
  await tab('Чек-лист');
  await eventually(() => diving.getByRole('checkbox', { name: /^Выполнено:/ }).isChecked(), false);
  assert.equal(await diving.getByRole('checkbox', { name: /^Изучение записано:/ }).isChecked(), true);
  await selectVisible(tracker.getByLabel('Прохождение', { exact: true }), runId);
  mark('Separate save branch and playthrough states; manual PSN trophies and learned history survive returning to the main save. UI matches all 41 trophies and 46 lessons.');

  await tab('Заметки');
  const note = tracker.getByLabel('Заметки', { exact: true });
  const journalText = 'Проверка сохранения заметки во время ввода — без выхода из поля.';
  row = await record();
  await note.fill(journalText);
  await changed(row.events.length);
  assert.equal(await note.inputValue(), journalText);
  await page.reload(); await ready(); await tab('Заметки');
  assert.equal(await note.inputValue(), journalText);
  const recoveredText = 'Черновик непосредственно перед перезагрузкой.';
  await note.fill(recoveredText);
  await page.reload(); await ready(); await tab('Заметки');
  await page.waitForFunction(text => [...document.querySelectorAll('textarea')].some(field => field.value === text), recoveredText);
  await tracker.getByText('Сохранено на устройстве', { exact: true }).waitFor();
  mark('Autosaved note survives reload; an immediately interrupted draft is recovered.');

  await tab('Сохранения');
  const downloadPromise = page.waitForEvent('download');
  await tracker.getByRole('button', { name: 'Экспорт JSON', exact: true }).click();
  const download = await downloadPromise;
  const exportedPath = join(artifacts, 'guest-progress.json');
  await download.saveAs(exportedPath);
  const exported = JSON.parse(await readFile(exportedPath, 'utf8'));
  assert.equal(exported.format, 'lab-trophies');
  const countBeforeImport = (await record()).events.length;
  await tracker.getByLabel('Импорт JSON').setInputFiles(exportedPath);
  await tracker.getByRole('button', { name: 'Объединить с моей историей' }).click();
  await tracker.getByText('История объединена', { exact: false }).waitFor();
  assert.equal((await record()).events.length, countBeforeImport);
  await tracker.getByLabel('Импорт JSON').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"wrong"}') });
  await tracker.getByRole('alert').first().waitFor();
  assert.equal((await record()).events.length, countBeforeImport);
  mark('JSON export/import is idempotent; invalid input preserves existing history.');
  await tracker.getByLabel('Импорт JSON').setInputFiles(exportedPath);
  await tracker.getByRole('button', { name: 'Отмена', exact: true }).click();

  await tab('Гайд к платине');
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(geometry.scroll <= geometry.viewport + 1, `No horizontal overflow at ${width}px: ${JSON.stringify(geometry)}`);
    const nextPosition = await currentRecommendation().boundingBox();
    console.log(`Mobile ${width}px: recommended card y=${Math.round(nextPosition?.y ?? -1)}`);
    await page.screenshot({ path: join(artifacts, `guide-${width}.png`), fullPage: true });
  }
  await page.evaluate(async () => { await caches.open('gothic-locks-browser-test'); await navigator.serviceWorker.ready; });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload(); await ready();
  const offlineRow = await record();
  await currentRecommendation().getByRole('button', { name: 'Подтвердить выполнение', exact: true }).click(); await confirmTransitionIfShown();
  await changed(offlineRow.events.length);
  const offlineCount = (await record()).events.length;
  await page.reload(); await ready();
  assert.equal((await record()).events.length, offlineCount);
  assert.ok((await record()).pendingIds.length > 0);
  await tracker.getByRole('link', { name: 'Все игры', exact: true }).click();
  await page.getByRole('heading', { name: 'Трофеи и прохождения', exact: true }).waitFor();
  await page.locator('a[href="/trophies/gothic-remake"]').click();
  await ready();
  assert.equal((await record()).events.length, offlineCount);
  assert.equal(await page.evaluate(async () => { for (const name of await caches.keys()) { if (!name.startsWith('lab-trophies-v1-')) continue; for (const request of await (await caches.open(name)).keys()) { const url = new URL(request.url); if (url.origin !== location.origin || /\/(auth|rest|api)\//.test(url.pathname) || url.searchParams.has('access_token')) return false; } } return true; }), true);
  assert.ok(await page.evaluate(async () => (await caches.keys()).includes('gothic-locks-browser-test')));
  await context.setOffline(false);
  mark('390px and 320px layouts fit; installed real app reloads offline and keeps confirmed actions/outbox plus another app cache.');

  const independent = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await independent.route('**/*', localOnly);
  const secondPage = await independent.newPage();
  await secondPage.goto(new URL('/trophies/gothic-remake', base).href);
  await secondPage.getByTestId('onboarding').waitFor();
  assert.equal(await secondPage.getByRole('progressbar', { name: 'Полученные трофеи PSN' }).getAttribute('value'), '0');
  mark('Independent browser context has no guest progress from the first device.');
  await secondPage.getByRole('button', { name: 'Загрузить мой начальный прогресс', exact: true }).click();
  await secondPage.getByTestId('interactive-guide').waitFor();
  await secondPage.reload(); await secondPage.getByTestId('interactive-guide').waitFor();
  for (const width of [390, 320]) {
    await secondPage.setViewportSize({ width, height: 844 });
    await secondPage.evaluate(() => window.scrollTo(0, 0));
    const card = secondPage.getByTestId('interactive-guide').locator('article[data-route-id]').filter({ hasText: 'Следующий рекомендуемый шаг' }).first();
    const position = await card.boundingBox();
    console.log(`Clean initial ${width}px: recommended card y=${Math.round(position?.y ?? -1)}`);
    await secondPage.screenshot({ path: join(artifacts, `initial-guide-${width}.png`), fullPage: true });
  }
  assert.deepEqual(pageErrors, [], 'No uncaught browser errors.');
  await writeFile(join(artifacts, 'report.json'), JSON.stringify({ productionTouched: false, authentication: 'guest; cloud transport tested separately against local PostgreSQL', checked, pageErrors }, null, 2));
  console.log('Trophy browser artifacts: ' + artifacts);

});
