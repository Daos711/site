"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  MODULES,
  ENEMIES,
  GRID_COLS,
  GRID_ROWS,
  INITIAL_LIVES,
  INITIAL_GOLD,
  MODULE_CODES,
  type ModuleType,
  type EnemyType,
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
  getModulePosition,
  getDistance,
} from "@/lib/tribology-lab/combat";
import { ModuleCard, FieldTile } from "@/lib/tribology-lab/components";

// Начальные модули в магазине
const INITIAL_SHOP: ModuleType[] = ['magnet', 'cooler', 'filter', 'lubricant', 'magnet', 'cooler'];

// Цвета градиентов для карточек модулей
const MODULE_GRADIENTS: Record<ModuleType, { bg: string; border: string }> = {
  magnet: { bg: 'linear-gradient(145deg, #7c3aed 0%, #4c1d95 100%)', border: '#a78bfa' },
  cooler: { bg: 'linear-gradient(145deg, #0ea5e9 0%, #0369a1 100%)', border: '#7dd3fc' },
  filter: { bg: 'linear-gradient(145deg, #f59e0b 0%, #b45309 100%)', border: '#fcd34d' },
  lubricant: { bg: 'linear-gradient(145deg, #a855f7 0%, #7e22ce 100%)', border: '#c4b5fd' },
  ultrasonic: { bg: 'linear-gradient(145deg, #14b8a6 0%, #0f766e 100%)', border: '#5eead4' },
  laser: { bg: 'linear-gradient(145deg, #ef4444 0%, #b91c1c 100%)', border: '#fca5a5' },
  inhibitor: { bg: 'linear-gradient(145deg, #C7B56A 0%, #8a7a3a 100%)', border: '#d4c98a' },
  demulsifier: { bg: 'linear-gradient(145deg, #A7E8C2 0%, #5d9a72 100%)', border: '#c4f0d5' },
  analyzer: { bg: 'linear-gradient(145deg, #E6EEF7 0%, #9aa8b5 100%)', border: '#f0f5fa' },
  centrifuge: { bg: 'linear-gradient(145deg, #FF9F43 0%, #b56d1f 100%)', border: '#ffb870' },
  electrostatic: { bg: 'linear-gradient(145deg, #F5E663 0%, #a89a2d 100%)', border: '#f8ed8c' },
  barrier: { bg: 'linear-gradient(145deg, #FFD166 0%, #b5923a 100%)', border: '#ffe08c' },
};

// Русские сокращения модулей для DEV-панели
const DEV_MODULE_CODES_RU: Record<ModuleType, string> = {
  magnet: 'СЕП',      // Сепаратор
  cooler: 'КРИ',      // Криоблок
  filter: 'ФИЛ',      // Фильтр
  lubricant: 'СМА',   // Смазка
  ultrasonic: 'УЗВ',  // Ультразвук
  laser: 'ЛАЗ',       // Лазер
  inhibitor: 'ИНГ',   // Ингибитор
  demulsifier: 'ДЕМ', // Демульгатор
  analyzer: 'АНА',    // Анализатор
  centrifuge: 'ЦЕН',  // Центрифуга
  electrostatic: 'ЭЛС', // Электростатик
  barrier: 'БАР',     // Барьер
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
  const [gold, setGold] = useState(INITIAL_GOLD);
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
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeRef = useRef(0);      // Накопленное время на паузе
  const pauseStartRef = useRef(0);     // Timestamp начала текущей паузы
  const [gameStarted, setGameStarted] = useState(false);  // Игра началась (после первого старта)
  const [nextWaveCountdown, setNextWaveCountdown] = useState(0);  // Обратный отсчёт до след. волны

  // DEV-панель для тестирования
  const [devMode, setDevMode] = useState(false);
  const [selectedDevModule, setSelectedDevModule] = useState<ModuleType | null>(null);

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

  // Вычисляем какие модули получают бафф от Смазки
  const lubricatedModuleIds = useMemo(() => {
    const lubricants = modules.filter(m => m.type === 'lubricant');
    const buffedIds = new Set<string>();

    for (const lub of lubricants) {
      for (const mod of modules) {
        if (mod.id === lub.id) continue;
        if (Math.abs(mod.x - lub.x) <= 1 && Math.abs(mod.y - lub.y) <= 1) {
          buffedIds.add(mod.id);
        }
      }
    }

    return buffedIds;
  }, [modules]);

  // Вычисляем какие модули получают защиту от Ингибитора
  const protectedModuleIds = useMemo(() => {
    const inhibitors = modules.filter(m => m.type === 'inhibitor');
    const protectedIds = new Set<string>();

    for (const inh of inhibitors) {
      for (const mod of modules) {
        if (mod.id === inh.id) continue;
        if (Math.abs(mod.x - inh.x) <= 1 && Math.abs(mod.y - inh.y) <= 1) {
          protectedIds.add(mod.id);
        }
      }
    }

    return protectedIds;
  }, [modules]);

  // Функция для вычисления стеков коррозии на модуле
  const getCorrosionStacks = useCallback((module: Module): number => {
    // Фильтр и Ингибитор иммунны к коррозии
    if (module.type === 'filter' || module.type === 'inhibitor') {
      return 0;
    }

    const modulePos = getModulePosition(module);
    const corrosionRadius = 140;

    let stacks = 0;
    for (const enemy of enemies) {
      if (enemy.type !== 'corrosion') continue;
      const enemyConfig = ENEMIES[enemy.type];
      const enemyPos = getPositionOnPath(enemyPath, enemy.progress, enemyConfig.oscillation);
      const dist = getDistance(modulePos.x, modulePos.y, enemyPos.x, enemyPos.y);
      if (dist <= corrosionRadius) stacks++;
    }
    return Math.min(stacks, 3);
  }, [enemies, enemyPath]);

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
    pauseTimeRef.current = 0;      // Сбрасываем время паузы
    pauseStartRef.current = 0;     // Сбрасываем начало паузы
    setIsPaused(false);            // Снимаем паузу
    setNextWaveCountdown(0);       // Сбрасываем обратный отсчёт
    setGameStarted(true);          // Игра началась
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
    // Запускаем обратный отсчёт до следующей волны (10 сек)
    setNextWaveCountdown(10);
  }, [wave]);

  // Автостарт следующей волны
  useEffect(() => {
    if (gamePhase !== 'preparing' || !gameStarted || nextWaveCountdown <= 0) return;

    const timer = setTimeout(() => {
      if (nextWaveCountdown === 1) {
        startWave();
      } else {
        setNextWaveCountdown(prev => prev - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [gamePhase, gameStarted, nextWaveCountdown, startWave]);

  // Ref для отслеживания что нужно заспавнить
  const spawnQueueRef = useRef<{ id: string; type: string; spawnAt: number }[]>([]);

  // Синхронизируем ref с state
  useEffect(() => {
    spawnQueueRef.current = spawnQueue;
  }, [spawnQueue]);

  // Обработчик клавиши D для Dev-панели
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        // Не активируем если фокус в input
        if (document.activeElement?.tagName === 'INPUT') return;
        setDevMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // DEV: Спавн врага вне волны
  const devSpawnEnemy = useCallback((type: EnemyType, count: number = 1) => {
    // Автоматически запускаем волну, чтобы враги двигались
    if (gamePhase !== 'wave') {
      setGamePhase('wave');
    }
    const newEnemies: Enemy[] = [];
    for (let i = 0; i < count; i++) {
      const enemy = createEnemy(type, wave);
      // Добавляем небольшое смещение по progress чтобы враги не накладывались
      enemy.progress = i * 0.02;
      newEnemies.push(enemy);
    }
    setEnemies(prev => [...prev, ...newEnemies]);
    enemiesRef.current = [...enemiesRef.current, ...newEnemies];
  }, [wave, gamePhase]);

  // DEV: Установка модуля на поле
  const devPlaceModule = useCallback((x: number, y: number) => {
    if (!selectedDevModule) return;

    const existing = modules.find(m => m.x === x && m.y === y);
    if (existing) {
      // Повысить уровень (до 5)
      if (existing.level < 5) {
        setModules(prev => prev.map(m =>
          m.id === existing.id ? { ...m, level: m.level + 1 } : m
        ));
      }
    } else {
      // Новый модуль
      const newModule: Module = {
        id: `dev-${Date.now()}-${Math.random()}`,
        type: selectedDevModule,
        level: 1,
        x,
        y,
        lastAttack: 0,
      };
      setModules(prev => [...prev, newModule]);
    }
  }, [selectedDevModule, modules]);

  // Игровой цикл
  useEffect(() => {
    if (gamePhase !== 'wave') return;

    const gameLoop = (timestamp: number) => {
      // Если на паузе — запоминаем начало паузы и ждём
      if (isPaused) {
        if (pauseStartRef.current === 0) {
          pauseStartRef.current = timestamp;  // Запоминаем момент начала паузы
        }
        lastUpdateRef.current = timestamp;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Если только что вышли из паузы — добавляем время паузы
      if (pauseStartRef.current > 0) {
        pauseTimeRef.current += timestamp - pauseStartRef.current;
        pauseStartRef.current = 0;  // Сбрасываем
      }

      const deltaTime = (timestamp - lastUpdateRef.current) * gameSpeed;
      lastUpdateRef.current = timestamp;
      const elapsedSinceStart = ((timestamp - waveStartTime) - pauseTimeRef.current) * gameSpeed;

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
          timestamp,
          gameSpeed
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
      const deadEnemyIds: string[] = [];

      updated = updated.filter(enemy => {
        if (hasReachedFinish(enemy)) {
          // Боссы снимают больше жизней
          if (enemy.type === 'boss_pitting') {
            livesLost += 5;
          } else if (enemy.type === 'boss_wear') {
            livesLost += 3;
          } else {
            livesLost += 1;
          }
          deadEnemyIds.push(enemy.id);
          return false;
        }
        if (isDead(enemy)) {
          goldEarned += enemy.reward;
          deadEnemyIds.push(enemy.id);
          return false;
        }
        return true;
      });

      // Удаляем эффекты атак, нацеленные на мёртвых врагов (для Анализатора)
      if (deadEnemyIds.length > 0) {
        setAttackEffects(prev => prev.filter(eff => {
          // Проверяем по координатам - если эффект направлен на позицию мёртвого врага
          // Для простоты просто не фильтруем по ID (эффекты истекают по времени)
          return true;
        }));
      }

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
  }, [gamePhase, waveStartTime, wave, pathLength, endWave, gameSpeed, isPaused]);

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
          const config = MODULES[dragState.moduleType];

          if (!existingModule) {
            // Пустая ячейка — размещаем новый модуль
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
          } else if (
            existingModule.type === dragState.moduleType &&
            existingModule.level < 5 &&
            gold >= config.basePrice
          ) {
            // Такой же тип на поле — мерж из магазина!
            // Анимация слияния
            setMergingCell({ x: targetCell.x, y: targetCell.y });
            setTimeout(() => setMergingCell(null), 400);

            setModules(prev => prev.map(m =>
              m.id === existingModule.id ? { ...m, level: m.level + 1 } : m
            ));
            setGold(prev => prev - config.basePrice);
          }
        } else if (dragState.type === 'field' && dragState.moduleId) {
          // ХАРДКОР: модули с поля НЕЛЬЗЯ перемещать, только merge!
          const draggedModule = modules.find(m => m.id === dragState.moduleId);
          if (draggedModule && existingModule) {
            // Merge: только на такой же модуль того же уровня
            if (
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
            // Иначе (другой тип/уровень) — модуль просто вернётся на место
          }
          // Если !existingModule (пустая ячейка) — модуль вернётся на место
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
        background: `
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 39px,
            rgba(255, 255, 255, 0.03) 39px,
            rgba(255, 255, 255, 0.03) 40px
          ),
          repeating-linear-gradient(
            90deg,
            transparent,
            transparent 39px,
            rgba(255, 255, 255, 0.03) 39px,
            rgba(255, 255, 255, 0.03) 40px
          ),
          radial-gradient(ellipse at center, #0d1117 0%, #050608 70%, #020304 100%)
        `,
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

        {/* Кнопка Начать волну / Обратный отсчёт */}
        {gamePhase === 'preparing' && (
          gameStarted && nextWaveCountdown > 0 ? (
            <div
              className="px-4 py-1.5 rounded-lg font-bold text-white text-base flex items-center gap-2"
              style={{
                background: 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
              }}
            >
              <span>⏱️ {nextWaveCountdown}</span>
              <button
                onClick={startWave}
                className="px-2 py-0.5 rounded bg-green-500 hover:bg-green-400 text-sm transition-colors"
              >
                Сейчас!
              </button>
            </div>
          ) : (
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
          )
        )}

        {/* Индикатор волны в процессе + кнопка паузы */}
        {gamePhase === 'wave' && (
          <>
            <div
              className="px-3 py-1.5 rounded-lg text-white font-medium text-sm"
              style={{
                background: isPaused ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)',
                boxShadow: isPaused ? '0 0 15px rgba(59, 130, 246, 0.4)' : '0 0 15px rgba(239, 68, 68, 0.4)',
              }}
            >
              {isPaused ? '⏸️ ПАУЗА' : `🔥 Осталось: ${enemies.length + spawnQueue.length}`}
            </div>
            <button
              onClick={() => setIsPaused(p => !p)}
              className="px-3 py-1.5 rounded-lg font-bold text-white transition-all hover:scale-105 active:scale-95 text-sm"
              style={{
                background: isPaused
                  ? 'linear-gradient(145deg, #22c55e 0%, #16a34a 100%)'
                  : 'linear-gradient(145deg, #3b82f6 0%, #2563eb 100%)',
                boxShadow: isPaused
                  ? '0 4px 15px rgba(34, 197, 94, 0.4)'
                  : '0 4px 15px rgba(59, 130, 246, 0.4)',
              }}
            >
              {isPaused ? '▶ Продолжить' : '⏸ Пауза'}
            </button>
          </>
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

            {/* Аура коррозии */}
            <radialGradient id="corrosionAura">
              <stop offset="0%" stopColor="#4a7c59" stopOpacity="0.15" />
              <stop offset="70%" stopColor="#4a7c59" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#4a7c59" stopOpacity="0" />
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

          {/* ═══════════════════════════════════════════════════════════════
              СТРЕЛКИ НАПРАВЛЕНИЯ ПОТОКА (рисуются ПОД врагами)
              ═══════════════════════════════════════════════════════════════ */}
          {/* Левый вертикальный участок — стрелка ВВЕРХ */}
          <g opacity="0.2" style={{ pointerEvents: 'none' }}>
            <line
              x1={conveyorWidth / 2}
              y1={totalHeight * 0.55}
              x2={conveyorWidth / 2}
              y2={totalHeight * 0.45}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${conveyorWidth / 2 - 4} ${totalHeight * 0.47} L ${conveyorWidth / 2} ${totalHeight * 0.43} L ${conveyorWidth / 2 + 4} ${totalHeight * 0.47}`}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Верхний горизонтальный участок — стрелки ВПРАВО */}
          <g opacity="0.2" style={{ pointerEvents: 'none' }}>
            {/* Стрелка 1 */}
            <line
              x1={totalWidth * 0.28}
              y1={conveyorWidth / 2}
              x2={totalWidth * 0.36}
              y2={conveyorWidth / 2}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${totalWidth * 0.34} ${conveyorWidth / 2 - 4} L ${totalWidth * 0.38} ${conveyorWidth / 2} L ${totalWidth * 0.34} ${conveyorWidth / 2 + 4}`}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Стрелка 2 */}
            <line
              x1={totalWidth * 0.58}
              y1={conveyorWidth / 2}
              x2={totalWidth * 0.66}
              y2={conveyorWidth / 2}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${totalWidth * 0.64} ${conveyorWidth / 2 - 4} L ${totalWidth * 0.68} ${conveyorWidth / 2} L ${totalWidth * 0.64} ${conveyorWidth / 2 + 4}`}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

          {/* Правый вертикальный участок — стрелка ВНИЗ */}
          <g opacity="0.2" style={{ pointerEvents: 'none' }}>
            <line
              x1={totalWidth - conveyorWidth / 2}
              y1={totalHeight * 0.45}
              x2={totalWidth - conveyorWidth / 2}
              y2={totalHeight * 0.55}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d={`M ${totalWidth - conveyorWidth / 2 - 4} ${totalHeight * 0.53} L ${totalWidth - conveyorWidth / 2} ${totalHeight * 0.57} L ${totalWidth - conveyorWidth / 2 + 4} ${totalHeight * 0.53}`}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
              fill="none"
            />
          </g>

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
                    {/* Аура коррозии 80px радиус (160px диаметр - уменьшена чтобы не выходила за канал) */}
                    <circle
                      cx={0}
                      cy={0}
                      r={80}
                      fill="url(#corrosionAura)"
                      opacity={0.4}
                    />

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
                    ИНДИКАТОРЫ ЭФФЕКТОВ — КОМПАКТНЫЕ БЕЙДЖИ СПРАВА
                    Приоритет: held > slow > marked > dry > burn > coated
                    Максимум 2 видимых + "+N"
                    ═══════════════════════════════════════════════════════════════ */}
                {enemy.effects.length > 0 && (() => {
                  // Собираем активные статусы с приоритетом
                  const statusList: { type: string; icon: React.ReactNode; color: string }[] = [];

                  // Приоритет 1: Захват (барьер)
                  if (enemy.effects.find(e => e.type === 'held')) {
                    statusList.push({ type: 'held', icon: '⛓', color: '#f59e0b' });
                  }
                  // Приоритет 2: Заморозка
                  if (enemy.effects.find(e => e.type === 'slow')) {
                    statusList.push({ type: 'slow', icon: '❄️', color: '#38bdf8' });
                  }
                  // Приоритет 3: Метка
                  if (enemy.effects.find(e => e.type === 'marked')) {
                    statusList.push({ type: 'marked', icon: '🎯', color: '#e0e8f0' });
                  }
                  // Приоритет 4: Сухость
                  if (enemy.effects.find(e => e.type === 'dry')) {
                    statusList.push({
                      type: 'dry',
                      icon: (
                        <svg viewBox="0 0 16 16" width="12" height="12">
                          <path d="M8 2 Q12 7 12 10 Q12 14 8 14 Q4 14 4 10 Q4 7 8 2 Z" fill="none" stroke="#C9C2B3" strokeWidth="1.5"/>
                          <line x1="3" y1="3" x2="13" y2="13" stroke="#C9C2B3" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ),
                      color: '#C9C2B3'
                    });
                  }
                  // Приоритет 5: Ожог
                  if (enemy.effects.find(e => e.type === 'burn')) {
                    statusList.push({ type: 'burn', icon: '🔥', color: '#ef4444' });
                  }
                  // Приоритет 6: Покрытие смазкой
                  if (enemy.effects.find(e => e.type === 'coated')) {
                    statusList.push({ type: 'coated', icon: '💧', color: '#a855f7' });
                  }

                  if (statusList.length === 0) return null;

                  const visibleStatuses = statusList.slice(0, 2);
                  const hiddenCount = statusList.length - 2;
                  const badgeSize = 18;
                  const gap = 3;

                  // === АВТО-ФЛИП для боссов: если бейджи заходят на поле карточек ===
                  const cardFieldLeftEdge = conveyorWidth;
                  const cardFieldRightEdge = totalWidth - conveyorWidth;
                  const badgeTotalWidth = badgeSize + 8; // ширина бейджа + отступ

                  // Проверяем выход за границу справа (в поле карточек)
                  const wouldOverlapRight = pos.x + size + 6 + badgeTotalWidth > cardFieldLeftEdge && pos.x < cardFieldLeftEdge + conveyorWidth;
                  // Проверяем выход за границу слева (с правой стороны канала)
                  const wouldOverlapLeft = pos.x - size - 6 - badgeTotalWidth < cardFieldRightEdge && pos.x > cardFieldRightEdge - conveyorWidth;

                  // Флип влево если бейджи справа заходят на карточки
                  const flipLeft = wouldOverlapRight;

                  const anchorX = flipLeft ? -(size + 6 + badgeSize) : size + 6;
                  const anchorY = -size / 2;

                  return (
                    <g>
                      {visibleStatuses.map((status, i) => (
                        <g key={status.type} transform={`translate(${anchorX}, ${anchorY + i * (badgeSize + gap)})`}>
                          {/* Фон бейджа */}
                          <rect
                            x={0} y={-badgeSize/2}
                            width={badgeSize} height={badgeSize}
                            rx={4}
                            fill="rgba(13, 18, 24, 0.85)"
                            stroke={status.color}
                            strokeWidth={1.2}
                            strokeOpacity={0.7}
                          />
                          {/* Иконка */}
                          {typeof status.icon === 'string' ? (
                            <text
                              x={badgeSize/2}
                              y={1}
                              textAnchor="middle"
                              fontSize={11}
                              dominantBaseline="middle"
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {status.icon}
                            </text>
                          ) : (
                            <g transform={`translate(${(badgeSize - 12) / 2}, ${-6})`}>
                              {status.icon}
                            </g>
                          )}
                        </g>
                      ))}
                      {/* "+N" если больше 2 статусов */}
                      {hiddenCount > 0 && (
                        <g transform={`translate(${anchorX}, ${anchorY + 2 * (badgeSize + gap)})`}>
                          <rect
                            x={0} y={-badgeSize/2}
                            width={badgeSize} height={badgeSize}
                            rx={4}
                            fill="rgba(13, 18, 24, 0.85)"
                            stroke="#6b7280"
                            strokeWidth={1}
                            strokeOpacity={0.5}
                          />
                          <text x={badgeSize/2} y={1} textAnchor="middle" fontSize={10} fill="#9ca3af" dominantBaseline="middle" fontWeight="bold">
                            +{hiddenCount}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })()}

              </g>
            );
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

                // Подсветка зоны баффа при перетаскивании смазки
                const isInLubricantBuffZone = dragState?.moduleType === 'lubricant' && (() => {
                  // Вычисляем ячейку под курсором
                  const fieldRect = fieldRef.current?.getBoundingClientRect();
                  if (!fieldRect) return false;
                  const gridStartX = conveyorWidth + panelPadding;
                  const gridStartY = conveyorWidth + panelPadding;
                  const relX = dragState.currentX - fieldRect.left - gridStartX;
                  const relY = dragState.currentY - fieldRect.top - gridStartY;
                  const hoverX = Math.floor(relX / (cellSize + cellGap));
                  const hoverY = Math.floor(relY / (cellSize + cellGap));
                  // Эта ячейка в зоне баффа, если в пределах ±1 от hover и не сама hover
                  if (hoverX < 0 || hoverX >= GRID_COLS || hoverY < 0 || hoverY >= GRID_ROWS) return false;
                  const dx = Math.abs(x - hoverX);
                  const dy = Math.abs(y - hoverY);
                  return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
                })();

                // DEV: Подсветка для выбранного модуля
                const isDevTarget = devMode && selectedDevModule && !module;

                return (
                  <div
                    key={`${x}-${y}`}
                    className={`
                      rounded-xl transition-all duration-150 relative overflow-hidden
                      ${isDropTarget ? 'ring-4 ring-green-500 ring-opacity-70' : ''}
                      ${canMerge ? 'ring-4 ring-yellow-400 ring-opacity-70' : ''}
                      ${isInLubricantBuffZone ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}
                      ${isDevTarget ? 'ring-2 ring-cyan-400 ring-opacity-50 cursor-pointer' : ''}
                    `}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      background: 'linear-gradient(145deg, #080c10 0%, #0f1318 100%)',
                      boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.9), inset 0 -1px 0 rgba(255,255,255,0.02)',
                    }}
                    onClick={() => {
                      if (devMode && selectedDevModule) {
                        devPlaceModule(x, y);
                      }
                    }}
                  >
                    {module && !isDraggingThis && (
                      <div
                        className={`absolute inset-0 cursor-grab active:cursor-grabbing ${isMerging ? 'animate-merge' : ''}`}
                        onMouseDown={(e) => handleFieldDragStart(e, module)}
                        onTouchStart={(e) => handleFieldDragStart(e, module)}
                      >
                        <FieldTile
                          type={module.type}
                          level={module.level}
                          size={cellSize}
                          isLubricated={lubricatedModuleIds.has(module.id)}
                          isProtected={protectedModuleIds.has(module.id)}
                          corrosionStacks={getCorrosionStacks(module)}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            ЭФФЕКТЫ АТАК (отдельный SVG-слой поверх сетки)
            ═══════════════════════════════════════════════════════════════ */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width={totalWidth}
          height={totalHeight + 130}
          style={{ overflow: 'visible', zIndex: 50 }}
        >
          {attackEffects.map(effect => {
            const progress = effect.progress;
            const midX = (effect.fromX + effect.toX) / 2;

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

            // ФИЛЬТР — пульс на модуле → импакт НА ВРАГЕ
            if (effect.moduleType === 'filter') {
              return (
                <g key={effect.id}>
                  {/* ФАЗА 1: Источник — пульс на модуле (progress 0–0.3) */}
                  {progress < 0.3 && (
                    <circle
                      cx={effect.fromX}
                      cy={effect.fromY}
                      r={15 + progress * 50}
                      fill="none"
                      stroke="#C09A1E"
                      strokeWidth={2}
                      opacity={1 - progress * 3}
                    />
                  )}

                  {/* ФАЗА 2: Импакт — кольца ОТ ВРАГА (progress 0.2–1.0) */}
                  {progress >= 0.2 && (
                    <g opacity={1 - (progress - 0.2) * 1.2}>
                      {/* Внешнее кольцо */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={5 + (progress - 0.2) * 40}
                        fill="none"
                        stroke="#C09A1E"
                        strokeWidth={2.5}
                      />
                      {/* Внутреннее кольцо */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={3 + (progress - 0.2) * 25}
                        fill="none"
                        stroke="#C09A1E"
                        strokeWidth={1.5}
                        opacity={0.6}
                      />
                      {/* Микросетка (фильтрация) */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={12}
                        fill="none"
                        stroke="#C09A1E"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        opacity={0.5}
                      />
                      {/* Частицы "грязи" втягиваются к центру */}
                      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
                        const dist = 20 * (1 - (progress - 0.2) * 1.2);
                        return (
                          <circle
                            key={i}
                            cx={effect.toX + Math.cos(angle * Math.PI / 180) * Math.max(0, dist)}
                            cy={effect.toY + Math.sin(angle * Math.PI / 180) * Math.max(0, dist)}
                            r={2}
                            fill="#8B7355"
                            opacity={Math.max(0, 1 - (progress - 0.2) * 1.2)}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              );
            }

            // СМАЗКА — капля летит → плёнка растекается на враге
            if (effect.moduleType === 'lubricant') {
              return (
                <g key={effect.id}>
                  {/* ФАЗА 1: Капля летит к каналу (progress 0–0.5) */}
                  {progress < 0.5 && (
                    <g>
                      <ellipse
                        cx={effect.fromX + (effect.toX - effect.fromX) * progress * 2}
                        cy={effect.fromY + (effect.toY - effect.fromY) * progress * 2}
                        rx={4}
                        ry={6}
                        fill="#8845C7"
                        opacity={0.8}
                      />
                      {/* Блик */}
                      <ellipse
                        cx={effect.fromX + (effect.toX - effect.fromX) * progress * 2 - 1}
                        cy={effect.fromY + (effect.toY - effect.fromY) * progress * 2 - 2}
                        rx={1.5}
                        ry={2}
                        fill="#FFFFFF"
                        opacity={0.4}
                      />
                    </g>
                  )}

                  {/* ФАЗА 2: Плёнка растекается на враге (progress 0.4–1.0) */}
                  {progress >= 0.4 && (
                    <g opacity={Math.max(0, 1 - (progress - 0.4) * 1.5)}>
                      {/* Масляное пятно */}
                      <ellipse
                        cx={effect.toX}
                        cy={effect.toY}
                        rx={8 + (progress - 0.4) * 35}
                        ry={5 + (progress - 0.4) * 18}
                        fill="rgba(136, 69, 199, 0.35)"
                      />
                      {/* Глянцевый блик */}
                      <ellipse
                        cx={effect.toX - 5}
                        cy={effect.toY - 3}
                        rx={4 + (progress - 0.4) * 12}
                        ry={2 + (progress - 0.4) * 6}
                        fill="rgba(255, 255, 255, 0.3)"
                      />
                      {/* Контур пятна */}
                      <ellipse
                        cx={effect.toX}
                        cy={effect.toY}
                        rx={8 + (progress - 0.4) * 35}
                        ry={5 + (progress - 0.4) * 18}
                        fill="none"
                        stroke="#8845C7"
                        strokeWidth={1}
                        opacity={0.5}
                      />
                    </g>
                  )}
                </g>
              );
            }

            // УЛЬТРАЗВУК — мини-пинг на модуле → кавитация НА ВРАГЕ
            if (effect.moduleType === 'ultrasonic') {
              return (
                <g key={effect.id}>
                  {/* ФАЗА 1: Источник — мини-пинги на модуле (progress 0–0.3) */}
                  {progress < 0.3 && (
                    <g opacity={1 - progress * 3}>
                      <circle
                        cx={effect.fromX}
                        cy={effect.fromY}
                        r={10 + progress * 30}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1.5}
                      />
                      <circle
                        cx={effect.fromX}
                        cy={effect.fromY}
                        r={5 + progress * 15}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1}
                        opacity={0.6}
                      />
                    </g>
                  )}

                  {/* ФАЗА 2: Импакт — кавитация НА ВРАГЕ (progress 0.2–1.0) */}
                  {progress >= 0.2 && (
                    <g opacity={Math.max(0, 1 - (progress - 0.2) * 1.1)}>
                      {/* Концентрические кольца ОТ ВРАГА */}
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={10 + (progress - 0.2) * 60}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={2}
                      />
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={5 + (progress - 0.2) * 40}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1.5}
                        opacity={0.7}
                      />
                      <circle
                        cx={effect.toX}
                        cy={effect.toY}
                        r={3 + (progress - 0.2) * 20}
                        fill="none"
                        stroke="#24A899"
                        strokeWidth={1}
                        opacity={0.4}
                      />

                      {/* Пузырьки кавитации вокруг врага */}
                      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                        const dist = 15 + Math.sin(progress * Math.PI * 2 + i) * 8;
                        const size = 2 + (i % 3);
                        return (
                          <circle
                            key={i}
                            cx={effect.toX + Math.cos(angle * Math.PI / 180) * dist}
                            cy={effect.toY + Math.sin(angle * Math.PI / 180) * dist}
                            r={size * Math.max(0, 1 - (progress - 0.2))}
                            fill="#24A899"
                            opacity={0.6 * Math.max(0, 1 - (progress - 0.2))}
                          />
                        );
                      })}
                    </g>
                  )}
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

            // ИНГИБИТОР — волновой импульс (пассивная защита)
            if (effect.moduleType === 'inhibitor') {
              return (
                <g key={effect.id} opacity={1 - progress * 0.8}>
                  {/* Волна защиты */}
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={20 + progress * 80}
                    fill="none"
                    stroke="#C7B56A"
                    strokeWidth={2}
                    strokeDasharray="6,4"
                  />
                  <circle
                    cx={effect.fromX}
                    cy={effect.fromY}
                    r={10 + progress * 50}
                    fill="none"
                    stroke="#C7B56A"
                    strokeWidth={1}
                    opacity={0.5}
                  />
                </g>
              );
            }

            // ДЕЭМУЛЬГАТОР — конусная струя осушения
            if (effect.moduleType === 'demulsifier') {
              const dx = effect.toX - effect.fromX;
              const dy = effect.toY - effect.fromY;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;

              return (
                <g key={effect.id} transform={`translate(${effect.fromX}, ${effect.fromY}) rotate(${angle})`}>
                  {/* Конусная струя */}
                  <path
                    d={`M 0,0 L ${dist * progress},-12 L ${dist * progress + 15},0 L ${dist * progress},12 Z`}
                    fill="rgba(212, 165, 116, 0.4)"
                    opacity={1 - progress * 0.6}
                  />
                  {/* Линии внутри конуса */}
                  <line x1={0} y1={0} x2={dist * progress * 0.9} y2={-6} stroke="#d4a574" strokeWidth={1} opacity={0.7 - progress * 0.5} />
                  <line x1={0} y1={0} x2={dist * progress} y2={0} stroke="#d4a574" strokeWidth={1.5} opacity={0.8 - progress * 0.5} />
                  <line x1={0} y1={0} x2={dist * progress * 0.9} y2={6} stroke="#d4a574" strokeWidth={1} opacity={0.7 - progress * 0.5} />
                  {/* Частицы испарения */}
                  <circle cx={dist * 0.5} cy={-4} r={2} fill="#d4a574" opacity={(0.6 - progress) * Math.max(0, 1 - progress * 2)} />
                  <circle cx={dist * 0.6} cy={3} r={1.5} fill="#d4a574" opacity={(0.5 - progress) * Math.max(0, 1 - progress * 2)} />
                  <circle cx={dist * 0.7} cy={-7} r={1} fill="#d4a574" opacity={(0.4 - progress) * Math.max(0, 1 - progress * 2)} />
                </g>
              );
            }

            // АНАЛИЗАТОР — скан-пинг (3 этапа)
            if (effect.moduleType === 'analyzer') {
              // Фаза 1: 0-0.20 - тонкая линия на цель (замедлено)
              // Фаза 2: 0.20-0.50 - скан-линия по врагу (замедлено)
              // Фаза 3: 0.50+ - прицел угасает
              const phase1End = 0.20;
              const phase2End = 0.50;

              // Opacity для фазы 3 — полностью исчезает к концу
              const phase3Opacity = Math.max(0, 1 - (progress - phase2End) / (1 - phase2End));

              return (
                <g key={effect.id}>
                  {/* Фаза 1: Тонкая линия к цели */}
                  {progress < phase1End && (
                    <line
                      x1={effect.fromX}
                      y1={effect.fromY}
                      x2={effect.fromX + (effect.toX - effect.fromX) * (progress / phase1End)}
                      y2={effect.fromY + (effect.toY - effect.fromY) * (progress / phase1End)}
                      stroke="#e0e8f0"
                      strokeWidth={2}
                      opacity={0.8}
                      strokeLinecap="round"
                    />
                  )}
                  {/* Фаза 2: Скан-линия проезжает по врагу */}
                  {progress >= phase1End && progress < phase2End && (() => {
                    const scanT = (progress - phase1End) / (phase2End - phase1End);
                    const scanOffset = -15 + scanT * 30; // от -15 до +15
                    return (
                      <g transform={`translate(${effect.toX}, ${effect.toY})`}>
                        {/* Основная скан-линия */}
                        <line
                          x1={scanOffset}
                          y1={-18}
                          x2={scanOffset}
                          y2={18}
                          stroke="#e0e8f0"
                          strokeWidth={2.5}
                          opacity={0.9}
                          strokeLinecap="round"
                        />
                        {/* Призрак */}
                        <line
                          x1={scanOffset - 4}
                          y1={-16}
                          x2={scanOffset - 4}
                          y2={16}
                          stroke="#e0e8f0"
                          strokeWidth={1.5}
                          opacity={0.35}
                          strokeLinecap="round"
                        />
                      </g>
                    );
                  })()}
                  {/* Фаза 3: Прицел угасает полностью */}
                  {progress >= phase2End && phase3Opacity > 0 && (
                    <g transform={`translate(${effect.toX}, ${effect.toY})`} opacity={phase3Opacity}>
                      {/* Круг прицела */}
                      <circle cx={0} cy={0} r={10} fill="none" stroke="#e0e8f0" strokeWidth={1.5} />
                      {/* 4 риски по сторонам */}
                      <line x1={0} y1={-16} x2={0} y2={-12} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      <line x1={0} y1={12} x2={0} y2={16} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      <line x1={-16} y1={0} x2={-12} y2={0} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      <line x1={12} y1={0} x2={16} y2={0} stroke="#e0e8f0" strokeWidth={2} strokeLinecap="round" />
                      {/* Точка в центре */}
                      <circle cx={0} cy={0} r={2} fill="#e0e8f0" opacity={0.9} />
                    </g>
                  )}
                </g>
              );
            }

            // ЦЕНТРИФУГА — ударный импульс
            if (effect.moduleType === 'centrifuge') {
              const dx = effect.toX - effect.fromX;
              const dy = effect.toY - effect.fromY;
              const pushAngle = Math.atan2(dy, dx) + Math.PI; // назад от модуля
              const enemyRadius = 15;

              return (
                <g key={effect.id}>
                  {/* Ударное кольцо расширяется */}
                  <circle
                    cx={effect.toX}
                    cy={effect.toY}
                    r={enemyRadius * 1.1 + progress * enemyRadius * 0.6}
                    fill="none"
                    stroke="#FF9F43"
                    strokeWidth={3}
                    opacity={0.7 - progress * 0.7}
                  />
                  {/* Линии движения назад */}
                  {[-0.25, 0, 0.25].map((offset, i) => {
                    const lineAngle = pushAngle + offset;
                    const len = 12 + (1 - i % 2) * 4;
                    const dist = enemyRadius + 8 + progress * 15;
                    return (
                      <line
                        key={i}
                        x1={effect.toX + Math.cos(lineAngle) * dist}
                        y1={effect.toY + Math.sin(lineAngle) * dist}
                        x2={effect.toX + Math.cos(lineAngle) * (dist + len)}
                        y2={effect.toY + Math.sin(lineAngle) * (dist + len)}
                        stroke="#FF9F43"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        opacity={0.6 - progress * 0.5}
                      />
                    );
                  })}
                  {/* Микро-частицы вдоль направления отката */}
                  {[0, 1, 2, 3, 4].map((n) => {
                    // Частицы выстраиваются вдоль линий движения, между кольцом и линиями
                    const spread = [-0.2, 0.1, 0, -0.1, 0.2][n];
                    const a = pushAngle + spread;
                    const baseDist = enemyRadius + 3 + n * 3;
                    const r = baseDist + progress * 12;
                    return (
                      <circle
                        key={n}
                        cx={effect.toX + Math.cos(a) * r}
                        cy={effect.toY + Math.sin(a) * r}
                        r={1.5 + (n % 2) * 0.5}
                        fill="#FF9F43"
                        opacity={0.5 - progress * 0.45}
                      />
                    );
                  })}
                </g>
              );
            }

            // ЭЛЕКТРОСТАТ — цепная молния
            if (effect.moduleType === 'electrostatic') {
              // Генерируем зигзаг-путь для молнии
              const generateLightning = (x1: number, y1: number, x2: number, y2: number, segments = 6) => {
                const points: string[] = [];
                const dx = (x2 - x1) / segments;
                const dy = (y2 - y1) / segments;

                points.push(`M${x1},${y1}`);
                for (let i = 1; i < segments; i++) {
                  const offsetX = (Math.random() - 0.5) * 12;
                  const offsetY = (Math.random() - 0.5) * 12;
                  points.push(`L${x1 + dx * i + offsetX},${y1 + dy * i + offsetY}`);
                }
                points.push(`L${x2},${y2}`);
                return points.join(' ');
              };

              return (
                <g key={effect.id} opacity={1 - progress * 0.6}>
                  {/* Свечение */}
                  <path
                    d={generateLightning(effect.fromX, effect.fromY, effect.toX, effect.toY, 5)}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={6}
                    opacity={0.3}
                    style={{ filter: 'blur(3px)' }}
                  />
                  {/* Основная молния */}
                  <path
                    d={generateLightning(effect.fromX, effect.fromY, effect.toX, effect.toY, 6)}
                    fill="none"
                    stroke="#fde047"
                    strokeWidth={3}
                    opacity={0.9}
                  />
                  {/* Ядро молнии */}
                  <path
                    d={generateLightning(effect.fromX, effect.fromY, effect.toX, effect.toY, 4)}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    opacity={0.8}
                  />
                  {/* Искра на цели */}
                  <circle cx={effect.toX} cy={effect.toY} r={8 - progress * 5} fill="#fde047" opacity={0.7} />
                  <circle cx={effect.toX} cy={effect.toY} r={4} fill="#ffffff" opacity={0.9 - progress * 0.5} />
                </g>
              );
            }

            // БАРЬЕР — клетка-зажим с "щёлк"
            if (effect.moduleType === 'barrier') {
              // Находим врага под эффектом для масштабирования клетки
              const targetEnemy = enemies.find(e => {
                const eConfig = ENEMIES[e.type];
                const ePos = getPositionOnPath(enemyPath, e.progress, eConfig.oscillation);
                const dist = Math.sqrt((ePos.x - effect.toX) ** 2 + (ePos.y - effect.toY) ** 2);
                return dist < 50 && e.effects.some(eff => eff.type === 'held');
              });
              // Базовый размер клетки = max(20, радиус врага * 1.3)
              const enemyRadius = targetEnemy ? ENEMIES[targetEnemy.type].size : 15;
              const cageHalf = Math.max(20, enemyRadius * 1.3);

              // Анимация "щёлк": scale 1.12 → 1.0 за первые 10%
              const clickPhase = progress < 0.1;
              const scale = clickPhase ? 1.12 - progress * 1.2 : 1;
              // Плавное затухание в конце
              const fadeOut = progress > 0.7 ? (1 - progress) / 0.3 : 1;
              // "Дыхание" клетки при удержании
              const breathe = Math.sin(progress * Math.PI * 6) * 0.08 + 1;
              const finalScale = clickPhase ? scale : breathe;

              return (
                <g key={effect.id} transform={`translate(${effect.toX}, ${effect.toY})`} opacity={fadeOut}>
                  {/* Внешняя рамка (rounded rect) */}
                  <rect
                    x={-cageHalf * finalScale}
                    y={-cageHalf * finalScale}
                    width={cageHalf * 2 * finalScale}
                    height={cageHalf * 2 * finalScale}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    rx={5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Вертикальные перемычки (решётка) */}
                  <line x1={-cageHalf * 0.35 * finalScale} y1={-cageHalf * finalScale} x2={-cageHalf * 0.35 * finalScale} y2={cageHalf * finalScale} stroke="#f59e0b" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
                  <line x1={cageHalf * 0.35 * finalScale} y1={-cageHalf * finalScale} x2={cageHalf * 0.35 * finalScale} y2={cageHalf * finalScale} stroke="#f59e0b" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
                  {/* Горизонтальная полоса */}
                  <line x1={-cageHalf * finalScale} y1={0} x2={cageHalf * finalScale} y2={0} stroke="#f59e0b" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
                  {/* Маркер STOP — две вертикальные полоски || над клеткой */}
                  <g transform={`translate(0, ${-(cageHalf + 8) * finalScale})`} opacity={0.8}>
                    <line x1={-4} y1={-5} x2={-4} y2={5} stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />
                    <line x1={4} y1={-5} x2={4} y2={5} stroke="#f59e0b" strokeWidth={2.5} strokeLinecap="round" />
                  </g>
                  {/* Вспышка при "щёлк" */}
                  {clickPhase && (
                    <rect
                      x={-(cageHalf + 2)}
                      y={-(cageHalf + 2)}
                      width={(cageHalf + 2) * 2}
                      height={(cageHalf + 2) * 2}
                      fill="none"
                      stroke="#fde047"
                      strokeWidth={2}
                      rx={6}
                      opacity={1 - progress * 10}
                    />
                  )}
                </g>
              );
            }

            return null;
          })}
        </svg>

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
              <ModuleCard
                key={index}
                type={moduleType}
                compact={true}
                canAfford={canAfford}
                isDragging={isDraggingThis}
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
                  setGold(INITIAL_GOLD);
                  setModules([]);
                  setEnemies([]);
                  setSpawnQueue([]);
                  setShop(INITIAL_SHOP);
                  setGameStarted(false);
                  setNextWaveCountdown(0);
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
        <span className="text-gray-600 ml-2">(D — dev-панель)</span>
      </p>

      {/* ═══════════════════════════════════════════════════════════════
          DEV-ПАНЕЛЬ
          ═══════════════════════════════════════════════════════════════ */}
      {devMode && (
        <div
          className="fixed right-4 top-4 bg-black/90 border border-cyan-500/30 rounded-xl p-4 z-[200] max-h-[90vh] overflow-y-auto"
          style={{ width: 320 }}
        >
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-cyan-400 font-bold text-lg flex items-center gap-2">
              🔧 DEV MODE
            </h3>
            <button
              onClick={() => setDevMode(false)}
              className="text-gray-500 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* ═══════════════ МОДУЛИ ═══════════════ */}
          <div className="mb-4">
            <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Модули</h4>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(MODULES) as ModuleType[]).map(type => {
                const isSelected = selectedDevModule === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedDevModule(isSelected ? null : type)}
                    className={`
                      p-2 rounded-lg text-xs font-bold transition-all
                      ${isSelected
                        ? 'bg-cyan-500/30 border-2 border-cyan-400 text-cyan-300'
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                    title={MODULES[type].name}
                  >
                    {DEV_MODULE_CODES_RU[type]}
                  </button>
                );
              })}
            </div>
            {selectedDevModule && (
              <p className="text-cyan-300 text-xs mt-2">
                Выбран: <span className="font-bold">{MODULES[selectedDevModule].name}</span>
                <br />
                <span className="text-gray-500">Кликни на пустую ячейку чтобы поставить</span>
              </p>
            )}
          </div>

          {/* ═══════════════ ВРАГИ ═══════════════ */}
          <div className="mb-4">
            <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Враги</h4>
            <div className="grid grid-cols-3 gap-2">
              {(['dust', 'abrasive', 'heat', 'metal', 'corrosion', 'moisture', 'static', 'boss_wear', 'boss_pitting'] as EnemyType[]).map(type => {
                const config = ENEMIES[type];
                const icons: Record<string, string> = {
                  dust: '💨',
                  abrasive: '🪨',
                  heat: '🔥',
                  metal: '⚙️',
                  corrosion: '🦠',
                  moisture: '💧',
                  static: '⚡',
                  boss_wear: '👑',
                  boss_pitting: '💀',
                };
                return (
                  <button
                    key={type}
                    onClick={(e) => {
                      const count = e.shiftKey ? 5 : e.ctrlKey ? 10 : 1;
                      devSpawnEnemy(type, count);
                    }}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:bg-red-900/50 hover:border-red-500/50 hover:text-white transition-all text-center"
                    title={`${config.name} (Shift=5, Ctrl=10)`}
                  >
                    <div className="text-lg">{icons[type]}</div>
                    <div className="text-[10px] truncate">{config.name}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-gray-500 text-xs mt-2">
              Shift+клик = 5 врагов, Ctrl+клик = 10 врагов
            </p>
          </div>

          {/* ═══════════════ ИНСТРУМЕНТЫ ═══════════════ */}
          <div className="mb-2">
            <h4 className="text-gray-400 text-sm mb-2 uppercase tracking-wider">Инструменты</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setGold(g => g + 100)}
                className="p-2 rounded-lg bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-800/50 transition-all text-sm"
              >
                💰 +100
              </button>
              <button
                onClick={() => setGold(g => g + 500)}
                className="p-2 rounded-lg bg-yellow-900/30 border border-yellow-600/30 text-yellow-400 hover:bg-yellow-800/50 transition-all text-sm"
              >
                💰 +500
              </button>
              <button
                onClick={() => setLives(l => l + 5)}
                className="p-2 rounded-lg bg-red-900/30 border border-red-600/30 text-red-400 hover:bg-red-800/50 transition-all text-sm"
              >
                ❤️ +5 HP
              </button>
              <button
                onClick={() => {
                  setEnemies([]);
                  enemiesRef.current = [];
                }}
                className="p-2 rounded-lg bg-purple-900/30 border border-purple-600/30 text-purple-400 hover:bg-purple-800/50 transition-all text-sm"
              >
                ☠️ Убить всех
              </button>
              <button
                onClick={() => setModules([])}
                className="p-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-400 hover:bg-gray-700 transition-all text-sm"
              >
                🗑️ Очистить поле
              </button>
              <button
                onClick={() => setIsPaused(p => !p)}
                className={`p-2 rounded-lg border transition-all text-sm ${
                  isPaused
                    ? 'bg-green-900/30 border-green-600/30 text-green-400'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {isPaused ? '▶️ Продолжить' : '⏸️ Пауза'}
              </button>
            </div>
          </div>

          {/* Скорость игры */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Скорость: {gameSpeed}x</span>
              <div className="flex gap-1">
                {[1, 2, 5, 10].map(speed => (
                  <button
                    key={speed}
                    onClick={() => setGameSpeed(speed)}
                    className={`px-2 py-1 rounded text-xs ${
                      gameSpeed === speed
                        ? 'bg-cyan-500/30 text-cyan-300'
                        : 'bg-gray-800 text-gray-500 hover:text-white'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка активации DEV-панели */}
      {!devMode && (
        <button
          onClick={() => setDevMode(true)}
          className="fixed right-4 bottom-4 w-10 h-10 rounded-full bg-gray-800/50 border border-gray-700 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/50 transition-all z-50 flex items-center justify-center"
          title="Dev Mode (D)"
        >
          🔧
        </button>
      )}
    </div>
  );
}
