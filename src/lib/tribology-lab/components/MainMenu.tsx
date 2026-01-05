'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { THEME } from '../theme';
import { LabBackground } from './LabBackground';
import { StartButton } from './StartButton';
import { ModeToggle, GameMode, generateSeed } from './ModeToggle';
import { MODULES, MODULE_PALETTE, ModuleType } from '../types';
import { ModuleIcon } from './ModuleIcons';
import { Handbook } from './handbook';
import { AuthUser } from '../supabase';

interface MainMenuProps {
  onStart: (seed: number, mode: GameMode, deck: ModuleType[]) => void;
  onTutorial?: () => void;
  onShowLeaderboard?: () => void;
  hasCompletedTutorial: boolean;
  // Авторизация
  authUser?: AuthUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  authLoading?: boolean;
}

/**
 * Расчёт времени до следующего дня (UTC 00:00)
 */
function getTimeUntilNextDayUTC(): string {
  const now = new Date();
  const nowUTC = Date.now();

  // Следующая полночь UTC
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);

  const diff = tomorrow.getTime() - nowUTC;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Роли модулей для правильной генерации колоды
const MODULE_ROLES = {
  dps: ['filter', 'magnet', 'laser', 'electrostatic', 'ultrasonic'] as ModuleType[],
  control: ['cooler', 'centrifuge', 'barrier'] as ModuleType[],
  support: ['lubricant', 'analyzer', 'inhibitor', 'demulsifier'] as ModuleType[],
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
 * Fisher-Yates shuffle - детерминированное перемешивание
 * В отличие от .sort(() => random() - 0.5), работает одинаково во всех браузерах
 */
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Генерация колоды по правилам: 2 DPS + 1 Control + 2 Support = 5 модулей
 */
function generateDeck(seed: number): ModuleType[] {
  const random = seededRandom(seed);

  const shuffledDps = shuffleArray(MODULE_ROLES.dps, random);
  const shuffledControl = shuffleArray(MODULE_ROLES.control, random);
  const shuffledSupport = shuffleArray(MODULE_ROLES.support, random);

  return [
    shuffledDps[0],      // DPS 1
    shuffledDps[1],      // DPS 2
    shuffledControl[0],  // Control
    shuffledSupport[0],  // Support 1
    shuffledSupport[1],  // Support 2
  ];
}

/**
 * MainMenu — Главное меню "Лаб-стенд"
 */
export function MainMenu({
  onStart,
  onTutorial,
  onShowLeaderboard,
  hasCompletedTutorial,
  authUser,
  onSignIn,
  onSignOut,
  authLoading,
}: MainMenuProps) {
  const [mode, setMode] = useState<GameMode>('daily');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showHandbook, setShowHandbook] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [currentDateUTC, setCurrentDateUTC] = useState<string>(() => {
    const now = new Date();
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
  });

  // Обновляем дату при смене дня (проверка каждую секунду в useEffect ниже)
  // Seed и дека зависят от режима И текущей даты
  const seed = useMemo(() => generateSeed(mode), [mode, currentDateUTC]);
  const deck = useMemo(() => generateDeck(seed), [seed]);

  // Номер "стенда" — просто seed mod 999 + 1
  const standNumber = String((seed % 999) + 1).padStart(3, '0');

  // Анимация загрузки карточек
  useEffect(() => {
    setLoadingProgress(0);
    setIsLoaded(false);

    let intervalId: NodeJS.Timeout | null = null;

    const timerId = setTimeout(() => {
      let count = 0;
      intervalId = setInterval(() => {
        count++;
        setLoadingProgress(count);
        if (count >= 5) {
          if (intervalId) clearInterval(intervalId);
          setIsLoaded(true);
        }
      }, 180);
    }, 300);

    // Очищаем ОБА таймера при смене режима
    return () => {
      clearTimeout(timerId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [mode, seed]);

  // Обновление таймера каждую секунду (только для daily)
  // Также проверяем смену дня для обновления набора
  useEffect(() => {
    if (mode === 'daily') {
      // Немедленно установить начальное значение
      setTimeRemaining(getTimeUntilNextDayUTC());

      // Обновлять каждую секунду
      const interval = setInterval(() => {
        setTimeRemaining(getTimeUntilNextDayUTC());

        // Проверяем не сменился ли день (для обновления набора без рефреша)
        const now = new Date();
        const nowDateUTC = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}`;
        setCurrentDateUTC(prev => prev !== nowDateUTC ? nowDateUTC : prev);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [mode]);

  const handleStart = () => {
    if (!hasCompletedTutorial && onTutorial) {
      onTutorial();
    } else {
      onStart(seed, mode, deck);
    }
  };

  // Описания режимов
  const modeDescriptions: Record<GameMode, string> = {
    daily: 'Один набор на сегодня для всех',
    random: 'Случайный набор каждый запуск',
  };

  return (
    <LabBackground>
      {/* Кнопка авторизации — правый верхний угол */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
        }}
      >
        {authLoading ? (
          <div
            style={{
              padding: '8px 16px',
              background: 'rgba(17, 24, 36, 0.8)',
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.textMuted,
              fontSize: 13,
            }}
          >
            Загрузка...
          </div>
        ) : authUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {authUser.avatar && (
              <img
                src={authUser.avatar}
                alt=""
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: `2px solid ${THEME.accent}`,
                }}
              />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: 12, color: THEME.textPrimary, fontWeight: 500 }}>
                {authUser.name || authUser.email || 'Игрок'}
              </span>
              <button
                onClick={onSignOut}
                style={{
                  background: 'none',
                  border: 'none',
                  color: THEME.textMuted,
                  fontSize: 11,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = THEME.danger;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = THEME.textMuted;
                }}
              >
                Выйти
              </button>
            </div>
          </div>
        ) : onSignIn ? (
          <button
            onClick={onSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              background: 'rgba(17, 24, 36, 0.8)',
              border: `1px solid ${THEME.border}`,
              borderRadius: 8,
              color: THEME.textSecondary,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = THEME.accent;
              e.currentTarget.style.color = THEME.textPrimary;
              e.currentTarget.style.boxShadow = '0 0 12px rgba(50, 214, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.color = THEME.textSecondary;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Войти
          </button>
        ) : null}
      </div>

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

          {/* ТАЙМЕР (только для daily) */}
          {mode === 'daily' && timeRemaining && (
            <div
              style={{
                fontSize: '11px',
                color: THEME.textMuted,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontSize: '14px' }}>⏱️</span>
              Смена через:{' '}
              <span
                style={{
                  color: THEME.accent,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {timeRemaining}
              </span>
            </div>
          )}
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
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = THEME.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = THEME.textMuted;
              }}
            >
              Как играть?
            </button>
          )}
          {onShowLeaderboard && (
            <button
              onClick={onShowLeaderboard}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = THEME.accent;
                e.currentTarget.style.color = THEME.textPrimary;
                e.currentTarget.style.boxShadow = `0 0 12px rgba(50, 214, 255, 0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = THEME.border;
                e.currentTarget.style.color = THEME.textSecondary;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span>🏆</span>
              РЕЙТИНГ
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
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = THEME.accent;
              e.currentTarget.style.color = THEME.textPrimary;
              e.currentTarget.style.boxShadow = `0 0 12px rgba(50, 214, 255, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = THEME.border;
              e.currentTarget.style.color = THEME.textSecondary;
              e.currentTarget.style.boxShadow = 'none';
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
