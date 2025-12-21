// Настройки игры "Цифры"
// Значения подобраны для визуального соответствия Python-версии
// (CSS-пиксели ~1.65x больше Pygame-пикселей на типичном экране)

// ============================================
// БАЗОВЫЕ РАЗМЕРЫ (при scale = 1.0)
// Подобраны для визуального соответствия Python-версии
// ============================================
export const BASE_TILE_SIZE = 41;
export const BASE_GAP = 2;
export const BASE_PANEL_WIDTH = 200;  // Увеличено чтобы кнопки помещались
export const BASE_FRAME_WIDTH = 6;

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
// msPerCell уменьшены для визуального соответствия Python
// ============================================
export const SPEED_PRESETS = {
  slow: { name: 'Медленно', msPerCell: 150 },
  normal: { name: 'Нормально', msPerCell: 100 },
  fast: { name: 'Быстро', msPerCell: 60 },
  very_fast: { name: 'Очень быстро', msPerCell: 35 },
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
    // Тень плитки: 4.7% от размера плитки (как в Python: max(2, round(tileSize * 3/64)))
    bevel: Math.max(2, Math.round(tileSize * 0.047)),
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
