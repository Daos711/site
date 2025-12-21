// Настройки игры "Цифры"
// Значения подобраны для визуального соответствия Python-версии
// (CSS-пиксели ~1.65x больше Pygame-пикселей на типичном экране)

// ============================================
// БАЗОВЫЕ РАЗМЕРЫ (при scale = 1.0)
// Python: 64, 3, 240 — делим на 1.65 для визуального соответствия
// ============================================
export const BASE_TILE_SIZE = 39;  // Python 64 / 1.65
export const BASE_GAP = 2;          // Python 3 / 1.65
export const BASE_PANEL_WIDTH = 145; // Python 240 / 1.65
export const BASE_FRAME_WIDTH = 6;   // Python 10 / 1.65

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
// Фиксированные ms/cell как в Python (НЕ зависят от размера плитки в браузере)
// Python при BASE_TILE_SIZE=64: cellSize=67, speed в px/frame
// msPerCell = 67 / (speed * 60) * 1000
// ============================================
export const SPEED_PRESETS = {
  slow: { name: 'Медленно', msPerCell: 558 },      // 67/(2*60)*1000
  normal: { name: 'Нормально', msPerCell: 372 },   // 67/(3*60)*1000
  fast: { name: 'Быстро', msPerCell: 223 },        // 67/(5*60)*1000
  very_fast: { name: 'Очень быстро', msPerCell: 140 }, // 67/(8*60)*1000
} as const;

export type SpeedPreset = keyof typeof SPEED_PRESETS;
export const SPEED_ORDER: SpeedPreset[] = ['slow', 'normal', 'fast', 'very_fast'];

// ============================================
// ФУНКЦИИ РАСЧЁТА
// ============================================

// Функция масштабирования как в Python
function scaled(value: number, scale: number): number {
  return Math.max(1, Math.round(value * scale));
}

// Получить ms на ячейку - ФИКСИРОВАННЫЕ значения из Python
// Визуальная скорость должна быть одинаковой независимо от размера плитки
export function getMsPerCell(speedPreset: SpeedPreset): number {
  return SPEED_PRESETS[speedPreset].msPerCell;
}

// Получить масштабированные значения
export function getScaledValues(sizePreset: SizePreset) {
  const scale = SIZE_PRESETS[sizePreset].scale;
  const tileSize = scaled(BASE_TILE_SIZE, scale);
  return {
    tileSize,
    gap: scaled(BASE_GAP, scale),
    panelWidth: scaled(BASE_PANEL_WIDTH, scale),
    frameWidth: scaled(BASE_FRAME_WIDTH, scale),
    // Тень плитки: пропорционально размеру (как в Python tile.py)
    bevel: Math.max(2, Math.round(tileSize * 3 / 64)),
    // Масштаб для элементов панели
    scale,
  };
}

// Рассчитать размер поля
export function getBoardDimensions(sizePreset: SizePreset) {
  const values = getScaledValues(sizePreset);
  const { tileSize, gap } = values;
  const boardSize = 10;
  // Формула из Python: (boardSize + 1) * gap + boardSize * tileSize
  const tileAreaSize = (boardSize + 1) * gap + boardSize * tileSize;
  return {
    ...values,
    tileAreaSize,
  };
}

// Настройки по умолчанию
export const DEFAULT_SIZE: SizePreset = 'medium';
export const DEFAULT_SPEED: SpeedPreset = 'normal';
