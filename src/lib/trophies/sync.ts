import type { SupabaseClient } from '@supabase/supabase-js';
import { mergeEvents, stableJson, UUID } from './events';
import type { TrackerEvent } from './events';
import type { TrackerStore } from './storage';

export interface EventAdapter {
  getOwnerId(): Promise<string | null>;
  pullAll(ownerId: string): Promise<TrackerEvent[]>;
  push(ownerId: string, events: TrackerEvent[]): Promise<string[]>;
}
const TABLE = 'trophy_events';
export function createSupabaseEventAdapter(client: SupabaseClient): EventAdapter {
  return {
    async getOwnerId() {
      const { data, error } = await client.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session?.user.id || null;
    },
    async pullAll(ownerId) {
      let cursor: string | null = null;
      const events: TrackerEvent[] = [];
      // Rescan from the beginning on every sync. UUID order is pagination only,
      // never a permanent watermark: concurrent late commits are found next time.
      for (;;) {
        let query = client.from(TABLE).select('event_id,payload').eq('owner_id', ownerId).order('event_id', { ascending: true }).limit(500);
        if (cursor) query = query.gt('event_id', cursor);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        if (!data?.length) break;
        for (const row of data) {
          if (row.payload?.id !== row.event_id) throw new Error('ID серверного события не совпадает с содержимым');
          events.push(row.payload as TrackerEvent);
        }
        if (events.length > 50000) throw new Error('Слишком много событий; экспортируйте историю перед продолжением');
        cursor = data[data.length - 1].event_id;
        // Do not stop on a short page: Supabase's configured row cap may be lower.
      }
      return mergeEvents(events);
    },
    async push(ownerId, events) {
      const accepted: string[] = [];
      for (let start = 0; start < events.length; start += 100) {
        const batch = mergeEvents(events.slice(start, start + 100));
        const { error } = await client.from(TABLE).upsert(batch.map(event => ({ owner_id: ownerId, event_id: event.id, payload: event })), { onConflict: 'owner_id,event_id', ignoreDuplicates: true });
        if (error) throw new Error(error.message);
        const { data, error: readError } = await client.from(TABLE).select('event_id,payload').eq('owner_id', ownerId).in('event_id', batch.map(event => event.id));
        if (readError) throw new Error(readError.message);
        const actual = new Map((data || []).map(row => [row.event_id, row.payload]));
        for (const event of batch) {
          if (!actual.has(event.id) || stableJson(actual.get(event.id)) !== stableJson(event)) throw new Error('Сервер не подтвердил точное содержимое события ' + event.id);
          accepted.push(event.id);
        }
      }
      return accepted;
    },
  };
}
export interface SyncController { sync(): Promise<void>; dispose(): void }
export function createSyncController(store: TrackerStore, adapter: EventAdapter, options: { ownerId: string; retryMs?: number; pollMs?: number }): SyncController {
  if (!UUID.test(options.ownerId) || store.getSnapshot().workspaceId !== 'user:' + options.ownerId) throw new Error('Аккаунт не соответствует локальному пространству');
  let disposed = false, running: Promise<void> | null = null, retry: ReturnType<typeof setTimeout> | null = null, retryCount = 0;
  let previousPending = store.getSnapshot().pendingIds.join(',');
  const epoch = store.getEpoch();
  const guard = () => { if (disposed || !store.isActive() || store.getEpoch() !== epoch || store.getSnapshot().workspaceId !== 'user:' + options.ownerId) throw new Error('Синхронизация остановлена при смене аккаунта'); };
  const accountGuard = async () => { guard(); if (await adapter.getOwnerId() !== options.ownerId) throw new Error('Войдите в тот же аккаунт, которому принадлежат эти данные'); guard(); };
  const schedule = (delay: number) => { if (disposed || retry) return; retry = setTimeout(() => { retry = null; void controller.sync(); }, delay); };
  const unsubscribe = store.subscribe(() => {
    const pending = store.getSnapshot().pendingIds.join(',');
    if (pending !== previousPending) { previousPending = pending; if (pending) schedule(250); }
  });
  const onOnline = () => { if (retry) { clearTimeout(retry); retry = null; } void controller.sync(); };
  const onOffline = () => { if (!disposed) store.setSyncState({ status: 'offline', error: null }); };
  if (typeof window !== 'undefined') { window.addEventListener('online', onOnline); window.addEventListener('focus', onOnline); window.addEventListener('offline', onOffline); }
  const interval = setInterval(() => { void controller.sync(); }, options.pollMs || 30000);
  const controller: SyncController = {
    sync() {
      if (disposed) return Promise.resolve();
      if (running) return running;
      running = (async () => {
        guard();
        if (typeof navigator !== 'undefined' && navigator.onLine === false) { store.setSyncState({ status: 'offline', error: null }); return; }
        await accountGuard(); store.setSyncState({ status: 'syncing', error: null });
        const remote = await adapter.pullAll(options.ownerId); await accountGuard();
        await store.mergeRemote(remote); guard();
        // A completed pull also recovers an upload whose acknowledgement was lost.
        const remoteIds = new Set(remote.map(event => event.id));
        await store.acknowledge(store.getSnapshot().pendingIds.filter(id => remoteIds.has(id))); guard();
        const state = store.getSnapshot(), pending = new Set(state.pendingIds);
        const batch = state.events.filter(event => pending.has(event.id));
        if (batch.length) {
          await accountGuard(); const accepted = await adapter.push(options.ownerId, [...batch]); await accountGuard();
          const allowed = new Set(batch.map(event => event.id));
          if (accepted.some(id => !allowed.has(id))) throw new Error('Сервер подтвердил неизвестную запись');
          await store.acknowledge(accepted); guard();
          if (accepted.length !== batch.length) throw new Error('Не все записи подтверждены сервером');
        }
        const after = await adapter.pullAll(options.ownerId); await accountGuard(); await store.mergeRemote(after); guard();
        retryCount = 0;
        const morePending = store.getSnapshot().pendingIds.length > 0;
        store.setSyncState({ status: morePending ? 'idle' : 'synced', lastSyncedAt: new Date().toISOString(), error: null });
        if (morePending) schedule(250);
      })().catch(error => {
        if (!disposed && store.isActive() && store.getEpoch() === epoch) {
          const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
          store.setSyncState({ status: offline ? 'offline' : 'error', error: String(error) });
          schedule(Math.min(30000, (options.retryMs || 1000) * 2 ** Math.min(retryCount++, 5)));
        }
      }).finally(() => { running = null; });
      return running;
    },
    dispose() {
      disposed = true; unsubscribe(); clearInterval(interval); if (retry) clearTimeout(retry);
      if (typeof window !== 'undefined') { window.removeEventListener('online', onOnline); window.removeEventListener('focus', onOnline); window.removeEventListener('offline', onOffline); }
    },
  };
  return controller;
}
