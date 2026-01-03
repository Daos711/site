'use client';

import React from 'react';
import { THEME } from '../theme';

export type GameMode = 'daily' | 'random';

interface ModeToggleProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

/**
 * ModeToggle — Переключатель режима игры (Daily / Random)
 * Сегментированный контрол с подсветкой активного режима
 */
export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const modes: { value: GameMode; label: string; icon: string }[] = [
    { value: 'daily', label: 'ЕЖЕДНЕВНЫЙ', icon: '📅' },
    { value: 'random', label: 'СЛУЧАЙНЫЙ', icon: '🎲' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        gap: 0,
        background: THEME.bgPanel,
        borderRadius: 12,
        padding: 4,
        border: `1px solid ${THEME.border}`,
      }}
    >
      {modes.map(({ value, label, icon }) => {
        const isActive = mode === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: isActive ? `${THEME.accent}20` : 'transparent',
              border: 'none',
              borderRadius: 8,
              color: isActive ? THEME.accent : THEME.textSecondary,
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: THEME.transitionFast,
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <span style={{ fontSize: '16px' }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Генерация seed на основе режима
 * Daily: seed = текущая дата UTC (YYYYMMDD)
 * Random: seed = случайное число
 */
export function generateSeed(mode: GameMode): number {
  if (mode === 'daily') {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`, 10);
  }
  return Math.floor(Math.random() * 1000000);
}
