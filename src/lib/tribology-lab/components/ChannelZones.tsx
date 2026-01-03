"use client";

import { useEffect, useState } from 'react';

// ==================== ТИПЫ ====================

interface StartZoneProps {
  x: number;           // позиция X (левый край)
  y: number;           // позиция Y (центр канала)
  width: number;       // ширина зоны
  isSpawning?: boolean;
}

interface FinishZoneProps {
  x: number;           // позиция X (левый край)
  y: number;           // позиция Y (центр канала)
  width: number;       // ширина зоны
  isDamaged?: boolean;
}

// ==================== START ZONE (Порт подачи) ====================

export function StartZone({ x, y, width, isSpawning = false }: StartZoneProps) {
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (isSpawning) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSpawning]);

  // Размеры пластины
  const plateWidth = 90;
  const plateHeight = 28;
  const centerX = x + width / 2;
  const plateX = centerX - plateWidth / 2;
  const plateY = y - plateHeight / 2;

  // Болты (слева и справа)
  const boltRadius = 5;
  const boltY = y;
  const bolts = [
    { cx: plateX + 12, cy: boltY },
    { cx: plateX + plateWidth - 12, cy: boltY },
  ];

  return (
    <g className="start-zone">
      {/* Непрозрачная подложка (маска) */}
      <rect
        x={plateX - 8}
        y={plateY - 8}
        width={plateWidth + 16}
        height={plateHeight + 16}
        fill="#0B0F14"
        rx={8}
      />

      {/* Основа пластины */}
      <rect
        x={plateX}
        y={plateY}
        width={plateWidth}
        height={plateHeight}
        rx={6}
        fill="#1A2430"
        stroke={flashActive ? '#7dd3fc' : '#32D6FF'}
        strokeWidth={2}
        style={{
          filter: flashActive
            ? 'drop-shadow(0 0 20px rgba(50, 214, 255, 0.7))'
            : 'drop-shadow(0 0 10px rgba(50, 214, 255, 0.25))',
        }}
      />

      {/* Внутренняя светящаяся полоса (поток) */}
      <rect
        x={centerX - 28}
        y={y - 2}
        width={56}
        height={4}
        rx={2}
        fill="#32D6FF"
        style={{ filter: 'blur(1px)' }}
      >
        <animate
          attributeName="opacity"
          values="0.4;0.8;0.4"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Болты */}
      {bolts.map((bolt, i) => (
        <g key={i}>
          <circle cx={bolt.cx} cy={bolt.cy} r={boltRadius} fill="#4A5568" />
          <circle cx={bolt.cx} cy={bolt.cy} r={boltRadius - 1.5} fill="#3D4452" />
          <circle cx={bolt.cx} cy={bolt.cy} r={1.5} fill="#2D3748" />
          <circle cx={bolt.cx - 1} cy={bolt.cy - 1} r={0.8} fill="rgba(255,255,255,0.2)" />
        </g>
      ))}

      {/* Chevron стрелка (справа, внутри канала) */}
      <g transform={`translate(${plateX + plateWidth + 6}, ${y})`}>
        <path
          d="M0 -5 L8 0 L0 5"
          fill="none"
          stroke="#32D6FF"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        >
          <animate
            attributeName="transform"
            values="translate(0,0);translate(2,0);translate(0,0)"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </g>
  );
}

// ==================== FINISH ZONE (Горячая зона) ====================

export function FinishZone({ x, y, width, isDamaged = false }: FinishZoneProps) {
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (isDamaged) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isDamaged]);

  // Размеры пластины
  const plateWidth = 90;
  const plateHeight = 28;
  const centerX = x + width / 2;
  const plateX = centerX - plateWidth / 2;
  const plateY = y - plateHeight / 2;

  return (
    <g className="finish-zone">
      {/* Непрозрачная подложка (маска) */}
      <rect
        x={plateX - 8}
        y={plateY - 8}
        width={plateWidth + 16}
        height={plateHeight + 16}
        fill="#0B0F14"
        rx={8}
      />

      {/* Основа пластины */}
      <rect
        x={plateX}
        y={plateY}
        width={plateWidth}
        height={plateHeight}
        rx={6}
        fill="#1A2430"
        stroke={flashActive ? '#FF3B4D' : '#FF6B35'}
        strokeWidth={2}
        style={{
          filter: flashActive
            ? 'drop-shadow(0 0 25px rgba(255, 59, 77, 0.9))'
            : 'drop-shadow(0 0 10px rgba(255, 107, 53, 0.3))',
        }}
      />

      {/* Дуга (след трения) */}
      <path
        d={`M ${centerX - 32} ${y + 6} A 32 20 0 0 1 ${centerX + 32} ${y + 6}`}
        fill="none"
        stroke="url(#finishArcGradient)"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Hot Spot */}
      <ellipse
        cx={centerX}
        cy={y}
        rx={14}
        ry={10}
        fill={flashActive ? '#FFFFFF' : 'url(#hotspotGradient)'}
        style={{
          filter: flashActive
            ? 'blur(3px) drop-shadow(0 0 15px rgba(255,59,77,1))'
            : 'blur(2px) drop-shadow(0 0 6px rgba(255,59,77,0.4))',
        }}
      >
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Chevron стрелка (слева, внутри канала) */}
      <g transform={`translate(${plateX - 14}, ${y})`}>
        <path
          d="M0 -5 L8 0 L0 5"
          fill="none"
          stroke="#FF6B35"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
        />
      </g>
    </g>
  );
}

// ==================== ГРАДИЕНТЫ ====================

export function ChannelZonesGradients() {
  return (
    <>
      {/* Градиент дуги FINISH */}
      <linearGradient id="finishArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4A5568" />
        <stop offset="50%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#4A5568" />
      </linearGradient>

      {/* Градиент hot spot */}
      <radialGradient id="hotspotGradient" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#FF3B4D" />
        <stop offset="60%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>
    </>
  );
}
