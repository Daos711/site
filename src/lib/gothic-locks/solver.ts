/*
 * Adapted from gothic-lockpick-solver by Viktor Murzak, MIT (2026).
 * Upstream: 406971b734b318fdb205f2989918e63b9ceaa0d9
 * src/lib/features/solve-lock/model/solver.ts
 * Changes: public API, runtime validation, resource budgets, independent replay.
 * Full license: vendor/Murzav-LICENSE.txt
 */
import type { LockConfig, Move, SolveLimits, SolveResult } from './types';
import { validateConfig, verifySolution } from './simulator';

export { groupMoves, physicalDirection, simulateMove, validateConfig, verifySolution } from './simulator';
export type { LockConfig, Move, GroupedMove, SolveLimits, SolveResult } from './types';

const DIRECTIONS = [1, -1] as const;

function encodeState(positions: number[]): number {
  let key = 0;
  for (const position of positions) key = key * 7 + position - 1;
  return key;
}

/** Shortest safe sequence first; among those, minimize plate switches. Run in a worker. */
export function solveLock(config: LockConfig, limits: SolveLimits = {}): SolveResult {
  const started = performance.now();
  let statesExplored = 0;
  const failure = (status: 'invalid' | 'limit' | 'unsolvable', reason: string): SolveResult => ({
    status, moves: [], reason, statesExplored, elapsedMilliseconds: performance.now() - started,
  });
  const errors = validateConfig(config);
  if (errors.length) return failure('invalid', errors.join(' '));
  if (!limits || typeof limits !== 'object') return failure('invalid', 'Некорректные ограничения поиска.');
  const count = config.positions.length;
  const baseStates = 7 ** count;
  const maxStates = limits.maxStates ?? baseStates;
  const maxMilliseconds = limits.maxMilliseconds ?? 8_000;
  if (!Number.isInteger(maxStates) || maxStates < 1 || !Number.isFinite(maxMilliseconds) || maxMilliseconds < 0) {
    return failure('invalid', 'Лимит состояний должен быть положительным целым числом, а время — неотрицательным числом.');
  }
  const startKey = encodeState(config.positions);
  const goalKey = encodeState(Array(count).fill(4));
  statesExplored = 1;
  if (startKey === goalKey) return { status: 'solved', moves: [], statesExplored, elapsedMilliseconds: performance.now() - started };
  if (maxMilliseconds === 0) return failure('limit', 'Исчерпан лимит времени. Попробуйте увеличить время поиска.');

  const stride = count + 1;
  const extendedStates = baseStates * stride;
  // Validation restricts allocation to 7^7 * 8 extended states (about 64 MiB).
  let switchDistance: Uint32Array;
  let predecessor: Int32Array;
  let predecessorMove: Uint8Array;
  let nodeState: Uint8Array;
  let baseSeen: Uint8Array;
  try {
    switchDistance = new Uint32Array(extendedStates).fill(0xffffffff);
    predecessor = new Int32Array(extendedStates).fill(-1);
    predecessorMove = new Uint8Array(extendedStates);
    nodeState = new Uint8Array(extendedStates);
    baseSeen = new Uint8Array(baseStates);
  } catch {
    return failure('limit', 'Недостаточно памяти для поиска. Закройте лишние вкладки и повторите.');
  }
  const startExtended = startKey * stride + count;
  switchDistance[startExtended] = 0;
  nodeState[startExtended] = 2;
  baseSeen[startKey] = 1;
  let frontier: number[] = [startExtended];
  const positions = new Uint8Array(count);
  let expansions = 0;

  while (frontier.length) {
    const next: number[] = [];
    let goalFound = false;
    for (const current of frontier) {
      if (expansions++ % 256 === 0 && performance.now() - started >= maxMilliseconds) {
        return failure('limit', 'Поиск остановлен по времени. Это не означает, что замок неразрешим.');
      }
      const lastPlate = current % stride;
      const currentDistance = switchDistance[current];
      let key = (current - lastPlate) / stride;
      for (let plate = count - 1; plate >= 0; plate--) {
        const digit = key % 7;
        positions[plate] = digit + 1;
        key = (key - digit) / 7;
      }
      for (let plate = 0; plate < count; plate++) {
        for (const direction of DIRECTIONS) {
          let nextKey = 0;
          let valid = true;
          for (let target = 0; target < count; target++) {
            const value = positions[target] + (target === plate ? 1 : config.links[plate][target]) * direction;
            if (value < 1 || value > 7) { valid = false; break; }
            nextKey = nextKey * 7 + value - 1;
          }
          if (!valid) continue;
          const destination = nextKey * stride + plate;
          const state = nodeState[destination];
          if (state === 2) continue;
          const candidate = currentDistance + (lastPlate === count || lastPlate === plate ? 0 : 1);
          if (state === 0) {
            if (!baseSeen[nextKey]) {
              if (statesExplored >= maxStates) return failure('limit', 'Достигнут лимит состояний. Неразрешимость замка не доказана.');
              baseSeen[nextKey] = 1;
              statesExplored++;
            }
            switchDistance[destination] = candidate;
            predecessor[destination] = current;
            predecessorMove[destination] = plate * 2 + (direction === 1 ? 0 : 1);
            nodeState[destination] = 1;
            next.push(destination);
            if (nextKey === goalKey) goalFound = true;
          } else if (candidate < switchDistance[destination]) {
            switchDistance[destination] = candidate;
            predecessor[destination] = current;
            predecessorMove[destination] = plate * 2 + (direction === 1 ? 0 : 1);
          }
        }
      }
    }
    // Complete the entire shortest layer before choosing its best goal variant.
    if (goalFound) {
      let best = -1;
      let bestDistance = 0xffffffff;
      for (let plate = 0; plate < stride; plate++) {
        const goal = goalKey * stride + plate;
        if (nodeState[goal] && switchDistance[goal] < bestDistance) {
          best = goal;
          bestDistance = switchDistance[goal];
        }
      }
      const moves: Move[] = [];
      for (let cursor = best; predecessor[cursor] !== -1; cursor = predecessor[cursor]) {
        const packed = predecessorMove[cursor];
        moves.push({ plate: packed >> 1, direction: (packed & 1) === 0 ? 1 : -1 });
      }
      moves.reverse();
      if (!verifySolution(config, moves)) return failure('invalid', 'Проверка последовательности не пройдена. Решение не показано.');
      return { status: 'solved', moves, statesExplored, elapsedMilliseconds: performance.now() - started };
    }
    for (const destination of next) nodeState[destination] = 2;
    frontier = next;
  }
  return failure('unsolvable', 'При этих положениях и связях безопасного решения нет. Проверьте текущую конфигурацию.');
}
