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
                {/* Тень */}
                <ellipse cx={0} cy={size * 0.4} rx={size * 0.9} ry={size * 0.3} fill="rgba(0,0,0,0.3)" />

                {/* Специальный эффект для Heat */}
                {type === 'heat' && (
                  <circle cx={0} cy={0} r={size * 1.5} fill="none" stroke="#f97316" strokeWidth={2} opacity={0.3}>
                    <animate attributeName="r" values={`${size};${size * 1.8};${size}`} dur="1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="1s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Аура босса */}
                {type.startsWith('boss') && (
                  <circle cx={0} cy={0} r={size * 1.3} fill="none" stroke="#ef4444" strokeWidth={3} opacity={0.5}>
                    <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Формы */}
                {config.shape === 'circle' && (
                  <circle cx={0} cy={0} r={size} fill={config.color} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                )}

                {config.shape === 'crystal' && (
                  <polygon
                    points={`0,${-size} ${size * 0.7},${-size * 0.3} ${size * 0.5},${size * 0.7} ${-size * 0.5},${size * 0.7} ${-size * 0.7},${-size * 0.3}`}
                    fill={config.color}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth={1}
                  />
                )}

                {config.shape === 'gear' && (
                  <g>
                    <circle cx={0} cy={0} r={size * 0.7} fill={config.color} />
                    {[0, 60, 120, 180, 240, 300].map(angle => (
                      <rect
                        key={angle}
                        x={-size * 0.15}
                        y={-size}
                        width={size * 0.3}
                        height={size * 0.4}
                        fill={config.color}
                        transform={`rotate(${angle})`}
                      />
                    ))}
                  </g>
                )}

                {config.shape === 'drop' && (
                  <path
                    d={`M 0 ${-size} Q ${size} 0 0 ${size} Q ${-size} 0 0 ${-size}`}
                    fill={config.color}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={1}
                  />
                )}

                {config.shape === 'spark' && (
                  <g>
                    {[0, 45, 90, 135].map(angle => (
                      <line
                        key={angle}
                        x1={0} y1={-size}
                        x2={0} y2={size}
                        stroke={config.color}
                        strokeWidth={2}
                        transform={`rotate(${angle})`}
                      />
                    ))}
                    <animate attributeName="opacity" values="0.8;0.3;1;0.5;0.8" dur="0.5s" repeatCount="indefinite" />
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
