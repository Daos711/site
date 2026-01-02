'use client';

import React, { useState } from 'react';
import { THEME } from '../theme';
import { LabBackground } from './LabBackground';
import { StartButton } from './StartButton';

interface TutorialProps {
  onComplete: () => void;
  onSkip?: () => void;
}

interface TutorialStep {
  icon: string;
  title: string;
  description: string;
  highlight: 'wave' | 'grid' | 'combo';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: '🎯',
    title: 'Цель игры',
    description: 'Не дай загрязнениям дойти до конца канала. У тебя 10 жизней. Обычные враги отнимают 1, боссы — 3.',
    highlight: 'wave',
  },
  {
    icon: '🔧',
    title: 'Модули',
    description: 'Перетащи модуль на поле. Два одинаковых модуля объединяются в более мощный (до 5 уровня).',
    highlight: 'grid',
  },
  {
    icon: '⚡',
    title: 'Синергии',
    description: 'Замедление даёт больше времени для урона. Метки (Анализатор) и покрытие (Смазка) увеличивают получаемый урон.',
    highlight: 'combo',
  },
];

/**
 * Tutorial — Обучение в 3 шага
 */
export function Tutorial({ onComplete, onSkip }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const currentStep = TUTORIAL_STEPS[step];
  const isLastStep = step === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      setIsExiting(true);
      setTimeout(onComplete, 300);
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onSkip?.();
      onComplete();
    }, 300);
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
          opacity: isExiting ? 0 : 1,
          transition: 'opacity 0.3s ease-out',
        }}
      >
        {/* Progress dots */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            display: 'flex',
            gap: 8,
          }}
        >
          {TUTORIAL_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === step ? THEME.accent : THEME.textMuted,
                opacity: i === step ? 1 : 0.4,
                transition: THEME.transitionFast,
              }}
            />
          ))}
        </div>

        {/* Skip button */}
        {onSkip && !isLastStep && (
          <button
            onClick={handleSkip}
            style={{
              position: 'absolute',
              top: 32,
              right: 20,
              background: 'none',
              border: 'none',
              color: THEME.textMuted,
              fontSize: '14px',
              cursor: 'pointer',
              padding: '8px',
            }}
          >
            Пропустить
          </button>
        )}

        {/* Illustration area */}
        <div
          style={{
            width: 200,
            height: 160,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <TutorialIllustration type={currentStep.highlight} />
        </div>

        {/* Content card */}
        <div
          style={{
            background: THEME.bgPanelAlpha,
            borderRadius: THEME.radiusPanel,
            border: `1px solid ${THEME.border}`,
            padding: '32px 24px',
            maxWidth: 320,
            textAlign: 'center',
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: '48px',
              marginBottom: 16,
            }}
          >
            {currentStep.icon}
          </div>

          {/* Title */}
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: THEME.textPrimary,
              margin: '0 0 12px 0',
            }}
          >
            {currentStep.title}
          </h2>

          {/* Description */}
          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.6,
              color: THEME.textSecondary,
              margin: 0,
            }}
          >
            {currentStep.description}
          </p>
        </div>

        {/* Next button */}
        <div style={{ marginTop: 32 }}>
          <StartButton
            onClick={handleNext}
            label={isLastStep ? 'НАЧАТЬ' : 'ДАЛЕЕ'}
          />
        </div>

        {/* Step counter */}
        <p
          style={{
            position: 'absolute',
            bottom: 24,
            fontSize: '13px',
            color: THEME.textMuted,
            margin: 0,
          }}
        >
          {step + 1} / {TUTORIAL_STEPS.length}
        </p>
      </div>
    </LabBackground>
  );
}

/**
 * Иллюстрации для каждого шага туториала
 */
function TutorialIllustration({ type }: { type: 'wave' | 'grid' | 'combo' }) {
  if (type === 'wave') {
    // Волна частиц движется к финишу
    return (
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Труба */}
        <rect x="20" y="45" width="160" height="30" rx="4" fill={THEME.bgPanel} stroke={THEME.border} />

        {/* Частицы (движутся) */}
        <g>
          <circle cx="50" cy="60" r="8" fill={THEME.warn}>
            <animate attributeName="cx" values="50;170" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;1;0" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="60" r="6" fill={THEME.danger}>
            <animate attributeName="cx" values="30;150" dur="2.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Финиш (опасность) */}
        <rect x="175" y="40" width="5" height="40" fill={THEME.danger} opacity="0.5">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1s" repeatCount="indefinite" />
        </rect>

        {/* Сердечки HP */}
        <g transform="translate(175, 95)">
          <text fontSize="16">❤️❤️❤️</text>
        </g>
      </svg>
    );
  }

  if (type === 'grid') {
    // Слияние модулей: 2 одинаковых → 1 улучшенный
    return (
      <svg width="200" height="100" viewBox="0 0 200 100">
        {/* Модуль 1 */}
        <g>
          <rect x="10" y="25" width="40" height="45" rx="5" fill={THEME.bgPanel} stroke={THEME.accent} strokeWidth="2" />
          <text x="30" y="48" textAnchor="middle" fontSize="18">🧲</text>
          {/* Бейдж уровня внутри */}
          <rect x="32" y="54" width="16" height="12" rx="3" fill={THEME.accent} opacity="0.9" />
          <text x="40" y="63" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">1</text>
        </g>

        {/* Плюс */}
        <text x="62" y="50" textAnchor="middle" fontSize="16" fill={THEME.textSecondary}>+</text>

        {/* Модуль 2 */}
        <g>
          <rect x="75" y="25" width="40" height="45" rx="5" fill={THEME.bgPanel} stroke={THEME.accent} strokeWidth="2" />
          <text x="95" y="48" textAnchor="middle" fontSize="18">🧲</text>
          {/* Бейдж уровня внутри */}
          <rect x="97" y="54" width="16" height="12" rx="3" fill={THEME.accent} opacity="0.9" />
          <text x="105" y="63" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">1</text>
        </g>

        {/* Стрелка */}
        <text x="127" y="50" textAnchor="middle" fontSize="16" fill={THEME.accent}>→</text>

        {/* Результат */}
        <g>
          <rect x="140" y="20" width="50" height="55" rx="5" fill={THEME.bgPanel} stroke={THEME.accentGreen} strokeWidth="2">
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <text x="165" y="45" textAnchor="middle" fontSize="22">🧲</text>
          {/* Бейдж уровня внутри — крупнее */}
          <rect x="155" y="52" width="20" height="14" rx="3" fill={THEME.accentGreen} opacity="0.9" />
          <text x="165" y="63" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">2</text>
        </g>
      </svg>
    );
  }

  // Синергии: замедление, метки, покрытие
  return (
    <svg width="200" height="110" viewBox="0 0 200 110">
      {/* Синергия 1: Охладитель → больше времени */}
      <g transform="translate(10, 5)">
        <rect width="36" height="32" rx="6" fill="#3b82f6" opacity="0.85" />
        <text x="18" y="23" textAnchor="middle" fontSize="16">❄️</text>
      </g>
      <text x="56" y="26" fontSize="13" fill={THEME.accentGreen} fontWeight="500">→ больше времени</text>

      {/* Синергия 2: Анализатор → +урон */}
      <g transform="translate(10, 42)">
        <rect width="36" height="32" rx="6" fill="#ec4899" opacity="0.85" />
        <text x="18" y="23" textAnchor="middle" fontSize="16">🎯</text>
      </g>
      <text x="56" y="63" fontSize="13" fill={THEME.accentGreen} fontWeight="500">→ +25% урон</text>

      {/* Синергия 3: Смазка → +урон соседям */}
      <g transform="translate(10, 79)">
        <rect width="36" height="32" rx="6" fill="#22c55e" opacity="0.85" />
        <text x="18" y="23" textAnchor="middle" fontSize="16">🛢️</text>
      </g>
      <text x="56" y="100" fontSize="13" fill={THEME.accentGreen} fontWeight="500">→ +25% соседям</text>
    </svg>
  );
}
