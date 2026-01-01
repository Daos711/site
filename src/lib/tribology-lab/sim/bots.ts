/**
 * Боты для автоматической игры
 * Определяют стратегию покупки и расстановки модулей
 */

import { Simulator, GRID_COLS, GRID_ROWS } from './simulator';
import { MODULES } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// ИНТЕРФЕЙС БОТА
// ═══════════════════════════════════════════════════════════════════════════

export interface Bot {
  name: string;
  makeMoves(sim: Simulator): void;
}

// ═══════════════════════════════════════════════════════════════════════════
// ПРИОРИТЕТ ПОЗИЦИЙ
// ═══════════════════════════════════════════════════════════════════════════

interface Position {
  x: number;
  y: number;
  priority: number;
}

// Позиции отсортированы по приоритету (ближе к каналу = лучше)
const POSITION_PRIORITY: Position[] = [
  // Первый столбец (ближе к каналу, слева) — лучшие
  { x: 0, y: 0, priority: 1 },
  { x: 0, y: 1, priority: 2 },
  { x: 0, y: 2, priority: 3 },
  // Последний столбец (ближе к каналу, справа)
  { x: 3, y: 0, priority: 4 },
  { x: 3, y: 1, priority: 5 },
  { x: 3, y: 2, priority: 6 },
  // Центральные столбцы
  { x: 1, y: 0, priority: 7 },
  { x: 2, y: 0, priority: 8 },
  { x: 1, y: 1, priority: 9 },
  { x: 2, y: 1, priority: 10 },
  { x: 1, y: 2, priority: 11 },
  { x: 2, y: 2, priority: 12 },
].sort((a, b) => a.priority - b.priority);

// ═══════════════════════════════════════════════════════════════════════════
// PATTERN BOT — простой бот с фиксированными приоритетами
// ═══════════════════════════════════════════════════════════════════════════

export class PatternBot implements Bot {
  name = 'pattern';

  makeMoves(sim: Simulator): void {
    const shop = sim.getShopSlots();
    let modules = sim.getModules();
    let gold = sim.getGold();

    // Пытаемся купить каждый слот магазина
    for (let slotIdx = 0; slotIdx < shop.length; slotIdx++) {
      const moduleType = shop[slotIdx];
      if (!moduleType) continue;

      const config = MODULES[moduleType];
      if (gold < config.basePrice) continue;

      // Обновляем состояние после предыдущей покупки
      modules = sim.getModules();
      gold = sim.getGold();

      // Сначала пытаемся мержить с существующим модулем того же типа
      const sameTypeModule = modules.find((m) => m.type === moduleType && m.level < 5);
      if (sameTypeModule) {
        if (sim.buyModule(slotIdx, sameTypeModule.x, sameTypeModule.y)) {
          continue;
        }
      }

      // Иначе ставим в лучшую свободную позицию
      const occupiedPositions = new Set(modules.map((m) => `${m.x},${m.y}`));

      for (const pos of POSITION_PRIORITY) {
        if (!occupiedPositions.has(`${pos.x},${pos.y}`)) {
          if (sim.buyModule(slotIdx, pos.x, pos.y)) {
            break;
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GREEDY BOT — жадный бот, покупает самое дешёвое
// ═══════════════════════════════════════════════════════════════════════════

export class GreedyBot implements Bot {
  name = 'greedy';

  makeMoves(sim: Simulator): void {
    const shop = sim.getShopSlots();

    // Сортируем слоты по цене (дешёвые первые)
    const slotsWithPrice = shop
      .map((type, idx) => ({
        idx,
        type,
        price: type ? MODULES[type].basePrice : Infinity,
      }))
      .filter((s) => s.type !== null)
      .sort((a, b) => a.price - b.price);

    for (const slot of slotsWithPrice) {
      let modules = sim.getModules();
      let gold = sim.getGold();

      if (gold < slot.price) continue;

      // Пытаемся мержить
      const sameType = modules.find((m) => m.type === slot.type && m.level < 5);
      if (sameType) {
        if (sim.buyModule(slot.idx, sameType.x, sameType.y)) {
          continue;
        }
      }

      // Ищем свободную позицию
      const occupied = new Set(modules.map((m) => `${m.x},${m.y}`));
      for (const pos of POSITION_PRIORITY) {
        if (!occupied.has(`${pos.x},${pos.y}`)) {
          if (sim.buyModule(slot.idx, pos.x, pos.y)) {
            break;
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ЭКСПОРТ
// ═══════════════════════════════════════════════════════════════════════════

export const BOTS: Bot[] = [new PatternBot(), new GreedyBot()];

export function getBot(name: string): Bot | undefined {
  return BOTS.find((b) => b.name === name);
}

export function getDefaultBot(): Bot {
  return new PatternBot();
}
