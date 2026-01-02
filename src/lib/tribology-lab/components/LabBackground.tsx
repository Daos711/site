'use client';

import React from 'react';
import { THEME } from '../theme';

interface LabBackgroundProps {
  children?: React.ReactNode;
}

/**
 * LabBackground — SVG фон с гексагональной сеткой и "лабораторным" стилем
 * Полноэкранный фон для меню и splash-экранов
 */
export function LabBackground({ children }: LabBackgroundProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: THEME.bgBase,
        overflow: 'hidden',
      }}
    >
      {/* SVG паттерн — гексагональная сетка */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.5,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Гексагональный паттерн */}
          <pattern
            id="hexGrid"
            width="56"
            height="100"
            patternUnits="userSpaceOnUse"
            patternTransform="scale(1.2)"
          >
            {/* Гексагоны — два ряда со смещением */}
            <path
              d="M28 0 L56 16.6 L56 50 L28 66.6 L0 50 L0 16.6 Z"
              fill="none"
              stroke={THEME.line}
              strokeWidth="1"
            />
            <path
              d="M28 66.6 L56 83.2 L56 116.6 L28 133.2 L0 116.6 L0 83.2 Z"
              fill="none"
              stroke={THEME.line}
              strokeWidth="1"
              transform="translate(28, -33.3)"
            />
          </pattern>

          {/* Радиальный градиент для виньетки */}
          <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={THEME.bgBase} stopOpacity="0.8" />
          </radialGradient>

          {/* Вертикальный градиент для нижнего затемнения */}
          <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="70%" stopColor="transparent" />
            <stop offset="100%" stopColor={THEME.bgBase} />
          </linearGradient>
        </defs>

        {/* Гексагональная сетка */}
        <rect width="100%" height="100%" fill="url(#hexGrid)" />

        {/* Виньетка */}
        <rect width="100%" height="100%" fill="url(#vignette)" />

        {/* Нижнее затемнение */}
        <rect width="100%" height="100%" fill="url(#bottomFade)" />

        {/* Декоративные линии — горизонтальные */}
        <line
          x1="0"
          y1="20%"
          x2="100%"
          y2="20%"
          stroke={THEME.accent}
          strokeWidth="1"
          strokeOpacity="0.1"
        />
        <line
          x1="0"
          y1="80%"
          x2="100%"
          y2="80%"
          stroke={THEME.accent}
          strokeWidth="1"
          strokeOpacity="0.1"
        />

        {/* Угловые декоративные элементы */}
        <g stroke={THEME.accent} strokeWidth="2" strokeOpacity="0.15" fill="none">
          {/* Верхний левый угол */}
          <path d="M 0 40 L 0 0 L 40 0" />
          <path d="M 0 60 L 0 20 L 20 0" strokeWidth="1" />

          {/* Верхний правый угол */}
          <path d="M 100% 40 L 100% 0 L calc(100% - 40px) 0" />

          {/* Нижний левый угол */}
          <path d="M 0 calc(100% - 40px) L 0 100% L 40 100%" />

          {/* Нижний правый угол */}
          <path d="M 100% calc(100% - 40px) L 100% 100% L calc(100% - 40px) 100%" />
        </g>
      </svg>

      {/* Glow-эффект в центре (subtle) */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vw',
          height: '60vw',
          maxWidth: '500px',
          maxHeight: '500px',
          background: `radial-gradient(circle, ${THEME.accent}08 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Контент поверх фона */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      >
        {children}
      </div>
    </div>
  );
}
