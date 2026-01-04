'use client';

import React, { useEffect, useState } from 'react';

interface WaveOverlayProps {
  wave: number;
  mode: 'daily' | 'random';
  labStandId: number;
  onComplete: () => void;
}

export function WaveOverlay({ wave, mode, labStandId, onComplete }: WaveOverlayProps) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');
  const isBoss = wave % 5 === 0 && wave > 0;

  useEffect(() => {
    // Анимация: enter (200ms) → hold (800ms) → exit (300ms)
    const enterTimer = setTimeout(() => setPhase('hold'), 200);
    const exitTimer = setTimeout(() => setPhase('exit'), 1000);
    const completeTimer = setTimeout(onComplete, 1300);

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
      {/* Фон — лёгкое затемнение (БЕЗ blur!) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          pointerEvents: 'none',
          zIndex: 80,
          opacity: phase === 'exit' ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Контейнер текста — БЕЗ РАМКИ, БЕЗ КАРТОЧКИ */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, ${phase === 'exit' ? '-60%' : '-50%'}) scale(${phase === 'enter' ? 0.95 : 1})`,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 85,
          opacity: phase === 'exit' ? 0 : phase === 'enter' ? 0 : 1,
          transition: phase === 'exit'
            ? 'opacity 0.3s ease, transform 0.3s ease'
            : 'opacity 0.2s ease, transform 0.2s ease',
        }}
      >
        {/* Заголовок — КРУПНЫЙ, ЧЁТКИЙ, БЕЗ BLUR */}
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(56px, 12vw, 80px)',
            fontWeight: 900,
            color: isBoss ? '#FF6B35' : '#FFFFFF',
            letterSpacing: '0.15em',
            textShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColorMid}, 0 0 90px ${glowColorWeak}`,
            // КРИТИЧНО: БЕЗ filter, БЕЗ backdrop-filter
          }}
        >
          ВОЛНА {wave}{isBoss && ' • БОСС'}
        </h1>

        {/* Подзаголовок — мелкий, серый, БЕЗ эффектов */}
        <p
          style={{
            marginTop: 24,
            fontSize: 'clamp(14px, 2vw, 16px)',
            fontWeight: 500,
            color: '#A0AEC0',
            letterSpacing: '0.05em',
            lineHeight: 1.8,
            // БЕЗ text-shadow!
          }}
        >
          Режим: {mode === 'daily' ? 'Ежедневный' : 'Случайный набор'}
          <br />
          Лаб-стенд №{labStandId}
        </p>
      </div>
    </>
  );
}
