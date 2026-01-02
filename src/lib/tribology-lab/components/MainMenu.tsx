'use client';

import React, { useState, useMemo } from 'react';
import { THEME } from '../theme';
import { LabBackground } from './LabBackground';
import { StartButton } from './StartButton';
import { ModeToggle, GameMode, generateSeed } from './ModeToggle';
import { MODULES, ModuleType, MODULE_GRADIENTS } from '../types';

interface MainMenuProps {
  onStart: (seed: number, mode: GameMode) => void;
  onTutorial?: () => void;
  hasCompletedTutorial: boolean;
}

/**
 * Генератор деки на основе seed (PRNG)
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function generateDeck(seed: number): ModuleType[] {
  const random = seededRandom(seed);
  const allModules = Object.keys(MODULES) as ModuleType[];

  // Shuffle и выбираем 6
  const shuffled = [...allModules].sort(() => random() - 0.5);
  return shuffled.slice(0, 6);
}

/**
 * MainMenu — Главное меню "Lab Stand"
 */
export function MainMenu({ onStart, onTutorial, hasCompletedTutorial }: MainMenuProps) {
  const [mode, setMode] = useState<GameMode>('daily');

  // Seed и дека зависят от режима
  const seed = useMemo(() => generateSeed(mode), [mode]);
  const deck = useMemo(() => generateDeck(seed), [seed]);

  // Номер "стенда" — просто seed mod 999 + 1
  const standNumber = String((seed % 999) + 1).padStart(3, '0');

  const handleStart = () => {
    if (!hasCompletedTutorial && onTutorial) {
      onTutorial();
    } else {
      onStart(seed, mode);
    }
  };

  return (
    <LabBackground>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: THEME.padX,
          gap: 32,
        }}
      >
        {/* Заголовок */}
        <div style={{ textAlign: 'center' }}>
          <h1
            style={{
              fontSize: 'clamp(36px, 10vw, 56px)',
              fontWeight: 700,
              color: THEME.textPrimary,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            ТРИБО-ЛАБ
          </h1>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.accent,
              margin: '8px 0 0 0',
              letterSpacing: '0.2em',
            }}
          >
            LAB STAND #{standNumber}
          </p>
        </div>

        {/* Переключатель режима */}
        <ModeToggle mode={mode} onChange={setMode} />

        {/* Превью деки */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: THEME.textMuted,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Модули сессии
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              justifyContent: 'center',
              maxWidth: 320,
            }}
          >
            {deck.map((moduleType, index) => {
              const config = MODULES[moduleType];
              const gradient = MODULE_GRADIENTS[moduleType];
              return (
                <div
                  key={`${moduleType}-${index}`}
                  title={config.name}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: gradient.bg,
                    border: `2px solid ${gradient.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: `0 2px 8px rgba(0,0,0,0.3)`,
                  }}
                >
                  {config.icon}
                </div>
              );
            })}
          </div>
        </div>

        {/* Кнопка старт */}
        <StartButton onClick={handleStart} />

        {/* Ссылка на туториал (если уже прошёл) */}
        {hasCompletedTutorial && onTutorial && (
          <button
            onClick={onTutorial}
            style={{
              background: 'none',
              border: 'none',
              color: THEME.textMuted,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px 16px',
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
            }}
          >
            Как играть?
          </button>
        )}

        {/* Seed info (для дебага / шеринга) */}
        <p
          style={{
            position: 'absolute',
            bottom: 16,
            fontSize: '11px',
            color: THEME.textMuted,
            opacity: 0.5,
            margin: 0,
          }}
        >
          seed: {seed}
        </p>
      </div>
    </LabBackground>
  );
}
