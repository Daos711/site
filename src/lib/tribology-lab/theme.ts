// Tribology Lab Theme — Цветовая палитра и токены дизайна
// "Lab-dark" стиль с синими/cyan акцентами

export const THEME = {
  // Фоны
  bgBase: '#0B0F14',           // Основной тёмный фон
  bgPanel: '#111824',          // Фон панелей
  bgPanelAlpha: 'rgba(17,24,36,0.85)', // Полупрозрачный фон панелей

  // Текст
  textPrimary: '#E6EDF5',      // Основной текст
  textSecondary: 'rgba(230,237,245,0.75)', // Вторичный текст
  textMuted: 'rgba(230,237,245,0.5)',      // Приглушённый текст

  // Акценты
  accent: '#32D6FF',           // Основной cyan акцент
  accentGreen: '#2EE6C8',      // Зелёный/teal акцент
  warn: '#FFB020',             // Предупреждение (жёлтый)
  danger: '#FF3B4D',           // Опасность (красный)

  // Линии и границы
  line: 'rgba(120,180,255,0.10)',  // Тонкие линии сетки
  border: '#223044',              // Границы панелей

  // Размеры
  padX: 20,                    // Горизонтальный padding
  radiusPanel: 20,             // Радиус скругления панелей
  btnStart: 176,               // Ширина главной кнопки
  touch: 48,                   // Минимальная зона касания

  // Тени
  shadowPanel: '0 4px 24px rgba(0,0,0,0.4)',
  shadowButton: '0 0 20px rgba(50,214,255,0.3)',

  // Анимации
  transitionFast: '0.15s ease-out',
  transitionMedium: '0.3s ease-out',
  transitionSlow: '0.5s ease-out',
} as const;

// Типы для TypeScript
export type ThemeColors = typeof THEME;
