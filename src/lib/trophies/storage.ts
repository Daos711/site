import { createEvent, createUndoEvent, fieldKey, mergeEvents, parseImport, projectEvents, stableJson } from './events';
import type { EventInput, TrackerEvent, TrackerExport } from './events';

export interface SyncState { status: 'idle' | 'syncing' | 'synced' | 'offline' | 'error'; lastSyncedAt: string | null; error: string | null }
export interface TrackerSnapshot {
  workspaceId: string; status: 'loading' | 'ready' | 'error'; events: readonly TrackerEvent[];
  pendingIds: readonly string[]; deviceId: string; error: string | null; sync: SyncState;
}
export interface LocalBackup { id: string; createdAt: string; reason: string; events: TrackerEvent[] }
interface WorkspaceRecord { version: 1; workspaceId: string; events: TrackerEvent[]; pendingIds: string[]; backups: LocalBackup[] }
export interface TrackerStore {
  init(): Promise<void>; getSnapshot(): TrackerSnapshot; subscribe(listener: () => void): () => void;
  dispatch(input: EventInput): Promise<TrackerEvent>; batchDispatch(inputs: EventInput[]): Promise<TrackerEvent[]>;
  undo(eventId: string): Promise<TrackerEvent>; undoBatch(eventIds: readonly string[]): Promise<TrackerEvent[]>; exportData(): TrackerExport;
  importData(data: unknown, options?: { mode: 'merge' }): Promise<number>;
  listBackups(): Promise<LocalBackup[]>; restoreBackup(id: string): Promise<number>;
  mergeRemote(events: TrackerEvent[]): Promise<void>; acknowledge(ids: string[]): Promise<void>;
  setSyncState(state: Partial<SyncState>): void; getEpoch(): number; isActive(): boolean; dispose(): void;
}
function frozen<T>(value: T): T {
  if (value && typeof value === 'object') { Object.freeze(value); for (const child of Object.values(value)) if (child && typeof child === 'object' && !Object.isFrozen(child)) frozen(child); }
  return value;
}
const clone = <T>(value: T): T => structuredClone(value);
const request = <T>(value: IDBRequest<T>): Promise<T> => new Promise((resolve, reject) => { value.onsuccess = () => resolve(value.result); value.onerror = () => reject(value.error); });
class StorageIntegrityError extends Error {}
function readRecord(value: unknown, workspaceId: string): WorkspaceRecord {
  if (value === undefined) return { version: 1, workspaceId, events: [], pendingIds: [], backups: [] };
  const row = value as WorkspaceRecord;
  if (!row || row.version !== 1 || row.workspaceId !== workspaceId || !Array.isArray(row.events) || !Array.isArray(row.pendingIds) || !Array.isArray(row.backups)) throw new StorageIntegrityError('Локальные данные повреждены или имеют более новую версию. Исходная запись сохранена.');
  let events: TrackerEvent[];
  try { events = mergeEvents(row.events); } catch { throw new StorageIntegrityError('Локальный журнал повреждён. Исходная запись сохранена.'); }
  const ids = new Set(events.map(event => event.id));
  if (row.pendingIds.some(id => !ids.has(id))) throw new StorageIntegrityError('Очередь сохранения повреждена. Исходная запись сохранена.');
  return { ...row, events, pendingIds: [...new Set(row.pendingIds)] };
}
function backup(row: WorkspaceRecord, reason: string): void {
  row.backups.push({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), reason, events: clone(row.events) });
  row.backups = row.backups.slice(-10);
}
export function createTrackerStore(options: { workspaceId: string; databaseName?: string }): TrackerStore {
  const { workspaceId } = options, databaseName = options.databaseName || 'lab-trophies-v1';
  if (workspaceId !== 'guest' && !/^user:[0-9a-f-]{36}$/i.test(workspaceId)) throw new Error('Некорректное пространство данных');
  let snapshot: TrackerSnapshot = frozen({ workspaceId, status: 'loading', events: [], pendingIds: [], deviceId: '', error: null, sync: { status: 'idle', lastSyncedAt: null, error: null } });
  let db: IDBDatabase | null = null, initializing: Promise<void> | null = null, epoch = 0, active = false;
  let channel: BroadcastChannel | null = null;
  const listeners = new Set<() => void>(), transactions = new Set<IDBTransaction>();
  const wakeKey = databaseName + ':wake:' + workspaceId;
  const emit = (patch: Partial<TrackerSnapshot>) => { snapshot = frozen({ ...snapshot, ...patch }); for (const listener of listeners) listener(); };
  const check = (token: number) => { if (!active || token !== epoch) throw new Error('Пространство данных закрыто или аккаунт изменён'); };
  const publish = (row: WorkspaceRecord) => emit({ status: 'ready', events: clone(row.events), pendingIds: [...row.pendingIds], error: null });
  const notify = () => {
    channel?.postMessage({ workspaceId });
    try { if (typeof localStorage !== 'undefined') localStorage.setItem(wakeKey, crypto.randomUUID()); } catch { /* IDB is authoritative; this optional wake is not a save. */ }
  };
  const reload = async () => {
    const token = epoch;
    if (!db || !active) return;
    try { const value = await request(db.transaction('workspaces').objectStore('workspaces').get(workspaceId)); check(token); publish(readRecord(value, workspaceId)); }
    catch (error) { if (active && token === epoch) emit({ status: 'error', error: String(error) }); }
  };
  const onStorage = (event: StorageEvent) => { if (event.key === wakeKey) void reload(); };
  async function mutate<T>(operation: (row: WorkspaceRecord) => T): Promise<T> {
    if (!active) throw new Error('Сначала откройте пространство данных');
    const token = epoch; await store.init(); check(token);
    return new Promise<T>((resolve, reject) => {
      const transaction = db!.transaction('workspaces', 'readwrite'); transactions.add(transaction);
      const bucket = transaction.objectStore('workspaces'), get = bucket.get(workspaceId);
      let result: T, updated: WorkspaceRecord, failure: unknown;
      get.onsuccess = () => {
        try { check(token); updated = readRecord(get.result, workspaceId); result = operation(updated); bucket.put(updated); }
        catch (error) { failure = error; transaction.abort(); }
      };
      transaction.oncomplete = () => {
        transactions.delete(transaction);
        try { check(token); publish(updated); notify(); resolve(result); } catch (error) { reject(error); }
      };
      transaction.onabort = transaction.onerror = () => {
        transactions.delete(transaction);
        const error = failure || transaction.error || new Error('Локальная запись не сохранена');
        if (active && token === epoch) emit({ status: error instanceof StorageIntegrityError ? 'error' : 'ready', error: String(error) });
        reject(error);
      };
    });
  }
  function append(row: WorkspaceRecord, inputs: EventInput[]): TrackerEvent[] {
    const added: TrackerEvent[] = [];
    for (const input of inputs) { const event = createEvent(row.events, input, { deviceId: snapshot.deviceId }); row.events.push(event); added.push(event); }
    row.events = mergeEvents(row.events); row.pendingIds.push(...added.map(event => event.id));
    return clone(added);
  }
  const store: TrackerStore = {
    init() {
      if (active && db) return Promise.resolve();
      if (initializing) return initializing;
      active = true; const token = ++epoch;
      initializing = (async () => {
        if (typeof indexedDB === 'undefined') throw new Error('IndexedDB недоступна. Изменения не будут считаться сохранёнными.');
        const opening = indexedDB.open(databaseName, 1);
        opening.onupgradeneeded = () => { const database = opening.result; database.createObjectStore('workspaces', { keyPath: 'workspaceId' }); database.createObjectStore('meta'); };
        const opened = await request(opening);
        if (!active || epoch !== token) { opened.close(); throw new Error('Инициализация отменена'); }
        db = opened;
        db.onversionchange = () => { store.dispose(); emit({ status: 'error', error: 'Обновилась схема хранения. Перезагрузите страницу после завершения других вкладок.' }); };
        const transaction = db.transaction(['meta','workspaces'], 'readwrite');
        const meta = transaction.objectStore('meta'), device = meta.get('deviceId'), current = transaction.objectStore('workspaces').get(workspaceId);
        let deviceId = '';
        device.onsuccess = () => { deviceId = device.result || crypto.randomUUID(); if (!device.result) meta.put(deviceId, 'deviceId'); };
        await new Promise<void>((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = transaction.onabort = () => reject(transaction.error); });
        check(token); const row = readRecord(current.result, workspaceId); emit({ deviceId }); publish(row);
        if (typeof BroadcastChannel !== 'undefined') { channel = new BroadcastChannel(databaseName + ':' + workspaceId); channel.onmessage = () => { void reload(); }; }
        if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      })().catch(error => { if (active && epoch === token) { db?.close(); db = null; emit({ status: 'error', error: String(error) }); } throw error; }).finally(() => { if (epoch === token) initializing = null; });
      return initializing;
    },
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async dispatch(input) { return (await mutate(row => append(row, [input])))[0]; },
    batchDispatch(inputs) { return mutate(row => { if (inputs.length > 1) backup(row, 'Перед групповым изменением'); return append(row, inputs); }); },
    undo(eventId) { return mutate(row => { const event = createUndoEvent(row.events, eventId, snapshot.deviceId); row.events.push(event); row.pendingIds.push(event.id); return clone(event); }); },
    undoBatch(eventIds) {
      const ids = [...eventIds];
      return mutate(row => {
        if (!ids.length || ids.length > 256 || new Set(ids).size !== ids.length) throw new Error('Некорректный список изменений для отмены');
        if (ids.length > 1) backup(row, 'Перед отменой действия');
        const added: TrackerEvent[] = [];
        for (const id of ids) {
          const event = createUndoEvent(row.events, id, snapshot.deviceId);
          row.events.push(event); added.push(event);
        }
        row.events = mergeEvents(row.events);
        row.pendingIds.push(...added.map(event => event.id));
        return clone(added);
      });
    },
    exportData() { return { format: 'lab-trophies', version: 1, exportedAt: new Date().toISOString(), events: clone([...snapshot.events]) }; },
    importData(data, importOptions = { mode: 'merge' }) {
      const parsed = parseImport(data);
      if (importOptions.mode !== 'merge') return Promise.reject(new Error('Доступен только импорт с сохранением истории'));
      return mutate(row => {
        const known = new Set(row.events.map(event => event.id)), merged = mergeEvents(row.events, parsed.events);
        backup(row, 'Перед импортом JSON'); row.events = merged;
        const newIds = merged.filter(event => !known.has(event.id)).map(event => event.id); row.pendingIds.push(...newIds);
        return newIds.length;
      });
    },
    async listBackups() { if (!active) throw new Error('Пространство данных закрыто'); const token = epoch; await store.init(); check(token); const row = readRecord(await request(db!.transaction('workspaces').objectStore('workspaces').get(workspaceId)), workspaceId); check(token); return clone(row.backups).reverse(); },
    restoreBackup(id) {
      return mutate(row => {
        const selected = row.backups.find(item => item.id === id);
        if (!selected) throw new Error('Резервная копия не найдена');
        const before = projectEvents(row.events), target = projectEvents(selected.events), inputs: EventInput[] = [];
        for (const key of new Set([...Object.keys(before.fields), ...Object.keys(target.fields)])) {
          const old = before.fields[key], wanted = target.fields[key];
          if (wanted?.conflict || wanted?.incomplete) throw new Error('В копии есть конфликт. Выберите значения вручную.');
          const event = row.events.find(item => fieldKey(item) === key)!;
          if (old?.kind === 'increment' || wanted?.kind === 'increment') {
            if (old?.conflict) throw new Error('Сначала разрешите конфликт счётчика');
            const difference = Number(wanted?.value ?? 0) - Number(old?.value ?? 0);
            if (difference) inputs.push({ gameId: event.gameId, runId: event.runId, entityId: event.entityId, field: event.field, kind: 'increment', value: difference });
          } else if (old?.conflict || stableJson(old?.value ?? null) !== stableJson(wanted?.value ?? null)) inputs.push({ gameId: event.gameId, runId: event.runId, entityId: event.entityId, field: event.field, value: wanted?.value ?? null });
        }
        backup(row, 'Перед восстановлением копии'); return append(row, inputs).length;
      });
    },
    mergeRemote(events) { return mutate(row => { row.events = mergeEvents(row.events, events); }); },
    acknowledge(ids) { const accepted = new Set(ids); return mutate(row => { row.pendingIds = row.pendingIds.filter(id => !accepted.has(id)); }); },
    setSyncState(state) { if (active) emit({ sync: { ...snapshot.sync, ...state } }); },
    getEpoch: () => epoch, isActive: () => active && !!db,
    dispose() { active = false; epoch++; initializing = null; for (const transaction of transactions) { try { transaction.abort(); } catch { /* already committed */ } } transactions.clear(); db?.close(); db = null; channel?.close(); channel = null; if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage); },
  };
  return store;
}
