'use client';

import React from 'react';

interface PrepPhaseProps {
  prepTime: number;
  nextWave: number;
  onStart: () => void;
}

export function PrepPhase({ prepTime, nextWave, onStart }: PrepPhaseProps) {
  const isBossWave = nextWave % 5 === 0 && nextWave > 0;
  const accentColor = isBossWave ? '#FF6B35' : '#32D6FF';

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(360px, 85%)',
        padding: '40px 32px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: `2px solid ${accentColor}`,
        borderRadius: 16,
        boxShadow: `0 12px 48px rgba(0,0,0,0.8), 0 0 40px ${accentColor}30`,
        textAlign: 'center',
        zIndex: 85,
      }}
    >
      {/* Заголовок */}
      <h2
        style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: accentColor,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {isBossWave ? '⚠️ Босс-волна!' : 'Подготовка'}
      </h2>

      {/* Номер волны */}
      <div
        style={{
          margin: '16px 0',
          fontSize: 14,
          color: '#9CA3AF',
        }}
      >
        Следующая: <span style={{ color: '#E5E7EB', fontWeight: 600 }}>Волна {nextWave}</span>
      </div>

      {/* Кнопка СТАРТ */}
      <button
        onClick={onStart}
        style={{
          width: '100%',
          maxWidth: 240,
          height: 64,
          background: `linear-gradient(135deg, ${accentColor}, ${isBossWave ? '#ff9d7a' : '#7dd3fc'})`,
          color: '#0B0F14',
          fontSize: 18,
          fontWeight: 700,
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          boxShadow: `0 4px 16px ${accentColor}60`,
          transition: 'all 0.2s ease',
          animation: 'pulseStart 2s ease-in-out infinite',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = `0 6px 24px ${accentColor}80`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = `0 4px 16px ${accentColor}60`;
        }}
      >
        СТАРТ ВОЛНЫ
      </button>

      {/* Таймер автостарта */}
      <p
        style={{
          marginTop: 16,
          fontSize: 14,
          color: '#7A8A99',
        }}
      >
        Автостарт через{' '}
        <span
          style={{
            color: accentColor,
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {prepTime}с
        </span>
      </p>

      {/* Прогресс-бар */}
      <div
        style={{
          marginTop: 12,
          height: 4,
          background: '#2D3748',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${(prepTime / 5) * 100}%`,
            background: accentColor,
            borderRadius: 2,
            transition: 'width 1s linear',
          }}
        />
      </div>

      {/* CSS анимации */}
      <style jsx>{`
        @keyframes pulseStart {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
      `}</style>
    </div>
  );
}
