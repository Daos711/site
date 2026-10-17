import gothic from './data/gothic-route.json';
import type { RouteDefinition } from './routes';

export const GAME_GUIDES: RouteDefinition[] = [gothic as RouteDefinition];
export function getGuide(gameId: string): RouteDefinition | undefined {
  return GAME_GUIDES.find(guide => guide.gameId === gameId);
}
