"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RotateCcw, Undo2, ChevronLeft, ChevronRight, Trophy, Lock, User, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  getSokobanScores,
  submitSokobanScore,
  getSokobanPlayerName,
  setSokobanPlayerName,
  SokobanScoreEntry,
} from "@/lib/supabase";

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
// norma - целевое количество ходов (хороший результат)
const LEVELS: { name: string; data: string; norma: number }[] = [
  // Уровень 1 - простейший (1 ящик, прямая линия)
  {
    name: "Старт",
    norma: 3,
    data: `
#####
#   #
#@$.#
#   #
#####
`
  },
  // Уровень 2 - поворот (минимум 8 ходов)
  {
    name: "Поворот",
    norma: 8,
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
    norma: 10,
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
    norma: 12,
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
    norma: 13,
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
  // Уровень 6 - три ящика (Microban #17, оптимум 25 ходов)
  {
    name: "Тройка",
    norma: 25,
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
    norma: 22,
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
    norma: 25,
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
    norma: 30,
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
    norma: 35,
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
  // Уровень 11 - Original Sokoban #1 (97 толчков, ~260-300 ходов оптимум)
  {
    name: "Оригинал",
    norma: 300,
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
    norma: 40,
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
    norma: 45,
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
    norma: 50,
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
    norma: 60,
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
const LEVELS_VERSION = 6;

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

  // Auth
  const { user: authUser, playerId, signIn } = useAuth();

  // Лидерборд
  const [leaderboard, setLeaderboard] = useState<SokobanScoreEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [playerName, setPlayerNameState] = useState("");
  const [pendingScore, setPendingScore] = useState<{ moves: number; pushes: number } | null>(null);
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

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

  // Загрузка имени игрока
  useEffect(() => {
    setPlayerNameState(getSokobanPlayerName());
  }, []);

  // Загрузка лидерборда при смене уровня
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    try {
      const scores = await getSokobanScores(currentLevel, 10);
      setLeaderboard(scores);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [currentLevel]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Отправка результата (для авторизованных пользователей)
  const handleSubmitScore = async () => {
    if (!pendingScore || !playerName.trim() || !authUser) return;

    setScoreSubmitting(true);
    const trimmedName = playerName.trim();
    setSokobanPlayerName(trimmedName);

    await submitSokobanScore(
      playerId,
      trimmedName,
      currentLevel,
      pendingScore.moves,
      pendingScore.pushes
    );

    setScoreSubmitting(false);
    setScoreSubmitted(true);
    fetchLeaderboard();
  };

  // Вход через Google с сохранением pending результата
  const handleSignInAndSave = () => {
    if (!pendingScore || !playerName.trim()) return;
    setSokobanPlayerName(playerName.trim());
    // Сохраняем pending результат в localStorage
    localStorage.setItem("sokoban-pending", JSON.stringify({
      level: currentLevel,
      moves: pendingScore.moves,
      pushes: pendingScore.pushes,
      name: playerName.trim(),
      timestamp: Date.now(),
    }));
    signIn();
  };

  // Проверка pending результата после авторизации
  useEffect(() => {
    if (!authUser || !playerId) return;

    const pendingRaw = localStorage.getItem("sokoban-pending");
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      // Проверяем что не устарело (5 минут)
      if (Date.now() - pending.timestamp > 5 * 60 * 1000) {
        localStorage.removeItem("sokoban-pending");
        return;
      }

      // Отправляем результат
      submitSokobanScore(playerId, pending.name, pending.level, pending.moves, pending.pushes)
        .then(() => {
          localStorage.removeItem("sokoban-pending");
          fetchLeaderboard();
        });
    } catch {
      localStorage.removeItem("sokoban-pending");
    }
  }, [authUser, playerId, fetchLeaderboard]);

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

      // Сохраняем лучший результат локально
      const currentBest = bestScores[currentLevel];
      if (!currentBest || newState.moves < currentBest.moves) {
        const newBest = { ...bestScores, [currentLevel]: { moves: newState.moves, pushes: newState.pushes } };
        setBestScores(newBest);
        localStorage.setItem("sokoban-best", JSON.stringify(newBest));
      }

      // Сохраняем pending результат для формы
      setPendingScore({ moves: newState.moves, pushes: newState.pushes });
      setScoreSubmitted(false);

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
  const levelNorma = LEVELS[currentLevel].norma;
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
          <div className="text-xs text-muted uppercase">Норма</div>
          <div className="text-xl font-bold text-amber-400">{levelNorma}</div>
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

      </div>

      {/* Модальное окно победы - фиксированное на весь экран */}
      {won && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl">
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <div className="text-2xl font-bold text-amber-400 mb-2">Уровень пройден!</div>
              <div className="text-gray-300 mb-1">
                {moves <= levelNorma ? (
                  <span className="text-green-400">Отлично! Уложился в норму ({moves}/{levelNorma})</span>
                ) : (
                  <span>Ходов: {moves} (норма: {levelNorma})</span>
                )}
              </div>
              <div className="text-sm text-gray-400 mb-4">
                Толчков: {pushes}
              </div>
            </div>

            {/* Форма сохранения для авторизованных */}
            {pendingScore && !scoreSubmitted && authUser && (
              <div className="bg-gray-800/90 rounded-lg p-4 mb-4">
                <h3 className="text-sm text-gray-400 text-center mb-3">Сохранить результат</h3>
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={playerName}
                  onChange={(e) => setPlayerNameState(e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 mb-3"
                />
                <button
                  onClick={handleSubmitScore}
                  disabled={!playerName.trim() || scoreSubmitting}
                  className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                >
                  {scoreSubmitting ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            )}

            {/* Приглашение войти (для неавторизованных) */}
            {pendingScore && !scoreSubmitted && !authUser && (
              <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4 mb-4">
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
                  onClick={handleSignInAndSave}
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
                <p className="text-green-400">Результат сохранён!</p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  initLevel(currentLevel);
                  setScoreSubmitted(false);
                  setPendingScore(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition-all"
              >
                Переиграть
              </button>
              {currentLevel < LEVELS.length - 1 && (
                <button
                  onClick={() => {
                    handleNextLevel();
                    setScoreSubmitted(false);
                    setPendingScore(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold transition-all"
                >
                  Дальше →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
            const isPar = best && best.moves <= level.norma;

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

      {/* Лидерборд текущего уровня */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Trophy className="w-5 h-5 text-blue-400" />
            Лидеры уровня {currentLevel + 1}
          </h2>
          <button
            onClick={fetchLeaderboard}
            disabled={leaderboardLoading}
            className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            title="Обновить"
          >
            <RefreshCw className={`w-4 h-4 ${leaderboardLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="w-10 text-center p-2 text-gray-400 font-medium">#</th>
                <th className="text-left p-2 text-gray-400 font-medium">Игрок</th>
                <th className="text-center p-2 text-gray-400 font-medium">Ходы</th>
                <th className="text-center p-2 text-gray-400 font-medium">Толчки</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardLoading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Загрузка...
                  </td>
                </tr>
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Пока нет результатов. Будьте первым!
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => {
                  const position = index + 1;
                  const isCurrentPlayer = playerId === entry.player_id;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b last:border-0 border-gray-700/50 hover:bg-gray-700/30 ${
                        isCurrentPlayer ? "bg-blue-500/10" : ""
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
                      <td className="p-2 text-center font-bold text-blue-400">
                        {entry.moves}
                      </td>
                      <td className="p-2 text-center font-bold text-purple-400">
                        {entry.pushes}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
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
