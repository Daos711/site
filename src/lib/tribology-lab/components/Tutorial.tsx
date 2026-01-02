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
    description: 'Не дай частицам загрязнения дойти до конца трубы. Каждая пропущенная частица отнимает жизни.',
    highlight: 'wave',
  },
  {
    icon: '🔧',
    title: 'Модули',
    description: 'Размещай модули на поле и улучшай их. Каждый модуль атакует врагов по-своему.',
    highlight: 'grid',
  },
  {
    icon: '⚡',
    title: 'Комбо-эффекты',
    description: 'Эффекты работают лучше вместе! Замедленные враги получают больше урона, а мокрые — больше крио-урона.',
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
    // Сетка с модулями
    return (
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Сетка */}
        {[0, 1, 2, 3].map((col) =>
          [0, 1, 2].map((row) => (
            <rect
              key={`${col}-${row}`}
              x={30 + col * 40}
              y={10 + row * 35}
              width="35"
              height="30"
              rx="4"
              fill={THEME.bgPanel}
              stroke={THEME.border}
            />
          ))
        )}

        {/* Модуль (анимированный) */}
        <g>
          <rect x="70" y="45" width="35" height="30" rx="4" fill={THEME.accent} opacity="0.3">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <text x="87" y="67" textAnchor="middle" fontSize="18">🧲</text>
        </g>

        {/* Курсор */}
        <path
          d="M130 70 L130 90 L140 82 L145 95 L150 93 L145 80 L155 80 Z"
          fill={THEME.textPrimary}
          opacity="0.8"
        >
          <animate attributeName="transform" values="translate(0,0);translate(-60,-25);translate(0,0)" dur="3s" repeatCount="indefinite" />
        </path>
      </svg>
    );
  }

  // Combo
  return (
    <svg width="200" height="120" viewBox="0 0 200 120">
      {/* Два модуля */}
      <g>
        <rect x="30" y="40" width="50" height="40" rx="6" fill="#3b82f6" opacity="0.6" />
        <text x="55" y="68" textAnchor="middle" fontSize="24">❄️</text>
      </g>
      <g>
        <rect x="120" y="40" width="50" height="40" rx="6" fill="#8b5cf6" opacity="0.6" />
        <text x="145" y="68" textAnchor="middle" fontSize="24">💧</text>
      </g>

      {/* Стрелка связи */}
      <path d="M85 60 L115 60" stroke={THEME.accent} strokeWidth="2" strokeDasharray="4,4">
        <animate attributeName="stroke-dashoffset" values="8;0" dur="0.5s" repeatCount="indefinite" />
      </path>

      {/* Молния комбо */}
      <text x="100" y="30" textAnchor="middle" fontSize="20">
        ⚡
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.8s" repeatCount="indefinite" />
      </text>

      {/* x2 урон */}
      <text
        x="100"
        y="105"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill={THEME.accentGreen}
      >
        x2 УРОН
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
      </text>
    </svg>
  );
}
