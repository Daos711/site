import type { LockConfig, Move, DirectionConvention } from './types';
import type { Skill } from './skill';
import { verifySolution, validateConfig, groupMoves } from './simulator';
import readyData from './data/ready-solutions.json';
import guideData from './data/solution-guides.json';

export interface SolutionSource { name: string; url: string; license?: string }
export interface ReadySolution {
  id: string;
  entryId: string;
  skill: Skill;
  variantName: string;
  config: LockConfig | null;
  configAlternatives?: LockConfig[];
  derivation?: 'observed' | 'inferred' | 'universal';
  modelCoverage?: { kind: 'column-witnesses'; fullModelCount?: number; witnessCount: number; columnCounts: number[] };
  plateCount: number | null;
  /** Atomic movements; zero-based, bottom-first, in numbered-position coordinates. */
  moves: Move[];
  direction: DirectionConvention;
  verification: 'simulated' | 'published';
  gameVersion: string | null;
  source: SolutionSource;
  evidence: SolutionSource[];
  notes: string[];
}
export interface SolutionGuide {
  entryId: string;
  skill: Skill | 'unknown';
  name: string;
  url: string;
  section: string;
}

export function solutionIssues(solution: ReadySolution): string[] {
  const errors: string[] = [];
  if (!solution.id || !solution.entryId) errors.push('Нет идентификатора');
  if (!['none', 'trained', 'master'].includes(solution.skill)) errors.push('Навык не установлен');
  if (!['right-decreases', 'right-increases'].includes(solution.direction)) errors.push('Направление не установлено');
  if (!solution.source?.url?.startsWith('https://') || !solution.source.license) errors.push('Нет источника или условий использования');
  if (!['simulated', 'published'].includes(solution.verification)) errors.push('Статус проверки не установлен');
  if (solution.plateCount !== null && (!Number.isInteger(solution.plateCount) || solution.plateCount < 4 || solution.plateCount > 7)) errors.push('Некорректное число пластин');
  if (!Array.isArray(solution.moves) || solution.moves.length === 0 || solution.moves.length > 5000) errors.push('Нет корректной последовательности');
  else if (solution.moves.some(move => !Number.isInteger(move.plate) || move.plate < 0 || move.plate >= (solution.plateCount ?? 7) || ![-1, 1].includes(move.direction))) errors.push('Некорректный ход');
  if (solution.modelCoverage && (solution.modelCoverage.kind !== 'column-witnesses' || solution.modelCoverage.witnessCount !== solution.configAlternatives?.length || !Array.isArray(solution.modelCoverage.columnCounts) || solution.modelCoverage.columnCounts.length !== solution.plateCount || solution.modelCoverage.columnCounts.some(count => !Number.isInteger(count) || count < 1) || (solution.modelCoverage.fullModelCount !== undefined && (!Number.isSafeInteger(solution.modelCoverage.fullModelCount) || solution.modelCoverage.fullModelCount < solution.modelCoverage.witnessCount)))) errors.push('Некорректное покрытие моделей');
  if (errors.length) return errors;
  if (solution.config) {
    if (validateConfig(solution.config).length || solution.config.direction !== solution.direction || solution.config.positions.length !== solution.plateCount) errors.push('Некорректная конфигурация');
    else if (!verifySolution(solution.config, solution.moves)) errors.push('Есть недопустимый ход или замок не открыт');
  }
  if (solution.configAlternatives) {
    if (!Array.isArray(solution.configAlternatives) || solution.configAlternatives.length < 2) errors.push('Нет полного набора вариантов');
    else for (const config of solution.configAlternatives) {
      if (validateConfig(config).length || config.direction !== solution.direction || config.positions.length !== solution.plateCount || !verifySolution(config, solution.moves)) errors.push('Последовательность не подходит всем вариантам механизма');
    }
  }
  if (solution.verification === 'simulated' && !solution.config && !solution.configAlternatives?.length) errors.push('Нет механизма для проверки симуляцией');
  return errors;
}

/** Fail closed if a future data edit introduces invalid or mismatched sequences. */
export const READY_SOLUTIONS = (readyData as ReadySolution[]).filter(solution => solutionIssues(solution).length === 0);
export const SOLUTION_GUIDES = guideData as SolutionGuide[];
export const readyFor = (entryId: string, skill?: Skill) => READY_SOLUTIONS.filter(solution => solution.entryId === entryId && (!skill || solution.skill === skill));
export const guidesFor = (entryId: string, skill?: Skill) => SOLUTION_GUIDES.filter(guide => guide.entryId === entryId && (!skill || guide.skill === skill || guide.skill === 'unknown'));
export function solutionSignature(solution: ReadySolution): string {
  return JSON.stringify({ ready: solution.id, skill: solution.skill, config: solution.config, alternatives: solution.configAlternatives, coverage: solution.modelCoverage, moves: solution.moves, direction: solution.direction });
}
export function restoredReadyStep(solution: ReadySolution, saved?: { signature: string; step: number }): number {
  const count = groupMoves(solution.moves).length;
  return saved?.signature === solutionSignature(solution) && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= count ? saved.step : 0;
}
export function solutionCoverage(entries: readonly { id: string; type: string; access?: string }[], skill?: Skill) {
  const withReady = new Set(READY_SOLUTIONS.filter(s => !skill || s.skill === skill).map(s => s.entryId));
  const withGuide = new Set(SOLUTION_GUIDES.filter(s => !skill || s.skill === skill || s.skill === 'unknown').map(s => s.entryId));
  const required = entries.filter(e => e.access !== 'unlocked' && e.access !== 'key');
  const notRequired = entries.length - required.length;
  const ready = required.filter(e => withReady.has(e.id)).length;
  const external = required.filter(e => !withReady.has(e.id) && withGuide.has(e.id)).length;
  return { total: entries.length, chests: entries.filter(e => e.type === 'chest' || e.type === 'underwater').length, ready, external, notRequired, missing: required.length - ready - external };
}
