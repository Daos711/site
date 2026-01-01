/**
 * Tribology Lab — Симулятор баланса
 *
 * Запуск:
 *   npx tsx src/lib/tribology-lab/sim/index.ts
 *
 * Параллельный запуск (все ядра):
 *   npx tsx src/lib/tribology-lab/sim/index.ts --parallel
 *
 * Тест одной колоды:
 *   npx tsx src/lib/tribology-lab/sim/index.ts --test
 */

import { generateAllDecks } from './deckGenerator';
import { Simulator, SimulationResult } from './simulator';
import { getDefaultBot } from './bots';
import { aggregateResults, printReport, generateCSV, DeckStats } from './metrics';
import { runParallel } from './runner';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// КОНФИГУРАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  runsPerDeck: 100, // Прогонов на колоду
  maxWaves: 25, // Максимум волн
  initialLives: 10,
  initialGold: 100,
  outputDir: './sim-results',
};

// ═══════════════════════════════════════════════════════════════════════════
// ПОСЛЕДОВАТЕЛЬНЫЙ ЗАПУСК
// ═══════════════════════════════════════════════════════════════════════════

async function runSequential(): Promise<DeckStats[]> {
  const decks = generateAllDecks();
  const bot = getDefaultBot();

  console.log(`Колод: ${decks.length}`);
  console.log(`Прогонов на колоду: ${CONFIG.runsPerDeck}`);
  console.log(`Всего симуляций: ${decks.length * CONFIG.runsPerDeck}`);
  console.log(`Макс волн: ${CONFIG.maxWaves}`);
  console.log(`Бот: ${bot.name}\n`);

  const allStats: DeckStats[] = [];
  let completed = 0;
  const total = decks.length;
  let lastProgressPercent = 0;

  for (const deck of decks) {
    const results: SimulationResult[] = [];

    for (let run = 0; run < CONFIG.runsPerDeck; run++) {
      const seed = deck.id * 10000 + run;
      const sim = new Simulator({
        deck,
        seed,
        maxWaves: CONFIG.maxWaves,
        initialLives: CONFIG.initialLives,
        initialGold: CONFIG.initialGold,
      });
      results.push(sim.run(bot));
    }

    allStats.push(aggregateResults(results, deck));
    completed++;

    const progressPercent = Math.floor((completed / total) * 10) * 10;
    if (progressPercent > lastProgressPercent) {
      console.log(`Прогресс: ${completed}/${total} (${progressPercent}%)`);
      lastProgressPercent = progressPercent;
    }
  }

  return allStats;
}

// ═══════════════════════════════════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

async function main(parallel: boolean = false) {
  const startTime = Date.now();

  console.log('🔬 Tribology Lab — Симулятор баланса');
  console.log('════════════════════════════════════\n');

  let stats: DeckStats[];

  if (parallel) {
    stats = await runParallel(CONFIG);
  } else {
    stats = await runSequential();
  }

  console.log('\n');
  printReport(stats);

  // Сохранение CSV
  try {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const csvPath = path.join(CONFIG.outputDir, `balance_report_${timestamp}.csv`);
    fs.writeFileSync(csvPath, generateCSV(stats));
    console.log(`\n📊 Отчёт сохранён: ${csvPath}`);
  } catch {
    console.log('\n⚠️  Не удалось сохранить CSV');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Общее время: ${elapsed}s`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ТЕСТ ОДНОЙ КОЛОДЫ
// ═══════════════════════════════════════════════════════════════════════════

async function testSingleDeck() {
  console.log('🧪 Тест одной колоды\n');

  const decks = generateAllDecks();
  const deck = decks[0];

  console.log(`Колода: ${deck.modules.join(' + ')}`);
  console.log(`Seed: 12345\n`);

  const sim = new Simulator({
    deck,
    seed: 12345,
    maxWaves: 15,
    initialLives: 10,
    initialGold: 100,
  });

  const bot = getDefaultBot();
  const result = sim.run(bot);

  console.log('Результат:');
  console.log(`  Финальная волна: ${result.finalWave}`);
  console.log(`  Выжил: ${result.survived}`);
  console.log(`  Жизней осталось: ${result.livesLeft}`);
  console.log(`  Всего убийств: ${result.totalKills}`);
  console.log(`  Всего золота: ${result.totalGoldEarned}`);
  console.log('\nВолны:');
  for (const w of result.wavesData) {
    console.log(`  Волна ${w.wave}: kills=${w.kills}, leaks=${w.leaks}, modules=${w.modulesPlaced}`);
  }

  // Тест воспроизводимости
  console.log('\n🔁 Тест воспроизводимости...');
  const sim2 = new Simulator({
    deck,
    seed: 12345,
    maxWaves: 15,
    initialLives: 10,
    initialGold: 100,
  });
  const result2 = sim2.run(bot);

  if (result.finalWave === result2.finalWave && result.totalKills === result2.totalKills) {
    console.log('✅ Результаты идентичны — PRNG работает правильно');
  } else {
    console.log('❌ Результаты различаются!');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ЗАПУСК
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--test')) {
  testSingleDeck().catch(console.error);
} else if (args.includes('--parallel')) {
  main(true).catch(console.error);
} else {
  main(false).catch(console.error);
}
