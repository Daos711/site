'use client';

import React, { useState } from 'react';
import { ModuleType, MODULES, MODULE_PALETTE } from '../types';
import { MODULE_ROLES, ROLE_COLORS } from '../data/handbook-data';
import { ModuleIcon } from './ModuleIcons';

interface ModuleDeckIconsProps {
  modules: (ModuleType | string)[]; // ["laser", "cooler", ...]
  size?: number; // размер иконки (по умолчанию 24px)
  gap?: number; // gap между иконками (по умолчанию 4px)
  showTooltip?: boolean; // показывать тултип при hover
}

// Отдельный компонент для иконки с тултипом
function ModuleIconWithTooltip({
  moduleType,
  size,
  showTooltip,
}: {
  moduleType: ModuleType | string;
  size: number;
  showTooltip: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const config = MODULES[moduleType as ModuleType];
  const palette = MODULE_PALETTE[moduleType as ModuleType];

  if (!config || !palette) {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: '#4A5568',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          color: '#9CA3AF',
        }}
      >
        ?
      </div>
    );
  }

  return (
    <div
      style={{ position: 'relative', width: size, height: size }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Иконка модуля — SVG */}
      <div
        style={{
          width: size,
          height: size,
          background: palette.dark,
          border: `1px solid ${palette.light}`,
          borderRadius: 4,
          padding: 2,
          boxSizing: 'border-box',
        }}
      >
        <ModuleIcon type={moduleType as ModuleType} />
      </div>

      {/* Тултип при hover */}
      {showTooltip && isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 8,
            padding: '4px 8px',
            background: '#1A202C',
            border: '1px solid #4A5568',
            color: '#E5E7EB',
            fontSize: 11,
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {config.name}
          {/* Стрелка */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              borderWidth: 4,
              borderStyle: 'solid',
              borderColor: '#4A5568 transparent transparent transparent',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ModuleDeckIcons({
  modules,
  size = 24,
  gap = 4,
  showTooltip = true,
}: ModuleDeckIconsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${gap}px` }}>
      {modules.map((moduleType, index) => (
        <ModuleIconWithTooltip
          key={index}
          moduleType={moduleType}
          size={size}
          showTooltip={showTooltip}
        />
      ))}
    </div>
  );
}

// Компактный вариант для мобилок
export function ModuleDeckIconsCompact({
  modules,
}: {
  modules: (ModuleType | string)[];
}) {
  return <ModuleDeckIcons modules={modules} size={20} gap={2} showTooltip={false} />;
}

// Крупный вариант для заголовков
export function ModuleDeckIconsLarge({
  modules,
  showNames = false,
}: {
  modules: (ModuleType | string)[];
  showNames?: boolean;
}) {
  if (showNames) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {modules.map((moduleType, index) => {
          const config = MODULES[moduleType as ModuleType];
          const palette = MODULE_PALETTE[moduleType as ModuleType];
          if (!config || !palette) return null;

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: `${palette.dark}`,
                border: `1px solid ${palette.light}40`,
                borderRadius: 6,
              }}
            >
              <div style={{ width: 20, height: 20 }}>
                <ModuleIcon type={moduleType as ModuleType} />
              </div>
              <span style={{ fontSize: 12, color: '#C5D1DE' }}>{config.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return <ModuleDeckIcons modules={modules} size={28} gap={6} showTooltip={true} />;
}
