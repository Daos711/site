/** Manual observations only. A recorded action is never proof of a PSN award. */
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface FieldAddress { gameId: string; runId: string | null; entityId: string; field: string }
export interface TrackerEvent extends FieldAddress {
  id: string; deviceId: string; kind: 'set' | 'increment'; value: JsonValue;
  clock: number; parents: string[]; createdAt: string; undoOf?: string;
}
export interface EventInput extends FieldAddress { kind?: 'set' | 'increment'; value: JsonValue; undoOf?: string; basis?: string[] }
export interface FieldState {
  value: JsonValue | undefined; heads: TrackerEvent[]; conflict: boolean;
  alternatives: JsonValue[]; kind: 'set' | 'increment' | null; incomplete: boolean;
}
export interface TrackerExport { format: 'lab-trophies'; version: 1; exportedAt: string; events: TrackerEvent[] }
type Projection = { fields: Record<string, FieldState>; conflicts: string[] };
const projections = new WeakMap<readonly TrackerEvent[], Projection>();
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_KEYS = new Set(['id','deviceId','gameId','runId','entityId','field','kind','value','clock','parents','createdAt','undoOf']);
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
export function fieldKey(address: FieldAddress): string;
export function fieldKey(gameId: string, runId: string | null, entityId: string, field: string): string;
export function fieldKey(value: FieldAddress | string, runId?: string | null, entityId?: string, field?: string): string {
  const address = typeof value === 'string' ? { gameId: value, runId: runId ?? null, entityId, field } : value;
  return JSON.stringify([address.gameId, address.runId, address.entityId, address.field]);
}
export function stableJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + stableJson((value as Record<string, unknown>)[key])).join(',') + '}';
}
function validJson(value: unknown, depth = 0): boolean {
  if (depth > 16) return false;
  if (value === null || typeof value === 'boolean') return true;
  if (typeof value === 'string') return value.length <= 32768;
  if (typeof value === 'number') return Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER;
  if (Array.isArray(value)) return value.length <= 2048 && value.every(item => validJson(item, depth + 1));
  if (typeof value !== 'object' || !value || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) return false;
  return Object.keys(value).length <= 256 && Object.entries(value).every(([key, item]) => !['__proto__','constructor','prototype'].includes(key) && key.length <= 128 && validJson(item, depth + 1));
}
export function validateEvent(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return ['Событие должно быть объектом'];
  const event = value as Record<string, unknown>, errors: string[] = [];
  if (Object.keys(event).some(key => !EVENT_KEYS.has(key))) errors.push('Неизвестные поля события');
  for (const key of ['id','deviceId']) if (typeof event[key] !== 'string' || !UUID.test(event[key])) errors.push('Некорректный UUID: ' + key);
  if (typeof event.gameId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(event.gameId)) errors.push('Некорректная игра');
  if (event.runId !== null && (typeof event.runId !== 'string' || event.runId.length === 0 || event.runId.length > 128)) errors.push('Некорректное прохождение');
  for (const key of ['entityId','field']) if (typeof event[key] !== 'string' || !event[key].length || event[key].length > 256) errors.push('Некорректное поле: ' + key);
  if (!['set','increment'].includes(String(event.kind))) errors.push('Некорректный вид события');
  if (!own(event, 'value') || !validJson(event.value)) errors.push('Некорректное значение JSON');
  if (event.kind === 'increment' && (typeof event.value !== 'number' || !Number.isFinite(event.value))) errors.push('Приращение должно быть числом');
  if (!Number.isSafeInteger(event.clock) || Number(event.clock) < 1) errors.push('Некорректный логический счётчик');
  if (!Array.isArray(event.parents) || event.parents.length > 256 || event.parents.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(event.parents).size !== event.parents.length || event.parents.includes(event.id)) errors.push('Некорректные предшественники');
  if (event.kind === 'increment' && Array.isArray(event.parents) && event.parents.length) errors.push('Приращения не заменяют другие события');
  if (typeof event.createdAt !== 'string' || !Number.isFinite(Date.parse(event.createdAt)) || event.createdAt.length > 40) errors.push('Некорректная дата');
  if (event.undoOf !== undefined && (typeof event.undoOf !== 'string' || !UUID.test(event.undoOf) || event.undoOf === event.id)) errors.push('Некорректная отмена');
  if (!errors.length && stableJson(event).length > 65536) errors.push('Событие слишком большое');
  return errors;
}
export function mergeEvents(...collections: readonly (readonly TrackerEvent[])[]): TrackerEvent[] {
  const byId = new Map<string, TrackerEvent>();
  for (const events of collections) for (const event of events) {
    const errors = validateEvent(event);
    if (errors.length) throw new Error(errors.join('; '));
    const previous = byId.get(event.id);
    if (previous && stableJson(previous) !== stableJson(event)) throw new Error('Один ID содержит разные события: ' + event.id);
    byId.set(event.id, event);
  }
  const kinds = new Map<string, string>();
  for (const event of byId.values()) {
    const key = fieldKey(event);
    if (kinds.has(key) && kinds.get(key) !== event.kind) throw new Error('Счётчик и обычное значение смешаны в одном поле');
    kinds.set(key, event.kind);
    for (const id of event.parents) {
      const parent = byId.get(id);
      if (parent && (fieldKey(parent) !== fieldKey(event) || parent.kind !== event.kind || parent.clock >= event.clock)) throw new Error('Несовместимый предшественник события ' + event.id);
    }
    if (event.undoOf) {
      const original = byId.get(event.undoOf);
      if (original && (original.undoOf || fieldKey(original) !== fieldKey(event) || original.kind !== event.kind || original.clock >= event.clock || (event.kind === 'increment' && event.value !== -(original.value as number)) || (event.kind === 'set' && !event.parents.includes(original.id)))) throw new Error('Некорректная компенсация события ' + event.id);
    }
  }
  return [...byId.values()].sort((a, b) => a.clock - b.clock || a.id.localeCompare(b.id));
}
function resolveField(events: readonly TrackerEvent[]): FieldState {
  if (!events.length) return { value: undefined, heads: [], conflict: false, alternatives: [], kind: null, incomplete: false };
  const byId = new Map(events.map(event => [event.id, event]));
  const incomplete = events.some(event => event.parents.some(id => !byId.has(id)) || (event.undoOf && !byId.has(event.undoOf)));
  const kind = events[0].kind;
  if (events.some(event => event.kind !== kind)) return { value: undefined, heads: [...events], conflict: true, alternatives: events.map(event => event.value), kind: null, incomplete };
  if (kind === 'increment') {
    const undone = new Set<string>();
    let value = 0;
    for (const event of events) {
      if (event.undoOf) { if (undone.has(event.undoOf) || !byId.has(event.undoOf)) continue; undone.add(event.undoOf); }
      value += event.value as number;
    }
    const conflict = incomplete || !Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER;
    return { value: conflict ? undefined : value, heads: [...events], conflict, alternatives: conflict ? [] : [value], kind, incomplete };
  }
  const superseded = new Set(events.flatMap(event => event.parents));
  const heads = events.filter(event => !superseded.has(event.id));
  const alternatives = [...new Map(heads.map(event => [stableJson(event.value), event.value])).values()];
  const conflict = incomplete || alternatives.length > 1;
  return { value: conflict ? undefined : alternatives[0], heads, conflict, alternatives, kind, incomplete };
}
export function readField(events: readonly TrackerEvent[], address: FieldAddress): FieldState {
  if (Object.isFrozen(events)) return projectEvents(events).fields[fieldKey(address)] || resolveField([]);
  return resolveField(mergeEvents(events).filter(event => fieldKey(event) === fieldKey(address)));
}
export function projectEvents(events: readonly TrackerEvent[]): Projection {
  const cached = projections.get(events);
  if (cached) return cached;
  const grouped = new Map<string, TrackerEvent[]>();
  for (const event of mergeEvents(events)) { const key = fieldKey(event), group = grouped.get(key); if (group) group.push(event); else grouped.set(key, [event]); }
  const fields: Record<string, FieldState> = Object.create(null);
  for (const [key, values] of grouped) fields[key] = resolveField(values);
  const result = { fields, conflicts: Object.keys(fields).filter(key => fields[key].conflict) };
  // Only immutable storage snapshots can be cached. Local drafts are mutable.
  if (Object.isFrozen(events) && events.every(event => Object.isFrozen(event))) {
    for (const state of Object.values(fields)) { Object.freeze(state.heads); Object.freeze(state.alternatives); Object.freeze(state); }
    Object.freeze(fields); Object.freeze(result.conflicts); Object.freeze(result); projections.set(events, result);
  }
  return result;
}
export function createEvent(events: readonly TrackerEvent[], input: EventInput, options: { deviceId: string; clock?: number }): TrackerEvent {
  const state = readField(events, input), kind = input.kind || 'set';
  if (state.kind && state.kind !== kind) throw new Error('Счётчик и обычное значение должны храниться в разных полях');
  if (state.incomplete) throw new Error('Не все предшественники загружены. Сначала завершите синхронизацию.');
  const { basis, ...payload } = input;
  let parents = kind === 'set' ? state.heads.map(item => item.id) : [];
  if (basis !== undefined) {
    if (kind !== 'set' || !Array.isArray(basis) || basis.length > 256 || basis.some(id => typeof id !== 'string' || !UUID.test(id)) || new Set(basis).size !== basis.length) throw new Error('Некорректное основание редактирования');
    const byId = new Map(events.map(event => [event.id, event]));
    for (const id of basis) {
      const parent = byId.get(id);
      if (!parent || parent.kind !== 'set' || fieldKey(parent) !== fieldKey(input)) throw new Error('Основание редактирования должно ссылаться на известные события того же поля');
    }
    // Editors retain the heads seen before typing. New remote heads stay concurrent.
    parents = [...basis];
  }
  const event: TrackerEvent = { ...payload, kind, id: crypto.randomUUID(), deviceId: options.deviceId, clock: Math.max(options.clock || 0, ...events.map(item => item.clock), 0) + 1, parents, createdAt: new Date().toISOString() };
  mergeEvents(events, [event]);
  return event;
}
export function createUndoEvent(events: readonly TrackerEvent[], eventId: string, deviceId: string): TrackerEvent {
  const all = mergeEvents(events), target = all.find(event => event.id === eventId);
  if (!target || target.undoOf) throw new Error('Эту запись нельзя отменить; выберите новое значение или резервную копию.');
  if (all.some(event => event.undoOf === eventId)) throw new Error('Событие уже отменено');
  if (target.kind === 'increment') return createEvent(all, { ...target, value: -(target.value as number), undoOf: eventId }, { deviceId });
  const state = readField(all, target);
  if (!state.heads.some(event => event.id === target.id)) throw new Error('После этой записи поле изменялось. Восстановите нужное значение явно.');
  const ancestors = new Set<string>(), pending = [...target.parents];
  while (pending.length) { const id = pending.pop()!; if (ancestors.has(id)) continue; ancestors.add(id); const event = all.find(item => item.id === id); if (event) pending.push(...event.parents); }
  const previous = readField(all.filter(event => ancestors.has(event.id)), target);
  if (previous.conflict) throw new Error('До этой записи был конфликт. Выберите нужное значение явно.');
  const event = createEvent(all, { gameId: target.gameId, runId: target.runId, entityId: target.entityId, field: target.field, kind: 'set', value: previous.value ?? null, undoOf: eventId }, { deviceId });
  // Undo only this causal branch; concurrent edits remain visible as conflicts.
  event.parents = [target.id];
  return event;
}
export function parseImport(data: string | unknown): TrackerExport {
  if (typeof data === 'string' && data.length > 16 * 1024 * 1024) throw new Error('Файл превышает 16 МБ');
  const value = typeof data === 'string' ? JSON.parse(data) : data;
  if (!value || typeof value !== 'object' || value.format !== 'lab-trophies' || value.version !== 1 || !Array.isArray(value.events) || value.events.length > 50000 || typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))) throw new Error('Неподдерживаемый формат резервной копии');
  const events = mergeEvents(value.events);
  const projection = projectEvents(events);
  if (Object.values(projection.fields).some(field => field.incomplete)) throw new Error('В файле отсутствуют предшественники событий');
  return { format: 'lab-trophies', version: 1, exportedAt: value.exportedAt, events };
}
