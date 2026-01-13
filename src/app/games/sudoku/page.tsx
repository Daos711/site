"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { RotateCcw, Lightbulb, Check, Clock, Sparkles } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";
type Cell = {
  value: number | null;
  isFixed: boolean;
  isError: boolean;
  notes: Set<number>;
};

// Генерация решённого судоку
function generateSolvedGrid(): number[][] {
  const grid: number[][] = Array(9).fill(null).map(() => Array(9).fill(0));

  function isValid(grid: number[][], row: number, col: number, num: number): boolean {
    // Проверка строки
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }
    // Проверка столбца
    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }
    // Проверка блока 3x3
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) return false;
      }
    }
    return true;
  }

  function solve(grid: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (grid[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(grid, row, col, num)) {
              grid[row][col] = num;
              if (solve(grid)) return true;
              grid[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(grid);
  return grid;
}

// Создание пазла из решения
function createPuzzle(solution: number[][], difficulty: Difficulty): Cell[][] {
  const cellsToRemove = {
    easy: 35,
    medium: 45,
    hard: 55,
  }[difficulty];

  const puzzle: Cell[][] = solution.map(row =>
    row.map(value => ({
      value,
      isFixed: true,
      isError: false,
      notes: new Set<number>(),
    }))
  );

  // Убираем клетки
  const positions: [number, number][] = [];
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      positions.push([i, j]);
    }
  }
  positions.sort(() => Math.random() - 0.5);

  for (let i = 0; i < cellsToRemove && i < positions.length; i++) {
    const [row, col] = positions[i];
    puzzle[row][col].value = null;
    puzzle[row][col].isFixed = false;
  }

  return puzzle;
}

// Проверка конфликтов для ячейки
function checkErrors(grid: Cell[][]): Cell[][] {
  const newGrid = grid.map(row =>
    row.map(cell => ({ ...cell, isError: false, notes: new Set(cell.notes) }))
  );

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = newGrid[row][col].value;
      if (value === null) continue;

      // Проверка строки
      for (let x = 0; x < 9; x++) {
        if (x !== col && newGrid[row][x].value === value) {
          newGrid[row][col].isError = true;
          newGrid[row][x].isError = true;
        }
      }
      // Проверка столбца
      for (let x = 0; x < 9; x++) {
        if (x !== row && newGrid[x][col].value === value) {
          newGrid[row][col].isError = true;
          newGrid[x][col].isError = true;
        }
      }
      // Проверка блока 3x3
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const r = startRow + i;
          const c = startCol + j;
          if ((r !== row || c !== col) && newGrid[r][c].value === value) {
            newGrid[row][col].isError = true;
            newGrid[r][c].isError = true;
          }
        }
      }
    }
  }

  return newGrid;
}

// Проверка победы
function checkWin(grid: Cell[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col].value === null || grid[row][col].isError) {
        return false;
      }
    }
  }
  return true;
}

export default function SudokuPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [grid, setGrid] = useState<Cell[][] | null>(null);
  const [solution, setSolution] = useState<number[][] | null>(null);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [won, setWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Генерация нового пазла
  const generateNewGame = useCallback((diff: Difficulty) => {
    const newSolution = generateSolvedGrid();
    const newPuzzle = createPuzzle(newSolution, diff);
    setSolution(newSolution);
    setGrid(newPuzzle);
    setSelectedCell(null);
    setWon(false);
    setTimer(0);
    setIsRunning(true);
    setHintsUsed(0);
  }, []);

  // Начальная генерация
  useEffect(() => {
    generateNewGame(difficulty);
  }, []);

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && !won) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, won]);

  // Ввод числа
  const handleInput = useCallback((num: number | null) => {
    if (!grid || !selectedCell || won) return;
    const [row, col] = selectedCell;
    if (grid[row][col].isFixed) return;

    const newGrid = grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newGrid[row][col].value = num;
    newGrid[row][col].notes.clear();

    const checkedGrid = checkErrors(newGrid);
    setGrid(checkedGrid);

    if (checkWin(checkedGrid)) {
      setWon(true);
      setIsRunning(false);
    }
  }, [grid, selectedCell, won]);

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || !grid) return;

      if (e.key >= "1" && e.key <= "9") {
        handleInput(parseInt(e.key));
      } else if (e.key === "Backspace" || e.key === "Delete" || e.key === "0") {
        handleInput(null);
      } else if (e.key === "ArrowUp" && selectedCell[0] > 0) {
        setSelectedCell([selectedCell[0] - 1, selectedCell[1]]);
      } else if (e.key === "ArrowDown" && selectedCell[0] < 8) {
        setSelectedCell([selectedCell[0] + 1, selectedCell[1]]);
      } else if (e.key === "ArrowLeft" && selectedCell[1] > 0) {
        setSelectedCell([selectedCell[0], selectedCell[1] - 1]);
      } else if (e.key === "ArrowRight" && selectedCell[1] < 8) {
        setSelectedCell([selectedCell[0], selectedCell[1] + 1]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCell, grid, handleInput]);

  // Подсказка
  const handleHint = () => {
    if (!grid || !solution || won) return;

    // Найти пустую или неправильную ячейку
    const emptyCells: [number, number][] = [];
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (!grid[i][j].isFixed && (grid[i][j].value === null || grid[i][j].isError)) {
          emptyCells.push([i, j]);
        }
      }
    }

    if (emptyCells.length === 0) return;

    const [row, col] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = grid.map(r => r.map(c => ({ ...c, notes: new Set(c.notes) })));
    newGrid[row][col].value = solution[row][col];
    newGrid[row][col].isFixed = true;

    const checkedGrid = checkErrors(newGrid);
    setGrid(checkedGrid);
    setHintsUsed(h => h + 1);
    setSelectedCell([row, col]);

    if (checkWin(checkedGrid)) {
      setWon(true);
      setIsRunning(false);
    }
  };

  // Форматирование времени
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Проверка связанных ячеек
  const isRelated = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    const [selRow, selCol] = selectedCell;
    return (
      row === selRow ||
      col === selCol ||
      (Math.floor(row / 3) === Math.floor(selRow / 3) &&
        Math.floor(col / 3) === Math.floor(selCol / 3))
    );
  };

  const isSameValue = (row: number, col: number): boolean => {
    if (!selectedCell || !grid) return false;
    const [selRow, selCol] = selectedCell;
    const selValue = grid[selRow][selCol].value;
    return selValue !== null && grid[row][col].value === selValue;
  };

  if (!grid) return null;

  const difficultyLabels = {
    easy: "Лёгкий",
    medium: "Средний",
    hard: "Сложный",
  };

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Судоку"
        description="Заполни сетку числами от 1 до 9"
      />

      {/* Выбор сложности */}
      <div className="flex gap-2 mb-4">
        {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => (
          <button
            key={diff}
            onClick={() => {
              setDifficulty(diff);
              generateNewGame(diff);
            }}
            className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all ${
              difficulty === diff
                ? "bg-blue-600 text-white"
                : "bg-card border border-border hover:bg-white/5"
            }`}
          >
            {difficultyLabels[diff]}
          </button>
        ))}
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Время</div>
          <div className="text-xl font-bold text-blue-400 flex items-center justify-center gap-1">
            <Clock size={16} />
            {formatTime(timer)}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Сложность</div>
          <div className="text-xl font-bold text-amber-400">{difficultyLabels[difficulty]}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <div className="text-xs text-muted uppercase">Подсказки</div>
          <div className="text-xl font-bold text-purple-400">{hintsUsed}</div>
        </div>
      </div>

      {/* Кнопки управления */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleHint}
          disabled={won}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          <Lightbulb size={18} />
          <span>Подсказка</span>
        </button>
        <button
          onClick={() => generateNewGame(difficulty)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 transition-all"
        >
          <RotateCcw size={18} />
          <span>Новая игра</span>
        </button>
      </div>

      {/* Игровое поле */}
      <div className="bg-stone-800 rounded-xl p-3 shadow-2xl mb-4">
        <div
          className="grid gap-0 border-2 border-stone-500 rounded overflow-hidden"
          style={{
            gridTemplateColumns: "repeat(9, 1fr)",
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex;
              const related = isRelated(rowIndex, colIndex);
              const sameValue = isSameValue(rowIndex, colIndex);

              // Толстые границы между блоками 3x3
              const borderRight = colIndex % 3 === 2 && colIndex < 8 ? "border-r-2 border-r-stone-500" : colIndex < 8 ? "border-r border-r-stone-700" : "";
              const borderBottom = rowIndex % 3 === 2 && rowIndex < 8 ? "border-b-2 border-b-stone-500" : rowIndex < 8 ? "border-b border-b-stone-700" : "";

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => setSelectedCell([rowIndex, colIndex])}
                  className={`
                    aspect-square flex items-center justify-center text-lg font-bold
                    transition-all duration-100
                    ${borderRight}
                    ${borderBottom}
                    ${isSelected ? "bg-blue-600" : sameValue ? "bg-blue-900/50" : related ? "bg-stone-700/50" : "bg-stone-800"}
                    ${cell.isError ? "text-red-400" : cell.isFixed ? "text-gray-300" : "text-blue-400"}
                    hover:bg-stone-700
                  `}
                  style={{ fontSize: "clamp(14px, 4vw, 24px)" }}
                >
                  {cell.value || ""}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Цифровая панель */}
      <div className="grid grid-cols-9 gap-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleInput(num)}
            disabled={won || !selectedCell || (selectedCell && grid[selectedCell[0]][selectedCell[1]].isFixed)}
            className="aspect-square flex items-center justify-center text-xl font-bold rounded-lg bg-card border border-border hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Кнопка стирания */}
      <button
        onClick={() => handleInput(null)}
        disabled={won || !selectedCell || (selectedCell && grid[selectedCell[0]][selectedCell[1]].isFixed)}
        className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium"
      >
        Стереть
      </button>

      {/* Инструкция */}
      <div className="mt-4 text-center text-xs text-muted">
        Клик для выбора ячейки · Цифры 1-9 для ввода · Backspace для стирания
      </div>

      {/* Модальное окно победы */}
      {won && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center animate-fade-in p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl text-center">
            <div className="text-5xl mb-3"><Sparkles className="w-16 h-16 mx-auto text-amber-400" /></div>
            <div className="text-2xl font-bold text-amber-400 mb-2">Судоку решён!</div>
            <div className="text-gray-300 mb-4">
              <div className="flex items-center justify-center gap-4">
                <div>
                  <span className="text-muted">Время:</span>{" "}
                  <span className="font-bold text-blue-400">{formatTime(timer)}</span>
                </div>
                <div>
                  <span className="text-muted">Подсказки:</span>{" "}
                  <span className="font-bold text-purple-400">{hintsUsed}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => generateNewGame(difficulty)}
              className="w-full px-4 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={18} />
              Новая игра
            </button>
          </div>
        </div>
      )}

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
