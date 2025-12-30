// ==================== ТИПЫ ====================

export type ModuleType = 'magnet' | 'cooler' | 'filter' | 'lubricant' | 'ultrasonic' | 'laser';

export type EnemyType = 'dust' | 'abrasive' | 'heat' | 'metal' | 'corrosion' | 'moisture' | 'static' | 'boss_wear' | 'boss_pitting';

export type EffectType = 'slow' | 'burn' | 'marked' | 'coated';

export type UpgradeRarity = 'common' | 'rare' | 'epic';

// Теги врагов для бонусов/штрафов урона
export type EnemyTag = 'metal' | 'wet' | 'hot' | 'dusty' | 'organic';

// Эффект атаки (для визуализации)
export interface AttackEffect {
  id: string;
  type: 'beam' | 'projectile' | 'wave' | 'aoe' | 'chain';
  moduleType: ModuleType;  // тип модуля для уникального визуала
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  startTime: number;
  duration: number;  // мс
  progress: number;  // 0-1 для анимации
}

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
  // Боевые параметры
  attackType: 'beam' | 'projectile' | 'wave' | 'aoe';  // тип визуала
  effectType?: EffectType;  // какой эффект накладывает (slow, burn, marked)
  effectDuration?: number;  // длительность эффекта мс
  effectStrength?: number;  // сила эффекта
  tagBonuses?: Partial<Record<EnemyTag, number>>;  // бонусы по тегам (1.3 = +30%)
  tagPenalties?: Partial<Record<EnemyTag, number>>; // штрафы по тегам (0.8 = -20%)
  piercing?: boolean;  // пробивает насквозь
  aoeRadius?: number;  // радиус AOE
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
  lastDamageTime: number; // timestamp последнего получения урона
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
  // Боевые параметры
  tags: EnemyTag[];       // теги для бонусов/штрафов урона
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

// Layout константы (должны совпадать с page.tsx)
export const CELL_SIZE = 110;           // размер ячейки в пикселях
export const CELL_GAP = 14;             // зазор между ячейками
export const PANEL_PADDING = 16;        // отступ внутри панели
export const CONVEYOR_WIDTH = Math.round(CELL_SIZE * 0.95); // ширина конвейера ~105px

// Формула урона: baseDamage * 1.5^(level-1)
export function getDamage(baseDamage: number, level: number): number {
  return Math.floor(baseDamage * Math.pow(1.5, level - 1));
}

// Формула длительности эффекта: +10% за уровень
export function getEffectDuration(baseDuration: number, level: number): number {
  return Math.floor(baseDuration * (1 + (level - 1) * 0.1));
}

// Формула силы эффекта: +2% абсолютных за уровень
// Например: 40% slow → 42% → 44% → 46% → 48%
export function getEffectStrength(baseStrength: number, level: number): number {
  return baseStrength + (level - 1) * 2;
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
    range: 150,       // достаёт до канала из центра
    attackSpeed: 1.0,
    color: '#8b5cf6',  // фиолетовый
    description: 'x1.5 урона по металлу',
    attackType: 'beam',
    tagBonuses: { metal: 1.5 },  // +50% по металлу
    // Особенность: дополнительно замедляет metal на 20%
  },
  cooler: {
    id: 'cooler',
    name: 'Охладитель',
    icon: '❄️',
    basePrice: 35,
    baseDamage: 8,
    range: 180,       // большой радиус для замедления
    attackSpeed: 0.8,
    color: '#38bdf8',  // голубой
    description: 'Замедляет на 40%',
    attackType: 'projectile',
    effectType: 'slow',
    effectDuration: 2000,
    effectStrength: 40,  // 40% замедление
    tagBonuses: { hot: 1.3 },  // +30% по горячим
    tagPenalties: { dusty: 0.8 },  // -20% по пыльным
  },
  filter: {
    id: 'filter',
    name: 'Фильтр',
    icon: '🛡️',
    basePrice: 50,
    baseDamage: 18,
    range: 170,       // средний радиус
    attackSpeed: 1.2,
    color: '#fbbf24',  // золотой
    description: 'Чистый урон',
    attackType: 'wave',
    // Особенность: игнорирует дебафф от коррозии
  },
  lubricant: {
    id: 'lubricant',
    name: 'Смазка',
    icon: '💧',
    basePrice: 45,
    baseDamage: 4,    // Пониженный урон, зато дебафф
    range: 140,       // ближний бой, но достаёт до края
    attackSpeed: 0.6,
    color: '#a855f7',  // пурпурный
    description: '+25% урон соседним модулям, дебафф врагов',
    attackType: 'projectile',
    effectType: 'coated',
    effectDuration: 3000,  // 3 секунды
    effectStrength: 15,    // +15% получаемого урона
    // Особенность: +25% урон соседним модулям (реализуется в combat.ts)
  },
  ultrasonic: {
    id: 'ultrasonic',
    name: 'Ультразвук',
    icon: '📡',
    basePrice: 65,
    baseDamage: 10,
    range: 200,       // большой радиус для AOE
    attackSpeed: 0.4,
    color: '#2dd4bf',  // бирюзовый
    description: 'AOE урон',
    attackType: 'aoe',
    aoeRadius: 80,    // увеличен радиус AOE
    tagBonuses: { dusty: 1.2 },  // +20% по пыльным
    // Особенность: урон растёт от количества врагов
  },
  laser: {
    id: 'laser',
    name: 'Лазер',
    icon: '🔬',
    basePrice: 80,
    baseDamage: 15,
    range: 250,       // максимальный радиус для снайпера
    attackSpeed: 0.3,
    color: '#ef4444',  // красный
    description: 'Пробивает насквозь',
    attackType: 'beam',
    effectType: 'burn',
    effectDuration: 3000,
    effectStrength: 5,  // 5 HP/сек
    tagBonuses: { metal: 1.3 },  // +30% по металлу
    tagPenalties: { wet: 0.8 },  // -20% по мокрым
    piercing: true,  // пробивает насквозь
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
    size: 12,       // +25%
    color: '#9ca3af',
    oscillation: 5,
    shape: 'dust',  // облачко частиц
    tags: ['dusty'],
  },
  abrasive: {
    id: 'abrasive',
    name: 'Абразив',
    icon: '🪨',
    baseHp: 70,
    speed: 30,
    reward: 10,
    description: 'Медленный, крепкий',
    size: 18,       // +25%
    color: '#a67c52',  // песочно-серый/охра
    oscillation: 1,
    shape: 'shard',  // осколок
    tags: ['dusty', 'metal'],  // частично металлический
  },
  heat: {
    id: 'heat',
    name: 'Перегрев',
    icon: '🌡️',
    baseHp: 50,
    speed: 42,
    reward: 12,
    description: 'Иммунитет к ожогу',
    size: 15,       // +25%
    color: '#ff6b35',  // оранжево-красный
    oscillation: 3,
    shape: 'drop',  // горячая зона
    tags: ['hot'],
  },
  metal: {
    id: 'metal',
    name: 'Стружка',
    icon: '🔩',
    baseHp: 100,
    speed: 25,
    reward: 15,
    description: 'Магнит x1.5 урона',
    size: 20,       // +25%
    color: '#a8a8a8',  // серебристый
    oscillation: 2,
    shape: 'shavings',  // завитки стружки
    tags: ['metal'],
  },
  corrosion: {
    id: 'corrosion',
    name: 'Коррозия',
    icon: '🦠',
    baseHp: 80,
    speed: 35,
    reward: 18,
    description: '-20% урон модулей рядом',
    size: 18,       // +25%
    color: '#4a7c59',  // зелёно-бурый
    oscillation: 4,
    shape: 'blob',  // амёбообразное пятно
    tags: ['organic', 'wet'],
  },
  moisture: {
    id: 'moisture',
    name: 'Влага',
    icon: '💧',
    baseHp: 45,
    speed: 48,
    reward: 10,
    description: 'Иммунитет к замедлению',
    size: 12,       // +25%
    color: '#38bdf8',
    oscillation: 0,
    shape: 'drop',
    tags: ['wet'],
  },
  static: {
    id: 'static',
    name: 'Статика',
    icon: '⚡',
    baseHp: 35,
    speed: 60,
    reward: 12,
    description: 'Телепорт +10% каждые 3с',
    size: 10,       // +25%
    color: '#facc15',
    oscillation: 8,
    shape: 'spark',
    tags: [],  // диэлектрик, нейтральный
  },
  boss_wear: {
    id: 'boss_wear',
    name: 'Задир',
    icon: '🔴',
    baseHp: 300,
    speed: 20,
    reward: 50,
    description: 'Мини-босс',
    size: 30,       // +25%
    color: '#4a4a4a',  // тёмный металл
    oscillation: 1,
    shape: 'scarred',  // царапины
    tags: ['metal'],
  },
  boss_pitting: {
    id: 'boss_pitting',
    name: 'Питтинг',
    icon: '⚫',
    baseHp: 800,
    speed: 15,
    reward: 150,
    description: 'Регенерация 10 HP/с',
    size: 40,       // +25%
    color: '#374151',  // тёмно-серый
    oscillation: 0,
    shape: 'pitted',  // кратеры
    tags: ['metal'],
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

// Серийные коды модулей (инженерный стиль)
export const MODULE_CODES: Record<ModuleType, string> = {
  magnet: 'MAG-SEP',
  cooler: 'CRY-01',
  filter: 'FLT-ISO',
  lubricant: 'LUB-D4',
  ultrasonic: 'USN-K7',
  laser: 'LAS-OP3',
};

// Инженерная палитра модулей (приглушённые цвета)
export const MODULE_PALETTE: Record<ModuleType, {
  dark: string;
  light: string;
  glow: string;
}> = {
  magnet: {
    dark: '#2E2255',
    light: '#6B4CD6',
    glow: 'rgba(107, 76, 214, 0.15)',
  },
  cooler: {
    dark: '#185568',
    light: '#2A9AC8',
    glow: 'rgba(42, 154, 200, 0.15)',
  },
  filter: {
    dark: '#5C3A0E',
    light: '#C09A1E',
    glow: 'rgba(192, 154, 30, 0.15)',
  },
  lubricant: {
    dark: '#3A2145',
    light: '#8845C7',
    glow: 'rgba(136, 69, 199, 0.15)',
  },
  ultrasonic: {
    dark: '#0B524C',
    light: '#24A899',
    glow: 'rgba(36, 168, 153, 0.15)',
  },
  laser: {
    dark: '#4A1616',
    light: '#BF3636',
    glow: 'rgba(191, 54, 54, 0.15)',
  },
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
