import { ModuleType, EnemyType, EffectType } from '../types';

// ==================== РОЛИ МОДУЛЕЙ ====================

export type ModuleRole = 'DPS' | 'Control' | 'Support' | 'Utility';

export const ROLE_COLORS: Record<ModuleRole, string> = {
  DPS: '#ef4444',
  Control: '#3b82f6',
  Support: '#22c55e',
  Utility: '#a855f7',
};

export const ROLE_LABELS: Record<ModuleRole, string> = {
  DPS: 'Урон',
  Control: 'Контроль',
  Support: 'Поддержка',
  Utility: 'Утилита',
};

export const MODULE_ROLES: Record<ModuleType, ModuleRole> = {
  filter: 'DPS',
  magnet: 'DPS',
  laser: 'DPS',
  electrostatic: 'DPS',
  cooler: 'Control',
  centrifuge: 'Control',
  barrier: 'Control',
  lubricant: 'Support',
  analyzer: 'Support',
  inhibitor: 'Support',
  ultrasonic: 'Utility',
  demulsifier: 'Utility',
};

// ==================== ТИПЫ АТАК ====================

export const ATTACK_TYPE_LABELS: Record<string, string> = {
  single: 'одиночная',
  beam: 'луч',
  aoe: 'по площади',
  chain: 'цепная',
  special: 'особая',
};

// ==================== ДАННЫЕ МОДУЛЕЙ ====================

export interface HandbookModuleData {
  name: string;
  role: ModuleRole;
  attackType: string;
  description: string;
  keyEffect: string | null;
  synergies: string[];
  notes: string[];
}

export const HANDBOOK_MODULES: Record<ModuleType, HandbookModuleData> = {
  filter: {
    name: 'Фильтр',
    role: 'DPS',
    attackType: 'single',
    description: 'Точечная атака по одному врагу. Бонус +25% по dusty.',
    keyEffect: null,
    synergies: [
      'Эффективен против Пыли и Сажи',
    ],
    notes: [
      'Самый дешёвый DPS модуль',
      '+25% урона по врагам с тегом dusty',
      'Иммунен к коррозии',
    ],
  },
  magnet: {
    name: 'Сепаратор',
    role: 'DPS',
    attackType: 'single',
    description: 'Магнитный захват одиночной цели. Бонус +25% по metal.',
    keyEffect: null,
    synergies: [
      'Эффективен против Metal частиц',
    ],
    notes: [
      '+25% урона по врагам с тегом metal',
    ],
  },
  laser: {
    name: 'Лазер',
    role: 'DPS',
    attackType: 'beam',
    description: 'Мощный луч с высоким уроном. Штраф -20% по wet.',
    keyEffect: null,
    synergies: [
      'Деэмульгатор убирает штраф по влаге',
    ],
    notes: [
      '-20% урона по врагам с тегом wet',
      'Высокий урон, но медленная атака',
    ],
  },
  electrostatic: {
    name: 'Электростат',
    role: 'DPS',
    attackType: 'chain',
    description: 'Цепная молния, поражающая до 4 врагов. Бонус +25% по wet.',
    keyEffect: null,
    synergies: [
      'Отлично против групп Влаги',
    ],
    notes: [
      'Поражает до 4 целей',
      '+25% урона по wet',
    ],
  },
  cooler: {
    name: 'Охладитель',
    role: 'Control',
    attackType: 'beam',
    description: 'Замораживающий луч, замедляющий врагов.',
    keyEffect: 'SLOW',
    synergies: [
      'Все DPS модули → больше времени на урон',
      'Dry + Охладитель → влага замедляется на 50%',
    ],
    notes: [
      'Замедление не стакается (обновляется)',
      'Кап замедления: 80%',
      'Moisture иммунна без эффекта Dry',
    ],
  },
  centrifuge: {
    name: 'Центрифуга',
    role: 'Control',
    attackType: 'aoe',
    description: 'Откатывает врагов назад, давая больше времени.',
    keyEffect: 'PUSHBACK',
    synergies: [
      'Все модули → больше времени на урон',
      'Особенно эффективна на длинных участках',
    ],
    notes: [
      'L1: 8%, L5: 16% отката',
      'Elite: 50% эффективности',
      'Boss: 20% эффективности',
      'Кулдаун между откатами: 1.5 сек',
    ],
  },
  barrier: {
    name: 'Барьер',
    role: 'Control',
    attackType: 'special',
    description: 'Создаёт блокирующий барьер на канале.',
    keyEffect: 'BLOCK',
    synergies: [
      'Задерживает врагов для DPS',
      'Особенно полезен против быстрых волн',
    ],
    notes: [
      'Блокирует до 3 врагов',
      'Длительность масштабируется с уровнем',
      'Самый дорогой модуль (115)',
    ],
  },
  lubricant: {
    name: 'Смазка',
    role: 'Support',
    attackType: 'aoe',
    description: 'Покрывает врагов смазкой, усиливая урон от соседних модулей.',
    keyEffect: 'COATED',
    synergies: [
      'Соседние модули наносят +25% урона',
      'Работает с любыми DPS',
    ],
    notes: [
      'Эффект для СОСЕДНИХ модулей',
      'Сама Смазка наносит мало урона',
    ],
  },
  analyzer: {
    name: 'Анализатор',
    role: 'Support',
    attackType: 'single',
    description: 'Помечает врага, увеличивая получаемый им урон от всех источников.',
    keyEffect: 'MARKED',
    synergies: [
      'Все модули наносят +25% урона по цели',
      'Особенно эффективен против боссов',
    ],
    notes: [
      '+25% урона от ВСЕХ источников',
      'Длительность метки: 3 сек',
    ],
  },
  inhibitor: {
    name: 'Ингибитор',
    role: 'Support',
    attackType: 'aoe',
    description: 'Подавляет способности врагов, снимая ауры и блокируя регенерацию.',
    keyEffect: 'SUPPRESSED',
    synergies: [
      'Контрит Corrosion (снимает ауру)',
      'Блокирует регенерацию боссов',
    ],
    notes: [
      'Обязателен против Corrosion',
      'Иммунен к коррозии',
      'Кулдаун: 11 сек',
    ],
  },
  ultrasonic: {
    name: 'Ультразвук',
    role: 'Utility',
    attackType: 'aoe',
    description: 'Снимает защитные эффекты с врагов (щиты, броню).',
    keyEffect: 'STRIP',
    synergies: [
      'Убирает щиты с Scale',
      'Снимает броню с Metal',
    ],
    notes: [
      'Не наносит урон напрямую',
      'Критичен против защищённых врагов',
    ],
  },
  demulsifier: {
    name: 'Деэмульгатор',
    role: 'Utility',
    attackType: 'aoe',
    description: 'Высушивает влажных врагов, снимая иммунитет к замедлению.',
    keyEffect: 'DRY',
    synergies: [
      'Dry + Охладитель → влага замедляется',
      'Dry + Лазер → убирает штраф -20%',
    ],
    notes: [
      'Обязателен против Moisture',
      'Позволяет замедлять на 50%',
    ],
  },
};

// ==================== ДАННЫЕ ВРАГОВ ====================

export type EnemyCategory = 'common' | 'elite' | 'boss';

export interface HandbookEnemyData {
  name: string;
  category: EnemyCategory;
  tag: string | null;
  description: string;
  immunities: string[];
  counters: string[];
}

export const ENEMY_CATEGORY_LABELS: Record<EnemyCategory, string> = {
  common: 'Обычный',
  elite: 'Элитный',
  boss: 'Босс',
};

export const ENEMY_CATEGORY_COLORS: Record<EnemyCategory, string> = {
  common: '#9ca3af',
  elite: '#f59e0b',
  boss: '#ef4444',
};

export const HANDBOOK_ENEMIES: Record<string, HandbookEnemyData> = {
  dust: {
    name: 'Пыль',
    category: 'common',
    tag: 'dusty',
    description: 'Базовый враг. Уязвим к Фильтру и Электростату.',
    immunities: [],
    counters: ['Фильтр (+25%)', 'Электростат (+25%)'],
  },
  soot: {
    name: 'Сажа',
    category: 'common',
    tag: 'dusty',
    description: 'Быстрая частица. Уязвима к Фильтру и Электростату.',
    immunities: [],
    counters: ['Фильтр (+25%)', 'Электростат (+25%)', 'Охладитель (замедлить)'],
  },
  moisture: {
    name: 'Влага',
    category: 'common',
    tag: 'wet',
    description: 'Иммунна к замедлению. Требует Деэмульгатор.',
    immunities: ['SLOW'],
    counters: ['Деэмульгатор → Dry', 'Dry + Охладитель', 'Электростат (+25%)'],
  },
  scale: {
    name: 'Накипь',
    category: 'common',
    tag: 'ite',
    description: 'Имеет щит, поглощающий урон. Требует Ультразвук.',
    immunities: [],
    counters: ['Ультразвук (снять щит)'],
  },
  abrasive: {
    name: 'Абразив',
    category: 'elite',
    tag: 'ite',
    description: 'Элитный враг с высоким HP.',
    immunities: [],
    counters: ['Анализатор (+25%)', 'Смазка (+25%)'],
  },
  metal: {
    name: 'Металл',
    category: 'elite',
    tag: 'metal',
    description: 'Элитный враг с бронёй. Уязвим к Сепаратору.',
    immunities: [],
    counters: ['Сепаратор (+25%)', 'Ультразвук (снять броню)'],
  },
  corrosion: {
    name: 'Коррозия',
    category: 'elite',
    tag: 'hot',
    description: 'Опасная аура, снижающая урон соседних модулей. ОБЯЗАТЕЛЕН Ингибитор!',
    immunities: [],
    counters: ['Ингибитор (снять ауру)', 'Держать модули на расстоянии'],
  },
  boss_aggregate: {
    name: 'Агрегат',
    category: 'boss',
    tag: null,
    description: 'Мини-босс. Много HP, сопротивление откату.',
    immunities: [],
    counters: ['Анализатор', 'Концентрированный DPS'],
  },
  boss_ite: {
    name: 'Агломерат',
    category: 'boss',
    tag: 'ite',
    description: 'Босс с большим количеством HP и щитом.',
    immunities: [],
    counters: ['Ультразвук (снять щит)', 'Анализатор'],
  },
  boss_pitting: {
    name: 'Питтинг',
    category: 'boss',
    tag: 'hot',
    description: 'Регенерирующий босс. Требует Ингибитор для блокировки регена.',
    immunities: [],
    counters: ['Ингибитор (блок регена)', 'Высокий DPS'],
  },
};

// ==================== ДАННЫЕ ЭФФЕКТОВ ====================

export interface HandbookEffectData {
  name: string;
  nameRu: string;
  icon: string;
  description: string;
  stacking: string;
  cap: string | null;
  sources: string[];
  immunities: string[];
}

export const HANDBOOK_EFFECTS: Record<string, HandbookEffectData> = {
  slow: {
    name: 'SLOW',
    nameRu: 'Замедление',
    icon: '❄️',
    description: 'Снижает скорость передвижения врага на указанный процент.',
    stacking: 'Не стакается, обновляется',
    cap: '80% максимум',
    sources: ['Охладитель'],
    immunities: ['Moisture (без Dry)'],
  },
  marked: {
    name: 'MARKED',
    nameRu: 'Метка',
    icon: '🎯',
    description: 'Враг получает +25% урона от всех источников.',
    stacking: 'Не стакается',
    cap: null,
    sources: ['Анализатор'],
    immunities: [],
  },
  coated: {
    name: 'COATED',
    nameRu: 'Покрытие',
    icon: '💧',
    description: 'Враг получает +25% урона от соседних модулей Смазки.',
    stacking: 'Не стакается',
    cap: null,
    sources: ['Смазка'],
    immunities: [],
  },
  dry: {
    name: 'DRY',
    nameRu: 'Высушивание',
    icon: '🏜️',
    description: 'Снимает иммунитет к замедлению у влажных врагов. Позволяет замедлять на 50%.',
    stacking: 'Не стакается',
    cap: null,
    sources: ['Деэмульгатор'],
    immunities: [],
  },
  corroded: {
    name: 'CORRODED',
    nameRu: 'Коррозия',
    icon: '🧪',
    description: 'Модули рядом с врагом Corrosion наносят меньше урона.',
    stacking: 'Аура врага, стакается до 3',
    cap: null,
    sources: ['Враг Corrosion'],
    immunities: ['Фильтр', 'Ингибитор'],
  },
  suppressed: {
    name: 'SUPPRESSED',
    nameRu: 'Подавление',
    icon: '🚫',
    description: 'Блокирует способности врага: ауры, регенерацию, щиты.',
    stacking: 'Не стакается',
    cap: null,
    sources: ['Ингибитор'],
    immunities: [],
  },
  pushback: {
    name: 'PUSHBACK',
    nameRu: 'Откат',
    icon: '↩️',
    description: 'Отталкивает врага назад по пути. Elite и боссы частично сопротивляются.',
    stacking: 'Кулдаун 1.5 сек',
    cap: null,
    sources: ['Центрифуга'],
    immunities: ['Боссы (80% сопротивление)', 'Elite (50% сопротивление)'],
  },
  burn: {
    name: 'BURN',
    nameRu: 'Горение',
    icon: '🔥',
    description: 'Периодический урон от огня.',
    stacking: 'Стакается',
    cap: null,
    sources: ['Лазер (крит)'],
    immunities: [],
  },
};

// ==================== СПИСКИ ДЛЯ НАВИГАЦИИ ====================

export const MODULE_LIST: ModuleType[] = [
  'filter', 'magnet', 'laser', 'electrostatic',
  'cooler', 'centrifuge', 'barrier',
  'lubricant', 'analyzer', 'inhibitor',
  'ultrasonic', 'demulsifier',
];

export const ENEMY_LIST: string[] = [
  'dust', 'soot', 'moisture', 'scale',
  'abrasive', 'metal', 'corrosion',
  'boss_aggregate', 'boss_ite', 'boss_pitting',
];

export const EFFECT_LIST: string[] = [
  'slow', 'marked', 'coated', 'dry',
  'corroded', 'suppressed', 'pushback', 'burn',
];
