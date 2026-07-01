"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Pause, SkipForward, RotateCcw, Shuffle, Info, Trash2 } from "lucide-react";

// Размер сетки
const GRID_COLS = 60;
const GRID_ROWS = 40;

// Типы паттернов
type Pattern = {
  name: string;
  emoji: string;
  cells: [number, number][];
  description: string;
};

// Известные паттерны
const patterns: Pattern[] = [
  {
    name: "Глайдер",
    emoji: "🚀",
    description: "Летит по диагонали",
    cells: [
      [1, 0], [2, 1], [0, 2], [1, 2], [2, 2]
    ],
  },
  {
    name: "Блинкер",
    emoji: "💫",
    description: "Мигает с периодом 2",
    cells: [
      [0, 1], [1, 1], [2, 1]
    ],
  },
  {
    name: "Жаба",
    emoji: "🐸",
    description: "Осциллятор периода 2",
    cells: [
      [1, 0], [2, 0], [3, 0],
      [0, 1], [1, 1], [2, 1]
    ],
  },
  {
    name: "Маяк",
    emoji: "🗼",
    description: "Мигающий квадрат",
    cells: [
      [0, 0], [1, 0],
      [0, 1],
      [3, 2],
      [2, 3], [3, 3]
    ],
  },
  {
    name: "LWSS",
    emoji: "🛸",
    description: "Легкий космический корабль",
    cells: [
      [1, 0], [4, 0],
      [0, 1],
      [0, 2], [4, 2],
      [0, 3], [1, 3], [2, 3], [3, 3]
    ],
  },
  {
    name: "Пульсар",
    emoji: "💎",
    description: "Красивый осциллятор периода 3",
    cells: [
      // Верхняя часть
      [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
      [0, 2], [5, 2], [7, 2], [12, 2],
      [0, 3], [5, 3], [7, 3], [12, 3],
      [0, 4], [5, 4], [7, 4], [12, 4],
      [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
      // Нижняя часть
      [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
      [0, 8], [5, 8], [7, 8], [12, 8],
      [0, 9], [5, 9], [7, 9], [12, 9],
      [0, 10], [5, 10], [7, 10], [12, 10],
      [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
    ],
  },
  {
    name: "Пентадекатлон",
    emoji: "🎯",
    description: "Осциллятор периода 15",
    cells: [
      [1, 0], [2, 0], [3, 0],
      [0, 1], [4, 1],
      [0, 2], [4, 2],
      [1, 3], [2, 3], [3, 3],
      [1, 6], [2, 6], [3, 6],
      [0, 7], [4, 7],
      [0, 8], [4, 8],
      [1, 9], [2, 9], [3, 9],
    ],
  },
  {
    name: "Пушка Госпера",
    emoji: "🔫",
    description: "Генератор глайдеров",
    cells: [
      // Левый квадрат
      [0, 4], [0, 5], [1, 4], [1, 5],
      // Левая часть пушки
      [10, 4], [10, 5], [10, 6],
      [11, 3], [11, 7],
      [12, 2], [12, 8],
      [13, 2], [13, 8],
      [14, 5],
      [15, 3], [15, 7],
      [16, 4], [16, 5], [16, 6],
      [17, 5],
      // Правая часть пушки
      [20, 2], [20, 3], [20, 4],
      [21, 2], [21, 3], [21, 4],
      [22, 1], [22, 5],
      [24, 0], [24, 1], [24, 5], [24, 6],
      // Правый квадрат
      [34, 2], [34, 3], [35, 2], [35, 3],
    ],
  },
];

// Создание пустой сетки
function createEmptyGrid(): boolean[][] {
  return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(false));
}

// Подсчёт живых соседей
function countNeighbors(grid: boolean[][], row: number, col: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = (row + dr + GRID_ROWS) % GRID_ROWS;
      const c = (col + dc + GRID_COLS) % GRID_COLS;
      if (grid[r][c]) count++;
    }
  }
  return count;
}

// Следующее поколение
function nextGeneration(grid: boolean[][]): boolean[][] {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const neighbors = countNeighbors(grid, row, col);
      const alive = grid[row][col];

      // Правила Конвея
      if (alive && (neighbors === 2 || neighbors === 3)) {
        newGrid[row][col] = true;
      } else if (!alive && neighbors === 3) {
        newGrid[row][col] = true;
      }
    }
  }
  return newGrid;
}

// Склонение поколений
function pluralizeGeneration(n: number): string {
  const lastTwo = n % 100;
  const lastOne = n % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return `${n} поколений`;
  }
  if (lastOne === 1) {
    return `${n} поколение`;
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return `${n} поколения`;
  }
  return `${n} поколений`;
}

export default function GameOfLifePage() {
  const [grid, setGrid] = useState<boolean[][]>(createEmptyGrid);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(10);
  const [generation, setGeneration] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawValue, setDrawValue] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  // Рендер сетки
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * dpr;
    const height = rect.height * dpr;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;
    const cellW = w / GRID_COLS;
    const cellH = h / GRID_ROWS;

    // Фон
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    // Сетка (линии)
    ctx.strokeStyle = "rgba(100, 150, 255, 0.1)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, h);
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(w, i * cellH);
      ctx.stroke();
    }

    // Живые клетки
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        if (grid[row][col]) {
          const neighbors = countNeighbors(grid, row, col);
          // Цвет зависит от соседей
          if (neighbors < 2 || neighbors > 3) {
            ctx.fillStyle = "#f87171"; // Умрёт - красный
          } else {
            ctx.fillStyle = "#22d3ee"; // Выживет - голубой
          }
          ctx.fillRect(
            col * cellW + 1,
            row * cellH + 1,
            cellW - 2,
            cellH - 2
          );
        }
      }
    }

    // Показываем где появятся новые
    if (!isRunning) {
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (!grid[row][col]) {
            const neighbors = countNeighbors(grid, row, col);
            if (neighbors === 3) {
              ctx.fillStyle = "rgba(34, 211, 238, 0.2)";
              ctx.fillRect(
                col * cellW + 1,
                row * cellH + 1,
                cellW - 2,
                cellH - 2
              );
            }
          }
        }
      }
    }
  }, [grid, isRunning]);

  // Рендер при изменении
  useEffect(() => {
    render();
  }, [render]);

  // Анимация
  useEffect(() => {
    if (!isRunning) return;

    const interval = 1000 / speed;

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= interval) {
        setGrid(g => nextGeneration(g));
        setGeneration(gen => gen + 1);
        lastUpdateRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, speed]);

  // Обработка клика
  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement>, isClick: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.floor(x / (rect.width / GRID_COLS));
    const row = Math.floor(y / (rect.height / GRID_ROWS));

    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      if (isClick) {
        // При клике переключаем и запоминаем значение для рисования
        setGrid(g => {
          const newGrid = g.map(r => [...r]);
          newGrid[row][col] = !newGrid[row][col];
          setDrawValue(!g[row][col]);
          return newGrid;
        });
      } else if (isDrawing) {
        // При перетаскивании устанавливаем значение
        setGrid(g => {
          const newGrid = g.map(r => [...r]);
          newGrid[row][col] = drawValue;
          return newGrid;
        });
      }
    }
  }, [isDrawing, drawValue]);

  // Очистка
  const handleClear = () => {
    setGrid(createEmptyGrid());
    setGeneration(0);
    setIsRunning(false);
  };

  // Случайное заполнение
  const handleRandom = () => {
    const newGrid = createEmptyGrid();
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        newGrid[row][col] = Math.random() < 0.25;
      }
    }
    setGrid(newGrid);
    setGeneration(0);
  };

  // Один шаг
  const handleStep = () => {
    setGrid(g => nextGeneration(g));
    setGeneration(gen => gen + 1);
  };

  // Добавить паттерн
  const addPattern = (pattern: Pattern) => {
    const newGrid = createEmptyGrid();
    const offsetRow = Math.floor(GRID_ROWS / 2) - 5;
    const offsetCol = Math.floor(GRID_COLS / 2) - 5;

    pattern.cells.forEach(([col, row]) => {
      const r = row + offsetRow;
      const c = col + offsetCol;
      if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
        newGrid[r][c] = true;
      }
    });

    setGrid(newGrid);
    setGeneration(0);
    setIsRunning(false);
  };

  // Подсчёт живых клеток
  const aliveCount = grid.flat().filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Game of Life"
        description="Клеточный автомат Конвея — эмерджентность из простых правил"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">{pluralizeGeneration(generation)}</span>
            <span className="text-xs text-muted">{aliveCount} клеток живо</span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-[3/2] cursor-crosshair"
            style={{ background: "#0f172a" }}
            onClick={(e) => handleCanvasInteraction(e, true)}
            onMouseDown={(e) => {
              setIsDrawing(true);
              handleCanvasInteraction(e, true);
            }}
            onMouseMove={(e) => handleCanvasInteraction(e, false)}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
          />
        </div>

        {/* Управление */}
        <div className="space-y-4">
          {/* Кнопки */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                isRunning
                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? "Пауза" : "Старт"}
            </button>
            <button
              onClick={handleStep}
              disabled={isRunning}
              className="flex items-center justify-center px-4 py-3 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all disabled:opacity-50"
              title="Один шаг"
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                showInfo ? "bg-accent/20 text-accent" : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
            >
              <Info size={18} />
            </button>
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            <button
              onClick={handleRandom}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
            >
              <Shuffle size={16} />
              Случайно
            </button>
            <button
              onClick={handleClear}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={16} />
              Очистить
            </button>
          </div>

          {/* Скорость */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Скорость</span>
              <span className="font-mono">{speed} fps</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Паттерны */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Паттерны</h3>
            <div className="grid grid-cols-2 gap-2">
              {patterns.map(pattern => (
                <button
                  key={pattern.name}
                  onClick={() => addPattern(pattern)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/10 hover:bg-muted/20 transition-all text-left"
                  title={pattern.description}
                >
                  <span className="text-lg">{pattern.emoji}</span>
                  <span className="text-sm truncate">{pattern.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Легенда цветов */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Цвета</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-400"></div>
                <span className="text-muted">Выживет</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-400"></div>
                <span className="text-muted">Умрёт</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-cyan-400/20 border border-cyan-400/30"></div>
                <span className="text-muted">Родится (на паузе)</span>
              </div>
            </div>
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Правила Конвея</h3>
              <ul className="text-xs text-muted space-y-1">
                <li>• Живая клетка с 2-3 соседями <strong>выживает</strong></li>
                <li>• Мёртвая клетка с 3 соседями <strong>рождается</strong></li>
                <li>• Остальные клетки <strong>умирают</strong></li>
              </ul>
              <p className="text-xs text-muted">
                Кликай на сетку чтобы рисовать. Из простых правил возникает сложное поведение —
                глайдеры, осцилляторы, даже <em>компьютеры</em>!
              </p>
            </div>
          )}

          {/* Кнопка сброса */}
          <button
            onClick={() => {
              handleClear();
              setGeneration(0);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all"
          >
            <RotateCcw size={16} />
            Сбросить всё
          </button>
        </div>
      </div>
    </div>
  );
}
