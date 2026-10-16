/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS acceptance harness with a selectable local Playwright runtime. */
/* Optional production-browser acceptance test. Serve out/ at GOTHIC_TEST_URL.
 * PLAYWRIGHT_MODULE and CHROMIUM_PATH may point at an existing local runtime.
 * These are mathematical/browser checks, not evidence of an in-game PS5 run. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const ts = require('typescript');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = new URL(process.env.GOTHIC_TEST_URL || 'http://127.0.0.1:8765/apps/gothic-locks');
base.hash = ''; base.search = '';
const artifacts = process.env.GOTHIC_TEST_OUTPUT || path.resolve('work/combinations-browser');
const STORAGE = 'lab.gothic-locks.v1';
const skills = { none: 'Без навыка', trained: 'Обучен', master: 'Мастер' };
const results = [], errors = [], skips = [];
const record = name => { results.push(name); console.log('PASS ' + name); };
const sorted = values => [...values].sort();
const compact = text => text.replace(/\s+/g, ' ').trim();
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
const lib = path.resolve(__dirname, '../src/lib/gothic-locks');
const { LOCK_CATALOG: catalog, CATALOG_ALIASES: aliases, REGIONS, TYPE_NAMES, filterCatalog } = loadTs(path.join(lib, 'catalog.ts'));
const { READY_SOLUTIONS: ready, SOLUTION_GUIDES: guides, solutionSignature } = loadTs(path.join(lib, 'ready-solutions.ts'));
const rawReady = JSON.parse(fs.readFileSync(path.join(lib, 'data/ready-solutions.json'), 'utf8'));
const catalogById = new Map(catalog.map(entry => [entry.id, entry]));
const forSkill = (entryId, skill) => ready.filter(solution => solution.entryId === entryId && solution.skill === skill);
const guidesFor = (entryId, skill) => guides.filter(guide => guide.entryId === entryId && (guide.skill === skill || guide.skill === 'unknown'));
const groupMoves = moves => moves.reduce((groups, move) => {
  const last = groups[groups.length - 1];
  if (last && last.plate === move.plate && last.direction === move.direction) last.count++;
  else groups.push({ ...move, count: 1 });
  return groups;
}, []);
const physical = (move, solution) => (move.direction === 1) === (solution.direction === 'right-increases') ? 'вправо' : 'влево';
const textFor = (move, solution) => `№ ${move.plate + 1} — ${physical(move, solution)} ${move.count} раз`;
const player = page => page.getByTestId('ready-solution');
const waitText = (page, text) => page.getByText(text, { exact: false }).filter({ visible: true }).first().waitFor({ timeout: 30000 });
const mainText = page => page.locator('main').innerText();
const readSaved = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE);
const pin = (page, plate, position) => page.getByRole('button', { name: `Пластина ${plate}, позиция ${position}`, exact: true });
const calculate = page => page.getByRole('button', { name: 'Рассчитать безопасное решение', exact: true });
const confirmation = page => page.getByRole('checkbox', { name: /Я сверил все позиции/ });
async function selectSkill(page, skill) {
  const button = page.getByRole('button', { name: skills[skill], exact: true });
  await button.click();
  await page.waitForFunction(label => [...document.querySelectorAll('button')].some(button => button.textContent === label && button.getAttribute('aria-pressed') === 'true'), skills[skill]);
}
async function compareRows(page, expected, label) {
  const ids = expected.map(entry => typeof entry === 'string' ? entry : entry.id);
  await page.waitForFunction(ids => {
    const actual = [...document.querySelectorAll('[data-lock-id]')].map(row => row.dataset.lockId).sort();
    return JSON.stringify(actual) === JSON.stringify([...ids].sort());
  }, ids, { timeout: 10000 });
  assert.deepEqual(sorted(await page.locator('[data-lock-id]').evaluateAll(rows => rows.map(row => row.dataset.lockId))), sorted(ids), label);
}
async function goCatalog(page) {
  if (page.url() === base.href) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(base.href, { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('textbox', { name: 'Поиск сундука или персонажа', exact: true });
  await search.waitFor(); await search.fill('');
  for (const label of ['Район Колонии', 'Тип объекта', 'Местность', 'Полнота данных']) await page.getByRole('combobox', { name: label, exact: true }).selectOption('');
  for (const label of ['Скрыть вскрытые', 'Ценные предметы', 'Есть готовая комбинация для выбранного навыка']) await page.getByRole('checkbox', { name: label, exact: true }).uncheck();
  const allCamps = page.getByRole('button', { name: 'Все лагеря', exact: true });
  if (await allCamps.count()) await allCamps.click();
}
async function openEntry(page, id) {
  const target = base.href + '#lock=' + encodeURIComponent(id);
  if (page.url() === target) await page.reload({ waitUntil: 'domcontentloaded' });
  else await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: catalogById.get(aliases[id] || id).name, exact: true }).waitFor();
  await page.getByRole('button', { name: /^(Отметить вскрытым|Уже вскрыт)$/ }).waitFor();
}
async function chooseSolution(page, solution) {
  await openEntry(page, solution.entryId);
  await selectSkill(page, solution.skill);
  const selector = page.getByRole('combobox', { name: 'Вариант комбинации', exact: true });
  if (forSkill(solution.entryId, solution.skill).length > 1) await selector.selectOption(solution.id);
  await page.locator(`[data-solution-id="${solution.id}"]`).waitFor();
  assert.equal(await player(page).getAttribute('data-solution-id'), solution.id);
}
async function checkStep(page, solution, step) {
  const groups = groupMoves(solution.moves), current = groups[step], scope = player(page);
  await page.waitForFunction(step => document.querySelector('[data-testid="ready-solution"] progress')?.value === step, step);
  assert.equal(Number(await scope.getByRole('progressbar').getAttribute('max')), groups.length);
  if (current) {
    assert.ok((await scope.innerText()).includes(`ШАГ ${step + 1} ИЗ ${groups.length}`));
    const command = scope.locator('[aria-live="polite"]');
    assert.equal(await command.getByRole('heading').innerText(), `Пластина № ${current.plate + 1}`);
    assert.match(compact(await command.innerText()), new RegExp(`${physical(current, solution)}\\s+${current.count}\\s+раз`));
  } else await scope.getByRole('heading', { name: 'Все шаги выполнены', exact: true }).waitFor();
}
async function checkFullRoute(page, solution) {
  const details = player(page).locator('details').filter({ has: page.getByText(`Вся комбинация · ${solution.moves.length} движений`, { exact: true }) });
  if (await details.getAttribute('open') === null) await details.locator('summary').click();
  assert.deepEqual((await details.locator('li').allTextContents()).map(compact), groupMoves(solution.moves).map(move => textFor(move, solution)), solution.id);
}
async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(dimensions.document <= dimensions.width && dimensions.body <= dimensions.width, `${label}: ${JSON.stringify(dimensions)}`);
}
async function screenshot(page, filename, fullPage = true) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.screenshot({ path: path.join(artifacts, filename), fullPage });
}
async function blankManual(page, position = 1) {
  await goCatalog(page);
  await page.getByRole('button', { name: 'Моего сундука нет', exact: true }).click();
  await page.getByRole('heading', { name: 'Фактическое состояние замка', exact: true }).waitFor();
  await pin(page, 1, position).click();
}
function watch(page) { page.on('pageerror', error => errors.push({ url: page.url(), message: error.message })); }
async function setupContext(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'allow', permissions: ['clipboard-read', 'clipboard-write'], ...options });
  context.on('page', watch);
  await context.route(/https:\/\/(cdn\.jsdelivr\.net|www\.googletagmanager\.com)\//, route => route.abort());
  await context.route('https://gothic1remake.th.gl/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Lazy map test placeholder</title>' }));
  return context;
}

(async () => {
  assert.equal(ready.length, rawReady.length, 'No invalid data row may silently disappear before browser testing');
  assert.ok(ready.length > 0);
  await fsp.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await setupContext(browser);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  let mapRequests = 0;
  page.on('request', request => { if (request.url().startsWith('https://gothic1remake.th.gl/')) mapRequests++; });
  try {
    await goCatalog(page);
    await waitText(page, 'Доступно офлайн');
    await compareRows(page, catalog, 'every catalog ID appears exactly once');
    const readyIds = new Set(ready.map(solution => solution.entryId));
    const notRequiredIds = new Set(catalog.filter(entry=>entry.access==='key'||entry.access==='unlocked').map(entry=>entry.id));
    const externalIds = new Set(guides.filter(guide => !readyIds.has(guide.entryId)&&!notRequiredIds.has(guide.entryId)).map(guide => guide.entryId));
    const coverageText = await page.getByTestId('catalog-coverage').innerText();
    for (const text of [`${catalog.length} карточек`, `Готовая комбинация: ${readyIds.size}`, `Только внешнее руководство: ${externalIds.size}`, `Пока без решения: ${catalog.length - readyIds.size - externalIds.size - notRequiredIds.size}`]) assert.ok(coverageText.includes(text), text);
    assert.ok(coverageText.includes('один объект считается один раз'));
    record(`Production hydration, complete offline cache, all ${catalog.length} catalog IDs and disjoint coverage`);

    for (const skill of Object.keys(skills)) {
      await selectSkill(page, skill);
      const expected = catalog.filter(entry => forSkill(entry.id, skill).length);
      await page.getByRole('checkbox', { name: 'Есть готовая комбинация для выбранного навыка', exact: true }).check();
      await compareRows(page, expected, 'ready-only for ' + skill);
      assert.ok((await page.getByTestId('catalog-coverage').innerText()).includes(`Для вашего навыка готовые шаги: ${expected.length}.`));
      await page.getByRole('checkbox', { name: 'Есть готовая комбинация для выбранного навыка', exact: true }).uncheck();
      for (const status of ['ready', 'simulated', 'published', 'external', 'missing', 'not-required']) {
        await page.getByRole('combobox', { name: 'Полнота данных', exact: true }).selectOption(status);
        const expected = catalog.filter(entry => {
          const notRequired=entry.access==='key'||entry.access==='unlocked';
          if(status==='not-required') return notRequired;
          if(notRequired) return false;
          const rows = forSkill(entry.id, skill);
          if (status === 'ready') return rows.length;
          if (status === 'simulated' || status === 'published') return rows.some(row => row.verification === status);
          return !rows.length && (status === 'external' ? guidesFor(entry.id, skill).length : !guidesFor(entry.id, skill).length);
        });
        await compareRows(page, expected, `${skill}/${status}`);
      }
      await page.getByRole('combobox', { name: 'Полнота данных', exact: true }).selectOption('');
    }
    record('All three skill filters and six solution-status filters return exact IDs without fallback or overlapping object counts');

    for (const solution of ready) {
      await chooseSolution(page, solution);
      await checkStep(page, solution, 0);
      await checkFullRoute(page, solution);
      const scope = player(page), text = await scope.innerText();
      assert.ok(text.includes(skills[solution.skill]));
      assert.ok(text.includes(solution.verification === 'simulated' ? 'Проверено расчётом' : 'По руководству'));
      assert.ok(text.includes('В вашей версии игры на PS5 нами не проверена.'));
      assert.ok(await scope.locator('a').evaluateAll((links, url) => links.some(link => link.href === url), solution.source.url));
    }
    record(`All ${ready.length} published variants select the exact entry/skill/solution ID and render every grouped physical direction from the atomic JSON`);

    const fisk = catalog.filter(entry => entry.id.startsWith('fisk-'));
    assert.equal(fisk.length, 10); assert.equal(fisk.filter(entry => entry.type === 'door').length, 2); assert.equal(fisk.filter(entry => entry.type === 'chest').length, 8);
    const fiskSolutions = ready.filter(solution => solution.entryId.startsWith('fisk-'));
    if (process.env.GOTHIC_REQUIRE_FISK !== '0') {
      assert.equal(fiskSolutions.length, 30, 'Fisk must have ten distinct objects × three skills');
      for (const entry of fisk) for (const skill of Object.keys(skills)) {
        assert.equal(forSkill(entry.id, skill).length, 1, `${entry.id}/${skill}`);
        assert.equal(forSkill(entry.id, skill)[0].verification, 'simulated');
      }
      record('All ten Fisk objects are distinct, with exactly thirty mathematical variants across three skills');
    } else { skips.push('Fisk 30-variant release gate explicitly disabled for pre-merge preview'); console.log('SKIP ' + skips.at(-1)); }

    for (const id of ['scatty-chest', 'cor-galom-second-variant']) for (const skill of Object.keys(skills)) {
      const solution = forSkill(id, skill).find(solution => solution.verification === 'simulated');
      assert.ok(solution, `${id}/${skill} needs a mathematical ready route`);
      await chooseSolution(page, solution); await checkStep(page, solution, 0);
      assert.equal(await page.getByRole('button', { name: 'Проверил позиции и связи для выбранного навыка', exact: true }).count(), 0);
    }
    record('Scatty and Cor Galom second chest immediately expose mathematical ready commands for all three skills');

    const scatty = forSkill('scatty-chest', 'none')[0];
    await chooseSolution(page, scatty);
    for (const name of ['Следующий шаг', 'Назад']) {
      const bounds = await player(page).getByRole('button', { name, exact: true }).boundingBox();
      assert.ok(bounds && bounds.width >= 44 && bounds.height >= 44, name + ' must remain a large touch target');
    }
    assert.equal(await player(page).getByRole('button', { name: 'Назад', exact: true }).isDisabled(), true);
    await player(page).getByRole('button', { name: 'Следующий шаг', exact: true }).click(); await checkStep(page, scatty, 1);
    await player(page).getByRole('button', { name: 'Следующий шаг', exact: true }).click(); await checkStep(page, scatty, 2);
    await player(page).getByRole('button', { name: 'Назад', exact: true }).click(); await checkStep(page, scatty, 1);
    await page.getByRole('button', { name: 'Отметить вскрытым', exact: true }).click();
    await page.reload({ waitUntil: 'domcontentloaded' }); await checkStep(page, scatty, 1);
    assert.equal(await page.getByRole('button', { name: 'Уже вскрыт', exact: true }).getAttribute('aria-pressed'), 'true');
    const saved = await readSaved(page);
    assert.deepEqual(saved.progress[scatty.entryId], { signature: solutionSignature(scatty), step: 1 });
    record('Large next/back controls update grouped commands; current step, signature and opened mark survive reload');

    await selectSkill(page, 'trained');
    await waitText(page, 'Состояние этого замка изменено');
    assert.equal(await player(page).count(), 0, 'Changing skill after a real step must require state confirmation');
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitText(page, 'Состояние этого замка изменено');
    assert.equal(await player(page).count(), 0);
    await page.getByRole('button', { name: 'Механизм возвращён к исходному состоянию', exact: true }).click();
    await checkStep(page, forSkill(scatty.entryId, 'trained')[0], 0);
    await player(page).getByRole('button', { name: 'Следующий шаг', exact: true }).click();
    await selectSkill(page, 'master'); await waitText(page, 'Состояние этого замка изменено');
    assert.equal(await player(page).count(), 0);
    await page.getByRole('button', { name: 'Механизм возвращён к исходному состоянию', exact: true }).click();
    await checkStep(page, forSkill(scatty.entryId, 'master')[0], 0);
    await selectSkill(page, 'none'); await checkStep(page, scatty, 0);
    assert.deepEqual((await readSaved(page)).progress, {});
    record('Skill changes after a step block commands across reload until explicit state reset; old profile progress is never reused');

    await player(page).getByRole('button', { name: 'Следующий шаг', exact: true }).click();
    await player(page).getByRole('button', { name: 'Положения изменились / пересчитать решение', exact: true }).click();
    await page.getByRole('heading', { name: 'Фактическое состояние замка', exact: true }).waitFor();
    assert.equal(await player(page).count(), 0);
    assert.equal(await calculate(page).isDisabled(), true);
    await page.getByRole('button', { name: 'Назад', exact: true }).click();
    await waitText(page, 'Состояние этого замка изменено'); assert.equal(await player(page).count(), 0);
    await page.reload({ waitUntil: 'domcontentloaded' }); await waitText(page, 'Состояние этого замка изменено');
    assert.equal(await player(page).count(), 0);
    assert.equal((await readSaved(page)).progress[scatty.entryId], undefined);
    await page.getByRole('button', { name: 'Ввести текущее состояние', exact: true }).click();
    const count = Number(await page.getByRole('combobox', { name: 'Количество пластин', exact: true }).inputValue());
    for (let plate = 1; plate <= count; plate++) await pin(page, plate, plate === 1 ? 1 : 4).click();
    for (const select of await page.getByRole('combobox', { name: /^Связь из пластины/ }).all()) await select.selectOption('0');
    await confirmation(page).check(); await calculate(page).click();
    await waitText(page, 'Вся комбинация · 3 движений'); assert.equal(await player(page).count(), 0);
    assert.match(compact(await mainText(page)), /влево\s+3\s+раз/);
    await openEntry(page, scatty.entryId); await waitText(page, 'Состояние этого замка изменено');
    await page.getByRole('button', { name: 'Механизм возвращён к исходному состоянию', exact: true }).click();
    await checkStep(page, scatty, 0);
    record('Changed-state editing/recalculation persistently blocks the stale route; explicit reset starts at step one');

    const published = ready.find(solution => solution.verification === 'published' && !solution.config && !solution.configAlternatives && !forSkill(solution.entryId, 'trained').length);
    assert.ok(published, 'Exercise an attributed Wiki sequence with no simulation and no trained fallback');
    await chooseSolution(page, published);
    const publishedText = await player(page).innerText();
    assert.ok(publishedText.includes('Решение не подтверждено симуляцией.'));
    assert.ok(publishedText.includes(published.source.license));
    assert.doesNotMatch(publishedText, /Проверено расчётом|Без поломок/);
    assert.equal(await player(page).locator('figure').count(), 0);
    assert.equal(await player(page).getByText('Симулятор: проверить отдельный ход', { exact: true }).count(), 0);
    await checkFullRoute(page, published);
    await player(page).getByRole('button', { name: 'Копировать комбинацию', exact: true }).click();
    await waitText(page, 'Комбинация скопирована');
    const clipboard = await page.evaluate(() => navigator.clipboard.readText());
    assert.ok(clipboard.includes(published.source.name), 'Copied Wiki steps must preserve the named contributors');
    assert.match(clipboard, /frostbyte99/); assert.match(clipboard, /Novaterra/);
    assert.match(clipboard, /CC[ -]BY[ -]NC[ -]SA[ -]4\.0/);
    assert.ok(clipboard.includes(published.source.url));
    assert.match(clipboard, /Адаптация|Перевод|Нормализация|Изменения/i);
    record('Copied Wiki combination preserves named authors, source URL, CC BY-NC-SA 4.0 license and adaptation notice');
    await selectSkill(page, 'trained');
    await waitText(page, 'Для выбранного навыка встроенной комбинации пока нет'); assert.equal(await player(page).count(), 0);
    record('Unsimulated Wiki routes keep their published label/license and expose no invented graph, guarantee or skill fallback');

    const universal = ready.find(solution => solution.derivation === 'universal' && solution.configAlternatives?.length >= 2 && !solution.config);
    assert.ok(universal, 'Exercise a genuine union of permitted mechanisms');
    await chooseSolution(page, universal);
    assert.equal(await player(page).getByText('Симулятор: проверить отдельный ход', { exact: true }).count(), 0);
    assert.equal(await player(page).getByText('Исходное состояние и направленные связи', { exact: true }).count(), 0);
    assert.equal(await player(page).locator('figure:visible').count(), 0);
    await player(page).getByText('Проверены все допустимые варианты связей', { exact: true }).click();
    assert.ok((await player(page).innerText()).includes(`каждой из ${universal.configAlternatives.length} допустимых схем`));
    assert.equal(await player(page).locator('table').count(), 0);
    assert.deepEqual(universal.configAlternatives.map(config => config.positions), universal.configAlternatives.map(() => universal.configAlternatives[0].positions), 'A shared initial diagram is only truthful when all alternatives start alike');
    record('Universal routes disclose every candidate count and show no invented selected matrix or single-model simulator');

    await goCatalog(page); await selectSkill(page, 'none');
    await page.getByRole('textbox', { name: 'Поиск сундука или персонажа', exact: true }).fill('Фиск');
    const fiskSearch=filterCatalog({query:'Фиск'});
    for(const entry of fisk) assert.ok(fiskSearch.some(item=>item.id===entry.id));
    assert.ok(fiskSearch.some(entry=>entry.id==='old-camp-fisk-behind-hut-chest'));
    assert.ok(!fiskSearch.some(entry=>entry.id==='scatty-chest'));
    await compareRows(page, fiskSearch, 'Fisk owner and nearby landmarks');
    await page.getByRole('textbox', { name: 'Поиск сундука или персонажа', exact: true }).fill('');
    for(const region of REGIONS){
      await page.getByRole('combobox',{name:'Район Колонии',exact:true}).selectOption(region.id);
      await compareRows(page,catalog.filter(entry=>entry.region===region.id),'region '+region.id);
    }
    await page.getByRole('combobox',{name:'Район Колонии',exact:true}).selectOption('');
    for(const type of Object.keys(TYPE_NAMES)){
      await page.getByRole('combobox',{name:'Тип объекта',exact:true}).selectOption(type);
      await compareRows(page,catalog.filter(entry=>entry.type===type),'object type '+type);
    }
    await page.getByRole('combobox',{name:'Тип объекта',exact:true}).selectOption('');
    record('Natural landmark search and every region/type filter match exact catalog IDs, including nearby Fisk huts');
    await page.getByRole('checkbox', { name: 'Скрыть вскрытые', exact: true }).check();
    await compareRows(page, catalog.filter(entry => entry.id !== scatty.entryId), 'hide opened');
    await page.getByRole('checkbox', { name: 'Скрыть вскрытые', exact: true }).uncheck();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await goCatalog(page); await noOverflow(page, `catalog ${width}`);
      if (width === 390) await screenshot(page, 'catalog-390.png', false);
      await chooseSolution(page, scatty); await noOverflow(page, `ready player ${width}`);
      await checkFullRoute(page, scatty); await noOverflow(page, `expanded commands ${width}`);
      if (width === 320) await screenshot(page, 'ready-320.png');
      await chooseSolution(page, universal); await player(page).getByText('Проверены все допустимые варианты связей', { exact: true }).click(); await noOverflow(page, `universal ${width}`);
      await chooseSolution(page, published); await noOverflow(page, `published ${width}`);
      await blankManual(page); await page.getByRole('combobox', { name: 'Количество пластин', exact: true }).selectOption('7');
      await noOverflow(page, `seven-plate editor ${width}`);
      if (width === 320) await screenshot(page, 'manual-320.png');
    }
    record('320/390/768 px layouts stay within the viewport for catalog, ready/published/universal routes and seven-plate editor');

    await goCatalog(page);
    assert.equal(mapRequests, 0, 'No map requests before explicit consent');
    assert.equal(await page.locator('iframe[title="Карта Колонии — TH.GL"]').count(), 0);
    await page.getByText('Карта всей Колонии · 386 сундуков + 16 подводных', { exact: true }).click();
    assert.equal(await page.locator('iframe[title="Карта Колонии — TH.GL"]').count(), 0);
    await page.getByRole('button', { name: 'Загрузить карту TH.GL', exact: true }).click();
    const map = page.locator('iframe[title="Карта Колонии — TH.GL"]');
    assert.equal(await map.getAttribute('loading'), 'lazy');
    assert.equal(await map.getAttribute('src'), 'https://gothic1remake.th.gl/ru/embed/maps/Khorinis');
    await map.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector('iframe[title="Карта Колонии — TH.GL"]') !== null);
    record('TH.GL map has no iframe or requests before opt-in and uses the documented lazy embed');

    const stale = await setupContext(browser, { viewport: { width: 390, height: 900 } });
    await stale.addInitScript(({ key, entryId, signature, origin }) => {
      if (location.origin !== origin) return;
      if (!sessionStorage.getItem('stale-seeded')) {
        localStorage.setItem(key, JSON.stringify({ skill: 'none', opened: [], recent: [entryId], changed: [], progress: { [entryId]: { signature, step: 1 } } }));
        sessionStorage.setItem('stale-seeded', 'true');
      }
    }, { key: STORAGE, entryId: scatty.entryId, signature: JSON.stringify({ config: scatty.config, skill: 'none' }), origin: base.origin });
    const outdated = await stale.newPage();
    await openEntry(outdated, scatty.entryId); await waitText(outdated, 'Состояние этого замка изменено');
    assert.equal(await player(outdated).count(), 0);
    assert.doesNotMatch(await mainText(outdated), /ШАГ 1 ИЗ/);
    await outdated.reload({ waitUntil: 'domcontentloaded' }); await waitText(outdated, 'Состояние этого замка изменено');
    assert.equal(await player(outdated).count(), 0);
    await outdated.getByRole('button', { name: 'Механизм возвращён к исходному состоянию', exact: true }).click();
    await checkStep(outdated, scatty, 0);
    await stale.close();
    record('A started pre-ready saved signature exposes a persistent state-confirmation gate rather than silently replaying step one');

    const migration = await setupContext(browser, { viewport: { width: 390, height: 900 } });
    const oldId = 'cavalorn-cave-unknown', canonicalId = aliases[oldId];
    assert.equal(canonicalId, 'cavalorn-storeroom-door');
    await migration.addInitScript(({ key, oldId, canonicalId, origin }) => {
      if (location.origin !== origin) return;
      if (!sessionStorage.getItem('migration-seeded')) {
        localStorage.setItem(key, JSON.stringify({ skill: 'none', opened: [oldId, canonicalId], recent: [oldId], changed: [oldId], progress: { [oldId]: { signature: 'obsolete-graph-signature', step: 4 } } }));
        sessionStorage.setItem('migration-seeded', 'true');
      }
    }, { key: STORAGE, oldId, canonicalId, origin: base.origin });
    const migrated = await migration.newPage();
    await openEntry(migrated, oldId); await waitText(migrated, 'Состояние этого замка изменено');
    assert.equal(await player(migrated).count(), 0);
    const migratedSaved = await readSaved(migrated);
    assert.deepEqual(migratedSaved.opened, [canonicalId]);
    assert.deepEqual(migratedSaved.recent, [canonicalId]);
    assert.deepEqual(migratedSaved.changed, [canonicalId]);
    assert.equal(migratedSaved.progress[oldId], undefined);
    assert.equal(migratedSaved.progress[canonicalId].step, 4);
    await migrated.getByRole('button', { name: 'Механизм возвращён к исходному состоянию', exact: true }).click();
    await checkStep(migrated, forSkill(canonicalId, 'none')[0], 0);
    assert.equal(await migrated.getByRole('button', { name: 'Уже вскрыт', exact: true }).getAttribute('aria-pressed'), 'true');
    await migration.close();
    record('Legacy Cavalorn hash/storage IDs migrate to one canonical door; opened/recent/changed state survives and stale progress does not play');

    await chooseSolution(page, scatty);
    await player(page).getByRole('button', { name: 'Начать заново', exact: true }).click();
    await player(page).getByRole('button', { name: 'Следующий шаг', exact: true }).click();
    await waitText(page, 'Доступно офлайн');
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await context.setOffline(true); await waitText(page, 'Без интернета');
    await page.reload({ waitUntil: 'domcontentloaded' }); await checkStep(page, scatty, 1);
    assert.equal(await page.evaluate(async () => { try { await fetch('/uncached-ready-browser-proof-' + Date.now(), { cache: 'no-store' }); return false; } catch { return true; } }), true);
    await player(page).getByRole('button', { name: 'Следующий шаг', exact: true }).click(); await checkStep(page, scatty, 2);
    await chooseSolution(page, universal); await checkStep(page, universal, 0);
    await chooseSolution(page, published); await checkStep(page, published, 0);
    const licenses = await context.newPage();
    await licenses.goto(new URL('/apps/gothic-locks-licenses.txt', base).href);
    const licenseText = await licenses.locator('body').innerText();
    assert.match(licenseText, /Permission is hereby granted/); assert.match(licenseText, /CC BY-NC-SA 4.0|creativecommons.org\/licenses\/by-nc-sa\/4.0/);
    await licenses.close();
    await blankManual(page); await confirmation(page).check(); await calculate(page).click();
    await waitText(page, 'Вся комбинация · 3 движений');
    assert.match(compact(await mainText(page)), /влево\s+3\s+раз/);
    await page.getByRole('button', { name: 'Готово, следующий шаг', exact: true }).click();
    await waitText(page, 'Все штифты в центре');
    await context.setOffline(false);
    record('Proven offline reload preserves ready progress; published/universal routes, cached licenses and manual worker calculation still work');

    assert.deepEqual(errors, [], 'No JavaScript exceptions in any browser context');
    const summary = { passed: results.length, skipped: skips, catalogCount: catalog.length, readyVariants: ready.length, readyObjects: readyIds.size, fiskVariants: fiskSolutions.length, results, errors, disclaimer: 'Mathematical and browser verification; no independent in-game validation.' };
    await fsp.writeFile(path.join(artifacts, 'result.json'), JSON.stringify(summary, null, 2));
    console.log(JSON.stringify({ passed: results.length, skipped: skips.length, errors: errors.length, artifacts }));
  } catch (error) {
    await page.screenshot({ path: path.join(artifacts, 'failure.png'), fullPage: true }).catch(() => {});
    await fsp.writeFile(path.join(artifacts, 'failure.json'), JSON.stringify({ passed: results.length, results, skips, errors, error: String(error), stack: error.stack, url: page.url() }, null, 2));
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
