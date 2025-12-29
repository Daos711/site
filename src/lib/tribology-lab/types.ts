// ==================== ТИПЫ ====================

export type ModuleType = 'magnet' | 'cooler' | 'filter' | 'lubricant' | 'ultrasonic' | 'laser';

export type EnemyType = 'dust' | 'abrasive' | 'heat' | 'metal' | 'corrosion' | 'moisture' | 'static' | 'boss_wear' | 'boss_pitting';

export type EffectType = 'slow' | 'burn' | 'marked';

export type UpgradeRarity = 'common' | 'rare' | 'epic';

// ==================== МОДУЛИ ====================

export interface Module {
  id: string;
  type: ModuleType;
  level: number;        // 1-5
  x: number;            // позиция в сетке 0-3
  y: number;            // позиция в сетке 0-2
  lastAttack: number;   // timestamp последней атаки
}

export interface ModuleConfig {
  id: ModuleType;
  name: string;
  icon: string;
  basePrice: number;
  baseDamage: number;
  range: number;
  attackSpeed: number;  // атак в секунду
  color: string;        // цвет подсветки
  description: string;
}

// ==================== ВРАГИ ====================

export interface Enemy {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;          // пикселей в секунду
  progress: number;       // 0-1 (позиция на пути)
  effects: Effect[];
  reward: number;
}

export interface Effect {
  type: EffectType;
  duration: number;
  strength: number;
}

export interface EnemyConfig {
  id: EnemyType;
  name: string;
  icon: string;
  baseHp: number;
  speed: number;
  reward: number;
  description: string;
  // Визуальные параметры
  size: number;           // радиус в пикселях
  color: string;          // основной цвет
  oscillation: number;    // амплитуда колебания (0-10)
  shape: 'dust' | 'shard' | 'shavings' | 'drop' | 'blob' | 'spark' | 'scarred' | 'pitted';
}

// ==================== ИГРОВОЕ СОСТОЯНИЕ ====================

export interface GameState {
  phase: 'menu' | 'playing' | 'paused' | 'upgradeSelect' | 'gameOver';
  wave: number;
  lives: number;
  gold: number;
  score: number;
  modules: Module[];
  enemies: Enemy[];
  shop: ShopState;
  upgrades: string[];     // ID применённых улучшений
  stats: GameStats;
}

export interface ShopState {
  slots: (ModuleType | null)[];
  refreshCost: number;
  refreshesUsed: number;
}

export interface GameStats {
  totalKills: number;
  totalGoldEarned: number;
  totalDamageDealt: number;
}

// ==================== КОНСТАНТЫ ====================

export const GRID_COLS = 4;
export const GRID_ROWS = 3;

export const INITIAL_LIVES = 10;
export const INITIAL_GOLD = 100;

export const CELL_SIZE = 80;        // размер ячейки в пикселях
export const CONVEYOR_WIDTH = 48;   // ширина конвейера

// Формула урона: baseDamage * 1.5^(level-1)
export function getDamage(baseDamage: number, level: number): number {
  return Math.floor(baseDamage * Math.pow(1.5, level - 1));
}

// Формула HP врагов: baseHp * 1.08^wave
export function getEnemyHp(baseHp: number, wave: number): number {
  return Math.floor(baseHp * Math.pow(1.08, wave));
}

// Цена модуля с учётом уровня
export function getModulePrice(basePrice: number, level: number): number {
  return Math.floor(basePrice * Math.pow(1.8, level - 1));
}

// ==================== ДАННЫЕ МОДУЛЕЙ ====================

export const MODULES: Record<ModuleType, ModuleConfig> = {
  magnet: {
    id: 'magnet',
    name: 'Сепаратор',
    icon: '🧲',
    basePrice: 25,
    baseDamage: 12,
    range: 70,
    attackSpeed: 1.0,
    color: '#8b5cf6',  // фиолетовый
    description: 'x1.5 урона по металлу',
  },
  cooler: {
    id: 'cooler',
    name: 'Охладитель',
    icon: '❄️',
    basePrice: 35,
    baseDamage: 8,
    range: 90,
    attackSpeed: 0.8,
    color: '#38bdf8',  // голубой
    description: 'Замедляет на 40%',
  },
  filter: {
    id: 'filter',
    name: 'Фильтр',
    icon: '🛡️',
    basePrice: 50,
    baseDamage: 18,
    range: 80,
    attackSpeed: 1.2,
    color: '#fbbf24',  // золотой
    description: 'Чистый урон',
  },
  lubricant: {
    id: 'lubricant',
    name: 'Смазка',
    icon: '💧',
    basePrice: 45,
    baseDamage: 6,
    range: 60,
    attackSpeed: 0.6,
    color: '#a855f7',  // пурпурный
    description: '+25% урон соседним модулям',
  },
  ultrasonic: {
    id: 'ultrasonic',
    name: 'Ультразвук',
    icon: '📡',
    basePrice: 65,
    baseDamage: 10,
    range: 100,
    attackSpeed: 0.4,
    color: '#2dd4bf',  // бирюзовый
    description: 'AOE урон',
  },
  laser: {
    id: 'laser',
    name: 'Лазер',
    icon: '🔬',
    basePrice: 80,
    baseDamage: 15,
    range: 120,
    attackSpeed: 0.3,
    color: '#ef4444',  // красный
    description: 'Пробивает насквозь',
  },
};

// ==================== ДАННЫЕ ВРАГОВ ====================

export const ENEMIES: Record<EnemyType, EnemyConfig> = {
  dust: {
    id: 'dust',
    name: 'Пыль',
    icon: '💨',
    baseHp: 25,
    speed: 55,
    reward: 5,
    description: 'Базовый враг',
    size: 10,
    color: '#9ca3af',
    oscillation: 5,
    shape: 'dust',  // облачко частиц
  },
  abrasive: {
    id: 'abrasive',
    name: 'Абразив',
    icon: '🪨',
    baseHp: 70,
    speed: 30,
    reward: 10,
    description: 'Медленный, крепкий',
    size: 14,
    color: '#a67c52',  // песочно-серый/охра
    oscillation: 1,
    shape: 'shard',  // осколок
  },
  heat: {
    id: 'heat',
    name: 'Перегрев',
    icon: '🌡️',
    baseHp: 50,
    speed: 42,
    reward: 12,
    description: 'Иммунитет к ожогу',
    size: 12,
    color: '#ff6b35',  // оранжево-красный
    oscillation: 3,
    shape: 'drop',  // горячая зона
  },
  metal: {
    id: 'metal',
    name: 'Стружка',
    icon: '🔩',
    baseHp: 100,
    speed: 25,
    reward: 15,
    description: 'Магнит x1.5 урона',
    size: 16,
    color: '#a8a8a8',  // серебристый
    oscillation: 2,
    shape: 'shavings',  // завитки стружки
  },
  corrosion: {
    id: 'corrosion',
    name: 'Коррозия',
    icon: '🦠',
    baseHp: 80,
    speed: 35,
    reward: 18,
    description: '-20% урон модулей рядом',
    size: 14,
    color: '#4a7c59',  // зелёно-бурый
    oscillation: 4,
    shape: 'blob',  // амёбообразное пятно
  },
  moisture: {
    id: 'moisture',
    name: 'Влага',
    icon: '💧',
    baseHp: 45,
    speed: 48,
    reward: 10,
    description: 'Иммунитет к замедлению',
    size: 10,
    color: '#38bdf8',
    oscillation: 0,
    shape: 'drop',
  },
  static: {
    id: 'static',
    name: 'Статика',
    icon: '⚡',
    baseHp: 35,
    speed: 60,
    reward: 12,
    description: 'Телепорт +10% каждые 3с',
    size: 8,
    color: '#facc15',
    oscillation: 8,
    shape: 'spark',
  },
  boss_wear: {
    id: 'boss_wear',
    name: 'Задир',
    icon: '🔴',
    baseHp: 300,
    speed: 20,
    reward: 50,
    description: 'Мини-босс',
    size: 24,
    color: '#4a4a4a',  // тёмный металл
    oscillation: 1,
    shape: 'scarred',  // царапины
  },
  boss_pitting: {
    id: 'boss_pitting',
    name: 'Питтинг',
    icon: '⚫',
    baseHp: 800,
    speed: 15,
    reward: 150,
    description: 'Регенерация 10 HP/с',
    size: 32,
    color: '#374151',  // тёмно-серый
    oscillation: 0,
    shape: 'pitted',  // кратеры
  },
};

// Порядок разблокировки модулей
export const MODULE_UNLOCK_WAVES: Record<ModuleType, number> = {
  magnet: 1,
  cooler: 1,
  filter: 1,
  lubricant: 5,
  ultrasonic: 10,
  laser: 15,
};

// Порядок разблокировки врагов
export const ENEMY_UNLOCK_WAVES: Record<EnemyType, number> = {
  dust: 1,
  abrasive: 1,
  heat: 5,
  metal: 5,
  corrosion: 10,
  moisture: 10,
  static: 15,
  boss_wear: 5,
  boss_pitting: 10,
};
