"use client";

import { useState, useEffect, useCallback } from "react";
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
  getTileRGB,
} from "@/lib/digits-game";
import { getRandomPattern } from "@/lib/digits-patterns";
import { RotateCcw, Play, Pause, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DigitsGamePage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTiles, setHighlightedTiles] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<[number, number][]>([]);

  // Инициализация игры
  const startNewGame = useCallback(() => {
    const { name, positions } = getRandomPattern();
    setPattern(positions as [number, number][]);
    setGame(initGame(positions as [number, number][]));
    setIsPaused(false);
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Анимация заполнения поля (25ms на 1 плитку как в оригинале)
  useEffect(() => {
    if (!game || game.gameStatus !== "filling") return;

    const interval = setInterval(() => {
      setGame((prev) => {
        if (!prev) return prev;
        return revealNextTile(prev, pattern);
      });
    }, 25);

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
    <div
      className="min-h-screen"
      style={{
        background: "white",
        // Клетчатый фон как в школьной тетради
        backgroundImage: `
          linear-gradient(rgb(218, 236, 241) 1px, transparent 1px),
          linear-gradient(90deg, rgb(218, 236, 241) 1px, transparent 1px)
        `,
        backgroundSize: "18px 18px",
      }}
    >
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

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Жёлтая рамка + игровое поле */}
          <div
            style={{
              border: "1px solid rgb(162, 140, 40)",
              padding: "8px",
              background: "rgb(247, 204, 74)",
            }}
          >
            <div style={{ border: "1px solid rgb(162, 140, 40)" }}>
              {/* Игровое поле - диагональные полосы 60° */}
              {/* Пропорции оригинала: tile=64, gap=3, всего 10*64 + 11*3 = 673 */}
              <div
                style={{
                  background: "rgb(252, 250, 248)",
                  backgroundImage: `repeating-linear-gradient(
                    120deg,
                    rgb(240, 238, 235),
                    rgb(240, 238, 235) 1px,
                    transparent 1px,
                    transparent 8px
                  )`,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                    gap: "2px",
                    padding: "2px", // gap по краям как в оригинале
                    width: "min(450px, calc(100vw - 120px))",
                    aspectRatio: "1",
                    boxSizing: "border-box",
                  }}
                >
                  {game.board.flat().map((tile, index) => {
                    const row = Math.floor(index / BOARD_SIZE);
                    const col = index % BOARD_SIZE;

                    if (!tile || !tile.visible) {
                      return (
                        <div
                          key={`empty-${row}-${col}`}
                          style={{
                            background: "rgb(252, 250, 248)",
                            aspectRatio: "1",
                          }}
                        />
                      );
                    }

                    const isSelected = game.selectedTile?.id === tile.id;
                    const isHighlighted = highlightedTiles.has(tile.id);

                    // Цвета как в оригинале: выделение = оранжевый фон + светлый текст
                    const bgColor = isSelected ? "rgb(255, 139, 2)" : TILE_COLORS[tile.number];
                    const textColor = isSelected ? "rgb(255, 255, 202)" : "black";

                    // Bevel эффект: тёмная грань (40% от цвета) снизу и справа
                    const baseColor = isSelected ? [255, 139, 2] : getTileRGB(tile.number);
                    const darkColor = `rgb(${Math.floor(baseColor[0] * 0.4)}, ${Math.floor(baseColor[1] * 0.4)}, ${Math.floor(baseColor[2] * 0.4)})`;

                    return (
                      <button
                        key={tile.id}
                        onClick={() => handleTileClick(tile)}
                        disabled={isPaused || isFilling}
                        className={`
                          flex items-center justify-center
                          ${isHighlighted ? "ring-2 ring-green-400" : ""}
                          ${isPaused || isFilling ? "cursor-not-allowed" : "cursor-pointer"}
                        `}
                        style={{
                          background: bgColor,
                          color: textColor,
                          aspectRatio: "1",
                          fontFamily: "'Open Sans', system-ui, sans-serif",
                          fontWeight: 400,
                          fontSize: "clamp(18px, 3.5vw, 32px)",
                          border: "1px solid rgb(71, 74, 72)",
                          boxShadow: `inset -2px -2px 0 ${darkColor}`,
                        }}
                      >
                        {tile.number}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Панель справа - синяя как в оригинале */}
          <div
            className="flex-1 p-5 min-w-[200px]"
            style={{ background: "rgb(62, 157, 203)" }}
          >
            {/* Счёт */}
            <div className="text-center mb-5">
              <div className="text-4xl font-bold text-white">{game.score}</div>
              <div className="text-white/80 text-sm">Очки</div>
            </div>

            {/* Таймер */}
            <div className="text-center mb-5">
              <div className="text-3xl font-bold font-mono text-white">
                {formatTime(game.timeLeft)}
              </div>
              <div className="text-white/80 text-sm">Время</div>
            </div>

            {/* Плиток осталось */}
            <div className="text-center mb-5">
              <div className="text-2xl font-bold text-white">{game.tilesCount}</div>
              <div className="text-white/80 text-sm">Плиток</div>
            </div>

            {/* Полоса прогресса спавна */}
            {isPlaying && (
              <div className="mb-5">
                <div className="text-white/80 text-xs mb-1">Новая плитка через:</div>
                <div className="h-3 bg-white/20 overflow-hidden">
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
                  className="p-3 bg-white/20 text-white hover:bg-white/30 transition-colors"
                  title={isPaused ? "Продолжить" : "Пауза"}
                >
                  {isPaused ? <Play size={22} /> : <Pause size={22} />}
                </button>
              )}
              <button
                onClick={startNewGame}
                className="p-3 bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Новая игра"
              >
                <RotateCcw size={22} />
              </button>
            </div>

            {/* Подсказка */}
            <div className="mt-5 text-center text-white/70 text-xs">
              <p>Убирай пары: одинаковые числа</p>
              <p>или сумма = 10</p>
            </div>
          </div>
        </div>

        {/* Оверлей паузы */}
        {isPaused && isPlaying && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center bg-white p-8 shadow-2xl">
              <div className="text-3xl font-bold mb-4" style={{ color: "rgb(71, 74, 72)" }}>
                Пауза
              </div>
              <button
                onClick={togglePause}
                className="px-6 py-3 font-medium text-white transition-colors"
                style={{ background: "rgb(62, 157, 203)" }}
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Оверлей победы */}
        {game.gameStatus === "won" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center bg-white p-8 shadow-2xl">
              <div className="text-4xl font-bold mb-2 text-green-500">Победа!</div>
              <div className="text-2xl mb-4" style={{ color: "rgb(71, 74, 72)" }}>
                Очки: {game.score}
              </div>
              <div className="text-sm mb-6 text-gray-500">
                Осталось времени: {formatTime(game.timeLeft)}
              </div>
              <button
                onClick={startNewGame}
                className="px-6 py-3 font-medium text-white transition-colors"
                style={{ background: "rgb(62, 157, 203)" }}
              >
                Играть снова
              </button>
            </div>
          </div>
        )}

        {/* Оверлей поражения */}
        {game.gameStatus === "lost" && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="text-center bg-white p-8 shadow-2xl">
              <div className="text-4xl font-bold mb-2 text-red-500">Время вышло!</div>
              <div className="text-2xl mb-4" style={{ color: "rgb(71, 74, 72)" }}>
                Очки: {game.score}
              </div>
              <div className="text-sm mb-6 text-gray-500">
                Осталось плиток: {game.tilesCount}
              </div>
              <button
                onClick={startNewGame}
                className="px-6 py-3 font-medium text-white transition-colors"
                style={{ background: "rgb(62, 157, 203)" }}
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
