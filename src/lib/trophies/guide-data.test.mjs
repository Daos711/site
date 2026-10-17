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
const R = load(fileURLToPath(new URL('./routes.ts', import.meta.url)));
const S = load(fileURLToPath(new URL('./selectors.ts', import.meta.url)));
const P = load(fileURLToPath(new URL('./preset.ts', import.meta.url)));
const { getGame } = load(fileURLToPath(new URL('./catalog.ts', import.meta.url)));
const { getGuide } = load(fileURLToPath(new URL('./guides.ts', import.meta.url)));
const game = getGame('gothic-remake'), definition = getGuide(game.id), deviceId = '11111111-1111-4111-8111-111111111111';
const node = id => { const found = definition.nodes.find(node => node.id === id); assert.ok(found, id); return found; };
function add(events, input) {
  const event = E.createEvent(events, { gameId: game.id, runId: 'first-playthrough', field: 'status', ...input }, { deviceId });
  events.push(event); return event;
}
function evaluate(events, extra = {}) { return R.evaluateRoute({ game, definition, events, runId: 'first-playthrough', chapter: 1, location: 'new-camp', spoilers: false, ...extra }); }
function status(events, id, extra) { return evaluate(events, extra).all.find(step => step.node.id === id).status; }
function preset() { const events = []; for (const input of P.gothicPreset()) add(events, input); return events; }

test('real guide validates and covers every run item once, with sourced dependencies and uncertainty counts', () => {
  assert.deepEqual(R.validateRoute(definition, game), []); assert.equal(getGuide('missing-game'), undefined);
  assert.equal(definition.nodes.length, 91); assert.equal(definition.locations.length, 23);
  const linked = definition.nodes.filter(node => node.itemId);
  assert.equal(linked.length, 88);
  assert.deepEqual(new Set(linked.map(node => node.itemId)), new Set(game.items.filter(item => item.scope === 'run').map(item => item.id)));
  assert.equal(definition.nodes.reduce((sum, node) => sum + node.requires.length, 0), 19);
  assert.equal(definition.nodes.flatMap(node => node.conditions || []).filter(rule => rule.entityId && rule.field.startsWith('stage:')).length, 10);
  assert.equal(definition.nodes.filter(node => node.verified).length, 68);
  assert.equal(definition.nodes.filter(node => !node.verified).length, 23);
  for (const n of definition.nodes) {
    assert.ok(n.sources.length, n.id); assert.ok(n.instruction.trim(), n.id);
    for (const source of n.sources) { assert.ok(source.name.trim(), n.id); assert.equal(new URL(source.url).protocol, 'https:', n.id); }
    for (const rule of [...n.conditions || [], ...n.blockers || []]) if (rule.entityId) assert.ok(game.items.some(item => item.id === rule.entityId), `${n.id}: ${rule.entityId}`);
  }
  for (const id of ['new-camp-the-raid', 'join-new-camp', 'join-old-camp', 'join-swamp-camp']) assert.equal(node(id).transition, true, id);
  assert.equal(node('camp-choice-backup').transition, false);
  for (let circle = 1; circle <= 5; circle++) assert.equal(node(`lesson-magic-circle-${circle}`).chapter, null);
});

test('lesson instructions do not repeat the same purchase or prerequisite sentence', () => {
  const purchase = 'Оплатить урок у одного из учителей.';
  for (const id of ['lesson-one-handed-trained', 'lesson-one-handed-master']) assert.equal(node(id).instruction.split(purchase).length - 1, 1);
  assert.equal(node('lesson-one-handed-master').instruction.split('Сначала освоить предыдущую ступень.').length - 1, 1);
  for (const n of definition.nodes) {
    const sentences = n.instruction.match(/[^.!?]+[.!?]|[^.!?]+$/gu).map(s => s.trim().toLocaleLowerCase('ru'));
    assert.equal(new Set(sentences).size, sentences.length, n.id);
  }
});

test('confirmed initial facts recommend backup, then raid, then separate confirmation of joining New Camp', () => {
  const events = preset();
  add(events, { entityId: 'run', field: 'campMembership', value: 'none' });
  add(events, { entityId: 'run', field: 'raidReady', value: true });
  assert.equal(evaluate(events).next.node.id, 'camp-choice-backup');
  add(events, { entityId: 'camp-choice-backup', value: 'done' });
  assert.equal(evaluate(events).next.node.id, 'new-camp-the-raid');
  add(events, { entityId: 'new-camp-the-raid', value: 'done' });
  assert.equal(evaluate(events).next.node.id, 'join-new-camp');
  assert.equal(S.gameSummary(events, game).earned, 5, 'route completion must not grant another PSN trophy');
  assert.match(node('new-camp-the-raid').instruction, /ДО итогового разговора/);
});

test('unknown or negative readiness never forces the raid and the personal preset does not invent readiness', () => {
  const events = preset();
  assert.equal(S.valueAt(events, game.id, 'first-playthrough', 'run', 'raidReady'), undefined);
  add(events, { entityId: 'camp-choice-backup', value: 'done' });
  add(events, { entityId: 'run', field: 'campMembership', value: 'none' });
  assert.equal(status(events, 'new-camp-the-raid'), 'check');
  assert.notEqual(evaluate(events).next?.node.id, 'new-camp-the-raid');
  add(events, { entityId: 'run', field: 'raidReady', value: false });
  assert.equal(status(events, 'new-camp-the-raid'), 'blocked');
  assert.notEqual(evaluate(events).next?.node.id, 'new-camp-the-raid');
});

test('Chromanin requires reading the previous book in this run, not finding it or recording global history', () => {
  const events = [], view = { chapter: 4, spoilers: true };
  add(events, { entityId: 'chromanin-1', value: 'done' });
  add(events, { entityId: 'chromanin-1', field: 'stage:found', value: true });
  add(events, { runId: null, entityId: 'chromanin-1', field: 'stage:read', value: true });
  assert.equal(status(events, 'chromanin-2', view), 'check');
  add(events, { entityId: 'chromanin-1', field: 'stage:read', value: false });
  assert.equal(status(events, 'chromanin-2', view), 'blocked');
  add(events, { entityId: 'chromanin-1', field: 'stage:read', value: true });
  assert.equal(status(events, 'chromanin-2', view), 'available');
  assert.equal(status(events, 'chromanin-2', { ...view, runId: 'second-playthrough' }), 'check');
});

test('conflicting reading observations do not unlock a later Chromanin book', () => {
  const address = { gameId: game.id, runId: 'first-playthrough', entityId: 'chromanin-1', field: 'stage:read' };
  const yes = E.createEvent([], { ...address, value: true }, { deviceId });
  const no = E.createEvent([], { ...address, value: false }, { deviceId });
  assert.equal(status([yes, no], 'chromanin-2', { chapter: 4, spoilers: true }), 'check');
});

test('Bestiary teaching precedes its hunting completion without erasing unresolved source uncertainty', () => {
  const events = [], view = { chapter: 3, spoilers: true };
  assert.equal(status(events, 'bestiary-3', view), 'check');
  add(events, { entityId: 'bestiary-3', field: 'stage:delivered', value: true });
  const scutes = evaluate(events, view).all.find(step => step.node.id === 'lesson-take-scutes');
  assert.equal(scutes.status, 'check', 'delivery does not turn an unverified guide entry into a verified one');
  assert.ok(!scutes.reasons.includes(node('lesson-take-scutes').conditions[0].label), 'the delivered-book prerequisite itself is satisfied');
  add(events, { entityId: 'lesson-take-scutes', value: 'done' });
  assert.equal(status(events, 'bestiary-3', view), 'check');
  assert.equal(S.valueAt(events, game.id, 'first-playthrough', 'bestiary-3', 'stage:quest-completed'), undefined);
  assert.equal(status(events, 'bestiary-4', view), 'blocked');
  add(events, { entityId: 'bestiary-4', field: 'stage:delivered', value: true });
  assert.equal(status(events, 'bestiary-4', view), 'blocked');
  add(events, { entityId: 'lesson-take-shark-skin', value: 'done' });
  assert.equal(status(events, 'bestiary-4', view), 'available');
});

test('a recorded camp choice blocks other joins and the raid even when the editable profile is stale', () => {
  const events = [];
  add(events, { entityId: 'run', field: 'campMembership', value: 'none' });
  add(events, { entityId: 'run', field: 'raidReady', value: true });
  add(events, { entityId: 'route:join-old-camp', value: 'done' });
  for (const id of ['new-camp-the-raid', 'join-new-camp', 'join-swamp-camp']) assert.equal(status(events, id), 'unavailable', id);
  assert.equal(status(events, 'join-old-camp'), 'done');
  add(events, { entityId: 'route:join-old-camp', value: 'todo' });
  assert.equal(status(events, 'new-camp-the-raid'), 'available');
  add(events, { entityId: 'run', field: 'campMembership', value: 'swamp' });
  assert.equal(status(events, 'new-camp-the-raid'), 'unavailable');
  assert.equal(status(events, 'join-old-camp'), 'unavailable');
});

test('a disputed camp choice requires verification instead of recommending a potentially incompatible raid', () => {
  const events = [];
  add(events, { entityId: 'run', field: 'campMembership', value: 'none' });
  add(events, { entityId: 'run', field: 'raidReady', value: true });
  const address = { gameId: game.id, runId: 'first-playthrough', entityId: 'route:join-old-camp', field: 'status' };
  events.push(E.createEvent([], { ...address, value: 'done' }, { deviceId }), E.createEvent([], { ...address, value: 'todo' }, { deviceId }));
  assert.equal(status(events, 'join-old-camp'), 'check');
  assert.equal(status(events, 'new-camp-the-raid'), 'check');
  assert.notEqual(evaluate(events).next?.node.id, 'new-camp-the-raid');
});

test('a previous lesson in another run or global history does not satisfy the active character prerequisite', () => {
  const events = [];
  add(events, { runId: null, entityId: 'lesson-lockpicking-trained', field: 'observed', value: true });
  add(events, { runId: 'second-playthrough', entityId: 'lesson-lockpicking-trained', value: 'done' });
  assert.equal(status(events, 'lesson-lockpicking-master'), 'blocked');
  add(events, { entityId: 'lesson-lockpicking-trained', value: 'done' });
  assert.equal(status(events, 'lesson-lockpicking-master'), 'available');
});
