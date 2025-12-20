"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  GameState,
  Tile,
  initGame,
  selectTile,
  spawnTile,
  tick,
  formatTime,
  canRemoveTiles,
} from "@/lib/digits-game";
import { RotateCcw, Play, Pause } from "lucide-react";

export default function DigitsGamePage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTiles, setHighlightedTiles] = useState<Set<number>>(new Set());

  // Инициализация игры
  useEffect(() => {
    setGame(initGame());
  }, []);

  // Таймер
  useEffect(() => {
    if (!game || game.gameStatus !== "playing" || isPaused) return;

    const timer = setInterval(() => {
      setGame((prev) => (prev ? tick(prev) : prev));
    }, 1000);

    return () => clearInterval(timer);
  }, [game?.gameStatus, isPaused]);

  // Спавн новых плиток каждые 10 секунд
  useEffect(() => {
    if (!game || game.gameStatus !== "playing" || isPaused) return;

    const spawner = setInterval(() => {
      setGame((prev) => (prev ? spawnTile(prev) : prev));
    }, 10000);

    return () => clearInterval(spawner);
  }, [game?.gameStatus, isPaused]);

  // Подсветка возможных ходов при выборе плитки
  useEffect(() => {
    if (!game || !game.selectedTile) {
      setHighlightedTiles(new Set());
      return;
    }

    const highlighted = new Set<number>();
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const tile = game.board[row][col];
        if (tile && tile.id !== game.selectedTile.id) {
          if (canRemoveTiles(game.board, game.selectedTile, tile)) {
            highlighted.add(tile.id);
          }
        }
      }
    }
    setHighlightedTiles(highlighted);
  }, [game?.selectedTile, game?.board]);

  const handleTileClick = useCallback((tile: Tile) => {
    if (isPaused) return;
    setGame((prev) => (prev ? selectTile(prev, tile) : prev));
  }, [isPaused]);

  const handleRestart = useCallback(() => {
    setGame(initGame());
    setIsPaused(false);
  }, []);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  if (!game) return null;

  return (
    <div>
      <PageHeader title="Цифры" description="Убирай пары: одинаковые числа или сумма 10" />

      {/* Панель управления */}
      <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{game.score}</div>
            <div className="text-xs text-muted">Очки</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold font-mono">{formatTime(game.timeLeft)}</div>
            <div className="text-xs text-muted">Время</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{game.tilesCount}</div>
            <div className="text-xs text-muted">Плиток</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {game.gameStatus === "playing" && (
            <button
              onClick={togglePause}
              className="p-2 rounded-lg bg-card-hover hover:bg-border transition-colors"
              title={isPaused ? "Продолжить" : "Пауза"}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
          )}
          <button
            onClick={handleRestart}
            className="p-2 rounded-lg bg-card-hover hover:bg-border transition-colors"
            title="Начать заново"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>

      {/* Игровое поле */}
      <div className="relative">
        <div
          className="grid gap-1 p-4 rounded-xl bg-card border border-border mx-auto"
          style={{
            gridTemplateColumns: "repeat(10, 1fr)",
            maxWidth: "500px",
            aspectRatio: "1",
          }}
        >
          {game.board.flat().map((tile, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;

            if (!tile) {
              return (
                <div
                  key={`empty-${row}-${col}`}
                  className="rounded bg-background/50"
                />
              );
            }

            const isSelected = game.selectedTile?.id === tile.id;
            const isHighlighted = highlightedTiles.has(tile.id);

            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                disabled={isPaused}
                className={`
                  rounded font-bold text-lg flex items-center justify-center
                  transition-all duration-150
                  ${isSelected
                    ? "bg-accent text-white scale-110 shadow-lg"
                    : isHighlighted
                    ? "bg-green-500/30 text-green-300 hover:bg-green-500/50"
                    : "bg-border text-foreground hover:bg-muted/50"
                  }
                  ${isPaused ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                `}
                style={{ aspectRatio: "1" }}
              >
                {tile.number}
              </button>
            );
          })}
        </div>

        {/* Оверлей паузы */}
        {isPaused && game.gameStatus === "playing" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">Пауза</div>
              <button
                onClick={togglePause}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Продолжить
              </button>
            </div>
          </div>
        )}

        {/* Оверлей победы */}
        {game.gameStatus === "won" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-green-400">Победа!</div>
              <div className="text-xl mb-4">Очки: {game.score}</div>
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Играть снова
              </button>
            </div>
          </div>
        )}

        {/* Оверлей поражения */}
        {game.gameStatus === "lost" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-xl">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2 text-red-400">Время вышло!</div>
              <div className="text-xl mb-4">Очки: {game.score}</div>
              <button
                onClick={handleRestart}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
              >
                Попробовать снова
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Подсказка */}
      <div className="mt-6 text-center text-sm text-muted">
        <p>Убирай пары плиток с одинаковыми числами или суммой 10</p>
        <p>Плитки должны быть на одной линии без преград между ними</p>
      </div>
    </div>
  );
}
