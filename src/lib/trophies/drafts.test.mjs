import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url), ts=require('typescript'), cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const compiled={exports:{}};cache.set(file,compiled);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require','module',output)(compiled.exports,name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),compiled);return compiled.exports;}
const {createDraftController}=load(fileURLToPath(new URL('./drafts.ts',import.meta.url)));
const memory=()=>{const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};};
const defer=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
const create=(extra={})=>createDraftController({storageKey:'user/game/run/save/note',value:'original',heads:[],save:async()=>crypto.randomUUID(),storage:memory(),delayMs:60000,...extra});

test('debounce collapses rapid text changes, persists first, and saves without blur',async()=>{
 const storage=memory(), calls=[], controller=create({storage,delayMs:20,save:async(value,basis)=>{calls.push({value,basis});return crypto.randomUUID();}});controller.init();
 try{controller.edit('a');controller.edit('ab');assert.equal(storage.values.size,1);assert.equal(controller.hasUnsaved(),true);await new Promise(resolve=>setTimeout(resolve,80));assert.deepEqual(calls,[{value:'ab',basis:[]}]);assert.equal(controller.getSnapshot().phase,'saved');assert.equal(controller.hasUnsaved(),false);assert.equal(storage.values.size,0);}finally{controller.dispose();}
});
test('an incoming head during typing is not consumed by autosave',async()=>{
 const original=crypto.randomUUID(), remote=crypto.randomUUID(), calls=[], save=async(value,basis)=>{calls.push({value,basis});return crypto.randomUUID();};const controller=create({heads:[original],save});controller.init();
 try{controller.edit('local');controller.updateSource('remote',[remote],save);await controller.flush();assert.deepEqual(calls,[{value:'local',basis:[original]}]);}finally{controller.dispose();}
});
test('typing during a pending save advances only to the returned local event',async()=>{
 const first=defer(), id=crypto.randomUUID(), remote=crypto.randomUUID(), calls=[];const save=async(value,basis)=>{calls.push({value,basis});return calls.length===1?first.promise:crypto.randomUUID();};const storage=memory(), controller=create({storage,save});controller.init();
 try{controller.edit('first');const saving=controller.flush();await Promise.resolve();controller.edit('second');controller.updateSource('remote',[remote],save);assert.equal(controller.hasUnsaved(),true);first.resolve(id);await saving;assert.equal(controller.getSnapshot().dirty,true);assert.deepEqual(JSON.parse([...storage.values.values()][0]).basis,[id]);await controller.flush();assert.deepEqual(calls,[{value:'first',basis:[]},{value:'second',basis:[id]}]);assert.equal(controller.hasUnsaved(),false);}finally{controller.dispose();}
});
test('failed save survives reload with its original causal basis and can be retried',async()=>{
 const storage=memory(), original=crypto.randomUUID();const broken=create({storage,heads:[original],save:async()=>{throw new Error('disk full');}});broken.init();broken.edit('draft');await broken.flush();assert.equal(broken.getSnapshot().phase,'error');assert.equal(broken.getSnapshot().text,'draft');assert.equal(broken.hasUnsaved(),true);broken.dispose();
 const calls=[], restored=create({storage,heads:[crypto.randomUUID()],save:async(value,basis)=>{calls.push({value,basis});return crypto.randomUUID();}});restored.init();
 try{assert.equal(restored.getSnapshot().text,'draft');assert.equal(restored.hasUnsaved(),true);await restored.flush();assert.deepEqual(calls,[{value:'draft',basis:[original]}]);assert.equal(storage.values.size,0);}finally{restored.dispose();}
});
test('StrictMode disposal preserves text and reinitialization can save it',async()=>{
 const storage=memory(), controller=create({storage});controller.init();controller.edit('still here');controller.dispose();assert.equal(storage.values.size,1);controller.init();await controller.flush();assert.equal(controller.getSnapshot().text,'still here');assert.equal(controller.hasUnsaved(),false);controller.dispose();
});
test('a completed earlier editor cannot remove another editor newer recovery text',async()=>{
 const storage=memory(), gate=defer(), a=create({storage,save:()=>gate.promise});a.init();a.edit('a');const saving=a.flush();await Promise.resolve();const b=create({storage});b.init();b.edit('b');gate.resolve(crypto.randomUUID());await saving;assert.equal(JSON.parse([...storage.values.values()][0]).value,'b');a.dispose();b.dispose();
});
test('recovery storage failure does not erase text or falsely mark it as saved',async()=>{
 const storage={getItem:()=>null,setItem:()=>{throw new Error('quota');},removeItem:()=>{}}, gate=defer(), controller=create({storage,save:()=>gate.promise});controller.init();controller.edit('valuable text');assert.ok(controller.getSnapshot().recoveryError);assert.equal(controller.hasUnsaved(),true);const saving=controller.flush();await Promise.resolve();gate.reject(new Error('offline write failure'));await saving;assert.equal(controller.getSnapshot().text,'valuable text');assert.equal(controller.hasUnsaved(),true);controller.dispose();
});
