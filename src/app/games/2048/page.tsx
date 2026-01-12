"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RotateCcw, Trophy, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  getScores2048,
  submitScore2048,
  getScores2048_3x3,
  submitScore2048_3x3,
  Score2048Entry,
  getPlayer2048Name,
  setPlayer2048Name,
  savePending2048Result,
  getPending2048Result,
  clearPending2048Result,
} from "@/lib/supabase";

type GridSize = 3 | 4;

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

function getFontSize(value: number, gridSize: GridSize) {
  if (gridSize === 3) {
    if (value >= 1000) return "text-3xl";
    if (value >= 100) return "text-4xl";
    return "text-5xl";
  }
  if (value >= 1000) return "text-2xl";
  if (value >= 100) return "text-3xl";
  return "text-4xl";
}

let tileIdCounter = 0;
function getNewTileId() {
  return ++tileIdCounter;
}

// Создание пустой сетки
function createEmptyGrid(size: GridSize): (Tile | null)[][] {
  return Array(size).fill(null).map(() => Array(size).fill(null));
}

// Добавление случайной плитки
function addRandomTile(grid: (Tile | null)[][], size: GridSize): (Tile | null)[][] {
  const emptyCells: [number, number][] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
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
function slideRow(row: (Tile | null)[], size: GridSize): { newRow: (Tile | null)[]; score: number } {
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
  while (merged.length < size) {
    merged.push(null);
  }

  return { newRow: merged, score };
}

// Поворот сетки на 90 градусов по часовой
function rotateGrid(grid: (Tile | null)[][], size: GridSize): (Tile | null)[][] {
  const newGrid = createEmptyGrid(size);
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      newGrid[col][size - 1 - row] = grid[row][col];
    }
  }
  return newGrid;
}

// Движение
function move(grid: (Tile | null)[][], direction: "left" | "right" | "up" | "down", size: GridSize): { newGrid: (Tile | null)[][]; score: number; moved: boolean } {
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
    workGrid = rotateGrid(workGrid, size);
  }

  let totalScore = 0;
  const newGrid = createEmptyGrid(size);

  for (let row = 0; row < size; row++) {
    const { newRow, score } = slideRow(workGrid[row], size);
    newGrid[row] = newRow;
    totalScore += score;
  }

  // Поворачиваем обратно
  let finalGrid = newGrid;
  for (let i = 0; i < (4 - rotations) % 4; i++) {
    finalGrid = rotateGrid(finalGrid, size);
  }

  // Обновляем координаты
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
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
function canMove(grid: (Tile | null)[][], size: GridSize): boolean {
  // Есть пустые клетки
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) return true;
    }
  }

  // Есть соседние одинаковые
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = grid[row][col]?.value;
      if (col < size - 1 && grid[row][col + 1]?.value === value) return true;
      if (row < size - 1 && grid[row + 1][col]?.value === value) return true;
    }
  }

  return false;
}

// Проверка на победу (512 для 3x3, 2048 для 4x4)
function hasWon(grid: (Tile | null)[][], size: GridSize): boolean {
  const winValue = size === 3 ? 512 : 2048;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col]?.value === winValue) return true;
    }
  }
  return false;
}

export default function Game2048Page() {
  const [gridSize, setGridSize] = useState<GridSize>(4);
  const [grid, setGrid] = useState<(Tile | null)[][]>(() => createEmptyGrid(4));
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [bestScore3x3, setBestScore3x3] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [keepPlaying, setKeepPlaying] = useState(false); // После нажатия "Продолжить"
  const [isClient, setIsClient] = useState(false);

  // Auth
  const { user: authUser, playerId, signIn } = useAuth();

  // Leaderboard & Score submission
  const [leaderboard, setLeaderboard] = useState<Score2048Entry[]>([]);
  const [leaderboard3x3, setLeaderboard3x3] = useState<Score2048Entry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [playerName, setPlayerNameState] = useState("");
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Pending result notification
  const [pendingResultMessage, setPendingResultMessage] = useState<string | null>(null);
  const pendingResultSubmittedRef = useRef(false);

  // Инициализация
  useEffect(() => {
    const saved4x4 = localStorage.getItem("2048-best");
    const saved3x3 = localStorage.getItem("2048-best-3x3");
    if (saved4x4) setBestScore(parseInt(saved4x4));
    if (saved3x3) setBestScore3x3(parseInt(saved3x3));

    // Загрузить сохранённое имя
    const savedName = getPlayer2048Name();
    if (savedName) setPlayerNameState(savedName);

    let newGrid = createEmptyGrid(4);
    newGrid = addRandomTile(newGrid, 4);
    newGrid = addRandomTile(newGrid, 4);
    setGrid(newGrid);
    setIsClient(true);

    fetchAllLeaderboards();
  }, []);

  // Проверка и отправка pending result после OAuth
  useEffect(() => {
    if (pendingResultSubmittedRef.current) return;
    if (authUser && playerId) {
      const pending = getPending2048Result();
      if (pending && pending.name && pending.name.trim() && pending.score > 0) {
        pendingResultSubmittedRef.current = true;
        (async () => {
          try {
            // Определяем режим по сохранённому gridSize (если есть)
            const pendingGridSize = pending.gridSize || 4;
            const submitFn = pendingGridSize === 3 ? submitScore2048_3x3 : submitScore2048;
            const result = await submitFn(playerId, pending.name.trim(), pending.score, pending.maxTile);
            clearPending2048Result();
            if (result.success) {
              setPendingResultMessage(result.isNewRecord
                ? `Новый рекорд сохранён! ${pending.score} очков`
                : `Результат сохранён! ${pending.score} очков`);
              await fetchAllLeaderboards();
            } else {
              setPendingResultMessage('Ошибка сохранения результата');
            }
            setTimeout(() => setPendingResultMessage(null), 5000);
          } catch {
            clearPending2048Result();
            setPendingResultMessage('Ошибка сохранения результата');
            setTimeout(() => setPendingResultMessage(null), 5000);
          }
        })();
      } else if (pending) {
        clearPending2048Result();
      }
    }
  }, [authUser, playerId]);

  const fetchAllLeaderboards = async () => {
    setLeaderboardLoading(true);
    try {
      const [scores4x4, scores3x3] = await Promise.all([
        getScores2048(20),
        getScores2048_3x3(20),
      ]);
      setLeaderboard(scores4x4);
      setLeaderboard3x3(scores3x3);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Get max tile
  const getMaxTile = useCallback((g: (Tile | null)[][]) => {
    let max = 0;
    for (const row of g) {
      for (const tile of row) {
        if (tile && tile.value > max) max = tile.value;
      }
    }
    return max;
  }, []);

  // Submit score
  const handleSubmitScore = async () => {
    if (!authUser || !playerName.trim() || score === 0 || scoreSubmitting || scoreSubmitted) return;

    setScoreSubmitting(true);
    try {
      const maxTile = getMaxTile(grid);
      const submitFn = gridSize === 3 ? submitScore2048_3x3 : submitScore2048;
      const result = await submitFn(playerId, playerName.trim(), score, maxTile);
      if (result.success) {
        setScoreSubmitted(true);
        setIsNewRecord(result.isNewRecord);
        setPlayer2048Name(playerName.trim());
        await fetchAllLeaderboards();
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
    } finally {
      setScoreSubmitting(false);
    }
  };

  // Сохранение лучшего счёта
  useEffect(() => {
    if (gridSize === 4) {
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem("2048-best", score.toString());
      }
    } else {
      if (score > bestScore3x3) {
        setBestScore3x3(score);
        localStorage.setItem("2048-best-3x3", score.toString());
      }
    }
  }, [score, bestScore, bestScore3x3, gridSize]);

  // Обработка хода
  const handleMove = useCallback((direction: "left" | "right" | "up" | "down") => {
    if (gameOver) return;

    const { newGrid, score: moveScore, moved } = move(grid, direction, gridSize);

    if (moved) {
      const gridWithNew = addRandomTile(newGrid, gridSize);
      setGrid(gridWithNew);
      setScore(s => s + moveScore);

      // Показываем победу только если ещё не показывали и не нажали "Продолжить"
      if (hasWon(gridWithNew, gridSize) && !won && !keepPlaying) {
        setWon(true);
      }

      if (!canMove(gridWithNew, gridSize)) {
        setGameOver(true);
      }
    }
  }, [grid, gameOver, won, keepPlaying, gridSize]);

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

  // Свайпы на игровом поле
  const gameAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gameArea = gameAreaRef.current;
    if (!gameArea) return;

    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Предотвращаем скролл страницы при свайпе по игровому полю
      e.preventDefault();
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

    gameArea.addEventListener("touchstart", handleTouchStart, { passive: true });
    gameArea.addEventListener("touchmove", handleTouchMove, { passive: false });
    gameArea.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      gameArea.removeEventListener("touchstart", handleTouchStart);
      gameArea.removeEventListener("touchmove", handleTouchMove);
      gameArea.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMove]);

  // Новая игра (с текущим размером)
  const handleNewGame = useCallback((size: GridSize = gridSize) => {
    tileIdCounter = 0;
    let newGrid = createEmptyGrid(size);
    newGrid = addRandomTile(newGrid, size);
    newGrid = addRandomTile(newGrid, size);
    setGrid(newGrid);
    setGridSize(size);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setKeepPlaying(false);
    setScoreSubmitted(false);
    setIsNewRecord(false);
  }, [gridSize]);

  // Переключение режима
  const handleModeChange = (newSize: GridSize) => {
    if (newSize !== gridSize) {
      handleNewGame(newSize);
    }
  };

  const currentBestScore = gridSize === 4 ? bestScore : bestScore3x3;
  const currentLeaderboard = gridSize === 4 ? leaderboard : leaderboard3x3;
  const winValue = gridSize === 3 ? 512 : 2048;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="2048"
        description={gridSize === 3 ? "Мини-режим 3×3. Собери 512!" : "Соединяй плитки, собери 2048!"}
      />

      {/* Mode Selector */}
      <div className="flex gap-2 mb-4 justify-center">
        <button
          onClick={() => handleModeChange(4)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            gridSize === 4
              ? "bg-orange-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          4×4 Classic
        </button>
        <button
          onClick={() => handleModeChange(3)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            gridSize === 3
              ? "bg-purple-500 text-white"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          3×3 Mini
        </button>
      </div>

      {/* Счёт */}
      <div className="flex gap-4 mb-4">
        <div className="flex-1 bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-xs text-muted uppercase tracking-wide">Счёт</div>
          <div className={`text-2xl font-bold ${gridSize === 3 ? "text-purple-400" : "text-accent"}`}>{score}</div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-xl p-4 text-center">
          <div className="text-xs text-muted uppercase tracking-wide flex items-center justify-center gap-1">
            <Trophy size={12} />
            Лучший
          </div>
          <div className="text-2xl font-bold text-yellow-500">{currentBestScore}</div>
        </div>
        <button
          onClick={() => handleNewGame()}
          className={`px-4 rounded-xl transition-all flex items-center gap-2 ${
            gridSize === 3
              ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
          }`}
        >
          <RotateCcw size={18} />
          <span className="hidden sm:inline">Новая</span>
        </button>
      </div>

      {/* Игровое поле */}
      <div className="relative" ref={gameAreaRef}>
        <div
          className={`grid gap-2 p-3 rounded-2xl ${gridSize === 3 ? "bg-purple-900/30" : "bg-slate-700/50"}`}
          style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
        >
          {/* Фоновые ячейки */}
          {Array(gridSize * gridSize).fill(null).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg ${gridSize === 3 ? "bg-purple-800/30" : "bg-slate-600/50"}`}
            />
          ))}
        </div>

        {/* Плитки */}
        {isClient && (
          <div className="absolute inset-3">
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {grid.flat().map((tile, i) => {
                const row = Math.floor(i / gridSize);
                const col = i % gridSize;

                if (!tile) return <div key={`empty-${row}-${col}`} className="aspect-square" />;

                const style = getTileStyle(tile.value);
                const fontSize = getFontSize(tile.value, gridSize);

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
          <div className="absolute inset-0 bg-black/80 rounded-2xl flex flex-col items-center justify-center p-4 overflow-y-auto">
            <div className="text-3xl font-bold text-white mb-2">Игра окончена!</div>
            <div className="text-xl text-gray-300 mb-4">
              Счёт: <span className={`font-bold ${gridSize === 3 ? "text-purple-400" : "text-orange-400"}`}>{score}</span>
              {" · "}
              Макс: <span className="text-yellow-400 font-bold">{getMaxTile(grid)}</span>
            </div>

            {/* Форма сохранения (для авторизованных) */}
            {score > 0 && !scoreSubmitted && authUser && (
              <div className="bg-gray-800/90 rounded-lg p-4 mb-4 w-full max-w-xs">
                <h3 className="text-sm text-gray-400 text-center mb-3">Сохранить результат</h3>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={playerName}
                  onChange={(e) => setPlayerNameState(e.target.value)}
                  maxLength={20}
                  className={`w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none mb-3 ${
                    gridSize === 3 ? "focus:border-purple-500" : "focus:border-orange-500"
                  }`}
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || scoreSubmitting}
                  className={`w-full px-4 py-2 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors ${
                    gridSize === 3
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {scoreSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            )}

            {/* Приглашение войти (для неавторизованных) */}
            {score > 0 && !scoreSubmitted && !authUser && (
              <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4 mb-4 w-full max-w-xs">
                <p className="text-sm text-amber-400 mb-3 text-center">
                  Войдите, чтобы сохранить результат в рейтинг
                </p>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={playerName}
                  onChange={(e) => setPlayerNameState(e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 mb-3"
                />
                <button
                  onClick={() => {
                    if (!playerName.trim()) return;
                    setPlayer2048Name(playerName.trim());
                    savePending2048Result(score, getMaxTile(grid), playerName.trim(), gridSize);
                    signIn();
                  }}
                  disabled={!playerName.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg text-gray-900 font-medium transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </button>
              </div>
            )}

            {/* Подтверждение сохранения */}
            {scoreSubmitted && (
              <div className="bg-green-800/50 border border-green-600 rounded-lg p-3 mb-4 text-center">
                <p className="text-green-400">
                  {isNewRecord ? "Новый рекорд сохранён!" : "Результат сохранён!"}
                </p>
              </div>
            )}

            <button
              onClick={() => handleNewGame()}
              className={`px-6 py-3 rounded-xl text-white font-bold transition-all flex items-center gap-2 ${
                gridSize === 3
                  ? "bg-purple-500 hover:bg-purple-600"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              <RotateCcw size={18} />
              Играть снова
            </button>
          </div>
        )}

        {/* Win */}
        {won && !gameOver && (
          <div className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center animate-fade-in ${
            gridSize === 3 ? "bg-purple-500/80" : "bg-yellow-500/80"
          }`}>
            <div className="text-4xl font-bold text-white mb-2">{winValue}!</div>
            <div className="text-white/80 mb-4">Поздравляем!</div>
            <div className="flex gap-2">
              <button
                onClick={() => { setWon(false); setKeepPlaying(true); }}
                className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold hover:bg-white/30 transition-all"
              >
                Продолжить
              </button>
              <button
                onClick={() => handleNewGame()}
                className={`px-4 py-2 rounded-xl bg-white font-bold hover:bg-white/90 transition-all ${
                  gridSize === 3 ? "text-purple-600" : "text-yellow-600"
                }`}
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

      {/* Leaderboard */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Trophy className={`w-5 h-5 ${gridSize === 3 ? "text-purple-400" : "text-yellow-400"}`} />
            Таблица лидеров
          </h2>
          <button
            onClick={fetchAllLeaderboards}
            disabled={leaderboardLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 ${leaderboardLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className={`border rounded-lg overflow-hidden ${
          gridSize === 3
            ? "bg-purple-900/20 border-purple-700/50"
            : "bg-gray-800/50 border-gray-700"
        }`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${gridSize === 3 ? "border-purple-700/50" : "border-gray-700"}`}>
                <th className="w-10 text-center p-2 text-gray-400 font-medium">#</th>
                <th className="text-left p-2 text-gray-400 font-medium">Игрок</th>
                <th className="text-center p-2 text-gray-400 font-medium">Очки</th>
                <th className="text-center p-2 text-gray-400 font-medium">Макс.</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Загрузка...
                  </td>
                </tr>
              ) : currentLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Пока нет результатов. Будьте первым!
                  </td>
                </tr>
              ) : (
                currentLeaderboard.map((entry, index) => {
                  const position = index + 1;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b last:border-0 hover:bg-gray-700/30 ${
                        gridSize === 3 ? "border-purple-700/30" : "border-gray-700/50"
                      } ${
                        playerId === entry.player_id
                          ? gridSize === 3 ? "bg-purple-500/10" : "bg-orange-500/10"
                          : ""
                      }`}
                    >
                      <td className="w-10 text-center p-2 text-base">
                        {position === 1 && "🥇"}
                        {position === 2 && "🥈"}
                        {position === 3 && "🥉"}
                        {position > 3 && <span className="text-gray-500">{position}</span>}
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-white truncate">{entry.name}</span>
                        </div>
                      </td>
                      <td className={`p-2 text-center font-bold ${gridSize === 3 ? "text-purple-400" : "text-orange-400"}`}>
                        {entry.score.toLocaleString()}
                      </td>
                      <td className="p-2 text-center font-bold text-yellow-400">
                        {entry.max_tile}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Уведомление о сохранении pending result */}
      {pendingResultMessage && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-semibold text-sm shadow-lg"
          style={{
            background: pendingResultMessage.includes('Ошибка')
              ? 'rgba(255, 59, 77, 0.95)'
              : 'rgba(46, 204, 113, 0.95)',
            color: '#fff',
          }}
        >
          {pendingResultMessage}
        </div>
      )}

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
