import {
  Module, ModuleConfig, MODULES, getDamage, getEffectDuration, getEffectStrength,
  Enemy, EnemyConfig, ENEMIES, EnemyTag, EnemyType,
  Effect, EffectType, AttackEffect,
  CELL_SIZE, CELL_GAP, PANEL_PADDING, CONVEYOR_WIDTH,
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

// ==================== TARGETING ====================

export type TargetingMode = 'first' | 'closest' | 'strongest' | 'weakest';

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
  const corrosionRadius = 80;  // радиус дебаффа коррозии

  const nearbyCorrosion = enemies.filter(enemy => {
    if (enemy.type !== 'corrosion') return false;
    const enemyConfig = ENEMIES[enemy.type];
    const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);
    const dist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
    return dist <= corrosionRadius;
  });

  // Каждая коррозия снижает урон на 20%
  return nearbyCorrosion.length * 0.2;
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

  // Штраф от коррозии (кроме фильтра — он игнорирует)
  if (module.type !== 'filter') {
    const corrosionPenalty = getCorrosionPenalty(module, allEnemies, path);
    damage *= (1 - Math.min(corrosionPenalty, 0.6));  // максимум -60%
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
    return enemy;  // влага иммунна к замедлению
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
  const config = MODULES[module.type];
  const attackInterval = 1000 / config.attackSpeed / gameSpeed;  // мс между атаками (ускоряется с gameSpeed)
  return currentTime - module.lastAttack >= attackInterval;
}

/**
 * Обрабатывает атаку одного модуля
 * Возвращает: обновлённых врагов, обновлённый модуль, эффект атаки (для визуала)
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
} {
  // Проверяем cooldown (с учётом gameSpeed)
  if (!canAttack(module, currentTime, gameSpeed)) {
    return { updatedEnemies: enemies, updatedModule: module, attackEffect: null };
  }

  const config = MODULES[module.type];
  const modulePos = getModulePosition(module);

  // Находим цель(и)
  let targets: Enemy[] = [];

  if (config.aoeRadius) {
    // AOE — бьём всех в радиусе
    targets = findAllInRange(module, enemies, path);
  } else if (config.piercing) {
    // Pierce — находим первую цель, потом всех на линии
    const primary = findTarget(module, enemies, path, 'first');
    if (primary) {
      targets = findAllOnLine(module, primary, enemies, path);
    }
  } else {
    // Обычная атака — одна цель
    const target = findTarget(module, enemies, path, 'first');
    if (target) {
      targets = [target];
    }
  }

  if (targets.length === 0) {
    return { updatedEnemies: enemies, updatedModule: module, attackEffect: null };
  }

  // Наносим урон
  let updatedEnemies = [...enemies];

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
        const effect: Effect = {
          type: config.effectType,
          duration: getEffectDuration(config.effectDuration, module.level),
          strength: getEffectStrength(config.effectStrength, module.level),
        };
        updatedEnemies[index] = applyEffect(updatedEnemies[index], effect);
      }

      // Сепаратор дополнительно замедляет металл
      if (module.type === 'magnet' && ENEMIES[target.type].tags.includes('metal')) {
        const slowEffect: Effect = {
          type: 'slow',
          duration: 1500,
          strength: 20,  // дополнительные 20% замедления
        };
        updatedEnemies[index] = applyEffect(updatedEnemies[index], slowEffect);
      }
    }
  }

  // Создаём визуальный эффект атаки
  const primaryTarget = targets[0];
  const targetConfig = ENEMIES[primaryTarget.type];
  const targetPos = getPositionOnPath(path, primaryTarget.progress, targetConfig.oscillation);

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
    duration: config.attackType === 'beam' ? 150 : 300,  // beam быстрее
    progress: 0,
  };

  // Обновляем lastAttack модуля
  const updatedModule: Module = {
    ...module,
    lastAttack: currentTime,
  };

  return { updatedEnemies, updatedModule, attackEffect };
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
} {
  let updatedEnemies = enemies;
  let updatedModules = [...modules];
  const newAttackEffects: AttackEffect[] = [];

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
  }

  return { updatedEnemies, updatedModules, newAttackEffects };
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
