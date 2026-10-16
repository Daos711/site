/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS acceptance harness with a selectable local Playwright runtime. */
/* Optional production-browser acceptance test. Serve out/ at GOTHIC_TEST_URL.
 * PLAYWRIGHT_MODULE and CHROMIUM_PATH may point at an existing local runtime.
 * These are mathematical/browser checks, not evidence of an in-game PS5 run. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const repo = process.env.GOTHIC_REPO || path.resolve(__dirname, '..');
const ts = require(path.join(repo, 'node_modules/typescript'));
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = new URL(process.env.GOTHIC_TEST_URL || 'http://127.0.0.1:8765/apps/gothic-locks');
base.hash = ''; base.search = '';
const artifacts = process.env.GOTHIC_TEST_OUTPUT || path.resolve('work/colony-complete/browser-focused');
const STORAGE = 'lab.gothic-locks.v1';
const skills = { none: 'Без навыка', trained: 'Обучен', master: 'Мастер' };
const results = [], errors = [];
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
const lib = path.join(repo, 'src/lib/gothic-locks');
const { LOCK_CATALOG: catalog, CATALOG_ALIASES: aliases } = loadTs(path.join(lib, 'catalog.ts'));
const { READY_SOLUTIONS: ready, solutionSignature } = loadTs(path.join(lib, 'ready-solutions.ts'));
const rawReady = JSON.parse(fs.readFileSync(path.join(lib, 'data/ready-solutions.json'), 'utf8'));
const catalogById = new Map(catalog.map(entry => [entry.id, entry]));
const forSkill = (entryId, skill) => ready.filter(solution => solution.entryId === entryId && solution.skill === skill);
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
function watch(page) { page.on('pageerror', error => errors.push({ url: page.url(), message: error.message })); }
async function setupContext(browser, options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'allow', permissions: ['clipboard-read', 'clipboard-write'], ...options });
  context.on('page', watch);
  await context.route(/https:\/\/(cdn\.jsdelivr\.net|www\.googletagmanager\.com)\//, route => route.abort());
  await context.route('https://gothic1remake.th.gl/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Lazy map test placeholder</title>' }));
  return context;
}

(async () => {
  await fsp.mkdir(artifacts, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await setupContext(browser);
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const metrics = {};
  try {
    assert.equal(ready.length, rawReady.length);
    const swResponse=await context.request.get(new URL('/apps/gothic-locks-sw.js',base).href);
    metrics.cacheVersion=(await swResponse.text()).match(/const CACHE_VERSION = "([^"]+)"/)?.[1]||null;
    await goCatalog(page);
    await waitText(page, 'Доступно офлайн');
    await compareRows(page,catalog,'live build has exact catalog');
    assert.ok((await page.getByTestId('catalog-coverage').innerText()).includes(`${catalog.length} карточек`));
    metrics.catalog = { objects: catalog.length, variants: ready.length };
    const campNames={old:'Старый лагерь',new:'Новый лагерь',swamp:'Болотный лагерь'};
    metrics.campTiles=[];
    for(const [camp,name] of Object.entries(campNames)){
      const entries=catalog.filter(e=>e.camp===camp);
      const chests=entries.filter(e=>e.type==='chest'||e.type==='underwater').length;
      const tile=page.getByRole('button').filter({has:page.getByRole('heading',{name,exact:true,level:2})});
      assert.equal(await tile.count(),1);
      assert.ok((await tile.innerText()).includes(`Объектов: ${entries.length} · сундуков: ${chests}`),`${name}: objects and chests must be distinguished`);
      await tile.click();
      await compareRows(page,entries,`camp ${camp} filter contains exact distinct IDs`);
      await page.getByRole('button',{name:'Все лагеря',exact:true}).click();
      metrics.campTiles.push({camp,objects:entries.length,chests});
    }
    for(const width of [320,390]){
      await page.setViewportSize({width,height:900});
      await noOverflow(page,`catalog tiles ${width}`);
      await page.getByRole('button').filter({has:page.getByRole('heading',{name:'Старый лагерь',exact:true,level:2})}).scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(artifacts,`camp-tiles-${width}.png`),fullPage:false});
    }
    await page.setViewportSize({width:1440,height:1100});
    record('Camp tiles distinguish all objects from chests, filter exact IDs and fit mobile screens');
    const hutId='old-camp-abandoned-shack-chest';
    const search=page.getByRole('textbox',{name:'Поиск сундука или персонажа',exact:true});
    const queries=['сундук в подвале заброшенной хижины','725516','7 2 5 5 1 6'];
    metrics.search={};
    for (const query of queries) {
      await search.fill(query);
      await page.locator(`[data-lock-id="${hutId}"]`).waitFor();
      metrics.search[query]=await page.locator('[data-lock-id]').evaluateAll(rows=>rows.map(row=>row.dataset.lockId));
    }
    record('Natural Russian phrase and compact/spaced fingerprints find the abandoned shack');
    const hut=forSkill(hutId,'trained').find(s=>s.moves.length===26&&groupMoves(s.moves).length===21);
    assert.ok(hut,'Expected trained 26 atomic / 21 grouped route');
    await chooseSolution(page,hut);
    await checkStep(page,hut,0);
    assert.match(await page.getByTestId('initial-fingerprint').innerText(),/7–2–5–5–1–6/);
    await checkFullRoute(page,hut);
    await player(page).getByRole('button',{name:'Следующий шаг',exact:true}).click();
    await checkStep(page,hut,1);
    await page.reload({waitUntil:'domcontentloaded'});
    await checkStep(page,hut,1);
    assert.equal((await readSaved(page)).progress[hutId].signature,solutionSignature(hut));
    assert.equal((await readSaved(page)).progress[hutId].step,1);
    record('Trained shack route: 26 atomic / 21 grouped steps, physical directions and reload persistence');
    const universal=ready.find(s=>s.skill==='trained'&&s.config===null&&s.modelCoverage?.fullModelCount>100);
    assert.ok(universal);
    await chooseSolution(page,universal);
    const proof=player(page).locator('details').filter({has:page.getByText('Проверены все допустимые варианты связей',{exact:true})});
    await proof.locator('summary').click();
    const proofText=compact(await proof.innerText());
    assert.ok(proofText.includes(String(universal.modelCoverage.fullModelCount)));
    assert.ok(proofText.includes(String(universal.modelCoverage.witnessCount)));
    assert.ok(proofText.includes('Это математическое покрытие, а не выбор наиболее вероятной схемы'));
    assert.equal(await page.getByText('Исходное состояние и направленные связи',{exact:true}).count(),0);
    metrics.hut={solutionId:hut.id,atomic:hut.moves.length,groups:groupMoves(hut.moves).length,configUnique:!!hut.config};
    metrics.universal={solutionId:universal.id,coverage:universal.modelCoverage,proofText};
    await screenshot(page,'column-proof-desktop.png');
    record('Column coverage proof explains all compatible models and shows no invented unique matrix');
    await chooseSolution(page,hut);
    await checkStep(page,hut,1);
    for(const width of [320,390]) {
      await page.setViewportSize({width,height:900});
      await noOverflow(page,`hut ${width}`);
      await screenshot(page,`hut-${width}.png`);
    }
    record('Shack mobile layouts at 320 and 390 pixels have no horizontal overflow');
    await player(page).getByRole('button',{name:'Положения изменились / пересчитать решение',exact:true}).click();
    await page.getByRole('heading',{name:'Фактическое состояние замка',exact:true}).waitFor();
    assert.equal(await player(page).count(),0);
    assert.ok((await readSaved(page)).changed.includes(hutId));
    await page.getByRole('combobox',{name:'Количество пластин',exact:true}).selectOption('4');
    for(let plate=1;plate<=4;plate++)await pin(page,plate,plate===1?1:4).click();
    const links=page.getByRole('combobox',{name:/^Связь из пластины/});
    for(let i=0;i<await links.count();i++)await links.nth(i).selectOption('0');
    await confirmation(page).check();
    await calculate(page).click();
    await waitText(page,'Вся комбинация · 3 движений');
    assert.equal(await player(page).count(),0);
    await openEntry(page,hutId);
    await waitText(page,'Состояние этого замка изменено');
    assert.equal(await player(page).count(),0);
    await page.getByRole('button',{name:'Механизм возвращён к исходному состоянию',exact:true}).click();
    await checkStep(page,hut,0);
    record('Changed shack state blocks old route and calculates a fresh three-move independent state');
    const land=ready.find(s=>s.source.url.startsWith('https://landofgames.ru/'));
    assert.ok(land&&land.verification==='published'&&land.config===null);
    await chooseSolution(page,land);
    const credit=page.getByTestId('land-attribution');
    await credit.waitFor();
    const sourceLink=credit.getByRole('link',{name:'Land of Games',exact:true});
    assert.equal(await sourceLink.getAttribute('href'),land.source.url);
    assert.ok(land.source.url.includes('#:~:text='));
    assert.doesNotMatch(await sourceLink.getAttribute('rel')||'',/nofollow|sponsored|ugc/);
    assert.ok((await credit.innerText()).includes('Zorthrus'));
    await waitText(page,'Решение не подтверждено симуляцией');
    const scope=player(page);
    assert.equal(await scope.getByText('Проверено расчётом',{exact:true}).count(),0);
    await checkFullRoute(page,land);
    metrics.land={solutionId:land.id,source:land.source,viewports:[]};
    for(const width of [320,390]) {
      await page.setViewportSize({width,height:900});
      await noOverflow(page,`Land of Games ${width}`);
      const fonts=await scope.evaluate(el=>({
        credit:parseFloat(getComputedStyle(el.querySelector('[data-testid="land-attribution"] a')).fontSize),
        command:[...el.querySelectorAll('[aria-live="polite"], [aria-live="polite"] *, ol li, ol li *')].filter(n=>n.textContent.trim()).map(n=>({tag:n.tagName,text:n.textContent.trim().slice(0,60),font:parseFloat(getComputedStyle(n).fontSize)}))
      }));
      assert.ok(fonts.credit>=Math.max(...fonts.command.map(n=>n.font)),JSON.stringify(fonts));
      metrics.land.viewports.push({width,...fonts});
      await screenshot(page,`land-${width}.png`);
    }
    record('Land attribution has an indexable section link, author, published status and font no smaller than all command text');
    const keyEntry=catalog.find(e=>e.access==='key');
    assert.ok(keyEntry,'At least one key-only object');
    await goCatalog(page);
    await page.getByRole('combobox',{name:'Полнота данных',exact:true}).selectOption('not-required');
    const noPick=catalog.filter(e=>e.access==='key'||e.access==='unlocked');
    await compareRows(page,noPick,'key/unlocked objects form the exact not-required category');
    await openEntry(page,keyEntry.id);
    await page.getByRole('heading',{name:'Открывается ключом',exact:true}).waitFor();
    assert.equal(await player(page).count(),0);
    assert.equal(await page.getByRole('heading',{name:'Нет подтверждённого решения',exact:true}).count(),0);
    metrics.notRequired={count:noPick.length,keyObject:keyEntry.id};
    await screenshot(page,'key-object-390.png');
    record('Key-only object has an explicit access notice and is excluded from missing-solution coverage');
    const oldId='new-camp-peasant-upstairs-grate',canonicalId='new-camp-peasant-housing-door';
    assert.equal(aliases[oldId],canonicalId);
    const aliasReady=forSkill(canonicalId,'none')[0];
    assert.ok(aliasReady);
    const aliasContext=await setupContext(browser,{viewport:{width:390,height:900}});
    const aliasPage=await aliasContext.newPage();
    await aliasPage.addInitScript(({key,oldId,canonicalId,signature})=>{
      if(!localStorage.getItem('focused-alias-seeded')){
        localStorage.setItem(key,JSON.stringify({skill:'none',opened:[oldId,canonicalId],recent:[oldId,canonicalId],changed:[],progress:{[oldId]:{signature,step:1}}}));
        localStorage.setItem('focused-alias-seeded','1');
      }
    },{key:STORAGE,oldId,canonicalId,signature:solutionSignature(aliasReady)});
    await openEntry(aliasPage,oldId);
    await aliasPage.getByRole('button',{name:'Уже вскрыт',exact:true}).waitFor();
    await checkStep(aliasPage,aliasReady,1);
    const migrated=await readSaved(aliasPage);
    for(const key of ['opened','recent','changed'])assert.ok(!migrated[key].includes(oldId));
    assert.equal(migrated.opened.filter(id=>id===canonicalId).length,1);
    assert.equal(migrated.recent.filter(id=>id===canonicalId).length,1);
    assert.equal(migrated.progress[oldId],undefined);
    assert.equal(migrated.progress[canonicalId].step,1);
    metrics.alias={url:aliasPage.url(),saved:migrated};
    await screenshot(aliasPage,'peasant-alias-390.png');
    await aliasContext.close();
    record('Peasant upstairs alias migrates opened/recent/progress to canonical housing-door ID without duplicates');
    assert.deepEqual(errors,[]);
    record('Zero browser JavaScript errors');
    await fsp.writeFile(path.join(artifacts,'results.json'),JSON.stringify({status:'passed',base:base.href,tests:results,errors,metrics},null,2));
    console.log(JSON.stringify({status:'passed',tests:results.length,objects:catalog.length,variants:ready.length,artifacts}));
  }catch(error){
    await screenshot(page,'failure.png').catch(()=>{});
    await fsp.writeFile(path.join(artifacts,'failure.txt'),String(error.stack)+'\n\n'+await page.locator('body').innerText().catch(()=>''));
    await fsp.writeFile(path.join(artifacts,'results.json'),JSON.stringify({status:'failed',tests:results,errors,error:String(error.stack),metrics},null,2));
    throw error;
  }finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
