'use client';

import { ENEMIES, EnemyType } from '@/lib/tribology-lab/types';

export default function EnemiesPreview() {
  const enemyTypes = Object.keys(ENEMIES) as EnemyType[];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Враги — Tribology Lab</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enemyTypes.map(type => {
          const config = ENEMIES[type];
          const size = config.size;

          return (
            <div key={type} className="bg-gray-800 rounded-lg p-6 flex items-center gap-6">
              {/* SVG preview */}
              <svg width={80} height={80} viewBox="-40 -40 80 80">
                <defs>
                  <radialGradient id={`heatGradient-${type}`}>
                    <stop offset="0%" stopColor="#ffcc00" />
                    <stop offset="50%" stopColor="#ff6600" />
                    <stop offset="100%" stopColor="#cc3300" />
                  </radialGradient>
                  <radialGradient id={`metalGradient-${type}`}>
                    <stop offset="0%" stopColor="#6a6a6a" />
                    <stop offset="50%" stopColor="#4a4a4a" />
                    <stop offset="100%" stopColor="#2a2a2a" />
                  </radialGradient>
                  <radialGradient id={`pittingGradient-${type}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4a5568" />
                    <stop offset="100%" stopColor="#1a202c" />
                  </radialGradient>
                  <linearGradient id={`dropGradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.9" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.5" />
                  </linearGradient>
                  {/* Мягкий ореол для перегрева */}
                  <radialGradient id={`heatHaze-${type}`}>
                    <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.4" />
                    <stop offset="70%" stopColor="#ff6b35" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
                  </radialGradient>
                  {/* Свечение для статики */}
                  <radialGradient id={`sparkGlow-${type}`}>
                    <stop offset="0%" stopColor="#facc15" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Контактная тень */}
                <ellipse cx={0} cy={size * 0.5} rx={size * 0.8} ry={size * 0.25} fill="rgba(0,0,0,0.4)" />

                {/* ===== ПЫЛЬ (dust) ===== */}
                {type === 'dust' && (
                  <g opacity={0.85}>
                    <circle cx={-size*0.4} cy={-size*0.3} r={size*0.5} fill="#9ca3af" opacity={0.5} />
                    <circle cx={size*0.3} cy={-size*0.2} r={size*0.4} fill="#a3a8b0" opacity={0.6} />
                    <circle cx={0} cy={size*0.2} r={size*0.6} fill="#8b9099" opacity={0.7} />
                    <circle cx={-size*0.3} cy={size*0.4} r={size*0.35} fill="#9ca3af" opacity={0.4} />
                    <circle cx={size*0.4} cy={size*0.3} r={size*0.3} fill="#b0b5bd" opacity={0.5} />
                    {/* Дымка */}
                    <circle cx={0} cy={0} r={size*1.2} fill="rgba(156,163,175,0.15)" />
                    {/* Микрочастицы-спутники */}
                    <circle cx={size*0.9} cy={-size*0.2} r={2} fill="#9ca3af" opacity={0.4} />
                    <circle cx={-size*0.7} cy={size*0.6} r={1.5} fill="#a3a8b0" opacity={0.3} />
                    <circle cx={size*0.5} cy={size*0.7} r={2} fill="#8b9099" opacity={0.35} />
                    <circle cx={-size*1.0} cy={-size*0.1} r={1} fill="#9ca3af" opacity={0.25} />
                  </g>
                )}

                {/* ===== АБРАЗИВ (shard) ===== */}
                {config.shape === 'shard' && (
                  <g>
                    <polygon
                      points={`
                        0,${-size}
                        ${size*0.7},${-size*0.3}
                        ${size*0.8},${size*0.4}
                        ${size*0.2},${size*0.85}
                        ${-size*0.5},${size*0.6}
                        ${-size*0.85},${size*0.1}
                        ${-size*0.6},${-size*0.5}
                      `}
                      fill="#a67c52"
                      stroke="#8b6914"
                      strokeWidth={1}
                    />
                    {/* Сколы по краю */}
                    <polygon
                      points={`${size*0.6},${-size*0.4} ${size*0.75},${-size*0.25} ${size*0.55},${-size*0.2}`}
                      fill="#8b6914"
                    />
                    <polygon
                      points={`${-size*0.7},${size*0.3} ${-size*0.85},${size*0.45} ${-size*0.6},${size*0.5}`}
                      fill="#7a5c30"
                    />
                    {/* Матовые пятна/включения */}
                    <circle cx={-size*0.2} cy={0} r={size*0.18} fill="#7a5c30" opacity={0.5} />
                    <circle cx={size*0.25} cy={size*0.25} r={size*0.12} fill="#6b4d25" opacity={0.4} />
                    <circle cx={size*0.1} cy={-size*0.4} r={size*0.1} fill="#5c4020" opacity={0.3} />
                    <circle cx={size*0.4} cy={-size*0.2} r={size*0.08} fill="#5c4020" opacity={0.5} />
                    {/* Масляный блик сверху */}
                    <path
                      d={`M ${-size*0.4} ${-size*0.7} Q 0 ${-size*0.9} ${size*0.5} ${-size*0.5}`}
                      fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} strokeLinecap="round"
                    />
                  </g>
                )}

                {/* ===== ПЕРЕГРЕВ (heat) ===== */}
                {type === 'heat' && (
                  <g>
                    {/* Мягкий тепловой ореол (градиентное свечение) */}
                    <circle cx={0} cy={0} r={size * 1.8} fill={`url(#heatHaze-${type})`} opacity={0.5}>
                      <animate attributeName="r" values={`${size*1.5};${size*2.0};${size*1.5}`} dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.15;0.4" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    {/* Основной пузырь */}
                    <ellipse cx={0} cy={0} rx={size*0.9} ry={size} fill={`url(#heatGradient-${type})`} />
                    {/* Яркое ядро */}
                    <ellipse cx={0} cy={-size*0.2} rx={size*0.4} ry={size*0.35} fill="#ffdd44" opacity={0.6} />
                    {/* Микропузырьки */}
                    <circle cx={size*0.5} cy={-size*0.4} r={size*0.12} fill="#ffaa00" opacity={0.7}>
                      <animate attributeName="cy" values={`${-size*0.4};${-size*0.8};${-size*0.4}`} dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={-size*0.4} cy={-size*0.2} r={size*0.08} fill="#ff8800" opacity={0.5}>
                      <animate attributeName="cy" values={`${-size*0.2};${-size*0.6};${-size*0.2}`} dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={size*0.2} cy={-size*0.6} r={size*0.06} fill="#ffcc00" opacity={0.6}>
                      <animate attributeName="cy" values={`${-size*0.6};${-size*0.9};${-size*0.6}`} dur="1.8s" repeatCount="indefinite" />
                    </circle>
                    {/* Влажный блик */}
                    <ellipse cx={-size*0.25} cy={-size*0.45} rx={size*0.22} ry={size*0.1} fill="rgba(255,255,255,0.45)" />
                  </g>
                )}

                {/* ===== СТРУЖКА (shavings) ===== */}
                {config.shape === 'shavings' && (
                  <g>
                    {/* Основной завиток */}
                    <path
                      d={`M ${-size*0.8} ${-size*0.3}
                          Q ${-size*0.2} ${-size*0.95} ${size*0.5} ${-size*0.4}
                          Q ${size*0.95} ${0} ${size*0.4} ${size*0.65}`}
                      fill="none"
                      stroke="#b8b8b8"
                      strokeWidth={size * 0.22}
                      strokeLinecap="round"
                    />
                    {/* Второй завиток */}
                    <path
                      d={`M ${-size*0.5} ${size*0.15}
                          Q ${0} ${size*0.75} ${size*0.5} ${size*0.35}`}
                      fill="none"
                      stroke="#a0a0a0"
                      strokeWidth={size * 0.16}
                      strokeLinecap="round"
                    />
                    {/* Маленький завиток-хвостик */}
                    <path
                      d={`M ${size*0.3} ${size*0.5} Q ${size*0.6} ${size*0.8} ${size*0.4} ${size*0.9}`}
                      fill="none"
                      stroke="#909090"
                      strokeWidth={size * 0.1}
                      strokeLinecap="round"
                    />
                    {/* Зеркальный блик */}
                    <path
                      d={`M ${-size*0.65} ${-size*0.4}
                          Q ${-size*0.1} ${-size*1.0} ${size*0.4} ${-size*0.5}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.6)"
                      strokeWidth={size * 0.06}
                      strokeLinecap="round"
                    />
                    {/* Яркий металлический блик (тонкая линия) */}
                    <path
                      d={`M ${-size*0.6} ${-size*0.35} L ${size*0.2} ${-size*0.55}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                    />
                    {/* Тёмная сторона */}
                    <path
                      d={`M ${-size*0.7} ${-size*0.2}
                          Q ${-size*0.3} ${-size*0.7} ${size*0.3} ${-size*0.3}`}
                      fill="none"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth={size * 0.08}
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* ===== КОРРОЗИЯ (blob) ===== */}
                {config.shape === 'blob' && (
                  <g>
                    {/* Основное пятно с рваным краем */}
                    <path
                      d={`M 0 ${-size*0.85}
                          Q ${size*0.3} ${-size*0.9} ${size*0.6} ${-size*0.5}
                          L ${size*0.75} ${-size*0.3}
                          Q ${size*0.9} ${size*0.1} ${size*0.7} ${size*0.5}
                          L ${size*0.5} ${size*0.7}
                          Q ${size*0.2} ${size*0.95} ${-size*0.2} ${size*0.8}
                          L ${-size*0.5} ${size*0.6}
                          Q ${-size*0.85} ${size*0.3} ${-size*0.8} ${-size*0.1}
                          L ${-size*0.7} ${-size*0.4}
                          Q ${-size*0.6} ${-size*0.8} ${-size*0.2} ${-size*0.9}
                          Z`}
                      fill="#4a7c59"
                      stroke="#3d5c45"
                      strokeWidth={1}
                    />
                    {/* Тёмные язвы */}
                    <ellipse cx={-size*0.25} cy={-size*0.15} rx={size*0.18} ry={size*0.12} fill="#2a4a35" />
                    <ellipse cx={size*0.3} cy={size*0.15} rx={size*0.14} ry={size*0.1} fill="#1f3d2a" />
                    <ellipse cx={-size*0.1} cy={size*0.45} rx={size*0.12} ry={size*0.08} fill="#2a4a35" />
                    <ellipse cx={size*0.15} cy={-size*0.4} rx={size*0.1} ry={size*0.07} fill="#234a30" />
                    <ellipse cx={size*0.45} cy={-size*0.1} rx={size*0.08} ry={size*0.06} fill="#1f3d2a" />
                    {/* Токсичные пузырьки */}
                    <circle cx={size*0.55} cy={-size*0.35} r={size*0.08} fill="#6aac79" opacity={0.6} />
                    <circle cx={-size*0.5} cy={size*0.35} r={size*0.06} fill="#7abc89" opacity={0.5} />
                    <circle cx={size*0.2} cy={size*0.55} r={size*0.05} fill="#5a9c69" opacity={0.5} />
                    {/* Подтёк снизу */}
                    <path
                      d={`M ${size*0.1} ${size*0.75} Q ${size*0.15} ${size*1.0} ${size*0.05} ${size*1.15}`}
                      fill="none" stroke="#3d5c45" strokeWidth={3} strokeLinecap="round" opacity={0.6}
                    />
                    <path
                      d={`M ${-size*0.3} ${size*0.7} Q ${-size*0.35} ${size*0.9} ${-size*0.25} ${size*1.0}`}
                      fill="none" stroke="#3d5c45" strokeWidth={2} strokeLinecap="round" opacity={0.4}
                    />
                  </g>
                )}

                {/* ===== ВЛАГА (moisture) ===== */}
                {type === 'moisture' && (
                  <g>
                    {/* Основная капля */}
                    <ellipse cx={0} cy={size*0.1} rx={size*0.75} ry={size} fill={`url(#dropGradient-${type})`} />
                    {/* Рефракция/линза */}
                    <ellipse cx={0} cy={size*0.2} rx={size*0.5} ry={size*0.7} fill="rgba(255,255,255,0.1)" />
                    {/* Широкий слабый блик */}
                    <ellipse cx={-size*0.15} cy={-size*0.3} rx={size*0.35} ry={size*0.15} fill="rgba(255,255,255,0.2)" />
                    {/* Маленький яркий блик */}
                    <ellipse cx={-size*0.2} cy={-size*0.5} rx={size*0.12} ry={size*0.06} fill="rgba(255,255,255,0.7)" />
                  </g>
                )}

                {/* ===== СТАТИКА (spark) ===== */}
                {config.shape === 'spark' && (
                  <g>
                    <animate attributeName="opacity" values="0.9;0.4;1;0.6;0.9" dur="0.3s" repeatCount="indefinite" />
                    {/* Glow-подложка */}
                    <circle cx={0} cy={0} r={size*1.5} fill={`url(#sparkGlow-${type})`} />
                    {/* Центр */}
                    <circle cx={0} cy={0} r={size*0.5} fill="#facc15" />
                    <circle cx={0} cy={0} r={size*0.25} fill="#fff" />
                    {/* Асимметричный разряд (ломаный) */}
                    <polyline
                      points={`0,${-size*1.3} ${size*0.25},${-size*0.6} ${-size*0.1},0 ${size*0.4},${size*0.7}`}
                      fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.85}
                    />
                    {/* Дополнительные разряды */}
                    <line x1={-size*1.4} y1={0} x2={size*1.4} y2={0} stroke="#fff" strokeWidth={1.5} opacity={0.8} />
                    <line x1={-size} y1={-size} x2={size} y2={size} stroke="#ffe066" strokeWidth={1} opacity={0.6} />
                    <line x1={size} y1={-size} x2={-size} y2={size} stroke="#ffe066" strokeWidth={1} opacity={0.6} />
                    {/* Корона */}
                    <circle cx={0} cy={0} r={size*1.2} fill="none" stroke="#facc15" strokeWidth={1} opacity={0.4} />
                  </g>
                )}

                {/* ===== ЗАДИР (scarred) ===== */}
                {config.shape === 'scarred' && (
                  <g>
                    {/* Красная аура опасности */}
                    <circle cx={0} cy={0} r={size * 1.25} fill="none" stroke="#dc2626" strokeWidth={3} opacity={0.4}>
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    {/* Металлическая основа */}
                    <circle cx={0} cy={0} r={size} fill={`url(#metalGradient-${type})`} />
                    {/* Царапины */}
                    <line x1={-size*0.7} y1={-size*0.5} x2={size*0.5} y2={size*0.45} stroke="#1a1a1a" strokeWidth={3} strokeLinecap="round" />
                    <line x1={-size*0.4} y1={-size*0.7} x2={size*0.65} y2={size*0.55} stroke="#2a2a2a" strokeWidth={2} strokeLinecap="round" />
                    <line x1={size*0.2} y1={-size*0.65} x2={size*0.75} y2={size*0.15} stroke="#1a1a1a" strokeWidth={1.5} strokeLinecap="round" />
                    {/* Заусенцы (красные точки на концах царапин) */}
                    <circle cx={size*0.5} cy={size*0.45} r={size*0.1} fill="#991b1b" />
                    <circle cx={size*0.65} cy={size*0.55} r={size*0.07} fill="#b91c1c" />
                    {/* Металлический блик */}
                    <ellipse cx={-size*0.3} cy={-size*0.4} rx={size*0.3} ry={size*0.12} fill="rgba(255,255,255,0.35)" />
                  </g>
                )}

                {/* ===== ПИТТИНГ (pitted) ===== */}
                {config.shape === 'pitted' && (
                  <g>
                    <circle cx={0} cy={0} r={size * 1.2} fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.35}>
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={0} cy={0} r={size} fill={`url(#pittingGradient-${type})`} />

                    <ellipse cx={-size*0.45} cy={-size*0.35} rx={size*0.2} ry={size*0.15} fill="#0a0a0a" />
                    <ellipse cx={-size*0.45} cy={-size*0.4} rx={size*0.2} ry={size*0.05} fill="#666" opacity={0.5} />

                    <ellipse cx={size*0.35} cy={-size*0.5} rx={size*0.16} ry={size*0.12} fill="#111" />
                    <ellipse cx={size*0.35} cy={-size*0.55} rx={size*0.16} ry={size*0.04} fill="#777" opacity={0.4} />

                    <ellipse cx={size*0.5} cy={size*0.25} rx={size*0.22} ry={size*0.16} fill="#0a0a0a" />
                    <ellipse cx={size*0.5} cy={size*0.2} rx={size*0.22} ry={size*0.05} fill="#666" opacity={0.5} />

                    <ellipse cx={-size*0.2} cy={size*0.45} rx={size*0.14} ry={size*0.1} fill="#111" />
                    <ellipse cx={-size*0.2} cy={size*0.4} rx={size*0.14} ry={size*0.04} fill="#777" opacity={0.4} />

                    {/* Крупный основной кратер */}
                    <ellipse cx={0} cy={-size*0.1} rx={size*0.35} ry={size*0.28} fill="#050505" />
                    <ellipse cx={0} cy={-size*0.18} rx={size*0.35} ry={size*0.08} fill="#888" opacity={0.4} />

                    <ellipse cx={-size*0.55} cy={size*0.15} rx={size*0.12} ry={size*0.09} fill="#0f0f0f" />

                    <ellipse cx={0} cy={0} rx={size*0.1} ry={size*0.08} fill="#22c55e" opacity={0.3}>
                      <animate attributeName="opacity" values="0.1;0.4;0.1" dur="2s" repeatCount="indefinite" />
                    </ellipse>
                  </g>
                )}

                {/* HP бар (50%) */}
                <rect x={-size} y={-size - 10} width={size * 2} height={5} rx={2} fill="rgba(0,0,0,0.6)" />
                <rect x={-size} y={-size - 10} width={size} height={5} rx={2} fill="#f59e0b" />
              </svg>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="text-xl font-bold text-white">{config.name}</span>
                </div>
                <div className="text-gray-400 text-sm mb-2">{config.description}</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-gray-700 rounded">HP: {config.baseHp}</span>
                  <span className="px-2 py-1 bg-gray-700 rounded">Скорость: {config.speed}</span>
                  <span className="px-2 py-1 bg-gray-700 rounded">Награда: {config.reward}g</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs mt-2">
                  <span className="px-2 py-1 bg-blue-900 rounded">Размер: {config.size}px</span>
                  <span className="px-2 py-1 bg-blue-900 rounded">Форма: {config.shape}</span>
                  <span className="px-2 py-1 bg-blue-900 rounded">Тряска: {config.oscillation}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
