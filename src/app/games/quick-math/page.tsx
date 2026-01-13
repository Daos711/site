"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Trophy, Clock, Target, RefreshCw } from "lucide-react";

// Типы
interface Problem {
  a: number;
  b: number;
  operation: "+" | "-" | "×";
  correctAnswer: number;
  options: number[];
}

type GameState = "idle" | "playing" | "finished";

// PRNG на основе seed
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Генерация близких неправильных ответов
function generateWrongAnswers(correct: number, random: () => number): number[] {
  const wrong: Set<number> = new Set();
  const offsets = [-2, -1, 1, 2, -10, 10, -5, 5, 3, -3];

  // Перемешиваем офсеты
  const shuffledOffsets = shuffleArray(offsets, random);

  for (const offset of shuffledOffsets) {
    const val = correct + offset;
    if (val > 0 && val !== correct && !wrong.has(val)) {
      wrong.add(val);
    }
    if (wrong.size >= 3) break;
  }

  // Если не хватает, добавляем случайные
  while (wrong.size < 3) {
    const val = Math.max(1, correct + Math.floor(random() * 20) - 10);
    if (val !== correct && !wrong.has(val)) {
      wrong.add(val);
    }
  }

  return Array.from(wrong);
}

// Генерация примеров на основе seed
function generateProblems(seed: number): Problem[] {
  const random = seededRandom(seed);
  const problems: Problem[] = [];

  for (let i = 0; i < 20; i++) {
    const type = Math.floor(random() * 3); // 0: умножение, 1: сложение, 2: вычитание

    let a: number, b: number, operation: "+" | "-" | "×", correctAnswer: number;

    if (type === 0) {
      // Умножение до 10×10
      a = Math.floor(random() * 9) + 2; // 2-10
      b = Math.floor(random() * 9) + 2; // 2-10
      operation = "×";
      correctAnswer = a * b;
    } else if (type === 1) {
      // Сложение до 100
      a = Math.floor(random() * 50) + 10; // 10-59
      b = Math.floor(random() * 40) + 5;  // 5-44
      operation = "+";
      correctAnswer = a + b;
    } else {
      // Вычитание (результат положительный)
      a = Math.floor(random() * 50) + 30; // 30-79
      b = Math.floor(random() * 25) + 5;  // 5-29
      operation = "-";
      correctAnswer = a - b;
    }

    const wrongAnswers = generateWrongAnswers(correctAnswer, random);
    const options = shuffleArray([correctAnswer, ...wrongAnswers], random);

    problems.push({ a, b, operation, correctAnswer, options });
  }

  return problems;
}

// Получить seed из даты
function getDailySeed(): number {
  const now = new Date();
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// Форматирование времени
function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(1);
}

export default function QuickMathPage() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [bestTime, setBestTime] = useState<number | null>(null);

  const dailySeed = getDailySeed();
  const dateString = `${Math.floor(dailySeed / 10000)}.${String(Math.floor((dailySeed % 10000) / 100)).padStart(2, '0')}.${String(dailySeed % 100).padStart(2, '0')}`;

  // Загрузка лучшего результата
  useEffect(() => {
    const saved = localStorage.getItem(`quickmath-best-${dailySeed}`);
    if (saved) {
      setBestTime(parseFloat(saved));
    }
  }, [dailySeed]);

  // Таймер
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === "playing") {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  // Клавиатура
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === "playing" && ["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key) - 1;
        handleAnswer(index);
      }
      if (gameState === "idle" && e.key === "Enter") {
        startGame();
      }
      if (gameState === "finished" && e.key === "Enter") {
        startGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentIndex, problems]);

  const startGame = useCallback(() => {
    const newProblems = generateProblems(dailySeed);
    setProblems(newProblems);
    setCurrentIndex(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setPenalty(0);
    setCorrectCount(0);
    setFeedback(null);
    setGameState("playing");
  }, [dailySeed]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (gameState !== "playing" || feedback) return;

    const problem = problems[currentIndex];
    const selectedAnswer = problem.options[optionIndex];
    const isCorrect = selectedAnswer === problem.correctAnswer;

    if (isCorrect) {
      setCorrectCount(c => c + 1);
      setFeedback("correct");
    } else {
      setPenalty(p => p + 2000); // +2 секунды
      setFeedback("wrong");
    }

    // Переход к следующему примеру
    setTimeout(() => {
      setFeedback(null);
      if (currentIndex + 1 >= problems.length) {
        // Игра окончена
        const finalTime = Date.now() - startTime + penalty + (isCorrect ? 0 : 2000);
        setElapsedTime(finalTime - penalty - (isCorrect ? 0 : 2000));
        setGameState("finished");

        // Сохраняем лучший результат
        const totalTime = finalTime;
        if (!bestTime || totalTime < bestTime) {
          setBestTime(totalTime);
          localStorage.setItem(`quickmath-best-${dailySeed}`, totalTime.toString());
        }
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 300);
  }, [gameState, feedback, problems, currentIndex, startTime, penalty, bestTime, dailySeed]);

  const totalTime = elapsedTime + penalty;

  return (
    <div className="max-w-lg mx-auto">
      <PageHeader
        title="Quick Math"
        description="Математический тренажёр на скорость"
      />

      {/* Заголовок раунда */}
      <div className="text-center mb-4 text-sm text-muted">
        Раунд дня: {dateString}
      </div>

      {/* Стартовый экран */}
      {gameState === "idle" && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-6xl mb-4">🧮</div>
          <h2 className="text-2xl font-bold mb-2">Quick Math</h2>
          <p className="text-muted mb-6">
            20 примеров на скорость.<br />
            Все игроки решают одинаковые примеры!
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-amber-400 font-bold">Умножение</div>
              <div className="text-muted">до 10×10</div>
            </div>
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-blue-400 font-bold">Сложение</div>
              <div className="text-muted">до 100</div>
            </div>
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-purple-400 font-bold">Вычитание</div>
              <div className="text-muted">результат &gt; 0</div>
            </div>
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-red-400 font-bold">Штраф</div>
              <div className="text-muted">+2 сек за ошибку</div>
            </div>
          </div>

          {bestTime && (
            <div className="mb-4 text-sm">
              <span className="text-muted">Твой лучший сегодня: </span>
              <span className="text-green-400 font-bold">{formatTime(bestTime)} сек</span>
            </div>
          )}

          <button
            onClick={startGame}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-lg flex items-center justify-center gap-2 transition-all"
          >
            <Play size={24} />
            Начать
          </button>

          <div className="mt-4 text-xs text-muted">
            Enter или клик для старта · Клавиши 1-4 для ответа
          </div>
        </div>
      )}

      {/* Игровой экран */}
      {gameState === "playing" && problems.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          {/* Статистика */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-blue-400">
              <Clock size={18} />
              <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400">
              <Target size={18} />
              <span className="font-bold">{currentIndex + 1}/20</span>
            </div>
          </div>

          {/* Пример */}
          <div className={`
            text-center py-8 mb-6 rounded-xl transition-all duration-200
            ${feedback === "correct" ? "bg-green-500/20" : ""}
            ${feedback === "wrong" ? "bg-red-500/20" : ""}
            ${!feedback ? "bg-stone-800" : ""}
          `}>
            <div className="text-4xl sm:text-5xl font-bold">
              {problems[currentIndex].a}
              <span className="mx-3 text-amber-400">{problems[currentIndex].operation}</span>
              {problems[currentIndex].b}
              <span className="mx-3 text-muted">=</span>
              <span className="text-muted">?</span>
            </div>
          </div>

          {/* Варианты ответов */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {problems[currentIndex].options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={!!feedback}
                className={`
                  py-4 rounded-xl font-bold text-2xl transition-all
                  ${feedback && option === problems[currentIndex].correctAnswer
                    ? "bg-green-600 text-white"
                    : feedback && option !== problems[currentIndex].correctAnswer
                    ? "bg-stone-700 opacity-50"
                    : "bg-stone-700 hover:bg-stone-600 active:scale-95"
                  }
                `}
              >
                <span className="text-xs text-muted mr-2">{index + 1}</span>
                {option}
              </button>
            ))}
          </div>

          {/* Штраф */}
          {penalty > 0 && (
            <div className="text-center text-red-400 text-sm">
              Штраф: +{formatTime(penalty)} сек
            </div>
          )}
        </div>
      )}

      {/* Экран результата */}
      {gameState === "finished" && (
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-amber-400 mb-6">Раунд завершён!</h2>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-xs text-muted uppercase">Время</div>
              <div className="text-xl font-bold text-blue-400">{formatTime(elapsedTime)}</div>
            </div>
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-xs text-muted uppercase">Штраф</div>
              <div className="text-xl font-bold text-red-400">+{formatTime(penalty)}</div>
            </div>
            <div className="bg-stone-800 rounded-lg p-3">
              <div className="text-xs text-muted uppercase">Итого</div>
              <div className="text-xl font-bold text-amber-400">{formatTime(totalTime)}</div>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-muted">Правильно: </span>
            <span className={`font-bold ${correctCount === 20 ? "text-green-400" : "text-amber-400"}`}>
              {correctCount}/20
            </span>
            {correctCount === 20 && <span className="ml-2">🏆</span>}
          </div>

          {bestTime && totalTime <= bestTime && (
            <div className="mb-6 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <span className="text-green-400 font-bold">Новый рекорд дня!</span>
            </div>
          )}

          {/* Лидерборд (заглушка) */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className="text-amber-400" size={20} />
              <span className="font-bold">Рейтинг дня</span>
            </div>
            <div className="bg-stone-800 rounded-lg p-4 text-sm text-muted">
              Лидерборд будет добавлен позже
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-lg flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw size={20} />
            Играть снова
          </button>

          <div className="mt-4 text-xs text-muted">
            Enter для нового раунда
          </div>
        </div>
      )}
    </div>
  );
}
