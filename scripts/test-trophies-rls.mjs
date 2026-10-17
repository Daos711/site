/** Real local PostgreSQL/WASM; no network, cloud keys or production migration. */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require=createRequire(import.meta.url);
const {PGlite}=process.env.TROPHY_TEST_RUNTIME?require(path.join(process.env.TROPHY_TEST_RUNTIME,'node_modules/@electric-sql/pglite')):require('@electric-sql/pglite');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sql=await fs.readFile(path.join(root,'supabase/migrations/202610170001_trophy_events.sql'),'utf8');
const db=new PGlite();
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const event=(id=crypto.randomUUID())=>({id,deviceId:A,gameId:'gothic-1-remake',runId:null,entityId:'lesson.diving',field:'learned',kind:'set',value:true,clock:1,parents:[],createdAt:'2026-10-17T00:00:00.000Z'});
const labels=[];const pass=label=>{labels.push(label);console.log('PASS '+label);};
async function as(role,owner){await db.exec('reset role');await db.query("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:owner,role})]);await db.exec('set role '+role);}
async function insert(owner,value){return db.query('insert into public.trophy_events(owner_id,event_id,payload) values ($1,$2,$3)',[owner,value.id,value]);}
try{
 await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); grant usage on schema auth to authenticated,anon; create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid $$;`);
 await db.query('insert into auth.users values ($1),($2)',[A,B]);await db.exec(sql);
 await as('authenticated',A);const a=event();await insert(A,a);assert.equal((await db.query('select count(*)::int n from trophy_events')).rows[0].n,1);pass('Owner A inserts and reads own event');
 await assert.rejects(insert(B,event()),error=>error.code==='42501');pass('Authenticated owner cannot spoof another owner_id');
 await as('authenticated',B);assert.equal((await db.query('select * from trophy_events')).rows.length,0);const b=event();await insert(B,b);assert.deepEqual((await db.query('select owner_id from trophy_events')).rows.map(row=>row.owner_id),[B]);pass('Owner B cannot read A and sees only own rows');
 await assert.rejects(db.exec("update trophy_events set payload=jsonb_set(payload,'{value}','false')"),error=>error.code==='42501');await assert.rejects(db.exec('delete from trophy_events'),error=>error.code==='42501');pass('UPDATE and DELETE denied even for owner');
 await as('anon',null);await assert.rejects(db.exec('select * from trophy_events'),error=>error.code==='42501');await assert.rejects(insert(A,event()),error=>error.code==='42501');pass('Anonymous role cannot read or insert');
 await as('authenticated',null);assert.equal((await db.query('select * from trophy_events')).rows.length,0);await assert.rejects(insert(A,event()),error=>error.code==='42501');pass('Missing JWT subject grants no access');
 await as('authenticated',A);await db.query('insert into trophy_events(owner_id,event_id,payload) values($1,$2,$3) on conflict(owner_id,event_id) do nothing',[A,a.id,{...a,value:false}]);assert.equal((await db.query('select payload from trophy_events where event_id=$1',[a.id])).rows[0].payload.value,true);pass('Idempotent insert cannot overwrite an existing event');
 await assert.rejects(insert(A,{...event(),id:b.id,clock:0}),error=>error.code==='23514');const invalid=event();invalid.value=Infinity; // JSON conversion changes Infinity to null; increment must reject it.
 invalid.kind='increment';await assert.rejects(insert(A,invalid),error=>error.code==='23514');pass('Database rejects malformed event clock and counter values');
 await db.exec('reset role');assert.equal((await db.query('select count(*)::int n from trophy_events')).rows[0].n,2);pass('Security checks did not alter either owner history');
 console.log(JSON.stringify({passed:labels.length,engine:'PGlite PostgreSQL WASM',productionTouched:false,checks:labels}));
}finally{await db.close();}
