'use client';

import React from 'react';
import { THEME } from '../../theme';

interface HandbookCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
}

export function HandbookCard({ children, onClick, selected, style }: HandbookCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? 'rgba(234, 179, 8, 0.15)' : 'rgba(17, 24, 36, 0.85)',
        border: `1px solid ${selected ? THEME.accent : THEME.border}`,
        borderRadius: 12,
        padding: 12,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// Секция в детальном виде
interface DetailSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <div
      style={{
        background: 'rgba(17, 24, 36, 0.6)',
        border: `1px solid ${THEME.border}`,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <h3
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: THEME.textMuted,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          margin: '0 0 12px 0',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

// Бейдж роли
interface RoleBadgeProps {
  role: string;
  color: string;
  small?: boolean;
}

export function RoleBadge({ role, color, small }: RoleBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: small ? '2px 6px' : '4px 10px',
        background: `${color}22`,
        border: `1px solid ${color}`,
        borderRadius: 6,
        color: color,
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        letterSpacing: '0.05em',
      }}
    >
      {role}
    </span>
  );
}

// Статы в сетке
interface StatGridProps {
  stats: { icon: string; value: string | number; label: string }[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)`,
        gap: 8,
      }}
    >
      {stats.map((stat, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(17, 24, 36, 0.8)',
            border: `1px solid ${THEME.border}`,
            borderRadius: 8,
            padding: '10px 8px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 4 }}>{stat.icon}</div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: THEME.textPrimary,
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontSize: 10,
              color: THEME.textMuted,
              marginTop: 2,
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// Кнопка "Назад"
interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = 'Назад' }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'none',
        border: 'none',
        color: THEME.textSecondary,
        fontSize: 14,
        cursor: 'pointer',
        padding: '8px 0',
        marginBottom: 12,
      }}
    >
      <span style={{ fontSize: 18 }}>←</span>
      {label}
    </button>
  );
}

// Список пунктов
interface BulletListProps {
  items: string[];
  color?: string;
}

export function BulletList({ items, color = THEME.textSecondary }: BulletListProps) {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: 8,
            fontSize: 13,
            color,
            lineHeight: 1.5,
            marginBottom: 6,
          }}
        >
          <span style={{ color: THEME.accent }}>•</span>
          {item}
        </li>
      ))}
    </ul>
  );
}
