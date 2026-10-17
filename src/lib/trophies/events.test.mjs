import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), ts = require('typescript'), cache = new Map();
function load(file) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file).exports;
  const compiled = { exports: {} }; cache.set(file, compiled);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports','require','module',output)(compiled.exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), compiled);
  return compiled.exports;
}
const E = load(fileURLToPath(new URL('./events.ts', import.meta.url)));
const device = '11111111-1111-4111-8111-111111111111';
const address = { gameId: 'gothic-1-remake', runId: null, entityId: 'lesson.diving', field: 'learned' };
const set = (events, value, extra = {}) => E.createEvent(events, { ...address, value, ...extra }, { deviceId: device });
test('concurrent differing values remain conflicts regardless of wall clock or arrival order', () => {
  const base = set([], false), one = set([base], true), two = set([base], null); two.createdAt = '2099-01-01T00:00:00.000Z';
  for (const events of [[two, base, one], [one, two, base]]) {
    const field = E.readField(events, address); assert.equal(field.conflict, true); assert.equal(field.value, undefined); assert.equal(field.heads.length, 2);
    const resolution = set(events, true); assert.deepEqual(new Set(resolution.parents), new Set([one.id, two.id]));
    assert.equal(E.readField([...events, resolution], address).value, true);
  }
});
test('history, run state, PSN claim and two runs stay independent; equal concurrent heads agree', () => {
  const a = set([], true), b = set([], true), run = set([], false, { runId: 'first', field: 'current' }), psn = set([], 'unknown', { field: 'psn' }), other = set([], true, { runId: 'second', field: 'current' });
  const events = [a,b,run,psn,other]; assert.equal(E.readField(events,address).conflict,false); assert.equal(E.readField(events,run).value,false); assert.equal(E.readField(events,other).value,true); assert.equal(E.readField(events,psn).value,'unknown');
});
test('counter increments merge and the same increment is compensated once across two offline devices', () => {
  const a = set([], 6, { kind:'increment' }), b = set([], 2, { kind:'increment' });
  const undoA = E.createUndoEvent([a],a.id,device), undoB = E.createUndoEvent([a],a.id,'22222222-2222-4222-8222-222222222222');
  assert.equal(E.readField([undoB,a,b,undoA],address).value,2);
  assert.throws(()=>E.createUndoEvent([a,undoA],a.id,device),/уже отменено/);
  assert.throws(()=>set([a],0),/разных полях/);
});
test('undo preserves concurrent branches and cannot silently undo a superseded edit', () => {
  const base=set([],false), one=set([base],true), two=set([base],'pending');
  const undo=E.createUndoEvent([base,one,two],one.id,device);
  assert.equal(E.readField([base,one,two,undo],address).conflict,true);
  assert.deepEqual(undo.parents,[one.id]); assert.throws(()=>E.createUndoEvent([base,one],base.id,device),/поле изменялось/);
});
test('identical retry is idempotent; ID collision, bad ancestry and malicious imports are rejected', () => {
  const first=set([],true); assert.equal(E.mergeEvents([first],[structuredClone(first)]).length,1);
  assert.throws(()=>E.mergeEvents([first],[{...first,value:false}]),/разные события/);
  const child=set([first],false); assert.throws(()=>E.mergeEvents([first],[{...child,runId:'other'}]),/предшественник/);
  assert.throws(()=>E.parseImport({format:'lab-trophies',version:99,events:[],exportedAt:new Date().toISOString()}));
  assert.throws(()=>E.parseImport({format:'lab-trophies',version:1,events:[child],exportedAt:new Date().toISOString()}),/отсутствуют предшественники/);
  assert.ok(E.validateEvent({...first,value:JSON.parse('{"__proto__":{"polluted":true}}')}).length);
});
test('immutable 2000-event projection is reused, while mutable drafts are never cached', () => {
  const events=Array.from({length:2000},(_,index)=>Object.freeze({...set([],true),entityId:'lesson.'+index}));
  Object.freeze(events); const first=E.projectEvents(events); assert.equal(E.projectEvents(events),first);
  for(let index=0;index<2000;index++) assert.equal(E.readField(events,{...address,entityId:'lesson.'+index}),first.fields[E.fieldKey({...address,entityId:'lesson.'+index})]);
  const mutable=[set([],false)];assert.notEqual(E.projectEvents(mutable),E.projectEvents(mutable));mutable.push(set(mutable,true));assert.equal(E.readField(mutable,address).value,true);
});

test('an editor basis preserves a remote edit arriving while typing and never enters the payload', () => {
  const original = set([], 'original');
  const basis = E.readField([original], address).heads.map(event => event.id);
  const remote = set([original], 'remote edit');
  const draft = set([original, remote], 'local draft', {basis});
  assert.deepEqual(draft.parents, [original.id]);
  assert.equal(Object.hasOwn(draft, 'basis'), false);
  basis.length = 0;
  assert.deepEqual(draft.parents, [original.id]);
  const current = E.readField([original, remote, draft], address);
  assert.equal(current.conflict, true);
  assert.deepEqual(new Set(current.alternatives), new Set(['remote edit', 'local draft']));
  const resolved = set([original, remote, draft], 'accepted');
  assert.equal(E.readField([original, remote, draft, resolved], address).value, 'accepted');
});
test('an empty editor basis remains concurrent with the first incoming value', () => {
  const remote = set([], 'remote');
  const local = set([remote], 'local', {basis: []});
  assert.deepEqual(local.parents, []);
  assert.equal(E.readField([remote, local], address).conflict, true);
});
test('editor basis rejects unknown, duplicate, foreign-field, invalid and counter predecessors', () => {
  const first = set([], 'original'), other = set([], 'other', {field:'note'});
  for (const basis of [[crypto.randomUUID()], [first.id, first.id], [other.id], ['not-uuid'], null, 'all']) {
    assert.throws(() => set([first, other], 'draft', {basis}), /основан|Основан/);
  }
  assert.throws(() => set([], 1, {kind:'increment', basis:[]}), /основан/);
});
