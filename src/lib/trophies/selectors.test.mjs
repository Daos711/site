import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), ts = require('typescript'), cache = new Map();
function load(file) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  if (file.endsWith('.json')) { mod.exports = JSON.parse(fs.readFileSync(file, 'utf8')); return mod.exports; }
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  new Function('exports', 'require', 'module', output)(mod.exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name.endsWith('.json') ? name : name + '.ts')) : require(name), mod);
  return mod.exports;
}
const E = load(fileURLToPath(new URL('./events.ts', import.meta.url)));
const S = load(fileURLToPath(new URL('./selectors.ts', import.meta.url)));
const P = load(fileURLToPath(new URL('./preset.ts', import.meta.url)));
const { getGame } = load(fileURLToPath(new URL('./catalog.ts', import.meta.url)));
const game = getGame('gothic-remake'), deviceId = '11111111-1111-4111-8111-111111111111';
const item = id => { const found = game.items.find(item => item.id === id); assert.ok(found, id); return found; };
function append(events, input) { const event = E.createEvent(events, { gameId: game.id, runId: null, field: 'status', ...input }, { deviceId }); events.push(event); return event; }
function fromInputs(inputs) { const events = []; for (const input of inputs) append(events, input); return events; }
const options = extra => ({ query: '', category: '', chapter: '', status: '', spoilers: false, currentChapter: 1, statusFor: () => 'todo', ...extra });

test('an empty visitor has no preset, runs, observations or PSN awards', () => {
  assert.deepEqual(S.gameSummary([], game), { earned: 0, trophies: 41, percent: 0, lessons: 0, maps: 0 });
  assert.deepEqual(S.listRuns([], game.id), []); assert.deepEqual(S.customItems([], game.id), []);
});

test('personal preset records seven confirmed lessons, four named maps and five PSN awards', () => {
  const events = fromInputs(P.gothicPreset());
  assert.equal(S.gameSummary(events, game).lessons, 7); assert.equal(S.gameSummary(events, game).maps, 4);
  assert.equal(S.gameSummary(events, game).earned, 5);
  assert.equal(S.valueAt(events, game.id, 'first-playthrough', 'run', 'reportedLessons'), 7);
  assert.equal(S.valueAt(events, game.id, 'first-playthrough', 'run', 'reportedMaps'), 4);
  assert.deepEqual(new Set(S.listRuns(events, game.id)), new Set(['first-playthrough', 'permadeath-plan']));
  assert.equal(S.itemStatus(events, game.id, 'permadeath-plan', item('lesson-diving')), 'todo');
  assert.equal(S.valueAt(events, game.id, 'permadeath-plan', 'run', 'status'), 'planned');
});

test('save rollback changes only the active character while learning history and a second run survive', () => {
  const events = [];
  append(events, { entityId: 'lesson-diving', field: 'observed', value: true });
  append(events, { runId: 'first', entityId: 'lesson-diving', value: 'done' });
  append(events, { runId: 'second', entityId: 'lesson-diving', value: 'done' });
  append(events, { runId: 'first', entityId: 'lesson-diving', value: 'todo' });
  assert.equal(S.itemStatus(events, game.id, 'first', item('lesson-diving')), 'todo');
  assert.equal(S.itemStatus(events, game.id, 'second', item('lesson-diving')), 'done');
  assert.equal(S.learnedCount(events, game, 'lessons'), 1);
  assert.equal(S.gameSummary(events, game).earned, 0);
});

test('all lesson/map observations, counter targets and completed run challenges never award PSN automatically', () => {
  const events = [];
  for (const entry of game.items) {
    if (entry.category === 'lessons' || entry.category === 'maps') append(events, { entityId: entry.id, field: 'observed', value: true });
    if (entry.scope === 'run') append(events, { runId: 'first', entityId: entry.id, value: 'done' });
    if (entry.category === 'counters') append(events, { entityId: entry.id, field: 'count', kind: 'increment', value: entry.target });
  }
  const summary = S.gameSummary(events, game);
  assert.equal(summary.lessons, 46); assert.equal(summary.maps, 12); assert.equal(summary.earned, 0);
  append(events, { runId: 'first', entityId: 'trophy-overachiever', value: 'done' });
  assert.equal(S.gameSummary(events, game).earned, 0, 'a character-scoped field is not a PSN confirmation');
  append(events, { entityId: 'trophy-overachiever', value: 'done' });
  assert.equal(S.gameSummary(events, game).earned, 1);
  assert.equal(S.itemStatus(events, game.id, 'second', item('trophy-overachiever')), 'done');
});

test('unresolved status and observation conflicts remain unconfirmed instead of choosing a device', () => {
  const base = [], address = { entityId: 'lesson-diving', runId: 'first' };
  const done = append(base, { ...address, value: 'done' });
  const todo = E.createEvent([], { gameId: game.id, ...address, field: 'status', value: 'todo' }, { deviceId });
  const observed = E.createEvent([], { gameId: game.id, runId: null, entityId: address.entityId, field: 'observed', value: true }, { deviceId });
  const unobserved = E.createEvent([], { gameId: game.id, runId: null, entityId: address.entityId, field: 'observed', value: false }, { deviceId });
  const events = [todo, done, observed, unobserved];
  assert.equal(S.itemStatus(events, game.id, 'first', item(address.entityId)), 'verify');
  assert.equal(S.learnedCount(events, game, 'lessons'), 0);
  append(events, { entityId: address.entityId, field: 'observed', value: true });
  assert.equal(S.learnedCount(events, game, 'lessons'), 1);
});

test('future chapter names cannot be found by search until spoilers are enabled or the chapter is reached', () => {
  const future = item('lesson-orc-weapons-master');
  assert.deepEqual(S.filterItems([future], options({ query: future.name })), []);
  assert.deepEqual(S.filterItems([future], options({ query: future.originalName || future.name })), []);
  assert.equal(S.filterItems([future], options({ query: future.name, spoilers: true })).length, 1);
  assert.equal(S.filterItems([future], options({ query: future.name, currentChapter: future.chapter })).length, 1);
  const recommended = { ...future, chapter: null, spoilerChapter: 4 };
  assert.deepEqual(S.filterItems([recommended], options()), []);
  assert.equal(S.filterItems([recommended], options({ currentChapter: 4 })).length, 1);
});

test('filters compose and Russian ё/е search finds a teacher without dropping status or category restrictions', () => {
  const example = { ...item('lesson-diving'), name: 'Полёт', teacher: 'Учитель Семён', location: 'Башня', confidence: 'check', missable: 'yes' };
  assert.equal(S.filterItems([example], options({ query: 'полет семен', category: 'lessons', chapter: '1', status: 'verify', statusFor: () => 'verify' })).length, 1);
  assert.equal(S.filterItems([example], options({ query: 'полет семен', category: 'maps' })).length, 0);
  assert.equal(S.filterItems([example], options({ status: 'done' })).length, 0);
  assert.equal(S.filterItems([example], options({ status: 'check' })).length, 1);
});

test('chapter warnings exclude future, expired and current-run completed items, not another run completion', () => {
  const template = item('camp-choice-backup');
  const items = [
    { ...template, id: 'due', chapter: 1 }, { ...template, id: 'future', chapter: 3 },
    { ...template, id: 'expired', chapter: 1, lastChapter: 1 }, { ...template, id: 'done-here', chapter: 1 },
    { ...template, id: 'done-elsewhere', chapter: 1 }, { ...template, id: 'unknown-chapter', chapter: null },
    { ...template, id: 'psn', chapter: 1, scope: 'psn' }, { ...template, id: 'not-missable', chapter: 1, missable: 'no' },
  ];
  const events = [];
  append(events, { runId: 'first', entityId: 'done-here', value: 'done' });
  append(events, { runId: 'second', entityId: 'done-elsewhere', value: 'done' });
  assert.deepEqual(new Set(S.chapterWarnings(events, { ...game, items }, 'first', 2).map(item => item.id)), new Set(['due', 'done-elsewhere']));
});

test('custom definitions belong to the game; completion and notes remain specific to each run', () => {
  const events = [];
  append(events, { entityId: 'custom-quest', field: 'definition', value: { name: 'Мой маршрут', description: 'Проверить берег', chapter: 1, missable: 'yes' } });
  append(events, { gameId: 'another-game', entityId: 'custom-foreign', field: 'definition', value: { name: 'Чужой пункт' } });
  append(events, { runId: 'first', entityId: 'custom-quest', value: 'done' });
  append(events, { runId: 'first', entityId: 'custom-quest', field: 'note', value: 'Первая ветка' });
  append(events, { runId: 'second', entityId: 'custom-quest', field: 'note', value: 'Другая ветка' });
  append(events, { runId: 'first', entityId: 'journal', field: 'text', value: 'План первого прохождения' });
  const [custom] = S.customItems(events, game.id);
  assert.equal(S.customItems(events, game.id).length, 1); assert.equal(custom.scope, 'run');
  assert.equal(S.itemStatus(events, game.id, 'first', custom), 'done');
  assert.equal(S.itemStatus(events, game.id, 'second', custom), 'todo');
  assert.equal(S.valueAt(events, game.id, 'first', custom.id, 'note'), 'Первая ветка');
  assert.equal(S.valueAt(events, game.id, 'second', custom.id, 'note'), 'Другая ветка');
  assert.equal(S.valueAt(events, game.id, 'second', 'journal', 'text'), undefined);
  assert.ok(S.chapterWarnings(events, game, 'second', 1).some(item => item.id === custom.id));
  assert.ok(!S.chapterWarnings(events, game, 'first', 1).some(item => item.id === custom.id));
});

test('archiving a run hides its selector entry without erasing its notes or progress', () => {
  const events = fromInputs(P.runInputs(game.id, 'archived', 'Старая ветка'));
  append(events, { runId: 'archived', entityId: 'lesson-diving', value: 'done' });
  append(events, { runId: 'archived', entityId: 'run', field: 'archived', value: true });
  assert.deepEqual(S.listRuns(events, game.id), []);
  assert.equal(S.itemStatus(events, game.id, 'archived', item('lesson-diving')), 'done');
});
