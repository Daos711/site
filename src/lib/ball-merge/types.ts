// Уровни шариков (от маленького к большому) - размеры из оригинала
export interface BallLevel {
  level: number;
  radius: number;
  color: string;
  glowColor: string;
  name: string;
}

// 10 уровней шариков - увеличены на 25%
// Цвета максимально различимые друг от друга
export const BALL_LEVELS: BallLevel[] = [
  { level: 0, radius: 31, color: '#ef4444', glowColor: '#f87171', name: 'Красный' },
  { level: 1, radius: 44, color: '#06b6d4', glowColor: '#22d3ee', name: 'Циан' },
  { level: 2, radius: 56, color: '#eab308', glowColor: '#facc15', name: 'Жёлтый' },
  { level: 3, radius: 81, color: '#22c55e', glowColor: '#4ade80', name: 'Зелёный' },
  { level: 4, radius: 106, color: '#a855f7', glowColor: '#c084fc', name: 'Фиолетовый' },
  { level: 5, radius: 125, color: '#f97316', glowColor: '#fb923c', name: 'Оранжевый' },
  { level: 6, radius: 150, color: '#3b82f6', glowColor: '#60a5fa', name: 'Синий' },
  { level: 7, radius: 169, color: '#ec4899', glowColor: '#f472b6', name: 'Розовый' },
  { level: 8, radius: 206, color: '#84cc16', glowColor: '#a3e635', name: 'Лайм' },
  { level: 9, radius: 188, color: '#fbbf24', glowColor: '#fcd34d', name: 'Золотой' },
];

// Размеры игрового поля - увеличены на 25%
export const GAME_WIDTH = 875;
export const GAME_HEIGHT = 525;
export const WALL_THICKNESS = 25;
export const DROP_ZONE_HEIGHT = 75;
export const TOP_BUFFER = 188; // Дополнительное пространство сверху для отлетающих шаров
export const CANVAS_HEIGHT = GAME_HEIGHT + TOP_BUFFER; // Полная высота канваса

// Линия проигрыша
export const DANGER_LINE_Y = DROP_ZONE_HEIGHT + 25;
export const DANGER_TIME_MS = 3000; // 3 секунды на исправление

// Максимальный уровень шарика для спавна (только маленькие)
export const MAX_SPAWN_LEVEL = 4; // 0-3

export interface GameState {
  score: number;
  nextBallLevel: number;
  isGameOver: boolean;
  dropX: number;
  canDrop: boolean;
  dangerTimer: number | null; // timestamp начала опасности
}
