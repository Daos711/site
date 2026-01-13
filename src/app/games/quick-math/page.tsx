"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Trophy, Clock, Target, User, Check, Lock } from "lucide-react";
// RefreshCw removed - no replay allowed
import { useAuth } from "@/components/AuthProvider";
import { signInWithGoogle } from "@/lib/supabase";
import {
  getQuickMathScores,
  submitQuickMathScore,
  getQuickMathPlayerName,
  setQuickMathPlayerName,
  QuickMathScoreEntry,
} from "@/lib/supabase";

// Типы
interface Problem {
  a: number;
  b: number;
  operation: "+" | "-" | "×";
  correctAnswer: number;
  options: number[];
}

type GameState = "idle" | "playing" | "finished";
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG = {
  easy: {
    label: "Лёгкий",
    color: "text-green-400",
    bgColor: "bg-green-600",
    hoverColor: "hover:bg-green-500",
    seedOffset: 0,
  },
  medium: {
    label: "Средний",
    color: "text-amber-400",
    bgColor: "bg-amber-600",
    hoverColor: "hover:bg-amber-500",
    seedOffset: 1000000,
  },
  hard: {
    label: "Сложный",
    color: "text-red-400",
    bgColor: "bg-red-600",
    hoverColor: "hover:bg-red-500",
    seedOffset: 2000000,
  },
};

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

// Генерация примеров на основе seed и сложности
function generateProblems(seed: number, difficulty: Difficulty): Problem[] {
  const random = seededRandom(seed + DIFFICULTY_CONFIG[difficulty].seedOffset);
  const problems: Problem[] = [];

  for (let i = 0; i < 20; i++) {
    const type = Math.floor(random() * 3); // 0: умножение, 1: сложение, 2: вычитание

    let a: number, b: number, operation: "+" | "-" | "×", correctAnswer: number;

    if (difficulty === "easy") {
      // Лёгкий: умножение до 10×10, простое сложение/вычитание
      if (type === 0) {
        a = Math.floor(random() * 9) + 2; // 2-10
        b = Math.floor(random() * 9) + 2; // 2-10
        operation = "×";
        correctAnswer = a * b;
      } else if (type === 1) {
        a = Math.floor(random() * 50) + 10; // 10-59
        b = Math.floor(random() * 40) + 5;  // 5-44
        operation = "+";
        correctAnswer = a + b;
      } else {
        a = Math.floor(random() * 50) + 30; // 30-79
        b = Math.floor(random() * 25) + 5;  // 5-29
        operation = "-";
        correctAnswer = a - b;
      }
    } else if (difficulty === "medium") {
      // Средний: умножение до 12×12, двузначные числа до 99
      if (type === 0) {
        a = Math.floor(random() * 11) + 2; // 2-12
        b = Math.floor(random() * 11) + 2; // 2-12
        operation = "×";
        correctAnswer = a * b;
      } else if (type === 1) {
        a = Math.floor(random() * 60) + 20; // 20-79
        b = Math.floor(random() * 50) + 20; // 20-69
        operation = "+";
        correctAnswer = a + b;
      } else {
        a = Math.floor(random() * 40) + 50; // 50-89
        b = Math.floor(random() * 35) + 15; // 15-49
        operation = "-";
        correctAnswer = a - b;
      }
    } else {
      // Сложный: умножение двузначных, трёхзначное сложение/вычитание
      if (type === 0) {
        // Умножение: одно двузначное × однозначное (11-19 × 2-9)
        a = Math.floor(random() * 9) + 11; // 11-19
        b = Math.floor(random() * 8) + 2;  // 2-9
        operation = "×";
        correctAnswer = a * b;
      } else if (type === 1) {
        // Сложение трёхзначных
        a = Math.floor(random() * 150) + 100; // 100-249
        b = Math.floor(random() * 150) + 50;  // 50-199
        operation = "+";
        correctAnswer = a + b;
      } else {
        // Вычитание трёхзначных
        a = Math.floor(random() * 200) + 200; // 200-399
        b = Math.floor(random() * 150) + 50;  // 50-199
        operation = "-";
        correctAnswer = a - b;
      }
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
  const { user, playerId } = useAuth();

  const [gameState, setGameState] = useState<GameState>("idle");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [bestTimes, setBestTimes] = useState<Record<Difficulty, number | null>>({
    easy: null,
    medium: null,
    hard: null,
  });

  // Лидерборд
  const [leaderboard, setLeaderboard] = useState<QuickMathScoreEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [playerName, setPlayerNameState] = useState("");
  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // Отслеживаем сыгранные уровни сложности за день
  const [playedToday, setPlayedToday] = useState<Record<Difficulty, boolean>>({
    easy: false,
    medium: false,
    hard: false,
  });

  const dailySeed = getDailySeed();
  const dateString = `${Math.floor(dailySeed / 10000)}.${String(Math.floor((dailySeed % 10000) / 100)).padStart(2, '0')}.${String(dailySeed % 100).padStart(2, '0')}`;
  const config = DIFFICULTY_CONFIG[difficulty];

  // Загрузка имени игрока
  useEffect(() => {
    setPlayerNameState(getQuickMathPlayerName());
  }, []);

  // Загрузка лучших результатов и статуса сыгранных уровней
  useEffect(() => {
    const times: Record<Difficulty, number | null> = { easy: null, medium: null, hard: null };
    const played: Record<Difficulty, boolean> = { easy: false, medium: false, hard: false };

    (["easy", "medium", "hard"] as Difficulty[]).forEach((d) => {
      const saved = localStorage.getItem(`quickmath-best-${d}-${dailySeed}`);
      if (saved) {
        times[d] = parseFloat(saved);
      }
      // Проверяем, сыграл ли игрок этот уровень сегодня
      const playedKey = localStorage.getItem(`quickmath-played-${d}-${dailySeed}`);
      played[d] = playedKey === "true";
    });

    setBestTimes(times);
    setPlayedToday(played);
  }, [dailySeed]);

  // Загрузка лидерборда
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    const scores = await getQuickMathScores(difficulty, dailySeed, 10);
    setLeaderboard(scores);
    setLeaderboardLoading(false);
  }, [difficulty, dailySeed]);

  // Загружаем лидерборд при смене сложности или при загрузке страницы
  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

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
      // Запускаем только если уровень ещё не сыгран
      if (gameState === "idle" && e.key === "Enter" && !playedToday[difficulty]) {
        startGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, currentIndex, problems, playedToday, difficulty]);

  const startGame = useCallback(() => {
    const newProblems = generateProblems(dailySeed, difficulty);
    setProblems(newProblems);
    setCurrentIndex(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setPenalty(0);
    setCorrectCount(0);
    setFeedback(null);
    setGameState("playing");
  }, [dailySeed, difficulty]);

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
        const currentBest = bestTimes[difficulty];
        if (!currentBest || totalTime < currentBest) {
          setBestTimes(prev => ({ ...prev, [difficulty]: totalTime }));
          localStorage.setItem(`quickmath-best-${difficulty}-${dailySeed}`, totalTime.toString());
        }

        // Сохраняем pending score для отправки в лидерборд
        setPendingScore(totalTime);
        setScoreSubmitted(false);

        // Отмечаем уровень как сыгранный
        localStorage.setItem(`quickmath-played-${difficulty}-${dailySeed}`, "true");
        setPlayedToday(prev => ({ ...prev, [difficulty]: true }));

        // Обновляем лидерборд
        fetchLeaderboard();
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 300);
  }, [gameState, feedback, problems, currentIndex, startTime, penalty, bestTimes, difficulty, dailySeed, fetchLeaderboard]);

  const totalTime = elapsedTime + penalty;

  // Отправка результата
  const handleSubmitScore = async () => {
    if (!playerName.trim() || !playerId || pendingScore === null) return;

    setScoreSubmitting(true);
    setQuickMathPlayerName(playerName.trim());

    const result = await submitQuickMathScore(
      playerId,
      playerName.trim(),
      difficulty,
      dailySeed,
      pendingScore
    );

    setScoreSubmitting(false);
    if (result.success) {
      setScoreSubmitted(true);
      fetchLeaderboard();
    }
  };

  // Проверяем, есть ли игрок уже в лидерборде
  const playerInLeaderboard = playerId ? leaderboard.some(e => e.player_id === playerId) : false;

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
          <p className="text-muted mb-4">
            20 примеров на скорость.<br />
            Все игроки решают одинаковые примеры!
          </p>

          {/* Выбор сложности */}
          <div className="flex gap-2 mb-6">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`
                  flex-1 py-3 rounded-lg font-bold transition-all
                  ${difficulty === d
                    ? `${DIFFICULTY_CONFIG[d].bgColor} text-white`
                    : "bg-stone-800 hover:bg-stone-700"
                  }
                `}
              >
                <div className={difficulty === d ? "text-white" : DIFFICULTY_CONFIG[d].color}>
                  {DIFFICULTY_CONFIG[d].label}
                </div>
                {playedToday[d] ? (
                  <div className="text-xs opacity-75 mt-1 flex items-center justify-center gap-1">
                    <Check size={12} /> {formatTime(bestTimes[d]!)}с
                  </div>
                ) : bestTimes[d] ? (
                  <div className="text-xs opacity-75 mt-1">
                    🏆 {formatTime(bestTimes[d]!)}с
                  </div>
                ) : null}
              </button>
            ))}
          </div>

          {/* Описание сложности */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {difficulty === "easy" && (
              <>
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
                  <div className="text-muted">простое</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-red-400 font-bold">Штраф</div>
                  <div className="text-muted">+2 сек</div>
                </div>
              </>
            )}
            {difficulty === "medium" && (
              <>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-amber-400 font-bold">Умножение</div>
                  <div className="text-muted">до 12×12</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-blue-400 font-bold">Сложение</div>
                  <div className="text-muted">до 150</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-purple-400 font-bold">Вычитание</div>
                  <div className="text-muted">двузначные</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-red-400 font-bold">Штраф</div>
                  <div className="text-muted">+2 сек</div>
                </div>
              </>
            )}
            {difficulty === "hard" && (
              <>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-amber-400 font-bold">Умножение</div>
                  <div className="text-muted">11-19 × 2-9</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-blue-400 font-bold">Сложение</div>
                  <div className="text-muted">трёхзначные</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-purple-400 font-bold">Вычитание</div>
                  <div className="text-muted">трёхзначные</div>
                </div>
                <div className="bg-stone-800 rounded-lg p-3">
                  <div className="text-red-400 font-bold">Штраф</div>
                  <div className="text-muted">+2 сек</div>
                </div>
              </>
            )}
          </div>

          {playedToday[difficulty] ? (
            <>
              <div className="p-4 bg-stone-800 rounded-xl mb-4">
                <div className="flex items-center justify-center gap-2 text-muted mb-2">
                  <Lock size={18} />
                  <span className="font-bold">Уровень сыгран</span>
                </div>
                <p className="text-sm text-muted">
                  Ты уже прошёл этот уровень сегодня.<br />
                  Попробуй другой уровень или приходи завтра!
                </p>
              </div>

              {/* Показываем лидерборд на стартовом экране */}
              <div className="mb-4">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Trophy className={config.color} size={20} />
                  <span className="font-bold">Рейтинг дня ({config.label})</span>
                </div>
                {leaderboardLoading ? (
                  <div className="bg-stone-800 rounded-lg p-4 text-sm text-muted text-center">
                    Загрузка...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="bg-stone-800 rounded-lg p-4 text-sm text-muted text-center">
                    Пока никого нет
                  </div>
                ) : (
                  <div className="bg-stone-800 rounded-lg overflow-hidden">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div
                        key={entry.id}
                        className={`flex items-center px-3 py-2 text-sm ${
                          index > 0 ? "border-t border-stone-700" : ""
                        } ${entry.player_id === playerId ? "bg-amber-500/10" : ""}`}
                      >
                        <span className={`w-6 font-bold ${
                          index === 0 ? "text-amber-400" :
                          index === 1 ? "text-stone-300" :
                          index === 2 ? "text-amber-700" : "text-muted"
                        }`}>
                          {index + 1}
                        </span>
                        <span className="flex-1 truncate">{entry.name}</span>
                        <span className={`font-mono font-bold ${config.color}`}>
                          {formatTime(entry.time_ms)}с
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button
                onClick={startGame}
                className={`w-full py-4 rounded-xl ${config.bgColor} ${config.hoverColor} font-bold text-lg flex items-center justify-center gap-2 transition-all`}
              >
                <Play size={24} />
                Начать
              </button>

              <div className="mt-4 text-xs text-muted">
                Enter или клик для старта · Клавиши 1-4 для ответа
              </div>
            </>
          )}
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
          <h2 className={`text-2xl font-bold ${config.color} mb-2`}>Раунд завершён!</h2>
          <div className="text-sm text-muted mb-6">
            Уровень: <span className={`font-bold ${config.color}`}>{config.label}</span>
          </div>

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
              <div className={`text-xl font-bold ${config.color}`}>{formatTime(totalTime)}</div>
            </div>
          </div>

          <div className="mb-6">
            <span className="text-muted">Правильно: </span>
            <span className={`font-bold ${correctCount === 20 ? "text-green-400" : config.color}`}>
              {correctCount}/20
            </span>
            {correctCount === 20 && <span className="ml-2">🏆</span>}
          </div>

          {bestTimes[difficulty] && totalTime <= bestTimes[difficulty]! && (
            <div className="mb-6 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <span className="text-green-400 font-bold">Новый рекорд дня!</span>
            </div>
          )}

          {/* Форма отправки результата */}
          {pendingScore !== null && !scoreSubmitted && !playerInLeaderboard && (
            <div className="mb-6 p-4 bg-stone-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <User size={18} className="text-muted" />
                <span className="text-sm font-bold">Добавить в рейтинг</span>
              </div>

              {!user ? (
                // Требуем авторизацию
                <button
                  onClick={() => signInWithGoogle()}
                  className="w-full py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Войти через Google
                </button>
              ) : (
                // Форма ввода имени
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerNameState(e.target.value)}
                    placeholder="Твоё имя"
                    maxLength={20}
                    className="flex-1 px-3 py-2 bg-stone-700 border border-stone-600 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && playerName.trim()) {
                        handleSubmitScore();
                      }
                    }}
                  />
                  <button
                    onClick={handleSubmitScore}
                    disabled={!playerName.trim() || scoreSubmitting}
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
                      playerName.trim() && !scoreSubmitting
                        ? `${config.bgColor} ${config.hoverColor}`
                        : "bg-stone-600 text-stone-400 cursor-not-allowed"
                    }`}
                  >
                    {scoreSubmitting ? "..." : "OK"}
                  </button>
                </div>
              )}
            </div>
          )}

          {scoreSubmitted && (
            <div className="mb-6 p-3 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-center gap-2">
              <Check size={18} className="text-green-400" />
              <span className="text-green-400 font-bold">Результат сохранён!</span>
            </div>
          )}

          {/* Лидерборд */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy className={config.color} size={20} />
              <span className="font-bold">Рейтинг дня ({config.label})</span>
            </div>
            {leaderboardLoading ? (
              <div className="bg-stone-800 rounded-lg p-4 text-sm text-muted text-center">
                Загрузка...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="bg-stone-800 rounded-lg p-4 text-sm text-muted text-center">
                Пока никого нет. Будь первым!
              </div>
            ) : (
              <div className="bg-stone-800 rounded-lg overflow-hidden">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center px-3 py-2 text-sm ${
                      index > 0 ? "border-t border-stone-700" : ""
                    } ${entry.player_id === playerId ? "bg-amber-500/10" : ""}`}
                  >
                    <span className={`w-6 font-bold ${
                      index === 0 ? "text-amber-400" :
                      index === 1 ? "text-stone-300" :
                      index === 2 ? "text-amber-700" : "text-muted"
                    }`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 truncate">{entry.name}</span>
                    <span className={`font-mono font-bold ${config.color}`}>
                      {formatTime(entry.time_ms)}с
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Кнопка выбора другого уровня */}
          <button
            onClick={() => setGameState("idle")}
            className="w-full py-3 rounded-xl bg-stone-700 hover:bg-stone-600 font-bold transition-all"
          >
            Выбрать другой уровень
          </button>
        </div>
      )}
    </div>
  );
}
