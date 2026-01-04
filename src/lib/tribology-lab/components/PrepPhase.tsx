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
    // Компактная панель ВНИЗУ экрана — НЕ закрывает игровое поле
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 24px',
        background: 'rgba(11, 15, 20, 0.95)',
        border: `2px solid ${accentColor}`,
        borderRadius: 12,
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${accentColor}30`,
        zIndex: 85,
      }}
    >
      {/* Инфо о волне */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isBossWave && (
          <span style={{ fontSize: 18 }}>⚠️</span>
        )}
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#9CA3AF',
          }}
        >
          Волна {nextWave}
        </span>
      </div>

      {/* Кнопка СТАРТ */}
      <button
        onClick={onStart}
        style={{
          padding: '10px 24px',
          background: `linear-gradient(135deg, ${accentColor}, ${isBossWave ? '#ff9d7a' : '#7dd3fc'})`,
          color: '#0B0F14',
          fontSize: 15,
          fontWeight: 700,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          boxShadow: `0 2px 12px ${accentColor}50`,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        СТАРТ
      </button>

      {/* Таймер */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, color: '#7A8A99' }}>или через</span>
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: accentColor,
            minWidth: 24,
            textAlign: 'center',
          }}
        >
          {prepTime}
        </span>
        <span style={{ fontSize: 13, color: '#7A8A99' }}>сек</span>
      </div>
    </div>
  );
}
