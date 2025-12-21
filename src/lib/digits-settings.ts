// Настройки игры "Цифры" - размеры и скорость как в Python версии

// Базовые размеры (при scale = 1.0)
// Уменьшены для соответствия визуальному размеру Python версии
export const BASE_TILE_SIZE = 48;  // было 64 в Python, но браузер рендерит крупнее
export const BASE_GAP = 2;
export const BASE_PANEL_WIDTH = 180;
export const BASE_FRAME_WIDTH = 8;

// Пресеты размеров (как в Python)
export const SIZE_PRESETS = {
  small: { name: 'Маленький', scale: 0.75 },
  medium: { name: 'Средний', scale: 0.95 },
  large: { name: 'Большой', scale: 1.1 },
  xlarge: { name: 'Очень большой', scale: 1.3 },
} as const;

export type SizePreset = keyof typeof SIZE_PRESETS;
export const SIZE_ORDER: SizePreset[] = ['small', 'medium', 'large', 'xlarge'];

// Пресеты скорости (как в Python)
// Скорость в Python: пиксели за кадр при 60fps
// Конвертируем в ms на ячейку: (TILE_SIZE / speed) / 60 * 1000
export const SPEED_PRESETS = {
  slow: { name: 'Медленно', pixelsPerFrame: 2 },      // ~533ms на ячейку
  normal: { name: 'Нормально', pixelsPerFrame: 3 },   // ~355ms на ячейку
  fast: { name: 'Быстро', pixelsPerFrame: 5 },        // ~213ms на ячейку
  very_fast: { name: 'Очень быстро', pixelsPerFrame: 8 }, // ~133ms на ячейку
} as const;

export type SpeedPreset = keyof typeof SPEED_PRESETS;
export const SPEED_ORDER: SpeedPreset[] = ['slow', 'normal', 'fast', 'very_fast'];

// Рассчитать ms на ячейку для заданной скорости и размера
export function getMsPerCell(speedPreset: SpeedPreset, sizePreset: SizePreset): number {
  const tileSize = Math.round(BASE_TILE_SIZE * SIZE_PRESETS[sizePreset].scale);
  const pixelsPerFrame = SPEED_PRESETS[speedPreset].pixelsPerFrame;
  // При 60fps, 1 кадр = 16.67ms
  // Кадров на ячейку = tileSize / pixelsPerFrame
  // ms на ячейку = кадров * 16.67
  const framesPerCell = tileSize / pixelsPerFrame;
  return Math.round(framesPerCell * (1000 / 60));
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
