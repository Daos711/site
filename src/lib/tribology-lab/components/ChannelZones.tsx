"use client";

import { useEffect, useState } from 'react';

// ==================== ТИПЫ ====================

interface StartZoneProps {
  cx: number;          // центр X (центр канала)
  cy: number;          // центр Y (нижний край канала)
  isSpawning?: boolean;
}

interface FinishZoneProps {
  cx: number;          // центр X (центр канала)
  cy: number;          // центр Y (нижний край канала)
  isDamaged?: boolean;
}

// ==================== START ZONE ====================
// Маленький вертикальный маркер слева внизу
// Стрелка показывает направление движения врагов (вверх ↑)

export function StartZone({ cx, cy, isSpawning = false }: StartZoneProps) {
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (isSpawning) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isSpawning]);

  // Стрелка указывает ВВЕРХ (куда идут враги)
  // Размещаем ПОД каналом (y + смещение)
  const arrowY = cy + 8;

  return (
    <g className="start-zone">
      {/* Маленькая стрелка вверх ↑ */}
      <path
        d={`M ${cx} ${arrowY - 12} L ${cx - 6} ${arrowY} L ${cx + 6} ${arrowY} Z`}
        fill={flashActive ? '#7dd3fc' : '#32D6FF'}
        opacity={flashActive ? 1 : 0.7}
        style={{
          filter: flashActive
            ? 'drop-shadow(0 0 12px rgba(50, 214, 255, 0.9))'
            : 'drop-shadow(0 0 4px rgba(50, 214, 255, 0.5))',
        }}
      >
        <animate
          attributeName="opacity"
          values="0.5;0.8;0.5"
          dur="2s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
}

// ==================== FINISH ZONE ====================
// Маленький вертикальный маркер справа внизу
// Стрелка показывает направление выхода врагов (вниз ↓)

export function FinishZone({ cx, cy, isDamaged = false }: FinishZoneProps) {
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (isDamaged) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isDamaged]);

  // Стрелка указывает ВНИЗ (куда уходят враги)
  // Размещаем ПОД каналом (y + смещение)
  const arrowY = cy + 8;

  return (
    <g className="finish-zone">
      {/* Маленькая стрелка вниз ↓ */}
      <path
        d={`M ${cx} ${arrowY + 12} L ${cx - 6} ${arrowY} L ${cx + 6} ${arrowY} Z`}
        fill={flashActive ? '#FF3B4D' : '#FF6B35'}
        opacity={flashActive ? 1 : 0.7}
        style={{
          filter: flashActive
            ? 'drop-shadow(0 0 15px rgba(255, 59, 77, 1))'
            : 'drop-shadow(0 0 4px rgba(255, 107, 53, 0.6))',
        }}
      >
        <animate
          attributeName="opacity"
          values="0.5;0.9;0.5"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  );
}

// ==================== ГРАДИЕНТЫ ====================

export function ChannelZonesGradients() {
  return (
    <>
      {/* Пока не нужны, но оставим для совместимости */}
    </>
  );
}
