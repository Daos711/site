import type { JsonValue } from './events';

export interface ChangeInput { gameId: string; runId: string | null; entityId: string; field: string; value: JsonValue; kind?: 'set' | 'increment'; basis?: string[] }
export function runInputs(gameId: string, id: string, name: string, options: Record<string, JsonValue> = {}): ChangeInput[] {
  return Object.entries({ name, chapter: 1, campMembership: 'none', location: '', difficulty: 'Не указана', status: 'active', camp: 'Не выбран', role: '', sleep: 'unknown', permadeath: false,
    createdAt: new Date().toISOString(), ...options }).map(([field, value]) => ({ gameId, runId: id, entityId: 'run', field, value }));
}
export const PRESET_LESSONS = ['lesson-diving', 'lesson-lockpicking-trained', 'lesson-acrobatics', 'lesson-inscription', 'lesson-scavenger-riding'];
export function gothicPreset(): ChangeInput[] {
  const gameId = 'gothic-remake', runId = 'first-playthrough';
  const inputs = runInputs(gameId, runId, 'Первое прохождение', { difficulty: 'Новичок', camp: 'План: Старый лагерь', role: 'Маг Огня', sleep: 'intact', reportedLessons: 6, reportedMaps: 3 });
  inputs.push(...runInputs(gameId, 'permadeath-plan', 'Второе прохождение', { status: 'planned', permadeath: true, difficulty: 'Перманентная смерть' }));
  for (const entityId of [...PRESET_LESSONS, 'map-swamp-camp']) {
    inputs.push({ gameId, runId: null, entityId, field: 'observed', value: true }, { gameId, runId, entityId, field: 'status', value: 'done' });
  }
  inputs.push({ gameId, runId: null, entityId: 'trophy-swamp-camp', field: 'status', value: 'done' });
  inputs.push({ gameId, runId, entityId: 'journal', field: 'text', value: 'Счётчик игры: 6/46 уроков; уверенно определены пять. Шестой урок пока неизвестен. Куплены три карты: Болотного лагеря и две у Грэма, названия последних нужно уточнить. Трофей Болотного лагеря получен через отдельное сохранение. Для Нового лагеря предстоит завершить «Налёт», затем основной план — Старый лагерь и маг Огня. Загрузка сохранений не подтверждает зачёт уроков автоматически.' });
  return inputs;
}
