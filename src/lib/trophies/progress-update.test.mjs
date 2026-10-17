import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url), ts = require('typescript'), cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} }; cache.set(file, mod);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'require', 'module', output)(mod.exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), mod);
  return mod.exports;
}
const E = load(fileURLToPath(new URL('./events.ts', import.meta.url)));
const P = load(fileURLToPath(new URL('./preset.ts', import.meta.url)));
const S = load(fileURLToPath(new URL('./saves.ts', import.meta.url)));
const gameId = 'gothic-remake', runId = 'existing-run';
const deviceId = '11111111-1111-4111-8111-111111111111';
const remoteDevice = '22222222-2222-4222-8222-222222222222';
const field = (entityId, name, run = runId) => ({ gameId, runId: run, entityId, field: name });
const value = (events, entityId, name, run = runId) => E.readField(events, field(entityId, name, run)).value;
function append(events, input, device = deviceId) {
  const event = E.createEvent(events, { gameId, runId, ...input }, { deviceId: device });
  events.push(event); return event;
}
function apply(events, inputs) { for (const input of inputs) append(events, input); }
function existingRun(options = {}) {
  const events = [];
  apply(events, P.runInputs(gameId, runId, 'Мой герой', options));
  return events;
}

test('explicit update adds seven lessons, four named maps, five PSN awards and only possession of the second bestiary', () => {
  const events = existingRun({ reportedLessons: 7, reportedMaps: 3 });
  const snapshot = JSON.stringify(events), inputs = P.confirmedProgressUpdate(events, runId);
  assert.equal(JSON.stringify(events), snapshot, 'preparing the update must not mutate the store');
  apply(events, inputs);
  for (const id of [...P.PRESET_LESSONS, ...P.PRESET_MAPS]) {
    assert.equal(value(events, id, 'status'), 'done', id);
    assert.equal(value(events, id, 'observed', null), true, id);
  }
  const awards = inputs.filter(input => input.entityId.startsWith('trophy-'));
  assert.deepEqual(new Set(awards.map(input => input.entityId)), new Set(P.PRESET_TROPHIES));
  assert.ok(awards.every(input => input.runId === null && input.field === 'status' && input.value === 'done'));
  assert.deepEqual(inputs.filter(input => input.entityId === 'bestiary-2').map(({ field, value }) => [field, value]), [['stage:found', true]]);
  assert.equal(value(events, 'bestiary-2', 'status'), undefined);
  assert.equal(value(events, 'bestiary-2', 'stage:delivered'), undefined);
  assert.equal(value(events, 'bestiary-2', 'stage:quest-completed'), undefined);
  assert.equal(value(events, 'run', 'reportedLessons'), 7);
  assert.equal(value(events, 'run', 'reportedMaps'), 4);
  assert.equal(value(events, 'run', 'nextAction'), 'join-old-camp');
  assert.equal(value(events, 'run', P.PERSONAL_PROGRESS_UPDATE), true);
  assert.ok(!inputs.some(input => /^(mud-|counter-|route:|lesson-.*smithing)/.test(input.entityId)));
  assert.ok(!inputs.some(input => input.runId && input.runId !== runId));
});

test('existing notes, later progress, character state and another selected plan survive the update', () => {
  const events = existingRun({ reportedLessons: 15, reportedMaps: 9, chapter: 4, campMembership: 'new', camp: 'Новый лагерь', role: 'Наёмник', difficulty: 'Gothic', sleep: 'broken', nextAction: 'bestiary-3' });
  append(events, { entityId: 'journal', field: 'text', value: 'Мои заметки и маршрут' });
  append(events, { entityId: 'bestiary-2', field: 'note', value: 'Проверить у Кавалорна' });
  append(events, { entityId: 'bestiary-2', field: 'stage:delivered', value: true });
  append(events, { entityId: 'lesson-bow-master', field: 'status', value: 'done' });
  const inputs = P.confirmedProgressUpdate(events, runId);
  apply(events, inputs);
  assert.equal(value(events, 'run', 'reportedLessons'), 15);
  assert.equal(value(events, 'run', 'reportedMaps'), 9);
  assert.equal(value(events, 'run', 'nextAction'), 'bestiary-3');
  assert.equal(value(events, 'run', 'campMembership'), 'new');
  assert.equal(value(events, 'run', 'chapter'), 4);
  assert.equal(value(events, 'run', 'sleep'), 'broken');
  assert.equal(value(events, 'journal', 'text'), 'Мои заметки и маршрут');
  assert.equal(value(events, 'bestiary-2', 'note'), 'Проверить у Кавалорна');
  assert.equal(value(events, 'bestiary-2', 'stage:delivered'), true);
  assert.equal(value(events, 'lesson-bow-master', 'status'), 'done');
  assert.ok(!inputs.some(input => input.entityId === 'run' && ['name', 'chapter', 'camp', 'campMembership', 'role', 'difficulty', 'sleep', 'permadeath', 'status', 'createdAt'].includes(input.field)));
});

test('a non-main save receives its own progress and marker without touching main or sibling saves', () => {
  const events = existingRun({ reportedLessons: 2, reportedMaps: 1 });
  apply(events, S.forkSaveInputs(events, gameId, runId, 'main', 'old-branch', 'Основной путь'));
  apply(events, S.forkSaveInputs(events, gameId, runId, 'main', 'other-branch', 'Другая ветка'));
  append(events, S.saveAddress({ ...field('journal', 'text'), value: 'Заметки этой ветки' }, runId, 'old-branch'));
  const inputs = P.confirmedProgressUpdate(events, runId, 'old-branch');
  assert.ok(inputs.filter(input => input.runId !== null).every(input => input.entityId.startsWith('save:old-branch:')));
  assert.ok(inputs.filter(input => input.runId === null).every(input => !input.entityId.startsWith('save:')));
  apply(events, inputs);
  const branch = S.saveView(events, gameId, runId, 'old-branch');
  const sibling = S.saveView(events, gameId, runId, 'other-branch');
  assert.equal(value(branch, 'run', 'reportedLessons'), 7);
  assert.equal(value(branch, 'run', 'reportedMaps'), 4);
  assert.equal(value(branch, 'bestiary-2', 'stage:found'), true);
  assert.equal(value(branch, 'journal', 'text'), 'Заметки этой ветки');
  assert.equal(value(branch, 'run', P.PERSONAL_PROGRESS_UPDATE), true);
  assert.equal(value(events, 'run', 'reportedLessons'), 2);
  assert.equal(value(events, 'run', P.PERSONAL_PROGRESS_UPDATE), undefined);
  assert.equal(value(sibling, 'run', 'reportedLessons'), 2);
  assert.equal(value(sibling, 'run', P.PERSONAL_PROGRESS_UPDATE), undefined);
  assert.equal(value(sibling, 'trophy-new-camp', 'status', null), 'done');
});

test('reapplying this dated update is a no-op, including after a later manual rollback', () => {
  const events = existingRun();
  apply(events, P.confirmedProgressUpdate(events, runId));
  assert.deepEqual(P.confirmedProgressUpdate(events, runId), []);
  append(events, { entityId: 'lesson-diving', field: 'status', value: 'todo' });
  assert.deepEqual(P.confirmedProgressUpdate(events, runId), []);
  assert.equal(value(events, 'lesson-diving', 'status'), 'todo');
});

test('reported totals and item fields with concurrent conflicts are left for reconciliation', () => {
  const events = existingRun();
  const conflicts = [field('run', 'reportedLessons'), field('run', 'reportedMaps'), field('lesson-diving', 'status'), field('map-colony', 'observed', null)];
  for (const [index, address] of conflicts.entries()) {
    const values = index < 2 ? [2, 9] : index === 2 ? ['done', 'todo'] : [true, false];
    events.push(E.createEvent(events, { ...address, value: values[0], basis: [] }, { deviceId }));
    events.push(E.createEvent(events, { ...address, value: values[1], basis: [] }, { deviceId: remoteDevice }));
  }
  const inputs = P.confirmedProgressUpdate(events, runId);
  for (const address of conflicts) assert.ok(!inputs.some(input => E.fieldKey(input) === E.fieldKey(address)));
  apply(events, inputs);
  for (const address of conflicts) assert.equal(E.readField(events, address).conflict, true);
  assert.equal(value(events, 'lesson-climbing', 'status'), 'done');
  assert.equal(value(events, 'run', P.PERSONAL_PROGRESS_UPDATE), undefined);
});

test('a partial update remains retryable after conflicts or invalid totals are corrected', () => {
  const events = existingRun({ reportedLessons: 'Проверить в игре' });
  const address = field('run', 'reportedMaps');
  events.push(E.createEvent(events, { ...address, value: 2, basis: [] }, { deviceId }));
  events.push(E.createEvent(events, { ...address, value: 9, basis: [] }, { deviceId: remoteDevice }));
  apply(events, P.confirmedProgressUpdate(events, runId));
  assert.equal(value(events, 'bestiary-2', 'stage:found'), true);
  assert.equal(value(events, 'run', P.PERSONAL_PROGRESS_UPDATE), undefined);
  append(events, { entityId: 'run', field: 'reportedLessons', value: 7 });
  append(events, { entityId: 'run', field: 'reportedMaps', value: 3 });
  const retry = P.confirmedProgressUpdate(events, runId);
  assert.ok(!retry.some(input => input.entityId === 'lesson-diving'));
  apply(events, retry);
  assert.equal(value(events, 'run', 'reportedLessons'), 7);
  assert.equal(value(events, 'run', 'reportedMaps'), 4);
  assert.equal(value(events, 'run', P.PERSONAL_PROGRESS_UPDATE), true);
  assert.deepEqual(P.confirmedProgressUpdate(events, runId), []);
});

test('preparing the update retains causal basis so a later remote edit stays visible as a conflict', () => {
  const events = existingRun({ reportedMaps: 3 });
  const inputs = P.confirmedProgressUpdate(events, runId);
  const original = E.readField(events, field('run', 'reportedMaps')).heads.map(event => event.id);
  assert.deepEqual(inputs.find(input => input.field === 'reportedMaps').basis, original);
  append(events, { entityId: 'run', field: 'reportedMaps', value: 10 }, remoteDevice);
  apply(events, inputs);
  const state = E.readField(events, field('run', 'reportedMaps'));
  assert.equal(state.conflict, true);
  assert.deepEqual(new Set(state.alternatives), new Set([4, 10]));
});

test('the old-camp plan is not added after confirmed admission or while another camp owns this save', () => {
  for (const membership of ['old', 'new', 'swamp']) {
    const events = existingRun({ campMembership: membership });
    assert.ok(!P.confirmedProgressUpdate(events, runId).some(input => input.field === 'nextAction'));
  }
  const events = existingRun();
  append(events, { entityId: 'route:join-old-camp', field: 'status', value: 'done' });
  assert.ok(!P.confirmedProgressUpdate(events, runId).some(input => input.field === 'nextAction'));
});

test('the initial preset still creates two runs while its updated book remains only found', () => {
  const inputs = P.gothicPreset(), events = [];
  apply(events, inputs);
  assert.deepEqual(new Set(inputs.filter(input => input.entityId === 'run').map(input => input.runId)), new Set(['first-playthrough', 'permadeath-plan']));
  assert.equal(value(events, 'run', 'reportedLessons', 'first-playthrough'), 7);
  assert.equal(value(events, 'run', 'reportedMaps', 'first-playthrough'), 4);
  assert.equal(value(events, 'run', 'status', 'permadeath-plan'), 'planned');
  assert.equal(value(events, 'bestiary-2', 'stage:found', 'first-playthrough'), true);
  assert.equal(value(events, 'bestiary-2', 'status', 'first-playthrough'), undefined);
  assert.deepEqual(P.confirmedProgressUpdate(events, 'first-playthrough'), []);
  assert.throws(() => P.confirmedProgressUpdate(events, ''), /Выберите прохождение/);
});
