'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, MODULE_UNLOCK_WAVES, ModuleType } from '../types';

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

// SVG иконки модулей
function ModuleIcon({ type }: { type: ModuleType }) {
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
