'use client';

import React, { useState } from 'react';
import { THEME } from '../../theme';
import { HandbookTabs, TabType } from './HandbookTabs';
import { ModulesList } from './ModulesList';
import { ModuleDetail } from './ModuleDetail';
import { EnemiesList } from './EnemiesList';
import { EnemyDetail } from './EnemyDetail';
import { EffectsList } from './EffectsList';
import { EffectDetail } from './EffectDetail';
import { ModuleType } from '../../types';

interface HandbookProps {
  onClose: () => void;
}

type ViewState =
  | { view: 'list' }
  | { view: 'module'; id: ModuleType }
  | { view: 'enemy'; id: string }
  | { view: 'effect'; id: string };

export function Handbook({ onClose }: HandbookProps) {
  const [activeTab, setActiveTab] = useState<TabType>('modules');
  const [viewState, setViewState] = useState<ViewState>({ view: 'list' });

  const handleBack = () => {
    setViewState({ view: 'list' });
  };

  const handleSelectModule = (id: ModuleType) => {
    setViewState({ view: 'module', id });
  };

  const handleSelectEnemy = (id: string) => {
    setViewState({ view: 'enemy', id });
  };

  const handleSelectEffect = (id: string) => {
    setViewState({ view: 'effect', id });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setViewState({ view: 'list' });
  };

  const renderContent = () => {
    // Детальные вьюхи
    if (viewState.view === 'module') {
      return <ModuleDetail moduleId={viewState.id} onBack={handleBack} />;
    }
    if (viewState.view === 'enemy') {
      return <EnemyDetail enemyId={viewState.id} onBack={handleBack} />;
    }
    if (viewState.view === 'effect') {
      return <EffectDetail effectId={viewState.id} onBack={handleBack} />;
    }

    // Списки
    switch (activeTab) {
      case 'modules':
        return <ModulesList onSelect={handleSelectModule} />;
      case 'enemies':
        return <EnemiesList onSelect={handleSelectEnemy} />;
      case 'effects':
        return <EffectsList onSelect={handleSelectEffect} />;
    }
  };

  const content = (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        paddingTop: '60px',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(17, 24, 36, 0.95)',
          borderBottom: `1px solid ${THEME.border}`,
          zIndex: 10,
        }}
      >
        {/* Кнопка "В меню" */}
        <button
          onClick={onClose}
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
          }}
        >
          ← В меню
        </button>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: THEME.textPrimary,
            margin: 0,
            letterSpacing: '0.05em',
          }}
        >
          СПРАВОЧНИК
        </h1>

        {/* Пустой элемент для центрирования заголовка */}
        <div style={{ width: 70 }} />
      </div>

      {/* Tabs - показываем только в режиме списка */}
      {viewState.view === 'list' && (
        <HandbookTabs activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          marginTop: viewState.view === 'list' ? 16 : 0,
        }}
      >
        {renderContent()}
      </div>
    </div>
  );

  // Всегда рендерим как оверлей ниже хедера сайта
  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(10, 15, 25, 0.99)',
        zIndex: 50,
      }}
    >
      {content}
    </div>
  );
}
