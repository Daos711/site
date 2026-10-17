import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), ts = require('typescript'), cache = new Map();
const fake = process.env.TROPHY_TEST_RUNTIME ? require(path.join(process.env.TROPHY_TEST_RUNTIME,'node_modules/fake-indexeddb')) : require('fake-indexeddb');
globalThis.indexedDB = fake.indexedDB; globalThis.IDBKeyRange = fake.IDBKeyRange;
function load(file) { file=path.resolve(file); if(cache.has(file))return cache.get(file).exports; const compiled={exports:{}};cache.set(file,compiled);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require','module',output)(compiled.exports,name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),compiled);return compiled.exports; }
const {createTrackerStore}=load(fileURLToPath(new URL('./storage.ts',import.meta.url)));
const {readField}=load(fileURLToPath(new URL('./events.ts',import.meta.url)));
const input={gameId:'gothic-1-remake',runId:'one',entityId:'lesson.diving',field:'current',value:true};
const name=()=> 'trophy-test-'+crypto.randomUUID();
test('durable event+outbox survive reload; guest and two accounts are isolated',async()=>{
 const databaseName=name(), guest=createTrackerStore({databaseName,workspaceId:'guest'});await guest.init();const first=await guest.dispatch(input);guest.dispose();
 const reopened=createTrackerStore({databaseName,workspaceId:'guest'}), user=createTrackerStore({databaseName,workspaceId:'user:11111111-1111-4111-8111-111111111111'});await reopened.init();await user.init();
 try {assert.equal(reopened.getSnapshot().events[0].id,first.id);assert.deepEqual(reopened.getSnapshot().pendingIds,[first.id]);assert.equal(user.getSnapshot().events.length,0);assert.equal(reopened.getSnapshot(),reopened.getSnapshot());assert.ok(Object.isFrozen(reopened.getSnapshot().events[0]));}finally{reopened.dispose();user.dispose();}
});
test('concurrent tabs preserve both updates through a single read-write IDB transaction',async()=>{
 const databaseName=name(),a=createTrackerStore({databaseName,workspaceId:'guest'}),b=createTrackerStore({databaseName,workspaceId:'guest'});await a.init();await b.init();
 try {await Promise.all([a.dispatch(input),b.dispatch({...input,entityId:'lesson.acrobatics'})]);await a.mergeRemote([]);assert.equal(a.getSnapshot().events.length,2);assert.equal(a.getSnapshot().pendingIds.length,2);}finally{a.dispose();b.dispose();}
});
test('failed batch is atomic, error is visible, and no partial save is claimed',async()=>{
 const store=createTrackerStore({databaseName:name(),workspaceId:'guest'});await store.init();
 try {await assert.rejects(store.batchDispatch([input,{...input,value:Infinity}]));assert.equal(store.getSnapshot().events.length,0);assert.equal(store.getSnapshot().pendingIds.length,0);assert.equal(store.getSnapshot().status,'ready');assert.ok(store.getSnapshot().error);await store.dispatch(input);assert.equal(store.getSnapshot().status,'ready');assert.equal(store.getSnapshot().error,null);}finally{store.dispose();}
});
test('imports validate before mutation, backup precedes bulk changes, restore appends and history survives',async()=>{
 const store=createTrackerStore({databaseName:name(),workspaceId:'guest'});await store.init();
 try {await store.dispatch(input);const original=store.exportData();await assert.rejects(async()=>store.importData({...original,version:99}));assert.equal(store.getSnapshot().events.length,1);await store.batchDispatch([{...input,value:false},{...input,entityId:'journal',value:'note'}]);const snapshots=await store.listBackups();assert.equal(snapshots.length,1);const before=store.getSnapshot().events.length;await store.restoreBackup(snapshots[0].id);assert.ok(store.getSnapshot().events.length>before);assert.equal(readField(store.getSnapshot().events,input).value,true);assert.equal(readField(store.getSnapshot().events,{...input,entityId:'journal'}).value,null);assert.equal(await store.importData(original),0);}finally{store.dispose();}
});
test('StrictMode init-dispose-init works and disposed handles reject writes',async()=>{
 const store=createTrackerStore({databaseName:name(),workspaceId:'guest'});const obsolete=store.init().catch(()=>{});store.dispose();await store.init();await obsolete;await store.dispatch(input);store.dispose();await assert.rejects(store.dispatch(input));await store.init();assert.equal(store.getSnapshot().events.length,1);store.dispose();
});

test('transaction-time reload keeps autosave basis instead of consuming a concurrent tab edit', async () => {
 const databaseName=name(), a=createTrackerStore({databaseName,workspaceId:'guest'}), b=createTrackerStore({databaseName,workspaceId:'guest'});
 await a.init(); await b.init();
 try {
  const original=await a.dispatch({...input,entityId:'journal',field:'text',value:'initial'});
  await b.mergeRemote([]);
  const basis=readField(b.getSnapshot().events,original).heads.map(event=>event.id);
  await a.dispatch({...input,entityId:'journal',field:'text',value:'remote'});
  await b.dispatch({...input,entityId:'journal',field:'text',value:'draft',basis});
  const field=readField(b.getSnapshot().events,original);
  assert.equal(field.conflict,true);
  assert.deepEqual(new Set(field.alternatives),new Set(['remote','draft']));
  b.dispose(); await b.init();
  assert.equal(readField(b.getSnapshot().events,original).conflict,true);
  assert.ok(b.exportData().events.every(event=>!Object.hasOwn(event,'basis')));
 } finally {a.dispose();b.dispose();}
});
