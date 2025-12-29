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
  // Базовые параметры
  const baseInterval = 2000;
  const intervalReduction = Math.min(waveNumber * 50, 1200); // уменьшается до 800мс
  const spawnInterval = baseInterval - intervalReduction;

  const enemies: WaveEnemy[] = [];

  if (waveNumber === 1) {
    // Первая волна - только пыль
    enemies.push({ type: 'dust', count: 5 });
  } else if (waveNumber === 2) {
    enemies.push({ type: 'dust', count: 8 });
  } else if (waveNumber === 3) {
    enemies.push({ type: 'dust', count: 6 });
    enemies.push({ type: 'abrasive', count: 2, delay: 3000 });
  } else if (waveNumber === 4) {
    enemies.push({ type: 'dust', count: 8 });
    enemies.push({ type: 'abrasive', count: 3, delay: 2000 });
  } else if (waveNumber === 5) {
    // Первый мини-босс
    enemies.push({ type: 'dust', count: 5 });
    enemies.push({ type: 'abrasive', count: 4 });
    enemies.push({ type: 'boss_wear', count: 1, delay: 5000 });
  } else if (waveNumber <= 9) {
    // Вводим heat и metal
    enemies.push({ type: 'dust', count: 6 + waveNumber });
    enemies.push({ type: 'abrasive', count: 2 + Math.floor(waveNumber / 2) });
    if (waveNumber >= 6) {
      enemies.push({ type: 'heat', count: 2 + (waveNumber - 5) });
    }
    if (waveNumber >= 7) {
      enemies.push({ type: 'metal', count: 1 + (waveNumber - 6) });
    }
  } else if (waveNumber === 10) {
    // Второй босс
    enemies.push({ type: 'dust', count: 10 });
    enemies.push({ type: 'heat', count: 5 });
    enemies.push({ type: 'metal', count: 3 });
    enemies.push({ type: 'boss_pitting', count: 1, delay: 8000 });
  } else {
    // Бесконечная генерация с увеличением сложности
    const scale = Math.floor((waveNumber - 10) / 5) + 1;
    enemies.push({ type: 'dust', count: 10 + scale * 2 });
    enemies.push({ type: 'abrasive', count: 4 + scale });
    enemies.push({ type: 'heat', count: 5 + scale });
    enemies.push({ type: 'metal', count: 3 + scale });

    if (waveNumber >= 12) {
      enemies.push({ type: 'corrosion', count: 2 + Math.floor((waveNumber - 10) / 2) });
    }
    if (waveNumber >= 14) {
      enemies.push({ type: 'moisture', count: 2 + Math.floor((waveNumber - 12) / 2) });
    }
    if (waveNumber >= 16) {
      enemies.push({ type: 'static', count: 1 + Math.floor((waveNumber - 14) / 3) });
    }

    // Босс каждые 5 волн
    if (waveNumber % 5 === 0) {
      enemies.push({ type: 'boss_pitting', count: Math.floor(waveNumber / 10), delay: 10000 });
    }
  }

  const reward = 30 + waveNumber * 10 + (waveNumber % 5 === 0 ? 50 : 0);

  return {
    enemies,
    spawnInterval,
    reward,
  };
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
  // Применяем эффекты замедления
  let speedMultiplier = 1;
  for (const effect of enemy.effects) {
    if (effect.type === 'slow') {
      speedMultiplier *= (1 - effect.strength / 100);
    }
  }

  // Обновляем эффекты (уменьшаем длительность)
  const updatedEffects = enemy.effects
    .map(e => ({ ...e, duration: e.duration - deltaTime }))
    .filter(e => e.duration > 0);

  // Вычисляем изменение прогресса
  const speedPerSecond = enemy.speed * speedMultiplier;
  const progressPerSecond = speedPerSecond / pathLength;
  const deltaProgress = progressPerSecond * (deltaTime / 1000);

  let newProgress = enemy.progress + deltaProgress;

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
    progress: Math.min(1, newProgress),
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
 */
export function separateEnemies(enemies: Enemy[]): Enemy[] {
  if (enemies.length < 2) return enemies;

  // Сортируем по progress (кто впереди — первый)
  const sorted = [...enemies].sort((a, b) => b.progress - a.progress);

  const minGap = 0.025; // минимальный отступ (2.5% пути)

  // Отодвигаем тех, кто слишком близко к впереди идущему
  for (let i = 1; i < sorted.length; i++) {
    const ahead = sorted[i - 1];
    const behind = sorted[i];

    // Если слишком близко — отодвигаем назад
    if (ahead.progress - behind.progress < minGap) {
      sorted[i] = {
        ...behind,
        progress: Math.max(0, ahead.progress - minGap),
      };
    }
  }

  return sorted;
}
