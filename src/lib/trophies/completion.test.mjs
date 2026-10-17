import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url), ts=require('typescript'), cache=new Map();
const fake=process.env.TROPHY_TEST_RUNTIME?require(path.join(process.env.TROPHY_TEST_RUNTIME,'node_modules/fake-indexeddb')):require('fake-indexeddb');
globalThis.indexedDB=fake.indexedDB;globalThis.IDBKeyRange=fake.IDBKeyRange;
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const compiled={exports:{}};cache.set(file,compiled);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require','module',output)(compiled.exports,name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),compiled);return compiled.exports;}
const here=path.dirname(fileURLToPath(import.meta.url)), C=load(path.join(here,'completion.ts')), E=load(path.join(here,'events.ts')), S=load(path.join(here,'saves.ts')), {createTrackerStore}=load(path.join(here,'storage.ts'));
const deviceId=crypto.randomUUID(), target={gameId:'gothic-remake',runId:'first',itemId:'lesson-diving'};
const current={gameId:target.gameId,runId:target.runId,entityId:target.itemId,field:'status'};
const history={...current,runId:null,field:'observed'};
function append(events,inputs){const created=[];for(const input of inputs){const event=E.createEvent(events,input,{deviceId});events.push(event);created.push(event);}return created;}
async function open(){const store=createTrackerStore({databaseName:'completion-'+crypto.randomUUID(),workspaceId:'guest'});await store.init();return store;}

test('one explicit lesson or map confirmation prepares both current and history observations',()=>{
 for(const itemId of ['lesson-diving','map-swamp-camp']){
  const local={...target,itemId}, events=[], inputs=C.completionInputs(events,local,'confirm');
  assert.equal(inputs.length,2);assert.deepEqual(inputs.map(input=>[input.runId,input.entityId,input.field,input.value]),[['first',itemId,'status','done'],[null,itemId,'observed',true]]);
  append(events,inputs);assert.equal(C.completionState(events,local).currentDone,true);assert.equal(C.completionState(events,local).historyRecorded,true);assert.equal(C.completionState(events,local).needsReconciliation,false);
  assert.equal(events.some(event=>event.runId===null&&event.field==='status'),false);
 }
});
test('legacy done without recorded history requires explicit reconciliation and makes no automatic writes',()=>{
 for(const recorded of [undefined,false]){
  const events=[];append(events,[{...current,value:'done'},...(recorded===undefined?[]:[{...history,value:recorded}])]);
  const before=JSON.stringify(events), state=C.completionState(events,target);
  assert.equal(state.currentDone,true);assert.equal(state.historyRecorded,false);assert.equal(state.needsReconciliation,true);assert.equal(JSON.stringify(events),before);
  assert.throws(()=>C.completionInputs(events,target),/Выберите действие/);
  append(events,C.completionInputs(events,target,'confirm'));assert.equal(C.completionState(events,target).needsReconciliation,false);
 }
});
test('branch confirmation changes only that character save while history remains global',()=>{
 const events=[];append(events,[{gameId:target.gameId,runId:target.runId,entityId:'run',field:'name',value:'First'},{...current,value:'todo'},{...history,value:false}]);
 append(events,S.forkSaveInputs(events,target.gameId,target.runId,'main','branch','Alternate',deviceId));
 const branch={...target,saveId:'branch'}, inputs=C.completionInputs(events,branch,'confirm');
 assert.equal(inputs[0].entityId,'save:branch:lesson-diving');assert.equal(inputs[1].entityId,'lesson-diving');
 append(events,inputs);assert.equal(C.completionState(events,target).currentDone,false);assert.equal(C.completionState(events,branch).currentDone,true);assert.equal(C.completionState(events,target).historyRecorded,true);
 assert.equal(C.completionState(events,{...target,runId:'other'}).currentDone,false);
});
test('mistake explicitly clears both observations; loading an earlier save preserves history',()=>{
 const events=[];append(events,C.completionInputs(events,target,'confirm'));
 const earlier=C.completionInputs(events,target,'loaded-earlier-save');assert.equal(earlier.length,1);append(events,earlier);
 assert.equal(C.completionState(events,target).currentDone,false);assert.equal(C.completionState(events,target).historyRecorded,true);
 append(events,C.completionInputs(events,target,'confirm'));const mistake=C.completionInputs(events,target,'mistake');assert.equal(mistake.length,2);append(events,mistake);
 assert.equal(C.completionState(events,target).currentDone,false);assert.equal(C.completionState(events,target).historyRecorded,false);
});
test('existing conflicts require resolution and stale prepared inputs preserve new concurrent heads',()=>{
 const a=E.createEvent([],{...history,value:true},{deviceId}),b=E.createEvent([],{...history,value:false},{deviceId:crypto.randomUUID()});
 assert.equal(C.completionState([a,b],target).historyConflict,true);
 assert.throws(()=>C.completionInputs([a,b],target,'confirm'),/расхождения/);assert.throws(()=>C.completionInputs([a,b],target,'mistake'),/расхождения/);
 assert.equal(C.completionInputs([a,b],target,'loaded-earlier-save').length,1);
 const events=[], prepared=C.completionInputs(events,target,'confirm');append(events,[{...history,value:false}]);append(events,prepared);
 assert.equal(E.readField(events,history).conflict,true);
 const currentA=E.createEvent([],{...current,value:'done'},{deviceId}),currentB=E.createEvent([],{...current,value:'todo'},{deviceId:crypto.randomUUID()});
 assert.throws(()=>C.completionInputs([currentA,currentB],target,'loaded-earlier-save'),/расхождения/);
});
test('atomic undo restores the exact previous history value, including already recorded true',async()=>{
 for(const previouslyRecorded of [true,false]){
  const store=await open();
  try{
   await store.batchDispatch([{...current,value:'todo'},{...history,value:previouslyRecorded}]);
   const receipt=await store.batchDispatch(C.completionInputs(store.getSnapshot().events,target,'confirm'));
   const undone=await store.undoBatch(receipt.map(event=>event.id));assert.equal(undone.length,2);
   assert.equal(E.readField(store.getSnapshot().events,current).value,'todo');assert.equal(E.readField(store.getSnapshot().events,history).value,previouslyRecorded);
   store.dispose();await store.init();assert.equal(E.readField(store.getSnapshot().events,history).value,previouslyRecorded);
   assert.ok(undone.every(event=>store.getSnapshot().pendingIds.includes(event.id)));
  }finally{store.dispose();}
 }
});
test('undo of explicit mistake restores both true observations and is atomic',async()=>{
 const store=await open();
 try{await store.batchDispatch(C.completionInputs([],target,'confirm'));const receipt=await store.batchDispatch(C.completionInputs(store.getSnapshot().events,target,'mistake'));assert.equal(C.completionState(store.getSnapshot().events,target).historyRecorded,false);await store.undoBatch(receipt.map(event=>event.id));const state=C.completionState(store.getSnapshot().events,target);assert.equal(state.currentDone,true);assert.equal(state.historyRecorded,true);}finally{store.dispose();}
});
test('failed confirmation commits neither field, outbox update nor backup',async()=>{
 const store=await open();
 try{const inputs=C.completionInputs([],target,'confirm');inputs[1]={...inputs[1],value:Infinity};await assert.rejects(store.batchDispatch(inputs));assert.equal(store.getSnapshot().events.length,0);assert.equal(store.getSnapshot().pendingIds.length,0);assert.equal((await store.listBackups()).length,0);}finally{store.dispose();}
});
test('failed second undo leaves the first field, outbox and backups completely unchanged',async()=>{
 const store=await open();
 try{
  const receipt=await store.batchDispatch(C.completionInputs([],target,'confirm'));
  await store.dispatch({...history,value:false});
  const before=JSON.stringify(store.exportData().events),pending=[...store.getSnapshot().pendingIds],backups=(await store.listBackups()).map(item=>item.id);
  await assert.rejects(store.undoBatch(receipt.map(event=>event.id)),/поле изменялось/);
  assert.equal(JSON.stringify(store.exportData().events),before);assert.deepEqual(store.getSnapshot().pendingIds,pending);assert.deepEqual((await store.listBackups()).map(item=>item.id),backups);
  store.dispose();await store.init();assert.equal(JSON.stringify(store.exportData().events),before);assert.equal(E.readField(store.getSnapshot().events,current).value,'done');
  await assert.rejects(store.undoBatch([receipt[0].id,receipt[0].id]),/список/);
 }finally{store.dispose();}
});
