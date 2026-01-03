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

  const accentColor = isBoss ? '#FF6B35' : '#32D6FF';
  const glowColor = isBoss ? 'rgba(255, 107, 53, 0.8)' : 'rgba(50, 214, 255, 0.8)';

  return (
    <>
      {/* Фон (лёгкая виньетка) */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.15) 100%)',
          pointerEvents: 'none',
          zIndex: 80,
          opacity: phase === 'exit' ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Скан-линия */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`,
          pointerEvents: 'none',
          zIndex: 81,
          animation: 'scanMove 1.3s linear',
        }}
      />

      {/* Центральная панель */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${phase === 'enter' ? 0.98 : 1})`,
          width: 'min(400px, 85%)',
          padding: '48px 32px',
          background: 'rgba(11, 15, 20, 0.92)',
          border: `2px solid ${accentColor}`,
          borderRadius: 12,
          boxShadow: `0 12px 48px rgba(0,0,0,0.8), 0 0 60px ${glowColor}40`,
          textAlign: 'center',
          pointerEvents: 'none',
          zIndex: 85,
          opacity: phase === 'exit' ? 0 : phase === 'enter' ? 0.5 : 1,
          filter: phase === 'enter' ? 'brightness(1.5) blur(2px)' : 'brightness(1) blur(0)',
          transition: phase === 'exit'
            ? 'opacity 0.3s ease, transform 0.3s ease'
            : 'opacity 0.15s ease, transform 0.15s ease, filter 0.15s ease',
        }}
      >
        {/* Заголовок */}
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(36px, 8vw, 48px)',
            fontWeight: 800,
            color: isBoss ? '#FF6B35' : '#FFFFFF',
            letterSpacing: '0.1em',
            textShadow: `0 0 20px ${glowColor}`,
            animation: isBoss ? 'bossPulse 0.8s ease-in-out' : undefined,
          }}
        >
          ВОЛНА {wave}{isBoss && ' • БОСС'}
        </h1>

        {/* Подзаголовок */}
        <p
          style={{
            marginTop: 16,
            fontSize: 14,
            fontWeight: 500,
            color: '#7A8A99',
            letterSpacing: '0.05em',
            lineHeight: 1.6,
          }}
        >
          Режим: {mode === 'daily' ? 'Ежедневный' : 'Случайный набор'}
          <br />
          Лаб-стенд №{labStandId}
        </p>
      </div>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes scanMove {
          from { transform: translateY(0); }
          to { transform: translateY(100vh); }
        }
        @keyframes bossPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </>
  );
}
