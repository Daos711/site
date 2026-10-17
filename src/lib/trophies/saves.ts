import { fieldKey, readField, type EventInput, type TrackerEvent } from './events';

export const MAIN_SAVE = 'main';
const prefix = (saveId: string) => `save:${saveId}:`;
export function saveAddress<T extends { runId: string | null; entityId: string }>(input: T, runId: string, saveId: string): T {
  return input.runId === runId && saveId !== MAIN_SAVE ? { ...input, entityId: prefix(saveId) + input.entityId } : input;
}
export function listSaves(events: readonly TrackerEvent[], gameId: string, runId: string) {
  const ids = [...new Set(events.filter(e => e.gameId === gameId && e.runId === runId && e.entityId === 'saves').map(e => e.field))];
  return [{ id: MAIN_SAVE, name: 'Основное сохранение' }, ...ids.flatMap(id => {
    const cell = readField(events, { gameId, runId, entityId: 'saves', field: id });
    return typeof cell.value === 'string' && cell.value ? [{ id, name: cell.value }] : [];
  })];
}
export function activeSave(events: readonly TrackerEvent[], gameId: string, runId: string, deviceId?: string): string {
  const id = readField(events, { gameId, runId, entityId: 'save-selection', field: deviceId ? `active:${deviceId}` : 'active' }).value;
  return typeof id === 'string' && listSaves(events, gameId, runId).some(s => s.id === id) ? id : MAIN_SAVE;
}
function freezeTree<T>(value: T): T {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freezeTree(child); Object.freeze(value); }
  return value;
}
function immutableEvent(event: TrackerEvent, entityId = event.entityId): TrackerEvent {
  if (Object.isFrozen(event)) return entityId === event.entityId ? event : Object.freeze({ ...event, entityId });
  return freezeTree({ ...structuredClone(event), entityId });
}
/** A read-only projection; events retain their IDs/causal parents. Never export this view. */
export function saveView(events: readonly TrackerEvent[], gameId: string, runId: string, saveId: string): readonly TrackerEvent[] {
  return Object.freeze(events.flatMap(e => {
    if (e.gameId !== gameId || e.runId !== runId) return [immutableEvent(e)];
    if (e.entityId === 'saves' || e.entityId === 'save-selection') return [];
    if (saveId === MAIN_SAVE) return e.entityId.startsWith('save:') ? [] : [immutableEvent(e)];
    return e.entityId.startsWith(prefix(saveId)) ? [immutableEvent(e, e.entityId.slice(prefix(saveId).length))] : [];
  }));
}
export function selectSaveInput(gameId: string, runId: string, saveId: string, deviceId?: string): EventInput {
  return { gameId, runId, entityId: 'save-selection', field: deviceId ? `active:${deviceId}` : 'active', value: saveId };
}
export function forkSaveInputs(events: readonly TrackerEvent[], gameId: string, runId: string, fromSave: string, newId: string, name: string, deviceId?: string): EventInput[] {
  if (!/^[a-z0-9-]{1,64}$/.test(newId) || newId === MAIN_SAVE || listSaves(events, gameId, runId).some(s => s.id === newId)) throw new Error('Некорректный или уже существующий ID сохранения');
  if (!name.trim()) throw new Error('Укажите название сохранения');
  const view = saveView(events, gameId, runId, fromSave);
  const fields = new Map(view.filter(e => e.gameId === gameId && e.runId === runId).map(e => [fieldKey(e), e]));
  const inputs: EventInput[] = [];
  for (const e of fields.values()) {
    const cell = readField(view, e);
    if (cell.conflict || cell.incomplete) throw new Error('Сначала разрешите расхождения в текущем сохранении');
    if (cell.value === undefined) continue;
    inputs.push({ gameId, runId, entityId: prefix(newId) + e.entityId, field: e.field, value: cell.value, kind: cell.kind || 'set' });
  }
  inputs.push({ gameId, runId, entityId: 'saves', field: newId, value: name.trim().slice(0, 120) }, selectSaveInput(gameId, runId, newId, deviceId));
  return inputs;
}
