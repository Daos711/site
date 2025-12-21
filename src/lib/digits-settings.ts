// Настройки игры "Цифры" - размеры и скорость как в Python версии

// Базовые размеры (при scale = 1.0)
// Значительно уменьшены - браузер рендерит CSS пиксели крупнее чем Python
export const BASE_TILE_SIZE = 36;
export const BASE_GAP = 2;
export const BASE_PANEL_WIDTH = 140;
export const BASE_FRAME_WIDTH = 6;

// Пресеты размеров - подобраны для визуального соответствия Python
export const SIZE_PRESETS = {
  small: { name: 'Маленький', scale: 0.78 },   // ~28px плитка
  medium: { name: 'Средний', scale: 1.0 },     // 36px плитка
  large: { name: 'Большой', scale: 1.22 },     // ~44px плитка
  xlarge: { name: 'Очень большой', scale: 1.44 }, // ~52px плитка
} as const;

export type SizePreset = keyof typeof SIZE_PRESETS;
export const SIZE_ORDER: SizePreset[] = ['small', 'medium', 'large', 'xlarge'];

// Пресеты скорости (как в Python)
// ВАЖНО: Скорость рассчитывается на основе PYTHON-размера плитки (64px),
// а не браузерного, чтобы скорость была одинаковой независимо от размера
const PYTHON_TILE_SIZE = 64; // Базовый размер плитки в Python версии

// Скорость в Python: пиксели за кадр при 60fps
// Фиксированные ms на ячейку: (PYTHON_TILE_SIZE / speed) * 16.67
export const SPEED_PRESETS = {
  slow: { name: 'Медленно', pixelsPerFrame: 2, msPerCell: 533 },      // 64/2 * 16.67 = 533ms
  normal: { name: 'Нормально', pixelsPerFrame: 3, msPerCell: 356 },   // 64/3 * 16.67 = 356ms
  fast: { name: 'Быстро', pixelsPerFrame: 5, msPerCell: 213 },        // 64/5 * 16.67 = 213ms
  very_fast: { name: 'Очень быстро', pixelsPerFrame: 8, msPerCell: 133 }, // 64/8 * 16.67 = 133ms
} as const;

export type SpeedPreset = keyof typeof SPEED_PRESETS;
export const SPEED_ORDER: SpeedPreset[] = ['slow', 'normal', 'fast', 'very_fast'];

// Получить ms на ячейку для заданной скорости
// ФИКСИРОВАННЫЕ значения, не зависящие от размера плитки в браузере
export function getMsPerCell(speedPreset: SpeedPreset, _sizePreset?: SizePreset): number {
  return SPEED_PRESETS[speedPreset].msPerCell;
}

// Получить масштабированные значения
export function getScaledValues(sizePreset: SizePreset) {
  const scale = SIZE_PRESETS[sizePreset].scale;
  return {
    tileSize: Math.round(BASE_TILE_SIZE * scale),
    gap: Math.round(BASE_GAP * scale),
    panelWidth: Math.round(BASE_PANEL_WIDTH * scale),
    frameWidth: Math.round(BASE_FRAME_WIDTH * scale),
  };
}

// Рассчитать размер поля
export function getBoardDimensions(sizePreset: SizePreset) {
  const { tileSize, gap } = getScaledValues(sizePreset);
  const boardSize = 10;
  // Формула из Python: (boardSize + 1) * gap + boardSize * tileSize
  const tileAreaSize = (boardSize + 1) * gap + boardSize * tileSize;
  return {
    tileAreaSize,
    tileSize,
    gap,
  };
}

// Настройки по умолчанию
export const DEFAULT_SIZE: SizePreset = 'medium';
export const DEFAULT_SPEED: SpeedPreset = 'normal';
