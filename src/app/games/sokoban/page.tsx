"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RotateCcw, Undo2, ChevronLeft, ChevronRight, Trophy, Lock } from "lucide-react";

// Типы клеток
type CellType = "floor" | "wall" | "goal" | "player" | "player_on_goal" | "box" | "box_on_goal";

interface Position {
  row: number;
  col: number;
}

interface GameState {
  grid: CellType[][];
  playerPos: Position;
  moves: number;
  pushes: number;
}

// Проверенные уровни Sokoban - гарантированно решаемы
// Формат: # стена, @ игрок, + игрок на цели, $ ящик, * ящик на цели, . цель, пробел - пол
const LEVELS: { name: string; data: string; par: number }[] = [
  // Уровень 1 - простейший (1 ящик, прямая линия)
  {
    name: "Старт",
    par: 3,
    data: `
#####
#   #
#@$.#
#   #
#####
`
  },
  // Уровень 2 - поворот
  {
    name: "Поворот",
    par: 6,
    data: `
######
#    #
# @$ #
# .# #
#    #
######
`
  },
  // Уровень 3 - два ящика
  {
    name: "Пара",
    par: 10,
    data: `
#######
#     #
# .$. #
#  $  #
#  @  #
#######
`
  },
  // Уровень 4 - угол
  {
    name: "Угол",
    par: 12,
    data: `
#####
#.  ##
#.@$ #
##$  #
 #   #
 #####
`
  },
  // Уровень 5 - коридор (Microban #9)
  {
    name: "Коридор",
    par: 13,
    data: `
#####
#.  ##
#@$$ #
##   #
 ##  #
  ##.#
   ###
`
  },
  // Уровень 6 - три ящика (Microban #17)
  {
    name: "Тройка",
    par: 17,
    data: `
#####
# @ #
#...#
#$$$##
#    #
#    #
######
`
  },
  // Уровень 7 - Classic 1
  {
    name: "Классика",
    par: 22,
    data: `
  #####
###   #
# $ # #
#  $$ #
#.@.# #
# ..  #
#######
`
  },
  // Уровень 8 - Microban #21
  {
    name: "Квартет",
    par: 25,
    data: `
####
#  ####
# . . #
# $$#@#
##    #
 ######
`
  },
  // Уровень 9 - L-образный (Microban #12)
  {
    name: "Уголок",
    par: 30,
    data: `
#####
#   ##
# $  #
## $ ####
 ###@.  #
  #  .# #
  #     #
  #######
`
  },
  // Уровень 10 - Microban #13
  {
    name: "Башня",
    par: 35,
    data: `
####
#. ##
#.@ #
#. $#
##$ ###
 # $  #
 #    #
 #  ###
 ####
`
  },
  // Уровень 11 - Original Sokoban #1
  {
    name: "Оригинал",
    par: 97,
    data: `
    #####
    #   #
    #$  #
  ###  $##
  #  $ $ #
### # ## #   ######
#   # ## #####  ..#
# $  $          ..#
##### ### #@##  ..#
    #     #########
    #######
`
  },
  // Уровень 12 - Microban #16
  {
    name: "Хранилище",
    par: 40,
    data: `
 ####
 #  ####
 #     ##
## ##   #
#. .# @$##
#   # $$ #
#  .#    #
##########
`
  },
  // Уровень 13 - Microban #18
  {
    name: "Колодец",
    par: 45,
    data: `
#######
#     #
#. .  #
# ## ##
#  $ #
###$ #
  #@ #
  #  #
  ####
`
  },
  // Уровень 14 - Microban #20
  {
    name: "Туннель",
    par: 50,
    data: `
#######
#     ###
#  @$$..#
#### ## #
  #     #
  #  ####
  #  #
  ####
`
  },
  // Уровень 15 - Microban #25
  {
    name: "Финал",
    par: 60,
    data: `
 ####
 #  ###
 # $$ #
##... #
#  @$ #
#   ###
#####
`
  },
];

// Версия набора уровней - при изменении уровней увеличить, чтобы сбросить прогресс
const LEVELS_VERSION = 3;

function parseLevel(levelData: string): { grid: CellType[][]; playerPos: Position } {
  const lines = levelData.trim().split("\n");
  const maxWidth = Math.max(...lines.map(l => l.length));

  const grid: CellType[][] = [];
  let playerPos: Position = { row: 0, col: 0 };

  for (let row = 0; row < lines.length; row++) {
    const gridRow: CellType[] = [];
    const line = lines[row].padEnd(maxWidth, " ");

    for (let col = 0; col < maxWidth; col++) {
      const char = line[col];
      switch (char) {
        case "#":
          gridRow.push("wall");
          break;
        case "@":
          gridRow.push("player");
          playerPos = { row, col };
          break;
        case "+":
          gridRow.push("player_on_goal");
          playerPos = { row, col };
          break;
        case "$":
          gridRow.push("box");
          break;
        case "*":
          gridRow.push("box_on_goal");
          break;
        case ".":
          gridRow.push("goal");
          break;
        default:
          gridRow.push("floor");
          break;
      }
    }
    grid.push(gridRow);
  }

  return { grid, playerPos };
}

function isWin(grid: CellType[][]): boolean {
  for (const row of grid) {
    for (const cell of row) {
      if (cell === "box" || cell === "goal" || cell === "player_on_goal") {
        // Есть ящик не на цели или пустая цель
        if (cell === "box") return false;
        if (cell === "goal") return false;
      }
    }
  }
  return true;
}

function cloneGrid(grid: CellType[][]): CellType[][] {
  return grid.map(row => [...row]);
}

export default function SokobanPage() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<GameState[]>([]);
  const [won, setWon] = useState(false);
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [bestScores, setBestScores] = useState<Record<number, { moves: number; pushes: number }>>({});
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Загрузка прогресса (с проверкой версии уровней)
  useEffect(() => {
    const savedVersion = localStorage.getItem("sokoban-version");

    // Если версия изменилась - сбрасываем прогресс
    if (savedVersion !== LEVELS_VERSION.toString()) {
      localStorage.setItem("sokoban-version", LEVELS_VERSION.toString());
      localStorage.removeItem("sokoban-unlocked");
      localStorage.removeItem("sokoban-best");
      return;
    }

    const savedUnlocked = localStorage.getItem("sokoban-unlocked");
    const savedBest = localStorage.getItem("sokoban-best");

    if (savedUnlocked) setUnlockedLevels(parseInt(savedUnlocked));
    if (savedBest) setBestScores(JSON.parse(savedBest));
  }, []);

  // Инициализация уровня
  const initLevel = useCallback((levelIndex: number) => {
    const { grid, playerPos } = parseLevel(LEVELS[levelIndex].data);
    setGameState({
      grid,
      playerPos,
      moves: 0,
      pushes: 0,
    });
    setHistory([]);
    setWon(false);
  }, []);

  useEffect(() => {
    initLevel(currentLevel);
  }, [currentLevel, initLevel]);

  // Движение
  const move = useCallback((dr: number, dc: number) => {
    if (!gameState || won) return;

    const { grid, playerPos, moves, pushes } = gameState;
    const newRow = playerPos.row + dr;
    const newCol = playerPos.col + dc;

    // Проверка границ
    if (newRow < 0 || newRow >= grid.length || newCol < 0 || newCol >= grid[0].length) {
      return;
    }

    const targetCell = grid[newRow][newCol];

    // Стена
    if (targetCell === "wall") return;

    const newGrid = cloneGrid(grid);
    let newPushes = pushes;

    // Ящик - пытаемся толкнуть
    if (targetCell === "box" || targetCell === "box_on_goal") {
      const boxNewRow = newRow + dr;
      const boxNewCol = newCol + dc;

      // Проверка куда толкаем ящик
      if (boxNewRow < 0 || boxNewRow >= grid.length || boxNewCol < 0 || boxNewCol >= grid[0].length) {
        return;
      }

      const boxTarget = grid[boxNewRow][boxNewCol];
      if (boxTarget === "wall" || boxTarget === "box" || boxTarget === "box_on_goal") {
        return;
      }

      // Перемещаем ящик
      newGrid[boxNewRow][boxNewCol] = boxTarget === "goal" ? "box_on_goal" : "box";
      newPushes++;
    }

    // Обновляем старую позицию игрока
    const oldCell = grid[playerPos.row][playerPos.col];
    newGrid[playerPos.row][playerPos.col] = (oldCell === "player_on_goal") ? "goal" : "floor";

    // Обновляем новую позицию игрока
    const newTargetWas = newGrid[newRow][newCol];
    newGrid[newRow][newCol] = (newTargetWas === "goal" || newTargetWas === "box_on_goal") ? "player_on_goal" : "player";

    // Сохраняем историю для undo
    setHistory(prev => [...prev, gameState]);

    const newState: GameState = {
      grid: newGrid,
      playerPos: { row: newRow, col: newCol },
      moves: moves + 1,
      pushes: newPushes,
    };

    setGameState(newState);

    // Проверка победы
    if (isWin(newGrid)) {
      setWon(true);

      // Сохраняем лучший результат
      const currentBest = bestScores[currentLevel];
      if (!currentBest || newState.moves < currentBest.moves) {
        const newBest = { ...bestScores, [currentLevel]: { moves: newState.moves, pushes: newState.pushes } };
        setBestScores(newBest);
        localStorage.setItem("sokoban-best", JSON.stringify(newBest));
      }

      // Разблокируем следующий уровень
      if (currentLevel + 1 < LEVELS.length && currentLevel + 1 >= unlockedLevels) {
        const newUnlocked = currentLevel + 2;
        setUnlockedLevels(newUnlocked);
        localStorage.setItem("sokoban-unlocked", newUnlocked.toString());
      }
    }
  }, [gameState, won, currentLevel, bestScores, unlockedLevels]);

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        switch (e.key) {
          case "ArrowUp": move(-1, 0); break;
          case "ArrowDown": move(1, 0); break;
          case "ArrowLeft": move(0, -1); break;
          case "ArrowRight": move(0, 1); break;
        }
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
      if (e.key === "r") {
        e.preventDefault();
        initLevel(currentLevel);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, currentLevel, initLevel]);

  // Свайпы
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
      e.preventDefault();
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      const minSwipe = 30;

      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipe) {
        move(0, dx > 0 ? 1 : -1);
      } else if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > minSwipe) {
        move(dy > 0 ? 1 : -1, 0);
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
  }, [move]);

  const handleUndo = () => {
    if (history.length > 0 && !won) {
      const prev = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setGameState(prev);
    }
  };

  const handleNextLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  const handlePrevLevel = () => {
    if (currentLevel > 0) {
      setCurrentLevel(currentLevel - 1);
    }
  };

  const selectLevel = (index: number) => {
    if (index < unlockedLevels) {
      setCurrentLevel(index);
    }
  };

  if (!gameState) return null;

  const { grid, moves, pushes } = gameState;
  const levelPar = LEVELS[currentLevel].par;
  const currentBest = bestScores[currentLevel];

  // Рассчёт размера ячейки
  const gridHeight = grid.length;
  const gridWidth = grid[0]?.length || 0;
  const maxCellSize = Math.min(
    Math.floor(350 / gridWidth),
    Math.floor(350 / gridHeight),
    48
  );
  const cellSize = Math.max(maxCellSize, 24);

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Сокобан"
        description="Толкай ящики на цели за минимум ходов!"
      />

      {/* Выбор уровня */}
      <div className="flex items-center justify-between mb-4 bg-card border border-border rounded-xl p-3">
        <button
          onClick={handlePrevLevel}
          disabled={currentLevel === 0}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center">
          <div className="text-xs text-muted uppercase tracking-wide">Уровень {currentLevel + 1}/{LEVELS.length}</div>
          <div className="font-bold text-amber-400">{LEVELS[currentLevel].name}</div>
        </div>

        <button
          onClick={handleNextLevel}
          disabled={currentLevel >= unlockedLevels - 1 || currentLevel === LEVELS.length - 1}
          className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Ходы</div>
          <div className="text-xl font-bold text-blue-400">{moves}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Толчки</div>
          <div className="text-xl font-bold text-purple-400">{pushes}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Пар</div>
          <div className="text-xl font-bold text-amber-400">{levelPar}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Лучший</div>
          <div className="text-xl font-bold text-green-400">{currentBest?.moves || "—"}</div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleUndo}
          disabled={history.length === 0 || won}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Undo2 size={18} />
          <span>Отмена</span>
        </button>
        <button
          onClick={() => initLevel(currentLevel)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 transition-all"
        >
          <RotateCcw size={18} />
          <span>Заново</span>
        </button>
      </div>

      {/* Игровое поле */}
      <div
        ref={gameAreaRef}
        className="relative flex justify-center"
      >
        <div
          className="relative bg-stone-800 rounded-xl p-2 shadow-2xl"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
            gap: "2px",
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  flex items-center justify-center rounded-sm transition-all duration-150
                  ${cell === "wall" ? "bg-stone-600" : "bg-stone-700/50"}
                  ${(cell === "goal" || cell === "player_on_goal" || cell === "box_on_goal") ? "bg-amber-900/30" : ""}
                `}
                style={{ width: cellSize, height: cellSize }}
              >
                {/* Цель */}
                {(cell === "goal" || cell === "player_on_goal" || cell === "box_on_goal") && (
                  <div className="absolute w-3 h-3 rounded-full bg-amber-500/40 border-2 border-amber-500/60" />
                )}

                {/* Игрок */}
                {(cell === "player" || cell === "player_on_goal") && (
                  <div
                    className="relative z-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg flex items-center justify-center transition-all duration-150"
                    style={{ width: cellSize * 0.7, height: cellSize * 0.7 }}
                  >
                    <div className="w-1/3 h-1/3 rounded-full bg-white/30" style={{ marginTop: "-20%", marginLeft: "-20%" }} />
                  </div>
                )}

                {/* Ящик */}
                {(cell === "box" || cell === "box_on_goal") && (
                  <div
                    className={`
                      relative z-10 rounded-md shadow-lg flex items-center justify-center transition-all duration-150
                      ${cell === "box_on_goal"
                        ? "bg-gradient-to-br from-green-400 to-green-600"
                        : "bg-gradient-to-br from-amber-500 to-amber-700"
                      }
                    `}
                    style={{ width: cellSize * 0.75, height: cellSize * 0.75 }}
                  >
                    <div className="absolute inset-1 border-2 border-white/20 rounded-sm" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Победа */}
        {won && (
          <div className="absolute inset-0 z-20 bg-black/80 rounded-xl flex flex-col items-center justify-center animate-fade-in">
            <div className="text-4xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-amber-400 mb-2">Уровень пройден!</div>
            <div className="text-gray-300 mb-4">
              {moves <= levelPar ? (
                <span className="text-green-400">Отлично! Уложился в пар ({moves}/{levelPar})</span>
              ) : (
                <span>Ходов: {moves} (пар: {levelPar})</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => initLevel(currentLevel)}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-all"
              >
                Переиграть
              </button>
              {currentLevel < LEVELS.length - 1 && (
                <button
                  onClick={handleNextLevel}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold transition-all"
                >
                  Дальше →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Инструкция */}
      <div className="mt-4 text-center text-xs text-muted">
        Стрелки или свайпы для движения · R — рестарт · Ctrl+Z — отмена
      </div>

      {/* Список уровней */}
      <div className="mt-6">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
          <Trophy className="w-5 h-5 text-amber-400" />
          Уровни
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {LEVELS.map((level, index) => {
            const isUnlocked = index < unlockedLevels;
            const best = bestScores[index];
            const isPar = best && best.moves <= level.par;

            return (
              <button
                key={index}
                onClick={() => selectLevel(index)}
                disabled={!isUnlocked}
                className={`
                  relative aspect-square rounded-lg flex flex-col items-center justify-center transition-all
                  ${currentLevel === index ? "ring-2 ring-amber-400" : ""}
                  ${isUnlocked
                    ? "bg-card border border-border hover:bg-white/10"
                    : "bg-gray-800/50 cursor-not-allowed"
                  }
                  ${isPar ? "bg-green-900/30 border-green-700" : ""}
                `}
              >
                {isUnlocked ? (
                  <>
                    <span className="text-lg font-bold">{index + 1}</span>
                    {best && (
                      <span className={`text-xs ${isPar ? "text-green-400" : "text-gray-400"}`}>
                        {best.moves}
                      </span>
                    )}
                  </>
                ) : (
                  <Lock size={16} className="text-gray-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
