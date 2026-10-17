import { readField, type JsonValue, type TrackerEvent } from './events';
import { MAIN_SAVE, saveAddress } from './saves';

export interface ChangeInput { gameId: string; runId: string | null; entityId: string; field: string; value: JsonValue; kind?: 'set' | 'increment'; basis?: string[] }
export function runInputs(gameId: string, id: string, name: string, options: Record<string, JsonValue> = {}): ChangeInput[] {
  return Object.entries({ name, chapter: 1, campMembership: 'none', location: '', difficulty: 'Не указана', status: 'active', camp: 'Не выбран', role: '', sleep: 'unknown', permadeath: false,
    createdAt: new Date().toISOString(), ...options }).map(([field, value]) => ({ gameId, runId: id, entityId: 'run', field, value }));
}
export const PRESET_LESSONS = ['lesson-diving', 'lesson-lockpicking-trained', 'lesson-acrobatics', 'lesson-inscription', 'lesson-scavenger-riding', 'lesson-one-handed-trained', 'lesson-climbing'];
export const PRESET_MAPS = ['map-swamp-camp', 'map-old-camp', 'map-colony', 'map-old-mine-old-camp'];
export const PRESET_TROPHIES = ['trophy-crafting-newbie', 'trophy-new-camp', 'trophy-swamp-camp', 'trophy-mud-freak', 'trophy-master-garrett'];
export const PERSONAL_PROGRESS_UPDATE = 'personalUpdate20261017';
const GAME_ID = 'gothic-remake';

function confirmedItems(runId: string): ChangeInput[] {
  const inputs: ChangeInput[] = [];
  for (const entityId of [...PRESET_LESSONS, ...PRESET_MAPS]) {
    inputs.push({ gameId: GAME_ID, runId: null, entityId, field: 'observed', value: true }, { gameId: GAME_ID, runId, entityId, field: 'status', value: 'done' });
  }
  for (const entityId of PRESET_TROPHIES) inputs.push({ gameId: GAME_ID, runId: null, entityId, field: 'status', value: 'done' });
  inputs.push({ gameId: GAME_ID, runId, entityId: 'bestiary-2', field: 'stage:found', value: true });
  return inputs;
}

/** Explicitly apply the user's confirmed progress to raw store events, never on load.
 * Inputs already include the selected save address and the heads seen by this update.
 * Existing notes, plans, character state and unresolved conflicts are preserved.
 */
export function confirmedProgressUpdate(rawEvents: readonly TrackerEvent[], runId: string, saveId = MAIN_SAVE): ChangeInput[] {
  if (!runId) throw new Error('Выберите прохождение для записи подтверждённого прогресса');
  const address = (entityId: string, field: string) => saveAddress({ gameId: GAME_ID, runId, entityId, field }, runId, saveId);
  const marker = readField(rawEvents, address('run', PERSONAL_PROGRESS_UPDATE));
  if (!marker.conflict && marker.value === true) return [];
  const inputs: ChangeInput[] = [];
  let pending = false;
  function add(input: ChangeInput) {
    const target = saveAddress(input, runId, saveId), state = readField(rawEvents, target);
    if (state.conflict || state.incomplete || state.kind === 'increment') { pending = true; return; }
    if (state.value === input.value) return;
    inputs.push({ ...target, basis: state.heads.map(event => event.id) });
  }
  for (const input of confirmedItems(runId)) add(input);
  for (const [field, minimum] of [['reportedLessons', PRESET_LESSONS.length], ['reportedMaps', PRESET_MAPS.length]] as const) {
    const state = readField(rawEvents, address('run', field));
    if (state.conflict || state.incomplete || (state.value != null && typeof state.value !== 'number')) { pending = true; continue; }
    add({ gameId: GAME_ID, runId, entityId: 'run', field, value: Math.max(typeof state.value === 'number' ? state.value : 0, minimum) });
  }
  const plan = readField(rawEvents, address('run', 'nextAction'));
  const joined = readField(rawEvents, address('route:join-old-camp', 'status'));
  const membership = readField(rawEvents, address('run', 'campMembership'));
  if (plan.conflict || joined.conflict || membership.conflict) pending = true;
  if (!plan.conflict && !joined.conflict && !membership.conflict &&
      (plan.value == null || plan.value === '') && joined.value !== 'done' &&
      !['old', 'new', 'swamp'].includes(String(membership.value))) {
    add({ gameId: GAME_ID, runId, entityId: 'run', field: 'nextAction', value: 'join-old-camp' });
  }
  if (!pending) add({ gameId: GAME_ID, runId, entityId: 'run', field: PERSONAL_PROGRESS_UPDATE, value: true });
  return inputs;
}

export function gothicPreset(): ChangeInput[] {
  const gameId = GAME_ID, runId = 'first-playthrough';
  const inputs = runInputs(gameId, runId, 'Первое прохождение', { difficulty: 'Новичок', camp: 'План: Старый лагерь', role: 'Маг Огня', sleep: 'intact', reportedLessons: 7, reportedMaps: 4, nextAction: 'join-old-camp', [PERSONAL_PROGRESS_UPDATE]: true });
  inputs.push(...runInputs(gameId, 'permadeath-plan', 'Второе прохождение', { status: 'planned', permadeath: true, difficulty: 'Перманентная смерть' }));
  inputs.push(...confirmedItems(runId));
  inputs.push({ gameId, runId, entityId: 'journal', field: 'text', value: 'Подтверждены прежние 7/46 уроков, включая стартовое одноручное оружие и скалолазание. Найдены четыре карты: Болотного лагеря, Старого лагеря, Колонии и путь к Старой шахте из Старого лагеря. Подтверждены пять трофеев PSN: первый изготовленный предмет, вступление в Новый и Болотный лагеря, все разговоры Мада и двадцать вскрытых замков. В хижине Волка найден Бестиарий Хориниса II; передача книги и выполнение поручения не подтверждены. Следующий план — вступить в Старый лагерь, затем стать магом Огня. Трофеи отдельных веток не меняют членство текущего персонажа; найденная книга не добавляет восьмой урок.' });
  return inputs;
}
