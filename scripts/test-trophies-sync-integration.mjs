/** Local integration: production SDK/adapter/store + real PostgreSQL RLS.
 * OAuth identity and PostgREST HTTP transport are test fixtures; no cloud writes.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createClient } from '@supabase/supabase-js';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url), ts = require('typescript'), modules = new Map();
globalThis.indexedDB = indexedDB;
globalThis.IDBKeyRange = IDBKeyRange;
function load(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file).exports;
  const compiledModule = { exports: {} }; modules.set(file, compiledModule);
  const javascript = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  new Function('exports', 'require', 'module', javascript)(compiledModule.exports, name => name.startsWith('.') ? load(path.resolve(path.dirname(file), name + '.ts')) : require(name), compiledModule);
  return compiledModule.exports;
}
const { createTrackerStore } = load(path.join(root, 'src/lib/trophies/storage.ts'));
const { createSyncController, createSupabaseEventAdapter } = load(path.join(root, 'src/lib/trophies/sync.ts'));
const { readField } = load(path.join(root, 'src/lib/trophies/events.ts'));
const A = '11111111-1111-4111-8111-111111111111', B = '22222222-2222-4222-8222-222222222222';
const address = { gameId: 'gothic-1-remake', runId: null, entityId: 'counter-chests', field: 'count' };
const token = owner => Buffer.from('{"alg":"none"}').toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: owner, role: 'authenticated', exp: 4102444800 })).toString('base64url') + '.fixture';

async function server() {
  const db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); grant usage on schema auth to authenticated,anon; create function auth.uid() returns uuid language sql stable as $$ select (nullif(current_setting('request.jwt.claims',true),'')::jsonb ->> 'sub')::uuid $$;`);
  await db.query('insert into auth.users values ($1),($2)', [A, B]);
  await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations/202610170001_trophy_events.sql'), 'utf8'));
  let chain = Promise.resolve();
  const serial = task => { const result = chain.then(task); chain = result.catch(() => {}); return result; };
  const controls = { online: true, loseNextAcknowledgement: false, requests: 0 };
  const transport = async (input, options) => {
    if (!controls.online) throw new TypeError('Network unavailable (local test)');
    const request = new Request(input, options), url = new URL(request.url);
    assert.equal(url.origin, 'https://trophies-integration.invalid');
    assert.equal(url.pathname, '/rest/v1/trophy_events');
    const bearer = request.headers.get('authorization')?.replace(/^Bearer /, '');
    const owner = JSON.parse(Buffer.from(bearer.split('.')[1], 'base64url').toString()).sub;
    const body = request.method === 'POST' ? await request.json() : null;
    return serial(async () => {
      controls.requests++;
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: owner, role: 'authenticated' })]);
      await db.exec('set role authenticated');
      try {
        if (request.method === 'POST') {
          // PostgREST makes a bulk request atomic. Use the same semantics locally.
          await db.exec('begin');
          try {
            for (const row of body) await db.query('insert into public.trophy_events(owner_id,event_id,payload) values($1,$2,$3) on conflict(owner_id,event_id) do nothing', [row.owner_id, row.event_id, row.payload]);
            await db.exec('commit');
          } catch (error) { await db.exec('rollback'); throw error; }
          if (controls.loseNextAcknowledgement) { controls.loseNextAcknowledgement = false; throw new TypeError('Acknowledgement lost after commit'); }
          return new Response(null, { status: 201 });
        }
        assert.equal(request.method, 'GET');
        const ownerFilter = url.searchParams.get('owner_id');
        assert.ok(ownerFilter?.startsWith('eq.'));
        const values = [ownerFilter.slice(3)], clauses = ['owner_id=$1'];
        const eventFilter = url.searchParams.get('event_id');
        if (eventFilter?.startsWith('gt.')) { values.push(eventFilter.slice(3)); clauses.push('event_id>$' + values.length); }
        else if (eventFilter?.startsWith('in.(')) { values.push(eventFilter.slice(4, -1).split(',')); clauses.push('event_id=any($' + values.length + '::uuid[])'); }
        // Small page cap exercises the production adapter's pagination loop.
        const limit = eventFilter?.startsWith('in.') ? 100 : Math.min(Number(url.searchParams.get('limit') || 500), 3);
        values.push(limit);
        const data = await db.query('select event_id,payload from trophy_events where ' + clauses.join(' and ') + ' order by event_id limit $' + values.length, values);
        return Response.json(data.rows);
      } catch (error) {
        if (error instanceof TypeError) throw error;
        return Response.json({ message: error.message, code: error.code }, { status: error.code === '42501' ? 403 : 400 });
      }
    });
  };
  const client = (initialOwner = A) => {
    let owner = initialOwner;
    const value = createClient('https://trophies-integration.invalid', 'test-public-key', { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: transport } });
    value.auth.getSession = async () => ({ data: { session: { access_token: token(owner), user: { id: owner } } }, error: null });
    return { value, changeOwner: id => { owner = id; }, adapter: createSupabaseEventAdapter(value) };
  };
  return { db, controls, client, close: async () => { await chain; await db.close(); } };
}

test('two independent IndexedDB devices sync through the actual Supabase adapter and PostgreSQL RLS', async t => {
  const backend = await server();
  const stores = [], controllers = [];
  t.after(async () => { for (const controller of controllers) controller.dispose(); for (const store of stores) store.dispose(); await backend.close(); });
  const device = async (owner = A, databaseName = 'trophy-integration-' + crypto.randomUUID()) => {
    const store = createTrackerStore({ databaseName, workspaceId: 'user:' + owner });
    await store.init(); stores.push(store);
    const client = backend.client(owner);
    const controller = createSyncController(store, client.adapter, { ownerId: owner, retryMs: 30000, pollMs: 30000 });
    controllers.push(controller);
    return { store, client, controller, databaseName };
  };
  let phone = await device(), desktop = await device();

  await t.test('offline edits and outbox survive reload, concurrent counters converge without lost increments', async () => {
    backend.controls.online = false;
    await phone.store.dispatch({ ...address, kind: 'increment', value: 2 });
    await desktop.store.dispatch({ ...address, kind: 'increment', value: 3 });
    await phone.controller.sync();
    assert.equal(phone.store.getSnapshot().pendingIds.length, 1);
    phone.controller.dispose(); phone.store.dispose();
    phone = await device(A, phone.databaseName);
    assert.equal(readField(phone.store.getSnapshot().events, address).value, 2);
    assert.equal(phone.store.getSnapshot().pendingIds.length, 1);
    backend.controls.online = true;
    await phone.controller.sync(); await desktop.controller.sync(); await phone.controller.sync();
    assert.equal(readField(phone.store.getSnapshot().events, address).value, 5);
    assert.equal(readField(desktop.store.getSnapshot().events, address).value, 5);
    assert.equal(phone.store.getSnapshot().pendingIds.length, 0);
    assert.equal(desktop.store.getSnapshot().pendingIds.length, 0);
  });

  await t.test('concurrent notes remain conflicting until explicitly resolved, including after another reload', async () => {
    const note = { ...address, runId: 'first-playthrough', entityId: 'journal', field: 'text' };
    await phone.store.dispatch({ ...note, value: 'Initial note' });
    await phone.controller.sync(); await desktop.controller.sync();
    const phoneBasis = readField(phone.store.getSnapshot().events, note).heads.map(event => event.id);
    const desktopBasis = readField(desktop.store.getSnapshot().events, note).heads.map(event => event.id);
    backend.controls.online = false;
    await phone.store.dispatch({ ...note, value: 'Phone branch', basis: phoneBasis });
    await desktop.store.dispatch({ ...note, value: 'Desktop branch', basis: desktopBasis });
    backend.controls.online = true;
    await phone.controller.sync(); await desktop.controller.sync(); await phone.controller.sync();
    assert.equal(readField(phone.store.getSnapshot().events, note).conflict, true);
    assert.deepEqual(new Set(readField(desktop.store.getSnapshot().events, note).alternatives), new Set(['Phone branch', 'Desktop branch']));
    phone.controller.dispose(); phone.store.dispose(); phone = await device(A, phone.databaseName);
    assert.equal(readField(phone.store.getSnapshot().events, note).conflict, true);
    await phone.store.dispatch({ ...note, value: 'Combined after review' });
    await phone.controller.sync(); await desktop.controller.sync();
    assert.equal(readField(desktop.store.getSnapshot().events, note).conflict, false);
    assert.equal(readField(desktop.store.getSnapshot().events, note).value, 'Combined after review');
  });

  await t.test('lost acknowledgement is recovered by a full paginated pull without duplicate server events', async () => {
    const input = { ...address, entityId: 'lesson-diving', field: 'observed', value: true };
    const event = await phone.store.dispatch(input);
    backend.controls.loseNextAcknowledgement = true;
    await phone.controller.sync();
    assert.ok(phone.store.getSnapshot().pendingIds.includes(event.id));
    await phone.controller.sync(); await desktop.controller.sync();
    assert.equal(phone.store.getSnapshot().pendingIds.length, 0);
    assert.equal(readField(desktop.store.getSnapshot().events, input).value, true);
    const rows = await phone.client.adapter.pullAll(A);
    assert.equal(rows.filter(row => row.id === event.id).length, 1);
    assert.ok(rows.length > 3, 'real SQL pagination covered');
  });

  await t.test('a second account cannot read or write the first account; stale controllers stop on identity change', async () => {
    const other = await device(B);
    await other.controller.sync();
    assert.equal(other.store.getSnapshot().events.length, 0);
    assert.deepEqual(await other.client.adapter.pullAll(A), []);
    await assert.rejects(other.client.adapter.push(A, [phone.store.getSnapshot().events[0]]), /row-level security|permission denied/);
    const otherField = { ...address, entityId: 'private-note', field: 'text', value: 'Only account B' };
    await other.store.dispatch(otherField); await other.controller.sync();
    assert.equal((await other.client.adapter.pullAll(B)).length, 1);
    assert.equal((await phone.client.adapter.pullAll(A)).some(event => event.entityId === 'private-note'), false);
    const pending = await phone.store.dispatch({ ...address, kind: 'increment', value: 1 });
    phone.client.changeOwner(B);
    await phone.controller.sync();
    assert.ok(phone.store.getSnapshot().pendingIds.includes(pending.id));
    assert.equal(phone.store.getSnapshot().sync.status, 'error');
    assert.equal(readField(phone.store.getSnapshot().events, otherField).value, undefined);
    phone.client.changeOwner(A);
    await phone.controller.sync();
    assert.equal(phone.store.getSnapshot().pendingIds.length, 0);
  });
});
