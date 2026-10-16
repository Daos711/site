/* Optional browser acceptance test. Provide PLAYWRIGHT_MODULE and CHROMIUM_PATH
 * when Playwright is not installed in this project. Serve out/ at GOTHIC_TEST_URL.
 * Observation calculations below are mathematical tests, not in-game validation. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const url = process.env.GOTHIC_TEST_URL || 'http://127.0.0.1:8765/apps/gothic-locks';
const baseUrl = new URL(url); baseUrl.hash = ''; baseUrl.search = '';
const artifacts = process.env.GOTHIC_TEST_OUTPUT || path.resolve('work/gothic-browser');
const results = [];
const record = (name) => { results.push(name); console.log('PASS ' + name); };
const appText = async (page) => page.locator('main').innerText();
const waitText = (page, text) => page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 30000 });
const skillLabels = ['Без навыка', 'Обучен', 'Мастер'];
const noInstruction = async (page) => assert.doesNotMatch(await appText(page), /ШАГ \d+ ИЗ|Вся комбинация ·/);
const selectedPin = (page, plate, position) => page.getByRole('button', { name: `Пластина ${plate}, позиция ${position}`, exact: true });
const connection = (page, from, to) => page.getByRole('combobox', { name: `Связь из пластины ${from} в ${to}`, exact: true });
const calculate = (page) => page.getByRole('button', { name: 'Рассчитать безопасное решение', exact: true });
const checkActual = (page) => page.getByRole('checkbox', { name: /Я сверил все позиции/ });
const sourceConfirm = (page) => page.getByRole('button', { name: 'Проверил позиции и связи для выбранного навыка', exact: true });
const sorted = (values) => [...values].sort();
async function loadCatalog() {
  const source = await fs.readFile(path.resolve(__dirname, '../src/lib/gothic-locks/catalog.ts'), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } });
  const module = { exports: {} };
  new Function('exports', 'require', 'module', outputText)(module.exports, require, module);
  return module.exports;
}
async function visibleIds(page) {
  return page.locator('[data-lock-id]').evaluateAll((rows) => rows.map((row) => row.getAttribute('data-lock-id')));
}
async function compareRows(page, expected, label) {
  // Wait for React's transition after a filter change, then compare identities rather than counts alone.
  await page.waitForFunction((ids) => {
    const actual = [...document.querySelectorAll('[data-lock-id]')].map((row) => row.getAttribute('data-lock-id')).sort();
    return JSON.stringify(actual) === JSON.stringify([...ids].sort());
  }, expected.map((entry) => entry.id), { timeout: 10000 });
  assert.deepEqual(sorted(await visibleIds(page)), sorted(expected.map((entry) => entry.id)), label);
}
async function goCatalog(page) {
  await page.goto(baseUrl.href, { waitUntil: 'networkidle' });
  const search = page.getByRole('textbox', { name: 'Поиск сундука или персонажа' });
  await search.waitFor();
  await search.fill('');
  for (const label of ['Район Колонии', 'Тип объекта', 'Местность', 'Полнота данных']) {
    await page.getByRole('combobox', { name: label, exact: true }).selectOption('');
  }
  await page.getByRole('checkbox', { name: 'Скрыть вскрытые', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'Ценные предметы', exact: true }).uncheck();
}
async function openEntry(page, id) {
  await page.goto(baseUrl.href + '#lock=' + encodeURIComponent(id), { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^(Отметить вскрытым|Уже вскрыт)$/ }).waitFor();
}
async function newManual(page) {
  await goCatalog(page);
  await page.getByRole('button', { name: 'Моего сундука нет', exact: true }).click();
  await page.getByRole('heading', { name: 'Фактическое состояние замка', exact: true }).waitFor();
}
(async () => {
  const { LOCK_CATALOG: catalog, REGIONS, TYPE_NAMES, CATALOG_COUNTS, completeness } = await loadCatalog();
  assert.ok(catalog.length > 20, 'the real expanded catalog is exercised');
  await fs.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'allow', permissions: ['clipboard-read', 'clipboard-write'] });
  const errors = [];
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push(error.message));
  await context.route(/https:\/\/(cdn\.jsdelivr\.net|www\.googletagmanager\.com)\//, (route) => route.abort());
  // The embed is checked as a lazy external integration; its remote content is not part of this suite.
  await context.route('https://gothic1remake.th.gl/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Map test placeholder</title>' }));
  try {
    await goCatalog(page);
    await waitText(page, 'Доступно офлайн');
    assert.equal(await page.getByRole('heading', { name: 'Gothic Remake — Замки' }).count(), 1);
    await compareRows(page, catalog, 'all rendered IDs equal the source catalog exactly');
    const coverage = await page.getByTestId('catalog-coverage').innerText();
    for (const text of [`${CATALOG_COUNTS.total} карточек`, `Подтверждённые решения: ${CATALOG_COUNTS.confirmed}`, `Только местоположение: ${CATALOG_COUNTS.location}`, `Неполные данные: ${CATALOG_COUNTS.incomplete}`]) assert.ok(coverage.includes(text), text);
    await page.screenshot({ path: path.join(artifacts, 'desktop.png'), fullPage: true });
    record(`Desktop hydration, complete offline cache and exact ${catalog.length}-ID database/UI agreement`);

    for (const region of REGIONS) {
      await page.getByRole('combobox', { name: 'Район Колонии', exact: true }).selectOption(region.id);
      await compareRows(page, catalog.filter((entry) => entry.region === region.id), 'region ' + region.id);
    }
    await page.getByRole('combobox', { name: 'Район Колонии', exact: true }).selectOption('');
    for (const type of Object.keys(TYPE_NAMES)) {
      await page.getByRole('combobox', { name: 'Тип объекта', exact: true }).selectOption(type);
      await compareRows(page, catalog.filter((entry) => entry.type === type), 'type ' + type);
    }
    await page.getByRole('combobox', { name: 'Тип объекта', exact: true }).selectOption('');
    for (const status of ['confirmed', 'location', 'incomplete']) {
      await page.getByRole('combobox', { name: 'Полнота данных', exact: true }).selectOption(status);
      await compareRows(page, catalog.filter((entry) => completeness(entry) === status), 'status ' + status);
    }
    await page.getByRole('combobox', { name: 'Полнота данных', exact: true }).selectOption('');
    for (const area of ['mine', 'castle', 'tower', 'cave', 'dungeon', 'underwater']) {
      await page.getByRole('combobox', { name: 'Местность', exact: true }).selectOption(area);
      await compareRows(page, catalog.filter((entry) => entry.tags?.includes(area)), 'terrain ' + area);
    }
    await page.getByRole('combobox', { name: 'Местность', exact: true }).selectOption('');
    record('Every region, object type, terrain and completeness filter returns the exact expected IDs');

    const fisk = catalog.filter((entry) => entry.id.startsWith('fisk-'));
    assert.equal(fisk.length, 10); assert.equal(fisk.filter((entry) => entry.type === 'door').length, 2); assert.equal(fisk.filter((entry) => entry.type === 'chest').length, 8);
    await page.getByRole('textbox', { name: 'Поиск сундука или персонажа' }).fill('Фиск');
    await compareRows(page, fisk, 'Fisk search is two doors and eight chests');
    for (const entry of fisk) {
      await openEntry(page, entry.id);
      for (const skill of skillLabels) {
        await page.getByRole('button', { name: skill, exact: true }).click();
        await waitText(page, 'Решение не подтверждено');
        await noInstruction(page);
        assert.equal(await sourceConfirm(page).count(), 0, 'no absent Fisk configuration can be confirmed into a solution');
      }
    }
    record('All ten Fisk objects stay distinct and produce no invented hints for any of three skills');

    const observations = [['scatty-chest', 31], ['cor-galom-recipe', 15], ['cor-galom-second-variant', 59]];
    for (const [id, moveCount] of observations) {
      await openEntry(page, id);
      for (const skill of skillLabels) {
        await page.getByRole('button', { name: skill, exact: true }).click();
        await waitText(page, 'Решение не подтверждено для выбранного навыка');
        await noInstruction(page);
        await sourceConfirm(page).click();
        await waitText(page, 'ШАГ 1 ИЗ');
        assert.equal(await page.getByText(`Вся комбинация · ${moveCount} движений`, { exact: true }).count(), 1);
        assert.match(await appText(page), /Проверка этой комбинации в вашей версии игры на PS5 не выполнена/);
      }
    }
    record('Scatty and both Cor Galom observations calculate 31/15/59 moves only after explicit state confirmation for each skill');

    await openEntry(page, 'scatty-chest');
    await page.reload({ waitUntil: 'networkidle' });
    await sourceConfirm(page).click();
    await waitText(page, 'ШАГ 1 ИЗ');
    await page.getByRole('button', { name: 'Готово, следующий шаг' }).click();
    await waitText(page, 'ШАГ 2 ИЗ');
    await page.reload({ waitUntil: 'networkidle' });
    await waitText(page, 'Решение не подтверждено для выбранного навыка');
    await noInstruction(page);
    await sourceConfirm(page).click();
    await waitText(page, 'ШАГ 1 ИЗ');
    await page.getByRole('button', { name: 'Готово, следующий шаг' }).click();
    await page.getByRole('button', { name: 'Обучен', exact: true }).click();
    await noInstruction(page);
    await sourceConfirm(page).click();
    await waitText(page, 'ШАГ 1 ИЗ');
    await page.getByRole('button', { name: 'Готово, следующий шаг' }).click();
    await goCatalog(page);
    await page.getByRole('button', { name: 'Без навыка', exact: true }).click();
    await page.getByRole('button', { name: 'Обучен', exact: true }).click();
    await page.locator('[data-lock-id="scatty-chest"]').click();
    await waitText(page, 'Решение не подтверждено для выбранного навыка');
    await noInstruction(page);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('lab.gothic-locks.v1')).progress), {});
    await sourceConfirm(page).click();
    await waitText(page, 'ШАГ 1 ИЗ');
    record('Reload and skill changes require fresh confirmation; sidebar skill round trips cannot restore an old step');

    await page.getByRole('button', { name: 'Отметить вскрытым', exact: true }).click();
    await page.getByRole('button', { name: 'Готово, следующий шаг' }).click();
    await page.getByRole('button', { name: 'Положения изменились / отмычка сломалась' }).click();
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await waitText(page, 'Состояние этого замка изменено'); await noInstruction(page);
    await page.reload({ waitUntil: 'networkidle' });
    await waitText(page, 'Состояние этого замка изменено');
    assert.equal(await page.getByRole('button', { name: 'Уже вскрыт', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.getByRole('button', { name: 'Проверил: исходные позиции и связи совпадают', exact: true }).click();
    await waitText(page, 'ШАГ 1 ИЗ');
    await page.getByText('Вся комбинация · 31 движений', { exact: true }).click();
    await page.getByRole('button', { name: 'Копировать комбинацию' }).click();
    await waitText(page, 'Комбинация скопирована');
    record('Changed-state protection and opened mark persist; explicit reset restarts at step one and copying works');

    await newManual(page);
    await page.getByRole('button', { name: 'Без навыка', exact: true }).click();
    await selectedPin(page, 1, 2).click(); await connection(page, 1, 2).selectOption('-1');
    await checkActual(page).check();
    assert.equal(await calculate(page).isEnabled(), true);
    await page.getByRole('button', { name: 'Мастер', exact: true }).click();
    assert.equal(await selectedPin(page, 1, 2).getAttribute('aria-pressed'), 'true');
    assert.equal(await connection(page, 1, 2).inputValue(), '-1');
    assert.equal(await calculate(page).isDisabled(), true);
    assert.equal(await checkActual(page).isChecked(), false);
    record('Manual positions and directed links survive a skill change while confirmation is invalidated');

    for (let precision = 0; precision < skillLabels.length; precision++) {
      await newManual(page);
      await page.getByRole('button', { name: skillLabels[precision], exact: true }).click();
      for (const [plate, position] of [[1, 2], [2, 3], [3, 4], [4, 5]]) await selectedPin(page, plate, position).click();
      await connection(page, 1, 2).selectOption('1');
      await connection(page, 2, 3).selectOption('-1');
      await connection(page, 3, 4).selectOption('1');
      await page.getByText('Если известен полный граф и авторский порядок связей', { exact: true }).click();
      await page.getByRole('textbox', { name: 'Авторский порядок связей', exact: true }).fill('2>3,1>2,3>4');
      await page.getByRole('checkbox', { name: /Это полный граф до навыка/ }).check();
      const apply = page.getByRole('button', { name: 'Применить уровень к полному графу', exact: true });
      await apply.click();
      assert.equal(await connection(page, 2, 3).inputValue(), precision >= 1 ? '0' : '-1');
      assert.equal(await connection(page, 1, 2).inputValue(), precision >= 2 ? '0' : '1');
      assert.equal(await connection(page, 3, 4).inputValue(), '1');
      assert.equal(await apply.isDisabled(), true);
      await page.getByRole('textbox', { name: 'Авторский порядок связей', exact: true }).fill('3>4');
      await page.getByRole('checkbox', { name: /Это полный граф до навыка/ }).check();
      assert.equal(await apply.isDisabled(), true, 'editing order cannot apply pruning twice');
      if (precision === 2) {
        await page.getByRole('button', { name: 'Без навыка', exact: true }).click();
        assert.equal(await connection(page, 3, 4).inputValue(), '1');
        await page.getByRole('checkbox', { name: /Это полный граф до навыка/ }).check();
        assert.equal(await apply.isDisabled(), true, 'changing skill cannot apply pruning twice');
        await page.getByRole('button', { name: 'Мастер', exact: true }).click();
      }
      await checkActual(page).check(); await calculate(page).click();
      await waitText(page, 'ШАГ 1 ИЗ');
    }
    record('Synthetic full graph applies authored-order removal for all three skills and blocks double pruning after edits');

    await newManual(page);
    await page.getByRole('combobox', { name: 'Движение вправо', exact: true }).selectOption('right-increases');
    await selectedPin(page, 1, 7).click();
    await checkActual(page).check(); await calculate(page).click();
    await waitText(page, 'ШАГ 1 ИЗ');
    const practice = page.locator('details').filter({ has: page.getByText('Симулятор: проверить отдельный ход', { exact: true }) });
    await practice.locator('summary').click();
    const before = await practice.locator('figure').innerText();
    await practice.getByRole('button', { name: 'вправо', exact: true }).first().click();
    await waitText(page, 'Ход отклонён'); assert.equal(await practice.locator('figure').innerText(), before);
    await practice.getByRole('button', { name: 'влево', exact: true }).first().click();
    await waitText(page, 'Ход допустим'); assert.notEqual(await practice.locator('figure').innerText(), before);
    await practice.getByRole('button', { name: 'Пересчитать из этого состояния', exact: true }).click();
    assert.equal(await selectedPin(page, 1, 6).getAttribute('aria-pressed'), 'true');
    assert.equal(await calculate(page).isDisabled(), true);
    await checkActual(page).check(); await calculate(page).click(); await waitText(page, 'ШАГ 1 ИЗ');
    assert.equal(await page.getByText('Вся комбинация · 2 движений', { exact: true }).count(), 1);
    record('Simulator atomically rejects a wall move and recalculates from the actual resulting state');

    await newManual(page);
    await selectedPin(page, 1, 1).click(); await selectedPin(page, 2, 7).click();
    await connection(page, 1, 2).selectOption('1'); await connection(page, 2, 1).selectOption('1');
    await checkActual(page).check(); await calculate(page).click();
    await waitText(page, 'Безопасного решения нет'); await noInstruction(page);
    record('An unsolvable manual configuration exposes no unsafe hint');

    await goCatalog(page);
    assert.equal(await page.locator('iframe[title="Карта Колонии — TH.GL"]').count(), 0);
    await page.getByText('Карта всей Колонии · 386 сундуков + 16 подводных', { exact: true }).click();
    assert.equal(await page.locator('iframe[title="Карта Колонии — TH.GL"]').count(), 0);
    await page.getByRole('button', { name: 'Загрузить карту TH.GL', exact: true }).click();
    assert.equal(await page.locator('iframe[title="Карта Колонии — TH.GL"]').getAttribute('src'), 'https://gothic1remake.th.gl/ru/embed/maps/Khorinis');
    assert.equal(await page.locator('iframe[title="Карта Колонии — TH.GL"]').getAttribute('loading'), 'lazy');
    record('TH.GL map is absent before opt-in and uses the documented lazy embed URL');

    await goCatalog(page);
    for (const width of [320, 360, 412, 768, 1440]) {
      await page.setViewportSize({ width, height: 915 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'catalog overflow at ' + width);
    }
    await page.setViewportSize({ width: 412, height: 915 });
    await page.getByRole('textbox', { name: 'Поиск сундука или персонажа' }).fill('несуществующий сундук');
    await waitText(page, 'Пока ничего не найдено');
    await page.getByRole('button', { name: 'Сбросить фильтры', exact: true }).click();
    await page.getByRole('checkbox', { name: 'Скрыть вскрытые', exact: true }).check();
    await compareRows(page, catalog.filter((entry) => entry.id !== 'scatty-chest'), 'hide opened');
    await page.getByRole('checkbox', { name: 'Скрыть вскрытые', exact: true }).uncheck();
    await page.getByRole('checkbox', { name: 'Ценные предметы', exact: true }).check();
    await compareRows(page, catalog.filter((entry) => entry.valuable), 'valuable');
    await page.getByRole('checkbox', { name: 'Ценные предметы', exact: true }).uncheck();
    await page.screenshot({ path: path.join(artifacts, 'home-mobile.png'), fullPage: true });
    await newManual(page);
    await page.getByRole('combobox', { name: 'Количество пластин', exact: true }).selectOption('7');
    await page.setViewportSize({ width: 320, height: 820 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '7-plate editor body overflows');
    await page.screenshot({ path: path.join(artifacts, 'manual-320.png'), fullPage: true });
    record('Responsive 320–1440 px, seven-plate matrix, empty state, opened and valuable filters');

    await openEntry(page, 'cor-galom-recipe');
    await waitText(page, 'Доступно офлайн');
    await context.setOffline(true);
    await waitText(page, 'Без интернета');
    // Installed Chromium 143 resets navigator.onLine after reload; uncached fetch below proves network failure.
    await page.reload({ waitUntil: 'networkidle' });
    await waitText(page, 'Решение не подтверждено для выбранного навыка'); await noInstruction(page);
    await sourceConfirm(page).click(); await waitText(page, 'ШАГ 1 ИЗ');
    assert.equal(await page.getByText('Вся комбинация · 15 движений', { exact: true }).count(), 1);
    assert.equal(await page.evaluate(async () => { try { await fetch('/uncached-offline-proof-' + Date.now()); return false; } catch { return true; } }), true);
    const licenses = await context.newPage();
    await licenses.goto(new URL('/apps/gothic-locks-licenses.txt', url).href);
    assert.match(await licenses.locator('body').innerText(), /Permission is hereby granted/);
    assert.match(await licenses.locator('body').innerText(), /Viktor Murzak/);
    await licenses.close();
    await newManual(page); await selectedPin(page, 1, 1).click();
    await checkActual(page).check(); await calculate(page).click(); await waitText(page, 'ШАГ 1 ИЗ');
    assert.match(await appText(page), /влево\s+3\s+раз/);
    await page.getByRole('button', { name: 'Готово, следующий шаг' }).click(); await waitText(page, 'Все штифты в центре');
    record('True offline reload still requires confirmation; observation/manual worker solves and complete licenses work offline');
    await context.setOffline(false);

    const alias = new URL('/apps/g/', baseUrl); alias.search = '?from=browser-test'; alias.hash = '#lock=scatty-chest';
    await page.goto(alias.href, { waitUntil: 'networkidle' });
    await waitText(page, 'Решение не подтверждено для выбранного навыка');
    const redirected = new URL(page.url());
    assert.equal(redirected.pathname, '/apps/gothic-locks/'); assert.equal(redirected.search, alias.search); assert.equal(redirected.hash, alias.hash);
    record('Short /apps/g/ address opens the existing UI and preserves query/hash');

    const corrupted = await browser.newContext({ viewport: { width: 412, height: 915 } });
    await corrupted.addInitScript(() => localStorage.setItem('lab.gothic-locks.v1', '{broken'));
    const other = await corrupted.newPage();
    await openEntry(other, 'scatty-chest');
    await waitText(other, 'Решение не подтверждено для выбранного навыка'); await noInstruction(other);
    await sourceConfirm(other).click(); await waitText(other, 'ШАГ 1 ИЗ');
    await corrupted.close();
    record('Corrupted local storage recovers without bypassing the observation confirmation gate');
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(artifacts, 'result.json'), JSON.stringify({ passed: results.length, catalogCount: catalog.length, results, errors, disclaimer: 'Mathematical and browser verification; no independent in-game validation.' }, null, 2));
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }).catch(() => {});
    await fs.writeFile(path.join(artifacts, 'failure.json'), JSON.stringify({ passed: results.length, results, errors, error: String(error), url: page.url() }, null, 2));
    throw error;
  } finally { await browser.close(); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
