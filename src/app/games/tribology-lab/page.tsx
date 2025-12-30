"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  MODULES,
  ENEMIES,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_LIVES,
  INITIAL_GOLD,
  type ModuleType,
  type Module,
  type Enemy,
  type AttackEffect,
} from "@/lib/tribology-lab/types";
import {
  generatePath,
  getPathLength,
  getPositionOnPath,
  createEnemy,
  getWaveConfig,
  updateEnemy,
  hasReachedFinish,
  isDead,
  type WaveEnemy,
} from "@/lib/tribology-lab/enemies";
import {
  processAllAttacks,
  processBurnDamage,
  processBossRegeneration,
  generateShopSlots,
} from "@/lib/tribology-lab/combat";
import { ShopCard, FieldTile } from "@/lib/tribology-lab/components";

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

type GamePhase = 'preparing' | 'wave' | 'victory' | 'defeat';

export default function TribologyLabPage() {
  const [wave, setWave] = useState(1);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gold, setGold] = useState(99999); // Для тестирования
  const [modules, setModules] = useState<Module[]>([]);
  const modulesRef = useRef<Module[]>([]); // Ref для актуальных модулей в game loop
  const [shop, setShop] = useState<ModuleType[]>(INITIAL_SHOP);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [mergingCell, setMergingCell] = useState<{x: number, y: number} | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // Синхронизируем ref с state
  useEffect(() => {
    modulesRef.current = modules;
  }, [modules]);

  // Игровое состояние
  const [gamePhase, setGamePhase] = useState<GamePhase>('preparing');
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const enemiesRef = useRef<Enemy[]>([]); // ГЛАВНЫЙ источник истины для врагов в game loop
  const [spawnQueue, setSpawnQueue] = useState<{ id: string; type: string; spawnAt: number }[]>([]);
  const [waveStartTime, setWaveStartTime] = useState(0);
  const [attackEffects, setAttackEffects] = useState<AttackEffect[]>([]);
  const lastUpdateRef = useRef(0);
  const gameLoopRef = useRef<number>(0);
  const waveEndingRef = useRef(false); // Флаг чтобы endWave вызывался только раз
  const spawnedIdsRef = useRef<Set<string>>(new Set()); // Отслеживание заспавненных врагов

  // DEBUG: Скорость игры (1 = нормальная, 5 = быстрая)
  const [gameSpeed, setGameSpeed] = useState(1);

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

  // Путь для врагов
  const innerOffset = 8;
  const enemyPath = generatePath(totalWidth, totalHeight, conveyorWidth, innerOffset, cornerRadius);
  const pathLength = getPathLength(enemyPath);

  // Начало волны
  const startWave = useCallback(() => {
    if (gamePhase !== 'preparing') return;

    const config = getWaveConfig(wave);
    const queue: { id: string; type: string; spawnAt: number }[] = [];
    let currentTime = 0;
    let spawnIndex = 0;

    for (const group of config.enemies) {
      if (group.delay) {
        currentTime += group.delay;
      }
      for (let i = 0; i < group.count; i++) {
        queue.push({ id: `wave${wave}-spawn${spawnIndex++}`, type: group.type, spawnAt: currentTime });
        currentTime += config.spawnInterval;
      }
    }

    spawnedIdsRef.current.clear(); // Сбрасываем отслеживание
    setSpawnQueue(queue);
    setWaveStartTime(performance.now());
    setGamePhase('wave');
    lastUpdateRef.current = performance.now();
    waveEndingRef.current = false; // Сбрасываем флаг
  }, [gamePhase, wave]);

  // Конец волны
  const endWave = useCallback(() => {
    const config = getWaveConfig(wave);
    const nextWave = wave + 1;
    setGold(prev => prev + config.reward);
    setWave(nextWave);
    setGamePhase('preparing');
    enemiesRef.current = [];
    setEnemies([]);
    setSpawnQueue([]);
    // Обновляем магазин — новые модули разблокируются с волнами
    setShop(generateShopSlots(nextWave));
  }, [wave]);

  // Ref для отслеживания что нужно заспавнить
  const spawnQueueRef = useRef<{ id: string; type: string; spawnAt: number }[]>([]);

  // Синхронизируем ref с state
  useEffect(() => {
    spawnQueueRef.current = spawnQueue;
  }, [spawnQueue]);

  // Игровой цикл
  useEffect(() => {
    if (gamePhase !== 'wave') return;

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastUpdateRef.current) * gameSpeed;
      lastUpdateRef.current = timestamp;
      const elapsedSinceStart = (timestamp - waveStartTime) * gameSpeed;

      // Получаем текущую очередь спавна
      const currentQueue = spawnQueueRef.current;
      const ready = currentQueue.filter(s => s.spawnAt <= elapsedSinceStart);
      const toSpawn = ready.find(s => !spawnedIdsRef.current.has(s.id));

      // ======= ИСПОЛЬЗУЕМ REF КАК ИСТОЧНИК ИСТИНЫ =======
      // Это решает проблему когда setEnemies(prev => ...) получает stale state
      let updated = [...enemiesRef.current];

      // 1. Спавн нового врага (если есть место)
      if (toSpawn && !updated.some(e => e.progress < 0.03)) {
        spawnedIdsRef.current.add(toSpawn.id);
        const newEnemy = createEnemy(toSpawn.type as any, wave);
        updated.push(newEnemy);
      }

      // 2. Движение врагов
      updated = updated.map(enemy => updateEnemy(enemy, deltaTime, pathLength));

      // 3. Регенерация босса Питтинг
      updated = processBossRegeneration(updated, deltaTime);

      // 4. Боевая система — атаки модулей
      const currentModules = modulesRef.current;
      if (currentModules.length > 0 && updated.length > 0) {
        const attackResult = processAllAttacks(
          currentModules,
          updated,
          enemyPath,
          timestamp
        );

        updated = attackResult.updatedEnemies;

        // Обновляем модули (lastAttack)
        if (attackResult.newAttackEffects.length > 0) {
          modulesRef.current = attackResult.updatedModules;
          setModules(attackResult.updatedModules);
          setAttackEffects(prevEffects => [...prevEffects, ...attackResult.newAttackEffects]);
        }
      }

      // 5. Урон от горения (burn)
      updated = processBurnDamage(updated, deltaTime);

      // 6. Фильтрация: враги дошли до финиша или погибли
      let livesLost = 0;
      let goldEarned = 0;

      updated = updated.filter(enemy => {
        if (hasReachedFinish(enemy)) {
          livesLost++;
          return false;
        }
        if (isDead(enemy)) {
          goldEarned += enemy.reward;
          return false;
        }
        return true;
      });

      if (livesLost > 0) {
        setLives(l => Math.max(0, l - livesLost));
      }

      if (goldEarned > 0) {
        setGold(g => g + goldEarned);
      }

      // 7. Проверка окончания волны
      if (updated.length === 0 && spawnQueueRef.current.every(s => spawnedIdsRef.current.has(s.id)) && !waveEndingRef.current) {
        waveEndingRef.current = true;
        setTimeout(() => endWave(), 500);
      }

      // ======= ОБНОВЛЯЕМ REF И STATE =======
      enemiesRef.current = updated;
      setEnemies(updated);

      // Обновляем очередь спавна (отдельно, не влияет на enemies)
      if (toSpawn && spawnedIdsRef.current.has(toSpawn.id)) {
        setSpawnQueue(prev => prev.filter(s => !spawnedIdsRef.current.has(s.id)));
      }

      // Обновление анимации эффектов атак
      setAttackEffects(prev => prev
        .map(effect => ({
          ...effect,
          progress: Math.min(1, (timestamp - effect.startTime) / effect.duration),
        }))
        .filter(effect => effect.progress < 1)
      );

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gamePhase, waveStartTime, wave, pathLength, endWave, gameSpeed]);

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
              // Анимация слияния
              setMergingCell({ x: targetCell.x, y: targetCell.y });
              setTimeout(() => setMergingCell(null), 400);

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
        @keyframes merge {
          0% {
            transform: scale(1);
            filter: brightness(1);
          }
          30% {
            transform: scale(1.15);
            filter: brightness(1.5) saturate(1.3);
          }
          60% {
            transform: scale(0.95);
            filter: brightness(1.2);
          }
          100% {
            transform: scale(1);
            filter: brightness(1);
          }
        }
        @keyframes mergeGlow {
          0% { box-shadow: 0 0 0 rgba(255,255,100,0); }
          50% { box-shadow: 0 0 30px rgba(255,255,100,0.8), 0 0 60px rgba(255,200,50,0.4); }
          100% { box-shadow: 0 0 0 rgba(255,255,100,0); }
        }
        .animate-merge {
          animation: merge 0.4s ease-out, mergeGlow 0.4s ease-out;
        }
      `}</style>

      <h1 className="text-3xl font-bold text-amber-400">⚙️ Tribology Lab</h1>

      {/* Статус-бар */}
      <div className="flex items-center gap-6 text-xl mb-2">
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

        {/* Кнопка Начать волну */}
        {gamePhase === 'preparing' && (
          <button
            onClick={startWave}
            className="px-4 py-1.5 rounded-lg font-bold text-white transition-all hover:scale-105 active:scale-95 text-base"
            style={{
              background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 100%)',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4), 0 2px 0 #15803d',
            }}
          >
            ▶ Старт
          </button>
        )}

        {/* Индикатор волны в процессе */}
        {gamePhase === 'wave' && (
          <div
            className="px-3 py-1.5 rounded-lg text-white font-medium text-sm"
            style={{
              background: 'rgba(239, 68, 68, 0.8)',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            🔥 Осталось: {enemies.length + spawnQueue.length}
          </div>
        )}
      </div>

      {/* DEBUG: Панель отладки */}
      <div className="flex items-center gap-3 text-sm mb-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
        <span className="text-gray-400">⚡ Скорость:</span>
        {[1, 3, 5, 10].map(speed => (
          <button
            key={speed}
            onClick={() => setGameSpeed(speed)}
            className={`px-2 py-0.5 rounded ${gameSpeed === speed ? 'bg-amber-500 text-black' : 'bg-gray-700 text-white'}`}
          >
            {speed}x
          </button>
        ))}
        <span className="text-gray-500 mx-2">|</span>
        <span className="text-gray-400">Волна:</span>
        <button
          onClick={() => setWave(w => Math.max(1, w - 1))}
          className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
        >
          -
        </button>
        <button
          onClick={() => setWave(w => w + 1)}
          className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
        >
          +
        </button>
        <button
          onClick={() => setWave(5)}
          className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
        >
          →5
        </button>
        <button
          onClick={() => setWave(10)}
          className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
        >
          →10
        </button>
        <button
          onClick={() => setWave(15)}
          className="px-2 py-0.5 rounded bg-gray-700 text-white hover:bg-gray-600"
        >
          →15
        </button>
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

            {/* ===== ГРАДИЕНТЫ ДЛЯ ВРАГОВ ===== */}

            {/* Пыль — мягкий серый */}
            <radialGradient id="dustGradient">
              <stop offset="0%" stopColor="#b0b5bd" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#9ca3af" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6b7280" stopOpacity="0.3" />
            </radialGradient>

            {/* Абразив — песочный камень */}
            <linearGradient id="abrasiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c9a66b" />
              <stop offset="40%" stopColor="#a67c52" />
              <stop offset="100%" stopColor="#7a5c30" />
            </linearGradient>

            {/* Перегрев — температурный градиент */}
            <radialGradient id="heatGradient">
              <stop offset="0%" stopColor="#fffde7" />
              <stop offset="25%" stopColor="#ffcc00" />
              <stop offset="55%" stopColor="#ff6600" />
              <stop offset="85%" stopColor="#cc3300" />
              <stop offset="100%" stopColor="#8b0000" />
            </radialGradient>

            {/* Тепловое марево */}
            <radialGradient id="heatHaze">
              <stop offset="0%" stopColor="#ff6b35" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#ff6b35" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
            </radialGradient>

            {/* Стружка — металл */}
            <linearGradient id="metalShavingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e8e8e8" />
              <stop offset="30%" stopColor="#c0c0c0" />
              <stop offset="70%" stopColor="#909090" />
              <stop offset="100%" stopColor="#606060" />
            </linearGradient>

            {/* Коррозия — буро-зелёный */}
            <radialGradient id="corrosionGradient">
              <stop offset="0%" stopColor="#5a7c59" />
              <stop offset="50%" stopColor="#4a6b48" />
              <stop offset="100%" stopColor="#3a5a38" />
            </radialGradient>

            {/* Влага — прозрачная капля */}
            <radialGradient id="moistureGradient" cx="30%" cy="30%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="30%" stopColor="#60a5fa" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.4" />
            </radialGradient>

            {/* Статика — свечение */}
            <radialGradient id="sparkGlow">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="30%" stopColor="#facc15" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
            </radialGradient>

            {/* Задир — тёмный металл */}
            <radialGradient id="scarredGradient">
              <stop offset="0%" stopColor="#7a7a7a" />
              <stop offset="50%" stopColor="#5a5a5a" />
              <stop offset="100%" stopColor="#3a3a3a" />
            </radialGradient>

            {/* Питтинг — металлическая поверхность */}
            <radialGradient id="pittingGradient">
              <stop offset="0%" stopColor="#5a6068" />
              <stop offset="60%" stopColor="#3a4048" />
              <stop offset="100%" stopColor="#1a2028" />
            </radialGradient>

            {/* Контактная тень (общая) */}
            <radialGradient id="contactShadow">
              <stop offset="0%" stopColor="#0a1520" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0a1520" stopOpacity="0" />
            </radialGradient>

            {/* Масляной мениск */}
            <linearGradient id="oilMeniscus" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
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

          {/* Враги — рисуются ПОД патрубками старта/финиша */}
          {enemies.map(enemy => {
            const config = ENEMIES[enemy.type];
            const pos = getPositionOnPath(enemyPath, enemy.progress, config.oscillation);
            const size = config.size;
            const hpPercent = enemy.hp / enemy.maxHp;

            // HP-бар показываем только если: получал урон в последние 2 сек ИЛИ HP < 99%
            const now = Date.now();
            const showHpBar = (enemy.lastDamageTime > 0 && now - enemy.lastDamageTime < 2000) || hpPercent < 0.99;

            // Fade in/out
            const opacity = enemy.progress < 0.03
              ? enemy.progress / 0.03
              : enemy.progress > 0.97
                ? (1 - enemy.progress) / 0.03
                : 1;

            return (
              <g key={enemy.id} transform={`translate(${pos.x}, ${pos.y})`} opacity={opacity}>

                {/* ═══════════════════════════════════════════════════════════════
                    ПЫЛЬ (dust) — облачко мелких частиц
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.type === 'dust' && (
                  <g>
                    {/* Контактная тень (слабая, размытая) */}
                    <ellipse cx={0} cy={size*0.6} rx={size*1.0} ry={size*0.3} fill="url(#contactShadow)" opacity={0.4} />

                    {/* Облачко из нескольких частиц */}
                    <g opacity={0.85}>
                      <circle cx={-size*0.35} cy={-size*0.25} r={size*0.45} fill="url(#dustGradient)" />
                      <circle cx={size*0.25} cy={-size*0.15} r={size*0.38} fill="url(#dustGradient)" />
                      <circle cx={0} cy={size*0.25} r={size*0.52} fill="url(#dustGradient)" />
                      <circle cx={-size*0.25} cy={size*0.35} r={size*0.32} fill="url(#dustGradient)" />
                      <circle cx={size*0.35} cy={size*0.25} r={size*0.28} fill="url(#dustGradient)" />

                      {/* Дымка вокруг */}
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


                {/* ═══════════════════════════════════════════════════════════════
                    АБРАЗИВ (shard) — твёрдый осколок/зерно
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'shard' && (
                  <g>
                    {/* Контактная тень (плотная) */}
                    <ellipse cx={0} cy={size*0.55} rx={size*0.75} ry={size*0.25} fill="url(#contactShadow)" opacity={0.6} />

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
                      fill="url(#abrasiveGradient)"
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

                    {/* Скол (свежий разлом) */}
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


                {/* ═══════════════════════════════════════════════════════════════
                    ПЕРЕГРЕВ (heat) — горячий пузырь/очаг
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.type === 'heat' && (
                  <g>
                    {/* Зона нагрева масла */}
                    <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill="rgba(255,107,53,0.08)" />

                    {/* Контактная тень (слабая — он "парит") */}
                    <ellipse cx={0} cy={size*0.7} rx={size*0.9} ry={size*0.25} fill="url(#contactShadow)" opacity={0.3} />

                    {/* Тепловое марево */}
                    <ellipse cx={0} cy={0} rx={size*1.6} ry={size*1.5} fill="url(#heatHaze)">
                      <animate attributeName="rx" values={`${size*1.4};${size*1.8};${size*1.4}`} dur="1.8s" repeatCount="indefinite" />
                      <animate attributeName="ry" values={`${size*1.3};${size*1.7};${size*1.3}`} dur="1.8s" repeatCount="indefinite" />
                    </ellipse>

                    {/* Основной пузырь */}
                    <ellipse cx={0} cy={size*0.05} rx={size*0.85} ry={size*0.95} fill="url(#heatGradient)" />

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


                {/* ═══════════════════════════════════════════════════════════════
                    СТРУЖКА (shavings) — металлические завитки
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'shavings' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*0.85} ry={size*0.3} fill="url(#contactShadow)" opacity={0.6} />

                    {/* Основной завиток */}
                    <path
                      d={`M ${-size*0.85} ${-size*0.25}
                          Q ${-size*0.5} ${-size*0.95} ${size*0.2} ${-size*0.6}
                          Q ${size*0.85} ${-size*0.25} ${size*0.6} ${size*0.35}
                          Q ${size*0.35} ${size*0.75} ${size*0.1} ${size*0.65}`}
                      fill="none"
                      stroke="url(#metalShavingGradient)"
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


                {/* ═══════════════════════════════════════════════════════════════
                    КОРРОЗИЯ (blob) — пятно/язва
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'blob' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.55} rx={size*0.8} ry={size*0.25} fill="url(#contactShadow)" opacity={0.5} />

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
                      fill="url(#corrosionGradient)"
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


                {/* ═══════════════════════════════════════════════════════════════
                    ВЛАГА (moisture) — прозрачная капля
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.type === 'moisture' && (
                  <g>
                    {/* "Линза" под каплей */}
                    <ellipse cx={0} cy={size*0.15} rx={size*0.9} ry={size*0.7} fill="rgba(30,60,100,0.15)" />

                    {/* Контактная тень (слабая) */}
                    <ellipse cx={0} cy={size*0.65} rx={size*0.7} ry={size*0.2} fill="url(#contactShadow)" opacity={0.35} />

                    {/* Основная капля */}
                    <ellipse cx={0} cy={size*0.1} rx={size*0.7} ry={size*0.95} fill="url(#moistureGradient)" />

                    {/* Эффект толщины */}
                    <ellipse cx={0} cy={size*0.2} rx={size*0.55} ry={size*0.75} fill="rgba(255,255,255,0.08)" />

                    {/* Широкий мягкий блик */}
                    <ellipse cx={-size*0.15} cy={-size*0.3} rx={size*0.35} ry={size*0.18} fill="rgba(255,255,255,0.3)" />

                    {/* Маленький яркий блик */}
                    <ellipse cx={-size*0.22} cy={-size*0.5} rx={size*0.12} ry={size*0.07} fill="rgba(255,255,255,0.8)" />

                    {/* Микрокапля-спутник */}
                    <ellipse cx={size*0.6} cy={size*0.55} rx={size*0.15} ry={size*0.2} fill="url(#moistureGradient)" opacity={0.7} />
                    <ellipse cx={size*0.58} cy={size*0.48} rx={size*0.05} ry={size*0.03} fill="rgba(255,255,255,0.5)" />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    СТАТИКА (spark) — электрический разряд
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'spark' && (
                  <g>
                    {/* Общее мерцание */}
                    <animate attributeName="opacity" values="1;0.5;0.9;0.6;1" dur="0.2s" repeatCount="indefinite" />

                    {/* Свечение (glow) */}
                    <ellipse cx={0} cy={0} rx={size*1.8} ry={size*1.6} fill="url(#sparkGlow)" opacity={0.6} />

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


                {/* ═══════════════════════════════════════════════════════════════
                    ЗАДИР (scarred) — мини-босс, царапины на металле
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'scarred' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.6} rx={size*0.9} ry={size*0.35} fill="url(#contactShadow)" opacity={0.7} />

                    {/* Ореол опасности */}
                    <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#dc2626" strokeWidth={3} opacity={0.4}>
                      <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="r" values={`${size*0.85};${size*0.95};${size*0.85}`} dur="2s" repeatCount="indefinite" />
                    </circle>

                    {/* Металлическая основа */}
                    <ellipse cx={0} cy={0} rx={size} ry={size*0.95} fill="url(#scarredGradient)" />

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


                {/* ═══════════════════════════════════════════════════════════════
                    ПИТТИНГ (pitted) — босс, усталостные раковины
                    ═══════════════════════════════════════════════════════════════ */}
                {config.shape === 'pitted' && (
                  <g>
                    {/* Контактная тень */}
                    <ellipse cx={0} cy={size*0.65} rx={size*0.95} ry={size*0.35} fill="url(#contactShadow)" opacity={0.75} />

                    {/* Реген-ореол */}
                    <circle cx={0} cy={0} r={size * 0.9} fill="none" stroke="#22c55e" strokeWidth={3} opacity={0.35}>
                      <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>

                    {/* Металлическая основа */}
                    <circle cx={0} cy={0} r={size} fill="url(#pittingGradient)" />

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


                {/* ═══════════════════════════════════════════════════════════════
                    HP БАР (показывается только при уроне)
                    ═══════════════════════════════════════════════════════════════ */}
                {showHpBar && (
                  <g>
                    <rect x={-size*0.9} y={-size - 12} width={size * 1.8} height={6} rx={3} fill="rgba(0,0,0,0.7)" />
                    <rect x={-size*0.9} y={-size - 12} width={size * 1.8 * hpPercent} height={6} rx={3}
                      fill={hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#f59e0b' : '#ef4444'}
                    />
                    <rect x={-size*0.85} y={-size - 11} width={size * 1.7 * hpPercent} height={2} rx={1} fill="rgba(255,255,255,0.3)" />
                  </g>
                )}


                {/* ═══════════════════════════════════════════════════════════════
                    ИНДИКАТОРЫ ЭФФЕКТОВ
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.effects.length > 0 && (
                  <g>
                    {enemy.effects.some(e => e.type === 'slow') && (
                      <g transform={`translate(${size + 5}, ${-size + 5})`}>
                        <circle r={8} fill="rgba(56,189,248,0.3)" />
                        <text textAnchor="middle" dy={4} fontSize={10}>❄️</text>
                      </g>
                    )}
                    {enemy.effects.some(e => e.type === 'burn') && (
                      <g transform={`translate(${size + 5}, ${-size + 20})`}>
                        <circle r={8} fill="rgba(239,68,68,0.3)" />
                        <text textAnchor="middle" dy={4} fontSize={10}>🔥</text>
                      </g>
                    )}
                  </g>
                )}

              </g>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════
              ЭФФЕКТЫ АТАК
              ═══════════════════════════════════════════════════════════════ */}
          {attackEffects.map(effect => {
            const progress = effect.progress;
            const midX = (effect.fromX + effect.toX) / 2;
            const midY = (effect.fromY + effect.toY) / 2;

            // МАГНИТ — силовые линии (дуги)
            if (effect.moduleType === 'magnet') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.7}>
                  {/* Главная дуга */}
                  <path
                    d={`M ${effect.fromX} ${effect.fromY} Q ${midX} ${effect.fromY - 30} ${effect.toX} ${effect.toY}`}
                    fill="none"
                    stroke="#6B4CD6"
                    strokeWidth={2}
                    strokeDasharray="8,4"
                  />
                  {/* Вторая дуга (снизу) */}
                  <path
                    d={`M ${effect.fromX} ${effect.fromY} Q ${midX} ${effect.fromY + 25} ${effect.toX} ${effect.toY}`}
                    fill="none"
                    stroke="#6B4CD6"
                    strokeWidth={1.5}
                    strokeDasharray="4,4"
                    opacity={0.5}
                  />
                  {/* Точка на цели */}
                  <circle cx={effect.toX} cy={effect.toY} r={5} fill="#6B4CD6" opacity={0.6} />
                </g>
              );
            }

            // ОХЛАДИТЕЛЬ — холодный снаряд
            if (effect.moduleType === 'cooler') {
              const x = effect.fromX + (effect.toX - effect.fromX) * progress;
              const y = effect.fromY + (effect.toY - effect.fromY) * progress;
              return (
                <g key={effect.id}>
                  {/* Ледяной след */}
                  <line
                    x1={effect.fromX}
                    y1={effect.fromY}
                    x2={x}
                    y2={y}
                    stroke="#2A9AC8"
                    strokeWidth={2}
                    opacity={0.3}
                  />
                  {/* Свечение */}
                  <circle cx={x} cy={y} r={10} fill="#2A9AC8" opacity={0.25} />
                  {/* Снаряд */}
                  <circle cx={x} cy={y} r={6} fill="#2A9AC8" />
                  {/* Ядро */}
                  <circle cx={x} cy={y} r={3} fill="#FFFFFF" opacity={0.8} />
                </g>
              );
            }

            // ФИЛЬТР — расширяющаяся волна
            if (effect.moduleType === 'filter') {
              const radius = 20 + progress * 80;
              return (
                <g key={effect.id}>
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={radius}
                    fill="none"
                    stroke="#C09A1E"
                    strokeWidth={3 - progress * 2}
                    opacity={1 - progress}
                  />
                  {/* Внутреннее кольцо */}
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={radius * 0.6}
                    fill="none"
                    stroke="#C09A1E"
                    strokeWidth={1.5}
                    opacity={(1 - progress) * 0.5}
                  />
                </g>
              );
            }

            // СМАЗКА — масляная капля
            if (effect.moduleType === 'lubricant') {
              const x = effect.fromX + (effect.toX - effect.fromX) * progress;
              const y = effect.fromY + (effect.toY - effect.fromY) * progress;
              return (
                <g key={effect.id}>
                  {/* Капля (эллипс) */}
                  <ellipse
                    cx={x}
                    cy={y}
                    rx={5}
                    ry={7}
                    fill="#8845C7"
                    opacity={0.85}
                  />
                  {/* Блик */}
                  <ellipse
                    cx={x - 1}
                    cy={y - 2}
                    rx={2}
                    ry={2.5}
                    fill="#FFFFFF"
                    opacity={0.4}
                  />
                </g>
              );
            }

            // УЛЬТРАЗВУК — кавитация (концентрические кольца + пузырьки)
            if (effect.moduleType === 'ultrasonic') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.8}>
                  {/* Внешнее кольцо */}
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={progress * 80}
                    fill="none"
                    stroke="#24A899"
                    strokeWidth={2}
                  />
                  {/* Среднее кольцо */}
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={progress * 50}
                    fill="none"
                    stroke="#24A899"
                    strokeWidth={1.5}
                    opacity={0.7}
                  />
                  {/* Внутреннее кольцо */}
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={progress * 25}
                    fill="none"
                    stroke="#24A899"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                  {/* Пузырьки */}
                  {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <circle
                      key={i}
                      cx={effect.fromX + Math.cos(angle * Math.PI / 180) * progress * 40}
                      cy={effect.fromY + Math.sin(angle * Math.PI / 180) * progress * 40}
                      r={2}
                      fill="#24A899"
                      opacity={1 - progress}
                    />
                  ))}
                </g>
              );
            }

            // ЛАЗЕР — тонкий луч с фокусом
            if (effect.moduleType === 'laser') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.5}>
                  {/* Свечение луча */}
                  <line
                    x1={effect.fromX}
                    y1={effect.fromY}
                    x2={effect.toX}
                    y2={effect.toY}
                    stroke="#FF6666"
                    strokeWidth={5}
                    opacity={0.3}
                  />
                  {/* Основной луч */}
                  <line
                    x1={effect.fromX}
                    y1={effect.fromY}
                    x2={effect.toX}
                    y2={effect.toY}
                    stroke="#BF3636"
                    strokeWidth={2}
                  />
                  {/* Точка фокуса (на цели) */}
                  <circle cx={effect.toX} cy={effect.toY} r={8} fill="#FF4444" opacity={0.5} />
                  <circle cx={effect.toX} cy={effect.toY} r={4} fill="#FFFFFF" opacity={0.8} />
                </g>
              );
            }

            return null;
          })}

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
                const isMerging = mergingCell?.x === x && mergingCell?.y === y;

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
                        className={`absolute inset-0 cursor-grab active:cursor-grabbing ${isMerging ? 'animate-merge' : ''}`}
                        onMouseDown={(e) => handleFieldDragStart(e, module)}
                        onTouchStart={(e) => handleFieldDragStart(e, module)}
                      >
                        <FieldTile type={module.type} level={module.level} size={cellSize} />
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
            const canAfford = gold >= config.basePrice;
            const isDraggingThis = dragState?.type === 'shop' && dragState.shopIndex === index;

            return (
              <ShopCard
                key={index}
                type={moduleType}
                canAfford={canAfford}
                isDragging={isDraggingThis}
                size={80}
                onMouseDown={(e) => handleShopDragStart(e, index)}
                onTouchStart={(e) => handleShopDragStart(e, index)}
              />
            );
          })}
        </div>

        {/* Game Over */}
        {gamePhase === 'defeat' && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-3xl"
            style={{ zIndex: 100 }}
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-red-500 mb-4">💀 ПОРАЖЕНИЕ</h2>
              <p className="text-xl text-gray-300 mb-6">Волна: {wave}</p>
              <button
                onClick={() => {
                  setWave(1);
                  setLives(INITIAL_LIVES);
                  setGold(99999);
                  setModules([]);
                  setEnemies([]);
                  setSpawnQueue([]);
                  spawnedIdsRef.current.clear();
                  waveEndingRef.current = false;
                  setGamePhase('preparing');
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
              >
                Начать заново
              </button>
            </div>
          </div>
        )}
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
          <FieldTile
            type={dragState.moduleType}
            level={dragState.type === 'field'
              ? modules.find(m => m.id === dragState.moduleId)?.level || 1
              : 1
            }
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
