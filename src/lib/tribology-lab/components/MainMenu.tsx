'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { THEME } from '../theme';
import { LabBackground } from './LabBackground';
import { StartButton } from './StartButton';
import { ModeToggle, GameMode, generateSeed } from './ModeToggle';
import { MODULES, MODULE_PALETTE, ModuleType } from '../types';
import { ModuleIcon } from './ModuleIcons';

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
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  // Seed и дека зависят от режима
  const seed = useMemo(() => generateSeed(mode), [mode]);
  const deck = useMemo(() => generateDeck(seed), [seed]);

  // Номер "стенда" — просто seed mod 999 + 1
  const standNumber = String((seed % 999) + 1).padStart(3, '0');

  // Анимация загрузки карточек
  useEffect(() => {
    setLoadingProgress(0);
    setIsLoaded(false);

    const timer = setTimeout(() => {
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setLoadingProgress(count);
        if (count >= 5) {
          clearInterval(interval);
          setIsLoaded(true);
        }
      }, 180);

      return () => clearInterval(interval);
    }, 300);

    return () => clearTimeout(timer);
  }, [mode, seed]);

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

        {/* Превью колоды */}
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
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0,
              minHeight: '1.2em',
            }}
          >
            {isLoaded ? 'Набор оборудования' : `Выдача комплекта... ${loadingProgress}/5`}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
            }}
          >
            {deck.map((moduleType, index) => {
              const config = MODULES[moduleType];
              const palette = MODULE_PALETTE[moduleType];
              const isVisible = index < loadingProgress;

              return (
                <div
                  key={`${moduleType}-${index}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isVisible ? 1 : 0.15,
                    transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(15px) scale(0.92)',
                    transition: 'all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {/* Иконка из игры */}
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 10,
                      background: THEME.bgPanel,
                      border: `2px solid ${isVisible ? palette.light : THEME.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isVisible ? `0 0 12px ${palette.glow}` : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ width: 32, height: 32 }}>
                      <ModuleIcon type={moduleType} />
                    </div>
                  </div>

                  {/* Название */}
                  <span
                    style={{
                      fontSize: '9px',
                      color: isVisible ? THEME.textSecondary : THEME.textMuted,
                      textAlign: 'center',
                      maxWidth: 60,
                      lineHeight: 1.2,
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {config.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Кнопка старт — активна только после загрузки */}
        <StartButton onClick={handleStart} disabled={!isLoaded} />

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
