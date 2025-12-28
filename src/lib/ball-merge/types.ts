// Уровни шариков (от маленького к большому)
export interface BallLevel {
  level: number;
  radius: number;
  color: string;
  borderColor: string;
  points: number;
  name: string;
}

// 11 уровней шариков (как в Suika Game)
export const BALL_LEVELS: BallLevel[] = [
  { level: 0, radius: 15, color: '#ff6b6b', borderColor: '#c0392b', points: 1, name: 'Вишня' },
  { level: 1, radius: 20, color: '#ff9ff3', borderColor: '#e84393', points: 2, name: 'Клубника' },
  { level: 2, radius: 28, color: '#a55eea', borderColor: '#8854d0', points: 3, name: 'Виноград' },
  { level: 3, radius: 35, color: '#ff9f43', borderColor: '#ee5a24', points: 5, name: 'Апельсин' },
  { level: 4, radius: 45, color: '#ee5a24', borderColor: '#c0392b', points: 8, name: 'Яблоко' },
  { level: 5, radius: 55, color: '#26de81', borderColor: '#20bf6b', points: 13, name: 'Груша' },
  { level: 6, radius: 65, color: '#ffbe76', borderColor: '#f0932b', points: 21, name: 'Персик' },
  { level: 7, radius: 78, color: '#f9ca24', borderColor: '#f39c12', points: 34, name: 'Ананас' },
  { level: 8, radius: 90, color: '#badc58', borderColor: '#6ab04c', points: 55, name: 'Дыня' },
  { level: 9, radius: 105, color: '#eb4d4b', borderColor: '#22a6b3', points: 89, name: 'Арбуз' },
  { level: 10, radius: 120, color: '#ffd700', borderColor: '#f39c12', points: 144, name: 'Золотой' },
];

// Размеры игрового поля
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;
export const WALL_THICKNESS = 15;
export const DROP_ZONE_HEIGHT = 80; // Зона сверху откуда бросаем

// Линия проигрыша (если шарик выше этой линии дольше N секунд)
export const DANGER_LINE_Y = DROP_ZONE_HEIGHT + 30;
export const DANGER_TIME_MS = 2000; // 2 секунды

// Максимальный уровень шарика для спавна (не даём сразу большие)
export const MAX_SPAWN_LEVEL = 4;

export interface GameState {
  score: number;
  nextBallLevel: number;
  isGameOver: boolean;
  dropX: number; // Позиция для сброса следующего шарика
  canDrop: boolean; // Можно ли сейчас бросить
}
