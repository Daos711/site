/**
 * Воркер для параллельного запуска симуляций
 */

import { parentPort } from 'worker_threads';
import { Simulator, SimulationResult } from './simulator';
import { PatternBot } from './bots';
import { Deck } from './deckGenerator';

interface WorkerTask {
  deck: Deck;
  seeds: number[];
  maxWaves: number;
  initialLives: number;
  initialGold: number;
}

parentPort?.on('message', (task: WorkerTask) => {
  const bot = new PatternBot();
  const results: SimulationResult[] = [];

  for (const seed of task.seeds) {
    const sim = new Simulator({
      deck: task.deck,
      seed,
      maxWaves: task.maxWaves,
      initialLives: task.initialLives,
      initialGold: task.initialGold,
    });
    results.push(sim.run(bot));
  }

  parentPort?.postMessage({ deckId: task.deck.id, results });
});
