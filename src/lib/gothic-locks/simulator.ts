/*
 * Mechanics adapted from gothic-lockpick-solver, Copyright (c) 2026 Viktor Murzak.
 * MIT license and pinned source are in vendor/Murzav-LICENSE.txt and README.md.
 */
import type { GroupedMove, LockConfig, Move } from './types';

export const MIN_POSITION = 1;
export const MAX_POSITION = 7;
export const TARGET_POSITION = 4;

export function validateConfig(config: unknown): string[] {
  if (!config || typeof config !== 'object') return ['Не задана конфигурация замка.'];
  const value = config as Partial<LockConfig>;
  const errors: string[] = [];
  if (!Array.isArray(value.positions) || value.positions.length < 4 || value.positions.length > 7) {
    errors.push('Укажите от 4 до 7 пластин.');
  } else if (Array.from(value.positions).some((position) => !Number.isInteger(position) || position < 1 || position > 7)) {
    errors.push('Положение каждой пластины должно быть целым числом от 1 до 7.');
  }
  const count = Array.isArray(value.positions) ? value.positions.length : 0;
  if (!Array.isArray(value.links) || value.links.length !== count || Array.from(value.links).some((row) => !Array.isArray(row) || row.length !== count)) {
    errors.push('Матрица связей должна содержать строку и столбец для каждой пластины.');
  } else if (value.links.some((row, from) => Array.from(row).some((link, to) => ![-1, 0, 1].includes(link) || (from === to && link !== 0)))) {
    errors.push('Связь должна быть −1, 0 или +1; диагональ матрицы — 0.');
  }
  if (value.direction !== 'right-increases' && value.direction !== 'right-decreases') {
    errors.push('Выберите, увеличивает ли кнопка «вправо» номер позиции.');
  }
  return errors;
}

/** A wall collision rejects the whole move, including every linked plate. */
export function simulateMove(config: LockConfig, positions: number[], move: Move): number[] | null {
  if (validateConfig(config).length || !Array.isArray(positions) || positions.length !== config.positions.length ||
      Array.from(positions).some((value) => !Number.isInteger(value) || value < 1 || value > 7) || !move ||
      !Number.isInteger(move.plate) || move.plate < 0 || move.plate >= positions.length ||
      (move.direction !== 1 && move.direction !== -1)) return null;
  const next = positions.map((position, to) => position + (to === move.plate ? 1 : config.links[move.plate][to]) * move.direction);
  return next.some((position) => position < MIN_POSITION || position > MAX_POSITION) ? null : next;
}

export function verifySolution(config: LockConfig, moves: Move[]): boolean {
  if (validateConfig(config).length || !Array.isArray(moves)) return false;
  let positions = config.positions.slice();
  for (const move of moves) {
    const next = simulateMove(config, positions, move);
    if (!next) return false;
    positions = next;
  }
  return positions.every((position) => position === TARGET_POSITION);
}

export function groupMoves(moves: Move[]): GroupedMove[] {
  const grouped: GroupedMove[] = [];
  for (const move of moves) {
    const last = grouped[grouped.length - 1];
    if (last && last.plate === move.plate && last.direction === move.direction) last.count++;
    else grouped.push({ ...move, count: 1 });
  }
  return grouped;
}

export function physicalDirection(move: Move, direction: LockConfig['direction']): 'left' | 'right' {
  return (direction === 'right-increases' ? move.direction === 1 : move.direction === -1) ? 'right' : 'left';
}
