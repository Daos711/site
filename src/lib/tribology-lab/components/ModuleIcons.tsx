'use client';

import { MODULE_PALETTE, ModuleType } from '../types';

// ═══════════════════════════════════════════════════════════════════════════
// NichePattern — фоновый паттерн для ниши иконки
// ═══════════════════════════════════════════════════════════════════════════

export function NichePattern({ type }: { type: ModuleType }) {
  const palette = MODULE_PALETTE[type];

  const patterns: Record<ModuleType, React.ReactNode> = {
    magnet: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${palette.glow} 0%, transparent 70%)`,
      }} />
    ),
    cooler: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 10% 10%, ${palette.glow} 0%, transparent 30%),
          radial-gradient(circle at 90% 20%, rgba(76, 182, 214, 0.15) 0%, transparent 25%),
          radial-gradient(circle at 85% 85%, ${palette.glow} 0%, transparent 30%)
        `,
      }} />
    ),
    filter: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(192, 138, 42, 0.1) 4px, rgba(192, 138, 42, 0.1) 5px),
          repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(192, 138, 42, 0.1) 4px, rgba(192, 138, 42, 0.1) 5px)
        `,
      }} />
    ),
    lubricant: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(ellipse at 30% 70%, ${palette.glow} 0%, transparent 50%),
          radial-gradient(ellipse at 70% 40%, rgba(156, 106, 214, 0.15) 0%, transparent 40%)
        `,
      }} />
    ),
    ultrasonic: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at center, transparent 20%, rgba(60, 199, 181, 0.1) 25%, transparent 30%),
          radial-gradient(circle at center, transparent 40%, rgba(60, 199, 181, 0.08) 45%, transparent 50%),
          radial-gradient(circle at center, transparent 60%, rgba(60, 199, 181, 0.05) 65%, transparent 70%)
        `,
      }} />
    ),
    laser: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, transparent 48%, ${palette.glow} 49%, ${palette.glow} 51%, transparent 52%)`,
      }} />
    ),
    inhibitor: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, ${palette.glow} 0%, transparent 70%)`,
      }} />
    ),
    demulsifier: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, transparent 40%, ${palette.glow} 50%, transparent 60%)`,
      }} />
    ),
    analyzer: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at center, transparent 40%, ${palette.glow} 45%, transparent 50%),
          linear-gradient(0deg, transparent 48%, ${palette.glow} 50%, transparent 52%),
          linear-gradient(90deg, transparent 48%, ${palette.glow} 50%, transparent 52%)
        `,
      }} />
    ),
    centrifuge: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `conic-gradient(from 0deg, transparent, ${palette.glow} 30%, transparent 60%, ${palette.glow} 90%, transparent)`,
      }} />
    ),
    electrostatic: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 25% 25%, ${palette.glow} 0%, transparent 30%),
          radial-gradient(circle at 75% 75%, ${palette.glow} 0%, transparent 30%)
        `,
      }} />
    ),
    barrier: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, ${palette.glow} 0%, transparent 20%, transparent 80%, ${palette.glow} 100%)`,
      }} />
    ),
  };

  return <>{patterns[type]}</>;
}

// ═══════════════════════════════════════════════════════════════════════════
// ModuleIcon — SVG иконка модуля
// ═══════════════════════════════════════════════════════════════════════════

export function ModuleIcon({ type }: { type: ModuleType }) {
  const palette = MODULE_PALETTE[type];

  const icons: Record<ModuleType, React.ReactNode> = {
    magnet: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Магнит U-образный */}
        <path
          d="M12 8 L12 32 Q12 40 24 40 Q36 40 36 32 L36 8"
          stroke={palette.light}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Красный полюс с обводкой */}
        <rect x="8" y="4" width="10" height="8" rx="2" fill="#dc2626"
              stroke={palette.light} strokeWidth="1" opacity="0.9" />
        {/* Синий полюс с обводкой */}
        <rect x="30" y="4" width="10" height="8" rx="2" fill="#3b82f6"
              stroke={palette.light} strokeWidth="1" opacity="0.9" />
        {/* Силовые линии */}
        <path
          d="M24 28 Q16 24 16 18 M24 28 Q32 24 32 18"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.5"
        />
      </svg>
    ),
    cooler: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Снежинка */}
        <line x1="24" y1="4" x2="24" y2="44" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="4" y1="24" x2="44" y2="24" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="10" y1="10" x2="38" y2="38" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="38" y1="10" x2="10" y2="38" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        {/* Кристаллики */}
        <circle cx="24" cy="8" r="3" fill={palette.light} />
        <circle cx="24" cy="40" r="3" fill={palette.light} />
        <circle cx="8" cy="24" r="3" fill={palette.light} />
        <circle cx="40" cy="24" r="3" fill={palette.light} />
        {/* Центр */}
        <circle cx="24" cy="24" r="5" fill="#0D1218" stroke={palette.light} strokeWidth="2" />
      </svg>
    ),
    filter: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Щит */}
        <path
          d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        {/* Сетка */}
        <line x1="16" y1="16" x2="32" y2="16" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="14" y1="22" x2="34" y2="22" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="16" y1="28" x2="32" y2="28" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="18" y1="34" x2="30" y2="34" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        {/* Блик */}
        <path
          d="M14 12 Q24 8 34 12"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    lubricant: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Капля */}
        <path
          d="M24 6 Q36 20 36 30 Q36 42 24 42 Q12 42 12 30 Q12 20 24 6 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        {/* Блик капли */}
        <ellipse cx="18" cy="26" rx="4" ry="6" fill="rgba(255,255,255,0.2)" />
        {/* Волны внутри */}
        <path
          d="M16 32 Q20 30 24 32 Q28 34 32 32"
          fill="none"
          stroke={palette.light}
          strokeWidth="1.5"
          opacity="0.5"
        />
        <path
          d="M18 36 Q22 34 26 36 Q30 38 32 36"
          fill="none"
          stroke={palette.light}
          strokeWidth="1.5"
          opacity="0.3"
        />
      </svg>
    ),
    ultrasonic: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Центральный излучатель */}
        <circle cx="24" cy="24" r="8" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <circle cx="24" cy="24" r="3" fill={palette.light} />
        {/* Волны */}
        <circle cx="24" cy="24" r="14" fill="none" stroke={palette.light} strokeWidth="1.5" opacity="0.7" />
        <circle cx="24" cy="24" r="20" fill="none" stroke={palette.light} strokeWidth="1.5" opacity="0.4" />
        {/* Стрелки направления */}
        <path d="M24 4 L28 10 L20 10 Z" fill={palette.light} opacity="0.6" />
        <path d="M24 44 L28 38 L20 38 Z" fill={palette.light} opacity="0.6" />
        <path d="M4 24 L10 20 L10 28 Z" fill={palette.light} opacity="0.6" />
        <path d="M44 24 L38 20 L38 28 Z" fill={palette.light} opacity="0.6" />
      </svg>
    ),
    laser: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Корпус лазера */}
        <rect x="8" y="18" width="24" height="12" rx="2" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        {/* Линза */}
        <ellipse cx="36" cy="24" rx="4" ry="6" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        {/* Луч */}
        <line x1="40" y1="24" x2="48" y2="24" stroke={palette.light} strokeWidth="3" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
        </line>
        {/* Детали корпуса */}
        <rect x="12" y="20" width="4" height="2" rx="1" fill={palette.light} opacity="0.5" />
        <rect x="12" y="26" width="4" height="2" rx="1" fill={palette.light} opacity="0.5" />
        {/* Точка прицела */}
        <circle cx="44" cy="24" r="2" fill={palette.light}>
          <animate attributeName="r" values="2;3;2" dur="0.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
    inhibitor: (
      <svg viewBox="0 0 48 48" fill="none">
        <path d="M24 4 L40 10 L40 26 Q40 38 24 44 Q8 38 8 26 L8 10 Z" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <path d="M24 12 Q32 22 32 28 Q32 36 24 36 Q16 36 16 28 Q16 22 24 12 Z" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <ellipse cx="21" cy="26" rx="2.5" ry="4" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    demulsifier: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="10" y="6" width="28" height="36" rx="4" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <line x1="14" y1="25" x2="34" y2="25" stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <path d="M16 25 L19 22 L22 27 L25 23 L28 28 L31 25 L34 25" stroke={palette.light} strokeWidth="2" strokeLinecap="round" />
        <circle cx="18" cy="16" r="2.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <circle cx="30" cy="34" r="2.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" opacity="0.35" />
      </svg>
    ),
    analyzer: (
      <svg viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="16" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <line x1="24" y1="6" x2="24" y2="14" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="24" y1="34" x2="24" y2="42" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="6" y1="24" x2="14" y2="24" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="34" y1="24" x2="42" y2="24" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <circle cx="24" cy="24" r="4" fill={palette.light} />
        <path d="M33 8 H42 V17 L37 23 L33 19 Z" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <circle cx="36" cy="13" r="1.5" fill={palette.light} />
      </svg>
    ),
    centrifuge: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Камера */}
        <circle cx="24" cy="24" r="16" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        {/* Ступица */}
        <circle cx="24" cy="24" r="5" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        {/* Лопасть 1 (вверх) */}
        <path
          d="M24 12 Q31 16 30 23 Q29.5 25.5 27 24.5 Q25 23.5 24 22 Q23 23.5 21 24.5 Q18.5 25.5 18 23 Q17 16 24 12 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Лопасть 2 (120°) */}
        <g transform="rotate(120 24 24)">
          <path
            d="M24 12 Q31 16 30 23 Q29.5 25.5 27 24.5 Q25 23.5 24 22 Q23 23.5 21 24.5 Q18.5 25.5 18 23 Q17 16 24 12 Z"
            fill={palette.dark}
            stroke={palette.light}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
        {/* Лопасть 3 (240°) */}
        <g transform="rotate(240 24 24)">
          <path
            d="M24 12 Q31 16 30 23 Q29.5 25.5 27 24.5 Q25 23.5 24 22 Q23 23.5 21 24.5 Q18.5 25.5 18 23 Q17 16 24 12 Z"
            fill={palette.dark}
            stroke={palette.light}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
        {/* Дуга вращения */}
        <path
          d="M35 17 A13 13 0 0 1 36 26"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M36 26 L34.5 24.5 M36 26 L34.2 25.5"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Стрелка отката */}
        <line x1="30" y1="34" x2="18" y2="34" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <path d="M18 34 L20.5 32.5 M18 34 L20.5 35.5" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
    electrostatic: (
      <svg viewBox="0 0 48 48" fill="none">
        {/* Центральная молния — более выраженная */}
        <path
          d="M26 5 L19 20 H25 L17 43 L31 23 H25 L31 5 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* 4 узла-цели по углам */}
        <circle cx="7" cy="10" r="3.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="41" cy="10" r="3.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="7" cy="38" r="3.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="41" cy="38" r="3.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        {/* Связи от молнии к узлам */}
        <line x1="19" y1="12" x2="11" y2="10" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="29" y1="12" x2="37" y2="10" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="19" y1="34" x2="11" y2="38" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        <line x1="26" y1="34" x2="37" y2="38" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    ),
    barrier: (
      <svg viewBox="0 0 48 48" fill="none">
        <rect x="8" y="10" width="32" height="28" rx="4" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <rect x="14" y="15" width="20" height="7" rx="2" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <rect x="14" y="26" width="20" height="7" rx="2" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="24" cy="24" r="3.5" fill={palette.light} />
      </svg>
    ),
  };

  return <>{icons[type]}</>;
}
