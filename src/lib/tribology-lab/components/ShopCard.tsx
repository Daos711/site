'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, ModuleType } from '../types';

interface ShopCardProps {
  type: ModuleType;
  canAfford: boolean;
  isDragging?: boolean;
  size?: number;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

export function ShopCard({
  type,
  canAfford,
  isDragging = false,
  size = 80,
  onMouseDown,
  onTouchStart,
}: ShopCardProps) {
  const config = MODULES[type];
  const code = MODULE_CODES[type];
  const palette = MODULE_PALETTE[type];

  return (
    <div
      className={`
        shop-card
        ${!canAfford ? 'disabled' : ''}
        ${isDragging ? 'dragging' : ''}
      `}
      style={{
        '--module-accent': palette.light,
        '--module-glow': palette.glow,
        '--module-dark': palette.dark,
        width: size,
        height: size + 20,
      } as React.CSSProperties}
      onMouseDown={canAfford ? onMouseDown : undefined}
      onTouchStart={canAfford ? onTouchStart : undefined}
    >
      {/* Текстура */}
      <div className="card-texture" />

      {/* Заклёпки */}
      <div className="rivet top-left" />
      <div className="rivet top-right" />

      {/* Код модуля */}
      <div className="module-code">{code}</div>

      {/* Иконка */}
      <div className="icon-niche">
        <NichePattern type={type} />
        <div className="icon-container">
          <ModuleIcon type={type} />
        </div>
        <div className="niche-glare" />
      </div>

      {/* Цена */}
      <div className="price-row" style={{ borderColor: canAfford ? palette.light : '#5A6A7A' }}>
        <span className="coin">●</span>
        <span className="price">{config.basePrice}</span>
      </div>

      <style jsx>{`
        .shop-card {
          position: relative;
          background: linear-gradient(135deg, #1A2430 0%, #121820 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 6px;
          overflow: hidden;
          cursor: grab;
          transition: all 0.15s ease;
          box-shadow:
            0 4px 12px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .shop-card:hover:not(.disabled) {
          transform: scale(1.05);
          box-shadow:
            0 8px 20px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px var(--module-accent),
            0 0 15px var(--module-glow);
        }

        .shop-card:active:not(.disabled) {
          cursor: grabbing;
        }

        .shop-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .shop-card.dragging {
          opacity: 0.3;
        }

        .card-texture {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.1) 2px,
            rgba(255,255,255,0.1) 4px
          );
          pointer-events: none;
        }

        .rivet {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle at 30% 30%, #4A5568 0%, #2D3748 100%);
          border-radius: 50%;
          box-shadow:
            inset 0 1px 1px rgba(0,0,0,0.5),
            0 1px 0 rgba(255,255,255,0.1);
        }
        .rivet.top-left { top: 5px; left: 5px; }
        .rivet.top-right { top: 5px; right: 5px; }

        .module-code {
          font-size: 8px;
          color: #5A6A7A;
          font-family: monospace;
          margin-bottom: 4px;
        }

        .icon-niche {
          position: relative;
          width: ${size * 0.65}px;
          height: ${size * 0.65}px;
          background: #0D1218;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 2px 6px rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,255,255,0.05),
            0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .icon-container {
          position: relative;
          z-index: 2;
          width: ${size * 0.4}px;
          height: ${size * 0.4}px;
        }

        .niche-glare {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(
            180deg,
            rgba(255,255,255,0.08) 0%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 3;
        }

        .price-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          margin-top: 4px;
          padding: 2px 8px;
          background: rgba(0,0,0,0.3);
          border: 1px solid;
          border-radius: 3px;
        }

        .coin {
          color: #fbbf24;
          font-size: 10px;
        }

        .price {
          font-size: 12px;
          font-weight: 600;
          color: #E6EEF8;
        }

        .shop-card.disabled .price {
          color: #ef4444;
        }
      `}</style>
    </div>
  );
}

// Паттерны для ниши иконок (компактная версия)
function NichePattern({ type }: { type: ModuleType }) {
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
          radial-gradient(circle at 90% 90%, ${palette.glow} 0%, transparent 30%)
        `,
      }} />
    ),
    filter: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(192, 138, 42, 0.1) 3px, rgba(192, 138, 42, 0.1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(192, 138, 42, 0.1) 3px, rgba(192, 138, 42, 0.1) 4px)
        `,
      }} />
    ),
    lubricant: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 30% 70%, ${palette.glow} 0%, transparent 60%)`,
      }} />
    ),
    ultrasonic: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at center, transparent 30%, rgba(60, 199, 181, 0.1) 35%, transparent 40%),
          radial-gradient(circle at center, transparent 55%, rgba(60, 199, 181, 0.08) 60%, transparent 65%)
        `,
      }} />
    ),
    laser: (
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(90deg, transparent 45%, ${palette.glow} 48%, ${palette.glow} 52%, transparent 55%)`,
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

// Компактные SVG иконки модулей
function ModuleIcon({ type }: { type: ModuleType }) {
  const palette = MODULE_PALETTE[type];

  const icons: Record<ModuleType, React.ReactNode> = {
    magnet: (
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M8 6 L8 20 Q8 26 16 26 Q24 26 24 20 L24 6"
          stroke={palette.light}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="5" y="3" width="6" height="5" rx="1" fill="#dc2626" />
        <rect x="21" y="3" width="6" height="5" rx="1" fill="#3b82f6" />
      </svg>
    ),
    cooler: (
      <svg viewBox="0 0 32 32" fill="none">
        <line x1="16" y1="4" x2="16" y2="28" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="4" y1="16" x2="28" y2="16" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="8" y1="8" x2="24" y2="24" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="24" y1="8" x2="8" y2="24" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="3" fill="#0D1218" stroke={palette.light} strokeWidth="1.5" />
      </svg>
    ),
    filter: (
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3 L26 7 L26 17 Q26 25 16 29 Q6 25 6 17 L6 7 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
        />
        <line x1="10" y1="11" x2="22" y2="11" stroke={palette.light} strokeWidth="1" opacity="0.6" />
        <line x1="9" y1="15" x2="23" y2="15" stroke={palette.light} strokeWidth="1" opacity="0.6" />
        <line x1="10" y1="19" x2="22" y2="19" stroke={palette.light} strokeWidth="1" opacity="0.6" />
      </svg>
    ),
    lubricant: (
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M16 4 Q24 14 24 20 Q24 28 16 28 Q8 28 8 20 Q8 14 16 4 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
        />
        <ellipse cx="12" cy="18" rx="2.5" ry="4" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    ultrasonic: (
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="16" cy="16" r="2" fill={palette.light} />
        <circle cx="16" cy="16" r="9" fill="none" stroke={palette.light} strokeWidth="1" opacity="0.6" />
        <circle cx="16" cy="16" r="13" fill="none" stroke={palette.light} strokeWidth="1" opacity="0.3" />
      </svg>
    ),
    laser: (
      <svg viewBox="0 0 32 32" fill="none">
        <rect x="5" y="12" width="16" height="8" rx="1.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <ellipse cx="24" cy="16" rx="3" ry="4" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <line x1="27" y1="16" x2="32" y2="16" stroke={palette.light} strokeWidth="2" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
        </line>
      </svg>
    ),
    inhibitor: (
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M16 3 L26 7 L26 17 Q26 25 16 29 Q6 25 6 17 L6 7 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
        />
        <path
          d="M16 8 Q21 14 21 18 Q21 24 16 24 Q11 24 11 18 Q11 14 16 8 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
        />
        <ellipse cx="14" cy="17" rx="1.8" ry="3" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    demulsifier: (
      <svg viewBox="0 0 32 32" fill="none">
        <rect x="7" y="4" width="18" height="24" rx="2.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <line x1="9" y1="17" x2="23" y2="17" stroke={palette.light} strokeWidth="1" opacity="0.6" />
        <path d="M10 17 L12.5 14.5 L15 18 L17.5 15.5 L20 18.5 L22 17" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="11" r="1.5" fill={palette.dark} stroke={palette.light} strokeWidth="1" opacity="0.6" />
        <circle cx="20" cy="22" r="1.5" fill={palette.dark} stroke={palette.light} strokeWidth="1" opacity="0.35" />
      </svg>
    ),
    analyzer: (
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <line x1="16" y1="5" x2="16" y2="10" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="22" x2="16" y2="27" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5" y1="16" x2="10" y2="16" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="16" x2="27" y2="16" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill={palette.light} />
        <path d="M22 6 H28 V12 L24 15.5 L22 13 Z" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="23.5" cy="9.5" r="1" fill={palette.light} />
      </svg>
    ),
    centrifuge: (
      <svg viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="11" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="16" cy="16" r="3" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <path d="M16 8 L19.5 14 L16 13 L12.5 14 Z" fill={palette.dark} stroke={palette.light} strokeWidth="1" />
        <path d="M23 19 L17 18.5 L18.5 22 L21 23.5 Z" fill={palette.dark} stroke={palette.light} strokeWidth="1" />
        <path d="M9 19 L11 23.5 L13.5 22 L15 18.5 Z" fill={palette.dark} stroke={palette.light} strokeWidth="1" />
        <line x1="21" y1="25" x2="11" y2="25" stroke={palette.light} strokeWidth="2" strokeLinecap="round" />
        <path d="M11 25 L13 23.5 M11 25 L13 26.5" stroke={palette.light} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    electrostatic: (
      <svg viewBox="0 0 32 32" fill="none">
        <path
          d="M16 5 L12 14 H16 L14 27 L20 16 H16 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="8" cy="10" r="1.8" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="24" cy="10" r="1.8" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="8" cy="22" r="1.8" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="24" cy="22" r="1.8" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <line x1="14" y1="14" x2="10" y2="11" stroke={palette.light} strokeWidth="1" opacity="0.6" />
        <line x1="18" y1="14" x2="22" y2="11" stroke={palette.light} strokeWidth="1" opacity="0.6" />
      </svg>
    ),
    barrier: (
      <svg viewBox="0 0 32 32" fill="none">
        <rect x="5" y="7" width="22" height="18" rx="2.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <rect x="9" y="10" width="14" height="4" rx="1" fill={palette.dark} stroke={palette.light} strokeWidth="1" />
        <rect x="9" y="18" width="14" height="4" rx="1" fill={palette.dark} stroke={palette.light} strokeWidth="1" />
        <circle cx="16" cy="16" r="2.2" fill={palette.light} />
      </svg>
    ),
  };

  return <>{icons[type]}</>;
}

export default ShopCard;
