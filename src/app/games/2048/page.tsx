"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RotateCcw, Trophy } from "lucide-react";

const GRID_SIZE = 4;

type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
};

// Цвета плиток
const tileColors: Record<number, { bg: string; text: string }> = {
  2: { bg: "bg-amber-100", text: "text-amber-900" },
  4: { bg: "bg-amber-200", text: "text-amber-900" },
  8: { bg: "bg-orange-300", text: "text-white" },
  16: { bg: "bg-orange-400", text: "text-white" },
  32: { bg: "bg-orange-500", text: "text-white" },
  64: { bg: "bg-orange-600", text: "text-white" },
  128: { bg: "bg-yellow-400", text: "text-white" },
  256: { bg: "bg-yellow-500", text: "text-white" },
  512: { bg: "bg-yellow-600", text: "text-white" },
  1024: { bg: "bg-amber-500", text: "text-white" },
  2048: { bg: "bg-amber-600", text: "text-white" },
  4096: { bg: "bg-red-500", text: "text-white" },
  8192: { bg: "bg-red-600", text: "text-white" },
};

function getTileStyle(value: number) {
  return tileColors[value] || { bg: "bg-slate-800", text: "text-white" };
}

function getFontSize(value: number) {
  if (value >= 1000) return "text-2xl";
  if (value >= 100) return "text-3xl";
  return "text-4xl";
}

let tileIdCounter = 0;
function getNewTileId() {
  return ++tileIdCounter;
}

// Создание пустой сетки
function createEmptyGrid(): (Tile | null)[][] {
  return Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
}

// Добавление случайной плитки
function addRandomTile(grid: (Tile | null)[][]): (Tile | null)[][] {
  const emptyCells: [number, number][] = [];

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!grid[row][col]) {
        emptyCells.push([row, col]);
      }
    }
  }

  if (emptyCells.length === 0) return grid;

  const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = {
    id: getNewTileId(),
    value: Math.random() < 0.9 ? 2 : 4,
    row,
    col,
    isNew: true,
  };

  return newGrid;
}

// Сдвиг строки влево
function slideRow(row: (Tile | null)[]): { newRow: (Tile | null)[]; score: number } {
  // Убираем пустые
  const filtered = row.filter(cell => cell !== null) as Tile[];
  let score = 0;

  // Объединяем одинаковые
  const merged: (Tile | null)[] = [];
  let skip = false;

  for (let i = 0; i < filtered.length; i++) {
    if (skip) {
      skip = false;
      continue;
    }

    if (i < filtered.length - 1 && filtered[i].value === filtered[i + 1].value) {
      const newValue = filtered[i].value * 2;
      merged.push({
        id: getNewTileId(),
        value: newValue,
        row: 0,
        col: 0,
        isMerged: true,
      });
      score += newValue;
      skip = true;
    } else {
      merged.push({ ...filtered[i], isNew: false, isMerged: false });
    }
  }

  // Дополняем пустыми
  while (merged.length < GRID_SIZE) {
    merged.push(null);
  }

  return { newRow: merged, score };
}

// Поворот сетки на 90 градусов по часовой
function rotateGrid(grid: (Tile | null)[][]): (Tile | null)[][] {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      newGrid[col][GRID_SIZE - 1 - row] = grid[row][col];
    }
  }
  return newGrid;
}

// Движение
function move(grid: (Tile | null)[][], direction: "left" | "right" | "up" | "down"): { newGrid: (Tile | null)[][]; score: number; moved: boolean } {
  let rotations = 0;
  switch (direction) {
    case "left": rotations = 0; break;
    case "down": rotations = 1; break;
    case "right": rotations = 2; break;
    case "up": rotations = 3; break;
  }

  // Поворачиваем чтобы всегда двигать влево
  let workGrid = grid;
  for (let i = 0; i < rotations; i++) {
    workGrid = rotateGrid(workGrid);
  }

  let totalScore = 0;
  const newGrid = createEmptyGrid();

  for (let row = 0; row < GRID_SIZE; row++) {
    const { newRow, score } = slideRow(workGrid[row]);
    newGrid[row] = newRow;
    totalScore += score;
  }

  // Поворачиваем обратно
  let finalGrid = newGrid;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    finalGrid = rotateGrid(finalGrid);
  }

  // Обновляем координаты
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (finalGrid[row][col]) {
        finalGrid[row][col] = { ...finalGrid[row][col]!, row, col };
      }
    }
  }

  // Проверяем, было ли движение
  const moved = JSON.stringify(grid.map(r => r.map(c => c?.value))) !==
                JSON.stringify(finalGrid.map(r => r.map(c => c?.value)));

  return { newGrid: finalGrid, score: totalScore, moved };
}

// Проверка на возможность хода
function canMove(grid: (Tile | null)[][]): boolean {
  // Есть пустые клетки
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!grid[row][col]) return true;
    }
  }

  // Есть соседние одинаковые
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col]?.value;
      if (col < GRID_SIZE - 1 && grid[row][col + 1]?.value === value) return true;
      if (row < GRID_SIZE - 1 && grid[row + 1][col]?.value === value) return true;
    }
  }

  return false;
}

// Проверка на победу
function hasWon(grid: (Tile | null)[][]): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col]?.value === 2048) return true;
    }
  }
  return false;
}

export default function Game2048Page() {
  const [grid, setGrid] = useState<(Tile | null)[][]>(createEmptyGrid);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Инициализация
  useEffect(() => {
    const saved = localStorage.getItem("2048-best");
    if (saved) setBestScore(parseInt(saved));

    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setIsClient(true);
  }, []);

  // Сохранение лучшего счёта
  useEffect(() => {
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem("2048-best", score.toString());
    }
  }, [score, bestScore]);

  // Обработка хода
  const handleMove = useCallback((direction: "left" | "right" | "up" | "down") => {
    if (gameOver) return;

    const { newGrid, score: moveScore, moved } = move(grid, direction);

    if (moved) {
      const gridWithNew = addRandomTile(newGrid);
      setGrid(gridWithNew);
      setScore(s => s + moveScore);

      if (hasWon(gridWithNew) && !won) {
        setWon(true);
      }

      if (!canMove(gridWithNew)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, won]);

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const direction = e.key.replace("Arrow", "").toLowerCase() as "left" | "right" | "up" | "down";
        handleMove(direction);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleMove]);

  // Свайпы
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      const minSwipe = 50;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        handleMove(dx > 0 ? "right" : "left");
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        handleMove(dy > 0 ? "down" : "up");
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMove]);

  // Новая игра
  const handleNewGame = () => {
    tileIdCounter = 0;
    let newGrid = createEmptyGrid();
    newGrid = addRandomTile(newGrid);
    newGrid = addRandomTile(newGrid);
    setGrid(newGrid);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="2048"
        description="Соединяй плитки, собери 2048!"
      />

      {/* Счёт */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-xs text-muted uppercase tracking-wide">Счёт</div>
          <div className="text-2xl font-bold text-accent">{score}</div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-xs text-muted uppercase tracking-wide flex items-center justify-center gap-1">
            <Trophy size={12} />
            Лучший
          </div>
          <div className="text-2xl font-bold text-yellow-500">{bestScore}</div>
        </div>
        <button
          onClick={handleNewGame}
          className="px-4 rounded-xl bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all flex items-center gap-2"
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Новая</span>
        </button>
      </div>

      {/* Игровое поле */}
      <div className="relative">
        <div
          className="grid gap-2 p-3 rounded-2xl bg-slate-700/50"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
        >
          {/* Фоновые ячейки */}
          {Array(GRID_SIZE * GRID_SIZE).fill(null).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-slate-600/50"
            />
          ))}
        </div>

        {/* Плитки */}
        {isClient && (
          <div className="absolute inset-3">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            >
              {grid.flat().map((tile, i) => {
                const row = Math.floor(i / GRID_SIZE);
                const col = i % GRID_SIZE;

                if (!tile) return <div key={`empty-${row}-${col}`} className="aspect-square" />;

                const style = getTileStyle(tile.value);
                const fontSize = getFontSize(tile.value);

                return (
                  <div
                    key={tile.id}
                    className={`aspect-square rounded-lg flex items-center justify-center font-bold ${style.bg} ${style.text} ${fontSize} ${
                      tile.isNew ? "animate-pop-in" : ""
                    } ${tile.isMerged ? "animate-pop-merge" : ""} transition-all duration-100`}
                  >
                    {tile.value}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Game Over */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white mb-2">Игра окончена!</div>
            <div className="text-muted mb-4">Счёт: {score}</div>
            <button
              onClick={handleNewGame}
              className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all"
            >
              Играть снова
            </button>
          </div>
        )}

        {/* Win */}
        {won && !gameOver && (
          <div className="absolute inset-0 bg-yellow-500/80 rounded-2xl flex flex-col items-center justify-center animate-fade-in">
            <div className="text-4xl font-bold text-white mb-2">2048!</div>
            <div className="text-white/80 mb-4">Поздравляем!</div>
            <div className="flex gap-2">
              <button
                onClick={() => setWon(false)}
                className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold hover:bg-white/30 transition-all"
              >
                Продолжить
              </button>
              <button
                onClick={handleNewGame}
                className="px-4 py-2 rounded-xl bg-white text-yellow-600 font-bold hover:bg-white/90 transition-all"
              >
                Новая игра
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Инструкция */}
      <div className="mt-4 text-center text-xs text-muted">
        Используй стрелки или свайпы для перемещения плиток
      </div>

      {/* CSS анимации */}
      <style jsx global>{`
        @keyframes pop-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes pop-merge {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-pop-in {
          animation: pop-in 0.15s ease-out;
        }
        .animate-pop-merge {
          animation: pop-merge 0.15s ease-out;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
