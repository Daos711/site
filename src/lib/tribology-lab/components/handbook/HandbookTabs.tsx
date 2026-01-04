'use client';

import React from 'react';
import { THEME } from '../../theme';

export type TabType = 'modules' | 'enemies' | 'effects';

interface HandbookTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'modules', label: 'МОДУЛИ', icon: '🔧' },
  { id: 'enemies', label: 'ВРАГИ', icon: '👾' },
  { id: 'effects', label: 'ЭФФЕКТЫ', icon: '✨' },
];

export function HandbookTabs({ activeTab, onTabChange }: HandbookTabsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '4px',
        background: 'rgba(17, 24, 36, 0.6)',
        borderRadius: 12,
        border: `1px solid ${THEME.border}`,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '10px 12px',
              background: isActive ? THEME.accent : 'transparent',
              border: 'none',
              borderRadius: 8,
              color: isActive ? '#000' : THEME.textSecondary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
