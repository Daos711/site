'use client';

import React from 'react';
import { ENEMIES, type EnemyType } from '../types';

interface EnemySpriteProps {
  enemyType: EnemyType;
  size?: number;  // размер спрайта (масштаб)
  animated?: boolean;  // включать анимации?
}

/**
 * Компонент для отображения спрайта врага.
 * Использует тот же SVG рендеринг, что и в игре.
 */
export function EnemySprite({ enemyType, size: customSize, animated = true }: EnemySpriteProps) {
  const config = ENEMIES[enemyType];
  if (!config) return null;

  // Базовый размер из конфига, можно переопределить
  const size = customSize ?? config.size;

  // SVG viewBox для центрирования спрайта
  const viewBoxSize = size * 3;
  const center = viewBoxSize / 2;

  return (
    <svg
      width={viewBoxSize}
      height={viewBoxSize}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Градиенты для всех типов врагов */}
        <radialGradient id={`dustGradient-${enemyType}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#d1d5db" />
          <stop offset="60%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </radialGradient>

        <radialGradient id={`contactShadow-${enemyType}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        <linearGradient id={`abrasiveGradient-${enemyType}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a67c52" />
          <stop offset="40%" stopColor="#8b6642" />
          <stop offset="100%" stopColor="#5c4020" />
        </linearGradient>

        <radialGradient id={`heatGradient-${enemyType}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="30%" stopColor="#ffcc00" />
          <stop offset="60%" stopColor="#ff8800" />
          <stop offset="100%" stopColor="#cc4400" />
        </radialGradient>

        <radialGradient id={`heatHaze-${enemyType}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,150,50,0.15)" />
          <stop offset="100%" stopColor="rgba(255,100,30,0)" />
        </radialGradient>

        <linearGradient id={`metalShavingGradient-${enemyType}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#c0c0c0" />
          <stop offset="30%" stopColor="#e8e8e8" />
          <stop offset="50%" stopColor="#a0a0a0" />
          <stop offset="70%" stopColor="#d0d0d0" />
          <stop offset="100%" stopColor="#909090" />
        </linearGradient>

        <radialGradient id={`corrosionGradient-${enemyType}`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#5aac59" />
          <stop offset="50%" stopColor="#3d7a3c" />
          <stop offset="100%" stopColor="#1a3d1a" />
        </radialGradient>

        <radialGradient id={`corrosionAura-${enemyType}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(58,122,60,0.35)" />
          <stop offset="70%" stopColor="rgba(58,122,60,0.1)" />
          <stop offset="100%" stopColor="rgba(58,122,60,0)" />
        </radialGradient>

        <radialGradient id={`moistureGradient-${enemyType}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="rgba(200,230,255,0.85)" />
          <stop offset="40%" stopColor="rgba(100,180,230,0.7)" />
          <stop offset="100%" stopColor="rgba(30,80,140,0.6)" />
        </radialGradient>

        <radialGradient id={`sparkGlow-${enemyType}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(250,204,21,0.4)" />
          <stop offset="100%" stopColor="rgba(250,204,21,0)" />
        </radialGradient>

        <linearGradient id={`scarredGradient-${enemyType}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#909090" />
          <stop offset="30%" stopColor="#707070" />
          <stop offset="70%" stopColor="#606060" />
          <stop offset="100%" stopColor="#484848" />
        </linearGradient>

        <radialGradient id={`pittingGradient-${enemyType}`} cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#808890" />
          <stop offset="50%" stopColor="#606870" />
          <stop offset="100%" stopColor="#404850" />
        </radialGradient>
      </defs>

      <g transform={`translate(${center}, ${center})`}>
        {/* ═══════════════════════════════════════════════════════════════
            ПЫЛЬ (dust) — облачко мелких частиц
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'dust' && (
          <g>
            <ellipse cx={0} cy={size*0.6} rx={size*1.0} ry={size*0.3} fill={`url(#contactShadow-${enemyType})`} opacity={0.4} />
            <g opacity={0.85}>
              <circle cx={-size*0.35} cy={-size*0.25} r={size*0.45} fill={`url(#dustGradient-${enemyType})`} />
              <circle cx={size*0.25} cy={-size*0.15} r={size*0.38} fill={`url(#dustGradient-${enemyType})`} />
              <circle cx={0} cy={size*0.25} r={size*0.52} fill={`url(#dustGradient-${enemyType})`} />
              <circle cx={-size*0.25} cy={size*0.35} r={size*0.32} fill={`url(#dustGradient-${enemyType})`} />
              <circle cx={size*0.35} cy={size*0.25} r={size*0.28} fill={`url(#dustGradient-${enemyType})`} />
              <circle cx={0} cy={0} r={size*1.3} fill="rgba(156,163,175,0.1)" />
              <circle cx={size*1.0} cy={-size*0.3} r={size*0.12} fill="#9ca3af" opacity={0.5} />
              <circle cx={-size*0.9} cy={size*0.5} r={size*0.1} fill="#9ca3af" opacity={0.4} />
              <circle cx={size*0.6} cy={size*0.8} r={size*0.08} fill="#b0b5bd" opacity={0.35} />
            </g>
            <path
              d={`M ${-size*0.5} ${-size*0.5} Q ${0} ${-size*0.8} ${size*0.4} ${-size*0.4}`}
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
            />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            АБРАЗИВ (shard) — твёрдый осколок/зерно
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'abrasive' && (
          <g>
            <ellipse cx={0} cy={size*0.55} rx={size*0.75} ry={size*0.25} fill={`url(#contactShadow-${enemyType})`} opacity={0.6} />
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
              fill={`url(#abrasiveGradient-${enemyType})`}
            />
            <polygon
              points={`${size*0.1},${-size*0.95} ${size*0.75},${-size*0.45} ${size*0.2},${-size*0.1} ${-size*0.35},${-size*0.8}`}
              fill="rgba(255,255,255,0.15)"
            />
            <polygon
              points={`${size*0.55},${size*0.75} ${size*0.1},${size*0.9} ${-size*0.45},${size*0.7} ${0},${size*0.3}`}
              fill="rgba(0,0,0,0.2)"
            />
            <circle cx={-size*0.2} cy={-size*0.1} r={size*0.08} fill="#5c4020" opacity={0.5} />
            <circle cx={size*0.25} cy={size*0.2} r={size*0.06} fill="#6b4d25" opacity={0.4} />
            <circle cx={-size*0.35} cy={size*0.3} r={size*0.07} fill="#4a3015" opacity={0.45} />
            <circle cx={size*0.4} cy={-size*0.25} r={size*0.05} fill="#7a5c30" opacity={0.35} />
            <polygon
              points={`${size*0.7},${-size*0.3} ${size*0.85},${size*0.05} ${size*0.55},${-size*0.1}`}
              fill="#d4b896"
              opacity={0.7}
            />
            <path
              d={`M ${-size*0.35} ${-size*0.8} L ${size*0.1} ${-size*0.95} L ${size*0.75} ${-size*0.45}`}
              fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.5} strokeLinecap="round"
            />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ПЕРЕГРЕВ (heat) — горячий пузырь/очаг
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'heat' && (
          <g>
            <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill="rgba(255,107,53,0.08)" />
            <ellipse cx={0} cy={size*0.7} rx={size*0.9} ry={size*0.25} fill={`url(#contactShadow-${enemyType})`} opacity={0.3} />
            <ellipse cx={0} cy={0} rx={size*1.6} ry={size*1.5} fill={`url(#heatHaze-${enemyType})`}>
              {animated && (
                <>
                  <animate attributeName="rx" values={`${size*1.4};${size*1.8};${size*1.4}`} dur="1.8s" repeatCount="indefinite" />
                  <animate attributeName="ry" values={`${size*1.3};${size*1.7};${size*1.3}`} dur="1.8s" repeatCount="indefinite" />
                </>
              )}
            </ellipse>
            <ellipse cx={0} cy={size*0.05} rx={size*0.85} ry={size*0.95} fill={`url(#heatGradient-${enemyType})`} />
            <ellipse cx={0} cy={-size*0.15} rx={size*0.35} ry={size*0.4} fill="#fffde7" opacity={0.7}>
              {animated && (
                <animate attributeName="opacity" values="0.7;0.5;0.7" dur="1.2s" repeatCount="indefinite" />
              )}
            </ellipse>
            <circle cx={size*0.55} cy={-size*0.35} r={size*0.1} fill="#ffcc00" opacity={0.7}>
              {animated && (
                <>
                  <animate attributeName="cy" values={`${-size*0.35};${-size*0.9};${-size*0.35}`} dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0;0.7" dur="2s" repeatCount="indefinite" />
                </>
              )}
            </circle>
            <circle cx={-size*0.4} cy={-size*0.2} r={size*0.07} fill="#ffaa00" opacity={0.6}>
              {animated && (
                <>
                  <animate attributeName="cy" values={`${-size*0.2};${-size*0.75};${-size*0.2}`} dur="2.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
                </>
              )}
            </circle>
            <ellipse cx={-size*0.3} cy={-size*0.55} rx={size*0.25} ry={size*0.1} fill="rgba(255,255,255,0.5)" />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            СТРУЖКА (metal/shavings) — металлические завитки
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'metal' && (
          <g>
            <ellipse cx={0} cy={size*0.6} rx={size*0.85} ry={size*0.3} fill={`url(#contactShadow-${enemyType})`} opacity={0.6} />
            <path
              d={`M ${-size*0.85} ${-size*0.25}
                  Q ${-size*0.5} ${-size*0.95} ${size*0.2} ${-size*0.6}
                  Q ${size*0.85} ${-size*0.25} ${size*0.6} ${size*0.35}
                  Q ${size*0.35} ${size*0.75} ${size*0.1} ${size*0.65}`}
              fill="none"
              stroke={`url(#metalShavingGradient-${enemyType})`}
              strokeWidth={size * 0.28}
              strokeLinecap="round"
            />
            <path
              d={`M ${-size*0.75} ${-size*0.15}
                  Q ${-size*0.4} ${-size*0.75} ${size*0.15} ${-size*0.5}`}
              fill="none"
              stroke="rgba(40,40,50,0.4)"
              strokeWidth={size * 0.12}
              strokeLinecap="round"
            />
            <path
              d={`M ${-size*0.5} ${size*0.2}
                  Q ${-size*0.15} ${size*0.75} ${size*0.35} ${size*0.5}`}
              fill="none"
              stroke="#a0a0a0"
              strokeWidth={size * 0.18}
              strokeLinecap="round"
            />
            <path
              d={`M ${-size*0.7} ${-size*0.35}
                  Q ${-size*0.35} ${-size*0.85} ${size*0.25} ${-size*0.55}`}
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth={size * 0.06}
              strokeLinecap="round"
            />
            <path
              d={`M ${size*0.4} ${-size*0.35}
                  Q ${size*0.7} ${-size*0.1} ${size*0.55} ${size*0.25}`}
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={size * 0.08}
              strokeLinecap="round"
            />
            <circle cx={size*0.1} cy={size*0.65} r={size*0.08} fill="#808080" />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            КОРРОЗИЯ (corrosion/blob) — пятно/язва
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'corrosion' && (
          <g>
            <circle cx={0} cy={0} r={size*2.5} fill={`url(#corrosionAura-${enemyType})`} opacity={0.4} />
            <ellipse cx={0} cy={size*0.55} rx={size*0.8} ry={size*0.25} fill={`url(#contactShadow-${enemyType})`} opacity={0.5} />
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
              fill={`url(#corrosionGradient-${enemyType})`}
            />
            <ellipse cx={size*0.35} cy={-size*0.3} rx={size*0.18} ry={size*0.12} fill="#8b5a2b" opacity={0.6} />
            <ellipse cx={-size*0.25} cy={size*0.35} rx={size*0.12} ry={size*0.08} fill="#9b6a3b" opacity={0.5} />
            <ellipse cx={-size*0.2} cy={-size*0.15} rx={size*0.18} ry={size*0.12} fill="#1a3020" opacity={0.8} />
            <ellipse cx={size*0.3} cy={size*0.2} rx={size*0.14} ry={size*0.1} fill="#0f2518" opacity={0.75} />
            <ellipse cx={-size*0.35} cy={size*0.25} rx={size*0.1} ry={size*0.07} fill="#1a3020" opacity={0.7} />
            <ellipse cx={size*0.1} cy={-size*0.45} rx={size*0.08} ry={size*0.06} fill="#152a1c" opacity={0.65} />
            <circle cx={0} cy={size*0.5} r={size*0.05} fill="#0f2015" opacity={0.6} />
            <circle cx={size*0.6} cy={-size*0.5} r={size*0.06} fill="#6aac69" opacity={0.5} />
            <circle cx={-size*0.55} cy={size*0.5} r={size*0.05} fill="#7abc79" opacity={0.4} />
            <path
              d={`M ${-size*0.25} ${-size*0.85} Q ${size*0.2} ${-size*0.9} ${size*0.6} ${-size*0.55}`}
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeLinecap="round"
            />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ВЛАГА (moisture) — прозрачная капля
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'moisture' && (
          <g>
            <ellipse cx={0} cy={size*0.15} rx={size*0.9} ry={size*0.7} fill="rgba(30,60,100,0.15)" />
            <ellipse cx={0} cy={size*0.65} rx={size*0.7} ry={size*0.2} fill={`url(#contactShadow-${enemyType})`} opacity={0.35} />
            <ellipse cx={0} cy={size*0.1} rx={size*0.7} ry={size*0.95} fill={`url(#moistureGradient-${enemyType})`} />
            <ellipse cx={0} cy={size*0.2} rx={size*0.55} ry={size*0.75} fill="rgba(255,255,255,0.08)" />
            <ellipse cx={-size*0.15} cy={-size*0.3} rx={size*0.35} ry={size*0.18} fill="rgba(255,255,255,0.3)" />
            <ellipse cx={-size*0.22} cy={-size*0.5} rx={size*0.12} ry={size*0.07} fill="rgba(255,255,255,0.8)" />
            <ellipse cx={size*0.6} cy={size*0.55} rx={size*0.15} ry={size*0.2} fill={`url(#moistureGradient-${enemyType})`} opacity={0.7} />
            <ellipse cx={size*0.58} cy={size*0.48} rx={size*0.05} ry={size*0.03} fill="rgba(255,255,255,0.5)" />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            СТАТИКА (static/spark) — электрический разряд
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'static' && (
          <g>
            {animated && (
              <animate attributeName="opacity" values="1;0.5;0.9;0.6;1" dur="0.2s" repeatCount="indefinite" />
            )}
            <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill={`url(#sparkGlow-${enemyType})`} opacity={0.6} />
            <g stroke="#ffffff" strokeWidth={1.5} strokeLinecap="round" fill="none">
              <path d={`M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8}`}>
                {animated && (
                  <animate attributeName="d"
                    values={`M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8};
                             M ${size*0.15} ${-size*0.35} L ${size*0.6} ${-size*0.9} L ${size*0.25} ${-size*1.5} L ${size*0.55} ${-size*1.7};
                             M ${size*0.2} ${-size*0.3} L ${size*0.5} ${-size*1.0} L ${size*0.3} ${-size*1.4} L ${size*0.6} ${-size*1.8}`}
                    dur="0.4s" repeatCount="indefinite" />
                )}
              </path>
              <path d={`M ${size*0.35} ${size*0.15} L ${size*1.0} ${size*0.3} L ${size*1.4} ${size*0.15}`} opacity={0.9} />
              <path d={`M ${-size*0.3} ${size*0.1} L ${-size*0.9} ${-size*0.15} L ${-size*1.2} ${size*0.05}`} opacity={0.8} />
              <path d={`M ${-size*0.15} ${size*0.35} L ${-size*0.4} ${size*1.0} L ${-size*0.2} ${size*1.3}`} opacity={0.7} />
            </g>
            <g stroke="#ffe066" strokeWidth={1} strokeLinecap="round" fill="none" opacity={0.7}>
              <path d={`M ${size*0.1} ${-size*0.25} L ${-size*0.3} ${-size*0.8}`} />
              <path d={`M ${size*0.25} ${size*0.2} L ${size*0.7} ${size*0.6}`} />
            </g>
            <circle cx={0} cy={0} r={size*0.5} fill="#facc15" />
            <circle cx={0} cy={0} r={size*0.3} fill="#fff">
              {animated && (
                <animate attributeName="r" values={`${size*0.3};${size*0.35};${size*0.25};${size*0.3}`} dur="0.15s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx={0} cy={0} r={size*1.0} fill="none" stroke="#facc15" strokeWidth={1} opacity={0.5}>
              {animated && (
                <animate attributeName="r" values={`${size*0.9};${size*1.1};${size*0.9}`} dur="0.3s" repeatCount="indefinite" />
              )}
            </circle>
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ЗАДИР (boss_wear/scarred) — мини-босс, царапины на металле
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'boss_wear' && (
          <g>
            <ellipse cx={0} cy={size*0.6} rx={size*0.9} ry={size*0.35} fill={`url(#contactShadow-${enemyType})`} opacity={0.7} />
            <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#dc2626" strokeWidth={3} opacity={0.4}>
              {animated && (
                <>
                  <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="r" values={`${size*0.85};${size*0.95};${size*0.85}`} dur="2s" repeatCount="indefinite" />
                </>
              )}
            </circle>
            <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill={`url(#scarredGradient-${enemyType})`} />
            <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill="none" stroke="#5a5a5a" strokeWidth={3} />
            <path
              d={`M ${-size*0.75} ${-size*0.55} L ${size*0.6} ${size*0.5}`}
              fill="none" stroke="#1a1a1a" strokeWidth={4} strokeLinecap="round"
            />
            <path
              d={`M ${-size*0.7} ${-size*0.5} L ${size*0.55} ${size*0.45}`}
              fill="none" stroke="#909090" strokeWidth={1.5} strokeLinecap="round"
            />
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
            <circle cx={size*0.6} cy={size*0.5} r={size*0.1} fill="#991b1b" />
            <circle cx={size*0.7} cy={size*0.55} r={size*0.07} fill="#b91c1c" />
            <circle cx={size*0.55} cy={size*0.45} r={size*0.05} fill="#dc2626" />
            <ellipse cx={-size*0.4} cy={-size*0.45} rx={size*0.35} ry={size*0.12} fill="rgba(255,255,255,0.25)" />
            <path
              d={`M ${-size*0.8} ${-size*0.4} Q ${-size*0.3} ${-size*0.9} ${size*0.5} ${-size*0.7}`}
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2} strokeLinecap="round"
            />
          </g>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            ПИТТИНГ (boss_pitting/pitted) — босс, усталостные раковины
            ═══════════════════════════════════════════════════════════════ */}
        {enemyType === 'boss_pitting' && (
          <g>
            <ellipse cx={0} cy={size*0.65} rx={size*0.95} ry={size*0.35} fill={`url(#contactShadow-${enemyType})`} opacity={0.75} />
            <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#22c55e" strokeWidth={3} opacity={0.35}>
              {animated && (
                <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
              )}
            </circle>
            <circle cx={0} cy={0} r={size} fill={`url(#pittingGradient-${enemyType})`} />
            <circle cx={0} cy={0} r={size*0.85} fill="none" stroke="rgba(80,90,100,0.3)" strokeWidth={1} />
            <circle cx={0} cy={0} r={size*0.6} fill="none" stroke="rgba(80,90,100,0.2)" strokeWidth={1} />
            <circle cx={0} cy={0} r={size} fill="none" stroke="#4a5058" strokeWidth={3} />
            {/* Главный кратер */}
            <ellipse cx={-size*0.15} cy={size*0.15} rx={size*0.3} ry={size*0.25} fill="#050505" />
            <ellipse cx={-size*0.15} cy={size*0.08} rx={size*0.3} ry={size*0.08} fill="#707880" opacity={0.6} />
            <ellipse cx={-size*0.15} cy={size*0.15} rx={size*0.15} ry={size*0.12} fill="#22c55e" opacity={0.25}>
              {animated && (
                <animate attributeName="opacity" values="0.1;0.35;0.1" dur="2.5s" repeatCount="indefinite" />
              )}
            </ellipse>
            {/* Другие кратеры */}
            <ellipse cx={size*0.45} cy={-size*0.35} rx={size*0.2} ry={size*0.16} fill="#080808" />
            <ellipse cx={size*0.45} cy={-size*0.4} rx={size*0.2} ry={size*0.05} fill="#606870" opacity={0.5} />
            <ellipse cx={-size*0.5} cy={-size*0.3} rx={size*0.18} ry={size*0.14} fill="#0a0a0a" />
            <ellipse cx={-size*0.5} cy={-size*0.35} rx={size*0.18} ry={size*0.05} fill="#707880" opacity={0.5} />
            <ellipse cx={size*0.5} cy={size*0.35} rx={size*0.22} ry={size*0.17} fill="#060606" />
            <ellipse cx={size*0.5} cy={size*0.29} rx={size*0.22} ry={size*0.06} fill="#606870" opacity={0.55} />
            <ellipse cx={-size*0.45} cy={size*0.5} rx={size*0.15} ry={size*0.11} fill="#0a0a0a" />
            <circle cx={size*0.7} cy={0} r={size*0.08} fill="#0a0a0a" />
            <circle cx={-size*0.7} cy={size*0.15} r={size*0.07} fill="#080808" />
            <ellipse cx={-size*0.35} cy={-size*0.5} rx={size*0.4} ry={size*0.12} fill="rgba(255,255,255,0.2)" />
            <path
              d={`M ${-size*0.85} ${-size*0.35} Q ${-size*0.2} ${-size*0.95} ${size*0.6} ${-size*0.65}`}
              fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2.5} strokeLinecap="round"
            />
          </g>
        )}
      </g>
    </svg>
  );
}
