"use client";

import { useState, useRef, useEffect } from "react";
import {
  MODULES,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_LIVES,
  INITIAL_GOLD,
  type ModuleType,
  type Module,
} from "@/lib/tribology-lab/types";

// Начальные модули в магазине
const INITIAL_SHOP: ModuleType[] = ['magnet', 'cooler', 'filter', 'magnet', 'cooler', 'filter'];

// Цвета градиентов для карточек модулей
const MODULE_GRADIENTS: Record<ModuleType, { bg: string; border: string }> = {
  magnet: { bg: 'linear-gradient(145deg, #7c3aed 0%, #4c1d95 100%)', border: '#a78bfa' },
  cooler: { bg: 'linear-gradient(145deg, #0ea5e9 0%, #0369a1 100%)', border: '#7dd3fc' },
  filter: { bg: 'linear-gradient(145deg, #f59e0b 0%, #b45309 100%)', border: '#fcd34d' },
  lubricant: { bg: 'linear-gradient(145deg, #a855f7 0%, #7e22ce 100%)', border: '#c4b5fd' },
  ultrasonic: { bg: 'linear-gradient(145deg, #14b8a6 0%, #0f766e 100%)', border: '#5eead4' },
  laser: { bg: 'linear-gradient(145deg, #ef4444 0%, #b91c1c 100%)', border: '#fca5a5' },
};

interface DragState {
  type: 'shop' | 'field';
  shopIndex?: number;
  moduleId?: string;
  moduleType: ModuleType;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export default function TribologyLabPage() {
  const [wave] = useState(1);
  const [lives] = useState(INITIAL_LIVES);
  const [gold, setGold] = useState(INITIAL_GOLD);
  const [modules, setModules] = useState<Module[]>([]);
  const [shop, setShop] = useState<ModuleType[]>(INITIAL_SHOP);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Размеры
  const cellSize = 110;
  const cellGap = 14;
  const conveyorWidth = Math.round(cellSize * 0.95); // Увеличенная ширина канала (~1.0 ячейки)
  const cornerRadius = conveyorWidth * 1.0; // Увеличен для равномерной ширины канала на поворотах
  const gridWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * cellGap;
  const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const panelPadding = 16;

  const totalWidth = gridWidth + panelPadding * 2 + conveyorWidth * 2;
  const totalHeight = gridHeight + panelPadding * 2 + conveyorWidth;

  // Получить модуль в ячейке
  const getModuleAt = (x: number, y: number): Module | undefined => {
    return modules.find(m => m.x === x && m.y === y);
  };

  // Получить позицию ячейки по координатам мыши
  const getCellFromPosition = (clientX: number, clientY: number): { x: number; y: number } | null => {
    if (!fieldRef.current) return null;
    const rect = fieldRef.current.getBoundingClientRect();
    const gridStartX = conveyorWidth + panelPadding;
    const gridStartY = conveyorWidth + panelPadding;

    const relX = clientX - rect.left - gridStartX;
    const relY = clientY - rect.top - gridStartY;

    const cellX = Math.floor(relX / (cellSize + cellGap));
    const cellY = Math.floor(relY / (cellSize + cellGap));

    if (cellX >= 0 && cellX < GRID_COLS && cellY >= 0 && cellY < GRID_ROWS) {
      const inCellX = relX - cellX * (cellSize + cellGap);
      const inCellY = relY - cellY * (cellSize + cellGap);
      if (inCellX >= 0 && inCellX < cellSize && inCellY >= 0 && inCellY < cellSize) {
        return { x: cellX, y: cellY };
      }
    }
    return null;
  };

  // Начало перетаскивания из магазина
  const handleShopDragStart = (e: React.MouseEvent | React.TouchEvent, index: number) => {
    const moduleType = shop[index];
    const config = MODULES[moduleType];
    if (gold < config.basePrice) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState({
      type: 'shop',
      shopIndex: index,
      moduleType,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    });
  };

  // Начало перетаскивания с поля
  const handleFieldDragStart = (e: React.MouseEvent | React.TouchEvent, module: Module) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setDragState({
      type: 'field',
      moduleId: module.id,
      moduleType: module.type,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
    });
  };

  // Обработка перемещения
  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragState(prev => prev ? { ...prev, currentX: clientX, currentY: clientY } : null);
    };

    const handleEnd = (e: MouseEvent | TouchEvent) => {
      if (!dragState) return;

      const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
      const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
      const targetCell = getCellFromPosition(clientX, clientY);

      if (targetCell) {
        const existingModule = getModuleAt(targetCell.x, targetCell.y);

        if (dragState.type === 'shop') {
          if (!existingModule) {
            const config = MODULES[dragState.moduleType];
            if (gold >= config.basePrice) {
              const newModule: Module = {
                id: `${dragState.moduleType}-${Date.now()}`,
                type: dragState.moduleType,
                level: 1,
                x: targetCell.x,
                y: targetCell.y,
                lastAttack: 0,
              };
              setModules(prev => [...prev, newModule]);
              setGold(prev => prev - config.basePrice);
            }
          }
        } else if (dragState.type === 'field' && dragState.moduleId) {
          const draggedModule = modules.find(m => m.id === dragState.moduleId);
          if (draggedModule) {
            if (!existingModule) {
              setModules(prev => prev.map(m =>
                m.id === dragState.moduleId ? { ...m, x: targetCell.x, y: targetCell.y } : m
              ));
            } else if (
              existingModule.id !== dragState.moduleId &&
              existingModule.type === draggedModule.type &&
              existingModule.level === draggedModule.level &&
              existingModule.level < 5
            ) {
              setModules(prev => prev
                .filter(m => m.id !== dragState.moduleId)
                .map(m => m.id === existingModule.id ? { ...m, level: m.level + 1 } : m)
              );
            }
          }
        }
      }

      setDragState(null);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [dragState, gold, modules]);

  // Компонент плитки модуля
  const ModuleTile = ({ module, isDragging = false, size = cellSize }: { module: { type: ModuleType; level: number }; isDragging?: boolean; size?: number }) => {
    const config = MODULES[module.type];
    const gradient = MODULE_GRADIENTS[module.type];

    return (
      <div
        className={`
          w-full h-full rounded-xl flex flex-col items-center justify-center relative
          ${isDragging ? 'opacity-90 scale-105' : ''}
        `}
        style={{
          background: gradient.bg,
          border: `3px solid ${gradient.border}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px ${config.color}40, 0 2px 0 ${config.color}, 0 4px 15px ${config.color}50`,
        }}
      >
        <span style={{ fontSize: size * 0.4 }} className="drop-shadow-lg">{config.icon}</span>
        <div
          className="absolute top-2 right-2 rounded-full flex items-center justify-center font-bold shadow-lg"
          style={{
            width: size * 0.22,
            height: size * 0.22,
            fontSize: size * 0.14,
            background: 'linear-gradient(145deg, #1e1e1e, #2a2a2a)',
            border: `2px solid ${gradient.border}`,
            color: '#fff',
          }}
        >
          {module.level}
        </div>
      </div>
    );
  };

  // Координаты для SVG пути
  const innerOffset = 8; // Толщина бортика
  const pathOuter = {
    startX: 0,
    startY: totalHeight,
    leftTopY: cornerRadius,
    topLeftX: cornerRadius,
    topRightX: totalWidth - cornerRadius,
    rightTopY: cornerRadius,
    rightBottomY: totalHeight,
  };

  const pathInner = {
    startX: conveyorWidth,
    startY: totalHeight,
    leftTopY: conveyorWidth + 21,
    topLeftX: conveyorWidth + 21,
    topRightX: totalWidth - conveyorWidth - 21,
    rightTopY: conveyorWidth + 21,
    rightBottomY: totalHeight,
  };

  return (
    <div
      className="flex flex-col items-center gap-3 py-4"
      style={{
        background: 'radial-gradient(ellipse at center, #0d1117 0%, #050608 70%, #000000 100%)',
        minHeight: '100vh',
      }}
    >
      <style jsx>{`
        @keyframes oilFlow {
          0% { transform: translateY(0); }
          100% { transform: translateY(20px); }
        }
        @keyframes oilFlowHorizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(20px); }
        }
        @keyframes pulseFinish {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .oil-flow-vertical {
          animation: oilFlow 3s linear infinite;
        }
        .oil-flow-horizontal {
          animation: oilFlowHorizontal 3s linear infinite;
        }
        .pulse-finish {
          animation: pulseFinish 2s ease-in-out infinite;
        }
      `}</style>

      <h1 className="text-3xl font-bold text-amber-400">⚙️ Tribology Lab</h1>

      {/* Статус-бар */}
      <div className="flex items-center gap-10 text-xl mb-2">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Волна:</span>
          <span className="font-bold text-white">{wave}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-400">❤️</span>
          <span className="font-bold text-white">{lives}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">🪙</span>
          <span className="font-bold text-white">{gold}</span>
        </div>
      </div>

      {/* Игровое поле */}
      <div
        ref={fieldRef}
        className="relative select-none"
        style={{ width: totalWidth, height: totalHeight + 130 }}
      >
        {/* Фон поля */}
        <div
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: totalWidth,
            height: totalHeight + 130,
            background: 'linear-gradient(145deg, #0d1117 0%, #161b22 100%)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
            borderRadius: `${cornerRadius}px ${cornerRadius}px 16px 16px`,
            border: '2px solid #21262d',
          }}
        />

        {/* SVG для масляного канала */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight + 130}
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Градиент для масляной плёнки с "живостью" */}
            <linearGradient id="oilGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0a1520" />
              <stop offset="25%" stopColor="#0f1f30" />
              <stop offset="50%" stopColor="#132740" />
              <stop offset="75%" stopColor="#0f1f30" />
              <stop offset="100%" stopColor="#0a1520" />
            </linearGradient>

            {/* Градиент для металлических бортиков (приглушённый) */}
            <linearGradient id="metalBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#454a52" />
              <stop offset="50%" stopColor="#2d3138" />
              <stop offset="100%" stopColor="#1a1e22" />
            </linearGradient>

            {/* Градиент для старта (бирюзовый) */}
            <radialGradient id="startGlow" cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="rgba(20, 184, 166, 0.5)" />
              <stop offset="100%" stopColor="rgba(20, 184, 166, 0)" />
            </radialGradient>

            {/* Градиент для финиша - глубокое затемнение */}
            <radialGradient id="finishGlow" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="rgba(180, 50, 30, 0.5)" />
              <stop offset="50%" stopColor="rgba(120, 40, 20, 0.3)" />
              <stop offset="100%" stopColor="rgba(80, 20, 10, 0)" />
            </radialGradient>

            {/* Глубокое затемнение внутри финиша */}
            <radialGradient id="finishInnerDark" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.9)" />
              <stop offset="60%" stopColor="rgba(0, 0, 0, 0.6)" />
              <stop offset="100%" stopColor="rgba(20, 10, 5, 0.3)" />
            </radialGradient>

            {/* ClipPath для обрезки по внешнему контуру - без "ушек" */}
            <clipPath id="outerClip">
              <path d={`
                M 0 ${totalHeight}
                L 0 ${cornerRadius}
                Q 0 0 ${cornerRadius} 0
                L ${totalWidth - cornerRadius} 0
                Q ${totalWidth} 0 ${totalWidth} ${cornerRadius}
                L ${totalWidth} ${totalHeight}
                Z
              `} />
            </clipPath>

            {/* ClipPath для масла - рамка с вырезанной панелью карточек */}
            {(() => {
              const innerR = cornerRadius - innerOffset;
              const innerCornerRadius = 21;
              return (
                <clipPath id="oilClip">
                  <path
                    fillRule="evenodd"
                    d={`
                      M ${innerOffset} ${totalHeight}
                      L ${innerOffset} ${innerOffset + innerR}
                      A ${innerR} ${innerR} 0 0 1 ${innerOffset + innerR} ${innerOffset}
                      L ${totalWidth - innerOffset - innerR} ${innerOffset}
                      A ${innerR} ${innerR} 0 0 1 ${totalWidth - innerOffset} ${innerOffset + innerR}
                      L ${totalWidth - innerOffset} ${totalHeight}
                      Z
                      M ${conveyorWidth} ${totalHeight}
                      L ${totalWidth - conveyorWidth} ${totalHeight}
                      L ${totalWidth - conveyorWidth} ${conveyorWidth + innerCornerRadius}
                      A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${totalWidth - conveyorWidth - innerCornerRadius} ${conveyorWidth}
                      L ${conveyorWidth + innerCornerRadius} ${conveyorWidth}
                      A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${conveyorWidth} ${conveyorWidth + innerCornerRadius}
                      Z
                    `}
                  />
                </clipPath>
              );
            })()}

            {/* Анимированный блик масла */}
            <linearGradient id="oilSheen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="45%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(100, 150, 200, 0.08)" />
              <stop offset="55%" stopColor="transparent" />
              <stop offset="100%" stopColor="transparent" />
              <animate
                attributeName="x1"
                values="-100%;200%"
                dur="12s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="0%;300%"
                dur="12s"
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>

          {/* Металлический бортик - с дугами для одинаковой ширины */}
          {(() => {
            const outerR = cornerRadius;
            const innerR = cornerRadius - innerOffset;
            return (
              <path
                d={`
                  M 0 ${totalHeight}
                  L 0 ${outerR}
                  A ${outerR} ${outerR} 0 0 1 ${outerR} 0
                  L ${totalWidth - outerR} 0
                  A ${outerR} ${outerR} 0 0 1 ${totalWidth} ${outerR}
                  L ${totalWidth} ${totalHeight}
                  L ${totalWidth - innerOffset} ${totalHeight}
                  L ${totalWidth - innerOffset} ${innerOffset + innerR}
                  A ${innerR} ${innerR} 0 0 0 ${totalWidth - innerOffset - innerR} ${innerOffset}
                  L ${innerOffset + innerR} ${innerOffset}
                  A ${innerR} ${innerR} 0 0 0 ${innerOffset} ${innerOffset + innerR}
                  L ${innerOffset} ${totalHeight}
                  Z
                `}
                fill="url(#metalBorderGradient)"
              />
            );
          })()}

          {/* Масляный канал и пятна масла - всё в группе с clipPath */}
          <g clipPath="url(#oilClip)">
            {(() => {
              const innerR = cornerRadius - innerOffset;
              const innerCornerRadius = 21; // Фиксированный радиус для соответствия панели карточек
              return (
                <path
                  d={`
                    M ${innerOffset} ${totalHeight}
                    L ${innerOffset} ${innerOffset + innerR}
                    A ${innerR} ${innerR} 0 0 1 ${innerOffset + innerR} ${innerOffset}
                    L ${totalWidth - innerOffset - innerR} ${innerOffset}
                    A ${innerR} ${innerR} 0 0 1 ${totalWidth - innerOffset} ${innerOffset + innerR}
                    L ${totalWidth - innerOffset} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${totalWidth - conveyorWidth - innerCornerRadius} ${conveyorWidth}
                    L ${conveyorWidth + innerCornerRadius} ${conveyorWidth}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    L ${conveyorWidth} ${totalHeight}
                    Z
                  `}
                  fill="url(#oilGradientMain)"
                />
              );
            })()}

            {/* Мелкие органичные пятна масла (у краёв и в углах) */}
            {/* Левый участок - у внутреннего края */}
            <ellipse cx={conveyorWidth - 15} cy={totalHeight * 0.35} rx={6} ry={10} fill="rgba(25, 50, 80, 0.35)" transform="rotate(-5)" />
            <ellipse cx={conveyorWidth - 20} cy={totalHeight * 0.55} rx={4} ry={7} fill="rgba(30, 55, 85, 0.3)" />
            <ellipse cx={conveyorWidth - 12} cy={totalHeight * 0.75} rx={5} ry={8} fill="rgba(25, 50, 80, 0.25)" transform="rotate(10)" />
            {/* В левом верхнем углу */}
            <ellipse cx={conveyorWidth * 0.7} cy={conveyorWidth * 0.7} rx={8} ry={6} fill="rgba(30, 55, 85, 0.3)" transform="rotate(-30)" />
            {/* Верхний участок */}
            <ellipse cx={totalWidth * 0.3} cy={conveyorWidth - 15} rx={7} ry={4} fill="rgba(25, 50, 80, 0.3)" />
            <ellipse cx={totalWidth * 0.5} cy={conveyorWidth - 18} rx={5} ry={3} fill="rgba(30, 55, 85, 0.25)" transform="rotate(5)" />
            <ellipse cx={totalWidth * 0.7} cy={conveyorWidth - 12} rx={6} ry={4} fill="rgba(25, 50, 80, 0.3)" transform="rotate(-8)" />
            {/* В правом верхнем углу */}
            <ellipse cx={totalWidth - conveyorWidth * 0.7} cy={conveyorWidth * 0.7} rx={7} ry={5} fill="rgba(30, 55, 85, 0.3)" transform="rotate(25)" />
            {/* Правый участок */}
            <ellipse cx={totalWidth - conveyorWidth + 15} cy={totalHeight * 0.4} rx={5} ry={9} fill="rgba(25, 50, 80, 0.3)" transform="rotate(8)" />
            <ellipse cx={totalWidth - conveyorWidth + 18} cy={totalHeight * 0.6} rx={4} ry={6} fill="rgba(30, 55, 85, 0.25)" />

            {/* Анимированный блик поверх масла */}
            {(() => {
              const innerR = cornerRadius - innerOffset;
              const innerCornerRadius = 21;
              return (
                <path
                  d={`
                    M ${innerOffset} ${totalHeight}
                    L ${innerOffset} ${innerOffset + innerR}
                    A ${innerR} ${innerR} 0 0 1 ${innerOffset + innerR} ${innerOffset}
                    L ${totalWidth - innerOffset - innerR} ${innerOffset}
                    A ${innerR} ${innerR} 0 0 1 ${totalWidth - innerOffset} ${innerOffset + innerR}
                    L ${totalWidth - innerOffset} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${totalHeight}
                    L ${totalWidth - conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${totalWidth - conveyorWidth - innerCornerRadius} ${conveyorWidth}
                    L ${conveyorWidth + innerCornerRadius} ${conveyorWidth}
                    A ${innerCornerRadius} ${innerCornerRadius} 0 0 0 ${conveyorWidth} ${conveyorWidth + innerCornerRadius}
                    L ${conveyorWidth} ${totalHeight}
                    Z
                  `}
                  fill="url(#oilSheen)"
                  style={{ pointerEvents: 'none' }}
                />
              );
            })()}
          </g>

          {/* Болты/заклёпки - по центру ширины бортика */}
          {/* Левая сторона */}
          <circle cx={innerOffset / 2} cy={conveyorWidth + 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={innerOffset / 2} cy={totalHeight - 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          {/* Верхняя сторона */}
          <circle cx={conveyorWidth + 60} cy={innerOffset / 2} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={totalWidth / 2} cy={innerOffset / 2} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={totalWidth - conveyorWidth - 60} cy={innerOffset / 2} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          {/* Правая сторона */}
          <circle cx={totalWidth - innerOffset / 2} cy={conveyorWidth + 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />
          <circle cx={totalWidth - innerOffset / 2} cy={totalHeight - 60} r={3} fill="#22262a" stroke="#333840" strokeWidth={0.5} />

          {/* СТАРТ - бирюзовый патрубок (касается обводки панели) */}
          <g>
            {/* Свечение */}
            <ellipse cx={(innerOffset + conveyorWidth - 2) / 2} cy={totalHeight + 3} rx={(conveyorWidth - innerOffset - 2) * 0.45} ry={12} fill="url(#startGlow)" />
            {/* Патрубок */}
            <rect x={innerOffset} y={totalHeight - 6} width={conveyorWidth - innerOffset - 2} height={12} rx={3} fill="#0a2e2a" stroke="#0d9488" strokeWidth={1.5} />
            {/* Щель с тенью */}
            <rect x={innerOffset + 8} y={totalHeight - 2} width={conveyorWidth - innerOffset - 18} height={4} rx={2} fill="#051515" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.8))' }} />
            {/* Мелкие частицы */}
            <circle cx={(innerOffset + conveyorWidth - 2) / 2 - 15} cy={totalHeight - 18} r={2} fill="rgba(20, 184, 166, 0.4)" />
            <circle cx={(innerOffset + conveyorWidth - 2) / 2 + 20} cy={totalHeight - 30} r={1.5} fill="rgba(20, 184, 166, 0.3)" />
          </g>

          {/* ФИНИШ - красно-янтарная горловина (касается обводки панели) */}
          {/* Свечение с пульсацией */}
          <ellipse cx={totalWidth - (conveyorWidth + innerOffset + 2) / 2} cy={totalHeight + 3} rx={(conveyorWidth - innerOffset - 2) * 0.45} ry={12} fill="url(#finishGlow)">
            <animate attributeName="opacity" values="0.5;0.8;0.5" dur="4s" repeatCount="indefinite" />
          </ellipse>
          <g>
            {/* Горловина */}
            <path
              d={`
                M ${totalWidth - conveyorWidth + 2} ${totalHeight - 4}
                Q ${totalWidth - (conveyorWidth + innerOffset) / 2} ${totalHeight + 8} ${totalWidth - innerOffset} ${totalHeight - 4}
                L ${totalWidth - innerOffset - 3} ${totalHeight + 6}
                Q ${totalWidth - (conveyorWidth + innerOffset) / 2} ${totalHeight + 18} ${totalWidth - conveyorWidth + 5} ${totalHeight + 6}
                Z
              `}
              fill="#1a0f0a"
              stroke="#8b3a2a"
              strokeWidth={1.5}
            />
            {/* Глубокое затемнение внутри */}
            <ellipse cx={totalWidth - (conveyorWidth + innerOffset) / 2} cy={totalHeight + 6} rx={(conveyorWidth - innerOffset - 2) * 0.35} ry={6} fill="url(#finishInnerDark)" />
          </g>

          {/* Карман магазина — расширен до бортиков */}
          <rect
            x={innerOffset}
            y={totalHeight + 5}
            width={totalWidth - innerOffset * 2}
            height={115}
            rx={8}
            fill="rgba(0,0,0,0.3)"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={1}
          />

          {/* Винты крепления кармана */}
          <circle cx={innerOffset + 15} cy={totalHeight + 20} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />
          <circle cx={totalWidth - innerOffset - 15} cy={totalHeight + 20} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />
          <circle cx={innerOffset + 15} cy={totalHeight + 100} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />
          <circle cx={totalWidth - innerOffset - 15} cy={totalHeight + 100} r={3} fill="#1a1e22" stroke="#333" strokeWidth={0.5} />

          {/* LED индикаторы */}
          <circle cx={innerOffset + 25} cy={totalHeight + 60} r={4} fill="#0ea5e9" opacity={0.6}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx={totalWidth - innerOffset - 25} cy={totalHeight + 60} r={4} fill="#f59e0b" opacity={0.6}>
            <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
          </circle>
        </svg>

        {/* Внутренняя панель с сеткой */}
        <div
          className="absolute"
          style={{
            left: conveyorWidth,
            top: conveyorWidth,
            width: gridWidth + panelPadding * 2,
            height: gridHeight + panelPadding * 2,
            background: 'linear-gradient(145deg, #0a0f15 0%, #0d1218 100%)',
            backgroundImage: `
              repeating-linear-gradient(
                135deg,
                transparent,
                transparent 1px,
                rgba(255,255,255,0.015) 1px,
                rgba(255,255,255,0.015) 2px
              )
            `,
            boxShadow: 'inset 0 8px 40px rgba(0,0,0,0.95), inset 0 -4px 20px rgba(0,0,0,0.5), inset 4px 0 20px rgba(0,0,0,0.3), inset -4px 0 20px rgba(0,0,0,0.3)',
            borderRadius: '21px 21px 0 0',
            borderTop: '2px solid #1a2530',
            borderLeft: '2px solid #1a2530',
            borderRight: '2px solid #1a2530',
          }}
        >
          {/* Сетка 4x3 */}
          <div
            className="absolute grid"
            style={{
              left: panelPadding,
              top: panelPadding,
              gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, ${cellSize}px)`,
              gap: cellGap,
            }}
          >
            {Array.from({ length: GRID_ROWS }).map((_, y) =>
              Array.from({ length: GRID_COLS }).map((_, x) => {
                const module = getModuleAt(x, y);
                const isDraggingThis = dragState?.type === 'field' && dragState.moduleId === module?.id;
                const isDropTarget = dragState && !module;
                const canMerge = dragState && module && (() => {
                  if (dragState.type === 'field') {
                    const dragged = modules.find(m => m.id === dragState.moduleId);
                    return dragged && dragged.type === module.type && dragged.level === module.level && module.level < 5;
                  }
                  return dragState.moduleType === module.type && module.level === 1 && module.level < 5;
                })();

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      rounded-xl transition-all duration-150 relative overflow-hidden
                      ${isDropTarget ? 'ring-4 ring-green-500 ring-opacity-70' : ''}
                      ${canMerge ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: 'linear-gradient(145deg, #080c10 0%, #0f1318 100%)',
                      boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.02)',
                    }}
                  >
                    {module && !isDraggingThis && (
                      <div
                        className="absolute inset-0 cursor-grab active:cursor-grabbing"
                        onMouseDown={(e) => handleFieldDragStart(e, module)}
                        onTouchStart={(e) => handleFieldDragStart(e, module)}
                      >
                        <ModuleTile module={module} size={cellSize} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Магазин — внутри контейнера поля */}
        <div
          className="absolute flex justify-center gap-4"
          style={{
            left: 20,
            right: 20,
            top: totalHeight + 15,
          }}
        >
          {shop.map((moduleType, index) => {
            const config = MODULES[moduleType];
            const gradient = MODULE_GRADIENTS[moduleType];
            const canAfford = gold >= config.basePrice;
            const isDraggingThis = dragState?.type === 'shop' && dragState.shopIndex === index;
            const shopCardSize = 80;

            return (
              <div
                key={index}
                className={`
                  relative rounded-xl transition-all duration-150
                  ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-105'}
                  ${isDraggingThis ? 'opacity-30' : ''}
                `}
                style={{
                  width: shopCardSize,
                  height: shopCardSize + 14,
                  background: gradient.bg,
                  border: `3px solid ${gradient.border}`,
                  boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 15px ${config.color}30, 0 8px 16px rgba(0,0,0,0.5)`,
                }}
                onMouseDown={(e) => canAfford && handleShopDragStart(e, index)}
                onTouchStart={(e) => canAfford && handleShopDragStart(e, index)}
              >
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <span className="text-3xl drop-shadow-lg">{config.icon}</span>
                  <div className="flex items-center gap-1 text-xs bg-black/30 px-2 py-0.5 rounded-full">
                    <span className="text-yellow-400">🪙</span>
                    <span className={canAfford ? 'text-white font-medium' : 'text-red-400 font-medium'}>{config.basePrice}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Перетаскиваемый модуль */}
      {dragState && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragState.currentX - cellSize / 2,
            top: dragState.currentY - cellSize / 2,
            width: cellSize,
            height: cellSize,
          }}
        >
          <ModuleTile
            module={{
              type: dragState.moduleType,
              level: dragState.type === 'field'
                ? modules.find(m => m.id === dragState.moduleId)?.level || 1
                : 1
            }}
            isDragging
            size={cellSize}
          />
        </div>
      )}

      {/* Подсказка */}
      <p className="text-gray-500 text-sm text-center max-w-lg mt-2">
        Перетащи модуль из магазина на поле. Два одинаковых модуля одного уровня можно объединить.
      </p>
    </div>
  );
}
