"use client";

import { useState } from "react";
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

export default function TribologyLabPage() {
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gold, setGold] = useState(INITIAL_GOLD);
  const [modules, setModules] = useState<Module[]>([]);
  const [shop, setShop] = useState<ModuleType[]>(INITIAL_SHOP);
  const [selectedShopIndex, setSelectedShopIndex] = useState<number | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Размеры
  const cellSize = 80;
  const cellGap = 8;
  const conveyorWidth = 48;
  const gridWidth = GRID_COLS * cellSize + (GRID_COLS - 1) * cellGap;
  const gridHeight = GRID_ROWS * cellSize + (GRID_ROWS - 1) * cellGap;
  const panelPadding = 16;
  const totalWidth = gridWidth + panelPadding * 2 + conveyorWidth * 2;
  const totalHeight = gridHeight + panelPadding * 2 + conveyorWidth * 2;

  // Получить модуль в ячейке
  const getModuleAt = (x: number, y: number): Module | undefined => {
    return modules.find(m => m.x === x && m.y === y);
  };

  // Клик по ячейке
  const handleCellClick = (x: number, y: number) => {
    const existingModule = getModuleAt(x, y);

    if (selectedShopIndex !== null) {
      // Покупка модуля из магазина
      if (!existingModule) {
        const moduleType = shop[selectedShopIndex];
        const config = MODULES[moduleType];

        if (gold >= config.basePrice) {
          const newModule: Module = {
            id: `${moduleType}-${Date.now()}`,
            type: moduleType,
            level: 1,
            x,
            y,
            lastAttack: 0,
          };
          setModules([...modules, newModule]);
          setGold(gold - config.basePrice);
          setSelectedShopIndex(null);
        }
      }
    } else if (existingModule) {
      // Выбор модуля для перемещения/мерджа
      if (selectedModule === existingModule.id) {
        setSelectedModule(null);
      } else if (selectedModule) {
        // Попытка мерджа
        const selected = modules.find(m => m.id === selectedModule);
        if (selected && selected.type === existingModule.type && selected.level === existingModule.level && selected.level < 5) {
          // Мердж!
          setModules(modules.filter(m => m.id !== selected.id).map(m =>
            m.id === existingModule.id ? { ...m, level: m.level + 1 } : m
          ));
          setSelectedModule(null);
        } else {
          setSelectedModule(existingModule.id);
        }
      } else {
        setSelectedModule(existingModule.id);
      }
    } else if (selectedModule) {
      // Перемещение модуля
      setModules(modules.map(m =>
        m.id === selectedModule ? { ...m, x, y } : m
      ));
      setSelectedModule(null);
    }
  };

  // Клик по карточке магазина
  const handleShopClick = (index: number) => {
    setSelectedModule(null);
    if (selectedShopIndex === index) {
      setSelectedShopIndex(null);
    } else {
      setSelectedShopIndex(index);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <h1 className="text-2xl font-bold text-amber-400">⚙️ Tribology Lab</h1>

      {/* Статус-бар */}
      <div className="flex items-center gap-8 text-lg">
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
        className="relative"
        style={{ width: totalWidth, height: totalHeight }}
      >
        {/* Внешняя рамка (металл) */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: 'linear-gradient(145deg, #4a4a4a 0%, #2a2a2a 50%, #3a3a3a 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: '2px solid #f59e0b',
          }}
        />

        {/* Конвейер - левая сторона (вверх) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: 0,
            top: conveyorWidth,
            width: conveyorWidth,
            height: totalHeight - conveyorWidth * 2,
            background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          }}
        >
          <div className="text-gray-500 text-2xl">↑</div>
        </div>

        {/* Конвейер - верхняя сторона (вправо) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: conveyorWidth,
            top: 0,
            width: totalWidth - conveyorWidth * 2,
            height: conveyorWidth,
            background: 'linear-gradient(180deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          }}
        >
          <div className="text-gray-500 text-2xl">→</div>
        </div>

        {/* Конвейер - правая сторона (вниз) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            right: 0,
            top: conveyorWidth,
            width: conveyorWidth,
            height: totalHeight - conveyorWidth * 2,
            background: 'linear-gradient(90deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          }}
        >
          <div className="text-gray-500 text-2xl">↓</div>
        </div>

        {/* Конвейер - нижняя сторона (для выхода) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: conveyorWidth,
            bottom: 0,
            width: totalWidth - conveyorWidth * 2,
            height: conveyorWidth,
            background: 'linear-gradient(0deg, #1e293b 0%, #334155 50%, #1e293b 100%)',
          }}
        >
          <div className="absolute right-4 text-green-500 text-xl">🏁</div>
        </div>

        {/* Угол: старт (левый нижний) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            left: 0,
            bottom: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: '#334155',
          }}
        >
          <div className="text-green-400 text-sm font-bold">▶</div>
        </div>

        {/* Угол: левый верхний */}
        <div
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: '#334155',
          }}
        />

        {/* Угол: правый верхний */}
        <div
          className="absolute"
          style={{
            right: 0,
            top: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: '#334155',
          }}
        />

        {/* Угол: правый нижний */}
        <div
          className="absolute"
          style={{
            right: 0,
            bottom: 0,
            width: conveyorWidth,
            height: conveyorWidth,
            background: '#334155',
          }}
        />

        {/* Внутренняя панель с сеткой */}
        <div
          className="absolute rounded-lg"
          style={{
            left: conveyorWidth,
            top: conveyorWidth,
            width: gridWidth + panelPadding * 2,
            height: gridHeight + panelPadding * 2,
            background: 'linear-gradient(145deg, #1e1e1e 0%, #2a2a2a 100%)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5)',
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
                const isSelected = module && selectedModule === module.id;
                const canPlace = selectedShopIndex !== null && !module;
                const canMerge = selectedModule && module && (() => {
                  const selected = modules.find(m => m.id === selectedModule);
                  return selected && selected.type === module.type && selected.level === module.level && selected.level < 5;
                })();

                return (
                  <div
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`
                      rounded-lg cursor-pointer transition-all duration-150
                      ${canPlace ? 'ring-2 ring-green-500 ring-opacity-50' : ''}
                      ${canMerge ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''}
                      ${isSelected ? 'ring-2 ring-amber-400' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: 'linear-gradient(145deg, #1a1a2e 0%, #16162a 100%)',
                      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6), inset 0 -1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    {module && (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center relative rounded-lg"
                        style={{
                          background: `radial-gradient(circle at center, ${MODULES[module.type].color}20 0%, transparent 70%)`,
                          boxShadow: `0 0 15px ${MODULES[module.type].color}40`,
                        }}
                      >
                        <span className="text-3xl">{MODULES[module.type].icon}</span>
                        <div
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{
                            background: MODULES[module.type].color,
                            color: '#fff',
                            boxShadow: `0 0 6px ${MODULES[module.type].color}`,
                          }}
                        >
                          {module.level}
                        </div>
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
        className="w-full max-w-2xl rounded-xl p-4"
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
                // Случайные модули
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
            const isSelected = selectedShopIndex === index;
            const canAfford = gold >= config.basePrice;

            return (
              <div
                key={index}
                onClick={() => canAfford && handleShopClick(index)}
                className={`
                  relative w-20 h-24 rounded-lg cursor-pointer transition-all duration-150
                  ${isSelected ? 'ring-2 ring-amber-400 scale-105' : ''}
                  ${!canAfford ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                `}
                style={{
                  background: `linear-gradient(145deg, #3a3a3a 0%, #2a2a2a 100%)`,
                  boxShadow: isSelected
                    ? `0 4px 15px ${config.color}40, 0 0 20px ${config.color}30`
                    : '0 2px 8px rgba(0,0,0,0.3)',
                  border: `1px solid ${isSelected ? config.color : '#4a4a4a'}`,
                }}
              >
                <div
                  className="w-full h-full flex flex-col items-center justify-center gap-1"
                  style={{
                    background: `radial-gradient(circle at center, ${config.color}15 0%, transparent 70%)`,
                  }}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-yellow-400">🪙</span>
                    <span className={canAfford ? 'text-white' : 'text-red-400'}>{config.basePrice}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Подсказка */}
      <p className="text-gray-500 text-sm text-center max-w-md">
        Выбери модуль в магазине и кликни на ячейку для установки.
        Два одинаковых модуля одного уровня можно объединить (merge).
      </p>
    </div>
  );
}
