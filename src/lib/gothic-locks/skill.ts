import type { LockConfig } from './types';
import { validateConfig } from './simulator';

export type Skill = 'none' | 'trained' | 'master';
export type SkillProfiles = Partial<Record<Skill, LockConfig>>;
/** Zero-based plate indices, in the author's confirmed connection order. */
export type OrderedConnection = readonly [from: number, to: number, sign: 1 | -1];
export const SKILLS: readonly Skill[] = ['none', 'trained', 'master'];
export const PRECISION_BY_SKILL: Readonly<Record<Skill, number>> = { none: 0, trained: 1, master: 2 };

function cloneConfig(config: LockConfig): LockConfig {
  return {
    positions: config.positions.slice(),
    links: config.links.map((row) => row.slice()),
    direction: config.direction,
  };
}

/**
 * An observation without a recorded skill is never a skill-specific profile.
 * The observation argument makes that distinction explicit at call sites; callers
 * may offer it separately as an observed-state scenario, with its uncertainty shown.
 * Profiles must be admitted by the catalog's provenance checks before this call.
 */
export function resolveSkillConfig(
  _observation: LockConfig | null,
  profiles: SkillProfiles | undefined,
  skill: Skill,
): LockConfig | null {
  if (!SKILLS.includes(skill) || !profiles || !Object.prototype.hasOwnProperty.call(profiles, skill)) return null;
  const profile = profiles[skill];
  if (!profile || validateConfig(profile).length) return null;
  return cloneConfig(profile);
}

/**
 * Generic model of the documented connection-removal rule; no game data is
 * embedded here. The ordered list must cover every directed edge of the full
 * base configuration exactly once. A row-sorted matrix is not evidence of the
 * original authored order. Do not use this on an already observed/pruned matrix.
 *
 * Rule reference: G1LockPickHelper docs/TECHNICAL.md, revision
 * e8e8da84cd8e48bcf6ed8077c7c922e83a449144 (Build83_CL174209).
 * This is an independent implementation, not a copy of its excluded lock data.
 */
export function configForPrecision(
  baseConfig: LockConfig,
  orderedEdges: readonly OrderedConnection[],
  precision: number,
): LockConfig | null {
  if (validateConfig(baseConfig).length || !Array.isArray(orderedEdges) ||
      !Number.isFinite(precision) || precision < 0) return null;

  const count = baseConfig.positions.length;
  const expectedEdges = baseConfig.links.reduce((total, row) => total + row.filter((sign) => sign !== 0).length, 0);
  if (orderedEdges.length !== expectedEdges) return null;
  const seen = new Set<number>();
  for (const edge of orderedEdges) {
    if (!Array.isArray(edge) || edge.length !== 3) return null;
    const [from, to, sign] = edge;
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to < 0 ||
        from >= count || to >= count || from === to || (sign !== 1 && sign !== -1) ||
        baseConfig.links[from][to] !== sign) return null;
    const key = from * count + to;
    if (seen.has(key)) return null;
    seen.add(key);
  }

  const result = cloneConfig(baseConfig);
  const removedCount = Math.min(orderedEdges.length, Math.floor(precision + 0.5));
  for (let index = 0; index < removedCount; index++) {
    const [from, to] = orderedEdges[index];
    result.links[from][to] = 0;
  }
  return result;
}
