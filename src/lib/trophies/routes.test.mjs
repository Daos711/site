import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file) { file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);new Function('exports','require','module',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText)(mod.exports,n=>n.startsWith('.')?load(path.resolve(path.dirname(file),n+'.ts')):require(n),mod);return mod.exports; }
const dir=path.dirname(fileURLToPath(import.meta.url)),R=load(path.join(dir,'routes.ts')),S=load(path.join(dir,'saves.ts')),E=load(path.join(dir,'events.ts'));
const deviceId='11111111-1111-4111-8111-111111111111',game={id:'game',items:[]},runId='first';
const node=(id,extra={})=>({id,title:id,instruction:'Do '+id,locationIds:['camp'],requires:[],trophyIds:[],required:true,missable:false,verified:true,...extra});
const definition={gameId:'game',locations:[{id:'camp',name:'Camp'}],nodes:[node('backup',{priority:300}),node('raid',{requires:['backup'],priority:200}),node('join',{requires:['raid']}),node('nearby',{required:false})]};
function event(events,entityId,field,value,extra={}) { return E.createEvent(events,{gameId:'game',runId,entityId,field,value,...extra},{deviceId}); }
function evaluate(events=[],def=definition,more={}) {return R.evaluateRoute({game,definition:def,events,runId,chapter:1,location:'camp',...more});}
test('next recommendation advances only after explicit completion and respects prerequisites',()=>{let events=[];assert.equal(evaluate(events).next.node.id,'backup');assert.equal(evaluate(events).all.find(s=>s.node.id==='raid').status,'blocked');events.push(event(events,'route:backup','status','done'));assert.equal(evaluate(events).next.node.id,'raid');events.push(event(events,'route:raid','status','done'));assert.equal(evaluate(events).next.node.id,'join');assert.equal(events.length,2);});
test('arbitrary order is recorded without automatically completing predecessors',()=>{const events=[event([],'route:join','status','done')];const r=evaluate(events);assert.equal(r.done,1);assert.equal(r.next.node.id,'backup');assert.equal(r.all.find(s=>s.node.id==='join').status,'done');});
test('confirmed blockers, unknown conditions, advisory evidence and deadlines stay distinct',()=>{const def={...definition,nodes:[node('old',{blockers:[{field:'campMembership',op:'eq',value:'new',verified:true,label:'Already joined'}]}),node('late',{deadlineChapter:1,missable:true}),node('unknown',{conditions:[{field:'key',op:'eq',value:true,verified:true,label:'Need key'}]}),node('rumour',{verified:false,conditions:[{field:'chapter',op:'gte',value:3,verified:false,label:'Suggested chapter'}]})]};let events=[event([],'run','campMembership','new')];const rows=evaluate(events,def,{chapter:2}).all;assert.equal(rows.find(s=>s.node.id==='old').status,'unavailable');assert.equal(rows.find(s=>s.node.id==='late').status,'unavailable');assert.equal(rows.find(s=>s.node.id==='unknown').status,'check');assert.equal(rows.find(s=>s.node.id==='rumour').status,'check');});
test('irreversible risk wins, deferred step can return, future spoilers are excluded',()=>{const def={...definition,nodes:[node('normal',{priority:500}),node('urgent',{deadlineChapter:1,missable:true,required:false}),node('future',{chapter:4,priority:9999})]};assert.equal(evaluate([],def).next.node.id,'urgent');const events=[event([],'route:urgent','postponed',true)];assert.equal(evaluate(events,def).next.node.id,'normal');assert.equal(evaluate(events,def).visible.some(s=>s.node.id==='future'),false);events.push(event(events,'route:urgent','postponed',false));assert.equal(evaluate(events,def).next.node.id,'urgent');});
test('graph validator rejects cycles, missing IDs, contradictory requirements and invalid ranges',()=>{const def={...definition,nodes:[node('a',{requires:['b']}),node('b',{requires:['a','missing']}),node('bad',{conditions:[{field:'chapter',op:'gte',value:3,verified:true,label:''}],deadlineChapter:1}),node('contradiction',{conditions:[{field:'camp',op:'eq',value:'old',verified:true,label:''}],blockers:[{field:'camp',op:'eq',value:'old',verified:true,label:''}]})]};const errors=R.validateRoute(def,game);assert.ok(errors.some(e=>e.includes('Циклическая')));assert.ok(errors.some(e=>e.includes('Нет зависимости')));assert.ok(errors.some(e=>e.includes('Противоречивые главы')));assert.ok(errors.some(e=>e.includes('Противоречивое условие')));assert.deepEqual(R.validateRoute(definition,game),[]);});
test('separate save branch retains main state and global trophies across reload and rollback',()=>{let events=[];const add=input=>{events.push(E.createEvent(events,input,{deviceId}));};add({gameId:'game',runId,entityId:'run',field:'name',value:'First'});add({gameId:'game',runId,entityId:'run',field:'chapter',value:1});add({gameId:'game',runId,entityId:'route:backup',field:'status',value:'done'});for(const input of S.forkSaveInputs(events,'game',runId,'main','branch','New Camp'))add(input);add(S.saveAddress({gameId:'game',runId,entityId:'route:raid',field:'status',value:'done'},runId,'branch'));add({gameId:'game',runId:null,entityId:'trophy-new',field:'status',value:'done'});assert.equal(evaluate(S.saveView(events,'game',runId,'branch')).next.node.id,'join');assert.equal(evaluate(S.saveView(events,'game',runId,'main')).next.node.id,'raid');add(S.selectSaveInput('game',runId,'main'));const restored=E.parseImport({format:'lab-trophies',version:1,exportedAt:new Date().toISOString(),events:JSON.parse(JSON.stringify(events))}).events;assert.equal(S.activeSave(restored,'game',runId),'main');assert.equal(S.listSaves(restored,'game',runId).length,2);assert.equal(E.readField(S.saveView(restored,'game',runId,'main'),{gameId:'game',runId:null,entityId:'trophy-new',field:'status'}).value,'done');});
test('fork refuses conflicts instead of silently dropping uncertain state',()=>{const a=event([],'route:backup','status','done'),b=event([],'route:backup','status','todo');assert.throws(()=>S.forkSaveInputs([a,b],'game',runId,'main','branch','Branch'),/расхождения/);});

test('active save is a device preference and concurrent devices never switch each other',()=>{
 let events=[];const add=input=>events.push(E.createEvent(events,input,{deviceId}));
 add({gameId:'game',runId,entityId:'run',field:'name',value:'Run'});
 for(const input of S.forkSaveInputs(events,'game',runId,'main','branch','Branch',deviceId))add(input);
 const secondDevice=crypto.randomUUID(),before=[...events];
 events.push(E.createEvent(before,S.selectSaveInput('game',runId,'main',deviceId),{deviceId}));
 events.push(E.createEvent(before,S.selectSaveInput('game',runId,'branch',secondDevice),{deviceId:secondDevice}));
 assert.equal(S.activeSave(events,'game',runId,deviceId),'main');
 assert.equal(S.activeSave(events,'game',runId,secondDevice),'branch');
 assert.deepEqual(E.projectEvents(events).conflicts,[]);
 assert.equal(S.activeSave(events,'game',runId,crypto.randomUUID()),'main');
});
test('branch projection retains its full causal chain and supports cached immutable reads',()=>{
 let events=[];const add=input=>{const value=E.createEvent(events,input,{deviceId});events.push(value);return value;};
 add({gameId:'game',runId,entityId:'run',field:'name',value:'Run'});
 add({gameId:'game',runId,entityId:'route:backup',field:'status',value:'done'});
 for(const input of S.forkSaveInputs(events,'game',runId,'main','branch','Branch',deviceId))add(input);
 const edit=add(S.saveAddress({gameId:'game',runId,entityId:'route:backup',field:'status',value:'todo'},runId,'branch'));
 const view=S.saveView(events,'game',runId,'branch');
 assert.ok(Object.isFrozen(view));assert.ok(view.every(Object.isFrozen));
 assert.equal(E.projectEvents(view),E.projectEvents(view));
 const transformed=view.find(event=>event.id===edit.id);
 assert.deepEqual(transformed.parents,edit.parents);
 assert.equal(E.readField(view,transformed).value,'todo');
 assert.equal(E.readField(view,transformed).incomplete,false);
 assert.equal(events.find(event=>event.id===edit.id).entityId,'save:branch:route:backup');
 edit.value='mutated outside projection';
 assert.equal(E.readField(view,transformed).value,'todo');
});
test('showing spoilers cannot promote a future-chapter action to the current next step',()=>{
 const def={...definition,nodes:[node('current'),node('future',{chapter:4,priority:99999})]};
 const without=evaluate([],def),withSpoilers=evaluate([],def,{spoilers:true});
 assert.equal(without.next.node.id,'current');assert.equal(withSpoilers.next.node.id,'current');
 assert.equal(withSpoilers.visible.some(step=>step.node.id==='future'),true);
 assert.equal(withSpoilers.nearby.some(step=>step.node.id==='future'),false);
});
test('global item conflicts and postponement use the same scope as completion',()=>{
 const globalGame={id:'game',items:[{id:'global-action',scope:'global',name:'Global'}]},def={...definition,nodes:[node('global',{itemId:'global-action'})]};
 const postponed=event([],'global-action','postponed',true,{runId:null});
 assert.equal(evaluate([postponed],def,{game:globalGame}).all[0].status,'postponed');
 const a=event([],'global-action','status','todo',{runId:null}),b=event([],'global-action','status','done',{runId:null});
 assert.equal(evaluate([a,b],def,{game:globalGame}).all[0].status,'check');
 assert.equal(evaluate([a,b],def,{game:globalGame}).next,undefined);
});
test('completed actions can block alternative camps without writing camp metadata',()=>{
 const blocker=id=>({field:'action:'+id,op:'eq',value:true,label:'Other camp joined',verified:true});
 const def={...definition,nodes:[node('old',{blockers:[blocker('new')]}),node('new',{blockers:[blocker('old')]})]};
 assert.deepEqual(R.validateRoute(def,game),[]);
 const events=[event([],'route:new','status','done')];
 assert.equal(evaluate(events,def).all.find(step=>step.node.id==='old').status,'unavailable');
 assert.equal(events.length,1);assert.equal(events[0].entityId,'route:new');
 const invalid={...def,nodes:[node('bad',{blockers:[blocker('missing')]})]};
 assert.ok(R.validateRoute(invalid,game).some(error=>error.includes('Нет действия')));
});
test('book-stage and global conditions read the explicit entity without manual run metadata',()=>{
 const def={...definition,nodes:[node('next-book',{conditions:[{entityId:'book-one',field:'stage:read',op:'eq',value:true,label:'Read first book',verified:true},{entityId:'knowledge',scope:'global',field:'known',op:'eq',value:true,label:'Known globally',verified:true}]})]};
 assert.equal(evaluate([],def).all[0].status,'check');
 const events=[event([],'book-one','stage:read',true),event([],'knowledge','known',true,{runId:null})];
 assert.equal(evaluate(events,def).all[0].status,'available');
 assert.equal(evaluate(events,def,{runId:'another-run'}).all[0].status,'check');
 const separateAddresses={...definition,nodes:[node('safe',{conditions:[{entityId:'one',field:'stage:read',op:'eq',value:true,label:'',verified:true}],blockers:[{entityId:'two',field:'stage:read',op:'eq',value:true,label:'',verified:true}]})]};
 assert.deepEqual(R.validateRoute(separateAddresses,{...game,items:[{id:'one',steps:[{id:'read'}]},{id:'two',steps:[{id:'read'}]}]}),[]);
});

test('explicit verify status is a check and cannot become the next categorical recommendation',()=>{
 const events=[event([],'route:backup','status','verify')];
 const route=evaluate(events);
 assert.equal(route.all.find(step=>step.node.id==='backup').status,'check');
 assert.notEqual(route.next?.node.id,'backup');
});
test('conflicting character context suspends recommendations until explicitly resolved',()=>{
 const a=event([],'run','chapter',1),b=event([],'run','chapter',2);
 const route=evaluate([a,b]);assert.deepEqual(route.contextConflicts,['глава']);assert.equal(route.next,undefined);
 const accepted=event([a,b],'run','chapter',1),resolved=evaluate([a,b,accepted]);
 assert.deepEqual(resolved.contextConflicts,[]);assert.equal(resolved.next.node.id,'backup');
});
test('conflicting action and book-stage conditions are visible context conflicts',()=>{
 const def={...definition,nodes:[node('old',{blockers:[{field:'action:new',op:'eq',value:true,label:'Вступление в другой лагерь',verified:true}]}),node('new'),node('book',{conditions:[{entityId:'book-one',field:'stage:read',op:'eq',value:true,label:'Чтение книги',verified:true}]})]};
 const events=[event([],'route:new','status','done'),event([],'route:new','status','todo'),event([],'book-one','stage:read',true),event([],'book-one','stage:read',false)];
 const route=evaluate(events,def);assert.ok(route.contextConflicts.includes('Вступление в другой лагерь'));assert.ok(route.contextConflicts.includes('Чтение книги'));assert.equal(route.next,undefined);
});
test('validator checks condition entities and stages and follows whole-status dependencies only',()=>{
 const bookGame={...game,items:[{id:'book-three',steps:[{id:'delivered'}]},{id:'lesson'}]};
 const staged={...definition,nodes:[node('book',{itemId:'book-three',requires:['lesson']}),node('lesson',{itemId:'lesson',conditions:[{entityId:'book-three',field:'stage:delivered',op:'eq',value:true,label:'Deliver book',verified:true}]})]};
 assert.deepEqual(R.validateRoute(staged,bookGame),[]);
 const cyclic=structuredClone(staged);cyclic.nodes[1].conditions[0].field='status';cyclic.nodes[1].conditions[0].value='done';
 assert.ok(R.validateRoute(cyclic,bookGame).some(error=>error.includes('Циклическая')));
 const badStage=structuredClone(staged);badStage.nodes[1].conditions[0].field='stage:invented';assert.ok(R.validateRoute(badStage,bookGame).some(error=>error.includes('Нет стадии')));
 const badEntity=structuredClone(staged);badEntity.nodes[1].conditions[0].entityId='invented';assert.ok(R.validateRoute(badEntity,bookGame).some(error=>error.includes('Нет объекта')));
});

test('validator rejects mutually exclusive confirmed equalities and numeric ranges',()=>{
 const condition=(op,value,extra={})=>({field:'campMembership',op,value,label:'Constraint',verified:true,...extra});
 const cases=[
  [condition('eq','old'),condition('eq','new')],
  [condition('eq','old'),condition('neq','old')],
  [condition('gte',5),condition('lte',3)],
  [condition('eq',4),condition('gte',5)],
  [condition('eq',4),condition('lte',3)],
  [condition('gte',5),condition('lte',5),condition('neq',5)],
 ];
 for(const conditions of cases){const errors=R.validateRoute({...definition,nodes:[node('impossible',{conditions})]},game);assert.ok(errors.some(error=>error.includes('Противоречивые условия')),JSON.stringify(conditions));}
});
test('validator keeps advisory rules and separate entities, scopes and stages independent',()=>{
 const condition=(op,value,extra={})=>({field:'campMembership',op,value,label:'Constraint',verified:true,...extra});
 const bookGame={...game,items:[{id:'book-one',steps:[{id:'delivered'}]},{id:'book-two',steps:[{id:'delivered'}]}]};
 const cases=[
  [condition('eq','old'),condition('eq','new',{verified:false})],
  [condition('gte',5),condition('lte',3,{verified:false})],
  [condition('eq','old'),condition('eq','new',{scope:'global'})],
  [condition('eq',true,{entityId:'book-one',field:'stage:delivered'}),condition('eq',false,{entityId:'book-two',field:'stage:delivered'})],
  [condition('eq',true,{entityId:'book-one',field:'stage:delivered'}),condition('eq','todo',{entityId:'book-one',field:'status'})],
  [condition('gte',3),condition('lte',5),condition('eq',4)],
  [condition('eq','old'),condition('eq','old'),condition('neq','new')],
 ];
 for(const conditions of cases)assert.deepEqual(R.validateRoute({...definition,nodes:[node('possible',{conditions})]},bookGame),[],JSON.stringify(conditions));
});
