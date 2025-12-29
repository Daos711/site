import { Enemy, EnemyType, ENEMIES, getEnemyHp } from './types';

// ==================== ПУТЬ ДВИЖЕНИЯ ====================

export interface PathPoint {
  x: number;
  y: number;
}

/**
 * Генерирует путь для врагов на основе размеров поля
 * Путь: СТАРТ (низ-лево) → вверх → вправо → вниз → ФИНИШ (низ-право)
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

  // Путь идёт по центру канала
  return [
    // Старт - внизу слева (внутри патрубка)
    { x: channelCenterLeft, y: totalHeight - 5 },
    // Вверх по левому каналу до начала поворота
    { x: channelCenterLeft, y: cornerRadius },
    // Центр верхнего левого угла (поворот)
    { x: cornerRadius, y: channelCenterTop },
    // Вправо по верхнему каналу
    { x: totalWidth - cornerRadius, y: channelCenterTop },
    // Центр верхнего правого угла (поворот)
    { x: channelCenterRight, y: cornerRadius },
    // Финиш - внизу справа (внутри горловины)
    { x: channelCenterRight, y: totalHeight - 5 },
  ];
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
 */
export function getPositionOnPath(path: PathPoint[], progress: number, enemyId?: string): { x: number; y: number; angle: number } {
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

  // Добавляем осцилляцию (колебание ±3px перпендикулярно направлению)
  const oscillation = Math.sin(progress * Math.PI * 12) * 3;
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

  return {
    ...enemy,
    progress: Math.min(1, enemy.progress + deltaProgress),
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
