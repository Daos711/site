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
const { GAME_CATALOGS, getGame } = load(fileURLToPath(new URL('./catalog.ts', import.meta.url)));
const { gothicPreset, PRESET_LESSONS } = load(fileURLToPath(new URL('./preset.ts', import.meta.url)));
const game = getGame('gothic-remake');
const category = name => game.items.filter(item => item.category === name);
const byId = id => { const item = game.items.find(item => item.id === id); assert.ok(item, id); return item; };

test('registry has the real PS5 catalogue and 41 unique trophies with the published ranks', () => {
  assert.equal(GAME_CATALOGS.length, 1); assert.equal(getGame('missing-game'), undefined);
  assert.equal(game.platform, 'PlayStation 5');
  assert.equal(category('trophies').length, 41);
  assert.deepEqual(category('trophies').reduce((counts, item) => ({ ...counts, [item.grade]: (counts[item.grade] || 0) + 1 }), {}), { platinum: 1, silver: 20, gold: 2, bronze: 18 });
  assert.ok(category('trophies').every(item => item.scope === 'psn'));
  assert.equal(byId('trophy-no-time-to-die').grade, 'gold');
  assert.match(byId('trophy-no-time-to-die').description, /перманентн/);
  assert.match(byId('trophy-insomnia-champion').description, /не поспав/);
});

test('all 140 researched items retain usable conditions, source links and uncertainty fields', () => {
  assert.equal(game.items.length, 140);
  assert.equal(new Set(game.items.map(item => item.id)).size, 140);
  const categories = new Set(game.categories.map(category => category.id));
  for (const item of game.items) {
    assert.match(item.id, /^[a-z0-9-]+$/, item.id);
    assert.ok(item.name.trim() && item.description.trim() && item.conditions.trim(), item.id);
    assert.ok(categories.has(item.category), item.id);
    assert.ok(['yes', 'no', 'unknown'].includes(item.missable), item.id);
    assert.ok(['documented', 'reported', 'check'].includes(item.confidence), item.id);
    assert.ok(item.chapter === null || game.chapters.includes(item.chapter), item.id);
    assert.ok(item.gameVersion === null || typeof item.gameVersion === 'string', item.id);
    assert.ok(item.sources.length, item.id);
    assert.equal(new Set(item.sources.map(source => source.url)).size, item.sources.length, item.id);
    for (const source of item.sources) { assert.ok(source.name.trim(), item.id); assert.equal(new URL(source.url).protocol, 'https:', item.id); }
    if (item.steps) assert.equal(new Set(item.steps.map(step => step.id)).size, item.steps.length, item.id);
  }
});

test('46 lessons exclude attribute training, novice circle zero and a duplicate scutes upgrade', () => {
  assert.equal(game.lessonTarget, 46); assert.equal(category('lessons').length, 46);
  const lessonIds = category('lessons').map(item => item.id);
  assert.ok(!lessonIds.some(id => /strength|dexterity|mana|novice|circle-0|scutes-upgrade|scutes-master/.test(id)));
  assert.equal(lessonIds.filter(id => id.includes('take-scutes')).length, 1);
  assert.equal(lessonIds.filter(id => id.startsWith('lesson-magic-circle-')).length, 6);
  for (const skill of ['one-handed', 'two-handed', 'bow', 'crossbow', 'fists', 'orc-weapons', 'lockpicking', 'pickpocketing', 'orcish']) {
    for (const level of ['trained', 'master']) assert.equal(byId(`lesson-${skill}-${level}`).category, 'lessons');
  }
  assert.ok(category('lessons').every(item => item.scope === 'run'));
  assert.match(byId('lesson-inscription').teacher, /Кадар/);
  assert.match(byId('lesson-extract-secretion').teacher, /Кор Ангар/);
});

test('12 different maps include both Old Mine routes without claiming a known PS5 trophy threshold', () => {
  assert.equal(category('maps').length, 12); assert.equal(game.mapTarget, null);
  const old = byId('map-old-mine-old-camp'), swamp = byId('map-old-mine-swamp-camp');
  assert.notEqual(old.id, swamp.id); assert.notEqual(old.name, swamp.name);
  assert.match(swamp.conditions, /Фортуно/); assert.match(game.mapTargetNote, /12/);
  assert.ok(category('maps').every(item => item.scope === 'run'));
});

test('book possession, delivery and completion are separate; recommended chapters remain uncertain', () => {
  assert.equal(category('collectibles').length, 11);
  for (let index = 1; index <= 5; index++) assert.deepEqual(byId(`bestiary-${index}`).steps.map(step => step.id), ['found', 'delivered', 'quest-completed']);
  for (let index = 1; index <= 6; index++) {
    const book = byId(`chromanin-${index}`);
    assert.equal(book.chapter, null); assert.deepEqual(book.steps.map(step => step.id), ['found', 'read']);
  }
  assert.match(byId('bestiary-5').conditions, /снежного мракориса/);
});

test('explicit personal preset identifies five lessons and one map, preserves unknown counts and claims only the known PSN trophy', () => {
  assert.deepEqual(PRESET_LESSONS, ['lesson-diving', 'lesson-lockpicking-trained', 'lesson-acrobatics', 'lesson-inscription', 'lesson-scavenger-riding']);
  const inputs = gothicPreset();
  for (const input of inputs) if (!['run', 'journal'].includes(input.entityId)) byId(input.entityId);
  const observed = inputs.filter(input => input.field === 'observed' && input.value === true);
  assert.deepEqual(new Set(observed.map(input => input.entityId)), new Set([...PRESET_LESSONS, 'map-swamp-camp']));
  assert.ok(observed.every(input => input.runId === null));
  assert.equal(inputs.find(input => input.field === 'reportedLessons').value, 6);
  assert.equal(inputs.find(input => input.field === 'reportedMaps').value, 3);
  const awards = inputs.filter(input => input.entityId.startsWith('trophy-'));
  assert.deepEqual(awards.map(input => [input.entityId, input.runId, input.field, input.value]), [['trophy-swamp-camp', null, 'status', 'done']]);
  assert.ok(!inputs.some(input => input.runId === 'permadeath-plan' && input.entityId !== 'run'));
  assert.equal(inputs.find(input => input.runId === 'permadeath-plan' && input.field === 'status').value, 'planned');
});
