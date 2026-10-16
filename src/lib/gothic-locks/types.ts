/** Arrays and move indices are bottom-first: index 0 is the lowest plate. */
export type DirectionConvention = 'right-increases' | 'right-decreases';
export interface LockConfig {
  positions: number[];
  /** links[from][to], directed; -1 opposite, 0 none, 1 same. Diagonal is 0. */
  links: number[][];
  direction: DirectionConvention;
}
export interface Move {
  /** Zero-based, lowest plate first. */
  plate: number;
  /** Change in numbered position, independent of physical left/right. */
  direction: 1 | -1;
}
export interface GroupedMove extends Move { count: number }
export interface SolveLimits {
  /** Maximum distinct lock positions discovered (default: all 7^N states). */
  maxStates?: number;
  /** Time budget, checked between expansions (default: 8 seconds). */
  maxMilliseconds?: number;
}
interface SolveStats {
  statesExplored: number;
  elapsedMilliseconds: number;
}
export type SolveResult =
  | (SolveStats & { status: 'solved'; moves: Move[]; reason?: never })
  | (SolveStats & { status: 'unsolvable' | 'limit' | 'invalid'; moves: []; reason: string });
