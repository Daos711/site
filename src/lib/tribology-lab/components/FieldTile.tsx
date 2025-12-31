'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, ModuleType } from '../types';

interface FieldTileProps {
  type: ModuleType;
  level: number;
  size?: number;
  isDragging?: boolean;
  isLubricated?: boolean;  // Есть ли бафф от смазки рядом
  corrosionStacks?: number;  // 0, 1, 2, или 3
}

export function FieldTile({
  type,
  level,
  size = 110,
  isDragging = false,
  isLubricated = false,
  corrosionStacks = 0,
}: FieldTileProps) {
  const config = MODULES[type];
  const code = MODULE_CODES[type];
  const palette = MODULE_PALETTE[type];

  return (
    <div
      className={`field-tile ${isDragging ? 'dragging' : ''} ${corrosionStacks > 0 && type !== 'filter' ? 'has-corrosion' : ''}`}
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

      {/* ═══════════════════════════════════════════════════════════════
          TopBar — код и уровень
          ═══════════════════════════════════════════════════════════════ */}
      <div className="module-code">{code}</div>
      <div className="level-badge">Lv.{level}</div>

      {/* ═══════════════════════════════════════════════════════════════
          LeftRail — статусы (🦠, 🛡️)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="left-rail">
        {corrosionStacks > 0 && type !== 'filter' && (
          <div className="status-item corrosion">
            <span className="status-icon">🦠</span>
            <span className="status-count">{corrosionStacks}</span>
          </div>
        )}
        {corrosionStacks > 0 && type === 'filter' && (
          <div className="status-item immune">
            <span className="status-icon">🛡️</span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          IconWell — центральная иконка (защищённая зона!)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="icon-niche">
        <NichePattern type={type} />
        <div className="icon-container">
          <ModuleIcon type={type} />
        </div>
        <div className="niche-glare" />
      </div>

      {/* Рамка коррозии по всему контуру карточки */}
      {corrosionStacks > 0 && type !== 'filter' && (
        <div className="corrosion-border" />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          RightRail — атрибуты (💧)
          ═══════════════════════════════════════════════════════════════ */}
      {isLubricated && (
        <div className="right-rail">
          <div className="attribute-item lubed">💧</div>
        </div>
      )}

      {/* Глянец от смазки */}
      {isLubricated && <div className="lubricant-sheen" />}

      {/* ═══════════════════════════════════════════════════════════════
          BottomBar — название
          ═══════════════════════════════════════════════════════════════ */}
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
          left: 16px;
          font-size: 9px;
          color: #5A6A7A;
          font-family: monospace;
          z-index: 15;
        }

        .level-badge {
          position: absolute;
          top: 4px;
          right: 16px;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 4px;
          background: var(--module-dark);
          border: 1px solid var(--module-accent);
          border-radius: 3px;
          color: var(--module-accent);
          z-index: 15;
        }

        /* ═══════════════════════════════════════════════════════════════
           LeftRail — статусы слева от иконки
           ═══════════════════════════════════════════════════════════════ */
        .left-rail {
          position: absolute;
          left: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 15;
        }

        .status-item {
          position: relative;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        .status-item.corrosion {
          background: rgba(74, 124, 89, 0.3);
          border: 1px solid rgba(74, 124, 89, 0.6);
        }

        .status-item.immune {
          background: rgba(251, 191, 36, 0.3);
          border: 1px solid rgba(251, 191, 36, 0.6);
        }

        .status-item .status-icon {
          font-size: 11px;
          line-height: 1;
        }

        .status-item .status-count {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 12px;
          height: 12px;
          background: #4a7c59;
          border-radius: 6px;
          font-size: 8px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 2px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.5);
        }

        /* ═══════════════════════════════════════════════════════════════
           RightRail — атрибуты справа от иконки
           ═══════════════════════════════════════════════════════════════ */
        .right-rail {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          z-index: 15;
        }

        .attribute-item {
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          font-size: 11px;
        }

        .attribute-item.lubed {
          background: rgba(136, 69, 199, 0.3);
          border: 1px solid rgba(136, 69, 199, 0.5);
        }

        /* ═══════════════════════════════════════════════════════════════
           Рамка коррозии по всему контуру карточки
           ═══════════════════════════════════════════════════════════════ */
        .corrosion-border {
          position: absolute;
          inset: 0;
          border: 2px solid rgba(74, 180, 100, 0.7);
          border-radius: 12px;
          pointer-events: none;
          z-index: 20;
          box-shadow:
            inset 0 0 8px rgba(74, 180, 100, 0.3),
            0 0 6px rgba(74, 180, 100, 0.4);
        }

        /* ═══════════════════════════════════════════════════════════════
           IconWell — центральная зона (защищённая!)
           ═══════════════════════════════════════════════════════════════ */
        .icon-niche {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: ${size * 0.52}px;
          height: ${size * 0.52}px;
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

        .lubricant-sheen {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            transparent 30%,
            rgba(136, 69, 199, 0.15) 45%,
            rgba(136, 69, 199, 0.25) 50%,
            rgba(136, 69, 199, 0.15) 55%,
            transparent 70%
          );
          pointer-events: none;
          border-radius: 12px;
          animation: sheen-move 3s ease-in-out infinite;
          z-index: 10;
        }

        @keyframes sheen-move {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
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
        {/* Красный полюс с обводкой */}
        <rect x="6" y="3" width="8" height="6" rx="1.5" fill="#dc2626"
              stroke={palette.light} strokeWidth="1" opacity="0.9" />
        {/* Синий полюс с обводкой */}
        <rect x="26" y="3" width="8" height="6" rx="1.5" fill="#3b82f6"
              stroke={palette.light} strokeWidth="1" opacity="0.9" />
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
        <line x1="12" y1="14" x2="28" y2="14" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="11" y1="19" x2="29" y2="19" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="12" y1="24" x2="28" y2="24" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <line x1="14" y1="29" x2="26" y2="29" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
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
    inhibitor: (
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M20 4 L32 9 L32 22 Q32 32 20 36 Q8 32 8 22 L8 9 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <path
          d="M20 10 Q26 18 26 23 Q26 30 20 30 Q14 30 14 23 Q14 18 20 10 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <path
          d="M14 23 Q14.5 16 20 13"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M26 23 Q25.5 16 20 13"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <ellipse cx="17.2" cy="22" rx="2.2" ry="3.6" fill="rgba(255,255,255,0.2)" />
      </svg>
    ),
    demulsifier: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect
          x="9" y="6" width="22" height="28" rx="3"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <line
          x1="11" y1="21" x2="29" y2="21"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M13 21 L15.5 18.8 L18 22 L20.5 19.2 L23 22.4 L25.5 20.5 L27 21"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="15.5" cy="14.5" r="2" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
        <circle cx="24.5" cy="27" r="2" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" opacity="0.35" />
      </svg>
    ),
    analyzer: (
      <svg viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        <line x1="20" y1="6" x2="20" y2="12" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="20" y1="28" x2="20" y2="34" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="6" y1="20" x2="12" y2="20" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <line x1="28" y1="20" x2="34" y2="20" stroke={palette.light} strokeWidth="3" strokeLinecap="round" />
        <circle cx="20" cy="20" r="3" fill={palette.light} />
        <path
          d="M27 8 H34 V15 L30 19 L27 16 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <circle cx="29.2" cy="12" r="1.3" fill={palette.light} />
      </svg>
    ),
    centrifuge: (
      <svg viewBox="0 0 40 40" fill="none">
        {/* Камера */}
        <circle cx="20" cy="20" r="14" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        {/* Ступица */}
        <circle cx="20" cy="20" r="4" fill={palette.dark} stroke={palette.light} strokeWidth="2" />
        {/* Лопасть 1 (вверх) */}
        <path
          d="M20 10 Q26 13 25 19 Q24.5 21 22.5 20 Q21 19.2 20 18 Q19 19.2 17.5 20 Q15.5 21 15 19 Q14 13 20 10 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Лопасть 2 (120°) */}
        <g transform="rotate(120 20 20)">
          <path
            d="M20 10 Q26 13 25 19 Q24.5 21 22.5 20 Q21 19.2 20 18 Q19 19.2 17.5 20 Q15.5 21 15 19 Q14 13 20 10 Z"
            fill={palette.dark}
            stroke={palette.light}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
        {/* Лопасть 3 (240°) */}
        <g transform="rotate(240 20 20)">
          <path
            d="M20 10 Q26 13 25 19 Q24.5 21 22.5 20 Q21 19.2 20 18 Q19 19.2 17.5 20 Q15.5 21 15 19 Q14 13 20 10 Z"
            fill={palette.dark}
            stroke={palette.light}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </g>
        {/* Дуга вращения */}
        <path
          d="M29 14 A11 11 0 0 1 30 22"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M30 22 L28.8 20.9 M30 22 L28.5 21.7"
          stroke={palette.light}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Стрелка отката */}
        <line x1="25" y1="28" x2="15" y2="28" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        <path d="M15 28 L17.2 26.8 M15 28 L17.2 29.2" stroke={palette.light} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      </svg>
    ),
    electrostatic: (
      <svg viewBox="0 0 40 40" fill="none">
        {/* Центральная молния — более выраженная */}
        <path
          d="M22 4 L16 17 H21 L14 36 L26 19 H21 L26 4 Z"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* 4 узла-цели по углам */}
        <circle cx="6" cy="8" r="3" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="34" cy="8" r="3" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="6" cy="32" r="3" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="34" cy="32" r="3" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        {/* Связи от молнии к узлам */}
        <line x1="16" y1="10" x2="9" y2="8" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="24" y1="10" x2="31" y2="8" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        <line x1="16" y1="28" x2="9" y2="32" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
        <line x1="22" y1="28" x2="31" y2="32" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      </svg>
    ),
    barrier: (
      <svg viewBox="0 0 40 40" fill="none">
        <rect
          x="7" y="9" width="26" height="22" rx="3"
          fill={palette.dark}
          stroke={palette.light}
          strokeWidth="2"
        />
        <rect x="11" y="13" width="18" height="5" rx="1.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <rect x="11" y="22" width="18" height="5" rx="1.5" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" />
        <circle cx="20" cy="20" r="2.8" fill={palette.light} />
        <line x1="31" y1="13" x2="31" y2="27" stroke={palette.light} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        <circle cx="31" cy="20" r="1.6" fill={palette.dark} stroke={palette.light} strokeWidth="1.5" opacity="0.6" />
      </svg>
    ),
  };

  return <>{icons[type]}</>;
}

export default FieldTile;
