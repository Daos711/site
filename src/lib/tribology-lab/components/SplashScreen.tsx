'use client';

import React, { useEffect, useState } from 'react';
import { THEME } from '../theme';
import { LabBackground } from './LabBackground';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number; // ms, default 2000
}

/**
 * SplashScreen — Заставка с логотипом и scan-line анимацией
 * Автопереход через duration мс или по тапу/клику
 */
export function SplashScreen({ onComplete, duration = 2000 }: SplashScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    // Фаза появления
    const enterTimer = setTimeout(() => setPhase('visible'), 100);

    // Авто-переход
    const exitTimer = setTimeout(() => {
      setPhase('exit');
      setTimeout(onComplete, 400); // После fade-out
    }, duration);

    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, [duration, onComplete]);

  const handleSkip = () => {
    if (phase !== 'exit') {
      setPhase('exit');
      setTimeout(onComplete, 400);
    }
  };

  return (
    <LabBackground>
      <div
        onClick={handleSkip}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
          transition: 'opacity 0.4s ease-out',
        }}
      >
        {/* Логотип / Название */}
        <div
          style={{
            position: 'relative',
            transform: phase === 'visible' ? 'scale(1)' : 'scale(0.9)',
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Основной текст */}
          <h1
            style={{
              fontSize: 'clamp(48px, 12vw, 72px)',
              fontWeight: 700,
              color: THEME.textPrimary,
              textAlign: 'center',
              margin: 0,
              letterSpacing: '-0.02em',
              textShadow: `0 0 40px ${THEME.accent}40`,
            }}
          >
            ТРИБО-ЛАБ
          </h1>

          {/* Scan-line эффект */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '-10%',
              width: '120%',
              height: '100%',
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '4px',
                background: `linear-gradient(90deg, transparent 0%, ${THEME.accent} 50%, transparent 100%)`,
                opacity: 0.8,
                animation: 'scanLine 2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Подзаголовок */}
          <p
            style={{
              fontSize: 'clamp(14px, 4vw, 18px)',
              fontWeight: 500,
              color: THEME.accent,
              textAlign: 'center',
              margin: '12px 0 0 0',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              opacity: phase === 'visible' ? 1 : 0,
              transform: phase === 'visible' ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.5s ease-out 0.3s, transform 0.5s ease-out 0.3s',
            }}
          >
            Защити подшипник
          </p>
        </div>

        {/* Подсказка "тапни" */}
        <p
          style={{
            position: 'absolute',
            bottom: '15%',
            fontSize: '14px',
            color: THEME.textMuted,
            textAlign: 'center',
            opacity: phase === 'visible' ? 1 : 0,
            transition: 'opacity 0.5s ease-out 0.8s',
            animation: phase === 'visible' ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        >
          тапни чтобы продолжить
        </p>
      </div>

      {/* CSS анимации */}
      <style>{`
        @keyframes scanLine {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(calc(100% + 60px));
            opacity: 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </LabBackground>
  );
}
