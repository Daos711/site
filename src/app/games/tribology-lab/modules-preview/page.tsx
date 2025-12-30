'use client';

import { MODULES, ModuleType, MODULE_UNLOCK_WAVES } from '@/lib/tribology-lab/types';

// Цвета градиентов для карточек модулей
const MODULE_GRADIENTS: Record<ModuleType, { bg: string; border: string }> = {
  magnet: { bg: 'linear-gradient(145deg, #7c3aed 0%, #4c1d95 100%)', border: '#a78bfa' },
  cooler: { bg: 'linear-gradient(145deg, #0ea5e9 0%, #0369a1 100%)', border: '#7dd3fc' },
  filter: { bg: 'linear-gradient(145deg, #f59e0b 0%, #b45309 100%)', border: '#fcd34d' },
  lubricant: { bg: 'linear-gradient(145deg, #a855f7 0%, #7e22ce 100%)', border: '#c4b5fd' },
  ultrasonic: { bg: 'linear-gradient(145deg, #14b8a6 0%, #0f766e 100%)', border: '#5eead4' },
  laser: { bg: 'linear-gradient(145deg, #ef4444 0%, #b91c1c 100%)', border: '#fca5a5' },
};

export default function ModulesPreview() {
  const moduleTypes = Object.keys(MODULES) as ModuleType[];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Модули — Tribology Lab</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {moduleTypes.map(type => {
          const config = MODULES[type];
          const gradient = MODULE_GRADIENTS[type];
          const unlockWave = MODULE_UNLOCK_WAVES[type];

          return (
            <div key={type} className="bg-gray-800 rounded-lg p-6">
              {/* Карточка модуля */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-20 h-28 rounded-lg flex items-center justify-center text-4xl relative overflow-hidden"
                  style={{
                    background: gradient.bg,
                    boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 ${gradient.border}40`,
                    border: `2px solid ${gradient.border}`,
                  }}
                >
                  {/* Блики */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1/3 opacity-20"
                    style={{
                      background: 'linear-gradient(180deg, white 0%, transparent 100%)',
                    }}
                  />
                  <span className="relative z-10 drop-shadow-lg">{config.icon}</span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-bold text-white">{config.name}</span>
                    {unlockWave > 1 && (
                      <span className="px-2 py-0.5 bg-purple-900 text-purple-300 text-xs rounded">
                        Волна {unlockWave}+
                      </span>
                    )}
                  </div>
                  <div className="text-gray-400 text-sm mb-2">{config.description}</div>
                  <div
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium"
                    style={{ background: config.color + '30', color: config.color }}
                  >
                    <span className="text-yellow-500">🪙</span> {config.basePrice}
                  </div>
                </div>
              </div>

              {/* Характеристики */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-700/50 rounded p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">Урон</div>
                  <div className="text-white font-bold">{config.baseDamage}</div>
                </div>
                <div className="bg-gray-700/50 rounded p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">Радиус</div>
                  <div className="text-white font-bold">{config.range}px</div>
                </div>
                <div className="bg-gray-700/50 rounded p-2 text-center">
                  <div className="text-xs text-gray-400 mb-1">Атак/с</div>
                  <div className="text-white font-bold">{config.attackSpeed}</div>
                </div>
              </div>

              {/* Тип атаки */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    background: getAttackTypeColor(config.attackType).bg,
                    color: getAttackTypeColor(config.attackType).text,
                  }}
                >
                  {getAttackTypeName(config.attackType)}
                </span>

                {config.aoeRadius && (
                  <span className="px-2 py-1 bg-teal-900 text-teal-300 rounded text-xs">
                    AOE: {config.aoeRadius}px
                  </span>
                )}

                {config.piercing && (
                  <span className="px-2 py-1 bg-red-900 text-red-300 rounded text-xs">
                    Пробивание
                  </span>
                )}
              </div>

              {/* Эффекты */}
              {config.effectType && (
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      background: getEffectColor(config.effectType).bg,
                      color: getEffectColor(config.effectType).text,
                    }}
                  >
                    {getEffectIcon(config.effectType)} {getEffectName(config.effectType)}
                  </span>
                  <span className="text-gray-400 text-xs">
                    {config.effectStrength}
                    {config.effectType === 'slow' ? '%' : ' HP/с'} / {(config.effectDuration! / 1000).toFixed(1)}с
                  </span>
                </div>
              )}

              {/* Бонусы и штрафы */}
              <div className="flex flex-wrap gap-2">
                {config.tagBonuses && Object.entries(config.tagBonuses).map(([tag, mult]) => (
                  <span key={tag} className="px-2 py-1 bg-green-900/50 text-green-400 rounded text-xs">
                    +{Math.round((mult - 1) * 100)}% vs {getTagName(tag)}
                  </span>
                ))}
                {config.tagPenalties && Object.entries(config.tagPenalties).map(([tag, mult]) => (
                  <span key={tag} className="px-2 py-1 bg-red-900/50 text-red-400 rounded text-xs">
                    {Math.round((mult - 1) * 100)}% vs {getTagName(tag)}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Легенда */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4">Система уровней</h2>
        <div className="text-gray-400 text-sm space-y-2">
          <p>Модули можно объединять для повышения уровня (макс. 5):</p>
          <div className="flex flex-wrap gap-4 mt-3">
            <span className="px-3 py-1 bg-gray-700 rounded">Уровень 1: x1.0</span>
            <span className="px-3 py-1 bg-gray-600 rounded">Уровень 2: x1.5</span>
            <span className="px-3 py-1 bg-gray-500 rounded">Уровень 3: x2.25</span>
            <span className="px-3 py-1 bg-yellow-700 rounded">Уровень 4: x3.4</span>
            <span className="px-3 py-1 bg-yellow-600 text-black rounded">Уровень 5: x5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getAttackTypeName(type?: string): string {
  switch (type) {
    case 'beam': return 'Луч';
    case 'projectile': return 'Снаряд';
    case 'wave': return 'Волна';
    case 'aoe': return 'Область';
    default: return 'Обычный';
  }
}

function getAttackTypeColor(type?: string) {
  switch (type) {
    case 'beam': return { bg: '#dc262630', text: '#fca5a5' };
    case 'projectile': return { bg: '#3b82f630', text: '#93c5fd' };
    case 'wave': return { bg: '#f59e0b30', text: '#fcd34d' };
    case 'aoe': return { bg: '#14b8a630', text: '#5eead4' };
    default: return { bg: '#6b728030', text: '#d1d5db' };
  }
}

function getEffectName(type: string): string {
  switch (type) {
    case 'slow': return 'Замедление';
    case 'burn': return 'Ожог';
    default: return type;
  }
}

function getEffectIcon(type: string): string {
  switch (type) {
    case 'slow': return '🐢';
    case 'burn': return '🔥';
    default: return '✨';
  }
}

function getEffectColor(type: string) {
  switch (type) {
    case 'slow': return { bg: '#0ea5e930', text: '#7dd3fc' };
    case 'burn': return { bg: '#ef444430', text: '#fca5a5' };
    default: return { bg: '#6b728030', text: '#d1d5db' };
  }
}

function getTagName(tag: string): string {
  switch (tag) {
    case 'metal': return 'металл';
    case 'hot': return 'горячие';
    case 'dusty': return 'пыльные';
    case 'wet': return 'мокрые';
    case 'organic': return 'органика';
    default: return tag;
  }
}
