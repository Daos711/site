'use client';

import React, { useEffect, useState } from 'react';

interface WaveOverlayProps {
  wave: number;
  mode: 'daily' | 'random';
  labStandId: number;
  onComplete: () => void;
  // Позиция и размеры сетки карточек для центрирования
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
}

export function WaveOverlay({ wave, mode, labStandId, onComplete, gridX, gridY, gridWidth, gridHeight }: WaveOverlayProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const isBoss = wave % 5 === 0 && wave > 0;

  // Размер шрифта пропорционален размеру сетки
  const fontSize = Math.min(gridWidth * 0.15, gridHeight * 0.25, 80);

  useEffect(() => {
    // Анимация: enter (300ms) → hold (2000ms) → exit (400ms) = 2.7 сек
    const enterTimer = setTimeout(() => setPhase('hold'), 300);
    const exitTimer = setTimeout(() => setPhase('exit'), 2300);
    const completeTimer = setTimeout(onComplete, 2700);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  // Цвета для свечения
  const glowColor = isBoss ? 'rgba(255, 107, 53, 0.8)' : 'rgba(50, 214, 255, 0.8)';
  const glowColorMid = isBoss ? 'rgba(255, 107, 53, 0.4)' : 'rgba(50, 214, 255, 0.4)';
  const glowColorWeak = isBoss ? 'rgba(255, 107, 53, 0.2)' : 'rgba(50, 214, 255, 0.2)';

  return (
    <>
      {/* Затемнение — только на области сетки карточек */}
      <div
        style={{
          position: 'absolute',
          top: gridY,
          left: gridX,
          width: gridWidth,
          height: gridHeight,
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 8,
          pointerEvents: 'none',
          zIndex: 80,
          opacity: phase === 'exit' ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Контейнер текста — в центре сетки карточек */}
      <div
        style={{
          position: 'absolute',
          top: gridY + gridHeight / 2,
          left: gridX + gridWidth / 2,
          transform: `translate(-50%, ${phase === 'exit' ? '-60%' : '-50%'}) scale(${phase === 'enter' ? 0.95 : 1})`,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 85,
          opacity: phase === 'exit' ? 0 : phase === 'enter' ? 0 : 1,
          transition: phase === 'exit'
            ? 'opacity 0.3s ease, transform 0.3s ease'
            : 'opacity 0.2s ease, transform 0.2s ease',
          // Ограничиваем ширину текста размером сетки
          maxWidth: gridWidth - 20,
        }}
      >
        {/* Заголовок — размер пропорционален сетке */}
        <h1
          style={{
            margin: 0,
            fontSize: fontSize,
            fontWeight: 900,
            color: isBoss ? '#FF6B35' : '#C5D1DE',
            letterSpacing: '0.1em',
            textShadow: `0 0 20px ${glowColorMid}, 0 0 40px ${glowColorWeak}`,
            whiteSpace: 'nowrap',
          }}
        >
          ВОЛНА {wave}
        </h1>

        {isBoss && (
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: fontSize * 0.4,
              fontWeight: 700,
              color: '#FF6B35',
              letterSpacing: '0.2em',
              textShadow: `0 0 20px ${glowColor}`,
            }}
          >
            БОСС
          </p>
        )}

        {/* Подзаголовок — мелкий, серый */}
        <p
          style={{
            marginTop: 16,
            fontSize: Math.max(12, fontSize * 0.2),
            fontWeight: 500,
            color: '#A0AEC0',
            letterSpacing: '0.05em',
            lineHeight: 1.6,
          }}
        >
          {mode === 'daily' ? 'Ежедневный' : 'Случайный'} • Стенд №{labStandId}
        </p>
      </div>
    </>
  );
}
