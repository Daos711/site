'use client';

import React, { useState } from 'react';
import { THEME } from '../../theme';
import { HandbookCard } from './HandbookCard';
import {
  EFFECT_LIST,
  HANDBOOK_EFFECTS,
  EffectCategory,
  EFFECT_CATEGORY_LABELS,
  EFFECT_CATEGORY_COLORS,
} from '../../data/handbook-data';

interface EffectsListProps {
  onSelect: (id: string) => void;
}

const FILTER_OPTIONS: (EffectCategory | 'all')[] = ['all', 'status', 'module_debuff', 'module_buff', 'immunity'];

export function EffectsList({ onSelect }: EffectsListProps) {
  const [filter, setFilter] = useState<EffectCategory | 'all'>('all');

  const filteredEffects = EFFECT_LIST.filter((id) => {
    if (filter === 'all') return true;
    const handbookData = HANDBOOK_EFFECTS[id];
    return handbookData?.category === filter;
  });

  return (
    <div>
      {/* Фильтр */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {FILTER_OPTIONS.map((option) => {
          const isActive = filter === option;
          const color = option === 'all' ? THEME.textSecondary : EFFECT_CATEGORY_COLORS[option];
          const label = option === 'all' ? 'ВСЕ' : EFFECT_CATEGORY_LABELS[option].toUpperCase();
          return (
            <button
              key={option}
              onClick={() => setFilter(option)}
              style={{
                padding: '6px 12px',
                background: isActive ? `${color}22` : 'transparent',
                border: `1px solid ${isActive ? color : THEME.border}`,
                borderRadius: 16,
                color: isActive ? color : THEME.textMuted,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Список эффектов */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {filteredEffects.map((effectId) => {
          const handbookData = HANDBOOK_EFFECTS[effectId];

          if (!handbookData) return null;

          const categoryColor = EFFECT_CATEGORY_COLORS[handbookData.category];

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
                  background: `${categoryColor}22`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${categoryColor}`,
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                {handbookData.icon}
              </div>

              {/* Контент */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Название + категория */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: THEME.textPrimary,
                    }}
                  >
                    {handbookData.name}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: `${categoryColor}22`,
                      borderRadius: 4,
                      color: categoryColor,
                    }}
                  >
                    {EFFECT_CATEGORY_LABELS[handbookData.category]}
                  </span>
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
    </div>
  );
}
