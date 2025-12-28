"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, Play, Pause, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Particle,
  ParticleType,
  Machine,
  MachineType,
  GameState,
  PARTICLE_PROPERTIES,
  MACHINE_PROPERTIES,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  SPAWN_INTERVAL,
  updateParticles,
  spawnParticles,
  getMachineAt,
  canPlaceMachine,
  LEVELS,
  AvailableMachine,
} from "@/lib/particle-factory";

function initializeLevel(levelIndex: number): GameState {
  const level = LEVELS[levelIndex];
  if (!level) {
    return {
      particles: [],
      machines: [],
      collected: { sand: 0, water: 0, glass: 0, steam: 0 },
      selectedMachine: null,
      isRunning: false,
      isComplete: false,
      currentLevel: 0,
      placedMachines: {},
    };
  }

  const machines: Machine[] = level.fixedMachines.map((m, i) => ({
    ...m,
    id: `fixed-${i}`,
    fixed: true,
  }));

  return {
    particles: [],
    machines,
    collected: { sand: 0, water: 0, glass: 0, steam: 0 },
    selectedMachine: level.availableMachines[0]?.type || null,
    isRunning: false,
    isComplete: false,
    currentLevel: levelIndex,
    placedMachines: {},
  };
}

export default function ParticleFactoryPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<GameState>(() => initializeLevel(0));
  const frameCountRef = useRef(0);
  const animationRef = useRef<number>(0);

  const level = LEVELS[state.currentLevel];

  // Проверка завершения уровня
  const checkLevelComplete = useCallback(
    (collected: Record<ParticleType, number>) => {
      if (!level) return false;
      return level.goals.every((goal) => collected[goal.type] >= goal.amount);
    },
    [level]
  );

  // Игровой цикл
  useEffect(() => {
    if (!state.isRunning || state.isComplete) return;

    const gameLoop = () => {
      frameCountRef.current++;

      setState((prev) => {
        // Спавн частиц
        let particles = spawnParticles(
          prev.particles,
          prev.machines,
          frameCountRef.current,
          SPAWN_INTERVAL
        );

        // Обновление физики
        const { particles: updatedParticles, collected } = updateParticles(
          particles,
          prev.machines
        );

        // Обновление счётчика
        const newCollected = { ...prev.collected };
        for (const [type, count] of Object.entries(collected)) {
          newCollected[type as ParticleType] += count;
        }

        const isComplete = checkLevelComplete(newCollected);

        return {
          ...prev,
          particles: updatedParticles,
          collected: newCollected,
          isComplete,
          isRunning: isComplete ? false : prev.isRunning,
        };
      });

      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef.current);
  }, [state.isRunning, state.isComplete, checkLevelComplete]);

  // Рендеринг canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Очистка
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Сетка
      ctx.strokeStyle = "#2a2a4e";
      ctx.lineWidth = 1;
      for (let x = 0; x <= GRID_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
        ctx.stroke();
      }

      // Машины
      for (const machine of state.machines) {
        const props = MACHINE_PROPERTIES[machine.type];
        const x = machine.x * CELL_SIZE;
        const y = machine.y * CELL_SIZE;

        // Фон клетки
        ctx.fillStyle = machine.fixed ? "#2a2a4e" : "#3a3a5e";
        ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

        // Цветная рамка
        ctx.strokeStyle = props.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);

        // Иконка
        ctx.font = "16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(props.icon, x + CELL_SIZE / 2, y + CELL_SIZE / 2);
      }

      // Частицы
      for (const particle of state.particles) {
        const props = PARTICLE_PROPERTIES[particle.type];

        // Свечение
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          8
        );
        gradient.addColorStop(0, props.color);
        gradient.addColorStop(0.5, props.glow || props.color);
        gradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Ядро частицы
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = props.color;
        ctx.fill();
      }

      requestAnimationFrame(render);
    };

    render();
  }, [state.particles, state.machines]);

  // Обработка клика по canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (state.isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const cellX = Math.floor(((e.clientX - rect.left) * scaleX) / CELL_SIZE);
    const cellY = Math.floor(((e.clientY - rect.top) * scaleY) / CELL_SIZE);

    const existingMachine = getMachineAt(state.machines, cellX, cellY);

    if (existingMachine) {
      // Удаление машины (если не fixed)
      if (!existingMachine.fixed) {
        setState((prev) => {
          const newPlaced = { ...prev.placedMachines };
          newPlaced[existingMachine.type] = (newPlaced[existingMachine.type] || 1) - 1;
          return {
            ...prev,
            machines: prev.machines.filter((m) => m.id !== existingMachine.id),
            placedMachines: newPlaced,
          };
        });
      }
    } else if (state.selectedMachine && canPlaceMachine(state.machines, cellX, cellY)) {
      // Проверка лимита машин
      const available = level?.availableMachines.find(
        (a) => a.type === state.selectedMachine
      );
      const placed = state.placedMachines[state.selectedMachine] || 0;

      if (available && (available.count === -1 || placed < available.count)) {
        setState((prev) => {
          const newPlaced = { ...prev.placedMachines };
          newPlaced[prev.selectedMachine!] = (newPlaced[prev.selectedMachine!] || 0) + 1;
          return {
            ...prev,
            machines: [
              ...prev.machines,
              {
                id: `placed-${Date.now()}`,
                type: prev.selectedMachine!,
                x: cellX,
                y: cellY,
                fixed: false,
              },
            ],
            placedMachines: newPlaced,
          };
        });
      }
    }
  };

  const toggleRunning = () => {
    setState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetLevel = () => {
    frameCountRef.current = 0;
    setState(initializeLevel(state.currentLevel));
  };

  const nextLevel = () => {
    if (state.currentLevel < LEVELS.length - 1) {
      frameCountRef.current = 0;
      setState(initializeLevel(state.currentLevel + 1));
    }
  };

  const prevLevel = () => {
    if (state.currentLevel > 0) {
      frameCountRef.current = 0;
      setState(initializeLevel(state.currentLevel - 1));
    }
  };

  const getRemainingCount = (am: AvailableMachine): string => {
    if (am.count === -1) return "∞";
    const placed = state.placedMachines[am.type] || 0;
    return String(am.count - placed);
  };

  if (!level) {
    return (
      <div className="text-center py-20">
        <p>Уровень не найден</p>
        <Link href="/games" className="text-blue-400 hover:underline">
          Вернуться к играм
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Шапка */}
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/games"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Назад</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={prevLevel}
            disabled={state.currentLevel === 0}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">
            Уровень {level.id}: {level.name}
          </span>
          <button
            onClick={nextLevel}
            disabled={state.currentLevel === LEVELS.length - 1}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Подсказка */}
      <p className="text-sm text-gray-400 mb-4 text-center">{level.hint}</p>

      {/* Цели уровня */}
      <div className="mb-4 flex flex-wrap justify-center gap-4">
        {level.goals.map((goal) => {
          const props = PARTICLE_PROPERTIES[goal.type];
          const current = state.collected[goal.type];
          const complete = current >= goal.amount;
          return (
            <div
              key={goal.type}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                complete ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-300"
              }`}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: props.color }}
              />
              <span>
                {props.name}: {current}/{goal.amount}
              </span>
              {complete && <span>✓</span>}
            </div>
          );
        })}
      </div>

      {/* Canvas */}
      <div className="flex justify-center mb-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          className="border border-gray-700 rounded-lg cursor-pointer max-w-full"
          style={{ aspectRatio: `${GRID_WIDTH}/${GRID_HEIGHT}` }}
        />
      </div>

      {/* Управление */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={toggleRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            state.isRunning
              ? "bg-yellow-600 hover:bg-yellow-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {state.isRunning ? (
            <>
              <Pause className="w-4 h-4" /> Пауза
            </>
          ) : (
            <>
              <Play className="w-4 h-4" /> Старт
            </>
          )}
        </button>
        <button
          onClick={resetLevel}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Сброс
        </button>
      </div>

      {/* Панель машин */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="text-sm text-gray-400 mb-3 text-center">Выберите машину</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {level.availableMachines.map((am) => {
            const props = MACHINE_PROPERTIES[am.type];
            const isSelected = state.selectedMachine === am.type;
            const remaining = getRemainingCount(am);
            const isDisabled = remaining === "0";

            return (
              <button
                key={am.type}
                onClick={() =>
                  !isDisabled &&
                  setState((prev) => ({ ...prev, selectedMachine: am.type }))
                }
                disabled={isDisabled}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[70px] transition-all ${
                  isSelected
                    ? "bg-blue-600 ring-2 ring-blue-400"
                    : isDisabled
                    ? "bg-gray-800 opacity-50 cursor-not-allowed"
                    : "bg-gray-800 hover:bg-gray-700"
                }`}
                title={props.description}
              >
                <span className="text-xl">{props.icon}</span>
                <span className="text-xs text-gray-300">{props.name.split(" ")[0]}</span>
                <span
                  className={`text-xs ${
                    remaining === "0" ? "text-red-400" : "text-gray-500"
                  }`}
                >
                  {remaining}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Модалка победы */}
      {state.isComplete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-8 text-center max-w-sm mx-4">
            <h2 className="text-2xl font-bold text-green-400 mb-4">
              🎉 Уровень пройден!
            </h2>
            <p className="text-gray-400 mb-6">
              {state.currentLevel < LEVELS.length - 1
                ? "Готовы к следующему испытанию?"
                : "Поздравляем! Вы прошли все уровни!"}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={resetLevel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Переиграть
              </button>
              {state.currentLevel < LEVELS.length - 1 && (
                <button
                  onClick={nextLevel}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Следующий уровень
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
