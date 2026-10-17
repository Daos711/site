import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
const fake=process.env.TROPHY_TEST_RUNTIME?require(path.join(process.env.TROPHY_TEST_RUNTIME,'node_modules/fake-indexeddb')):require('fake-indexeddb');
globalThis.indexedDB=fake.indexedDB;globalThis.IDBKeyRange=fake.IDBKeyRange;
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const compiled={exports:{}};cache.set(file,compiled);const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require','module',output)(compiled.exports,name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),compiled);return compiled.exports;}
const {createTrackerStore}=load(fileURLToPath(new URL('./storage.ts',import.meta.url)));
const {createSyncController,createSupabaseEventAdapter}=load(fileURLToPath(new URL('./sync.ts',import.meta.url)));
const {readField,createEvent}=load(fileURLToPath(new URL('./events.ts',import.meta.url)));
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const address={gameId:'gothic-1-remake',runId:null,entityId:'lesson.diving',field:'learned'};
const defer=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
async function store(owner=A){const value=createTrackerStore({databaseName:'sync-'+crypto.randomUUID(),workspaceId:'user:'+owner});await value.init();return value;}
function server(){const rows=new Map();return {rows,adapter:{getOwnerId:async()=>A,pullAll:async()=>[...rows.values()],push:async(owner,events)=>{assert.equal(owner,A);for(const event of events)rows.set(event.id,event);return events.map(event=>event.id);}}};}
const control=(value,adapter)=>createSyncController(value,adapter,{ownerId:A,retryMs:100000,pollMs:100000});
test('two device databases converge, preserve conflicts and resolve only with all causal heads',async()=>{
 const a=await store(),b=await store(),remote=server(),ca=control(a,remote.adapter),cb=control(b,remote.adapter);
 try{await a.dispatch({...address,value:true});await b.dispatch({...address,value:false});await ca.sync();await cb.sync();await ca.sync();assert.equal(readField(a.getSnapshot().events,address).conflict,true);assert.equal(readField(b.getSnapshot().events,address).conflict,true);await a.dispatch({...address,value:'confirmed-manually'});await ca.sync();await cb.sync();assert.equal(readField(b.getSnapshot().events,address).value,'confirmed-manually');assert.equal(a.getSnapshot().pendingIds.length,0);assert.equal(b.getSnapshot().pendingIds.length,0);}finally{ca.dispose();cb.dispose();a.dispose();b.dispose();}
});
test('lost upload acknowledgement retains pending; later full pull confirms without duplicate writes',async()=>{
 const value=await store(),remote=server();let fail=true;const adapter={...remote.adapter,push:async(owner,events)=>{const ids=await remote.adapter.push(owner,events);if(fail){fail=false;throw new Error('response lost');}return ids;}};const sync=control(value,adapter);
 try{const event=await value.dispatch({...address,value:true});await sync.sync();assert.deepEqual(value.getSnapshot().pendingIds,[event.id]);assert.equal(value.getSnapshot().sync.status,'error');await sync.sync();assert.equal(value.getSnapshot().pendingIds.length,0);assert.equal(remote.rows.size,1);assert.equal(value.getSnapshot().sync.status,'synced');}finally{sync.dispose();value.dispose();}
});
test('account switch during pull never merges another session or acknowledges pending',async()=>{
 const value=await store(),gate=defer(),started=defer();let account=A;const remote=createEvent([],{...address,value:'remote'},{deviceId:A});
 const sync=control(value,{getOwnerId:async()=>account,pullAll:async()=>{started.resolve();await gate.promise;return [remote];},push:async()=>{throw new Error('must not push');}});
 try{const local=await value.dispatch({...address,value:true});const running=sync.sync();await started.promise;account=B;gate.resolve();await running;assert.deepEqual(value.getSnapshot().events.map(event=>event.id),[local.id]);assert.deepEqual(value.getSnapshot().pendingIds,[local.id]);assert.equal(value.getSnapshot().sync.status,'error');}finally{sync.dispose();value.dispose();}
});
test('dispose/re-init fences obsolete sync work; guest is never auto-assigned',async()=>{
 const value=await store(),gate=defer(),started=defer(),remote=createEvent([],{...address,value:'remote'},{deviceId:A});
 const sync=control(value,{getOwnerId:async()=>A,pullAll:async()=>{started.resolve();await gate.promise;return [remote];},push:async()=>[]});
 try{const running=sync.sync();await started.promise;sync.dispose();value.dispose();await value.init();gate.resolve();await running;assert.equal(value.getSnapshot().events.length,0);const guest=createTrackerStore({workspaceId:'guest',databaseName:'guest-'+crypto.randomUUID()});await guest.init();try{assert.throws(()=>control(guest,server().adapter),/не соответствует/);}finally{guest.dispose();}}finally{sync.dispose();value.dispose();}
});
test('an edit during an upload remains pending after only the earlier batch is acknowledged',async()=>{
 const value=await store(),remote=server(),gate=defer(),started=defer();const adapter={...remote.adapter,push:async(owner,events)=>{started.resolve();await gate.promise;return remote.adapter.push(owner,events);}};const sync=control(value,adapter);
 try{await value.dispatch({...address,value:true});const running=sync.sync();await started.promise;const later=await value.dispatch({...address,entityId:'lesson.acrobatics',value:true});gate.resolve();await running;assert.deepEqual(value.getSnapshot().pendingIds,[later.id]);assert.notEqual(value.getSnapshot().sync.status,'synced');}finally{sync.dispose();value.dispose();}
});
test('adapter scans all pages despite a server cap; same-ID different payload is never acknowledged',async()=>{
 const rows=Array.from({length:1103},()=>createEvent([],{...address,value:true},{deviceId:A})).sort((a,b)=>a.id.localeCompare(b.id));let queries=0;
 const client={auth:{getSession:async()=>({data:{session:{user:{id:A}}},error:null})},from:()=>{
  let cursor=null,ids=null;const query={select:()=>query,eq:()=>query,order:()=>query,limit:()=>query,gt:(_,value)=>{cursor=value;return query;},in:(_,value)=>{ids=value;return query;},upsert:async()=>({error:null}),then(resolve,reject){queries++;return Promise.resolve({data:rows.filter(event=>(!cursor||event.id>cursor)&&(!ids||ids.includes(event.id))).slice(0,137).map(event=>({event_id:event.id,payload:event})),error:null}).then(resolve,reject);}};return query;
 }};
 const adapter=createSupabaseEventAdapter(client);assert.equal((await adapter.pullAll(A)).length,1103);assert.ok(queries>8);await assert.rejects(adapter.push(A,[{...rows[0],value:false}]),/точное содержимое/);
});
