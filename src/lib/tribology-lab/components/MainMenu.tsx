'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { THEME } from '../theme';
import { LabBackground } from './LabBackground';
import { StartButton } from './StartButton';
import { ModeToggle, GameMode, generateSeed } from './ModeToggle';
import { ModuleType } from '../types';
import { Handbook } from './handbook';

interface MainMenuProps {
  onStart: (seed: number, mode: GameMode, deck: ModuleType[]) => void;
  onTutorial?: () => void;
  hasCompletedTutorial: boolean;
}

// Роли модулей для правильной генерации колоды
const MODULE_ROLES = {
  dps: ['filter', 'magnet', 'laser', 'electrostatic'] as ModuleType[],
  control: ['cooler', 'centrifuge', 'barrier'] as ModuleType[],
  support: ['lubricant', 'analyzer', 'inhibitor'] as ModuleType[],
  utility: ['ultrasonic', 'demulsifier'] as ModuleType[],
};

/**
 * Генератор случайных чисел на основе seed (PRNG)
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * Генерация колоды по правилам: 2 DPS + 1 Control + 1 Support + 1 Utility = 5 модулей
 */
function generateDeck(seed: number): ModuleType[] {
  const random = seededRandom(seed);

  const shuffledDps = [...MODULE_ROLES.dps].sort(() => random() - 0.5);
  const shuffledControl = [...MODULE_ROLES.control].sort(() => random() - 0.5);
  const shuffledSupport = [...MODULE_ROLES.support].sort(() => random() - 0.5);
  const shuffledUtility = [...MODULE_ROLES.utility].sort(() => random() - 0.5);

  return [
    shuffledDps[0],      // DPS 1
    shuffledDps[1],      // DPS 2
    shuffledControl[0],  // Control
    shuffledSupport[0],  // Support
    shuffledUtility[0],  // Utility
  ];
}

/**
 * MainMenu — Главное меню "Лаб-стенд"
 */
export function MainMenu({ onStart, onTutorial, hasCompletedTutorial }: MainMenuProps) {
  const [mode, setMode] = useState<GameMode>('daily');
  const [showHandbook, setShowHandbook] = useState(false);

  // Seed и дека зависят от режима
  const seed = useMemo(() => generateSeed(mode), [mode]);
  const deck = useMemo(() => generateDeck(seed), [seed]);

  // Номер "стенда" — просто seed mod 999 + 1
  const standNumber = String((seed % 999) + 1).padStart(3, '0');

  const handleStart = () => {
    if (!hasCompletedTutorial && onTutorial) {
      onTutorial();
    } else {
      onStart(seed, mode, deck);
    }
  };

  // Описания режимов
  const modeDescriptions: Record<GameMode, string> = {
    daily: 'Одна колода на сегодня для всех',
    random: 'Случайная колода каждый запуск',
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
          gap: 24,
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
              letterSpacing: '0.1em',
            }}
          >
            Лаб-стенд №{standNumber}
          </p>
        </div>

        {/* Переключатель режима + описание */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ModeToggle mode={mode} onChange={setMode} />
          <p
            style={{
              fontSize: '12px',
              color: THEME.textMuted,
              margin: 0,
              textAlign: 'center',
            }}
          >
            {modeDescriptions[mode]}
          </p>
        </div>

        {/* Кнопка старт */}
        <StartButton onClick={handleStart} />

        {/* Нижняя панель: туториал + справочник */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            alignItems: 'center',
          }}
        >
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
          <button
            onClick={() => setShowHandbook(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(17, 24, 36, 0.8)',
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.textSecondary,
              fontSize: '13px',
              cursor: 'pointer',
              padding: '8px 14px',
              transition: 'all 0.15s ease',
            }}
          >
            <span>📒</span>
            СПРАВОЧНИК
          </button>
        </div>

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

      {/* Справочник */}
      {showHandbook && (
        <Handbook onClose={() => setShowHandbook(false)} />
      )}
    </LabBackground>
  );
}
