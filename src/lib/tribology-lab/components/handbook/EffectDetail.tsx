'use client';

import React from 'react';
import { THEME } from '../../theme';
import { BackButton, DetailSection, RoleBadge } from './HandbookCard';
import {
  EFFECT_LIST,
  HANDBOOK_EFFECTS,
  EFFECT_CATEGORY_LABELS,
  EFFECT_CATEGORY_COLORS,
} from '../../data/handbook-data';

interface EffectDetailProps {
  effectId: string;
  onBack: () => void;
}

export function EffectDetail({ effectId, onBack }: EffectDetailProps) {
  const handbookData = HANDBOOK_EFFECTS[effectId];

  if (!handbookData) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <p style={{ color: THEME.textMuted }}>Эффект не найден</p>
      </div>
    );
  }

  const currentIndex = EFFECT_LIST.indexOf(effectId);
  const categoryColor = EFFECT_CATEGORY_COLORS[handbookData.category];

  return (
    <div>
      <BackButton onClick={onBack} />

      {/* Заголовок */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        {/* Код эффекта */}
        <div
          style={{
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}
        >
          ЭФФЕКТ #{String(currentIndex + 1).padStart(3, '0')}
        </div>

        {/* Иконка */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 12px',
            background: `${categoryColor}22`,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${categoryColor}`,
            boxShadow: `0 0 20px ${categoryColor}33`,
            fontSize: 40,
          }}
        >
          {handbookData.icon}
        </div>

        {/* Название */}
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: THEME.textPrimary,
            margin: '0 0 8px 0',
          }}
        >
          {handbookData.name}
        </h2>

        {/* Категория */}
        <RoleBadge
          role={EFFECT_CATEGORY_LABELS[handbookData.category]}
          color={categoryColor}
        />
      </div>

      {/* Что делает */}
      <DetailSection title="Что делает">
        <p
          style={{
            fontSize: 14,
            color: THEME.textSecondary,
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {handbookData.description}
        </p>
      </DetailSection>

      {/* Цель */}
      <DetailSection title="Цель">
        <div
          style={{
            padding: '8px 12px',
            background: `${categoryColor}15`,
            border: `1px solid ${categoryColor}50`,
            borderRadius: 8,
            fontSize: 13,
            color: categoryColor,
          }}
        >
          🎯 {handbookData.target}
        </div>
      </DetailSection>

      {/* Параметры */}
      <DetailSection title="Параметры">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: `1px solid ${THEME.border}`,
            }}
          >
            <span style={{ fontSize: 13, color: THEME.textMuted }}>Поведение</span>
            <span style={{ fontSize: 13, color: THEME.textSecondary, textAlign: 'right', maxWidth: '60%' }}>
              {handbookData.stacking}
            </span>
          </div>
          {handbookData.cap && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: `1px solid ${THEME.border}`,
              }}
            >
              <span style={{ fontSize: 13, color: THEME.textMuted }}>Кап</span>
              <span style={{ fontSize: 13, color: THEME.accent }}>{handbookData.cap}</span>
            </div>
          )}
        </div>
      </DetailSection>

      {/* Источники */}
      <DetailSection title="Источники">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {handbookData.sources.map((source, i) => (
            <div
              key={i}
              style={{
                padding: '6px 12px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: 8,
                fontSize: 12,
                color: '#22c55e',
              }}
            >
              {source}
            </div>
          ))}
        </div>
      </DetailSection>

      {/* Иммунитеты */}
      {handbookData.immunities.length > 0 && (
        <DetailSection title="Иммунитеты / Сопротивление">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {handbookData.immunities.map((immunity, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#ef4444',
                }}
              >
                🛡 {immunity}
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      {/* Примечания */}
      {handbookData.notes && (
        <DetailSection title="Примечания">
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: `1px solid ${THEME.accent}`,
              borderRadius: 8,
              fontSize: 13,
              color: THEME.accent,
              lineHeight: 1.5,
            }}
          >
            💡 {handbookData.notes}
          </div>
        </DetailSection>
      )}

      {/* Навигация */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 20,
          paddingBottom: 20,
        }}
      >
        <button
          onClick={() => {
            const prevIndex = (currentIndex - 1 + EFFECT_LIST.length) % EFFECT_LIST.length;
            onBack();
            setTimeout(() => {
              const event = new CustomEvent('handbook-navigate', {
                detail: { type: 'effect', id: EFFECT_LIST[prevIndex] },
              });
              window.dispatchEvent(event);
            }, 0);
          }}
          style={{
            padding: '10px 20px',
            background: 'rgba(17, 24, 36, 0.8)',
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.textSecondary,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          ◀ Пред
        </button>
        <button
          onClick={() => {
            const nextIndex = (currentIndex + 1) % EFFECT_LIST.length;
            onBack();
            setTimeout(() => {
              const event = new CustomEvent('handbook-navigate', {
                detail: { type: 'effect', id: EFFECT_LIST[nextIndex] },
              });
              window.dispatchEvent(event);
            }, 0);
          }}
          style={{
            padding: '10px 20px',
            background: 'rgba(17, 24, 36, 0.8)',
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            color: THEME.textSecondary,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          След ▶
        </button>
      </div>
    </div>
  );
}
