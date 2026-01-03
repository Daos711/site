'use client';

import React, { useState } from 'react';
import { THEME } from '../../theme';
import { MODULES, ModuleType, MODULE_PALETTE } from '../../types';
import { ModuleIcon } from '../ModuleIcons';
import { HandbookCard, RoleBadge } from './HandbookCard';
import {
  MODULE_LIST,
  MODULE_ROLES,
  ROLE_COLORS,
  ROLE_LABELS,
  ATTACK_TYPE_LABELS,
  HANDBOOK_MODULES,
  ModuleRole,
} from '../../data/handbook-data';

interface ModulesListProps {
  onSelect: (id: ModuleType) => void;
}

const FILTER_OPTIONS: (ModuleRole | 'all')[] = ['all', 'DPS', 'Control', 'Support'];

export function ModulesList({ onSelect }: ModulesListProps) {
  const [filter, setFilter] = useState<ModuleRole | 'all'>('all');

  const filteredModules = MODULE_LIST.filter((id) => {
    if (filter === 'all') return true;
    return MODULE_ROLES[id] === filter;
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
          const color = option === 'all' ? THEME.textSecondary : ROLE_COLORS[option];
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
              {option === 'all' ? 'ВСЕ' : ROLE_LABELS[option].toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Сетка модулей */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
        }}
      >
        {filteredModules.map((moduleId) => {
          const config = MODULES[moduleId];
          const handbookData = HANDBOOK_MODULES[moduleId];
          const role = MODULE_ROLES[moduleId];
          const palette = MODULE_PALETTE[moduleId];

          return (
            <HandbookCard key={moduleId} onClick={() => onSelect(moduleId)}>
              {/* Иконка */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: '0 auto 8px',
                  background: palette.dark,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${palette.light}`,
                }}
              >
                <div style={{ width: 32, height: 32 }}>
                  <ModuleIcon type={moduleId} />
                </div>
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
                {config.name}
              </div>

              {/* Роль + тип атаки */}
              <div
                style={{
                  fontSize: 10,
                  color: THEME.textMuted,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: ROLE_COLORS[role] }}>{ROLE_LABELS[role]}</span>
                {' • '}
                {ATTACK_TYPE_LABELS[handbookData.attackType] || handbookData.attackType}
              </div>

              {/* Мини-статы */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 10,
                  color: THEME.textMuted,
                }}
              >
                <span>💥{config.baseDamage}</span>
                <span>⏱{config.attackSpeed}</span>
              </div>
            </HandbookCard>
          );
        })}
      </div>
    </div>
  );
}
