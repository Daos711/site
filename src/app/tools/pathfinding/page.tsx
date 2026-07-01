"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Pause, RotateCcw, Trash2, Info, Target, Flag } from "lucide-react";

// Размер сетки
const GRID_COLS = 40;
const GRID_ROWS = 25;

// Типы клеток
type CellType = "empty" | "wall" | "start" | "end" | "visited" | "path" | "current";

type Cell = {
  row: number;
  col: number;
  type: CellType;
  g: number; // cost from start
  h: number; // heuristic to end
  f: number; // g + h
  parent: Cell | null;
};

type Algorithm = {
  id: string;
  name: string;
  description: string;
  weighted: boolean;
};

const algorithms: Algorithm[] = [
  {
    id: "astar",
    name: "A*",
    description: "Оптимальный путь с эвристикой — быстрый и точный",
    weighted: true,
  },
  {
    id: "dijkstra",
    name: "Dijkstra",
    description: "Гарантирует кратчайший путь, исследует равномерно",
    weighted: true,
  },
  {
    id: "bfs",
    name: "BFS",
    description: "Поиск в ширину — волна во все стороны",
    weighted: false,
  },
  {
    id: "dfs",
    name: "DFS",
    description: "Поиск в глубину — идёт до упора, потом возвращается",
    weighted: false,
  },
];

// Создание пустой сетки
function createGrid(): Cell[][] {
  const grid: Cell[][] = [];
  for (let row = 0; row < GRID_ROWS; row++) {
    const currentRow: Cell[] = [];
    for (let col = 0; col < GRID_COLS; col++) {
      currentRow.push({
        row,
        col,
        type: "empty",
        g: Infinity,
        h: 0,
        f: Infinity,
        parent: null,
      });
    }
    grid.push(currentRow);
  }
  return grid;
}

// Эвристика (Manhattan distance)
function heuristic(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

// Получить соседей
function getNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  const { row, col } = cell;
  const directions = [
    [-1, 0], [1, 0], [0, -1], [0, 1], // 4 направления
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (
      newRow >= 0 && newRow < GRID_ROWS &&
      newCol >= 0 && newCol < GRID_COLS &&
      grid[newRow][newCol].type !== "wall"
    ) {
      neighbors.push(grid[newRow][newCol]);
    }
  }
  return neighbors;
}

// Генератор шагов A*
function* astar(grid: Cell[][], start: Cell, end: Cell): Generator<{ grid: Cell[][], found: boolean }> {
  const openSet: Cell[] = [start];
  const closedSet = new Set<Cell>();

  start.g = 0;
  start.h = heuristic(start, end);
  start.f = start.h;

  while (openSet.length > 0) {
    // Найти узел с минимальным f
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;

    if (current === end) {
      // Восстановить путь
      let node: Cell | null = current;
      while (node) {
        if (node.type !== "start" && node.type !== "end") {
          node.type = "path";
        }
        node = node.parent;
      }
      yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: true };
      return;
    }

    closedSet.add(current);
    if (current.type !== "start" && current.type !== "end") {
      current.type = "visited";
    }

    for (const neighbor of getNeighbors(grid, current)) {
      if (closedSet.has(neighbor)) continue;

      const tentativeG = current.g + 1;

      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue;
      }

      neighbor.parent = current;
      neighbor.g = tentativeG;
      neighbor.h = heuristic(neighbor, end);
      neighbor.f = neighbor.g + neighbor.h;

      if (neighbor.type !== "start" && neighbor.type !== "end") {
        neighbor.type = "current";
      }
    }

    yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };

    // Сбросить current обратно в visited
    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === "current") cell.type = "visited";
      }
    }
  }

  yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };
}

// Генератор шагов Dijkstra
function* dijkstra(grid: Cell[][], start: Cell, end: Cell): Generator<{ grid: Cell[][], found: boolean }> {
  const openSet: Cell[] = [start];
  const closedSet = new Set<Cell>();

  start.g = 0;

  while (openSet.length > 0) {
    openSet.sort((a, b) => a.g - b.g);
    const current = openSet.shift()!;

    if (current === end) {
      let node: Cell | null = current;
      while (node) {
        if (node.type !== "start" && node.type !== "end") {
          node.type = "path";
        }
        node = node.parent;
      }
      yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: true };
      return;
    }

    closedSet.add(current);
    if (current.type !== "start" && current.type !== "end") {
      current.type = "visited";
    }

    for (const neighbor of getNeighbors(grid, current)) {
      if (closedSet.has(neighbor)) continue;

      const tentativeG = current.g + 1;

      if (!openSet.includes(neighbor)) {
        openSet.push(neighbor);
      } else if (tentativeG >= neighbor.g) {
        continue;
      }

      neighbor.parent = current;
      neighbor.g = tentativeG;

      if (neighbor.type !== "start" && neighbor.type !== "end") {
        neighbor.type = "current";
      }
    }

    yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };

    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === "current") cell.type = "visited";
      }
    }
  }

  yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };
}

// Генератор шагов BFS
function* bfs(grid: Cell[][], start: Cell, end: Cell): Generator<{ grid: Cell[][], found: boolean }> {
  const queue: Cell[] = [start];
  const visited = new Set<Cell>();
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current === end) {
      let node: Cell | null = current;
      while (node) {
        if (node.type !== "start" && node.type !== "end") {
          node.type = "path";
        }
        node = node.parent;
      }
      yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: true };
      return;
    }

    if (current.type !== "start" && current.type !== "end") {
      current.type = "visited";
    }

    for (const neighbor of getNeighbors(grid, current)) {
      if (visited.has(neighbor)) continue;

      visited.add(neighbor);
      neighbor.parent = current;

      if (neighbor.type !== "start" && neighbor.type !== "end") {
        neighbor.type = "current";
      }

      queue.push(neighbor);
    }

    yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };

    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === "current") cell.type = "visited";
      }
    }
  }

  yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };
}

// Генератор шагов DFS
function* dfs(grid: Cell[][], start: Cell, end: Cell): Generator<{ grid: Cell[][], found: boolean }> {
  const stack: Cell[] = [start];
  const visited = new Set<Cell>();

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (visited.has(current)) continue;
    visited.add(current);

    if (current === end) {
      let node: Cell | null = current;
      while (node) {
        if (node.type !== "start" && node.type !== "end") {
          node.type = "path";
        }
        node = node.parent;
      }
      yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: true };
      return;
    }

    if (current.type !== "start" && current.type !== "end") {
      current.type = "visited";
    }

    const neighbors = getNeighbors(grid, current);
    for (const neighbor of neighbors.reverse()) {
      if (visited.has(neighbor)) continue;

      neighbor.parent = current;

      if (neighbor.type !== "start" && neighbor.type !== "end") {
        neighbor.type = "current";
      }

      stack.push(neighbor);
    }

    yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };

    for (const row of grid) {
      for (const cell of row) {
        if (cell.type === "current") cell.type = "visited";
      }
    }
  }

  yield { grid: grid.map(row => row.map(cell => ({ ...cell }))), found: false };
}

// Генерация случайного лабиринта
function generateMaze(grid: Cell[][], start: [number, number], end: [number, number]): Cell[][] {
  const newGrid = createGrid();

  // Заполняем всё стенами
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      newGrid[row][col].type = "wall";
    }
  }

  // Recursive backtracking
  const stack: [number, number][] = [[1, 1]];
  newGrid[1][1].type = "empty";

  while (stack.length > 0) {
    const [row, col] = stack[stack.length - 1];
    const directions = [
      [-2, 0], [2, 0], [0, -2], [0, 2]
    ].sort(() => Math.random() - 0.5);

    let found = false;
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (
        newRow > 0 && newRow < GRID_ROWS - 1 &&
        newCol > 0 && newCol < GRID_COLS - 1 &&
        newGrid[newRow][newCol].type === "wall"
      ) {
        newGrid[newRow][newCol].type = "empty";
        newGrid[row + dr / 2][col + dc / 2].type = "empty";
        stack.push([newRow, newCol]);
        found = true;
        break;
      }
    }

    if (!found) {
      stack.pop();
    }
  }

  // Установить старт и конец
  newGrid[start[0]][start[1]].type = "start";
  newGrid[end[0]][end[1]].type = "end";

  return newGrid;
}

// Случайные стены
function addRandomWalls(grid: Cell[][], density: number = 0.3): Cell[][] {
  const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      if (newGrid[row][col].type === "empty" && Math.random() < density) {
        newGrid[row][col].type = "wall";
      }
    }
  }

  return newGrid;
}

export default function PathfindingPage() {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [isClient, setIsClient] = useState(false);
  const [startPos, setStartPos] = useState<[number, number]>([2, 2]);
  const [endPos, setEndPos] = useState<[number, number]>([GRID_ROWS - 3, GRID_COLS - 3]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [algorithm, setAlgorithm] = useState<string>("astar");
  const [visitedCount, setVisitedCount] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [drawMode, setDrawMode] = useState<"wall" | "start" | "end">("wall");
  const [isDrawing, setIsDrawing] = useState(false);
  const [found, setFound] = useState<boolean | null>(null);

  const generatorRef = useRef<Generator<{ grid: Cell[][], found: boolean }> | null>(null);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const isPausedRef = useRef(false);

  // Инициализация на клиенте
  useEffect(() => {
    const newGrid = createGrid();
    newGrid[startPos[0]][startPos[1]].type = "start";
    newGrid[endPos[0]][endPos[1]].type = "end";
    setGrid(newGrid);
    setIsClient(true);
  }, []);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Получить генератор
  const getGenerator = useCallback((alg: string, g: Cell[][], s: Cell, e: Cell) => {
    switch (alg) {
      case "astar": return astar(g, s, e);
      case "dijkstra": return dijkstra(g, s, e);
      case "bfs": return bfs(g, s, e);
      case "dfs": return dfs(g, s, e);
      default: return astar(g, s, e);
    }
  }, []);

  // Анимация
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = Math.max(1, 101 - speed);

    const animate = (timestamp: number) => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      if (timestamp - lastUpdateRef.current >= interval) {
        if (generatorRef.current) {
          const result = generatorRef.current.next();

          if (result.done) {
            setIsRunning(false);
          } else {
            setGrid(result.value.grid);

            // Подсчёт посещённых и длины пути
            let visited = 0;
            let path = 0;
            for (const row of result.value.grid) {
              for (const cell of row) {
                if (cell.type === "visited" || cell.type === "current") visited++;
                if (cell.type === "path") path++;
              }
            }
            setVisitedCount(visited);
            setPathLength(path);

            if (result.value.found) {
              setFound(true);
              setIsRunning(false);
            }
          }
        }
        lastUpdateRef.current = timestamp;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, isPaused, speed]);

  // Старт
  const handleStart = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      // Сбросить визуализацию, сохранив стены
      const newGrid = grid.map(row => row.map(cell => ({
        ...cell,
        type: cell.type === "wall" || cell.type === "start" || cell.type === "end" ? cell.type : "empty" as CellType,
        g: Infinity,
        h: 0,
        f: Infinity,
        parent: null,
      })));

      const start = newGrid[startPos[0]][startPos[1]];
      const end = newGrid[endPos[0]][endPos[1]];

      setGrid(newGrid);
      setVisitedCount(0);
      setPathLength(0);
      setFound(null);

      generatorRef.current = getGenerator(algorithm, newGrid, start, end);
      setIsRunning(true);
      setIsPaused(false);
    }
  };

  // Сброс
  const handleReset = () => {
    cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setVisitedCount(0);
    setPathLength(0);
    setFound(null);
    generatorRef.current = null;

    // Сбросить визуализацию
    setGrid(g => g.map(row => row.map(cell => ({
      ...cell,
      type: cell.type === "wall" || cell.type === "start" || cell.type === "end" ? cell.type : "empty" as CellType,
      g: Infinity,
      h: 0,
      f: Infinity,
      parent: null,
    }))));
  };

  // Очистить всё
  const handleClear = () => {
    handleReset();
    const newGrid = createGrid();
    newGrid[startPos[0]][startPos[1]].type = "start";
    newGrid[endPos[0]][endPos[1]].type = "end";
    setGrid(newGrid);
  };

  // Генерировать лабиринт
  const handleMaze = () => {
    handleReset();
    const newGrid = generateMaze(createGrid(), startPos, endPos);
    setGrid(newGrid);
  };

  // Случайные стены
  const handleRandomWalls = () => {
    handleReset();
    let newGrid = createGrid();
    newGrid[startPos[0]][startPos[1]].type = "start";
    newGrid[endPos[0]][endPos[1]].type = "end";
    newGrid = addRandomWalls(newGrid, 0.3);
    newGrid[startPos[0]][startPos[1]].type = "start";
    newGrid[endPos[0]][endPos[1]].type = "end";
    setGrid(newGrid);
  };

  // Клик по клетке
  const handleCellClick = (row: number, col: number) => {
    if (isRunning) return;

    setGrid(g => {
      const newGrid = g.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];

      if (drawMode === "wall") {
        if (cell.type === "empty") {
          cell.type = "wall";
        } else if (cell.type === "wall") {
          cell.type = "empty";
        }
      } else if (drawMode === "start" && cell.type !== "end") {
        // Удалить старый старт
        newGrid[startPos[0]][startPos[1]].type = "empty";
        cell.type = "start";
        setStartPos([row, col]);
      } else if (drawMode === "end" && cell.type !== "start") {
        // Удалить старый конец
        newGrid[endPos[0]][endPos[1]].type = "empty";
        cell.type = "end";
        setEndPos([row, col]);
      }

      return newGrid;
    });
  };

  // Рисование стен
  const handleCellDrag = (row: number, col: number) => {
    if (isRunning || !isDrawing || drawMode !== "wall") return;

    setGrid(g => {
      const newGrid = g.map(r => r.map(c => ({ ...c })));
      const cell = newGrid[row][col];

      if (cell.type === "empty") {
        cell.type = "wall";
      }

      return newGrid;
    });
  };

  // Смена алгоритма
  const handleAlgorithmChange = (alg: string) => {
    handleReset();
    setAlgorithm(alg);
  };

  const currentAlgorithm = algorithms.find(a => a.id === algorithm)!;

  // Цвет клетки
  const getCellColor = (type: CellType): string => {
    switch (type) {
      case "wall": return "bg-slate-700";
      case "start": return "bg-green-500";
      case "end": return "bg-red-500";
      case "visited": return "bg-cyan-500/40";
      case "path": return "bg-yellow-400";
      case "current": return "bg-cyan-400";
      default: return "bg-slate-900";
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Поиск пути"
        description="Визуализация алгоритмов поиска пути: A*, Dijkstra, BFS, DFS"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Сетка */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">{currentAlgorithm.name}</span>
            <div className="flex gap-4 text-xs text-muted">
              <span>Посещено: {visitedCount}</span>
              {pathLength > 0 && <span>Путь: {pathLength}</span>}
              {found === true && <span className="text-green-400">Найден!</span>}
              {found === false && <span className="text-red-400">Не найден</span>}
            </div>
          </div>

          <div
            className="p-2 overflow-auto"
            style={{ background: "#0f172a" }}
          >
            {!isClient ? (
              <div className="h-80 flex items-center justify-center text-muted text-sm">
                Загрузка...
              </div>
            ) : (
              <div
                className="grid gap-[1px] mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                  maxWidth: "100%",
                }}
              >
                {grid.map((row, rowIdx) =>
                  row.map((cell, colIdx) => (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={`aspect-square ${getCellColor(cell.type)} transition-colors duration-75 cursor-pointer hover:opacity-80`}
                      style={{ minWidth: "8px", minHeight: "8px" }}
                      onClick={() => handleCellClick(rowIdx, colIdx)}
                      onMouseDown={() => setIsDrawing(true)}
                      onMouseUp={() => setIsDrawing(false)}
                      onMouseEnter={() => handleCellDrag(rowIdx, colIdx)}
                      onMouseLeave={() => {}}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Легенда */}
          <div className="p-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Старт</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Финиш</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-700"></div>
              <span>Стена</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-cyan-500/40"></div>
              <span>Посещено</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-yellow-400"></div>
              <span>Путь</span>
            </div>
          </div>
        </div>

        {/* Управление */}
        <div className="space-y-4">
          {/* Кнопки управления */}
          <div className="flex gap-2">
            <button
              onClick={handleStart}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                isRunning && !isPaused
                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              {isRunning && !isPaused ? <Pause size={18} /> : <Play size={18} />}
              {isRunning && !isPaused ? "Пауза" : isRunning ? "Далее" : "Старт"}
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

          {/* Режим рисования */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Рисование</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setDrawMode("wall")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                  drawMode === "wall"
                    ? "bg-slate-600 text-white"
                    : "bg-muted/10 text-muted hover:bg-muted/20"
                }`}
              >
                Стены
              </button>
              <button
                onClick={() => setDrawMode("start")}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                  drawMode === "start"
                    ? "bg-green-500/30 text-green-400"
                    : "bg-muted/10 text-muted hover:bg-muted/20"
                }`}
              >
                <Flag size={14} />
              </button>
              <button
                onClick={() => setDrawMode("end")}
                className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm transition-all ${
                  drawMode === "end"
                    ? "bg-red-500/30 text-red-400"
                    : "bg-muted/10 text-muted hover:bg-muted/20"
                }`}
              >
                <Target size={14} />
              </button>
            </div>
          </div>

          {/* Генерация */}
          <div className="flex gap-2">
            <button
              onClick={handleRandomWalls}
              disabled={isRunning}
              className="flex-1 px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all text-sm disabled:opacity-50"
            >
              Случайно
            </button>
            <button
              onClick={handleMaze}
              disabled={isRunning}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all text-sm disabled:opacity-50"
            >
              Лабиринт
            </button>
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all"
            >
              <RotateCcw size={16} />
              Сброс
            </button>
            <button
              onClick={handleClear}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={16} />
              Очистить
            </button>
          </div>

          {/* Алгоритмы */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Алгоритм</h3>
            <div className="grid grid-cols-2 gap-2">
              {algorithms.map((alg) => (
                <button
                  key={alg.id}
                  onClick={() => handleAlgorithmChange(alg.id)}
                  disabled={isRunning}
                  className={`px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    algorithm === alg.id
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-muted/10 text-muted hover:bg-muted/20 disabled:opacity-50"
                  }`}
                >
                  <div className="font-medium">{alg.name}</div>
                  <div className="text-xs opacity-70">{alg.weighted ? "взвешенный" : "невзвешенный"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Скорость */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Скорость</span>
              <span className="font-mono">{speed}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">{currentAlgorithm.name}</h3>
              <p className="text-xs text-muted">{currentAlgorithm.description}</p>
              <div className="border-t border-border/50 pt-3 mt-3 text-xs text-muted space-y-1">
                <p>• Кликай на сетку чтобы ставить стены</p>
                <p>• Используй кнопки флага/мишени для перемещения старта/финиша</p>
                <p>• &quot;Лабиринт&quot; генерирует идеальный лабиринт</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
