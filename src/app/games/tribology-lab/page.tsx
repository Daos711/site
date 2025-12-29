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

  // Увеличенные размеры
  const cellSize = 100;
  const cellGap = 8;
  const cellInset = 6;
  const conveyorWidth = 52;
  const gridWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * cellGap;
  const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const panelPadding = 16;
  const totalWidth = gridWidth + panelPadding * 2 + conveyorWidth * 2;
  const totalHeight = gridHeight + panelPadding * 2 + conveyorWidth * 2;

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
      // Проверяем, что мы внутри ячейки, а не в gap
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
          // Покупка из магазина
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
          // Перемещение или мердж
          const draggedModule = modules.find(m => m.id === dragState.moduleId);
          if (draggedModule) {
            if (!existingModule) {
              // Просто перемещение
              setModules(prev => prev.map(m =>
                m.id === dragState.moduleId ? { ...m, x: targetCell.x, y: targetCell.y } : m
              ));
            } else if (
              existingModule.id !== dragState.moduleId &&
              existingModule.type === draggedModule.type &&
              existingModule.level === draggedModule.level &&
              existingModule.level < 5
            ) {
              // Мердж
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
  const ModuleTile = ({ module, isDragging = false }: { module: { type: ModuleType; level: number }; isDragging?: boolean }) => {
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
          border: `2px solid ${gradient.border}`,
          boxShadow: `0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px ${config.color}40`,
        }}
      >
        <span className="text-4xl drop-shadow-lg">{config.icon}</span>
        <div
          className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
          style={{
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

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <h1 className="text-2xl font-bold text-amber-400">⚙️ Tribology Lab</h1>

      {/* Статус-бар */}
      <div className="flex items-center gap-8 text-lg mb-2">
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
        {/* Внешняя рамка (металл) */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(145deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '3px solid #f59e0b',
          }}
        />

        {/* Конвейер - левая сторона (вверх) */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: 0,
            top: conveyorWidth,
            width: conveyorWidth,
            height: totalHeight - conveyorWidth * 2,
          }}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-around"
            style={{
              background: 'linear-gradient(90deg, #374151 0%, #4b5563 50%, #374151 100%)',
              borderRight: '2px solid #6b7280',
              borderLeft: '2px solid #1f2937',
            }}
          >
            {/* Разметка конвейера */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-8 h-1 bg-gray-600 rounded opacity-60" />
            ))}
            <div className="absolute text-gray-400 text-lg">↑</div>
          </div>
        </div>

        {/* Конвейер - верхняя сторона (вправо) */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: conveyorWidth,
            top: 0,
            width: totalWidth - conveyorWidth * 2,
            height: conveyorWidth,
          }}
        >
          <div
            className="w-full h-full flex items-center justify-around"
            style={{
              background: 'linear-gradient(180deg, #374151 0%, #4b5563 50%, #374151 100%)',
              borderBottom: '2px solid #6b7280',
              borderTop: '2px solid #1f2937',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-1 h-8 bg-gray-600 rounded opacity-60" />
            ))}
            <div className="absolute text-gray-400 text-lg">→</div>
          </div>
        </div>

        {/* Конвейер - правая сторона (вниз) */}
        <div
          className="absolute overflow-hidden"
          style={{
            right: 0,
            top: conveyorWidth,
            width: conveyorWidth,
            height: totalHeight - conveyorWidth * 2,
          }}
        >
          <div
            className="w-full h-full flex flex-col items-center justify-around"
            style={{
              background: 'linear-gradient(90deg, #374151 0%, #4b5563 50%, #374151 100%)',
              borderLeft: '2px solid #6b7280',
              borderRight: '2px solid #1f2937',
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-8 h-1 bg-gray-600 rounded opacity-60" />
            ))}
            <div className="absolute text-gray-400 text-lg">↓</div>
          </div>
        </div>

        {/* Конвейер - нижняя сторона */}
        <div
          className="absolute overflow-hidden"
          style={{
            left: conveyorWidth,
            bottom: 0,
            width: totalWidth - conveyorWidth * 2,
            height: conveyorWidth,
          }}
        >
          <div
            className="w-full h-full flex items-center justify-around relative"
            style={{
              background: 'linear-gradient(0deg, #374151 0%, #4b5563 50%, #374151 100%)',
              borderTop: '2px solid #6b7280',
              borderBottom: '2px solid #1f2937',
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-1 h-8 bg-gray-600 rounded opacity-60" />
            ))}
          </div>
        </div>

        {/* Угол: старт (левый нижний) */}
        <div
          className="absolute flex items-center justify-center rounded-bl-2xl"
          style={{
            left: 0,
            bottom: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: 'linear-gradient(135deg, #374151, #4b5563)',
            borderRight: '2px solid #6b7280',
            borderTop: '2px solid #6b7280',
          }}
        >
          <div className="text-green-400 text-xl font-bold">▶</div>
        </div>

        {/* Угол: левый верхний */}
        <div
          className="absolute rounded-tl-2xl"
          style={{
            left: 0,
            top: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: 'linear-gradient(135deg, #374151, #4b5563)',
            borderRight: '2px solid #6b7280',
            borderBottom: '2px solid #6b7280',
          }}
        />

        {/* Угол: правый верхний */}
        <div
          className="absolute rounded-tr-2xl"
          style={{
            right: 0,
            top: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: 'linear-gradient(135deg, #374151, #4b5563)',
            borderLeft: '2px solid #6b7280',
            borderBottom: '2px solid #6b7280',
          }}
        />

        {/* Угол: правый нижний (финиш) */}
        <div
          className="absolute flex items-center justify-center rounded-br-2xl"
          style={{
            right: 0,
            bottom: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: 'linear-gradient(135deg, #374151, #4b5563)',
            borderLeft: '2px solid #6b7280',
            borderTop: '2px solid #6b7280',
          }}
        >
          <div className="text-red-400 text-xl">🏁</div>
        </div>

        {/* Внутренняя панель с сеткой */}
        <div
          className="absolute rounded-xl"
          style={{
            left: conveyorWidth,
            top: conveyorWidth,
            width: gridWidth + panelPadding * 2,
            height: gridHeight + panelPadding * 2,
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16162a 100%)',
            boxShadow: 'inset 0 2px 15px rgba(0,0,0,0.6)',
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
                      rounded-xl transition-all duration-150 relative
                      ${isDropTarget ? 'ring-2 ring-green-500 ring-opacity-70' : ''}
                      ${canMerge ? 'ring-2 ring-yellow-400 ring-opacity-70' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: 'linear-gradient(145deg, #0f0f1a 0%, #1a1a2e 100%)',
                      boxShadow: 'inset 0 3px 10px rgba(0,0,0,0.7), inset 0 -1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    {module && !isDraggingThis && (
                      <div
                        className="absolute cursor-grab active:cursor-grabbing"
                        style={{
                          inset: cellInset,
                        }}
                        onMouseDown={(e) => handleFieldDragStart(e, module)}
                        onTouchStart={(e) => handleFieldDragStart(e, module)}
                      >
                        <ModuleTile module={module} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Нижняя панель магазина - ближе к полю */}
      <div
        className="w-full max-w-2xl rounded-xl p-4 -mt-1"
        style={{
          background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
          border: '1px solid #3a3a3a',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-medium">Магазин модулей</span>
          <button
            className="flex items-center gap-1 px-3 py-1 rounded-lg text-sm bg-slate-700 hover:bg-slate-600 transition-colors"
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

        <div className="flex items-center gap-3 justify-center">
          {shop.map((moduleType, index) => {
            const config = MODULES[moduleType];
            const gradient = MODULE_GRADIENTS[moduleType];
            const canAfford = gold >= config.basePrice;
            const isDraggingThis = dragState?.type === 'shop' && dragState.shopIndex === index;

            return (
              <div
                key={index}
                className={`
                  relative w-20 h-24 rounded-xl transition-all duration-150
                  ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:scale-105'}
                  ${isDraggingThis ? 'opacity-30' : ''}
                `}
                style={{
                  background: gradient.bg,
                  border: `2px solid ${gradient.border}`,
                  boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 15px ${config.color}30`,
                }}
                onMouseDown={(e) => canAfford && handleShopDragStart(e, index)}
                onTouchStart={(e) => canAfford && handleShopDragStart(e, index)}
              >
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <span className="text-3xl drop-shadow-lg">{config.icon}</span>
                  <div className="flex items-center gap-1 text-xs bg-black/30 px-2 py-0.5 rounded-full">
                    <span className="text-yellow-400">🪙</span>
                    <span className={canAfford ? 'text-white' : 'text-red-400'}>{config.basePrice}</span>
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
            left: dragState.currentX - 40,
            top: dragState.currentY - 40,
            width: 80,
            height: 80,
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
          />
        </div>
      )}

      {/* Подсказка */}
      <p className="text-gray-500 text-sm text-center max-w-md">
        Перетащи модуль из магазина на поле. Два одинаковых модуля одного уровня можно объединить.
      </p>
    </div>
  );
}
