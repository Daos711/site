'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, ModuleType } from '../types';

interface FieldTileProps {
  type: ModuleType;
  level: number;
  size?: number;
  isDragging?: boolean;
}

export function FieldTile({
  type,
  level,
  size = 110,
  isDragging = false,
}: FieldTileProps) {
  const config = MODULES[type];
  const code = MODULE_CODES[type];
  const palette = MODULE_PALETTE[type];

  return (
    <div
      className={`field-tile ${isDragging ? 'dragging' : ''}`}
      style={{
        '--module-accent': palette.light,
        '--module-glow': palette.glow,
        '--module-dark': palette.dark,
        width: size,
        height: size,
      } as React.CSSProperties}
    >
      {/* Текстура */}
      <div className="card-texture" />

      {/* Заклёпки */}
      <div className="rivet top-left" />
      <div className="rivet top-right" />
      <div className="rivet bottom-left" />
      <div className="rivet bottom-right" />

      {/* Код модуля */}
      <div className="module-code">{code}</div>

      {/* Уровень */}
      <div className="level-badge">Lv.{level}</div>

      {/* Иконка */}
      <div className="icon-niche">
        <NichePattern type={type} />
        <div className="icon-container">
          <ModuleIcon type={type} />
        </div>
        <div className="niche-glare" />
      </div>

      {/* Название */}
      <div className="module-name">{config.name}</div>

      <style jsx>{`
        .field-tile {
          position: relative;
          background: linear-gradient(135deg, #1A2430 0%, #121820 100%);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 4px 12px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.05),
            0 0 15px var(--module-glow);
        }

        .field-tile.dragging {
          opacity: 0.9;
          transform: scale(1.05);
          box-shadow:
            0 8px 24px rgba(0,0,0,0.5),
            0 0 25px var(--module-glow),
            0 0 0 2px var(--module-accent);
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
          width: 5px;
          height: 5px;
          background: radial-gradient(circle at 30% 30%, #4A5568 0%, #2D3748 100%);
          border-radius: 50%;
          box-shadow:
            inset 0 1px 1px rgba(0,0,0,0.5),
            0 1px 0 rgba(255,255,255,0.1);
        }
        .rivet.top-left { top: 6px; left: 6px; }
        .rivet.top-right { top: 6px; right: 6px; }
        .rivet.bottom-left { bottom: 6px; left: 6px; }
        .rivet.bottom-right { bottom: 6px; right: 6px; }

        .module-code {
          position: absolute;
          top: 6px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9px;
          color: #5A6A7A;
          font-family: monospace;
        }

        .level-badge {
          position: absolute;
          top: 6px;
          right: 16px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          background: var(--module-dark);
          border: 1px solid var(--module-accent);
          border-radius: 4px;
          color: var(--module-accent);
        }

        .icon-niche {
          position: relative;
          width: ${size * 0.55}px;
          height: ${size * 0.55}px;
          background: #0D1218;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 2px 6px rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,255,255,0.05),
            0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
          margin-top: 8px;
        }

        .icon-container {
          position: relative;
          z-index: 2;
          width: ${size * 0.38}px;
          height: ${size * 0.38}px;
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

        .module-name {
          position: absolute;
          bottom: 8px;
          font-size: 11px;
          font-weight: 500;
          color: #9DB0C6;
        }
      `}</style>
    </div>
  );
}

// Паттерны для ниши иконок
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
          repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(192, 138, 42, 0.12) 4px, rgba(192, 138, 42, 0.12) 5px),
          repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(192, 138, 42, 0.12) 4px, rgba(192, 138, 42, 0.12) 5px)
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
          radial-gradient(circle at center, transparent 25%, rgba(60, 199, 181, 0.12) 30%, transparent 35%),
          radial-gradient(circle at center, transparent 50%, rgba(60, 199, 181, 0.08) 55%, transparent 60%)
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
  };

  return <>{patterns[type]}</>;
}

// SVG иконки модулей
function ModuleIcon({ type }: { type: ModuleType }) {
  const palette = MODULE_PALETTE[type];

  const icons: Record<ModuleType, React.ReactNode> = {
    magnet: (
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M10 6 L10 24 Q10 32 20 32 Q30 32 30 24 L30 6"
          stroke={palette.light}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="6" y="3" width="8" height="6" rx="1.5" fill="#dc2626" />
        <rect x="26" y="3" width="8" height="6" rx="1.5" fill="#3b82f6" />
      </svg>
    ),
    cooler: (
      <svg viewBox="0 0 40 40" fill="none">
        <line x1="20" y1="4" x2="20" y2="36" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="4" y1="20" x2="36" y2="20" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="9" y1="9" x2="31" y2="31" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="31" y1="9" x2="9" y2="31" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="20" r="4" fill="#0D1218" stroke={palette.light} strokeWidth="2" />
      </svg>
    ),
    filter: (
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M20 4 L32 9 L32 22 Q32 32 20 36 Q8 32 8 22 L8 9 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <line x1="12" y1="14" x2="28" y2="14" stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <line x1="11" y1="19" x2="29" y2="19" stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <line x1="12" y1="24" x2="28" y2="24" stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <line x1="14" y1="29" x2="26" y2="29" stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
      </svg>
    ),
    lubricant: (
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M20 4 Q30 16 30 24 Q30 34 20 34 Q10 34 10 24 Q10 16 20 4 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <ellipse cx="15" cy="22" rx="3" ry="5" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    ultrasonic: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="6" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <circle cx="20" cy="20" r="2.5" fill={palette.light} />
        <circle cx="20" cy="20" r="11" fill="none" stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <circle cx="20" cy="20" r="16" fill="none" stroke={palette.light} strokeWidth="1.5" opacity="0.35" />
      </svg>
    ),
    laser: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect x="6" y="14" width="20" height="12" rx="2" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <ellipse cx="30" cy="20" rx="4" ry="5" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <line x1="34" y1="20" x2="40" y2="20" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round">
          <animate attributeName="opacity" values="1;0.5;1" dur="0.5s" repeatCount="indefinite" />
        </line>
        <circle cx="38" cy="20" r="2" fill={palette.light}>
          <animate attributeName="r" values="2;3;2" dur="0.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    ),
  };

  return <>{icons[type]}</>;
}

export default FieldTile;
