// Размеры и отступы
export const PADDING = { left: 80, right: 60, top: 20, bottom: 20 };

// Высоты панелей
export const BEAM_HEIGHT = 200;
export const DIAGRAM_HEIGHT = 160;
export const GAP = 16;

// Цвета как в sopromat: Q=синий, M=красный, реакции=зелёный
export const COLORS = {
  beam: "rgb(100, 116, 139)",
  support: "rgb(148, 163, 184)",
  distributedLoad: "rgb(59, 130, 246)", // синий
  pointForce: "rgb(239, 68, 68)", // красный
  moment: "rgb(168, 85, 247)", // фиолетовый
  reaction: "rgb(34, 197, 94)", // зелёный
  Q: "rgb(59, 130, 246)", // СИНИЙ как в sopromat
  M: "rgb(239, 68, 68)", // КРАСНЫЙ как в sopromat
  theta: "rgb(251, 146, 60)", // оранжевый
  w: "rgb(96, 165, 250)", // голубой
  grid: "rgba(255, 255, 255, 0.2)",
  boundary: "rgba(255, 255, 255, 0.5)",
  text: "rgba(255, 255, 255, 0.9)",
  textMuted: "rgba(255, 255, 255, 0.6)",
} as const;

// Форматирование числа без лишних нулей: 31.00 → "31", 31.50 → "31.5"
// Умная точность: для малых значений (< 0.1) показываем больше знаков
// Округление floating-point шума: 20.03 → 20, если близко к целому
export function formatNum(val: number, decimals = 2): string {
  // Сначала проверяем на ноль (включая -0)
  if (Math.abs(val) < 1e-10) return "0";

  // Округляем floating-point шум: если значение ОЧЕНЬ близко к "красивому" числу
  // (целое, .5, .25), округляем к нему. Порог 0.2% — только явные ошибки типа 20.03
  const snapThreshold = 0.002; // 0.2% допуск — только floating-point шум
  const roundToNearest = (v: number, step: number): number => {
    const rounded = Math.round(v / step) * step;
    const relError = Math.abs(v - rounded) / Math.max(Math.abs(v), 1);
    return relError < snapThreshold ? rounded : v;
  };

  // Пробуем округлить к целым, потом к 0.5, потом к 0.25
  let snapped = roundToNearest(val, 1);
  if (snapped === val) snapped = roundToNearest(val, 0.5);
  if (snapped === val) snapped = roundToNearest(val, 0.25);
  val = snapped;

  // Для малых значений увеличиваем точность
  const absVal = Math.abs(val);
  let actualDecimals = decimals;
  if (absVal < 0.001) {
    actualDecimals = 5; // Для очень малых значений (углы в радианах)
  } else if (absVal < 0.01) {
    actualDecimals = 4;
  } else if (absVal < 0.1) {
    actualDecimals = 3;
  }

  const fixed = val.toFixed(actualDecimals);
  // Убираем trailing zeros после точки
  const result = fixed.replace(/\.?0+$/, "");
  // Защита от "-0"
  return result === "-0" ? "0" : result;
}
