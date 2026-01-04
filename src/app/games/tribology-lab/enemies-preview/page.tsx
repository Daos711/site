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
              {/* SVG preview с масляным фоном */}
              <div
                className="rounded-lg flex items-center justify-center relative overflow-hidden"
                style={{
                  width: 100,
                  height: 100,
                  background: 'linear-gradient(145deg, #0a1520 0%, #132740 50%, #0f1f30 100%)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), 0 0 0 2px #2d3138',
                }}
              >
                {/* Масляный блик */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: 'radial-gradient(ellipse at 30% 20%, rgba(100, 150, 200, 0.15) 0%, transparent 50%)',
                  }}
                />
                {/* Пятна масла */}
                <div
                  className="absolute"
                  style={{
                    width: 12,
                    height: 18,
                    borderRadius: '50%',
                    background: 'rgba(25, 50, 80, 0.4)',
                    top: 8,
                    right: 10,
                  }}
                />
                <div
                  className="absolute"
                  style={{
                    width: 8,
                    height: 12,
                    borderRadius: '50%',
                    background: 'rgba(30, 55, 85, 0.35)',
                    bottom: 12,
                    left: 8,
                  }}
                />
              <svg width={100} height={100} viewBox="-50 -50 100 100" className="relative z-10">
                <defs>
                  {/* ===== ГРАДИЕНТЫ ДЛЯ ВРАГОВ ===== */}

                  {/* Пыль — мягкий серый */}
                  <radialGradient id={`dustGradient-${type}`}>
                    <stop offset="0%" stopColor="#b0b5bd" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#9ca3af" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
                  </radialGradient>

                  {/* Абразив — песочный камень */}
                  <linearGradient id={`abrasiveGradient-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c9a66b" />
                    <stop offset="40%" stopColor="#a67c52" />
                    <stop offset="100%" stopColor="#7a5c30" />
                  </linearGradient>

                  {/* Перегрев — температурный градиент */}
                  <radialGradient id={`heatGradient-${type}`}>
                    <stop offset="0%" stopColor="#fffde7" />
                    <stop offset="25%" stopColor="#ffcc00" />
                    <stop offset="55%" stopColor="#ff6600" />
                    <stop offset="85%" stopColor="#cc3300" />
                    <stop offset="100%" stopColor="#8b0000" />
                  </radialGradient>

                  {/* Тепловое марево */}
                  <radialGradient id={`heatHaze-${type}`}>
                    <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.5" />
                    <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
                  </radialGradient>

                  {/* Стружка — металл */}
                  <linearGradient id={`metalShavingGradient-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e8e8e8" />
                    <stop offset="30%" stopColor="#c0c0c0" />
                    <stop offset="70%" stopColor="#909090" />
                    <stop offset="100%" stopColor="#606060" />
                  </linearGradient>

                  {/* Коррозия — буро-зелёный */}
                  <radialGradient id={`corrosionGradient-${type}`}>
                    <stop offset="0%" stopColor="#5a7c59" />
                    <stop offset="50%" stopColor="#4a6b48" />
                    <stop offset="100%" stopColor="#3a5a38" />
                  </radialGradient>

                  {/* Влага — прозрачная капля */}
                  <radialGradient id={`moistureGradient-${type}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                    <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.7" />
                    <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
                  </radialGradient>

                  {/* Статика — свечение */}
                  <radialGradient id={`sparkGlow-${type}`}>
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="30%" stopColor="#facc15" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                  </radialGradient>

                  {/* Задир — тёмный металл */}
                  <radialGradient id={`scarredGradient-${type}`}>
                    <stop offset="0%" stopColor="#7a7a7a" />
                    <stop offset="50%" stopColor="#5a5a5a" />
                    <stop offset="100%" stopColor="#3a3a3a" />
                  </radialGradient>

                  {/* Питтинг — металлическая поверхность */}
                  <radialGradient id={`pittingGradient-${type}`}>
                    <stop offset="0%" stopColor="#5a6068" />
                    <stop offset="60%" stopColor="#3a4048" />
                    <stop offset="100%" stopColor="#1a2028" />
                  </radialGradient>

                  {/* Контактная тень (общая) */}
                  <radialGradient id={`contactShadow-${type}`}>
                    <stop offset="0%" stopColor="#0a1520" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0a1520" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* ===== ПЫЛЬ (dust) ===== */}
                {type === 'dust' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*1.0} ry={size*0.3} fill={`url(#contactShadow-${type})`} opacity={0.4} />

                    {/* Облачко из нескольких частиц */}
                    <g opacity={0.85}>
                      <circle cx={-size*0.35} cy={-size*0.25} r={size*0.45} fill={`url(#dustGradient-${type})`} />
                      <circle cx={size*0.25} cy={-size*0.15} r={size*0.38} fill={`url(#dustGradient-${type})`} />
                      <circle cx={0} cy={size*0.25} r={size*0.52} fill={`url(#dustGradient-${type})`} />
                      <circle cx={-size*0.25} cy={size*0.35} r={size*0.32} fill={`url(#dustGradient-${type})`} />
                      <circle cx={size*0.35} cy={size*0.25} r={size*0.28} fill={`url(#dustGradient-${type})`} />

                      {/* Дымка */}
                      <circle cx={0} cy={0} r={size*1.3} fill="rgba(156,163,175,0.1)" />

                      {/* Микрочастицы-спутники */}
                      <circle cx={size*1.0} cy={-size*0.3} r={size*0.12} fill="#9ca3af" opacity={0.5} />
                      <circle cx={-size*0.9} cy={size*0.5} r={size*0.1} fill="#9ca3af" opacity={0.4} />
                      <circle cx={size*0.6} cy={size*0.8} r={size*0.08} fill="#b0b5bd" opacity={0.35} />
                    </g>

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.5} ${-size*0.5} Q ${0} ${-size*0.8} ${size*0.4} ${-size*0.4}`}
                      fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )}

                {/* ===== АБРАЗИВ (shard) ===== */}
                {config.shape === 'shard' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.55} rx={size*0.75} ry={size*0.25} fill={`url(#contactShadow-${type})`} opacity={0.6} />

                    {/* Основной осколок */}
                    <polygon
                      points={`
                        ${size*0.1},${-size*0.95}
                        ${size*0.75},${-size*0.45}
                        ${size*0.9},${size*0.15}
                        ${size*0.55},${size*0.75}
                        ${size*0.1},${size*0.9}
                        ${-size*0.45},${size*0.7}
                        ${-size*0.85},${size*0.25}
                        ${-size*0.75},${-size*0.35}
                        ${-size*0.35},${-size*0.8}
                      `}
                      fill={`url(#abrasiveGradient-${type})`}
                    />

                    {/* Грани (свет/тень) */}
                    <polygon
                      points={`${size*0.1},${-size*0.95} ${size*0.75},${-size*0.45} ${size*0.2},${-size*0.1} ${-size*0.35},${-size*0.8}`}
                      fill="rgba(255,255,255,0.15)"
                    />
                    <polygon
                      points={`${size*0.55},${size*0.75} ${size*0.1},${size*0.9} ${-size*0.45},${size*0.7} ${0},${size*0.3}`}
                      fill="rgba(0,0,0,0.2)"
                    />

                    {/* Зернистость */}
                    <circle cx={-size*0.2} cy={-size*0.1} r={size*0.08} fill="#5c4020" opacity={0.5} />
                    <circle cx={size*0.25} cy={size*0.2} r={size*0.06} fill="#6b4d25" opacity={0.4} />
                    <circle cx={-size*0.35} cy={size*0.3} r={size*0.07} fill="#4a3015" opacity={0.45} />
                    <circle cx={size*0.4} cy={-size*0.25} r={size*0.05} fill="#7a5c30" opacity={0.35} />

                    {/* Скол */}
                    <polygon
                      points={`${size*0.7},${-size*0.3} ${size*0.85},${size*0.05} ${size*0.55},${-size*0.1}`}
                      fill="#d4b896"
                      opacity={0.7}
                    />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.35} ${-size*0.8} L ${size*0.1} ${-size*0.95} L ${size*0.75} ${-size*0.45}`}
                      fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )}

                {/* ===== ПЕРЕГРЕВ (heat) ===== */}
                {type === 'heat' && (
                  <g>
                    {/* Зона нагрева масла */}
                    <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill="rgba(255,107,53,0.08)" />

                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.7} rx={size*0.9} ry={size*0.25} fill={`url(#contactShadow-${type})`} opacity={0.3} />

                    {/* Тепловое марево */}
                    <ellipse cx={0} cy={0} rx={size*1.6} ry={size*1.5} fill={`url(#heatHaze-${type})`}>
                      <animate attributeName="rx" values={`${size*1.4};${size*1.8};${size*1.4}`} dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="ry" values={`${size*1.3};${size*1.7};${size*1.3}`} dur="1.8s" repeatCount="indefinite" />
                    </ellipse>

                    {/* Основной пузырь */}
                    <ellipse cx={0} cy={size*0.05} rx={size*0.85} ry={size*0.95} fill={`url(#heatGradient-${type})`} />

                    {/* Яркое ядро */}
                    <ellipse cx={0} cy={-size*0.15} rx={size*0.35} ry={size*0.4} fill="#fffde7" opacity={0.7}>
                      <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1.2s" repeatCount="indefinite" />
                    </ellipse>

                    {/* Микропузырьки */}
                    <circle cx={size*0.55} cy={-size*0.35} r={size*0.1} fill="#ffcc00" opacity={0.7}>
                      <animate attributeName="cy" values={`${-size*0.35};${-size*0.9};${-size*0.35}`} dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={-size*0.4} cy={-size*0.2} r={size*0.07} fill="#ffaa00" opacity={0.6}>
                      <animate attributeName="cy" values={`${-size*0.2};${-size*0.75};${-size*0.2}`} dur="2.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={size*0.2} cy={size*0.3} r={size*0.06} fill="#ff8800" opacity={0.5}>
                      <animate attributeName="cy" values={`${size*0.3};${-size*0.5};${size*0.3}`} dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* Влажный блик */}
                    <ellipse cx={-size*0.3} cy={-size*0.55} rx={size*0.25} ry={size*0.1} fill="rgba(255,255,255,0.5)" />
                  </g>
                )}

                {/* ===== СТРУЖКА (shavings) ===== */}
                {config.shape === 'shavings' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*0.85} ry={size*0.3} fill={`url(#contactShadow-${type})`} opacity={0.6} />

                    {/* Основной завиток */}
                    <path
                      d={`M ${-size*0.85} ${-size*0.25}
                          Q ${-size*0.5} ${-size*0.95} ${size*0.2} ${-size*0.6}
                          Q ${size*0.85} ${-size*0.25} ${size*0.6} ${size*0.35}
                          Q ${size*0.35} ${size*0.75} ${size*0.1} ${size*0.65}`}
                      fill="none"
                      stroke={`url(#metalShavingGradient-${type})`}
                      strokeWidth={size * 0.28}
                      strokeLinecap="round"
                    />

                    {/* Тёмная сторона завитка */}
                    <path
                      d={`M ${-size*0.75} ${-size*0.15}
                          Q ${-size*0.4} ${-size*0.75} ${size*0.15} ${-size*0.5}`}
                      fill="none"
                      stroke="rgba(40,40,50,0.4)"
                      strokeWidth={size * 0.12}
                      strokeLinecap="round"
                    />

                    {/* Второй завиток */}
                    <path
                      d={`M ${-size*0.5} ${size*0.2}
                          Q ${-size*0.15} ${size*0.75} ${size*0.35} ${size*0.5}`}
                      fill="none"
                      stroke="#a0a0a0"
                      strokeWidth={size * 0.18}
                      strokeLinecap="round"
                    />

                    {/* Жёсткий металлический блик */}
                    <path
                      d={`M ${-size*0.7} ${-size*0.35}
                          Q ${-size*0.35} ${-size*0.85} ${size*0.25} ${-size*0.55}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.85)"
                      strokeWidth={size * 0.06}
                      strokeLinecap="round"
                    />

                    {/* Вторичный мягкий блик */}
                    <path
                      d={`M ${size*0.4} ${-size*0.35}
                          Q ${size*0.7} ${-size*0.1} ${size*0.55} ${size*0.25}`}
                      fill="none"
                      stroke="rgba(255,255,255,0.4)"
                      strokeWidth={size * 0.08}
                      strokeLinecap="round"
                    />

                    {/* Острый конец */}
                    <circle cx={size*0.1} cy={size*0.65} r={size*0.08} fill="#808080" />
                  </g>
                )}

                {/* ===== КОРРОЗИЯ (blob) ===== */}
                {config.shape === 'blob' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.55} rx={size*0.8} ry={size*0.25} fill={`url(#contactShadow-${type})`} opacity={0.5} />

                    {/* Основное пятно */}
                    <path
                      d={`M ${size*0.05} ${-size*0.85}
                          L ${size*0.35} ${-size*0.8}
                          Q ${size*0.7} ${-size*0.65} ${size*0.85} ${-size*0.25}
                          L ${size*0.9} ${size*0.1}
                          Q ${size*0.85} ${size*0.5} ${size*0.6} ${size*0.75}
                          L ${size*0.35} ${size*0.85}
                          Q ${0} ${size*0.95} ${-size*0.35} ${size*0.8}
                          L ${-size*0.6} ${size*0.65}
                          Q ${-size*0.9} ${size*0.35} ${-size*0.85} ${-size*0.05}
                          L ${-size*0.75} ${-size*0.4}
                          Q ${-size*0.6} ${-size*0.75} ${-size*0.25} ${-size*0.85}
                          Z`}
                      fill={`url(#corrosionGradient-${type})`}
                    />

                    {/* Рыжеватые вкрапления (ржавчина) */}
                    <ellipse cx={size*0.35} cy={-size*0.3} rx={size*0.18} ry={size*0.12} fill="#8b5a2b" opacity={0.6} />
                    <ellipse cx={-size*0.25} cy={size*0.35} rx={size*0.12} ry={size*0.08} fill="#9b6a3b" opacity={0.5} />

                    {/* Тёмные язвы/поры */}
                    <ellipse cx={-size*0.2} cy={-size*0.15} rx={size*0.18} ry={size*0.12} fill="#1a3020" opacity={0.8} />
                    <ellipse cx={size*0.3} cy={size*0.2} rx={size*0.14} ry={size*0.1} fill="#0f2518" opacity={0.75} />
                    <ellipse cx={-size*0.35} cy={size*0.25} rx={size*0.1} ry={size*0.07} fill="#1a3020" opacity={0.7} />
                    <ellipse cx={size*0.1} cy={-size*0.45} rx={size*0.08} ry={size*0.06} fill="#152a1c" opacity={0.65} />
                    <ellipse cx={size*0.5} cy={size*0.45} rx={size*0.12} ry={size*0.08} fill="#1a3020" opacity={0.7} />

                    {/* Мелкие поры */}
                    <circle cx={0} cy={size*0.5} r={size*0.05} fill="#0f2015" opacity={0.6} />
                    <circle cx={size*0.55} cy={-size*0.1} r={size*0.04} fill="#1a3020" opacity={0.5} />
                    <circle cx={-size*0.5} cy={-size*0.35} r={size*0.045} fill="#152a1c" opacity={0.55} />

                    {/* Пузырьки реакции */}
                    <circle cx={size*0.6} cy={-size*0.5} r={size*0.06} fill="#6aac69" opacity={0.5} />
                    <circle cx={-size*0.55} cy={size*0.5} r={size*0.05} fill="#7abc79" opacity={0.4} />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.25} ${-size*0.85} Q ${size*0.2} ${-size*0.9} ${size*0.6} ${-size*0.55}`}
                      fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
                    />
                  </g>
                )}

                {/* ===== ВЛАГА (moisture) ===== */}
                {type === 'moisture' && (
                  <g>
                    {/* "Линза" под каплей */}
                    <ellipse cx={0} cy={size*0.15} rx={size*0.9} ry={size*0.7} fill="rgba(30,60,100,0.15)" />

                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.65} rx={size*0.7} ry={size*0.2} fill={`url(#contactShadow-${type})`} opacity={0.35} />

                    {/* Основная капля */}
                    <ellipse cx={0} cy={size*0.1} rx={size*0.7} ry={size*0.95} fill={`url(#moistureGradient-${type})`} />

                    {/* Эффект толщины */}
                    <ellipse cx={0} cy={size*0.2} rx={size*0.55} ry={size*0.75} fill="rgba(255,255,255,0.08)" />

                    {/* Широкий мягкий блик */}
                    <ellipse cx={-size*0.15} cy={-size*0.3} rx={size*0.35} ry={size*0.18} fill="rgba(255,255,255,0.3)" />

                    {/* Маленький яркий блик */}
                    <ellipse cx={-size*0.22} cy={-size*0.5} rx={size*0.12} ry={size*0.07} fill="rgba(255,255,255,0.8)" />

                    {/* Микрокапля-спутник */}
                    <ellipse cx={size*0.6} cy={size*0.55} rx={size*0.15} ry={size*0.2} fill={`url(#moistureGradient-${type})`} opacity={0.7} />
                    <ellipse cx={size*0.58} cy={size*0.48} rx={size*0.05} ry={size*0.03} fill="rgba(255,255,255,0.5)" />
                  </g>
                )}

                {/* ===== СТАТИКА (spark) ===== */}
                {config.shape === 'spark' && (
                  <g>
                    {/* Общее мерцание */}
                    <animate attributeName="opacity" values="1;0.5;0.9;0.6;1" dur="0.2s" repeatCount="indefinite" />

                    {/* Свечение (glow) */}
                    <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill={`url(#sparkGlow-${type})`} opacity={0.6} />

                    {/* Разряды */}
                    <g stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" fill="none">
                      <path d={`M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8}`}>
                        <animate attributeName="d"
                          values={`M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8};
                                   M ${size*0.15} ${-size*0.35} L ${size*0.6} ${-size*0.9} L ${size*0.25} ${-size*1.5} L ${size*0.55} ${-size*1.7};
                                   M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8}`}
                          dur="0.4s" repeatCount="indefinite" />
                      </path>
                      <path d={`M ${size*0.35} ${size*0.15} L ${size*1.0} ${size*0.3} L ${size*1.4} ${size*0.15}`} opacity={0.9} />
                      <path d={`M ${-size*0.3} ${size*0.1} L ${-size*0.9} ${-size*0.15} L ${-size*1.2} ${size*0.05}`} opacity={0.8} />
                      <path d={`M ${-size*0.15} ${size*0.35} L ${-size*0.4} ${size*1.0} L ${-size*0.2} ${size*1.3}`} opacity={0.7} />
                    </g>

                    {/* Вторичные разряды (жёлтые) */}
                    <g stroke="#ffe066" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.7}>
                      <path d={`M ${size*0.1} ${-size*0.25} L ${-size*0.3} ${-size*0.8}`} />
                      <path d={`M ${size*0.25} ${size*0.2} L ${size*0.7} ${size*0.6}`} />
                    </g>

                    {/* Ядро */}
                    <circle cx={0} cy={0} r={size*0.5} fill="#facc15" />
                    <circle cx={0} cy={0} r={size*0.3} fill="#fff">
                      <animate attributeName="r" values={`${size*0.3};${size*0.35};${size*0.25};${size*0.3}`} dur="0.15s" repeatCount="indefinite" />
                    </circle>

                    {/* Корона */}
                    <circle cx={0} cy={0} r={size*1.0} fill="none" stroke="#facc15" strokeWidth={1} opacity={0.5}>
                      <animate attributeName="r" values={`${size*0.9};${size*1.1};${size*0.9}`} dur="0.3s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* ===== ЗАДИР (scarred) ===== */}
                {config.shape === 'scarred' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*0.9} ry={size*0.35} fill={`url(#contactShadow-${type})`} opacity={0.7} />

                    {/* Ореол опасности */}
                    <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#dc2626" strokeWidth={3} opacity={0.4}>
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="r" values={`${size*0.85};${size*0.95};${size*0.85}`} dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Металлическая основа */}
                    <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill={`url(#scarredGradient-${type})`} />

                    {/* Фаска/обод */}
                    <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill="none" stroke="#5a5a5a" strokeWidth={3} />

                    {/* Главная борозда */}
                    <path
                      d={`M ${-size*0.75} ${-size*0.55} L ${size*0.6} ${size*0.5}`}
                      fill="none" stroke="#1a1a1a" strokeWidth={4} strokeLinecap="round"
                    />
                    <path
                      d={`M ${-size*0.7} ${-size*0.5} L ${size*0.55} ${size*0.45}`}
                      fill="none" stroke="#909090" strokeWidth={1.5} strokeLinecap="round"
                    />

                    {/* Вторичные царапины */}
                    <path
                      d={`M ${-size*0.4} ${-size*0.75} L ${size*0.7} ${size*0.55}`}
                      fill="none" stroke="#2a2a2a" strokeWidth={2.5} strokeLinecap="round"
                    />
                    <path
                      d={`M ${size*0.25} ${-size*0.7} L ${size*0.8} ${size*0.15}`}
                      fill="none" stroke="#252525" strokeWidth={2} strokeLinecap="round"
                    />
                    <path
                      d={`M ${-size*0.65} ${size*0.1} L ${-size*0.2} ${size*0.6}`}
                      fill="none" stroke="#2a2a2a" strokeWidth={1.5} strokeLinecap="round"
                    />

                    {/* Заусенцы */}
                    <circle cx={size*0.6} cy={size*0.5} r={size*0.1} fill="#991b1b" />
                    <circle cx={size*0.7} cy={size*0.55} r={size*0.07} fill="#b91c1c" />
                    <circle cx={size*0.55} cy={size*0.45} r={size*0.05} fill="#dc2626" />

                    {/* Металлический блик */}
                    <ellipse cx={-size*0.4} cy={-size*0.45} rx={size*0.35} ry={size*0.12} fill="rgba(255,255,255,0.25)" />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.8} ${-size*0.4} Q ${-size*0.3} ${-size*0.9} ${size*0.5} ${-size*0.7}`}
                      fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round"
                    />
                  </g>
                )}

                {/* ===== ПИТТИНГ (pitted) ===== */}
                {config.shape === 'pitted' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.65} rx={size*0.95} ry={size*0.35} fill={`url(#contactShadow-${type})`} opacity={0.75} />

                    {/* Реген-ореол */}
                    <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#22c55e" strokeWidth={3} opacity={0.35}>
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* Металлическая основа */}
                    <circle cx={0} cy={0} r={size} fill={`url(#pittingGradient-${type})`} />

                    {/* Кольцевая текстура */}
                    <circle cx={0} cy={0} r={size*0.85} fill="none" stroke="rgba(80,90,100,0.3)" strokeWidth={1} />
                    <circle cx={0} cy={0} r={size*0.6} fill="none" stroke="rgba(80,90,100,0.2)" strokeWidth={1} />

                    {/* Фаска */}
                    <circle cx={0} cy={0} r={size} fill="none" stroke="#4a5058" strokeWidth={3} />

                    {/* ГЛАВНЫЙ крупный кратер */}
                    <ellipse cx={-size*0.15} cy={size*0.15} rx={size*0.3} ry={size*0.25} fill="#050505" />
                    <ellipse cx={-size*0.15} cy={size*0.08} rx={size*0.3} ry={size*0.08} fill="#707880" opacity={0.6} />
                    <ellipse cx={-size*0.15} cy={size*0.15} rx={size*0.15} ry={size*0.12} fill="#22c55e" opacity={0.25}>
                      <animate attributeName="opacity" values="0.1;0.35;0.1" dur="2.5s" repeatCount="indefinite" />
                    </ellipse>

                    {/* Кратер 2 */}
                    <ellipse cx={size*0.45} cy={-size*0.35} rx={size*0.2} ry={size*0.16} fill="#080808" />
                    <ellipse cx={size*0.45} cy={-size*0.4} rx={size*0.2} ry={size*0.05} fill="#606870" opacity={0.5} />

                    {/* Кратер 3 */}
                    <ellipse cx={-size*0.5} cy={-size*0.3} rx={size*0.18} ry={size*0.14} fill="#0a0a0a" />
                    <ellipse cx={-size*0.5} cy={-size*0.35} rx={size*0.18} ry={size*0.05} fill="#707880" opacity={0.5} />

                    {/* Кратер 4 */}
                    <ellipse cx={size*0.5} cy={size*0.35} rx={size*0.22} ry={size*0.17} fill="#060606" />
                    <ellipse cx={size*0.5} cy={size*0.29} rx={size*0.22} ry={size*0.06} fill="#606870" opacity={0.55} />

                    {/* Кратер 5 */}
                    <ellipse cx={-size*0.45} cy={size*0.5} rx={size*0.15} ry={size*0.11} fill="#0a0a0a" />
                    <ellipse cx={-size*0.45} cy={size*0.45} rx={size*0.15} ry={size*0.04} fill="#707880" opacity={0.45} />

                    {/* Кратер 6 */}
                    <ellipse cx={size*0.15} cy={-size*0.6} rx={size*0.14} ry={size*0.1} fill="#080808" />
                    <ellipse cx={size*0.15} cy={-size*0.64} rx={size*0.14} ry={size*0.04} fill="#606870" opacity={0.5} />

                    {/* Мелкие кратеры */}
                    <circle cx={size*0.7} cy={0} r={size*0.08} fill="#0a0a0a" />
                    <circle cx={-size*0.7} cy={size*0.15} r={size*0.07} fill="#080808" />
                    <circle cx={size*0.25} cy={size*0.6} r={size*0.06} fill="#0a0a0a" />
                    <circle cx={-size*0.25} cy={-size*0.55} r={size*0.065} fill="#080808" />

                    {/* Металлический блик */}
                    <ellipse cx={-size*0.35} cy={-size*0.5} rx={size*0.4} ry={size*0.12} fill="rgba(255,255,255,0.2)" />

                    {/* Rim light */}
                    <path
                      d={`M ${-size*0.85} ${-size*0.35} Q ${-size*0.2} ${-size*0.95} ${size*0.6} ${-size*0.65}`}
                      fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2.5} strokeLinecap="round"
                    />
                  </g>
                )}

                {/* HP бар (50%) */}
                <g>
                  <rect x={-size*0.9} y={-size - 12} width={size * 1.8} height={6} rx={3} fill="rgba(0,0,0,0.7)" />
                  <rect x={-size*0.9} y={-size - 12} width={size * 0.9} height={6} rx={3} fill="#f59e0b" />
                  <rect x={-size*0.85} y={-size - 11} width={size * 0.85} height={2} rx={1} fill="rgba(255,255,255,0.3)" />
                </g>
              </svg>
              </div>

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
