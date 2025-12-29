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
  const cellSize = 120;
  const cellGap = 16; // Увеличенный зазор между ячейками
  const conveyorWidth = Math.round(cellSize * 0.7);
  const cornerRadius = conveyorWidth * 0.6; // Радиус скругления углов
  const gridWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * cellGap;
  const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const panelPadding = 20;

  // Размеры всего поля (без нижней дорожки)
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
          boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px ${config.color}40`,
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

  // Координаты для SVG пути (масляный канал)
  const pathOuter = {
    // Внешний край канала
    startX: 0,
    startY: totalHeight,
    // Левая сторона (вверх)
    leftTopX: 0,
    leftTopY: cornerRadius,
    // Левый верхний угол
    topLeftX: cornerRadius,
    topLeftY: 0,
    // Верхняя сторона (вправо)
    topRightX: totalWidth - cornerRadius,
    topRightY: 0,
    // Правый верхний угол
    rightTopX: totalWidth,
    rightTopY: cornerRadius,
    // Правая сторона (вниз)
    rightBottomX: totalWidth,
    rightBottomY: totalHeight,
  };

  const pathInner = {
    // Внутренний край канала
    startX: conveyorWidth,
    startY: totalHeight,
    // Левая сторона (вверх)
    leftTopX: conveyorWidth,
    leftTopY: conveyorWidth + cornerRadius * 0.5,
    // Левый верхний угол (скруглённый)
    topLeftX: conveyorWidth + cornerRadius * 0.5,
    topLeftY: conveyorWidth,
    // Верхняя сторона (вправо)
    topRightX: totalWidth - conveyorWidth - cornerRadius * 0.5,
    topRightY: conveyorWidth,
    // Правый верхний угол (скруглённый)
    rightTopX: totalWidth - conveyorWidth,
    rightTopY: conveyorWidth + cornerRadius * 0.5,
    // Правая сторона (вниз)
    rightBottomX: totalWidth - conveyorWidth,
    rightBottomY: totalHeight,
  };

  return (
    <div className="flex flex-col items-center gap-3 py-4">
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
        style={{ width: totalWidth, height: totalHeight }}
      >
        {/* Фон поля (без оранжевой рамки) */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)',
            boxShadow: '0 6px 30px rgba(0,0,0,0.6)',
          }}
        />

        {/* SVG для масляного канала */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight}
        >
          <defs>
            {/* Градиент для масляной плёнки */}
            <linearGradient id="oilGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="30%" stopColor="#2d4a6f" />
              <stop offset="50%" stopColor="#1e3a5f" />
              <stop offset="70%" stopColor="#3d5a7f" />
              <stop offset="100%" stopColor="#1e3a5f" />
            </linearGradient>
            {/* Градиент для металлических бортиков */}
            <linearGradient id="metalBorder" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>

          {/* Внешний контур канала (металлический бортик) */}
          <path
            d={`
              M ${pathOuter.startX} ${pathOuter.startY}
              L ${pathOuter.leftTopX} ${pathOuter.leftTopY}
              Q ${pathOuter.leftTopX} 0 ${pathOuter.topLeftX} ${pathOuter.topLeftY}
              L ${pathOuter.topRightX} ${pathOuter.topRightY}
              Q ${totalWidth} 0 ${pathOuter.rightTopX} ${pathOuter.rightTopY}
              L ${pathOuter.rightBottomX} ${pathOuter.rightBottomY}
              L ${pathInner.rightBottomX} ${pathInner.rightBottomY}
              L ${pathInner.rightTopX} ${pathInner.rightTopY}
              Q ${pathInner.rightTopX} ${conveyorWidth} ${pathInner.topRightX} ${pathInner.topRightY}
              L ${pathInner.topLeftX} ${pathInner.topLeftY}
              Q ${conveyorWidth} ${conveyorWidth} ${pathInner.leftTopX} ${pathInner.leftTopY}
              L ${pathInner.startX} ${pathInner.startY}
              Z
            `}
            fill="url(#oilGradient)"
            stroke="url(#metalBorder)"
            strokeWidth={3}
          />

          {/* Блики на масле */}
          <path
            d={`
              M ${conveyorWidth / 2} ${totalHeight - 50}
              L ${conveyorWidth / 2} ${conveyorWidth + 30}
            `}
            fill="none"
            stroke="rgba(100, 180, 255, 0.15)"
            strokeWidth={conveyorWidth * 0.3}
            strokeLinecap="round"
          />
          <path
            d={`
              M ${conveyorWidth + 30} ${conveyorWidth / 2}
              L ${totalWidth - conveyorWidth - 30} ${conveyorWidth / 2}
            `}
            fill="none"
            stroke="rgba(100, 180, 255, 0.15)"
            strokeWidth={conveyorWidth * 0.3}
            strokeLinecap="round"
          />
          <path
            d={`
              M ${totalWidth - conveyorWidth / 2} ${conveyorWidth + 30}
              L ${totalWidth - conveyorWidth / 2} ${totalHeight - 50}
            `}
            fill="none"
            stroke="rgba(100, 180, 255, 0.15)"
            strokeWidth={conveyorWidth * 0.3}
            strokeLinecap="round"
          />

          {/* Сегменты/рифление на канале */}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`left-${i}`}
              x1={conveyorWidth * 0.2}
              y1={conveyorWidth + 40 + i * 45}
              x2={conveyorWidth * 0.8}
              y2={conveyorWidth + 40 + i * 45}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={2}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`top-${i}`}
              x1={conveyorWidth + 40 + i * 52}
              y1={conveyorWidth * 0.2}
              x2={conveyorWidth + 40 + i * 52}
              y2={conveyorWidth * 0.8}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={2}
            />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line
              key={`right-${i}`}
              x1={totalWidth - conveyorWidth * 0.8}
              y1={conveyorWidth + 40 + i * 45}
              x2={totalWidth - conveyorWidth * 0.2}
              y2={conveyorWidth + 40 + i * 45}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={2}
            />
          ))}
        </svg>

        {/* Стрелки направления */}
        <div
          className="absolute text-cyan-400/60 text-xl font-bold"
          style={{ left: conveyorWidth / 2 - 8, top: totalHeight / 2 }}
        >
          ↑
        </div>
        <div
          className="absolute text-cyan-400/60 text-xl font-bold"
          style={{ left: totalWidth / 2 - 8, top: conveyorWidth / 2 - 10 }}
        >
          →
        </div>
        <div
          className="absolute text-cyan-400/60 text-xl font-bold"
          style={{ right: conveyorWidth / 2 - 8, top: totalHeight / 2 }}
        >
          ↓
        </div>

        {/* Старт */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: 0,
            bottom: -32,
            width: conveyorWidth,
            height: 30,
          }}
        >
          <span className="text-green-400 text-base font-bold">▶ СТАРТ</span>
        </div>

        {/* Финиш */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            right: 0,
            bottom: -32,
            width: conveyorWidth,
            height: 30,
          }}
        >
          <span className="text-red-400 text-base font-bold">🏁 ФИНИШ</span>
        </div>

        {/* Внутренняя панель с сеткой */}
        <div
          className="absolute rounded-xl"
          style={{
            left: conveyorWidth,
            top: conveyorWidth,
            width: gridWidth + panelPadding * 2,
            height: gridHeight + panelPadding * 2,
            background: 'linear-gradient(145deg, #12122a 0%, #0a0a1a 100%)',
            boxShadow: 'inset 0 3px 20px rgba(0,0,0,0.8)',
            border: '2px solid #2a2a4a',
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
                      background: 'linear-gradient(145deg, #0a0a18 0%, #151528 100%)',
                      boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.8), inset 0 -1px 0 rgba(255,255,255,0.03)',
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
      </div>

      {/* Нижняя панель магазина */}
      <div
        className="w-full max-w-3xl rounded-xl p-5 mt-10"
        style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #0f0f1a 100%)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
          border: '2px solid #2a2a4a',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-400 text-base font-medium">Магазин модулей</span>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-base bg-slate-700 hover:bg-slate-600 transition-colors"
            onClick={() => {
              if (gold >= 10) {
                setGold(gold - 10);
                const types: ModuleType[] = ['magnet', 'cooler', 'filter', 'lubricant', 'ultrasonic', 'laser'];
                const available = types.filter((_, i) => i < 3 + Math.floor(wave / 5));
                setShop(Array(6).fill(null).map(() => available[Math.floor(Math.random() * available.length)]));
              }
            }}
          >
            <span>🔄</span>
            <span className="text-yellow-400">10</span>
          </button>
        </div>

        <div className="flex items-center gap-4 justify-center">
          {shop.map((moduleType, index) => {
            const config = MODULES[moduleType];
            const gradient = MODULE_GRADIENTS[moduleType];
            const canAfford = gold >= config.basePrice;
            const isDraggingThis = dragState?.type === 'shop' && dragState.shopIndex === index;
            const shopCardSize = 85;

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
                  height: shopCardSize + 16,
                  background: gradient.bg,
                  border: `3px solid ${gradient.border}`,
                  boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 15px ${config.color}30`,
                }}
                onMouseDown={(e) => canAfford && handleShopDragStart(e, index)}
                onTouchStart={(e) => canAfford && handleShopDragStart(e, index)}
              >
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl drop-shadow-lg">{config.icon}</span>
                  <div className="flex items-center gap-1 text-sm bg-black/30 px-3 py-1 rounded-full">
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
      <p className="text-gray-500 text-base text-center max-w-lg mt-2">
        Перетащи модуль из магазина на поле. Два одинаковых модуля одного уровня можно объединить.
      </p>
    </div>
  );
}
