import { readField, type EventInput, type FieldAddress, type TrackerEvent } from './events';
import { MAIN_SAVE, saveAddress } from './saves';

/** Lesson/map observations only. This helper never confirms a PSN trophy. */
export interface CompletionTarget {
  gameId: string;
  runId: string;
  saveId?: string;
  itemId: string;
}
export type CompletionMode = 'confirm' | 'mistake' | 'loaded-earlier-save';
export interface CompletionState {
  currentDone: boolean;
  historyRecorded: boolean;
  needsReconciliation: boolean;
  conflict: boolean;
  currentConflict: boolean;
  historyConflict: boolean;
}

function addresses(target: CompletionTarget): { current: FieldAddress; history: FieldAddress } {
  if (!target.runId || !target.itemId || target.itemId.startsWith('save:')) throw new Error('Укажите прохождение и исходный ID урока или карты');
  const current = saveAddress({ gameId: target.gameId, runId: target.runId, entityId: target.itemId, field: 'status' }, target.runId, target.saveId || MAIN_SAVE);
  const history = { gameId: target.gameId, runId: null, entityId: target.itemId, field: 'observed' };
  return { current, history };
}

/** Read raw store events, never the transformed saveView. This function writes nothing. */
export function completionState(events: readonly TrackerEvent[], target: CompletionTarget): CompletionState {
  const address = addresses(target), current = readField(events, address.current), history = readField(events, address.history);
  const currentDone = !current.conflict && current.value === 'done';
  const historyRecorded = !history.conflict && history.value === true;
  return {
    currentDone,
    historyRecorded,
    needsReconciliation: currentDone && !historyRecorded && !history.conflict,
    conflict: current.conflict || history.conflict,
    currentConflict: current.conflict,
    historyConflict: history.conflict,
  };
}

/**
 * Run once after an explicit user action, then pass the whole result to
 * store.batchDispatch. Inputs already include the save namespace and causal basis.
 * Keep the returned event IDs for store.undoBatch: it restores each prior value,
 * including a history observation that was already true before this action.
 */
export function completionInputs(events: readonly TrackerEvent[], target: CompletionTarget, mode: CompletionMode): EventInput[] {
  if (!['confirm', 'mistake', 'loaded-earlier-save'].includes(mode)) throw new Error('Выберите действие для отметки');
  const address = addresses(target), current = readField(events, address.current), history = readField(events, address.history);
  if (current.conflict || (mode !== 'loaded-earlier-save' && history.conflict)) throw new Error('Сначала разрешите расхождения отметок между устройствами');
  const result: EventInput[] = [{ ...address.current, value: mode === 'confirm' ? 'done' : 'todo', basis: current.heads.map(event => event.id) }];
  if (mode !== 'loaded-earlier-save') result.push({ ...address.history, value: mode === 'confirm', basis: history.heads.map(event => event.id) });
  return result;
}
