// Уровни шариков (от маленького к большому) - размеры из оригинала
export interface BallLevel {
  level: number;
  radius: number;
  color: string;
  glowColor: string;
  name: string;
}

// 10 уровней шариков (диаметры: 50, 70, 90, 130, 170, 200, 240, 270, 330, 300-бонус)
export const BALL_LEVELS: BallLevel[] = [
  { level: 0, radius: 25, color: '#ff6b6b', glowColor: '#ff8a8a', name: 'Красный' },
  { level: 1, radius: 35, color: '#4ecdc4', glowColor: '#7ee8e1', name: 'Бирюзовый' },
  { level: 2, radius: 45, color: '#ffe66d', glowColor: '#fff4a3', name: 'Жёлтый' },
  { level: 3, radius: 65, color: '#95e1d3', glowColor: '#c4f0e8', name: 'Мятный' },
  { level: 4, radius: 85, color: '#dda0dd', glowColor: '#e8c4e8', name: 'Сиреневый' },
  { level: 5, radius: 100, color: '#f38181', glowColor: '#f7a8a8', name: 'Коралловый' },
  { level: 6, radius: 120, color: '#aa96da', glowColor: '#c9bde8', name: 'Лавандовый' },
  { level: 7, radius: 135, color: '#fcbad3', glowColor: '#fdd5e4', name: 'Розовый' },
  { level: 8, radius: 165, color: '#a8d8ea', glowColor: '#d0ebf5', name: 'Голубой' },
  { level: 9, radius: 150, color: '#ffd700', glowColor: '#ffe44d', name: 'Золотой' }, // бонусный при слиянии двух больших
];

// Размеры игрового поля (широкий стакан ~1.8:1)
export const GAME_WIDTH = 700;
export const GAME_HEIGHT = 420;
export const WALL_THICKNESS = 20;
export const DROP_ZONE_HEIGHT = 60;

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
