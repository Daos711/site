import gothic from './data/gothic-remake.json';
import type { GameCatalog } from './types';

// New games are added as their own typed data catalog and one registry entry.
// Progress references stable IDs; a catalog update never rewrites user history.
export const GAME_CATALOGS: GameCatalog[] = [gothic as GameCatalog];
export function getGame(id: string): GameCatalog | undefined {
  return GAME_CATALOGS.find(game => game.id === id);
}
