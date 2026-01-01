/**
 * Headless симулятор игры Tribology Lab
 * Использует логику из combat.ts и enemies.ts для симуляции без UI
 */

import { Module, Enemy, MODULES, ENEMIES, ModuleType } from '../types';
import {
  PathPoint,
  generatePath,
  getWaveConfig,
  createEnemy,
  hasReachedFinish,
  isDead,
  getPathLength,
} from '../enemies';
import { processAllAttacks, processBurnDamage, processBossRegeneration } from '../combat';
import { PRNG } from './prng';
import { Deck } from './deckGenerator';
import { Bot } from './bots';

// ═══════════════════════════════════════════════════════════════════════════
// КОНСТАНТЫ (как в page.tsx)
// ═══════════════════════════════════════════════════════════════════════════

const CELL_SIZE = 110;
const CELL_GAP = 14;
const PANEL_PADDING = 16;
const CONVEYOR_WIDTH = Math.round(CELL_SIZE * 0.95);
const GRID_COLS = 4;
const GRID_ROWS = 3;

const gridWidth = GRID_COLS * CELL_SIZE + (GRID_COLS - 1) * CELL_GAP;
const gridHeight = GRID_ROWS * CELL_SIZE + (GRID_ROWS - 1) * CELL_GAP;
const totalWidth = gridWidth + PANEL_PADDING * 2 + CONVEYOR_WIDTH * 2;
const totalHeight = gridHeight + PANEL_PADDING * 2 + CONVEYOR_WIDTH;
const cornerRadius = CONVEYOR_WIDTH * 1.0;
const innerOffset = 8;

// Генерируем путь один раз
const ENEMY_PATH = generatePath(totalWidth, totalHeight, CONVEYOR_WIDTH, innerOffset, cornerRadius);
const PATH_LENGTH = getPathLength(ENEMY_PATH);

// ═══════════════════════════════════════════════════════════════════════════
// ИНТЕРФЕЙСЫ
// ═══════════════════════════════════════════════════════════════════════════

export interface SimulationConfig {
  deck: Deck;
  seed: number;
  maxWaves: number; // Максимум волн (например 25)
  initialLives: number; // Начальные жизни (10)
  initialGold: number; // Начальное золото (100)
}

export interface SimulationResult {
  deckId: number;
  seed: number;
  finalWave: number; // На какой волне умер (или maxWaves если выжил)
  survived: boolean; // Дошёл ли до maxWaves
  livesLeft: number;
  totalGoldEarned: number;
  totalKills: number;
  wavesData: WaveResult[]; // Детали по волнам
}

export interface WaveResult {
  wave: number;
  kills: number;
  leaks: number; // Сколько прорвалось
  livesLost: number;
  goldEarned: number;
  modulesPlaced: number; // Сколько модулей на поле
}

// ═══════════════════════════════════════════════════════════════════════════
// СИМУЛЯТОР
// ═══════════════════════════════════════════════════════════════════════════

export class Simulator {
  private rng: PRNG;
  private config: SimulationConfig;

  // Игровое состояние
  private modules: Module[] = [];
  private enemies: Enemy[] = [];
  private gold: number;
  private lives: number;
  private wave: number = 0;
  private totalKills: number = 0;
  private totalGoldEarned: number = 0;
  private wavesData: WaveResult[] = [];

  // Магазин
  private shopSlots: (ModuleType | null)[] = [null, null, null];
  private moduleIdCounter: number = 0;

  constructor(config: SimulationConfig) {
    this.config = config;
    this.rng = new PRNG(config.seed);
    this.gold = config.initialGold;
    this.lives = config.initialLives;
  }

  /**
   * Запустить симуляцию с указанным ботом
   */
  run(bot: Bot): SimulationResult {
    while (this.lives > 0 && this.wave < this.config.maxWaves) {
      this.wave++;

      // 1. Обновить магазин
      this.refreshShop();

      // 2. Бот делает покупки и расстановку
      bot.makeMoves(this);

      // 3. Симулировать волну
      const waveResult = this.simulateWave();
      this.wavesData.push(waveResult);

      if (this.lives <= 0) break;
    }

    return {
      deckId: this.config.deck.id,
      seed: this.config.seed,
      finalWave: this.wave,
      survived: this.lives > 0,
      livesLeft: this.lives,
      totalGoldEarned: this.totalGoldEarned,
      totalKills: this.totalKills,
      wavesData: this.wavesData,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ БОТА
  // ═══════════════════════════════════════════════════════════════════════════

  getShopSlots(): (ModuleType | null)[] {
    return [...this.shopSlots];
  }

  getGold(): number {
    return this.gold;
  }

  getLives(): number {
    return this.lives;
  }

  getWave(): number {
    return this.wave;
  }

  getModules(): Module[] {
    return [...this.modules];
  }

  getDeck(): Deck {
    return this.config.deck;
  }

  /**
   * Покупка модуля из магазина
   * @returns true если покупка успешна
   */
  buyModule(slotIndex: number, gridX: number, gridY: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.shopSlots.length) return false;
    if (gridX < 0 || gridX >= GRID_COLS || gridY < 0 || gridY >= GRID_ROWS) return false;

    const moduleType = this.shopSlots[slotIndex];
    if (!moduleType) return false;

    const config = MODULES[moduleType];
    if (this.gold < config.basePrice) return false;

    // Проверить, свободна ли ячейка
    const existing = this.modules.find((m) => m.x === gridX && m.y === gridY);
    if (existing) {
      // Попытка мержа
      if (existing.type === moduleType && existing.level < 5) {
        existing.level++;
        this.gold -= config.basePrice;
        this.shopSlots[slotIndex] = null;
        return true;
      }
      return false;
    }

    // Новый модуль
    this.modules.push({
      id: `module-${this.moduleIdCounter++}`,
      type: moduleType,
      level: 1,
      x: gridX,
      y: gridY,
      lastAttack: 0,
    });

    this.gold -= config.basePrice;
    this.shopSlots[slotIndex] = null;
    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ПРИВАТНЫЕ МЕТОДЫ
  // ═══════════════════════════════════════════════════════════════════════════

  private refreshShop(): void {
    const deckModules = this.config.deck.modules;
    this.shopSlots = [this.rng.pick(deckModules), this.rng.pick(deckModules), this.rng.pick(deckModules)];
  }

  private simulateWave(): WaveResult {
    const waveConfig = getWaveConfig(this.wave);

    // Создать очередь спавна
    const spawnQueue: { enemy: Enemy; spawnTime: number }[] = [];
    let spawnTime = 0;

    for (const group of waveConfig.enemies) {
      if (group.delay) spawnTime += group.delay;
      for (let i = 0; i < group.count; i++) {
        const enemy = createEnemy(group.type, this.wave);
        spawnQueue.push({ enemy, spawnTime });
        spawnTime += waveConfig.spawnInterval;
      }
    }

    // Симуляция
    let currentTime = 0;
    let spawnIndex = 0;
    let kills = 0;
    let leaks = 0;
    let livesLost = 0;
    let goldEarned = 0;

    const TICK_MS = 50; // 20 тиков в секунду
    const MAX_WAVE_TIME = 120000; // 2 минуты макс на волну

    while (currentTime < MAX_WAVE_TIME) {
      // Спавн врагов
      while (spawnIndex < spawnQueue.length && spawnQueue[spawnIndex].spawnTime <= currentTime) {
        this.enemies.push({ ...spawnQueue[spawnIndex].enemy });
        spawnIndex++;
      }

      // Движение врагов
      for (const enemy of this.enemies) {
        const config = ENEMIES[enemy.type];
        let speed = config.speed;

        // Замедление от slow
        const slowEffect = enemy.effects.find((e) => e.type === 'slow');
        if (slowEffect) {
          speed *= 1 - slowEffect.strength / 100;
        }

        // Остановка от held
        const heldEffect = enemy.effects.find((e) => e.type === 'held');
        if (heldEffect) {
          speed = 0;
        }

        // Pushback эффект (откат назад)
        const pushbackEffect = enemy.effects.find((e) => e.type === 'pushback');
        if (pushbackEffect) {
          const pushAmount = pushbackEffect.strength / 1000; // strength хранится × 1000
          const pushPerTick = (pushAmount * TICK_MS) / pushbackEffect.duration;
          enemy.progress = Math.max(0, enemy.progress - pushPerTick);
        }

        // Прогресс (0..1)
        enemy.progress += (speed * TICK_MS) / 1000 / PATH_LENGTH;
      }

      // Обновить эффекты (уменьшить duration)
      for (const enemy of this.enemies) {
        enemy.effects = enemy.effects.map((e) => ({ ...e, duration: e.duration - TICK_MS })).filter((e) => e.duration > 0);
      }

      // Атаки модулей
      const attackResult = processAllAttacks(
        this.modules,
        this.enemies,
        ENEMY_PATH,
        currentTime,
        1 // gameSpeed
      );
      this.enemies = attackResult.updatedEnemies;
      this.modules = attackResult.updatedModules;

      // Урон от горения
      this.enemies = processBurnDamage(this.enemies, TICK_MS);

      // Регенерация босса Питтинг
      this.enemies = processBossRegeneration(this.enemies, TICK_MS);

      // Проверка смерти/финиша
      this.enemies = this.enemies.filter((enemy) => {
        // Дошёл до финиша
        if (hasReachedFinish(enemy)) {
          const lostLives = enemy.type === 'boss_pitting' ? 5 : enemy.type === 'boss_wear' ? 3 : 1;
          this.lives -= lostLives;
          livesLost += lostLives;
          leaks++;
          return false;
        }

        // Умер
        if (isDead(enemy)) {
          this.gold += enemy.reward;
          goldEarned += enemy.reward;
          this.totalGoldEarned += enemy.reward;
          this.totalKills++;
          kills++;
          return false;
        }

        return true;
      });

      // Волна закончена?
      if (this.enemies.length === 0 && spawnIndex >= spawnQueue.length) {
        break;
      }

      // Все жизни потеряны?
      if (this.lives <= 0) {
        break;
      }

      currentTime += TICK_MS;
    }

    return {
      wave: this.wave,
      kills,
      leaks,
      livesLost,
      goldEarned,
      modulesPlaced: this.modules.length,
    };
  }
}

// Экспорт констант для использования в других модулях
export { GRID_COLS, GRID_ROWS, ENEMY_PATH, PATH_LENGTH };
