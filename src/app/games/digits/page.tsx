"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  GameState,
  Tile,
  initGame,
  selectTile,
  spawnTile,
  tick,
  formatTime,
  canRemoveTiles,
  revealNextTile,
  TILE_COLORS,
  BOARD_SIZE,
} from "@/lib/digits-game";
import { getRandomPattern } from "@/lib/digits-patterns";
import { RotateCcw, Play, Pause, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DigitsGamePage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTiles, setHighlightedTiles] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<[number, number][]>([]);
  const [patternName, setPatternName] = useState("");

  // Инициализация игры
  const startNewGame = useCallback(() => {
    const { name, positions } = getRandomPattern();
    setPatternName(name);
    setPattern(positions as [number, number][]);
    setGame(initGame(positions as [number, number][]));
    setIsPaused(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Анимация заполнения поля
  useEffect(() => {
    if (!game || game.gameStatus !== "filling") return;

    const interval = setInterval(() => {
      setGame((prev) => {
        if (!prev) return prev;
        // Показываем по 3 плитки за раз для быстрой анимации
        let newState = prev;
        for (let i = 0; i < 3 && newState.gameStatus === "filling"; i++) {
          newState = revealNextTile(newState, pattern);
        }
        return newState;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [game?.gameStatus, pattern]);

  // Таймер
  useEffect(() => {
    if (!game || game.gameStatus !== "playing" || isPaused) return;

    const timer = setInterval(() => {
      setGame((prev) => (prev ? tick(prev) : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.gameStatus, isPaused]);

  // Спавн новых плиток
  useEffect(() => {
    if (!game || game.gameStatus !== "playing" || isPaused) return;

    if (game.spawnProgress >= 100) {
      setGame((prev) => (prev ? spawnTile(prev) : prev));
    }
  }, [game?.spawnProgress, game?.gameStatus, isPaused]);

  // Подсветка возможных ходов
  useEffect(() => {
    if (!game || !game.selectedTile) {
      setHighlightedTiles(new Set());
      return;
    }

    const highlighted = new Set<number>();
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const tile = game.board[row][col];
        if (tile && tile.visible && tile.id !== game.selectedTile.id) {
          if (canRemoveTiles(game.board, game.selectedTile, tile)) {
            highlighted.add(tile.id);
          }
        }
      }
    }
    setHighlightedTiles(highlighted);
  }, [game?.selectedTile, game?.board]);

  const handleTileClick = useCallback((tile: Tile) => {
    if (isPaused || !tile.visible) return;
    setGame((prev) => (prev ? selectTile(prev, tile) : prev));
  }, [isPaused]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  if (!game) return null;

  const isPlaying = game.gameStatus === "playing";
  const isFilling = game.gameStatus === "filling";

  return (
    <div className="min-h-screen" style={{ background: "rgb(252, 250, 248)" }}>
      {/* Диагональные полоски на фоне */}
      <div
        className="fixed inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: `repeating-linear-gradient(
            60deg,
            transparent,
            transparent 7px,
            rgb(240, 238, 235) 7px,
            rgb(240, 238, 235) 8px
          )`,
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 py-6">
        {/* Заголовок */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/games"
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
            style={{ color: "rgb(71, 74, 72)" }}
          >
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: "rgb(71, 74, 72)" }}>
            Цифры
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Игровое поле */}
          <div
            className="rounded-2xl p-3 shadow-lg"
            style={{
              background: "rgb(71, 74, 72)",
              border: "4px solid rgb(71, 74, 72)",
            }}
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                width: "min(500px, calc(100vw - 60px))",
                aspectRatio: "1",
              }}
            >
              {game.board.flat().map((tile, index) => {
                const row = Math.floor(index / BOARD_SIZE);
                const col = index % BOARD_SIZE;

                if (!tile || !tile.visible) {
                  return (
                    <div
                      key={`empty-${row}-${col}`}
                      className="rounded"
                      style={{ background: "rgb(200, 200, 200)", aspectRatio: "1" }}
                    />
                  );
                }

                const isSelected = game.selectedTile?.id === tile.id;
                const isHighlighted = highlightedTiles.has(tile.id);

                return (
                  <button
                    key={tile.id}
                    onClick={() => handleTileClick(tile)}
                    disabled={isPaused || isFilling}
                    className={`
                      rounded font-bold text-lg flex items-center justify-center
                      transition-all duration-150 shadow-sm
                      ${isSelected ? "scale-110 ring-4 ring-white shadow-lg z-10" : ""}
                      ${isHighlighted ? "ring-2 ring-green-500" : ""}
                      ${isPaused || isFilling ? "cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                    `}
                    style={{
                      background: TILE_COLORS[tile.number],
                      color: "rgb(71, 74, 72)",
                      aspectRatio: "1",
                      border: "2px solid rgb(71, 74, 72)",
                    }}
                  >
                    {tile.number}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Панель справа */}
          <div
            className="flex-1 rounded-2xl p-6 shadow-lg"
            style={{ background: "rgb(70, 130, 180)" }}
          >
            {/* Счёт */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-white">{game.score}</div>
              <div className="text-white/70 text-sm">Очки</div>
            </div>

            {/* Таймер */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold font-mono text-white">
                {formatTime(game.timeLeft)}
              </div>
              <div className="text-white/70 text-sm">Время</div>
            </div>

            {/* Плиток осталось */}
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-white">{game.tilesCount}</div>
              <div className="text-white/70 text-sm">Плиток</div>
            </div>

            {/* Полоса прогресса спавна */}
            {isPlaying && (
              <div className="mb-6">
                <div className="text-white/70 text-xs mb-1">Новая плитка через:</div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-1000"
                    style={{ width: `${game.spawnProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Кнопки управления */}
            <div className="flex justify-center gap-3">
              {isPlaying && (
                <button
                  onClick={togglePause}
                  className="p-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title={isPaused ? "Продолжить" : "Пауза"}
                >
                  {isPaused ? <Play size={24} /> : <Pause size={24} />}
                </button>
              )}
              <button
                onClick={startNewGame}
                className="p-3 rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Новая игра"
              >
                <RotateCcw size={24} />
              </button>
            </div>

            {/* Подсказка */}
            <div className="mt-6 text-center text-white/60 text-xs">
              <p>Убирай пары: одинаковые числа</p>
              <p>или сумма = 10</p>
            </div>
          </div>
        </div>

        {/* Оверлей паузы */}
        {isPaused && isPlaying && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-3xl font-bold mb-4" style={{ color: "rgb(71, 74, 72)" }}>
                Пауза
              </div>
              <button
                onClick={togglePause}
                className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
                style={{ background: "rgb(70, 130, 180)" }}
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Оверлей победы */}
        {game.gameStatus === "won" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-4xl font-bold mb-2 text-green-500">Победа!</div>
              <div className="text-2xl mb-4" style={{ color: "rgb(71, 74, 72)" }}>
                Очки: {game.score}
              </div>
              <div className="text-sm mb-6 text-gray-500">
                Осталось времени: {formatTime(game.timeLeft)}
              </div>
              <button
                onClick={startNewGame}
                className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
                style={{ background: "rgb(70, 130, 180)" }}
              >
                Играть снова
              </button>
            </div>
          </div>
        )}

        {/* Оверлей поражения */}
        {game.gameStatus === "lost" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center bg-white rounded-2xl p-8 shadow-2xl">
              <div className="text-4xl font-bold mb-2 text-red-500">Время вышло!</div>
              <div className="text-2xl mb-4" style={{ color: "rgb(71, 74, 72)" }}>
                Очки: {game.score}
              </div>
              <div className="text-sm mb-6 text-gray-500">
                Осталось плиток: {game.tilesCount}
              </div>
              <button
                onClick={startNewGame}
                className="px-6 py-3 rounded-xl font-medium text-white transition-colors"
                style={{ background: "rgb(70, 130, 180)" }}
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
