"use client";

import { useEffect, useState } from 'react';

// ==================== ТИПЫ ====================

interface StartZoneProps {
  x: number;           // позиция X
  y: number;           // позиция Y (низ канала)
  width: number;       // ширина зоны
  isSpawning?: boolean; // вспышка при спавне врага
}

interface FinishZoneProps {
  x: number;           // позиция X
  y: number;           // позиция Y (низ канала)
  width: number;       // ширина зоны
  isDamaged?: boolean; // вспышка при потере жизни
}

// ==================== START ZONE (Входной патрубок) ====================

export function StartZone({ x, y, width, isSpawning = false }: StartZoneProps) {
  const [flashActive, setFlashActive] = useState(false);

  useEffect(() => {
    if (isSpawning) {
      setFlashActive(true);
      const timer = setTimeout(() => setFlashActive(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isSpawning]);

  const flangeWidth = Math.min(width * 0.95, 100);
  const flangeHeight = 32;
  const centerX = x + width / 2;
  const flangeX = centerX - flangeWidth / 2;
  const flangeY = y - flangeHeight / 2 + 4;

  // Позиции болтов (4 угла)
  const boltOffset = 8;
  const boltRadius = 5;
  const bolts = [
    { cx: flangeX + boltOffset + boltRadius, cy: flangeY + boltOffset + boltRadius },
    { cx: flangeX + flangeWidth - boltOffset - boltRadius, cy: flangeY + boltOffset + boltRadius },
    { cx: flangeX + boltOffset + boltRadius, cy: flangeY + flangeHeight - boltOffset - boltRadius },
    { cx: flangeX + flangeWidth - boltOffset - boltRadius, cy: flangeY + flangeHeight - boltOffset - boltRadius },
  ];

  return (
    <g className="start-zone">
      {/* Непрозрачная подложка */}
      <rect
        x={flangeX - 6}
        y={flangeY - 6}
        width={flangeWidth + 12}
        height={flangeHeight + 12}
        fill="#0B0F14"
        rx={8}
      />

      {/* Основание фланца */}
      <rect
        x={flangeX}
        y={flangeY}
        width={flangeWidth}
        height={flangeHeight}
        rx={6}
        fill="url(#startFlangeGradient)"
        stroke={flashActive ? '#7dd3fc' : '#32D6FF'}
        strokeWidth={2}
        style={{
          filter: flashActive
            ? 'drop-shadow(0 0 20px rgba(50, 214, 255, 0.8))'
            : 'drop-shadow(0 0 10px rgba(50, 214, 255, 0.3))',
        }}
      >
        {/* Пульсация свечения */}
        <animate
          attributeName="stroke-opacity"
          values="0.7;1;0.7"
          dur="2s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Текстура металла */}
      <rect
        x={flangeX}
        y={flangeY}
        width={flangeWidth}
        height={flangeHeight}
        rx={6}
        fill="url(#metalTexture)"
        opacity={0.08}
      />

      {/* Болты/заклепки */}
      {bolts.map((bolt, i) => (
        <g key={i}>
          {/* Основа болта */}
          <circle cx={bolt.cx} cy={bolt.cy} r={boltRadius} fill="#4A5568" />
          {/* Внутренняя тень */}
          <circle cx={bolt.cx} cy={bolt.cy} r={boltRadius - 1} fill="#3D4452" />
          {/* Центральная точка (шлиц) */}
          <circle cx={bolt.cx} cy={bolt.cy} r={1.5} fill="#2D3748" />
          {/* Блик */}
          <circle cx={bolt.cx - 1.5} cy={bolt.cy - 1.5} r={1} fill="rgba(255,255,255,0.25)" />
        </g>
      ))}

      {/* Щель входа */}
      <rect
        x={flangeX + 12}
        y={flangeY + flangeHeight / 2 - 3}
        width={flangeWidth - 24}
        height={6}
        rx={3}
        fill="#051515"
        style={{ filter: 'drop-shadow(inset 0 2px 4px rgba(0,0,0,0.8))' }}
      />

      {/* Надпись "ВХОД" */}
      <text
        x={centerX}
        y={flangeY - 8}
        textAnchor="middle"
        fill="#7dd3fc"
        fontSize={9}
        fontWeight={600}
        letterSpacing="0.1em"
        style={{ textShadow: '0 0 4px rgba(125, 211, 252, 0.5)' }}
      >
        ВХОД
      </text>

      {/* Стрелка потока (внутри канала) */}
      <g transform={`translate(${centerX + flangeWidth / 2 + 8}, ${y - 2})`}>
        <path
          d="M0 6 L10 0 L10 4 L18 4 L18 8 L10 8 L10 12 Z"
          fill="#32D6FF"
          opacity={0.5}
        >
          <animate
            attributeName="opacity"
            values="0.3;0.7;0.3"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </g>
  );
}

// ==================== FINISH ZONE (Узел трения) ====================

export function FinishZone({ x, y, width, isDamaged = false }: FinishZoneProps) {
  const [flashActive, setFlashActive] = useState(false);
  const [sparks, setSparks] = useState<Array<{ id: number; dx: number; dy: number }>>([]);

  useEffect(() => {
    if (isDamaged) {
      setFlashActive(true);

      // Создаём искры
      const newSparks = Array.from({ length: 6 }, (_, i) => ({
        id: Date.now() + i,
        dx: (Math.random() - 0.5) * 60,
        dy: (Math.random() - 0.5) * 40 - 20,
      }));
      setSparks(newSparks);

      const timer = setTimeout(() => {
        setFlashActive(false);
        setSparks([]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isDamaged]);

  const flangeWidth = Math.min(width * 0.95, 100);
  const flangeHeight = 32;
  const centerX = x + width / 2;
  const flangeX = centerX - flangeWidth / 2;
  const flangeY = y - flangeHeight / 2 + 4;

  // Параметры дуги подшипника
  const arcRadius = 40;
  const arcCenterX = centerX;
  const arcCenterY = flangeY + flangeHeight / 2;

  return (
    <g className="finish-zone">
      {/* Непрозрачная подложка */}
      <rect
        x={flangeX - 6}
        y={flangeY - 6}
        width={flangeWidth + 12}
        height={flangeHeight + 12}
        fill="#0B0F14"
        rx={8}
      />

      {/* Основание (тёмная пластина) */}
      <rect
        x={flangeX}
        y={flangeY}
        width={flangeWidth}
        height={flangeHeight}
        rx={6}
        fill="url(#finishFlangeGradient)"
        stroke={flashActive ? '#FF6B35' : '#8b3a2a'}
        strokeWidth={2}
        style={{
          filter: flashActive
            ? 'drop-shadow(0 0 25px rgba(255, 59, 77, 0.9))'
            : 'drop-shadow(0 0 8px rgba(255, 107, 53, 0.3))',
        }}
      />

      {/* Дуга подшипника */}
      <path
        d={`
          M ${arcCenterX - 35} ${arcCenterY + 10}
          A ${arcRadius} ${arcRadius} 0 0 1 ${arcCenterX + 35} ${arcCenterY + 10}
        `}
        fill="none"
        stroke="url(#bearingArcGradient)"
        strokeWidth={4}
        strokeLinecap="round"
      />

      {/* Внутреннее кольцо (дорожка качения) */}
      <ellipse
        cx={arcCenterX}
        cy={arcCenterY + 5}
        rx={28}
        ry={8}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1}
      />

      {/* Hot Spot */}
      <ellipse
        cx={arcCenterX}
        cy={arcCenterY + 2}
        rx={18}
        ry={10}
        fill={flashActive ? '#FFFFFF' : 'url(#hotspotGradient)'}
        style={{
          filter: flashActive
            ? 'blur(4px) drop-shadow(0 0 20px rgba(255,59,77,1))'
            : 'blur(2px) drop-shadow(0 0 6px rgba(255,59,77,0.4))',
        }}
      >
        {/* Пульсация hot spot */}
        <animate
          attributeName="opacity"
          values="0.7;1;0.7"
          dur="1.5s"
          repeatCount="indefinite"
        />
      </ellipse>

      {/* Надпись */}
      <text
        x={centerX}
        y={flangeY - 8}
        textAnchor="middle"
        fill="#FF6B35"
        fontSize={8}
        fontWeight={600}
        letterSpacing="0.08em"
        style={{ textShadow: '0 0 4px rgba(255, 107, 53, 0.5)' }}
      >
        УЗЕЛ ТРЕНИЯ
      </text>

      {/* Искры при потере жизни */}
      {sparks.map((spark) => (
        <circle
          key={spark.id}
          cx={arcCenterX}
          cy={arcCenterY}
          r={3}
          fill="#FF6B35"
          style={{
            animation: 'sparkBurst 0.5s ease-out forwards',
            '--spark-dx': `${spark.dx}px`,
            '--spark-dy': `${spark.dy}px`,
          } as React.CSSProperties}
        />
      ))}
    </g>
  );
}

// ==================== ГРАДИЕНТЫ (для defs в SVG) ====================

export function ChannelZonesGradients() {
  return (
    <>
      {/* Градиент фланца START */}
      <linearGradient id="startFlangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1A2430" />
        <stop offset="50%" stopColor="#141B24" />
        <stop offset="100%" stopColor="#0D1218" />
      </linearGradient>

      {/* Градиент фланца FINISH */}
      <linearGradient id="finishFlangeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1A1512" />
        <stop offset="50%" stopColor="#140F0C" />
        <stop offset="100%" stopColor="#0D0A08" />
      </linearGradient>

      {/* Текстура металла */}
      <pattern id="metalTexture" patternUnits="userSpaceOnUse" width="4" height="4">
        <rect width="4" height="4" fill="transparent" />
        <line x1="0" y1="0" x2="4" y2="4" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      </pattern>

      {/* Градиент дуги подшипника */}
      <linearGradient id="bearingArcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#4A5568" />
        <stop offset="40%" stopColor="#6B7280" />
        <stop offset="60%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="#4A5568" />
      </linearGradient>

      {/* Градиент hot spot */}
      <radialGradient id="hotspotGradient" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="#FF3B4D" />
        <stop offset="50%" stopColor="#FF6B35" />
        <stop offset="100%" stopColor="transparent" />
      </radialGradient>

      {/* CSS для искр */}
      <style>{`
        @keyframes sparkBurst {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--spark-dx), var(--spark-dy)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}
