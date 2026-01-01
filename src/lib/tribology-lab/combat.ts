import {
  Module, ModuleConfig, MODULES, getDamage, getEffectDuration, getEffectStrength,
  Enemy, EnemyConfig, ENEMIES, EnemyTag, EnemyType,
  Effect, EffectType, AttackEffect, ActiveBarrier,
  CELL_SIZE, CELL_GAP, PANEL_PADDING, CONVEYOR_WIDTH, GRID_COLS,
  MODULE_UNLOCK_WAVES, ModuleType
} from './types';
import { PathPoint, getPositionOnPath } from './enemies';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Получает позицию центра модуля в пикселях
 * Координаты совпадают с рендером в page.tsx
 */
export function getModulePosition(module: Module): { x: number; y: number } {
  // Внутренняя панель начинается на conveyorWidth от края
  // Сетка внутри панели начинается с отступом panelPadding
  // Ячейки имеют размер cellSize и зазор cellGap между ними
  const gridStartX = CONVEYOR_WIDTH + PANEL_PADDING;
  const gridStartY = CONVEYOR_WIDTH + PANEL_PADDING;

  const x = gridStartX + module.x * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;
  const y = gridStartY + module.y * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2;

  return { x, y };
}

/**
 * Вычисляет расстояние между двумя точками
 */
export function getDistance(
  x1: number, y1: number,
  x2: number, y2: number
): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Проверяет, находится ли враг в радиусе модуля
 */
export function isInRange(
  module: Module,
  enemy: Enemy,
  path: PathPoint[]
): boolean {
  const config = MODULES[module.type];
  const modulePos = getModulePosition(module);
  const enemyConfig = ENEMIES[enemy.type];
  const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);

  const distance = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
  return distance <= config.range;
}

// ==================== БАРЬЕР ====================

/**
 * Вычисляет позицию барьера ГЕОМЕТРИЧЕСКИ — напротив центра модуля на канале
 * Для угловых ячеек определяет направление по позиции ближайших врагов
 * Возвращает null если модуль слишком далеко от канала
 */
export function getBarrierPosition(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[]
): { x: number; y: number; isHorizontal: boolean } | null {
  const modulePos = getModulePosition(module);
  const channelCenterOffset = CONVEYOR_WIDTH / 2 + 8;

  const gridWidth = GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP;
  const totalWidth = gridWidth + PANEL_PADDING * 2 + CONVEYOR_WIDTH * 2;

  // УГЛОВАЯ ЯЧЕЙКА ЛЕВАЯ ВЕРХНЯЯ (x=0, y=0)
  if (module.x === 0 && module.y === 0) {
    // Проверяем откуда идут ближайшие враги
    const nearbyEnemies = enemies.filter(e => {
      if (e.hp <= 0) return false;
      const enemyConfig = ENEMIES[e.type];
      const enemyPos = getPositionOnPath(path, e.progress, enemyConfig.oscillation);
      const dist = Math.sqrt(
        Math.pow(enemyPos.x - modulePos.x, 2) +
        Math.pow(enemyPos.y - modulePos.y, 2)
      );
      return dist < 150;
    });

    if (nearbyEnemies.length === 0) return null;

    // Проверяем где враги — на левом канале (x < 150) или на верхнем
    const enemyOnLeft = nearbyEnemies.some(e => {
      const enemyConfig = ENEMIES[e.type];
      const pos = getPositionOnPath(path, e.progress, enemyConfig.oscillation);
      return pos.x < 150;
    });

    if (enemyOnLeft) {
      // Враги на левом канале — горизонтальный барьер
      return { x: channelCenterOffset, y: modulePos.y, isHorizontal: true };
    } else {
      // Враги на верхнем канале — вертикальный барьер
      return { x: modulePos.x, y: channelCenterOffset, isHorizontal: false };
    }
  }

  // УГЛОВАЯ ЯЧЕЙКА ПРАВАЯ ВЕРХНЯЯ (x=GRID_COLS-1, y=0)
  if (module.x === GRID_COLS - 1 && module.y === 0) {
    const nearbyEnemies = enemies.filter(e => {
      if (e.hp <= 0) return false;
      const enemyConfig = ENEMIES[e.type];
      const enemyPos = getPositionOnPath(path, e.progress, enemyConfig.oscillation);
      const dist = Math.sqrt(
        Math.pow(enemyPos.x - modulePos.x, 2) +
        Math.pow(enemyPos.y - modulePos.y, 2)
      );
      return dist < 150;
    });

    if (nearbyEnemies.length === 0) return null;

    // Проверяем где враги — на верхнем канале (y < 150) или на правом
    const enemyOnTop = nearbyEnemies.some(e => {
      const enemyConfig = ENEMIES[e.type];
      const pos = getPositionOnPath(path, e.progress, enemyConfig.oscillation);
      return pos.y < 150;
    });

    if (enemyOnTop) {
      // Враги на верхнем канале — вертикальный барьер
      return { x: modulePos.x, y: channelCenterOffset, isHorizontal: false };
    } else {
      // Враги на правом канале — горизонтальный барьер
      return { x: totalWidth - channelCenterOffset, y: modulePos.y, isHorizontal: true };
    }
  }

  // Остальные ячейки — стандартная логика
  if (module.x === 0) {
    return { x: channelCenterOffset, y: modulePos.y, isHorizontal: true };
  }

  if (module.x === GRID_COLS - 1) {
    return { x: totalWidth - channelCenterOffset, y: modulePos.y, isHorizontal: true };
  }

  if (module.y === 0) {
    return { x: modulePos.x, y: channelCenterOffset, isHorizontal: false };
  }

  // Модуль НЕ рядом с каналом — барьер не работает
  return null;
}

/**
 * Рассчитывает cooldown барьера по уровню
 * Формула: 11 - (level - 1) * 0.75 сек
 */
export function getBarrierCooldown(level: number): number {
  const seconds = 11 - (level - 1) * 0.75;
  return seconds * 1000; // в мс
}

/**
 * Рассчитывает длительность блокировки врага барьером
 */
export function getBlockDuration(enemy: Enemy, baseDuration: number): number {
  if (enemy.type.startsWith('boss_')) return Math.floor(baseDuration * 0.35);
  if (['abrasive', 'metal', 'corrosion'].includes(enemy.type)) return Math.floor(baseDuration * 0.7);
  return baseDuration;
}

/**
 * Находит всех врагов в зоне барьера (для блокировки)
 */
export function findEnemiesInBarrierRange(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[]
): Enemy[] {
  return enemies.filter(e => e.hp > 0 && isInRange(module, e, path));
}

/**
 * Находит ближайшую точку на пути к модулю и определяет направление канала
 * isHorizontal = true: канал идёт вертикально, барьер горизонтальный
 * isHorizontal = false: канал идёт горизонтально, барьер вертикальный
 */
export function findClosestPathPointWithDirection(
  modulePos: { x: number; y: number },
  path: PathPoint[]
): { point: PathPoint; isHorizontal: boolean } {
  let closestIndex = 0;
  let minDist = Infinity;

  for (let i = 0; i < path.length; i++) {
    const point = path[i];
    const dist = Math.sqrt(
      Math.pow(point.x - modulePos.x, 2) +
      Math.pow(point.y - modulePos.y, 2)
    );
    if (dist < minDist) {
      minDist = dist;
      closestIndex = i;
    }
  }

  const closest = path[closestIndex];

  // Определяем направление канала по соседним точкам
  const prev = path[Math.max(0, closestIndex - 1)];
  const next = path[Math.min(path.length - 1, closestIndex + 1)];

  const dx = Math.abs(next.x - prev.x);
  const dy = Math.abs(next.y - prev.y);

  // Если канал идёт вертикально (dy > dx), барьер горизонтальный
  // Если канал идёт горизонтально (dx > dy), барьер вертикальный
  const isHorizontal = dy > dx;

  return { point: closest, isHorizontal };
}

// ==================== TARGETING ====================

export type TargetingMode = 'first' | 'closest' | 'strongest' | 'weakest' | 'analyzer';

/**
 * Находит цель для модуля
 * ВАЖНО: Модули атакуют ВСЕХ врагов, не только в range!
 * Эффективность урона зависит от расстояния (см. getDistanceEfficiency)
 */
export function findTarget(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[],
  mode: TargetingMode = 'first'
): Enemy | null {
  // НЕ фильтруем по range! Выбираем из ВСЕХ врагов
  if (enemies.length === 0) return null;

  const modulePos = getModulePosition(module);

  switch (mode) {
    case 'first':
      // Враг с максимальным progress (ближе к финишу)
      return enemies.reduce((best, enemy) =>
        enemy.progress > best.progress ? enemy : best
      );

    case 'closest':
      // Враг ближе всего к модулю
      return enemies.reduce((best, enemy) => {
        const bestConfig = ENEMIES[best.type];
        const enemyConfig = ENEMIES[enemy.type];
        const bestPos = getPositionOnPath(path, best.progress, bestConfig.oscillation);
        const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);
        const bestDist = getDistance(modulePos.x, modulePos.y, bestPos.x, bestPos.y);
        const enemyDist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
        return enemyDist < bestDist ? enemy : best;
      });

    case 'strongest':
      return enemies.reduce((best, enemy) =>
        enemy.hp > best.hp ? enemy : best
      );

    case 'weakest':
      return enemies.reduce((best, enemy) =>
        enemy.hp < best.hp ? enemy : best
      );

    case 'analyzer':
      // Новый таргетинг: приоритет непомеченным → боссам → по прогрессу

      // Фильтруем врагов БЕЗ метки marked
      const unmarked = enemies.filter(e =>
        !e.effects.some(eff => eff.type === 'marked')
      );

      // Если есть непомеченные — выбираем из них, иначе из всех
      const pool = unmarked.length > 0 ? unmarked : enemies;

      // Приоритет: боссы
      const bosses = pool.filter(e => e.type.startsWith('boss_'));
      if (bosses.length > 0) {
        // Среди боссов — ближе к финишу
        return bosses.reduce((a, b) => a.progress > b.progress ? a : b);
      }

      // Среди обычных — ближе к финишу
      return pool.reduce((a, b) => a.progress > b.progress ? a : b);

    default:
      return enemies[0];
  }
}

/**
 * Находит всех врагов для AOE
 * ВАЖНО: Возвращаем ВСЕХ врагов — урон зависит от расстояния
 */
export function findAllInRange(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[]
): Enemy[] {
  // Возвращаем ВСЕХ врагов — без фильтра по range
  return enemies;
}

/**
 * Находит всех врагов на линии (для pierce)
 * ВАЖНО: Нет ограничения по range — лазер бьёт через всю карту
 */
export function findAllOnLine(
  module: Module,
  target: Enemy,
  enemies: Enemy[],
  path: PathPoint[]
): Enemy[] {
  const modulePos = getModulePosition(module);
  const targetConfig = ENEMIES[target.type];
  const targetPos = getPositionOnPath(path, target.progress, targetConfig.oscillation);

  // Направление луча
  const dx = targetPos.x - modulePos.x;
  const dy = targetPos.y - modulePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / length;
  const dirY = dy / length;

  // Проверяем каждого врага — БЕЗ ограничения по range
  return enemies.filter(enemy => {
    const enemyConfig = ENEMIES[enemy.type];
    const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);

    // Расстояние от линии луча
    const toEnemyX = enemyPos.x - modulePos.x;
    const toEnemyY = enemyPos.y - modulePos.y;
    const projection = toEnemyX * dirX + toEnemyY * dirY;
    if (projection < 0) return false;  // позади модуля

    const closestX = modulePos.x + dirX * projection;
    const closestY = modulePos.y + dirY * projection;
    const distFromLine = getDistance(enemyPos.x, enemyPos.y, closestX, closestY);

    return distFromLine < enemyConfig.size + 10;  // +10 для погрешности
  });
}

/**
 * Находит цепочку целей для Электростатика
 * Каждая следующая цель - ближайший враг к предыдущему
 */
export function findChainTargets(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[],
  maxTargets: number
): Enemy[] {
  const targets: Enemy[] = [];
  const primary = findTarget(module, enemies, path, 'first');
  if (!primary) return targets;

  targets.push(primary);
  const chainRadius = 100;

  while (targets.length < maxTargets) {
    const last = targets[targets.length - 1];
    const lastConfig = ENEMIES[last.type];
    const lastPos = getPositionOnPath(path, last.progress, lastConfig.oscillation);

    let nearest: Enemy | null = null;
    let nearestDist = Infinity;

    for (const enemy of enemies) {
      if (targets.includes(enemy)) continue;
      const enemyConfig = ENEMIES[enemy.type];
      const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);
      const dist = getDistance(lastPos.x, lastPos.y, enemyPos.x, enemyPos.y);
      if (dist < chainRadius && dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    if (!nearest) break;
    targets.push(nearest);
  }

  return targets;
}

// ==================== РАСЧЁТ УРОНА ====================

/**
 * Рассчитывает коэффициент эффективности по расстоянию
 * ВАЖНО: Затухание ТОЛЬКО у магнита и ультразвука!
 * Все остальные модули бьют на 100% с любого расстояния
 */
export function getDistanceEfficiency(distance: number, moduleType: ModuleType): number {
  const config = MODULES[moduleType];
  const maxRange = config.range;

  // Нормализованное расстояние (0 = вплотную, 1 = на границе range)
  const normalized = Math.min(distance / maxRange, 3);  // cap at 3x range

  switch (moduleType) {
    case 'magnet':
      // Магнитное поле — быстрое затухание (квадратичное)
      // Минимум 15%, степень 2.5
      return Math.max(0.15, 1 - Math.pow(normalized, 2.5) * 0.85);

    case 'ultrasonic':
      // Звуковые волны — умеренное затухание
      // Минимум 50%, степень 1.5
      return Math.max(0.50, 1 - Math.pow(normalized, 1.5) * 0.5);

    // ВСЕ ОСТАЛЬНЫЕ — БЕЗ ЗАТУХАНИЯ (всегда 100%)
    case 'laser':
    case 'cooler':
    case 'lubricant':
    case 'filter':
    default:
      return 1.0;
  }
}

/**
 * Проверяет бонус от соседней смазки
 * ОГРАНИЧЕНИЯ:
 * - Смазка НЕ может получать бафф от другой смазки
 * - Модуль получает бафф только от ОДНОЙ смазки (лучшей по уровню)
 * - Диагональные соседи дают 65% от бонуса
 */
export function getLubricantBonus(module: Module, allModules: Module[]): number {
  // Смазка НЕ может получать бафф от другой смазки
  if (module.type === 'lubricant') {
    return 0;
  }

  // Находим все соседние смазки
  const lubricants = allModules.filter(m => {
    if (m.id === module.id) return false;
    if (m.type !== 'lubricant') return false;
    return Math.abs(m.x - module.x) <= 1 && Math.abs(m.y - module.y) <= 1;
  });

  if (lubricants.length === 0) return 0;

  // Берём только ОДНУ лучшую смазку (по уровню)
  const bestLubricant = lubricants.reduce((best, lub) =>
    lub.level > best.level ? lub : best
  );

  const BASE_BUFF = 0.25;  // 25% базовый бафф

  // Проверяем: ортогональный или диагональный сосед
  const dx = Math.abs(bestLubricant.x - module.x);
  const dy = Math.abs(bestLubricant.y - module.y);
  const isDiagonal = dx === 1 && dy === 1;

  // Бонус от уровня смазки: +8% за уровень
  const levelBonus = 1 + (bestLubricant.level - 1) * 0.08;

  if (isDiagonal) {
    return BASE_BUFF * 0.65 * levelBonus;  // 65% для диагонали
  } else {
    return BASE_BUFF * levelBonus;          // 100% для ортогонали
  }
}

/**
 * Проверяет, есть ли рядом враг-коррозия (дебафф модулям)
 */
export function getCorrosionPenalty(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[]
): number {
  const modulePos = getModulePosition(module);
  const corrosionRadius = 140;  // радиус дебаффа коррозии

  const nearbyCorrosion = enemies.filter(enemy => {
    if (enemy.type !== 'corrosion') return false;
    const enemyConfig = ENEMIES[enemy.type];
    const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);
    const dist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
    return dist <= corrosionRadius;
  });

  // Мультипликативные стеки: 1=-20%, 2=-36%, 3=-48.8%
  const stacks = Math.min(nearbyCorrosion.length, 3);
  const multiplier = Math.pow(0.8, stacks);
  return 1 - multiplier;
}

/**
 * Проверяет защиту от коррозии от соседних ингибиторов
 * Возвращает коэффициент снижения штрафа коррозии (0 = нет защиты, 0.5+ = есть защита)
 */
export function getInhibitorProtection(module: Module, allModules: Module[]): number {
  if (module.type === 'inhibitor') return 0;

  const inhibitors = allModules.filter(m => {
    if (m.type !== 'inhibitor') return false;
    return Math.abs(m.x - module.x) <= 1 && Math.abs(m.y - module.y) <= 1;
  });

  if (inhibitors.length === 0) return 0;

  const best = inhibitors.reduce((a, b) => a.level > b.level ? a : b);
  return 0.5 + (best.level - 1) * 0.0375;  // 50% + 3.75% за уровень
}

/**
 * Вычисляет урон с учётом всех бонусов и штрафов
 */
export function calculateDamage(
  module: Module,
  target: Enemy,
  allModules: Module[],
  allEnemies: Enemy[],
  path: PathPoint[],
  enemiesInAoe: number = 1  // для ультразвука
): number {
  const moduleConfig = MODULES[module.type];
  const targetConfig = ENEMIES[target.type];

  // Базовый урон
  let damage = getDamage(moduleConfig.baseDamage, module.level);

  // Коэффициент по расстоянию (ближе = сильнее)
  const modulePos = getModulePosition(module);
  const targetPos = getPositionOnPath(path, target.progress, targetConfig.oscillation);
  const distance = getDistance(modulePos.x, modulePos.y, targetPos.x, targetPos.y);
  const distanceEfficiency = getDistanceEfficiency(distance, module.type);
  damage *= distanceEfficiency;

  // Бонусы по тегам врага
  if (moduleConfig.tagBonuses) {
    for (const tag of targetConfig.tags) {
      if (moduleConfig.tagBonuses[tag]) {
        damage *= moduleConfig.tagBonuses[tag];
      }
    }
  }

  // Штрафы по тегам врага
  if (moduleConfig.tagPenalties) {
    for (const tag of targetConfig.tags) {
      if (moduleConfig.tagPenalties[tag]) {
        damage *= moduleConfig.tagPenalties[tag];
      }
    }
  }

  // Бонус от смазки (соседний модуль смазки)
  const lubricantBonus = getLubricantBonus(module, allModules);
  damage *= (1 + lubricantBonus);

  // Бонус от coated дебаффа на враге (смазка накладывает +15% получаемого урона)
  const coatedEffect = target.effects.find(e => e.type === 'coated');
  if (coatedEffect) {
    damage *= (1 + coatedEffect.strength / 100);  // +15% урон
  }

  // Бонус от marked дебаффа (Анализатор накладывает +25% урона)
  const markedEffect = target.effects.find(e => e.type === 'marked');
  if (markedEffect) {
    damage *= (1 + markedEffect.strength / 100);  // +25% урон
  }

  // Штраф от коррозии (кроме фильтра и ингибитора — они иммунны)
  if (module.type !== 'filter' && module.type !== 'inhibitor') {
    const corrosionPenalty = getCorrosionPenalty(module, allEnemies, path);
    const inhibitorProtection = getInhibitorProtection(module, allModules);
    const finalCorrosionPenalty = corrosionPenalty * (1 - inhibitorProtection);
    damage *= (1 - Math.min(finalCorrosionPenalty, 0.6));  // максимум -60%
  }

  // Ультразвук: бонус от количества врагов
  if (module.type === 'ultrasonic' && enemiesInAoe > 1) {
    // +10% за каждого врага сверх первого, максимум +50%
    const aoeBonus = Math.min((enemiesInAoe - 1) * 0.1, 0.5);
    damage *= (1 + aoeBonus);
  }

  return Math.floor(damage);
}

// ==================== ПРИМЕНЕНИЕ ЭФФЕКТОВ ====================

/**
 * Наносит урон врагу и обновляет lastDamageTime
 */
export function damageEnemy(enemy: Enemy, damage: number): Enemy {
  return {
    ...enemy,
    hp: Math.max(0, enemy.hp - damage),
    lastDamageTime: Date.now(),
  };
}

/**
 * Получает cap для эффекта в зависимости от типа врага
 */
function getEffectCap(effectType: EffectType, enemyType: EnemyType): number {
  const isBoss = enemyType.startsWith('boss_');
  const isElite = ['metal', 'corrosion', 'abrasive'].includes(enemyType);

  switch (effectType) {
    case 'slow':
      if (isBoss) return 50;      // Боссы: max 50% slow
      if (isElite) return 60;     // Элиты: max 60% slow
      return 75;                   // Обычные: max 75% slow
    case 'coated':
      if (isBoss) return 25;      // Боссы: max +25% урона
      if (isElite) return 35;     // Элиты: max +35% урона
      return 45;                   // Обычные: max +45% урона
    case 'burn':
      return 20;                   // Max 20 HP/сек для всех
    default:
      return 100;
  }
}

/**
 * Применяет эффект к врагу с diminishing returns
 */
export function applyEffect(enemy: Enemy, effect: Effect): Enemy {
  // Проверяем иммунитеты
  if (effect.type === 'slow' && enemy.type === 'moisture') {
    // Dry эффект снимает иммунитет к slow у влаги
    const hasDry = enemy.effects.some(e => e.type === 'dry');
    if (!hasDry) {
      return enemy;  // влага иммунна к замедлению БЕЗ dry
    }
    // С dry эффектом замедление работает, но слабее
    effect = { ...effect, strength: Math.floor(effect.strength * 0.5) };
  }
  if (effect.type === 'burn' && enemy.type === 'heat') {
    return enemy;  // перегрев иммунен к ожогу
  }

  const cap = getEffectCap(effect.type, enemy.type);
  const existingIndex = enemy.effects.findIndex(e => e.type === effect.type);

  if (existingIndex >= 0) {
    const existing = enemy.effects[existingIndex];

    // Diminishing returns: новый эффект добавляет 50% от разницы до капа
    const currentStrength = existing.strength;
    const remainingToCap = cap - currentStrength;
    const addedStrength = Math.min(effect.strength, remainingToCap) * 0.5;
    const newStrength = Math.min(cap, currentStrength + addedStrength);

    // Длительность: берём максимум (refresh)
    const newDuration = Math.max(existing.duration, effect.duration);

    const updated = [...enemy.effects];
    updated[existingIndex] = {
      type: effect.type,
      strength: Math.floor(newStrength),
      duration: newDuration,
    };
    return { ...enemy, effects: updated };
  } else {
    // Первый эффект: применяем как есть, но с учётом капа
    const cappedStrength = Math.min(effect.strength, cap);
    return {
      ...enemy,
      effects: [...enemy.effects, { ...effect, strength: cappedStrength }],
    };
  }
}

// ==================== ОБРАБОТКА АТАКИ ====================

/**
 * Проверяет, может ли модуль атаковать (прошло достаточно времени)
 * @param gameSpeed - множитель скорости (1 = нормальная, 3 = 3x быстрее)
 */
export function canAttack(module: Module, currentTime: number, gameSpeed: number = 1): boolean {
  // Барьер имеет особый cooldown по уровню
  if (module.type === 'barrier') {
    const cooldown = getBarrierCooldown(module.level) / gameSpeed;
    return currentTime - module.lastAttack >= cooldown;
  }

  const config = MODULES[module.type];
  const attackInterval = 1000 / config.attackSpeed / gameSpeed;  // мс между атаками (ускоряется с gameSpeed)
  return currentTime - module.lastAttack >= attackInterval;
}

/**
 * Обрабатывает атаку одного модуля
 * Возвращает: обновлённых врагов, обновлённый модуль, эффект атаки (для визуала), новый барьер
 */
export function processModuleAttack(
  module: Module,
  enemies: Enemy[],
  allModules: Module[],
  path: PathPoint[],
  currentTime: number,
  gameSpeed: number = 1
): {
  updatedEnemies: Enemy[];
  updatedModule: Module;
  attackEffect: AttackEffect | null;
  newBarrier: ActiveBarrier | null;
} {
  // Проверяем cooldown (с учётом gameSpeed)
  if (!canAttack(module, currentTime, gameSpeed)) {
    return { updatedEnemies: enemies, updatedModule: module, attackEffect: null, newBarrier: null };
  }

  const config = MODULES[module.type];
  const modulePos = getModulePosition(module);

  // ==================== ОСОБАЯ ЛОГИКА БАРЬЕРА ====================
  if (module.type === 'barrier') {
    // 1. Вычисляем позицию барьера ГЕОМЕТРИЧЕСКИ
    const barrierPos = getBarrierPosition(module, enemies, path);

    // Если модуль далеко от канала (не в крайнем столбце/строке) — барьер не работает
    if (!barrierPos) {
      return { updatedEnemies: enemies, updatedModule: module, attackEffect: null, newBarrier: null };
    }

    // 2. Проверяем есть ли враги которые:
    //    - БЛИЗКО к позиции барьера (< 60 пикселей)
    //    - Ещё НЕ ПРОШЛИ барьер (по направлению движения)
    const enemiesReadyForBarrier = enemies.filter(e => {
      if (e.hp <= 0) return false;

      const enemyConfig = ENEMIES[e.type];
      const enemyPos = getPositionOnPath(path, e.progress, enemyConfig.oscillation);

      // Расстояние от врага до ПОЗИЦИИ БАРЬЕРА (не до модуля!)
      const distToBarrierPos = Math.sqrt(
        Math.pow(enemyPos.x - barrierPos.x, 2) +
        Math.pow(enemyPos.y - barrierPos.y, 2)
      );

      // Враг должен быть БЛИЗКО к позиции барьера
      if (distToBarrierPos > 50) {
        return false;  // Слишком далеко — не активируем
      }

      // Проверяем что враг ещё НЕ ПРОШЁЛ барьер
      // Для левого канала (module.x === 0): враг идёт СНИЗУ ВВЕРХ
      if (module.x === 0) {
        return enemyPos.y > barrierPos.y;  // враг ниже барьера = ещё не дошёл
      }

      // Для правого канала: враг идёт СВЕРХУ ВНИЗ
      if (module.x === GRID_COLS - 1) {
        return enemyPos.y < barrierPos.y;  // враг выше барьера = ещё не дошёл
      }

      // Для верхнего канала: враг идёт СЛЕВА НАПРАВО
      if (module.y === 0) {
        return enemyPos.x < barrierPos.x;  // враг левее барьера = ещё не дошёл
      }

      return false;
    });

    if (enemiesReadyForBarrier.length === 0) {
      // Никто не подошёл к барьеру — не активируем
      return { updatedEnemies: enemies, updatedModule: module, attackEffect: null, newBarrier: null };
    }

    // 3. Создаём барьер (3 секунды)
    const baseDuration = config.effectDuration || 3000;
    const barrierId = `barrier-${module.id}-${currentTime}`;

    const newBarrier: ActiveBarrier = {
      id: barrierId,
      moduleId: module.id,
      x: barrierPos.x,
      y: barrierPos.y,
      duration: baseDuration,
      maxDuration: baseDuration,
      createdAt: currentTime,
      bossPresure: enemiesReadyForBarrier.some(e => e.type.startsWith('boss_')),
      isHorizontal: barrierPos.isHorizontal,
    };

    // Блокировка будет динамической в page.tsx — по расстоянию до барьера

    // Визуальный эффект барьера
    const attackEffect: AttackEffect = {
      id: barrierId,
      type: 'barrier',
      moduleType: module.type,
      fromX: barrierPos.x,
      fromY: barrierPos.y,
      toX: barrierPos.x,
      toY: barrierPos.y,
      color: config.color,
      startTime: currentTime,
      duration: baseDuration,
      progress: 0,
    };

    const updatedModule: Module = {
      ...module,
      lastAttack: currentTime,
    };

    return { updatedEnemies: enemies, updatedModule, attackEffect, newBarrier };
  }

  // ==================== ОБЫЧНЫЕ МОДУЛИ ====================
  // Находим цель(и)
  let targets: Enemy[] = [];

  if (module.type === 'electrostatic') {
    // Электростатик — цепная молния на 4 врагов
    targets = findChainTargets(module, enemies, path, 4);
  } else if (config.aoeRadius) {
    // AOE — бьём всех в радиусе
    targets = findAllInRange(module, enemies, path);
  } else if (config.piercing) {
    // Pierce — находим первую цель, потом всех на линии
    const primary = findTarget(module, enemies, path, 'first');
    if (primary) {
      targets = findAllOnLine(module, primary, enemies, path);
    }
  } else if (module.type === 'analyzer') {
    // Анализатор — приоритет босс > жирный
    const target = findTarget(module, enemies, path, 'analyzer');
    if (target) {
      targets = [target];
    }
  } else {
    // Обычная атака — одна цель
    const target = findTarget(module, enemies, path, 'first');
    if (target) {
      targets = [target];
    }
  }

  if (targets.length === 0) {
    return { updatedEnemies: enemies, updatedModule: module, attackEffect: null, newBarrier: null };
  }

  // Наносим урон
  let updatedEnemies = [...enemies];

  // Электростатик: урон затухает по цепи
  if (module.type === 'electrostatic') {
    const damageMultipliers = [1.0, 0.6, 0.4, 0.25];
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const baseDamage = calculateDamage(module, target, allModules, enemies, path, 1);
      const finalDamage = Math.floor(baseDamage * damageMultipliers[i]);

      const index = updatedEnemies.findIndex(e => e.id === target.id);
      if (index >= 0) {
        updatedEnemies[index] = damageEnemy(updatedEnemies[index], finalDamage);
      }
    }
  } else {
    // Стандартная обработка для остальных модулей
    for (const target of targets) {
      const damage = calculateDamage(
        module, target, allModules, enemies, path, targets.length
      );

      const index = updatedEnemies.findIndex(e => e.id === target.id);
      if (index >= 0) {
        // Наносим урон
        updatedEnemies[index] = damageEnemy(updatedEnemies[index], damage);

        // Применяем эффект модуля с учётом уровня
        if (config.effectType && config.effectDuration && config.effectStrength) {
          // Анализатор: снимаем ВСЕ старые метки перед применением новой
          if (module.type === 'analyzer') {
            updatedEnemies = updatedEnemies.map(e => ({
              ...e,
              effects: e.effects.filter(eff => eff.type !== 'marked')
            }));
          }

          const effect: Effect = {
            type: config.effectType,
            duration: getEffectDuration(config.effectDuration, module.level),
            strength: getEffectStrength(config.effectStrength, module.level),
          };
          updatedEnemies[index] = applyEffect(updatedEnemies[index], effect);
        }

        // Сепаратор замедляет металл (физика: магнит притягивает)
        if (module.type === 'magnet') {
          const enemyConfig = ENEMIES[target.type];
          if (enemyConfig.tags.includes('metal')) {
            const slowEffect: Effect = {
              type: 'slow',
              duration: 2000,  // 2 секунды
              strength: 20,    // 20% замедление
            };
            updatedEnemies[index] = applyEffect(updatedEnemies[index], slowEffect);
          }
        }

        // Центрифуга: плавный откат врагов назад
        if (module.type === 'centrifuge') {
          const hasAntiPush = updatedEnemies[index].effects.some(e => e.type === 'antiPush');
          const hasPushback = updatedEnemies[index].effects.some(e => e.type === 'pushback');
          if (!hasAntiPush && !hasPushback) {
            const isBoss = target.type.startsWith('boss_');
            const isElite = ['abrasive', 'metal', 'corrosion'].includes(target.type);

            // strength = общий откат (0.04 = 4%), duration = время анимации
            let pushAmount = 0.04;  // 4% назад
            if (isElite) pushAmount = 0.02;
            if (isBoss) pushAmount = 0.008;

            updatedEnemies[index] = {
              ...updatedEnemies[index],
              effects: [
                ...updatedEnemies[index].effects,
                // pushback: strength в процентах * 1000 для точности (40 = 0.04)
                { type: 'pushback' as EffectType, duration: 400, strength: pushAmount * 1000 },
                { type: 'antiPush' as EffectType, duration: 2500, strength: 0 }
              ]
            };
          }
        }

        // Барьер обрабатывается отдельно выше, сюда не попадает
      }
    }
  }

  // Создаём визуальный эффект атаки
  const primaryTarget = targets[0];
  const targetConfig = ENEMIES[primaryTarget.type];
  const targetPos = getPositionOnPath(path, primaryTarget.progress, targetConfig.oscillation);

  // Анализатор: прицел держится пока активен эффект marked (3000мс)
  const effectDuration = module.type === 'analyzer'
    ? (config.effectDuration || 3000)  // Длительность эффекта marked
    : config.attackType === 'beam' ? 150 : 300;

  const attackEffect: AttackEffect = {
    id: `attack-${module.id}-${currentTime}`,
    type: config.attackType || 'beam',
    moduleType: module.type,
    fromX: modulePos.x,
    fromY: modulePos.y,
    toX: targetPos.x,
    toY: targetPos.y,
    color: config.color,
    startTime: currentTime,
    duration: effectDuration,
    progress: 0,
    targetId: primaryTarget.id,  // Для удаления при смерти врага
  };

  // Обновляем lastAttack модуля
  const updatedModule: Module = {
    ...module,
    lastAttack: currentTime,
  };

  return { updatedEnemies, updatedModule, attackEffect, newBarrier: null };
}

/**
 * Обрабатывает атаки всех модулей
 * @param gameSpeed - множитель скорости геймплея
 */
export function processAllAttacks(
  modules: Module[],
  enemies: Enemy[],
  path: PathPoint[],
  currentTime: number,
  gameSpeed: number = 1
): {
  updatedEnemies: Enemy[];
  updatedModules: Module[];
  newAttackEffects: AttackEffect[];
  newBarriers: ActiveBarrier[];
} {
  let updatedEnemies = enemies;
  let updatedModules = [...modules];
  const newAttackEffects: AttackEffect[] = [];
  const newBarriers: ActiveBarrier[] = [];

  for (let i = 0; i < modules.length; i++) {
    const result = processModuleAttack(
      updatedModules[i],
      updatedEnemies,
      updatedModules,
      path,
      currentTime,
      gameSpeed
    );

    updatedEnemies = result.updatedEnemies;
    updatedModules[i] = result.updatedModule;

    if (result.attackEffect) {
      newAttackEffects.push(result.attackEffect);
    }

    if (result.newBarrier) {
      newBarriers.push(result.newBarrier);
    }
  }

  return { updatedEnemies, updatedModules, newAttackEffects, newBarriers };
}

// ==================== ОБРАБОТКА ЭФФЕКТОВ ВО ВРЕМЕНИ ====================

/**
 * Применяет Burn урон ко всем врагам с эффектом burn
 */
export function processBurnDamage(enemies: Enemy[], deltaTime: number): Enemy[] {
  return enemies.map(enemy => {
    const burnEffect = enemy.effects.find(e => e.type === 'burn');
    if (!burnEffect) return enemy;

    // Урон в секунду * deltaTime
    const damage = burnEffect.strength * (deltaTime / 1000);
    return {
      ...enemy,
      hp: Math.max(0, enemy.hp - damage),
      lastDamageTime: Date.now(),
    };
  });
}

/**
 * Применяет регенерацию HP боссу Питтинг
 */
export function processBossRegeneration(enemies: Enemy[], deltaTime: number): Enemy[] {
  return enemies.map(enemy => {
    if (enemy.type !== 'boss_pitting') return enemy;

    // Регенерация 10 HP/сек
    const regen = 10 * (deltaTime / 1000);
    return {
      ...enemy,
      hp: Math.min(enemy.maxHp, enemy.hp + regen),
    };
  });
}

// ==================== РАНДОМИЗАЦИЯ МАГАЗИНА ====================

/**
 * Генерирует случайный набор модулей для магазина
 * - Только разблокированные модули для текущей волны
 * - Максимум 2 одинаковых модуля в магазине
 */
export function generateShopSlots(wave: number): ModuleType[] {
  // Получаем доступные модули для текущей волны
  const available = (Object.entries(MODULE_UNLOCK_WAVES) as [ModuleType, number][])
    .filter(([_, unlockWave]) => wave >= unlockWave)
    .map(([type]) => type);

  if (available.length === 0) return [];

  // Перемешиваем массив (Fisher-Yates shuffle)
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const slots: ModuleType[] = [];
  const count: Partial<Record<ModuleType, number>> = {};

  // Заполняем 6 слотов
  let shuffleIndex = 0;
  while (slots.length < 6) {
    const type = shuffled[shuffleIndex % shuffled.length];
    const currentCount = count[type] || 0;

    // Максимум 2 одинаковых модуля
    if (currentCount < 2) {
      slots.push(type);
      count[type] = currentCount + 1;
    }

    shuffleIndex++;

    // Защита от бесконечного цикла
    if (shuffleIndex > 100) break;
  }

  return slots;
}
