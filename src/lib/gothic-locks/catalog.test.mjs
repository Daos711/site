import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';
async function compile(relative, imports = {}) {
 const source=await readFile(new URL(relative,import.meta.url),'utf8');
 let {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}});
 for(const [name,target] of Object.entries(imports)) outputText=outputText.replaceAll(`'${name}'`,`'${target}'`).replaceAll(`"${name}"`,`"${target}"`);
 return `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
}
const {LOCK_CATALOG:catalog,CATALOG_COUNTS,CATALOG_ALIASES,REGIONS,TYPE_NAMES,filterCatalog,completeness}=await import(await compile('./catalog.ts'));
const readyRows=JSON.parse(await readFile(new URL('./data/ready-solutions.json',import.meta.url),'utf8'));
const simulatorUrl=await compile('./simulator.ts');
const {solveLock,validateConfig}=await import(await compile('./solver.ts',{'./simulator':simulatorUrl}));
const {SKILLS,resolveSkillConfig}=await import(await compile('./skill.ts',{'./simulator':simulatorUrl}));
test('registry covers the independently found named records, with disjoint honest completeness counts',()=>{
 assert.ok(catalog.length>=146,'the established catalog must not lose named records');
 assert.equal(new Set(catalog.map(e=>e.id)).size,catalog.length);
 assert.equal(CATALOG_COUNTS.total,catalog.length);
 assert.equal(CATALOG_COUNTS.observations,catalog.filter(e=>e.config).length);
 assert.ok(CATALOG_COUNTS.observations>=24,'preserve independently observed configurations');
 for(const status of ['confirmed','location','incomplete']) assert.equal(CATALOG_COUNTS[status],filterCatalog({status}).length,status);
 assert.equal(CATALOG_COUNTS.confirmed+CATALOG_COUNTS.location+CATALOG_COUNTS.incomplete,CATALOG_COUNTS.total);
 for(const e of catalog){
  assert.ok(e.name&&e.source.url&&e.source.license);
  assert.ok(REGIONS.some(r=>r.id===e.region),e.id);
  assert.ok(TYPE_NAMES[e.type],e.id);
  if(e.gameVersion!==null) assert.ok(e.gameVersion.trim()); if(e.chapter!==null) assert.ok(e.chapter.trim()&&e.locationSources?.length);
  assert.equal(e.solutionStatus,'unconfirmed');
  for(const skill of SKILLS) assert.equal(resolveSkillConfig(e.config,e.profiles,skill),null,e.id+' must not invent a skill profile');
  if(e.config){assert.deepEqual(validateConfig(e.config),[]);assert.match(e.source.url,/Arminek\/nameless-locksmith/);}
  else if(e.verification==='source') assert.ok(readyRows.some(s=>s.entryId===e.id&&s.source.url===e.source.url&&s.source.license===e.source.license),e.id+' needs a matching attributed published solution');
  else assert.equal(e.verification,'unknown');
 }
});
test('all filter partitions use the same registry as the UI and preserve type/location distinctions',()=>{
 for(const [key,values] of [['region',REGIONS.map(r=>r.id)],['type',Object.keys(TYPE_NAMES)],['status',['confirmed','location','incomplete']]]) {
  const partitions=values.flatMap(value=>filterCatalog({[key]:value}));
  assert.equal(partitions.length,catalog.length,key);
  assert.equal(new Set(partitions.map(e=>e.id)).size,catalog.length,key);
 }
 for(const e of catalog.filter(e=>e.id.startsWith('fisk-'))) assert.ok(filterCatalog({query:'Фиска'}).some(found=>found.id===e.id));
 assert.ok(filterCatalog({query:'Кирго'}).length>=1);
 assert.ok(filterCatalog({region:'caves'}).length);
 assert.ok(filterCatalog({region:'underwater'}).length);
 const unknown=filterCatalog({type:'unknown'});
 assert.ok(unknown.length,'unresolved object types must remain discoverable');
 for(const entry of unknown){assert.equal(entry.identity,'uncertain',entry.id);assert.equal(completeness(entry),'incomplete',entry.id);}
 for(const e of filterCatalog({valuable:true})) assert.ok(e.contents.length);
 assert.equal(filterCatalog({query:'Скатти',opened:['scatty-chest'],hideOpened:true}).some(e=>e.id==='scatty-chest'),false);
 for(const e of filterCatalog({status:'location'})) assert.equal(completeness(e),'location');
});
test('Fisk is ten distinct referenced objects, without fabricated source configurations',()=>{
 const fisk=catalog.filter(e=>e.id.startsWith('fisk-'));
 assert.equal(fisk.length,10);assert.equal(fisk.filter(e=>e.type==='door').length,2);assert.equal(fisk.filter(e=>e.type==='chest').length,8);
 assert.deepEqual(fisk.filter(e=>e.type==='chest').map(e=>e.plateCount),[6,5,5,5,6,6,6,4]);
 for(const e of fisk){assert.equal(e.config,null);assert.ok(e.source.url.endsWith('/blog/fisk/'));assert.equal(e.solutionStatus,'unconfirmed');}
});
test('two Cor Galom records retain conflicting evidence and the old deep-link ID',()=>{
 const cor=catalog.filter(e=>e.id.startsWith('cor-galom'));
 assert.equal(cor.length,2);
 assert.deepEqual(cor[0].config.positions,[7,7,6,1]);
 assert.deepEqual(cor[1].config.positions,[6,5,5,7,1,4]);
 assert.equal(cor[1].identity,'uncertain');
 assert.ok(cor[1].warnings.some(s=>s.includes('6, 6, 5, 7, 1, 4')));
 assert.ok(cor[1].locationSources.some(s=>s.url.includes('bedroom')));
 assert.ok(catalog.find(e=>e.id==='kharim-chest').warnings.some(s=>s.includes('Кирго')));
 assert.equal(catalog.find(e=>e.id==='guide-kharim').plateCount,5);
});
test('Cavalorn storeroom merges the former uncertain cave record and preserves its source and old deep link',()=>{
 assert.equal(CATALOG_ALIASES['cavalorn-cave-unknown'],'cavalorn-storeroom-door');
 assert.equal(catalog.some(e=>e.id==='cavalorn-cave-unknown'),false);
 const entry=catalog.find(e=>e.id==='cavalorn-storeroom-door');
 assert.ok(entry);
 assert.equal(entry.type,'door');
 assert.ok(entry.config);
 assert.match(entry.source.url,/Arminek\/nameless-locksmith/);
 assert.match(entry.source.license,/MIT/);
 for(const [oldId,canonicalId] of Object.entries(CATALOG_ALIASES)){
  assert.equal(catalog.some(e=>e.id===oldId),false,oldId+' should not be counted twice');
  assert.ok(catalog.some(e=>e.id===canonicalId),oldId+' must resolve to an existing object');
 }
});
for(const e of catalog.filter(e=>e.config)) test(`observed configuration is independently solvable without unsafe intermediate states: ${e.id}`,()=>{
 const result=solveLock(e.config,{maxMilliseconds:15000});
 assert.equal(result.status,'solved',result.reason);
 let state=e.config.positions.slice();
 for(const move of result.moves){
  state=state.map((p,to)=>p+move.direction*(to===move.plate?1:e.config.links[move.plate][to]));
  assert.ok(state.every(p=>p>=1&&p<=7),`${e.id} intermediate wall collision`);
 }
 assert.deepEqual(state,state.map(()=>4));
 const expected={'scatty-chest':31,'cor-galom-recipe':15,'cor-galom-second-variant':59,'cavalorn-storeroom-door':41,'bridge-near-new-camp':25,'orc-cemetery-baal-lukor':29,'wood-camp-stone-circle':30};
 if(e.id in expected)assert.equal(result.moves.length,expected[e.id]);
});


test('search finds an unnamed landmark using Russian case endings, word order, and pin fingerprints',()=>{
 const id='old-camp-abandoned-shack-chest';
 for(const query of ['сундук в заброшенной хижине возле старого лагеря','ХИЖИНА ЗАБРОШЕННАЯ','725516','7-2-5-5-1-6','7 2 5 5 1 6']) assert.ok(filterCatalog({query}).some(e=>e.id===id),query);
 assert.ok(!filterCatalog({query:'заброшенная хижина Фиска'}).some(e=>e.id===id),'all meaningful terms are required');
 assert.ok(filterCatalog({camp:'old',region:'old-camp-outskirts'}).some(e=>e.id===id));
 assert.match(catalog.find(e=>e.id===id).mapUrl,/planetofgothic\.de\/tools\/atlas\?poi=1890/);
});

test('catalog distinguishes key access, exact door types and unrelated similarly named objects',()=>{
 for(const id of ['lees-cave-entrance','captains-shipwreck-cabin','abandoned-gallery-entrance']) assert.equal(catalog.find(e=>e.id===id).type,'door',id);
 const santino=catalog.find(e=>e.id==='guide-santino');assert.equal(santino.region,'old-mine');
 assert.ok(!santino.locationSources.some(s=>s.url.endsWith('/blog/santino/')));
 assert.ok(filterCatalog({region:'ruined-tower'}).some(e=>e.id==='cavalorn-tower-door'));
 for(const entry of catalog){
  assert.ok(!entry.relatedIds?.includes(entry.id),entry.id+' self reference');
  if(entry.mapUrl)assert.ok(entry.mapUrl.startsWith('https://'));
  if(entry.access==='key'||entry.access==='unlocked')assert.ok(!readyRows.some(s=>s.entryId===entry.id),entry.id+' must not invent a lockpick solution');
 }
});


test('loot evidence distinguishes published lists, partial information, empty and unknown chests',()=>{
 for(const entry of catalog){
  if(entry.contents.length && ['chest','underwater'].includes(entry.type))assert.ok(entry.loot?.sources.length,entry.id+' needs direct loot provenance');
  if(!entry.loot)continue;
  assert.ok(['listed','partial','empty'].includes(entry.loot.coverage),entry.id);
  assert.match(entry.loot.reviewedAt,/^\d{4}-\d{2}-\d{2}$/);
  assert.ok(entry.loot.sources.length,entry.id);
  assert.equal(new Set(entry.loot.sources.map(s=>s.url)).size,entry.loot.sources.length);
  for(const source of entry.loot.sources)assert.equal(new URL(source.url).protocol,'https:');
  if(entry.loot.coverage==='empty'){assert.deepEqual(entry.contents,[]);assert.equal(entry.valuable,false);}
  else assert.ok(entry.contents.length,entry.id);
  assert.ok(!entry.contents.some(item=>/^Пусто(?:\s|$)/i.test(item)),entry.id+' empty is a status, not loot');
 }
 for(const status of ['listed','partial','empty'])assert.ok(catalog.some(e=>e.loot?.coverage===status));
 assert.ok(catalog.some(e=>e.type==='chest'&&!e.loot&&!e.contents.length));
});

test('loot stays attached to the correct floor, underwater route and mine storehouse',()=>{
 const entry=id=>catalog.find(e=>e.id===id);
 assert.ok(entry('tower-chest-first').contents.includes('Кусок руды × 26'));
 assert.ok(entry('tower-chest-second').contents.includes('Кольцо железной кожи × 1'));
 assert.ok(!entry('tower-chest-second').contents.some(item=>/меч/i.test(item)));
 assert.ok(!entry('silas-tavern-basement-chest').contents.some(item=>/Брана/.test(item)));
 assert.ok(entry('silas-storeroom-chest').contents.includes('Топор Брана'));
 assert.match(entry('silas-storeroom-chest').route,/справа от тела Брана/);
 assert.equal(entry('guide-santino').loot.coverage,'partial');
 assert.ok(!entry('guide-santino').contents.some(item=>/23|33/.test(item)));
 assert.ok(!entry('guide-rodriguez').contents.some(item=>/жизн/i.test(item)));
 for(const id of ['guide-alberto','alberto-mine-hut-chest','alberto-mine-upstairs-left-chest','alberto-mine-upstairs-right-chest']){
  assert.equal(entry(id).region,'old-mine');
  assert.ok(filterCatalog({query:'Альберто'}).some(e=>e.id===id));
 }
 assert.ok(!REGIONS.some(r=>r.id==='alberto-mine'));
});

test('loot search finds distinctive items without requiring the owner name',()=>{
 for(const [query,id] of [['кольцо железной кожи','tower-chest-second'],['топор Брана','silas-storeroom-chest'],['кольцо очищения','old-camp-abandoned-shack-chest']]){
  assert.ok(filterCatalog({query}).some(e=>e.id===id),query);
 }
 assert.ok(!filterCatalog({query:'топор Брана'}).some(e=>e.id==='silas-tavern-basement-chest'));
});
