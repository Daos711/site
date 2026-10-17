import { readField, type TrackerEvent, type JsonValue } from './events';
import type { GameCatalog, TrackerItem, ProgressStatus } from './types';

export interface Address { gameId: string; runId: string | null; entityId: string; field: string }
export function valueAt(events: readonly TrackerEvent[], gameId: string, runId: string | null, entityId: string, field: string): JsonValue | undefined {
  return readField(events, { gameId, runId, entityId, field }).value;
}
export function itemStatus(events: readonly TrackerEvent[], gameId: string, runId: string | null, item: TrackerItem): ProgressStatus {
  const scope = item.scope === 'run' ? runId : null;
  const cell = readField(events, { gameId, runId: scope, entityId: item.id, field: 'status' });
  if (cell.conflict) return 'verify';
  return cell.value === 'done' || cell.value === 'verify' ? cell.value : 'todo';
}
export function learnedCount(events: readonly TrackerEvent[], game: GameCatalog, category: 'lessons' | 'maps'): number {
  return game.items.filter(item => item.category === category &&
    readField(events, { gameId: game.id, runId: null, entityId: item.id, field: 'observed' }).value === true &&
    !readField(events, { gameId: game.id, runId: null, entityId: item.id, field: 'observed' }).conflict).length;
}
export function gameSummary(events: readonly TrackerEvent[], game: GameCatalog) {
  const trophies = game.items.filter(item => item.category === 'trophies');
  const earned = trophies.filter(item => itemStatus(events, game.id, null, item) === 'done').length;
  return { earned, trophies: trophies.length, percent: trophies.length ? Math.round(100 * earned / trophies.length) : 0,
    lessons: learnedCount(events, game, 'lessons'), maps: learnedCount(events, game, 'maps') };
}
export function listRuns(events: readonly TrackerEvent[], gameId: string): string[] {
  return [...new Set(events.filter(event => event.gameId === gameId && event.entityId === 'run' && event.runId).map(event => event.runId!))]
    .filter(id => typeof valueAt(events, gameId, id, 'run', 'name') === 'string' && valueAt(events, gameId, id, 'run', 'name') !== '' && valueAt(events, gameId, id, 'run', 'archived') !== true)
    .sort((a, b) => String(valueAt(events, gameId, a, 'run', 'createdAt') || a).localeCompare(String(valueAt(events, gameId, b, 'run', 'createdAt') || b)));
}
export function customItems(events: readonly TrackerEvent[], gameId: string): TrackerItem[] {
  const ids = [...new Set(events.filter(event => event.gameId === gameId && event.entityId.startsWith('custom-') && event.field === 'definition').map(event => event.entityId))];
  return ids.flatMap(id => {
    const value = valueAt(events, gameId, null, id, 'definition');
    if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.name !== 'string') return [];
    return [{ id, name: value.name.slice(0, 180), description: typeof value.description === 'string' ? value.description : '',
      category: 'custom' as const, chapter: typeof value.chapter === 'number' ? value.chapter : null,
      conditions: 'Собственный пункт', missable: value.missable === 'yes' ? 'yes' as const : 'unknown' as const,
      confidence: 'reported' as const, sources: [], gameVersion: null, scope: 'run' as const }];
  });
}
export function chapterWarnings(events: readonly TrackerEvent[], game: GameCatalog, runId: string, chapter: number): TrackerItem[] {
  return [...game.items, ...customItems(events, game.id)].filter(item => item.scope === 'run' && item.missable === 'yes' &&
    item.chapter !== null && item.chapter <= chapter && (item.lastChapter == null || item.lastChapter >= chapter) &&
    itemStatus(events, game.id, runId, item) !== 'done');
}
export function filterItems(items: TrackerItem[], options: { query: string; category: string; chapter: string; status: string; spoilers: boolean; currentChapter: number; statusFor: (item: TrackerItem) => ProgressStatus }): TrackerItem[] {
  const words = options.query.toLocaleLowerCase('ru').replaceAll('ё', 'е').trim().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    const spoilerChapter = item.spoilerChapter ?? item.chapter;
    if (!options.spoilers && spoilerChapter !== null && spoilerChapter > options.currentChapter) return false;
    if (options.category && options.category !== item.category) return false;
    if (options.chapter && String(item.chapter) !== options.chapter) return false;
    if (options.status === 'missable' && item.missable !== 'yes') return false;
    if (options.status === 'check' && item.confidence !== 'check') return false;
    if (['todo', 'done', 'verify'].includes(options.status) && options.status !== options.statusFor(item)) return false;
    const haystack = [item.name, item.originalName, item.teacher, item.location, item.description].join(' ').toLocaleLowerCase('ru').replaceAll('ё', 'е');
    return words.every(word => haystack.includes(word));
  });
}
