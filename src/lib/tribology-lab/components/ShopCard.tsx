'use client';

import { MODULES, MODULE_CODES, MODULE_PALETTE, ModuleType } from '../types';
import { ModuleIcon, NichePattern } from './ModuleIcons';

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

export default ShopCard;
