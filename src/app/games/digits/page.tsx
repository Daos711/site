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
  cleanupPopups,
  TILE_COLORS,
  BOARD_SIZE,
  getTileRGB,
  getArrowPositions,
  startMoveTile,
  finishMoveTile,
  Direction,
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

  // Очистка старых попапов
  useEffect(() => {
    if (!game || game.popups.length === 0) return;

    const interval = setInterval(() => {
      setGame((prev) => (prev ? cleanupPopups(prev) : prev));
    }, 100);

    return () => clearInterval(interval);
  }, [game?.popups.length]);

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

  const handleArrowClick = useCallback((direction: Direction) => {
    if (isPaused) return;
    setGame((prev) => {
      if (!prev || !prev.selectedTile || prev.movingTile) return prev;
      return startMoveTile(prev, prev.selectedTile, direction);
    });
  }, [isPaused]);

  // Счётчик для перерисовки анимации движения
  const [, forceUpdate] = useState(0);

  // Анимация движения плитки
  useEffect(() => {
    if (!game?.movingTile) return;

    const { startTime, duration } = game.movingTile;
    let animationId: number;

    const animate = () => {
      const elapsed = Date.now() - startTime;

      if (elapsed >= duration) {
        // Анимация закончилась
        setGame((prev) => (prev ? finishMoveTile(prev) : prev));
        return;
      }

      // Перерисовываем для обновления позиции
      forceUpdate((n) => n + 1);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [game?.movingTile?.startTime]);

  // Позиции стрелок для выбранной плитки (не показывать если есть движущаяся)
  const arrowPositions = (game?.selectedTile && !game?.movingTile)
    ? getArrowPositions(game.board, game.selectedTile)
    : [];

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  if (!game) return null;

  const isPlaying = game.gameStatus === "playing";
  const isFilling = game.gameStatus === "filling";

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Математический фон */}
      <div
        className="fixed inset-0 pointer-events-none select-none overflow-hidden"
        style={{
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
        }}
      >
        {/* Математические символы на фоне */}
        <div
          className="absolute inset-0 opacity-10 text-blue-300"
          style={{
            fontFamily: "monospace",
            fontSize: "14px",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
            padding: "20px",
          }}
        >
          {`∑ ∫ π √ ∞ ≈ ± × ÷ = ≠ < > ≤ ≥ α β γ δ ε θ λ μ σ φ ω Δ Σ Π
f(x) = ax² + bx + c    lim x→∞    d/dx    ∂/∂x    ∇·F    ∮
E = mc²    F = ma    PV = nRT    ∫₀^∞ e^(-x²) dx = √π/2
sin²θ + cos²θ = 1    e^(iπ) + 1 = 0    ∑(n=1→∞) 1/n²  = π²/6
∂²u/∂t² = c²∇²u    det(A) = ∑ sgn(σ)∏aᵢσ(ᵢ)    rank(A) ≤ min(m,n)
∫∫∫ ρ dV    curl F = ∇×F    div F = ∇·F    grad f = ∇f
λ₁ + λ₂ + ... + λₙ = tr(A)    Ax = λx    ||v|| = √(v·v)
P(A|B) = P(B|A)P(A)/P(B)    σ² = E[(X-μ)²]    z = (x-μ)/σ`.repeat(15)}
        </div>
      </div>

      {/* Клетчатый фон поверх */}
      <div
        className="relative"
        style={{
          background: "white",
          backgroundImage: `
            linear-gradient(rgb(218, 236, 241) 1px, transparent 1px),
            linear-gradient(90deg, rgb(218, 236, 241) 1px, transparent 1px)
          `,
          backgroundSize: "18px 18px",
          minHeight: "100vh",
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
              {/* Игровое поле - диагональные линии 60° от горизонтали */}
              {/* Пропорции: STRIPE_SPACING/TILE = 8/64 = 12.5%, при tile=48 → spacing=6 */}
              <div
                style={{
                  position: "relative",
                  background: "rgb(252, 250, 248)",
                  backgroundImage: `repeating-linear-gradient(
                    -60deg,
                    transparent,
                    transparent 5px,
                    rgb(240, 238, 235) 5px,
                    rgb(240, 238, 235) 6px
                  )`,
                  width: "502px",
                  height: "502px",
                  display: "grid",
                  gridTemplateColumns: "repeat(10, 48px)",
                  gridTemplateRows: "repeat(10, 48px)",
                  gap: "2px",
                  padding: "2px",
                  boxSizing: "border-box",
                }}
              >
                {game.board.flat().map((tile, index) => {
                  const row = Math.floor(index / BOARD_SIZE);
                  const col = index % BOARD_SIZE;

                  // Проверяем есть ли стрелка в этой ячейке
                  const arrow = arrowPositions.find(a => a.row === row && a.col === col);

                  if (!tile || !tile.visible) {
                    // Пустая ячейка - может содержать стрелку
                    if (arrow) {
                      // Рендерим стрелку
                      const rotation = {
                        right: 0,
                        down: 90,
                        left: 180,
                        up: 270,
                      }[arrow.direction];

                      return (
                        <button
                          key={`arrow-${row}-${col}`}
                          onClick={() => handleArrowClick(arrow.direction)}
                          className="flex items-center justify-center cursor-pointer"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: 0,
                          }}
                        >
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 65 65"
                            style={{ transform: `rotate(${rotation}deg)` }}
                          >
                            {/* Стрелка: серая обводка → белая обводка → синяя заливка */}
                            <polygon
                              points="20,38 40,38 40,43 49,32 40,21 40,26 20,26"
                              fill="rgb(94, 150, 233)"
                              stroke="rgb(173, 179, 179)"
                              strokeWidth="7"
                              strokeLinejoin="round"
                            />
                            <polygon
                              points="20,38 40,38 40,43 49,32 40,21 40,26 20,26"
                              fill="rgb(94, 150, 233)"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinejoin="round"
                            />
                            <polygon
                              points="20,38 40,38 40,43 49,32 40,21 40,26 20,26"
                              fill="rgb(94, 150, 233)"
                            />
                          </svg>
                        </button>
                      );
                    }

                    // Обычная пустая ячейка
                    return (
                      <div
                        key={`empty-${row}-${col}`}
                        style={{ background: "transparent" }}
                      />
                    );
                  }

                  const isSelected = game.selectedTile?.id === tile.id;
                  const isHighlighted = highlightedTiles.has(tile.id);
                  const bgColor = isSelected ? "rgb(255, 139, 2)" : TILE_COLORS[tile.number];
                  const textColor = isSelected ? "rgb(255, 255, 202)" : "black";
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
                        fontFamily: "'Open Sans', system-ui, sans-serif",
                        fontWeight: 400,
                        fontSize: "30px",
                        border: "1px solid rgb(71, 74, 72)",
                        boxShadow: `inset -2px -2px 0 ${darkColor}`,
                        transition: "none", // мгновенное выделение
                      }}
                    >
                      {tile.number}
                    </button>
                  );
                })}

                {/* Движущаяся плитка */}
                {game.movingTile && (() => {
                  const { tile, fromRow, fromCol, toRow, toCol, startTime, duration } = game.movingTile;
                  const now = Date.now();
                  const elapsed = now - startTime;
                  const progress = Math.min(1, elapsed / duration);

                  // Линейная интерполяция позиции
                  const currentRow = fromRow + (toRow - fromRow) * progress;
                  const currentCol = fromCol + (toCol - fromCol) * progress;

                  // Позиция в пикселях (padding 2px, cell 48px + gap 2px = 50px)
                  const x = 2 + currentCol * 50;
                  const y = 2 + currentRow * 50;

                  const baseColor = getTileRGB(tile.number);
                  const darkColor = `rgb(${Math.floor(baseColor[0] * 0.4)}, ${Math.floor(baseColor[1] * 0.4)}, ${Math.floor(baseColor[2] * 0.4)})`;

                  return (
                    <div
                      className="absolute pointer-events-none flex items-center justify-center"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        width: "48px",
                        height: "48px",
                        background: TILE_COLORS[tile.number],
                        color: "black",
                        fontFamily: "'Open Sans', system-ui, sans-serif",
                        fontWeight: 400,
                        fontSize: "30px",
                        border: "1px solid rgb(71, 74, 72)",
                        boxShadow: `inset -2px -2px 0 ${darkColor}`,
                        zIndex: 10,
                      }}
                    >
                      {tile.number}
                    </div>
                  );
                })()}

                {/* Попапы очков */}
                {game.popups.map((popup) => {
                  const now = Date.now();
                  const age = now - popup.createdAt;

                  // Попап не появился ещё
                  if (age < 0) return null;

                  // Быстрое затухание как в Python: fade_speed = 1.5 за кадр при 60fps
                  // 255 / 1.5 / 60 ≈ 2.8 секунды полное затухание
                  // Но когда все появились - ещё быстрее
                  // Для простоты: затухание за 400мс
                  const opacity = Math.max(0, 1 - age / 400);

                  if (opacity <= 0) return null;

                  // Позиция: центр ячейки
                  const x = 2 + popup.col * 50 + 24;
                  const y = 2 + popup.row * 50 + 24;

                  return (
                    <div
                      key={popup.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        transform: "translate(-50%, -50%)",
                        opacity,
                        color: "rgb(80, 80, 80)", // серый для ВСЕХ попапов
                        fontSize: "28px",
                        fontWeight: 400,
                        fontFamily: "Arial, sans-serif",
                        textShadow: "0 1px 2px rgba(255,255,255,0.8)",
                      }}
                    >
                      {popup.negative ? "-" : "+"}{popup.value}
                    </div>
                  );
                })}
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
    </div>
  );
}
