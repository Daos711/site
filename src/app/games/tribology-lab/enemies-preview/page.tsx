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
                  {/* Градиент для перегрева */}
                  <radialGradient id={`heatGradient-${type}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffcc00" />
                    <stop offset="50%" stopColor="#ff6600" />
                    <stop offset="100%" stopColor="#cc3300" />
                  </radialGradient>
                  {/* Градиент для металла задира */}
                  <radialGradient id={`metalGradient-${type}`} cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#6a6a6a" />
                    <stop offset="50%" stopColor="#4a4a4a" />
                    <stop offset="100%" stopColor="#2a2a2a" />
                  </radialGradient>
                  {/* Градиент для питтинга */}
                  <radialGradient id={`pittingGradient-${type}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4a5568" />
                    <stop offset="100%" stopColor="#1a202c" />
                  </radialGradient>
                </defs>

                {/* Тень */}
                <ellipse cx={0} cy={size * 0.4} rx={size * 0.9} ry={size * 0.3} fill="rgba(0,0,0,0.3)" />

                {/* ========== ПЫЛЬ — облачко микрочастиц ========== */}
                {config.shape === 'dust' && (
                  <g opacity={0.8}>
                    <circle cx={-4} cy={-3} r={4} fill="#9ca3af" opacity={0.6} />
                    <circle cx={3} cy={-2} r={3} fill="#9ca3af" opacity={0.5} />
                    <circle cx={0} cy={2} r={5} fill="#9ca3af" opacity={0.7} />
                    <circle cx={-3} cy={4} r={3} fill="#9ca3af" opacity={0.4} />
                    <circle cx={5} cy={3} r={2} fill="#9ca3af" opacity={0.5} />
                  </g>
                )}

                {/* ========== АБРАЗИВ — песочный осколок ========== */}
                {config.shape === 'shard' && (
                  <polygon
                    points={`0,${-size} ${size * 0.8},${-size * 0.2} ${size * 0.6},${size * 0.8} ${-size * 0.3},${size * 0.6} ${-size * 0.9},${size * 0.1}`}
                    fill={config.color}
                    stroke="#8b7355"
                    strokeWidth={1}
                  />
                )}

                {/* ========== СТРУЖКА — металлические завитки ========== */}
                {config.shape === 'shavings' && (
                  <g>
                    <path
                      d={`M ${-size * 0.8} ${-size * 0.3} Q ${-size * 0.2} ${-size} ${size * 0.5} ${-size * 0.5} Q ${size} ${0} ${size * 0.3} ${size * 0.7}`}
                      fill="none"
                      stroke="#a8a8a8"
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                    <path
                      d={`M ${-size * 0.5} ${size * 0.2} Q ${0} ${size * 0.8} ${size * 0.6} ${size * 0.3}`}
                      fill="none"
                      stroke="#c0c0c0"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <path
                      d={`M ${-size * 0.6} ${-size * 0.2} Q ${-size * 0.1} ${-size * 0.8} ${size * 0.4} ${-size * 0.4}`}
                      fill="none"
                      stroke="#e8e8e8"
                      strokeWidth={1}
                      opacity={0.6}
                    />
                  </g>
                )}

                {/* ========== КАПЛЯ (влага, перегрев) ========== */}
                {config.shape === 'drop' && (
                  <g>
                    {type === 'heat' && (
                      <circle cx={0} cy={0} r={size * 1.6} fill="none" stroke="#ff6b35" strokeWidth={2} opacity={0.3}>
                        <animate attributeName="r" values={`${size * 1.3};${size * 1.8};${size * 1.3}`} dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <path
                      d={`M 0 ${-size} Q ${size} 0 0 ${size} Q ${-size} 0 0 ${-size}`}
                      fill={type === 'heat' ? `url(#heatGradient-${type})` : config.color}
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth={1}
                    />
                    {type === 'heat' && (
                      <circle cx={size * 0.4} cy={-size * 0.3} r={2} fill="#ffaa00" opacity={0.6}>
                        <animate attributeName="cy" values={`${-size * 0.3};${-size * 0.7};${-size * 0.3}`} dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                )}

                {/* ========== КОРРОЗИЯ — амёбообразное пятно ========== */}
                {config.shape === 'blob' && (
                  <path
                    d={`M 0 ${-size}
                        Q ${size * 0.8} ${-size * 0.6} ${size} ${0}
                        Q ${size * 0.7} ${size * 0.8} ${0} ${size}
                        Q ${-size * 0.6} ${size * 0.7} ${-size} ${0}
                        Q ${-size * 0.8} ${-size * 0.5} 0 ${-size}`}
                    fill={config.color}
                    stroke="#3d5c45"
                    strokeWidth={1}
                    opacity={0.85}
                  />
                )}

                {/* ========== СТАТИКА — искры с разрядами ========== */}
                {config.shape === 'spark' && (
                  <g>
                    <animate attributeName="opacity" values="0.8;0.3;1;0.5;0.8" dur="0.3s" repeatCount="indefinite" />
                    <circle cx={0} cy={0} r={size * 0.6} fill="#facc15" />
                    <line x1={0} y1={-size * 1.5} x2={0} y2={size * 1.5} stroke="#fff" strokeWidth={1.5} opacity={0.8} />
                    <line x1={-size * 1.5} y1={0} x2={size * 1.5} y2={0} stroke="#fff" strokeWidth={1.5} opacity={0.8} />
                    <line x1={-size} y1={-size} x2={size} y2={size} stroke="#ffe066" strokeWidth={1} opacity={0.6} />
                    <line x1={size} y1={-size} x2={-size} y2={size} stroke="#ffe066" strokeWidth={1} opacity={0.6} />
                  </g>
                )}

                {/* ========== ЗАДИР (босс) — металл с царапинами ========== */}
                {config.shape === 'scarred' && (
                  <g>
                    <circle cx={0} cy={0} r={size * 1.3} fill="none" stroke="#dc2626" strokeWidth={3} opacity={0.5}>
                      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={0} cy={0} r={size} fill={`url(#metalGradient-${type})`} stroke="#666" strokeWidth={2} />
                    <line x1={-size * 0.6} y1={-size * 0.5} x2={size * 0.4} y2={size * 0.3} stroke="#222" strokeWidth={2} />
                    <line x1={-size * 0.3} y1={-size * 0.7} x2={size * 0.5} y2={size * 0.5} stroke="#333" strokeWidth={1.5} />
                    <line x1={size * 0.2} y1={-size * 0.6} x2={size * 0.7} y2={size * 0.2} stroke="#222" strokeWidth={1} />
                    <circle cx={size * 0.4} cy={size * 0.3} r={3} fill="#991b1b" />
                  </g>
                )}

                {/* ========== ПИТТИНГ (босс) — диск с кратерами ========== */}
                {config.shape === 'pitted' && (
                  <g>
                    <circle cx={0} cy={0} r={size * 1.2} fill="none" stroke="#22c55e" strokeWidth={2} opacity={0.4}>
                      <animate attributeName="opacity" values="0.4;0.7;0.4" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={0} cy={0} r={size} fill={`url(#pittingGradient-${type})`} stroke="#555" strokeWidth={2} />
                    <ellipse cx={-size * 0.4} cy={-size * 0.3} rx={6} ry={5} fill="#1a1a1a" />
                    <ellipse cx={size * 0.3} cy={-size * 0.5} rx={5} ry={4} fill="#222" />
                    <ellipse cx={size * 0.5} cy={size * 0.2} rx={7} ry={5} fill="#1a1a1a" />
                    <ellipse cx={-size * 0.2} cy={size * 0.4} rx={4} ry={3} fill="#222" />
                    <ellipse cx={0} cy={0} rx={5} ry={4} fill="#111" />
                    <ellipse cx={-size * 0.4} cy={-size * 0.35} rx={6} ry={2} fill="#666" opacity={0.5} />
                    <ellipse cx={size * 0.5} cy={size * 0.15} rx={7} ry={2} fill="#666" opacity={0.5} />
                  </g>
                )}

                {/* Иконка */}
                <text
                  x={0}
                  y={size * 0.35}
                  textAnchor="middle"
                  fontSize={size * 1.2}
                  style={{ pointerEvents: 'none' }}
                >
                  {config.icon}
                </text>

                {/* HP бар (50%) */}
                <rect x={-size} y={-size - 8} width={size * 2} height={4} rx={2} fill="rgba(0,0,0,0.5)" />
                <rect x={-size} y={-size - 8} width={size} height={4} rx={2} fill="#f59e0b" />
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
