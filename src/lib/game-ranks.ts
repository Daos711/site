/**
 * Система рангов для игры "Цифры"
 * Основано на Python версии ranks.py
 */

// Ранги: [минимальный счёт, название, цвет текста, цвет фона]
export const RANKS: [number, string, string, string][] = [
  // Начальные ранги
  [0, "Новичок", "#7a7f86", "#eef0f2"],
  [1800, "Любитель", "#2e7d32", "#e7f4e8"],
  [2000, "Энтузиаст", "#00897b", "#e0f5f2"],
  [2200, "Юниор", "#1e88e5", "#e3f1ff"],

  // Разряды
  [2300, "3 разряд", "#a66a2e", "#f4e9df"],
  [2400, "2 разряд", "#607d8b", "#e9eef2"],
  [2500, "1 разряд", "#b8860b", "#fff3cc"],

  // Мастерские ранги
  [2600, "Кандидат в мастера", "#6a1b9a", "#f1e6fa"],
  [2700, "Мастер", "#28356f", "#e6eafb"],
  [2800, "Мастер-международник", "#ffffff", "#6495ed"],

  // Элитные ранги
  [2900, "Эксперт", "#ffffff", "#4664b4"],

  // Легендарные ранги (3000+)
  [3000, "Гроссмейстер", "#ffffff", "#b71c1c"],
  [3100, "Соломон", "#ffffff", "#00c853"],
  [3200, "Сверхчеловек", "#ffffff", "#00e5ff"],
  [3300, "Титан", "#ffffff", "#ff6d00"],
  [3400, "Зевс-Демиург", "#ffffff", "#5e35b1"],
  [3500, "Unreal", "#ffffff", "#00e5ff"],
];

// Градиенты для легендарных рангов (3000+)
export const LEGENDARY_GRADIENTS: Record<number, string[]> = {
  3000: ["#780000", "#af3232"], // Гроссмейстер: тёмно-красный
  3100: ["#238c46", "#af9b46"], // Соломон: зелёный → золотой
  3200: ["#239baf", "#325faf"], // Сверхчеловек: голубой → синий
  3300: ["#af5523", "#af323c"], // Титан: оранжевый → красный
  3400: ["#502d8c", "#af9b46"], // Зевс-Демиург: фиолетовый → золотой
  3500: ["#140a28", "#281450", "#3c1e78"], // Unreal: космический фиолетовый
};

export interface RankInfo {
  name: string;
  textColor: string;
  bgColor: string;
  isLegendary: boolean;
  gradient?: string[];
}

/**
 * Получить информацию о ранге по итоговому счёту
 */
export function getRank(totalScore: number): RankInfo {
  let rankName = RANKS[0][1];
  let textColor = RANKS[0][2];
  let bgColor = RANKS[0][3];
  let minScore = 0;

  for (const [score, name, fg, bg] of RANKS) {
    if (totalScore >= score) {
      minScore = score;
      rankName = name;
      textColor = fg;
      bgColor = bg;
    } else {
      break;
    }
  }

  const isLegendary = minScore >= 3000;
  const gradient = isLegendary ? LEGENDARY_GRADIENTS[minScore] : undefined;

  return {
    name: rankName,
    textColor,
    bgColor,
    isLegendary,
    gradient,
  };
}

/**
 * Получить только название ранга
 */
export function getRankName(totalScore: number): string {
  return getRank(totalScore).name;
}

/**
 * Получить индекс ранга (0-15)
 */
export function getRankIndex(totalScore: number): number {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalScore >= RANKS[i][0]) {
      index = i;
    } else {
      break;
    }
  }
  return index;
}

/**
 * Расчёт бонуса за оставшееся время
 */
export function calculateBonus(remainingTime: number): number {
  return 300 + 5 * Math.round(remainingTime);
}

/**
 * Расчёт итогового счёта
 */
export function calculateTotalScore(gameScore: number, remainingTime: number): number {
  return gameScore + calculateBonus(remainingTime);
}
