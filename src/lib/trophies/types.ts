export type CategoryId = 'trophies' | 'lessons' | 'maps' | 'collectibles' | 'counters' | 'quests' | 'challenges' | 'custom';
export type ProgressStatus = 'todo' | 'done' | 'verify';
export interface SourceReference { name: string; url: string; author?: string }
export interface TrackerItem {
  id: string;
  name: string;
  category: CategoryId;
  description: string;
  originalName?: string;
  spoilerChapter?: number | null;
  steps?: { id: string; label: string }[];
  chapter: number | null;
  lastChapter?: number | null;
  conditions: string;
  teacher?: string;
  location?: string;
  missable: 'yes' | 'no' | 'unknown';
  confidence: 'documented' | 'reported' | 'check';
  sources: SourceReference[];
  gameVersion: string | null;
  grade?: 'bronze' | 'silver' | 'gold' | 'platinum';
  target?: number;
  scope: 'run' | 'global' | 'psn';
  notes?: string;
}
export interface GameCatalog {
  id: string;
  title: string;
  platform: string;
  description: string;
  cover: string;
  reviewedAt: string;
  chapters: number[];
  lessonTarget?: number;
  mapTarget?: number | null;
  mapTargetNote?: string;
  patches: { version: string; description: string; sourceUrl: string }[];
  categories: { id: CategoryId; name: string }[];
  items: TrackerItem[];
}
export const CATEGORY_NAMES: Record<CategoryId, string> = {
  trophies: 'Трофеи PSN', lessons: 'Уроки', maps: 'Карты', collectibles: 'Коллекции',
  counters: 'Счётчики', quests: 'Задания и развилки', challenges: 'Особые прохождения', custom: 'Мои пункты',
};
