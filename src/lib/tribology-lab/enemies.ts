import { Enemy, EnemyType, ENEMIES, getEnemyHp } from './types';

// ==================== ПУТЬ ДВИЖЕНИЯ ====================

export interface PathPoint {
  x: number;
  y: number;
}

/**
 * Генерирует точки дуги для плавного поворота
 */
function generateArcPoints(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  segments: number = 8
): PathPoint[] {
  const points: PathPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    points.push({
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    });
  }
  return points;
}

/**
 * Генерирует путь для врагов на основе размеров поля
 * Путь: СТАРТ (низ-лево) → вверх → вправо → вниз → ФИНИШ (низ-право)
 * Теперь с плавными дугами на поворотах
 */
export function generatePath(
  totalWidth: number,
  totalHeight: number,
  conveyorWidth: number,
  innerOffset: number,
  cornerRadius: number
): PathPoint[] {
  // Центр канала = середина между бортиком и внутренней панелью
  const channelCenterLeft = innerOffset + (conveyorWidth - innerOffset) / 2;
  const channelCenterTop = innerOffset + (conveyorWidth - innerOffset) / 2;
  const channelCenterRight = totalWidth - innerOffset - (conveyorWidth - innerOffset) / 2;

  // Радиус поворота (по центру канала)
  const turnRadius = channelCenterLeft;

  const path: PathPoint[] = [];

  // 1. Старт - внизу слева
  path.push({ x: channelCenterLeft, y: totalHeight - 5 });

  // 2. Вверх по левому каналу до начала поворота
  path.push({ x: channelCenterLeft, y: turnRadius + channelCenterTop });

  // 3. Левый верхний поворот (дуга 180° → 270°)
  const leftArc = generateArcPoints(
    turnRadius + channelCenterTop,  // cx
    turnRadius + channelCenterTop,  // cy
    turnRadius,
    Math.PI,        // 180° (идём снизу)
    Math.PI * 1.5,  // 270° (уходим вправо)
    6
  );
  path.push(...leftArc.slice(1)); // slice(1) чтобы не дублировать точку

  // 4. Вправо по верхнему каналу
  path.push({ x: totalWidth - turnRadius - channelCenterTop, y: channelCenterTop });

  // 5. Правый верхний поворот (дуга 270° → 360°)
  const rightArc = generateArcPoints(
    totalWidth - turnRadius - channelCenterTop,  // cx
    turnRadius + channelCenterTop,                // cy
    turnRadius,
    Math.PI * 1.5,  // 270° (идём слева)
    Math.PI * 2,    // 360° (уходим вниз)
    6
  );
  path.push(...rightArc.slice(1));

  // 6. Вниз по правому каналу
  path.push({ x: channelCenterRight, y: turnRadius + channelCenterTop });

  // 7. Финиш - внизу справа
  path.push({ x: channelCenterRight, y: totalHeight - 5 });

  return path;
}

/**
 * Вычисляет общую длину пути
 */
export function getPathLength(path: PathPoint[]): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Получает позицию на пути по прогрессу (0-1)
 * Добавляет небольшую осцилляцию для "живого" движения
 * @param oscillationAmount - амплитуда колебания в пикселях (из конфига врага)
 */
export function getPositionOnPath(path: PathPoint[], progress: number, oscillationAmount: number = 3): { x: number; y: number; angle: number } {
  // Базовая позиция
  let baseX: number;
  let baseY: number;
  let angle: number;

  if (progress <= 0) {
    const dx = path[1].x - path[0].x;
    const dy = path[1].y - path[0].y;
    baseX = path[0].x;
    baseY = path[0].y;
    angle = Math.atan2(dy, dx);
  } else if (progress >= 1) {
    const last = path[path.length - 1];
    const prev = path[path.length - 2];
    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    baseX = last.x;
    baseY = last.y;
    angle = Math.atan2(dy, dx);
  } else {
    const totalLength = getPathLength(path);
    const targetLength = progress * totalLength;

    let currentLength = 0;
    let found = false;
    baseX = path[path.length - 1].x;
    baseY = path[path.length - 1].y;
    angle = 0;

    for (let i = 1; i < path.length; i++) {
      const dx = path[i].x - path[i - 1].x;
      const dy = path[i].y - path[i - 1].y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);

      if (currentLength + segmentLength >= targetLength) {
        const t = (targetLength - currentLength) / segmentLength;
        baseX = path[i - 1].x + dx * t;
        baseY = path[i - 1].y + dy * t;
        angle = Math.atan2(dy, dx);
        found = true;
        break;
      }
      currentLength += segmentLength;
    }

    if (!found) {
      const last = path[path.length - 1];
      baseX = last.x;
      baseY = last.y;
    }
  }

  // Добавляем осцилляцию (колебание перпендикулярно направлению)
  const oscillation = Math.sin(progress * Math.PI * 12) * oscillationAmount;
  const perpX = -Math.sin(angle) * oscillation;
  const perpY = Math.cos(angle) * oscillation;

  return {
    x: baseX + perpX,
    y: baseY + perpY,
    angle,
  };
}

// ==================== СОЗДАНИЕ ВРАГОВ ====================

let enemyIdCounter = 0;

/**
 * Создаёт нового врага
 */
export function createEnemy(type: EnemyType, wave: number): Enemy {
  const config = ENEMIES[type];
  const hp = getEnemyHp(config.baseHp, wave);

  return {
    id: `enemy-${++enemyIdCounter}`,
    type,
    hp,
    maxHp: hp,
    speed: config.speed,
    progress: 0,
    effects: [],
    reward: config.reward,
    lastDamageTime: 0, // 0 = ни разу не получал урон
  };
}
// ==================== СИСТЕМА ВОЛН ====================

export interface WaveEnemy {
  type: EnemyType;
  count: number;
  delay?: number; // задержка перед спавном этой группы (мс)
}

export interface WaveConfig {
  enemies: WaveEnemy[];
  spawnInterval: number; // мс между спавнами
  reward: number;
}

/**
 * Генерирует конфигурацию волны
 */
export function getWaveConfig(waveNumber: number): WaveConfig {
  const enemies: WaveEnemy[] = [];
  let spawnInterval: number;
  let isBurst = false;

  // ══════════════════════════════════════════════════════════════════════
  // ВОЛНЫ 1-20: Ручная настройка
  // ══════════════════════════════════════════════════════════════════════

  switch (waveNumber) {
    case 1:
      enemies.push({ type: 'dust', count: 6 });
      spawnInterval = 1500;
      break;

    case 2:
      enemies.push({ type: 'dust', count: 10 });
      spawnInterval = 1400;
      break;

    case 3:
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'abrasive', count: 2, delay: 3000 });
      spawnInterval = 1300;
      break;

    case 4:
      enemies.push({ type: 'dust', count: 12 });
      enemies.push({ type: 'abrasive', count: 4, delay: 2000 });
      enemies.push({ type: 'heat', count: 2, delay: 4000 });
      spawnInterval = 1200;
      break;

    case 5: // ★ БОСС
      enemies.push({ type: 'dust', count: 8 });
      enemies.push({ type: 'abrasive', count: 4 });
      enemies.push({ type: 'heat', count: 2, delay: 3000 });
      enemies.push({ type: 'boss_wear', count: 1, delay: 6000 });
      spawnInterval = 1100;
      break;

    case 6:
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'abrasive', count: 4 });
      enemies.push({ type: 'heat', count: 3, delay: 2000 });
      enemies.push({ type: 'metal', count: 3, delay: 4000 });
      spawnInterval = 1050;
      break;

    case 7: // ⚡ BURST
      enemies.push({ type: 'dust', count: 14 });
      enemies.push({ type: 'abrasive', count: 6 });
      enemies.push({ type: 'metal', count: 4, delay: 3000 });
      spawnInterval = 950;
      isBurst = true;
      break;

    case 8: // Тизер коррозии
      enemies.push({ type: 'dust', count: 12 });
      enemies.push({ type: 'abrasive', count: 5 });
      enemies.push({ type: 'heat', count: 4, delay: 2000 });
      enemies.push({ type: 'metal', count: 5, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 1, delay: 5000 }); // ТИЗЕР
      spawnInterval = 900;
      break;

    case 9: // Тизер влаги
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'abrasive', count: 5 });
      enemies.push({ type: 'heat', count: 5, delay: 2000 });
      enemies.push({ type: 'metal', count: 6, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 2, delay: 4000 });
      enemies.push({ type: 'moisture', count: 1, delay: 6000 }); // ТИЗЕР
      spawnInterval = 850;
      break;

    case 10: // ★ БОСС
      enemies.push({ type: 'dust', count: 8 });
      enemies.push({ type: 'heat', count: 5 });
      enemies.push({ type: 'metal', count: 7, delay: 2000 });
      enemies.push({ type: 'moisture', count: 2, delay: 4000 });
      enemies.push({ type: 'boss_pitting', count: 1, delay: 8000 });
      spawnInterval = 850;
      break;

    case 11:
      enemies.push({ type: 'dust', count: 12 });
      enemies.push({ type: 'abrasive', count: 6 });
      enemies.push({ type: 'heat', count: 5, delay: 2000 });
      enemies.push({ type: 'metal', count: 7, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 3, delay: 4000 });
      enemies.push({ type: 'moisture', count: 2, delay: 5000 });
      spawnInterval = 800;
      break;

    case 12: // ⚡ BURST
      enemies.push({ type: 'dust', count: 12 });
      enemies.push({ type: 'abrasive', count: 6 });
      enemies.push({ type: 'heat', count: 6, delay: 2000 });
      enemies.push({ type: 'metal', count: 8, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 3, delay: 4000 });
      enemies.push({ type: 'moisture', count: 3, delay: 5000 });
      spawnInterval = 800;
      isBurst = true;
      break;

    case 13: // Тизер статики
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'abrasive', count: 5 });
      enemies.push({ type: 'heat', count: 6, delay: 2000 });
      enemies.push({ type: 'metal', count: 9, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 4, delay: 4000 });
      enemies.push({ type: 'moisture', count: 3, delay: 5000 });
      enemies.push({ type: 'static', count: 1, delay: 6000 }); // ТИЗЕР
      spawnInterval = 760;
      break;

    case 14:
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'heat', count: 6, delay: 2000 });
      enemies.push({ type: 'metal', count: 10, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 4, delay: 4000 });
      enemies.push({ type: 'moisture', count: 4, delay: 5000 });
      enemies.push({ type: 'static', count: 2, delay: 6000 });
      spawnInterval = 730;
      break;

    case 15: // ★ БОСС
      enemies.push({ type: 'dust', count: 8 });
      enemies.push({ type: 'abrasive', count: 4 });
      enemies.push({ type: 'heat', count: 6, delay: 2000 });
      enemies.push({ type: 'metal', count: 12, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 5, delay: 4000 });
      enemies.push({ type: 'moisture', count: 4, delay: 5000 });
      enemies.push({ type: 'boss_wear', count: 1, delay: 8000 });
      spawnInterval = 700;
      break;

    case 16:
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'abrasive', count: 4 });
      enemies.push({ type: 'heat', count: 7, delay: 2000 });
      enemies.push({ type: 'metal', count: 12, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 5, delay: 4000 });
      enemies.push({ type: 'moisture', count: 5, delay: 5000 });
      enemies.push({ type: 'static', count: 3, delay: 6000 });
      spawnInterval = 680;
      break;

    case 17: // ⚡ BURST
      enemies.push({ type: 'dust', count: 12 });
      enemies.push({ type: 'heat', count: 7, delay: 2000 });
      enemies.push({ type: 'metal', count: 13, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 6, delay: 4000 });
      enemies.push({ type: 'moisture', count: 6, delay: 5000 });
      enemies.push({ type: 'static', count: 4, delay: 6000 });
      spawnInterval = 680;
      isBurst = true;
      break;

    case 18:
      enemies.push({ type: 'dust', count: 10 });
      enemies.push({ type: 'heat', count: 8, delay: 2000 });
      enemies.push({ type: 'metal', count: 14, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 6, delay: 4000 });
      enemies.push({ type: 'moisture', count: 6, delay: 5000 });
      enemies.push({ type: 'static', count: 5, delay: 6000 });
      spawnInterval = 650;
      break;

    case 19:
      enemies.push({ type: 'dust', count: 8 });
      enemies.push({ type: 'heat', count: 8, delay: 2000 });
      enemies.push({ type: 'metal', count: 16, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 7, delay: 4000 });
      enemies.push({ type: 'moisture', count: 7, delay: 5000 });
      enemies.push({ type: 'static', count: 6, delay: 6000 });
      spawnInterval = 650;
      break;

    case 20: // ★ БОСС
      enemies.push({ type: 'dust', count: 6 });
      enemies.push({ type: 'heat', count: 8, delay: 2000 });
      enemies.push({ type: 'metal', count: 18, delay: 3000 });
      enemies.push({ type: 'corrosion', count: 8, delay: 4000 });
      enemies.push({ type: 'moisture', count: 8, delay: 5000 });
      enemies.push({ type: 'static', count: 6, delay: 6000 });
      enemies.push({ type: 'boss_pitting', count: 1, delay: 10000 });
      spawnInterval = 650;
      break;

    default:
      // ══════════════════════════════════════════════════════════════════
      // БЕСКОНЕЧНЫЙ РЕЖИМ (21+)
      // ══════════════════════════════════════════════════════════════════
      return getInfiniteWaveConfig(waveNumber);
  }

  // Burst-волны: интервал ×0.75
  if (isBurst) {
    spawnInterval = Math.floor(spawnInterval * 0.75);
  }

  // Награда: 15 + wave×5 + (босс-волна ? 25 : 0)
  const isBossWave = waveNumber % 5 === 0;
  const reward = 15 + waveNumber * 5 + (isBossWave ? 25 : 0);

  return { enemies, spawnInterval, reward };
}


// ══════════════════════════════════════════════════════════════════════════
// БЕСКОНЕЧНЫЙ РЕЖИМ (21+)
// ══════════════════════════════════════════════════════════════════════════

function getInfiniteWaveConfig(waveNumber: number): WaveConfig {
  const enemies: WaveEnemy[] = [];

  // Scale растёт каждые 3 волны (не 5)
  const s = Math.floor((waveNumber - 21) / 3);

  // Базовые количества от 20-й волны + scale
  enemies.push({ type: 'dust', count: 6 + s * 2 });
  enemies.push({ type: 'heat', count: 8 + s, delay: 2000 });
  enemies.push({ type: 'metal', count: 18 + s * 2, delay: 3000 });
  enemies.push({ type: 'corrosion', count: 8 + Math.floor(s / 2), delay: 4000 });
  enemies.push({ type: 'moisture', count: 8 + Math.floor(s / 2), delay: 5000 });
  enemies.push({ type: 'static', count: 6 + Math.floor(s / 3), delay: 6000 });

  // Босс каждые 5 волн (25, 30, 35...)
  const isBossWave = waveNumber % 5 === 0;
  if (isBossWave) {
    enemies.push({ type: 'boss_pitting', count: Math.floor(waveNumber / 15), delay: 10000 });
  }

  // Burst на волнах boss-3 (22, 27, 32, 37...)
  const isBurst = (waveNumber + 3) % 5 === 0;

  // Интервал: не ниже 650мс
  let spawnInterval = Math.max(650, 900 - 10 * (waveNumber - 21));
  if (isBurst) {
    spawnInterval = Math.floor(spawnInterval * 0.75);
  }

  const reward = 15 + waveNumber * 5 + (isBossWave ? 25 : 0);

  return { enemies, spawnInterval, reward };
}

// ==================== ОБНОВЛЕНИЕ ВРАГОВ ====================

/**
 * Обновляет позицию врага
 */
export function updateEnemy(
  enemy: Enemy,
  deltaTime: number,
  pathLength: number
): Enemy {
  // Обновляем эффекты (уменьшаем длительность)
  let updatedEffects = enemy.effects
    .map(e => ({ ...e, duration: e.duration - deltaTime }))
    .filter(e => e.duration > 0);

  // Проверяем захват (held) — враг полностью остановлен
  const heldEffect = updatedEffects.find(e => e.type === 'held');
  if (heldEffect) {
    // Если эффект заканчивается, добавляем иммунитет antiHold на 4 секунды
    if (heldEffect.duration <= 0) {
      updatedEffects = updatedEffects.filter(e => e.type !== 'held');
      updatedEffects.push({ type: 'antiHold', duration: 4000, strength: 0 });
    }
    return {
      ...enemy,
      effects: updatedEffects,
      // Не двигаемся пока захвачен
    };
  }

  // Проверяем блокировку (blocked) — враг остановлен перегородкой
  const blockedEffect = updatedEffects.find(e => e.type === 'blocked');
  if (blockedEffect) {
    // Враг с эффектом blocked не двигается
    return {
      ...enemy,
      effects: updatedEffects,
    };
  }

  // Проверяем откат (pushback) — плавное движение назад
  const pushbackEffect = updatedEffects.find(e => e.type === 'pushback');
  let pushbackDelta = 0;
  if (pushbackEffect && pushbackEffect.strength > 0) {
    // strength хранит оставшийся откат * 1000 (например 80 = 0.08 = 8%)
    // Вычисляем сколько откатить за этот кадр
    const remainingPush = pushbackEffect.strength / 1000;  // оставшийся откат
    const initialDuration = 400;  // начальная длительность эффекта
    const pushPerMs = remainingPush / initialDuration;  // откат за мс
    // Ограничиваем откат оставшимся количеством (фикс для низкого FPS + высокой скорости)
    pushbackDelta = Math.min(pushPerMs * deltaTime, remainingPush);

    // Уменьшаем оставшийся откат
    const newStrength = Math.max(0, pushbackEffect.strength - pushbackDelta * 1000);
    updatedEffects = updatedEffects.map(e =>
      e.type === 'pushback' ? { ...e, strength: newStrength } : e
    );
  }

  // Применяем эффекты замедления (slow и dry оба замедляют)
  let speedMultiplier = 1;
  for (const effect of updatedEffects) {
    if (effect.type === 'slow' || effect.type === 'dry') {
      speedMultiplier *= (1 - effect.strength / 100);
    }
  }

  // КАП НА SLOW: минимальная скорость зависит от типа врага
  let minSpeedMultiplier = 0.30;  // обычные: max 70% slow
  if (['abrasive', 'metal', 'corrosion'].includes(enemy.type)) {
    minSpeedMultiplier = 0.45;  // элитные: max 55% slow
  } else if (enemy.type.startsWith('boss_')) {
    minSpeedMultiplier = 0.60;  // боссы: max 40% slow
  }
  speedMultiplier = Math.max(speedMultiplier, minSpeedMultiplier);

  // Вычисляем изменение прогресса
  const speedPerSecond = enemy.speed * speedMultiplier;
  const progressPerSecond = speedPerSecond / pathLength;
  const deltaProgress = progressPerSecond * (deltaTime / 1000);

  // Применяем движение вперёд минус откат от pushback
  let newProgress = enemy.progress + deltaProgress - pushbackDelta;

  // Телепорт для Static: каждые 10% прогресса прыгает ещё на +10%
  if (enemy.type === 'static') {
    const prevBoundary = Math.floor(enemy.progress * 10);
    const newBoundary = Math.floor(newProgress * 10);
    if (newBoundary > prevBoundary && newProgress < 0.9) {
      // Телепорт +10%
      newProgress = Math.min(1, newProgress + 0.1);
    }
  }

  return {
    ...enemy,
    progress: Math.max(0, Math.min(1, newProgress)),
    effects: updatedEffects,
  };
}

/**
 * Проверяет, достиг ли враг финиша
 */
export function hasReachedFinish(enemy: Enemy): boolean {
  return enemy.progress >= 1;
}

/**
 * Проверяет, мёртв ли враг
 */
export function isDead(enemy: Enemy): boolean {
  return enemy.hp <= 0;
}

/**
 * Предотвращает визуальное наложение врагов
 * Отодвигает слишком близких врагов назад по пути
 * Учитывает телепорт статики (второй проход)
 */
export function separateEnemies(enemies: Enemy[]): Enemy[] {
  if (enemies.length < 2) return enemies;

  // Сортируем по progress (кто впереди — первый)
  const sorted = [...enemies].sort((a, b) => b.progress - a.progress);

  const minGap = 0.025; // минимальный отступ (2.5% пути)

  // Проход 1: отодвигаем тех, кто слишком близко СЗАДИ
  for (let i = 1; i < sorted.length; i++) {
    const ahead = sorted[i - 1];
    const behind = sorted[i];

    if (ahead.progress - behind.progress < minGap) {
      sorted[i] = {
        ...behind,
        progress: Math.max(0, ahead.progress - minGap),
      };
    }
  }

  // Проход 2: если кто-то телепортировался ВПЕРЁД и влез в другого
  // (проверяем с конца к началу)
  for (let i = sorted.length - 2; i >= 0; i--) {
    const current = sorted[i];
    const behind = sorted[i + 1];

    // Если разница меньше minGap — текущий слишком близко к заднему
    // Это значит кто-то "влез" — отодвигаем текущего ВПЕРЁД
    if (current.progress - behind.progress < minGap) {
      sorted[i] = {
        ...current,
        progress: Math.min(1, behind.progress + minGap),
      };
    }
  }

  return sorted;
}
