import {
  Module, ModuleConfig, MODULES, getDamage,
  Enemy, EnemyConfig, ENEMIES, EnemyTag,
  Effect, EffectType, AttackEffect,
  CELL_SIZE, CONVEYOR_WIDTH,
  MODULE_UNLOCK_WAVES, ModuleType
} from './types';
import { PathPoint, getPositionOnPath } from './enemies';

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Получает позицию центра модуля в пикселях
 */
export function getModulePosition(module: Module): { x: number; y: number } {
  // Учитываем что сетка начинается после левого конвейера
  const gridStartX = CONVEYOR_WIDTH;
  const gridStartY = CONVEYOR_WIDTH;

  const x = gridStartX + module.x * CELL_SIZE + CELL_SIZE / 2;
  const y = gridStartY + module.y * CELL_SIZE + CELL_SIZE / 2;

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
 * @param mode - режим выбора цели:
 *   'first' - враг ближе всего к финишу (макс progress)
 *   'closest' - враг ближе всего к модулю
 *   'strongest' - враг с наибольшим HP
 *   'weakest' - враг с наименьшим HP
 */
export function findTarget(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[],
  mode: TargetingMode = 'first'
): Enemy | null {
  // Фильтруем врагов в радиусе
  const inRange = enemies.filter(enemy => isInRange(module, enemy, path));

  if (inRange.length === 0) return null;

  const modulePos = getModulePosition(module);

  switch (mode) {
    case 'first':
      // Враг с максимальным progress (ближе к финишу)
      return inRange.reduce((best, enemy) =>
        enemy.progress > best.progress ? enemy : best
      );

    case 'closest':
      // Враг ближе всего к модулю
      return inRange.reduce((best, enemy) => {
        const bestConfig = ENEMIES[best.type];
        const enemyConfig = ENEMIES[enemy.type];
        const bestPos = getPositionOnPath(path, best.progress, bestConfig.oscillation);
        const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);
        const bestDist = getDistance(modulePos.x, modulePos.y, bestPos.x, bestPos.y);
        const enemyDist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
        return enemyDist < bestDist ? enemy : best;
      });

    case 'strongest':
      return inRange.reduce((best, enemy) =>
        enemy.hp > best.hp ? enemy : best
      );

    case 'weakest':
      return inRange.reduce((best, enemy) =>
        enemy.hp < best.hp ? enemy : best
      );

    default:
      return inRange[0];
  }
}

/**
 * Находит всех врагов в радиусе (для AOE)
 */
export function findAllInRange(
  module: Module,
  enemies: Enemy[],
  path: PathPoint[]
): Enemy[] {
  return enemies.filter(enemy => isInRange(module, enemy, path));
}

/**
 * Находит всех врагов на линии (для pierce)
 */
export function findAllOnLine(
  module: Module,
  target: Enemy,
  enemies: Enemy[],
  path: PathPoint[]
): Enemy[] {
  const modulePos = getModulePosition(module);
  const config = MODULES[module.type];
  const targetConfig = ENEMIES[target.type];
  const targetPos = getPositionOnPath(path, target.progress, targetConfig.oscillation);

  // Направление луча
  const dx = targetPos.x - modulePos.x;
  const dy = targetPos.y - modulePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const dirX = dx / length;
  const dirY = dy / length;

  // Проверяем каждого врага
  return enemies.filter(enemy => {
    const enemyConfig = ENEMIES[enemy.type];
    const enemyPos = getPositionOnPath(path, enemy.progress, enemyConfig.oscillation);

    // Расстояние от модуля
    const dist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
    if (dist > config.range) return false;

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
 * Проверяет, есть ли соседний модуль смазки
 */
export function getLubricantBonus(module: Module, allModules: Module[]): number {
  const neighbors = allModules.filter(m => {
    if (m.id === module.id) return false;
    if (m.type !== 'lubricant') return false;
    // Соседи = разница по x и y не больше 1
    return Math.abs(m.x - module.x) <= 1 && Math.abs(m.y - module.y) <= 1;
  });

  // Каждая смазка даёт +25%
  return neighbors.length * 0.25;
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

  // Бонус от смазки
  const lubricantBonus = getLubricantBonus(module, allModules);
  damage *= (1 + lubricantBonus);

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
 * Применяет эффект к врагу
 */
export function applyEffect(enemy: Enemy, effect: Effect): Enemy {
  // Проверяем иммунитеты
  if (effect.type === 'slow' && enemy.type === 'moisture') {
    return enemy;  // влага иммунна к замедлению
  }
  if (effect.type === 'burn' && enemy.type === 'heat') {
    return enemy;  // перегрев иммунен к ожогу
  }

  // Проверяем, есть ли уже такой эффект
  const existingIndex = enemy.effects.findIndex(e => e.type === effect.type);

  if (existingIndex >= 0) {
    // Обновляем существующий эффект (берём максимальную силу и сбрасываем длительность)
    const updated = [...enemy.effects];
    updated[existingIndex] = {
      ...effect,
      strength: Math.max(enemy.effects[existingIndex].strength, effect.strength),
    };
    return { ...enemy, effects: updated };
  } else {
    // Добавляем новый эффект
    return { ...enemy, effects: [...enemy.effects, effect] };
  }
}

// ==================== ОБРАБОТКА АТАКИ ====================

/**
 * Проверяет, может ли модуль атаковать (прошло достаточно времени)
 */
export function canAttack(module: Module, currentTime: number): boolean {
  const config = MODULES[module.type];
  const attackInterval = 1000 / config.attackSpeed;  // мс между атаками
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
  currentTime: number
): {
  updatedEnemies: Enemy[];
  updatedModule: Module;
  attackEffect: AttackEffect | null;
} {
  // Проверяем cooldown
  if (!canAttack(module, currentTime)) {
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

      // Применяем эффект модуля
      if (config.effectType && config.effectDuration && config.effectStrength) {
        const effect: Effect = {
          type: config.effectType,
          duration: config.effectDuration,
          strength: config.effectStrength,
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
 */
export function processAllAttacks(
  modules: Module[],
  enemies: Enemy[],
  path: PathPoint[],
  currentTime: number
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
      currentTime
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
 */
export function generateShopSlots(wave: number): ModuleType[] {
  // Получаем доступные модули для текущей волны
  const available = (Object.entries(MODULE_UNLOCK_WAVES) as [ModuleType, number][])
    .filter(([_, unlockWave]) => wave >= unlockWave)
    .map(([type]) => type);

  if (available.length === 0) return [];

  // Выбираем 3 случайных модуля
  const slots: ModuleType[] = [];
  for (let i = 0; i < 3; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    slots.push(available[randomIndex]);
  }

  return slots;
}
