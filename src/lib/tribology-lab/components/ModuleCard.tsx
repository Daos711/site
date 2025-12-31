'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, MODULE_UNLOCK_WAVES, ModuleType } from '../types';
import { ModuleIcon, NichePattern } from './ModuleIcons';

interface ModuleCardProps {
  type: ModuleType;
  level?: number;
  selected?: boolean;
  showDetails?: boolean;
  compact?: boolean;  // Компактный режим для магазина
  onClick?: () => void;
  className?: string;
  // Для магазина
  canAfford?: boolean;
  isDragging?: boolean;
  onMouseDown?: (e: React.MouseEvent) => void;
  onTouchStart?: (e: React.TouchEvent) => void;
}

export function ModuleCard({
  type,
  level = 1,
  selected = false,
  showDetails = true,
  compact = false,
  onClick,
  className = '',
  canAfford = true,
  isDragging = false,
  onMouseDown,
  onTouchStart,
}: ModuleCardProps) {
  const config = MODULES[type];
  const code = MODULE_CODES[type];
  const palette = MODULE_PALETTE[type];
  const unlockWave = MODULE_UNLOCK_WAVES[type];

  return (
    <div
      className={`module-card ${selected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''} ${isDragging ? 'dragging' : ''} ${compact ? 'compact' : ''} ${className}`}
      onClick={onClick}
      onMouseDown={canAfford ? onMouseDown : undefined}
      onTouchStart={canAfford ? onTouchStart : undefined}
      style={{
        '--module-accent': palette.light,
        '--module-glow': palette.glow,
        '--module-dark': palette.dark,
      } as React.CSSProperties}
    >
      {/* Текстура — диагональная насечка */}
      <div className="card-texture" />

      {/* Заклёпки по углам */}
      <div className="rivet top-left" />
      <div className="rivet top-right" />
      {!compact && <div className="rivet bottom-left" />}
      {!compact && <div className="rivet bottom-right" />}

      {/* Шапка — только в полном режиме */}
      {!compact && (
        <>
          <div className="card-header">
            <div className="card-title">
              <span className="module-name">{config.name}</span>
              <span className="module-code">{code}</span>
            </div>
            {unlockWave > 1 && (
              <span className="wave-badge">Волна {unlockWave}+</span>
            )}
          </div>
          <p className="card-description">{config.description}</p>
        </>
      )}

      {/* Код модуля — только в compact */}
      {compact && <div className="compact-code">{code}</div>}

      {/* Ниша с иконкой */}
      <div className="icon-niche">
        <NichePattern type={type} />
        <div className="icon-container">
          <ModuleIcon type={type} />
        </div>
        <div className="niche-glare" />
        {level > 1 && (
          <div className="level-badge">Lv.{level}</div>
        )}
      </div>

      {/* Цена */}
      <div className="price-badge" style={{ borderColor: canAfford ? palette.light : '#5A6A7A' }}>
        <span className="coin-icon">●</span>
        <span className="price-value">{config.basePrice}</span>
      </div>

      {showDetails && !compact && (
        <>
          {/* Характеристики */}
          <div className="stats-row">
            <div className="stat-block">
              <span className="stat-label">Урон</span>
              <span className="stat-value">{config.baseDamage}</span>
            </div>
            <div className="stat-block">
              <span className="stat-label">Радиус</span>
              <span className="stat-value">{config.range}</span>
            </div>
            <div className="stat-block">
              <span className="stat-label">Атак/с</span>
              <span className="stat-value">{config.attackSpeed}</span>
            </div>
          </div>

          {/* Теги эффектов */}
          <div className="effect-tags">
            <span className="tag tag-type">{getAttackTypeName(config.attackType)}</span>

            {config.effectType && (
              <span className="tag tag-effect">
                {getEffectIcon(config.effectType)} {config.effectStrength}
                {config.effectType === 'slow' ? '%' : ' HP/с'}
              </span>
            )}

            {config.aoeRadius && (
              <span className="tag tag-effect">AOE {config.aoeRadius}px</span>
            )}

            {config.tagBonuses && Object.entries(config.tagBonuses).map(([tag, mult]) => (
              <span key={tag} className="tag tag-bonus">
                +{Math.round((mult - 1) * 100)}% {getTagIcon(tag)}
              </span>
            ))}

            {config.tagPenalties && Object.entries(config.tagPenalties).map(([tag, mult]) => (
              <span key={tag} className="tag tag-penalty">
                {Math.round((mult - 1) * 100)}% {getTagIcon(tag)}
              </span>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .module-card {
          position: relative;
          background: linear-gradient(135deg, #1A2430 0%, #121820 100%);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 16px;
          overflow: hidden;
          cursor: ${onMouseDown ? 'grab' : onClick ? 'pointer' : 'default'};
          transition: all 0.2s ease;
          box-shadow:
            0 4px 12px rgba(0,0,0,0.4),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        .module-card:hover:not(.disabled) {
          box-shadow:
            0 8px 24px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.08),
            0 0 0 1px var(--module-accent),
            0 0 15px var(--module-glow);
        }

        .module-card.selected {
          box-shadow:
            0 8px 24px rgba(0,0,0,0.5),
            0 0 20px var(--module-glow),
            0 0 0 2px var(--module-accent);
        }

        .module-card.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          filter: grayscale(30%);
        }

        .module-card.dragging {
          opacity: 0.7;
          transform: scale(1.05);
          cursor: grabbing;
          z-index: 100;
        }

        /* ═══════════════════════════════════════════════════════════════
           Компактный режим для магазина (как ShopCard)
           ═══════════════════════════════════════════════════════════════ */
        .module-card.compact {
          width: 80px;
          height: 100px;
          padding: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .module-card.compact .icon-niche {
          width: 52px;
          height: 52px;
          margin: 0;
          border-radius: 8px;
        }

        .module-card.compact .icon-container {
          width: 32px;
          height: 32px;
        }

        .module-card.compact .price-badge {
          padding: 2px 8px;
          margin-top: 4px;
          margin-bottom: 0;
          border-radius: 3px;
        }

        .module-card.compact .price-value {
          font-size: 12px;
        }

        .module-card.compact .coin-icon {
          font-size: 10px;
        }

        .compact-code {
          font-size: 8px;
          color: #5A6A7A;
          font-family: monospace;
          margin-bottom: 4px;
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
          width: 6px;
          height: 6px;
          background: radial-gradient(circle at 30% 30%, #4A5568 0%, #2D3748 100%);
          border-radius: 50%;
          box-shadow:
            inset 0 1px 2px rgba(0,0,0,0.5),
            0 1px 0 rgba(255,255,255,0.1);
        }
        .rivet.top-left { top: 8px; left: 8px; }
        .rivet.top-right { top: 8px; right: 8px; }
        .rivet.bottom-left { bottom: 8px; left: 8px; }
        .rivet.bottom-right { bottom: 8px; right: 8px; }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .card-title {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .module-name {
          font-size: 16px;
          font-weight: 600;
          color: #E6EEF8;
        }

        .module-code {
          font-size: 10px;
          color: #5A6A7A;
          font-family: monospace;
        }

        .wave-badge {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(106, 76, 255, 0.2);
          border: 1px solid rgba(106, 76, 255, 0.4);
          border-radius: 3px;
          color: #a78bfa;
        }

        .card-description {
          font-size: 12px;
          color: #9DB0C6;
          margin: 0 0 12px 0;
        }

        .icon-niche {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 12px;
          background: #0D1218;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            inset 0 2px 8px rgba(0,0,0,0.6),
            inset 0 0 0 1px rgba(255,255,255,0.05),
            0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .icon-container {
          position: relative;
          z-index: 2;
          width: 48px;
          height: 48px;
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

        .level-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 5px;
          background: var(--module-dark);
          border: 1px solid var(--module-accent);
          border-radius: 3px;
          color: var(--module-accent);
          z-index: 4;
        }

        .price-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(0,0,0,0.3);
          border: 1px solid;
          border-radius: 4px;
          margin-bottom: 12px;
        }

        .coin-icon {
          color: #fbbf24;
          font-size: 12px;
        }

        .price-value {
          font-size: 16px;
          font-weight: 700;
          color: #E6EEF8;
        }

        .stats-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 12px;
        }

        .stat-block {
          flex: 1;
          text-align: center;
          padding: 8px 4px;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.05);
        }

        .stat-label {
          display: block;
          font-size: 10px;
          color: #5A6A7A;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #E6EEF8;
          margin-top: 2px;
        }

        .effect-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 3px;
          background: rgba(0,0,0,0.3);
          border-left: 2px solid;
        }

        .tag-type { border-color: #5A6A7A; color: #9DB0C6; }
        .tag-bonus { border-color: #3CC7B5; color: #3CC7B5; }
        .tag-penalty { border-color: #C08A2A; color: #C08A2A; }
        .tag-effect { border-color: #4CB6D6; color: #4CB6D6; }
      `}</style>
    </div>
  );
}

// Вспомогательные функции
function getAttackTypeName(type?: string): string {
  switch (type) {
    case 'beam': return 'Луч';
    case 'projectile': return 'Снаряд';
    case 'wave': return 'Волна';
    case 'aoe': return 'Область';
    default: return 'Обычный';
  }
}

function getEffectIcon(type: string): string {
  switch (type) {
    case 'slow': return '❄';
    case 'burn': return '🔥';
    default: return '✧';
  }
}

function getTagIcon(tag: string): string {
  switch (tag) {
    case 'metal': return '⚙';
    case 'hot': return '🔥';
    case 'dusty': return '💨';
    case 'wet': return '💧';
    case 'organic': return '🌿';
    default: return tag;
  }
}

export default ModuleCard;
