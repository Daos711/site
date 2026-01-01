/**
 * Tribology Lab — Симулятор баланса
 *
 * Точка входа для запуска симуляций всех 108 колод
 *
 * Запуск:
 *   npx ts-node src/lib/tribology-lab/sim/index.ts
 *
 * Или добавить в package.json:
 *   "scripts": {
 *     "sim": "npx ts-node src/lib/tribology-lab/sim/index.ts"
 *   }
 */

import { generateAllDecks, Deck } from './deckGenerator';
import { Simulator, SimulationConfig, SimulationResult } from './simulator';
import { PatternBot, getDefaultBot } from './bots';
import { aggregateResults, printReport, generateCSV, DeckStats } from './metrics';
import * as fs from 'fs';
import * as path from 'path';

// ═══════════════════════════════════════════════════════════════════════════
// КОНФИГУРАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  runsPerDeck: 50, // Прогонов на колоду
  maxWaves: 25, // Максимум волн
  initialLives: 10,
  initialGold: 100,
  outputDir: './sim-results', // Папка для результатов
};

// ═══════════════════════════════════════════════════════════════════════════
// ГЛАВНАЯ ФУНКЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  const startTime = Date.now();

  console.log('🔬 Tribology Lab — Симулятор баланса');
  console.log('════════════════════════════════════\n');

  const decks = generateAllDecks();
  console.log(`Колод: ${decks.length}`);
  console.log(`Прогонов на колоду: ${CONFIG.runsPerDeck}`);
  console.log(`Всего симуляций: ${decks.length * CONFIG.runsPerDeck}`);
  console.log(`Макс волн: ${CONFIG.maxWaves}\n`);

  const bot = getDefaultBot();
  console.log(`Бот: ${bot.name}\n`);

  const allStats: DeckStats[] = [];
  let completed = 0;
  const total = decks.length;

  // Прогресс
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

      const result = sim.run(bot);
      results.push(result);
    }

    const stats = aggregateResults(results, deck);
    allStats.push(stats);

    completed++;

    // Обновление прогресса каждые 10%
    const progressPercent = Math.floor((completed / total) * 10) * 10;
    if (progressPercent > lastProgressPercent) {
      console.log(`Прогресс: ${completed}/${total} (${progressPercent}%)`);
      lastProgressPercent = progressPercent;
    }
  }

  console.log('\n');

  // Вывод отчёта
  printReport(allStats);

  // Сохранение CSV
  try {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const csvPath = path.join(CONFIG.outputDir, `balance_report_${timestamp}.csv`);
    const csv = generateCSV(allStats);
    fs.writeFileSync(csvPath, csv);
    console.log(`\n📊 Отчёт сохранён: ${csvPath}`);
  } catch (e) {
    console.log('\n⚠️  Не удалось сохранить CSV (возможно, нет прав на запись)');
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n⏱️  Время выполнения: ${elapsed}s`);
}

// ═══════════════════════════════════════════════════════════════════════════
// ТЕСТ ОДНОЙ КОЛОДЫ
// ═══════════════════════════════════════════════════════════════════════════

async function testSingleDeck() {
  console.log('🧪 Тест одной колоды\n');

  const decks = generateAllDecks();
  const deck = decks[0]; // Первая колода

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
  console.log('\n🔁 Тест воспроизводимости (тот же seed)...');
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
    console.log('❌ Результаты различаются — проблема с PRNG!');
    console.log(`  Run 1: wave=${result.finalWave}, kills=${result.totalKills}`);
    console.log(`  Run 2: wave=${result2.finalWave}, kills=${result2.totalKills}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ЗАПУСК
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--test')) {
  testSingleDeck().catch(console.error);
} else {
  main().catch(console.error);
}
