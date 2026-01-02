'use client';

import React, { useState } from 'react';
import { THEME } from '../../theme';
import { ENEMIES } from '../../types';
import { HandbookCard, RoleBadge } from './HandbookCard';
import {
  ENEMY_LIST,
  HANDBOOK_ENEMIES,
  ENEMY_CATEGORY_LABELS,
  ENEMY_CATEGORY_COLORS,
  EnemyCategory,
  TAG_LABELS_RU,
} from '../../data/handbook-data';

interface EnemiesListProps {
  onSelect: (id: string) => void;
}

const FILTER_OPTIONS: (EnemyCategory | 'all')[] = ['all', 'common', 'elite', 'boss'];

export function EnemiesList({ onSelect }: EnemiesListProps) {
  const [filter, setFilter] = useState<EnemyCategory | 'all'>('all');

  const filteredEnemies = ENEMY_LIST.filter((id) => {
    if (filter === 'all') return true;
    const handbookData = HANDBOOK_ENEMIES[id];
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
          const color = option === 'all' ? THEME.textSecondary : ENEMY_CATEGORY_COLORS[option];
          const label = option === 'all' ? 'ВСЕ' : ENEMY_CATEGORY_LABELS[option].toUpperCase();
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

      {/* Сетка врагов */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {filteredEnemies.map((enemyId) => {
          const config = ENEMIES[enemyId as keyof typeof ENEMIES];
          const handbookData = HANDBOOK_ENEMIES[enemyId];

          if (!config || !handbookData) return null;

          const categoryColor = ENEMY_CATEGORY_COLORS[handbookData.category];

          return (
            <HandbookCard key={enemyId} onClick={() => onSelect(enemyId)}>
              {/* Иконка */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: '0 auto 8px',
                  background: `${categoryColor}22`,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${categoryColor}`,
                  fontSize: 24,
                }}
              >
                {config.icon}
              </div>

              {/* Название */}
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: THEME.textPrimary,
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                {handbookData.name}
              </div>

              {/* HP */}
              <div
                style={{
                  fontSize: 11,
                  color: THEME.textMuted,
                  textAlign: 'center',
                  marginBottom: 6,
                }}
              >
                HP: {config.baseHp}
              </div>

              {/* Тег + иммунитеты */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                }}
              >
                {handbookData.tag && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 4,
                      color: THEME.textMuted,
                    }}
                  >
                    {TAG_LABELS_RU[handbookData.tag] || handbookData.tag}
                  </span>
                )}
                {handbookData.immunities.length > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '2px 6px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: 4,
                      color: '#ef4444',
                    }}
                  >
                    🛡 {handbookData.immunities.length}
                  </span>
                )}
              </div>
            </HandbookCard>
          );
        })}
      </div>
    </div>
  );
}
