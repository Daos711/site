'use client';

import React from 'react';
import { THEME } from '../../theme';
import { HandbookCard } from './HandbookCard';
import { EFFECT_LIST, HANDBOOK_EFFECTS } from '../../data/handbook-data';

interface EffectsListProps {
  onSelect: (id: string) => void;
}

export function EffectsList({ onSelect }: EffectsListProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {EFFECT_LIST.map((effectId) => {
        const handbookData = HANDBOOK_EFFECTS[effectId];

        if (!handbookData) return null;

        return (
          <HandbookCard
            key={effectId}
            onClick={() => onSelect(effectId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {/* Иконка */}
            <div
              style={{
                width: 48,
                height: 48,
                background: 'rgba(234, 179, 8, 0.15)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1px solid ${THEME.accent}`,
                fontSize: 24,
                flexShrink: 0,
              }}
            >
              {handbookData.icon}
            </div>

            {/* Контент */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Название */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: THEME.textPrimary,
                  marginBottom: 2,
                }}
              >
                {handbookData.name}
              </div>

              {/* Русское название */}
              <div
                style={{
                  fontSize: 11,
                  color: THEME.accent,
                  marginBottom: 4,
                }}
              >
                {handbookData.nameRu}
              </div>

              {/* Описание */}
              <div
                style={{
                  fontSize: 12,
                  color: THEME.textMuted,
                  lineHeight: 1.4,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {handbookData.description}
              </div>
            </div>

            {/* Стрелка */}
            <div
              style={{
                color: THEME.textMuted,
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              →
            </div>
          </HandbookCard>
        );
      })}
    </div>
  );
}
