'use client';

import React, { useState } from 'react';
import { THEME } from '../../theme';
import { MODULES, ModuleType, MODULE_PALETTE, getDamage, getEffectDuration, getEffectStrength } from '../../types';
import { ModuleIcon } from '../ModuleIcons';
import { BackButton, DetailSection, RoleBadge, StatGrid, BulletList } from './HandbookCard';
import {
  MODULE_ROLES,
  ROLE_COLORS,
  ROLE_LABELS,
  ATTACK_TYPE_LABELS,
  HANDBOOK_MODULES,
  MODULE_LIST,
  HANDBOOK_EFFECTS,
} from '../../data/handbook-data';

interface ModuleDetailProps {
  moduleId: ModuleType;
  onBack: () => void;
}

export function ModuleDetail({ moduleId, onBack }: ModuleDetailProps) {
  const [level, setLevel] = useState(1);

  const config = MODULES[moduleId];
  const handbookData = HANDBOOK_MODULES[moduleId];
  const role = MODULE_ROLES[moduleId];
  const palette = MODULE_PALETTE[moduleId];

  // Рассчитываем статы для текущего уровня
  const damage = getDamage(config.baseDamage, level);
  const price = config.basePrice; // Цена фиксирована, не меняется с уровнем!
  const effectDuration = config.effectDuration ? getEffectDuration(config.effectDuration, level) : null;
  const effectStrength = config.effectStrength ? getEffectStrength(config.effectStrength, level) : null;

  // Индекс модуля для навигации
  const currentIndex = MODULE_LIST.indexOf(moduleId);

  // Основные статы
  const stats: { icon: string; value: string | number; label: string }[] = [
    { icon: '💰', value: price, label: 'Цена' },
    { icon: '💥', value: damage, label: 'Урон' },
    { icon: '📡', value: config.range, label: 'Дальн.' },
    { icon: '⏱', value: config.attackSpeed, label: 'Скор.' },
  ];

  // Добавляем эффект если есть
  if (effectDuration) {
    stats.push({ icon: '⏳', value: `${(effectDuration / 1000).toFixed(1)}с`, label: 'Эффект' });
  }
  if (effectStrength) {
    stats.push({ icon: '⚡', value: `${effectStrength}%`, label: 'Сила' });
  }

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
        {/* Код модуля */}
        <div
          style={{
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}
        >
          МОДУЛЬ #{String(currentIndex + 1).padStart(3, '0')}
        </div>

        {/* Иконка */}
        <div
          style={{
            width: 80,
            height: 80,
            margin: '0 auto 12px',
            background: palette.dark,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${palette.light}`,
            boxShadow: `0 0 20px ${palette.glow}`,
          }}
        >
          <div style={{ width: 52, height: 52 }}>
            <ModuleIcon type={moduleId} />
          </div>
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
          {config.name.toUpperCase()}
        </h2>

        {/* Роль */}
        <RoleBadge role={ROLE_LABELS[role]} color={ROLE_COLORS[role]} />
      </div>

      {/* Селектор уровня */}
      <DetailSection title="Уровень">
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {[1, 2, 3, 4, 5].map((lvl) => {
            const isActive = level === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                style={{
                  width: 44,
                  height: 44,
                  background: isActive ? THEME.accent : 'rgba(17, 24, 36, 0.8)',
                  border: `1px solid ${isActive ? THEME.accent : THEME.border}`,
                  borderRadius: 8,
                  color: isActive ? '#000' : THEME.textSecondary,
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {lvl}
              </button>
            );
          })}
        </div>
      </DetailSection>

      {/* Характеристики */}
      <DetailSection title="Характеристики">
        <StatGrid stats={stats.slice(0, 6)} />
      </DetailSection>

      {/* Способность */}
      <DetailSection title="Способность">
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
        {handbookData.keyEffect && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: `1px solid ${THEME.accent}`,
              borderRadius: 8,
              fontSize: 12,
              color: THEME.accent,
            }}
          >
            ⚡ Ключевой эффект: {handbookData.keyEffect}
          </div>
        )}
      </DetailSection>

      {/* Синергии */}
      {handbookData.synergies.length > 0 && (
        <DetailSection title="Синергии">
          <BulletList items={handbookData.synergies} color="#7BC96F" />
        </DetailSection>
      )}

      {/* Примечания */}
      {handbookData.notes.length > 0 && (
        <DetailSection title="Примечания">
          <BulletList items={handbookData.notes} />
        </DetailSection>
      )}

      {/* Эффекты */}
      {handbookData.effects && (
        <>
          {/* Накладывает эффекты */}
          {handbookData.effects.gives && handbookData.effects.gives.length > 0 && (
            <DetailSection title="Накладывает эффекты">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {handbookData.effects.gives.map((effectId, i) => {
                  const effect = HANDBOOK_EFFECTS[effectId];
                  if (!effect) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#3b82f6',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {effect.icon} {effect.nameRu}
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          )}

          {/* Иммунитеты модуля */}
          {handbookData.effects.immunities && handbookData.effects.immunities.length > 0 && (
            <DetailSection title="Иммунитеты">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {handbookData.effects.immunities.map((effectId, i) => {
                  const effect = HANDBOOK_EFFECTS[effectId];
                  if (!effect) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#a855f7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      🛡️ {effect.nameRu}
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          )}
        </>
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
            const prevIndex = (currentIndex - 1 + MODULE_LIST.length) % MODULE_LIST.length;
            onBack();
            // Нужен небольшой хак для навигации - вызываем через timeout
            setTimeout(() => {
              const event = new CustomEvent('handbook-navigate', {
                detail: { type: 'module', id: MODULE_LIST[prevIndex] },
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
            const nextIndex = (currentIndex + 1) % MODULE_LIST.length;
            onBack();
            setTimeout(() => {
              const event = new CustomEvent('handbook-navigate', {
                detail: { type: 'module', id: MODULE_LIST[nextIndex] },
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
