/**
 * Параллельный запуск симуляций на всех ядрах CPU
 */

import { Worker } from 'worker_threads';
import * as os from 'os';
import * as path from 'path';
import { generateAllDecks, Deck } from './deckGenerator';
import { aggregateResults, DeckStats } from './metrics';
import { SimulationResult } from './simulator';

const NUM_WORKERS = Math.max(1, Math.min(os.cpus().length - 2, 14)); // Оставляем 2 ядра системе

interface WorkerTask {
  deck: Deck;
  seeds: number[];
  maxWaves: number;
  initialLives: number;
  initialGold: number;
}

interface WorkerResult {
  deckId: number;
  results: SimulationResult[];
}

export async function runParallel(config: {
  runsPerDeck: number;
  maxWaves: number;
  initialLives: number;
  initialGold: number;
}): Promise<DeckStats[]> {
  const decks = generateAllDecks();

  console.log(`🚀 Параллельный запуск`);
  console.log(`   Воркеров: ${NUM_WORKERS}`);
  console.log(`   Колод: ${decks.length}`);
  console.log(`   Прогонов на колоду: ${config.runsPerDeck}`);
  console.log(`   Всего симуляций: ${decks.length * config.runsPerDeck}\n`);

  const tasks: WorkerTask[] = decks.map((deck) => ({
    deck,
    seeds: Array.from({ length: config.runsPerDeck }, (_, i) => deck.id * 10000 + i),
    maxWaves: config.maxWaves,
    initialLives: config.initialLives,
    initialGold: config.initialGold,
  }));

  let taskIndex = 0;
  let completed = 0;
  const allResults: Map<number, SimulationResult[]> = new Map();
  const startTime = Date.now();

  // Путь к воркеру
  const workerPath = path.join(__dirname, 'worker.ts');

  return new Promise((resolve, reject) => {
    const workers: Worker[] = [];

    function assignTask(worker: Worker) {
      if (taskIndex < tasks.length) {
        worker.postMessage(tasks[taskIndex++]);
      } else {
        worker.terminate();
      }
    }

    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = new Worker(workerPath, {
        execArgv: ['--import', 'tsx'],
      });

      worker.on('message', (result: WorkerResult) => {
        allResults.set(result.deckId, result.results);
        completed++;

        const elapsed = (Date.now() - startTime) / 1000;
        const rate = completed / elapsed;
        const eta = (tasks.length - completed) / rate;

        // Простой прогресс без очистки строки
        if (completed % 10 === 0 || completed === tasks.length) {
          console.log(
            `   Прогресс: ${completed}/${tasks.length} ` +
              `(${((completed / tasks.length) * 100).toFixed(0)}%) | ` +
              `${rate.toFixed(1)} колод/сек | ` +
              `ETA: ${eta.toFixed(0)}с`
          );
        }

        if (completed === tasks.length) {
          console.log('');
          const stats = decks.map((deck) => aggregateResults(allResults.get(deck.id)!, deck));
          const totalTime = (Date.now() - startTime) / 1000;
          console.log(`⏱️  Время: ${totalTime.toFixed(1)} сек`);
          console.log(`📊 Симуляций/сек: ${((tasks.length * config.runsPerDeck) / totalTime).toFixed(0)}`);
          resolve(stats);
        } else {
          assignTask(worker);
        }
      });

      worker.on('error', (err) => {
        console.error(`Ошибка воркера: ${err.message}`);
        reject(err);
      });

      workers.push(worker);
      assignTask(worker);
    }
  });
}
