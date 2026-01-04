'use client';

import React, { useState } from 'react';
import { THEME } from '../theme';

interface StartButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

/**
 * StartButton — Главная кнопка "СТАРТ" с cyan glow эффектом
 */
export function StartButton({ onClick, disabled = false, label = 'СТАРТ' }: StartButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={() => setIsPressed(false)}
      onPointerLeave={() => setIsPressed(false)}
      style={{
        width: THEME.btnStart,
        height: THEME.touch,
        padding: '0 24px',
        background: isPressed ? `${THEME.accent}20` : 'transparent',
        border: `2px solid ${disabled ? THEME.textMuted : THEME.accent}`,
        borderRadius: 8,
        color: disabled ? THEME.textMuted : THEME.accent,
        fontSize: '18px',
        fontWeight: 600,
        letterSpacing: '0.15em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: THEME.transitionFast,
        boxShadow: isPressed && !disabled
          ? `0 0 20px ${THEME.accent}50, inset 0 0 10px ${THEME.accent}20`
          : `0 0 10px ${THEME.accent}20`,
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {label}
    </button>
  );
}
