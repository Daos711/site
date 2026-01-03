'use client';

import React from 'react';
import { ModuleType, MODULES } from '../types';
import { MODULE_ROLES, ROLE_COLORS } from '../data/handbook-data';

interface ModuleDeckIconsProps {
  modules: (ModuleType | string)[]; // ["laser", "cooler", ...]
  size?: number; // размер иконки (по умолчанию 20px)
  gap?: number; // gap между иконками (по умолчанию 4px)
  showTooltip?: boolean; // показывать тултип при hover
}

export function ModuleDeckIcons({
  modules,
  size = 20,
  gap = 4,
  showTooltip = true,
}: ModuleDeckIconsProps) {
  return (
    <div className="flex items-center" style={{ gap: `${gap}px` }}>
      {modules.map((moduleType, index) => {
        const config = MODULES[moduleType as ModuleType];
        if (!config) {
          return (
            <div
              key={index}
              style={{
                width: size,
                height: size,
                background: '#4A5568',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.6,
              }}
            >
              ?
            </div>
          );
        }

        const role = MODULE_ROLES[moduleType as ModuleType];
        const roleColor = role ? ROLE_COLORS[role] : '#6B7280';

        return (
          <div
            key={index}
            className="relative group"
            style={{ width: size, height: size }}
          >
            {/* Иконка модуля */}
            <div
              style={{
                width: size,
                height: size,
                background: `${roleColor}20`,
                border: `1px solid ${roleColor}`,
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: size * 0.7,
              }}
            >
              {config.icon}
            </div>

            {/* Тултип при hover */}
            {showTooltip && (
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
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.15s ease',
                  zIndex: 50,
                }}
                className="group-hover:opacity-100"
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
      })}
    </div>
  );
}

// Компактный вариант для мобилок
export function ModuleDeckIconsCompact({
  modules,
}: {
  modules: (ModuleType | string)[];
}) {
  return <ModuleDeckIcons modules={modules} size={16} gap={2} showTooltip={false} />;
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
      <div className="flex flex-wrap gap-2">
        {modules.map((moduleType, index) => {
          const config = MODULES[moduleType as ModuleType];
          if (!config) return null;

          const role = MODULE_ROLES[moduleType as ModuleType];
          const roleColor = role ? ROLE_COLORS[role] : '#6B7280';

          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 8px',
                background: `${roleColor}15`,
                border: `1px solid ${roleColor}40`,
                borderRadius: 6,
              }}
            >
              <span style={{ fontSize: 18 }}>{config.icon}</span>
              <span style={{ fontSize: 12, color: '#C5D1DE' }}>{config.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return <ModuleDeckIcons modules={modules} size={28} gap={6} showTooltip={true} />;
}
