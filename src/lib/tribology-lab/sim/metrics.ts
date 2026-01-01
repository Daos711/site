/**
 * Сбор и агрегация метрик симуляций
 */

import { SimulationResult } from './simulator';
import { Deck, getDeckName } from './deckGenerator';

// ═══════════════════════════════════════════════════════════════════════════
// ИНТЕРФЕЙСЫ
// ═══════════════════════════════════════════════════════════════════════════

export interface DeckStats {
  deckId: number;
  deckName: string;
  runs: number;
  avgFinalWave: number;
  minWave: number;
  maxWave: number;
  medianWave: number;
  p10Wave: number; // 10-й перцентиль
  p90Wave: number; // 90-й перцентиль
  survivalRate: number; // % дошедших до maxWaves
  avgKills: number;
  avgGoldEarned: number;
  avgLeaks: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// АГРЕГАЦИЯ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Вычисляет перцентиль отсортированного массива
 */
function percentile(sortedArray: number[], p: number): number {
  const idx = Math.floor(sortedArray.length * p);
  return sortedArray[Math.min(idx, sortedArray.length - 1)];
}

/**
 * Агрегирует результаты симуляций для одной колоды
 */
export function aggregateResults(results: SimulationResult[], deck: Deck): DeckStats {
  const waves = results.map((r) => r.finalWave).sort((a, b) => a - b);
  const n = waves.length;

  const totalLeaks = results.reduce((sum, r) => {
    return sum + r.wavesData.reduce((ws, w) => ws + w.leaks, 0);
  }, 0);

  return {
    deckId: deck.id,
    deckName: getDeckName(deck),
    runs: n,
    avgFinalWave: waves.reduce((a, b) => a + b, 0) / n,
    minWave: waves[0],
    maxWave: waves[n - 1],
    medianWave: waves[Math.floor(n / 2)],
    p10Wave: percentile(waves, 0.1),
    p90Wave: percentile(waves, 0.9),
    survivalRate: (results.filter((r) => r.survived).length / n) * 100,
    avgKills: results.reduce((a, r) => a + r.totalKills, 0) / n,
    avgGoldEarned: results.reduce((a, r) => a + r.totalGoldEarned, 0) / n,
    avgLeaks: totalLeaks / n,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ОТЧЁТ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Выводит отчёт в консоль
 */
export function printReport(allStats: DeckStats[]): void {
  // Сортировка по средней волне (лучшие первые)
  const sorted = [...allStats].sort((a, b) => b.avgFinalWave - a.avgFinalWave);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                    ОТЧЁТ ПО БАЛАНСУ КОЛОД                      ');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('Топ-10 лучших колод:');
  console.log('─────────────────────────────────────────────────────────────────');
  for (const stat of sorted.slice(0, 10)) {
    console.log(
      `${stat.deckName.padEnd(25)} | ` +
        `Avg: ${stat.avgFinalWave.toFixed(1).padStart(5)} | ` +
        `Med: ${stat.medianWave.toString().padStart(3)} | ` +
        `p10-p90: ${stat.p10Wave}-${stat.p90Wave} | ` +
        `Survival: ${stat.survivalRate.toFixed(0)}%`
    );
  }

  console.log('\nТоп-10 худших колод:');
  console.log('─────────────────────────────────────────────────────────────────');
  for (const stat of sorted.slice(-10).reverse()) {
    console.log(
      `${stat.deckName.padEnd(25)} | ` +
        `Avg: ${stat.avgFinalWave.toFixed(1).padStart(5)} | ` +
        `Med: ${stat.medianWave.toString().padStart(3)} | ` +
        `p10-p90: ${stat.p10Wave}-${stat.p90Wave} | ` +
        `Survival: ${stat.survivalRate.toFixed(0)}%`
    );
  }

  // Общая статистика
  const allWaves = sorted.map((s) => s.avgFinalWave);
  const globalAvg = allWaves.reduce((a, b) => a + b, 0) / allWaves.length;
  const globalMin = Math.min(...allWaves);
  const globalMax = Math.max(...allWaves);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                      ОБЩАЯ СТАТИСТИКА                          ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Всего колод: ${sorted.length}`);
  console.log(`Средняя волна (глобально): ${globalAvg.toFixed(2)}`);
  console.log(`Разброс средних: ${globalMin.toFixed(1)} - ${globalMax.toFixed(1)}`);
  console.log(`Дельта: ${(globalMax - globalMin).toFixed(1)} волн`);

  // Флаги проблем
  const weak = sorted.filter((s) => s.avgFinalWave < globalAvg - 3);
  const strong = sorted.filter((s) => s.avgFinalWave > globalAvg + 3);

  if (weak.length > 0) {
    console.log(`\n⚠️  СЛАБЫЕ КОЛОДЫ (< ${(globalAvg - 3).toFixed(1)} волн): ${weak.length}`);
    weak.forEach((s) => console.log(`   - ${s.deckName}: ${s.avgFinalWave.toFixed(1)}`));
  }

  if (strong.length > 0) {
    console.log(`\n⚠️  СИЛЬНЫЕ КОЛОДЫ (> ${(globalAvg + 3).toFixed(1)} волн): ${strong.length}`);
    strong.forEach((s) => console.log(`   - ${s.deckName}: ${s.avgFinalWave.toFixed(1)}`));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CSV ЭКСПОРТ
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Генерирует CSV строку из статистики
 */
export function generateCSV(stats: DeckStats[]): string {
  const header = 'deckId,deckName,runs,avgWave,minWave,maxWave,medianWave,p10,p90,survivalRate,avgKills,avgGold,avgLeaks\n';
  const rows = stats
    .map(
      (s) =>
        `${s.deckId},${s.deckName},${s.runs},${s.avgFinalWave.toFixed(2)},${s.minWave},${s.maxWave},${s.medianWave},${s.p10Wave},${s.p90Wave},${s.survivalRate.toFixed(1)},${s.avgKills.toFixed(1)},${s.avgGoldEarned.toFixed(1)},${s.avgLeaks.toFixed(1)}`
    )
    .join('\n');

  return header + rows;
}
