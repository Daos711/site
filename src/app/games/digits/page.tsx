"use client";

import { useState, useEffect, useCallback, Suspense, useMemo } from "react";
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
  updateMovingTiles,
  getMovingTilePosition,
  isTileMoving,
  Direction,
  getSpawnBarProgress,
  updateSpawnBar,
} from "@/lib/digits-game";
import { getRandomPattern, getTestPattern } from "@/lib/digits-patterns";
import {
  SizePreset,
  SpeedPreset,
  DEFAULT_SIZE,
  DEFAULT_SPEED,
  getBoardDimensions,
  getMsPerCell,
} from "@/lib/digits-settings";
import { RotateCcw, Play, Pause, ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { StartMenu } from "./components/StartMenu";
import { ResultWindow } from "./components/ResultWindow";
import { SettingsWindow } from "./components/SettingsWindow";

type GameScreen = "menu" | "playing" | "result";

// Обёртка для страницы с Suspense (для useSearchParams)
export default function DigitsGamePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Загрузка...</div>}>
      <DigitsGamePage />
    </Suspense>
  );
}

function DigitsGamePage() {
  const searchParams = useSearchParams();
  const isTestMode = searchParams.get("test") === "true";

  const [screen, setScreen] = useState<GameScreen>("menu");
  const [game, setGame] = useState<GameState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightedTiles, setHighlightedTiles] = useState<Set<number>>(new Set());
  const [pattern, setPattern] = useState<[number, number][]>([]);

  // Настройки
  const [sizePreset, setSizePreset] = useState<SizePreset>(DEFAULT_SIZE);
  const [speedPreset, setSpeedPreset] = useState<SpeedPreset>(DEFAULT_SPEED);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingSizeChange, setPendingSizeChange] = useState<SizePreset | null>(null);

  // Рассчитываем размеры на основе настроек
  const dimensions = useMemo(() => getBoardDimensions(sizePreset), [sizePreset]);
  const msPerCell = useMemo(() => getMsPerCell(speedPreset, sizePreset), [speedPreset, sizePreset]);

  // Размеры для отрисовки
  const { tileSize, gap, tileAreaSize, panelWidth, frameWidth, bevel } = dimensions;
  const cellStep = tileSize + gap; // шаг между ячейками

  // Инициализация игры
  const startNewGame = useCallback(() => {
    const patternData = isTestMode ? getTestPattern() : getRandomPattern();
    const positions = patternData.positions as [number, number][];
    const numbers = 'numbers' in patternData ? (patternData.numbers as number[]) : undefined;
    setPattern(positions);
    setGame(initGame(positions, numbers));
    setIsPaused(false);
    setScreen("playing");
    setPendingSizeChange(null);
  }, [isTestMode]);

  const goToMenu = useCallback(() => {
    setScreen("menu");
    setGame(null);
  }, []);

  // Обработка изменения размера
  const handleSizeChange = useCallback((newSize: SizePreset) => {
    if (newSize !== sizePreset) {
      setPendingSizeChange(newSize);
    }
  }, [sizePreset]);

  // Закрытие настроек
  const handleCloseSettings = useCallback(() => {
    setShowSettings(false);
    if (pendingSizeChange) {
      // Размер изменился - нужен перезапуск игры
      setSizePreset(pendingSizeChange);
      setPendingSizeChange(null);
      if (game) {
        // Перезапускаем игру с новым размером
        startNewGame();
      }
    }
  }, [pendingSizeChange, game, startNewGame]);

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

  // Обновление прогресс-бара спавна и спавн плиток
  useEffect(() => {
    if (!game || game.gameStatus !== "playing" || isPaused || isTestMode) return;
    if (!game.spawnTimerRunning) return;

    let animationId: number;

    const updateBar = () => {
      const now = Date.now();

      setGame((prev) => {
        if (!prev || prev.gameStatus !== "playing") return prev;

        const { state: newState, shouldSpawn } = updateSpawnBar(prev, now);

        if (shouldSpawn) {
          // Пора спавнить
          return spawnTile(newState);
        }

        // Если фаза изменилась, обновляем состояние
        if (newState.spawnBarPhase !== prev.spawnBarPhase ||
            newState.spawnBarPhaseStart !== prev.spawnBarPhaseStart) {
          return newState;
        }

        return prev;
      });

      animationId = requestAnimationFrame(updateBar);
    };

    animationId = requestAnimationFrame(updateBar);
    return () => cancelAnimationFrame(animationId);
  }, [game?.spawnTimerRunning, game?.gameStatus, isPaused, isTestMode]);

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
          if (canRemoveTiles(game.board, game.selectedTile, tile, game.movingTiles)) {
            highlighted.add(tile.id);
          }
        }
      }
    }
    setHighlightedTiles(highlighted);
  }, [game?.selectedTile, game?.board, game?.movingTiles]);

  const handleTileClick = useCallback((tileId: number, row: number, col: number) => {
    if (isPaused) return;
    setGame((prev) => {
      if (!prev) return prev;
      // Ищем актуальную плитку на доске по координатам
      const tile = prev.board[row][col];
      if (!tile || !tile.visible || tile.id !== tileId) return prev;
      return selectTile(prev, tile);
    });
  }, [isPaused]);

  const handleArrowClick = useCallback((direction: Direction) => {
    if (isPaused) return;
    setGame((prev) => {
      if (!prev || !prev.selectedTile) return prev;
      // Нельзя запустить плитку которая уже движется
      if (isTileMoving(prev, prev.selectedTile.id)) return prev;
      return startMoveTile(prev, prev.selectedTile, direction, msPerCell);
    });
  }, [isPaused, msPerCell]);

  // Счётчик для перерисовки анимаций
  const [, forceUpdate] = useState(0);

  // Анимация движения плиток, попапов и прогресс-бара спавна
  const movingTilesCount = game?.movingTiles?.length ?? 0;
  const popupsCount = game?.popups?.length ?? 0;
  const spawnTimerActive = game?.spawnTimerRunning ?? false;
  const currentGameStatus = game?.gameStatus ?? null;

  useEffect(() => {
    const hasMovingTiles = movingTilesCount > 0;
    const hasPopups = popupsCount > 0;
    const hasSpawnBar = spawnTimerActive && currentGameStatus === 'playing' && !isPaused;

    if (!hasMovingTiles && !hasPopups && !hasSpawnBar) return;

    let animationId: number;

    const animate = () => {
      // Обновляем состояние - завершаем плитки которые доехали
      setGame((prev) => {
        if (!prev) return prev;
        if (prev.movingTiles.length > 0) {
          return updateMovingTiles(prev);
        }
        return prev;
      });

      // Перерисовываем для обновления позиций, попапов и прогресс-бара
      forceUpdate((n) => n + 1);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [movingTilesCount, popupsCount, spawnTimerActive, currentGameStatus, isPaused]);

  // Позиции стрелок для выбранной плитки (динамически с учётом движущихся)
  const now = Date.now();
  const arrowPositions = (game?.selectedTile && !isTileMoving(game, game.selectedTile.id))
    ? getArrowPositions(game.board, game.selectedTile, game.movingTiles, now)
    : [];

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Стартовое меню
  if (screen === "menu") {
    return <StartMenu onStart={startNewGame} />;
  }

  if (!game) return null;

  const isPlaying = game.gameStatus === "playing";
  const isFilling = game.gameStatus === "filling";

  // Размер шрифта плитки пропорционально размеру
  const tileFontSize = Math.round(tileSize * 0.625); // ~40px при 64px плитке

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
              padding: `${Math.round(gap * 2.5)}px`,
              background: "rgb(247, 204, 74)",
            }}
          >
            <div style={{ border: "1px solid rgb(162, 140, 40)" }}>
              {/* Игровое поле - диагональные линии 60° от горизонтали */}
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
                  width: `${tileAreaSize}px`,
                  height: `${tileAreaSize}px`,
                  display: "grid",
                  gridTemplateColumns: `repeat(10, ${tileSize}px)`,
                  gridTemplateRows: `repeat(10, ${tileSize}px)`,
                  gap: `${gap}px`,
                  padding: `${gap}px`,
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
                            width={tileSize}
                            height={tileSize}
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
                      onClick={() => handleTileClick(tile.id, row, col)}
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
                        fontSize: `${tileFontSize}px`,
                        border: "1px solid rgb(71, 74, 72)",
                        boxShadow: `inset -${bevel}px -${bevel}px 0 ${darkColor}`,
                        transition: "none", // мгновенное выделение
                        userSelect: "none", // запрет выделения текста
                      }}
                    >
                      {tile.number}
                    </button>
                  );
                })}

                {/* Все движущиеся плитки - оранжевые (выделенные) */}
                {game.movingTiles.map((mt) => {
                  const pos = getMovingTilePosition(mt, now);

                  // Позиция в пикселях
                  const x = gap + pos.col * cellStep;
                  const y = gap + pos.row * cellStep;

                  // Движущаяся плитка всегда оранжевая (выделенная)
                  const selectedColor = [255, 139, 2];
                  const darkColor = `rgb(${Math.floor(selectedColor[0] * 0.4)}, ${Math.floor(selectedColor[1] * 0.4)}, ${Math.floor(selectedColor[2] * 0.4)})`;

                  return (
                    <div
                      key={`moving-${mt.id}`}
                      className="absolute pointer-events-none flex items-center justify-center"
                      style={{
                        left: `${x}px`,
                        top: `${y}px`,
                        width: `${tileSize}px`,
                        height: `${tileSize}px`,
                        background: "rgb(255, 139, 2)", // оранжевый - выделение
                        color: "rgb(255, 255, 202)", // кремовый текст
                        fontFamily: "'Open Sans', system-ui, sans-serif",
                        fontWeight: 400,
                        fontSize: `${tileFontSize}px`,
                        border: "1px solid rgb(71, 74, 72)",
                        boxShadow: `inset -${bevel}px -${bevel}px 0 ${darkColor}`,
                        zIndex: 10,
                        userSelect: "none", // запрет выделения текста
                      }}
                    >
                      {mt.tile.number}
                    </div>
                  );
                })}

                {/* Попапы очков */}
                {game.popups.map((popup) => {
                  const age = now - popup.createdAt;

                  // Попап не появился ещё
                  if (age < 0) return null;

                  // Затухание за 400мс
                  const opacity = Math.max(0, 1 - age / 400);

                  if (opacity <= 0) return null;

                  // Позиция: центр ячейки
                  const x = gap + popup.col * cellStep + tileSize / 2;
                  const y = gap + popup.row * cellStep + tileSize / 2;

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
                        fontSize: `${Math.round(tileFontSize * 0.9)}px`,
                        fontWeight: 400,
                        fontFamily: "Arial, sans-serif",
                      }}
                    >
                      {popup.negative ? "-" : "+"}{popup.value}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Панель справа - синяя как в оригинале, с масштабируемой шириной */}
          <div
            className="p-5"
            style={{
              background: "rgb(62, 157, 203)",
              width: `${panelWidth}px`,
              flexShrink: 0,
            }}
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

            {/* Полоса прогресса спавна - всегда видна во время игры */}
            {isPlaying && (
              <div className="mb-5">
                <div className="text-white/80 text-xs mb-1">Новая плитка:</div>
                <div
                  className="h-5 overflow-hidden relative"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  {/* Прогресс-бар с градиентом (left-0 = уменьшается справа налево) */}
                  <div
                    className="h-full absolute left-0 top-0"
                    style={{
                      width: `${(game.spawnTimerRunning ? getSpawnBarProgress(game, now) : 1) * 100}%`,
                      background: "linear-gradient(180deg, #FFE066 0%, #F0C030 50%, #E0A820 100%)",
                      borderRadius: "9px",
                      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4)",
                    }}
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
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Настройки"
              >
                <Settings size={22} />
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

        {/* Окно результатов */}
        {(game.gameStatus === "won" || game.gameStatus === "lost") && (
          <ResultWindow
            gameScore={game.score}
            remainingTime={game.timeLeft}
            onNewGame={startNewGame}
            onMenu={goToMenu}
            isWin={game.gameStatus === "won"}
          />
        )}

        {/* Окно настроек */}
        {showSettings && (
          <SettingsWindow
            currentSize={pendingSizeChange ?? sizePreset}
            currentSpeed={speedPreset}
            onSizeChange={handleSizeChange}
            onSpeedChange={setSpeedPreset}
            onClose={handleCloseSettings}
          />
        )}
        </div>
      </div>
    </div>
  );
}
