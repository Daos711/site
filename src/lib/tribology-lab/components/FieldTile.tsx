'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, ModuleType } from '../types';
import { ModuleIcon, NichePattern } from './ModuleIcons';

interface FieldTileProps {
  type: ModuleType;
  level: number;
  size?: number;
  isDragging?: boolean;
  isLubricated?: boolean;  // Есть ли бафф от смазки рядом
  isProtected?: boolean;   // Есть ли бафф от ингибитора рядом
  corrosionStacks?: number;  // 0, 1, 2, или 3
  hasNearbyCorrosion?: boolean;  // Есть ли коррозия рядом (для показа иммунитета)
}

export function FieldTile({
  type,
  level,
  size = 110,
  isDragging = false,
  isLubricated = false,
  isProtected = false,
  corrosionStacks = 0,
  hasNearbyCorrosion = false,
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
          LeftRail — статусы (🦠 коррозия, 🛡️✓ иммунитет)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="left-rail">
        {/* Коррозия — показывать только на НЕ иммунных модулях */}
        {corrosionStacks > 0 && type !== 'filter' && type !== 'inhibitor' && (
          <div className="status-item corrosion">
            <span className="status-icon">🦠</span>
            <span className="status-count">{corrosionStacks}</span>
          </div>
        )}
        {/* Иммунитет — показывать на Фильтре и Ингибиторе когда коррозия рядом */}
        {hasNearbyCorrosion && (type === 'filter' || type === 'inhibitor') && (
          <div className="status-item immune">
            {/* Щит с галочкой — иммунитет */}
            <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
              <path
                d="M7 1 L12 3 L12 7 Q12 11 7 13 Q2 11 2 7 L2 3 Z"
                fill="none"
                stroke="#E6EEF7"
                strokeWidth="1.5"
              />
              <path
                d="M4.5 7 L6 8.5 L9.5 5"
                stroke="#E6EEF7"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
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
          RightRail — атрибуты (баффы: 💧 смазка, 🛡️½ защита)
          Защита ½ НЕ показывается на иммунных модулях (filter, inhibitor)
          ═══════════════════════════════════════════════════════════════ */}
      {(isLubricated || (isProtected && type !== 'filter' && type !== 'inhibitor')) && (
        <div className="right-rail">
          {isLubricated && <div className="attribute-item lubed">💧</div>}
          {isProtected && type !== 'filter' && type !== 'inhibitor' && (
            <div className="attribute-item protected">
              {/* Щит с ½ — защита Ингибитора (только для НЕ иммунных) */}
              <svg viewBox="0 0 14 14" width="14" height="14" fill="none">
                <path
                  d="M7 1 L12 3 L12 7 Q12 11 7 13 Q2 11 2 7 L2 3 Z"
                  fill="none"
                  stroke="#C7B56A"
                  strokeWidth="1.5"
                />
                <text
                  x="7"
                  y="9"
                  textAnchor="middle"
                  fontSize="6"
                  fontWeight="bold"
                  fill="#C7B56A"
                >½</text>
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Убран lubricant-sheen по запросу */}

      {/* Аура ингибитора — пульсирующее кольцо защиты */}
      {type === 'inhibitor' && <div className="inhibitor-aura" />}

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

        .attribute-item.protected {
          background: rgba(199, 181, 106, 0.3);
          border: 1px solid rgba(199, 181, 106, 0.5);
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

        /* Аура ингибитора — пульсирующее защитное кольцо */
        .inhibitor-aura {
          position: absolute;
          width: 200%;
          height: 200%;
          left: -50%;
          top: -50%;
          border: 2px solid rgba(199, 181, 106, 0.25);
          border-radius: 50%;
          pointer-events: none;
          animation: inhibitor-pulse 2s ease-in-out infinite;
          z-index: 1;
        }

        @keyframes inhibitor-pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.35; }
        }

      `}</style>
    </div>
  );
}

export default FieldTile;
