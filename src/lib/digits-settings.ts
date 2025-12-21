// Настройки игры "Цифры" - ТОЧНО как в Python версии

// ============================================
// БАЗОВЫЕ РАЗМЕРЫ (при scale = 1.0)
// Точные значения из Python scale.py
// ============================================
export const BASE_TILE_SIZE = 64;
export const BASE_GAP = 3;
export const BASE_PANEL_WIDTH = 240;
export const BASE_FRAME_WIDTH = 10;

// ============================================
// ПРЕСЕТЫ РАЗМЕРОВ
// Точные значения из Python settings.py
// ============================================
export const SIZE_PRESETS = {
  small: { name: 'Маленький', scale: 0.7 },
  medium: { name: 'Средний', scale: 0.9 },
  large: { name: 'Большой', scale: 1.0 },
  xlarge: { name: 'Очень большой', scale: 1.2 },
} as const;

export type SizePreset = keyof typeof SIZE_PRESETS;
export const SIZE_ORDER: SizePreset[] = ['small', 'medium', 'large', 'xlarge'];

// ============================================
// ПРЕСЕТЫ СКОРОСТИ
// Точные значения из Python settings.py
// speed = пиксели за кадр при 60fps
// ============================================
export const SPEED_PRESETS = {
  slow: { name: 'Медленно', pixelsPerFrame: 2 },
  normal: { name: 'Нормально', pixelsPerFrame: 3 },
  fast: { name: 'Быстро', pixelsPerFrame: 5 },
  very_fast: { name: 'Очень быстро', pixelsPerFrame: 8 },
} as const;

export type SpeedPreset = keyof typeof SPEED_PRESETS;
export const SPEED_ORDER: SpeedPreset[] = ['slow', 'normal', 'fast', 'very_fast'];

// ============================================
// ФУНКЦИИ РАСЧЁТА
// ============================================

// Функция масштабирования как в Python: scaled(value) = max(1, int(value * scale))
function scaled(value: number, scale: number): number {
  return Math.max(1, Math.round(value * scale));
}

// Получить ms на ячейку для заданной скорости и размера
// Формула: время = расстояние / скорость
// расстояние = tileSize + gap (в пикселях)
// скорость = pixelsPerFrame * 60 (пикселей в секунду)
export function getMsPerCell(speedPreset: SpeedPreset, sizePreset: SizePreset): number {
  const scale = SIZE_PRESETS[sizePreset].scale;
  const tileSize = scaled(BASE_TILE_SIZE, scale);
  const gap = scaled(BASE_GAP, scale);
  const cellSize = tileSize + gap;

  const pixelsPerFrame = SPEED_PRESETS[speedPreset].pixelsPerFrame;
  const pixelsPerSecond = pixelsPerFrame * 60;

  // ms = (cellSize / pixelsPerSecond) * 1000
  return Math.round((cellSize / pixelsPerSecond) * 1000);
}

// Получить масштабированные значения
export function getScaledValues(sizePreset: SizePreset) {
  const scale = SIZE_PRESETS[sizePreset].scale;
  return {
    tileSize: scaled(BASE_TILE_SIZE, scale),
    gap: scaled(BASE_GAP, scale),
    panelWidth: scaled(BASE_PANEL_WIDTH, scale),
    frameWidth: scaled(BASE_FRAME_WIDTH, scale),
    // Тень плитки: bevel = max(2, round(tileSize * 3 / 64)) как в Python tile.py
    bevel: Math.max(2, Math.round(scaled(BASE_TILE_SIZE, scale) * 3 / 64)),
  };
}

// Рассчитать размер поля
export function getBoardDimensions(sizePreset: SizePreset) {
  const { tileSize, gap, panelWidth, frameWidth, bevel } = getScaledValues(sizePreset);
  const boardSize = 10;
  // Формула из Python: (boardSize + 1) * gap + boardSize * tileSize
  const tileAreaSize = (boardSize + 1) * gap + boardSize * tileSize;
  return {
    tileAreaSize,
    tileSize,
    gap,
    panelWidth,
    frameWidth,
    bevel,
  };
}

// Настройки по умолчанию
export const DEFAULT_SIZE: SizePreset = 'medium';
export const DEFAULT_SPEED: SpeedPreset = 'normal';
