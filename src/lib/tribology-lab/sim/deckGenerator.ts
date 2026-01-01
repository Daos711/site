/**
 * Генератор всех 108 комбинаций колод
 *
 * Правило формирования колоды:
 * - 2 DPS модуля (из 4)
 * - 1 Контроль (из 3)
 * - 1 Саппорт (из 3)
 * - 1 Утилита (из 2)
 *
 * Итого: C(4,2) × 3 × 3 × 2 = 6 × 3 × 3 × 2 = 108 колод
 */

import { ModuleType } from '../types';

// Роли модулей
export const MODULE_ROLES = {
  dps: ['filter', 'magnet', 'laser', 'electrostatic'] as ModuleType[],
  control: ['cooler', 'centrifuge', 'barrier'] as ModuleType[],
  support: ['lubricant', 'inhibitor', 'analyzer'] as ModuleType[],
  utility: ['ultrasonic', 'demulsifier'] as ModuleType[],
};

export interface Deck {
  id: number;
  modules: ModuleType[];
  dps: [ModuleType, ModuleType];
  control: ModuleType;
  support: ModuleType;
  utility: ModuleType;
}

/**
 * Генерация всех комбинаций C(n,k)
 */
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 1) return arr.map((x) => [x]);
  const result: T[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    const head = arr[i];
    const tailCombos = combinations(arr.slice(i + 1), k - 1);
    for (const tail of tailCombos) {
      result.push([head, ...tail]);
    }
  }
  return result;
}

/**
 * Генерирует все 108 колод
 */
export function generateAllDecks(): Deck[] {
  const decks: Deck[] = [];
  let id = 0;

  const dpsCombos = combinations(MODULE_ROLES.dps, 2); // C(4,2) = 6

  for (const dps of dpsCombos) {
    for (const control of MODULE_ROLES.control) {
      // 3
      for (const support of MODULE_ROLES.support) {
        // 3
        for (const utility of MODULE_ROLES.utility) {
          // 2
          decks.push({
            id: id++,
            modules: [...dps, control, support, utility],
            dps: dps as [ModuleType, ModuleType],
            control,
            support,
            utility,
          });
        }
      }
    }
  }

  return decks; // 6 × 3 × 3 × 2 = 108
}

/**
 * Короткое название колоды для отчёта
 */
export function getDeckName(deck: Deck): string {
  return deck.modules.map((m) => m.slice(0, 3).toUpperCase()).join('-');
}

/**
 * Полное название колоды
 */
export function getDeckFullName(deck: Deck): string {
  return deck.modules.join(' + ');
}
