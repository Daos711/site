'use client';

import React from 'react';
import { THEME } from '../../theme';
import { ENEMIES } from '../../types';
import { BackButton, DetailSection, RoleBadge, StatGrid, BulletList } from './HandbookCard';
import {
  ENEMY_LIST,
  HANDBOOK_ENEMIES,
  ENEMY_CATEGORY_LABELS,
  ENEMY_CATEGORY_COLORS,
  TAG_LABELS_RU,
  HANDBOOK_EFFECTS,
} from '../../data/handbook-data';

interface EnemyDetailProps {
  enemyId: string;
  onBack: () => void;
}

export function EnemyDetail({ enemyId, onBack }: EnemyDetailProps) {
  const config = ENEMIES[enemyId as keyof typeof ENEMIES];
  const handbookData = HANDBOOK_ENEMIES[enemyId];

  if (!config || !handbookData) {
    return (
      <div>
        <BackButton onClick={onBack} />
        <p style={{ color: THEME.textMuted }}>Враг не найден</p>
      </div>
    );
  }

  const categoryColor = ENEMY_CATEGORY_COLORS[handbookData.category];
  const currentIndex = ENEMY_LIST.indexOf(enemyId);

  // Определяем урон по жизням
  const liveDamage = handbookData.category === 'boss' ? 3 : 1;

  const stats = [
    { icon: '❤️', value: config.baseHp, label: 'HP' },
    { icon: '🏃', value: config.speed.toFixed(1), label: 'Скор.' },
    { icon: '💀', value: liveDamage, label: 'Урон' },
  ];

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
        {/* Код врага */}
        <div
          style={{
            fontSize: 10,
            color: THEME.textMuted,
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}
        >
          ВРАГ #{String(currentIndex + 1).padStart(3, '0')}
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
          {config.icon}
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
          {handbookData.name.toUpperCase()}
        </h2>

        {/* Категория */}
        <RoleBadge
          role={ENEMY_CATEGORY_LABELS[handbookData.category]}
          color={categoryColor}
        />
      </div>

      {/* Характеристики */}
      <DetailSection title="Характеристики">
        <StatGrid stats={stats} />
      </DetailSection>

      {/* Тег */}
      {handbookData.tag && (
        <DetailSection title={`Тег: ${(TAG_LABELS_RU[handbookData.tag] || handbookData.tag).toUpperCase()}`}>
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
      )}

      {/* Описание (если нет тега) */}
      {!handbookData.tag && (
        <DetailSection title="Описание">
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
      )}

      {/* Иммунитеты */}
      {handbookData.immunities.length > 0 && (
        <DetailSection title="Иммунитеты">
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

      {/* Как контрить */}
      <DetailSection title="Как контрить">
        <BulletList items={handbookData.counters} color="#7BC96F" />
      </DetailSection>

      {/* Эффекты */}
      {handbookData.effects && (
        <>
          {/* Создаёт эффекты */}
          {handbookData.effects.gives && handbookData.effects.gives.length > 0 && (
            <DetailSection title="Создаёт эффекты">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {handbookData.effects.gives.map((effectId, i) => {
                  const effect = HANDBOOK_EFFECTS[effectId];
                  if (!effect) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {effect.icon} {effect.name}
                    </div>
                  );
                })}
              </div>
            </DetailSection>
          )}

          {/* Иммунитеты врага */}
          {handbookData.effects.immunities && handbookData.effects.immunities.length > 0 && (
            <DetailSection title="Иммунитеты к эффектам">
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
                      🛡️ {effect.name}
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
            const prevIndex = (currentIndex - 1 + ENEMY_LIST.length) % ENEMY_LIST.length;
            onBack();
            setTimeout(() => {
              const event = new CustomEvent('handbook-navigate', {
                detail: { type: 'enemy', id: ENEMY_LIST[prevIndex] },
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
            const nextIndex = (currentIndex + 1) % ENEMY_LIST.length;
            onBack();
            setTimeout(() => {
              const event = new CustomEvent('handbook-navigate', {
                detail: { type: 'enemy', id: ENEMY_LIST[nextIndex] },
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
