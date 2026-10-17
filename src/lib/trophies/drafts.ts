import { UUID } from './events';

interface DraftRecord { version: 1; id: string; value: string; basis: string[]; revision: number }
export interface DraftSnapshot { text: string; ready: boolean; dirty: boolean; pending: boolean; phase: 'idle' | 'dirty' | 'saving' | 'saved' | 'error'; error: string | null; recoveryError: string | null }
export interface DraftController {
  init(): void; dispose(): void; edit(text: string): void; flush(): Promise<void>;
  updateSource(value: string, heads: string[], save: (value: string, basis: string[]) => Promise<string>): void;
  hasUnsaved(): boolean; subscribe(listener: () => void): () => void; getSnapshot(): DraftSnapshot;
}
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function createDraftController(options: {
  storageKey: string; value: string; heads: string[]; save: (value: string, basis: string[]) => Promise<string>;
  storage?: DraftStorage; delayMs?: number;
}): DraftController {
  const key = 'lab-trophies:draft:' + options.storageKey;
  let sourceValue = options.value, sourceHeads = [...options.heads], save = options.save;
  let draft: DraftRecord | null = null, written: string | null = null, initialized = false, active = false;
  let timer: ReturnType<typeof setTimeout> | null = null, pending: Promise<void> | null = null;
  let snapshot: DraftSnapshot = Object.freeze({ text: options.value, ready: false, dirty: false, pending: false, phase: 'idle', error: null, recoveryError: null });
  const listeners = new Set<() => void>();
  const storage = () => options.storage || globalThis.localStorage;
  const publish = (patch: Partial<DraftSnapshot>) => { snapshot = Object.freeze({ ...snapshot, ...patch }); for (const listener of listeners) listener(); };
  const cancelTimer = () => { if (timer !== null) clearTimeout(timer); timer = null; };
  const persist = () => {
    if (!draft) return;
    try { const value = JSON.stringify(draft); storage().setItem(key, value); written = value; if (snapshot.recoveryError) publish({ recoveryError: null }); }
    catch { publish({ recoveryError: 'Не удалось сохранить запасной черновик в браузере. Не закрывайте страницу до завершения записи.' }); }
  };
  const clearPersisted = () => {
    try { if (written !== null && storage().getItem(key) === written) storage().removeItem(key); written = null; }
    catch { /* A stale draft is safer than removing another editor's newer text. */ }
  };
  const schedule = () => {
    cancelTimer();
    if (active && draft && !pending && snapshot.phase !== 'error') timer = setTimeout(() => { timer = null; void controller.flush(); }, options.delayMs ?? 400);
  };
  const controller: DraftController = {
    init() {
      active = true;
      if (!initialized) {
        initialized = true;
        try {
          const raw = storage().getItem(key);
          if (raw !== null) {
            const value: unknown = JSON.parse(raw);
            const candidate = value as DraftRecord;
            if (!candidate || candidate.version !== 1 || !UUID.test(candidate.id) || typeof candidate.value !== 'string' || candidate.value.length > 32768 || !Array.isArray(candidate.basis) || candidate.basis.length > 256 || candidate.basis.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(candidate.basis).size !== candidate.basis.length || !Number.isSafeInteger(candidate.revision) || candidate.revision < 1) throw new Error('Некорректный черновик');
            draft = { version: 1, id: candidate.id, value: candidate.value, basis: [...candidate.basis], revision: candidate.revision };
            written = raw;
            publish({ text: draft.value, dirty: true, phase: 'dirty' });
          }
        } catch { publish({ recoveryError: 'Не удалось прочитать запасной черновик. Его исходная запись сохранена в браузере.' }); }
        publish({ ready: true });
      }
      schedule();
    },
    updateSource(value, heads, nextSave) {
      sourceValue = value; sourceHeads = [...heads]; save = nextSave;
      if (!draft && !pending && snapshot.text !== value) publish({ text: value, phase: 'idle' });
    },
    edit(text) {
      if (!active || !snapshot.ready) return;
      draft = draft
        ? { ...draft, value: text, revision: draft.revision + 1 }
        : { version: 1, id: crypto.randomUUID(), value: text, basis: [...sourceHeads], revision: 1 };
      publish({ text, dirty: true, phase: pending ? 'saving' : 'dirty', error: null });
      persist(); schedule();
    },
    flush() {
      cancelTimer();
      if (pending) return pending;
      if (!active || !draft) return Promise.resolve();
      const submitted = { ...draft, basis: [...draft.basis] }, submit = save;
      publish({ pending: true, phase: 'saving', error: null });
      pending = Promise.resolve().then(() => submit(submitted.value, submitted.basis)).then(id => {
        if (!UUID.test(id)) throw new Error('Запись не подтверждена хранилищем');
        if (!draft || draft.id !== submitted.id) return;
        if (draft.revision === submitted.revision) {
          clearPersisted(); draft = null;
          // The parent may still be rendering the previous authoritative value.
          // Retain the submitted text when the field now has concurrent heads.
          const text = sourceHeads.length === 1 && sourceHeads[0] === id ? sourceValue : submitted.value;
          publish({ text, dirty: false, phase: 'saved', error: null, recoveryError: null });
        } else {
          draft = { ...draft, basis: [id] };
          persist(); publish({ dirty: true, phase: 'dirty', error: null });
        }
      }).catch(error => {
        publish({ dirty: !!draft, phase: 'error', error: error instanceof Error ? error.message : 'Не удалось сохранить текст' });
      }).finally(() => {
        pending = null; publish({ pending: false }); schedule();
      });
      return pending;
    },
    hasUnsaved: () => !!draft || !!pending,
    getSnapshot: () => snapshot,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    dispose() { active = false; cancelTimer(); },
  };
  return controller;
}
