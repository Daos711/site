"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, RotateCcw, Trophy, User, RefreshCw } from "lucide-react";
import Link from "next/link";
import {
  BALL_LEVELS,
  GAME_WIDTH,
  WALL_THICKNESS,
  DROP_ZONE_HEIGHT,
  DANGER_TIME_MS,
  MAX_SPAWN_LEVEL,
  TOP_BUFFER,
  BALL_PHYSICS,
  DROP_COOLDOWN,
  MERGE_IMMUNITY_MS,
  GROW_DURATION_MS,
  MAX_BALL_SPEED,
  KICK_FORCE,
  MAX_KICK_SPEED,
  KICK_NEAR_THRESHOLD,
  GAME_MODES,
  getGameHeight,
  getCanvasHeight,
  type GameMode,
} from "@/lib/ball-merge";
import {
  getBallMergeScores,
  submitBallMergeScore,
  getPlayerName,
  setPlayerName,
  BallMergeScore,
  savePendingResult,
  getPendingResult,
  clearPendingResult,
} from "@/lib/ball-merge/supabase";
import { useAuth } from "@/components/AuthProvider";

type MatterEngine = import("matter-js").Engine;
type MatterBody = import("matter-js").Body & {
  ballLevel?: number;
  mergeImmunityUntil?: number;
  hasEnteredContainer?: boolean; // Шар был внутри стакана (ниже верхнего края)
  // Для плавного роста при слиянии
  growStartRadius?: number;
  growTargetRadius?: number;
  growStartTime?: number;
  growDurationMs?: number;
};

// Рисование 3D стеклянного стакана с реальной перспективой
function drawGlassContainer(ctx: CanvasRenderingContext2D, canvasHeight: number) {
  const w = GAME_WIDTH;
  const h = canvasHeight; // Полная высота с буфером
  const t = WALL_THICKNESS;
  const depth = 40; // глубина 3D эффекта
  const perspectiveOffset = 15; // смещение для перспективы (дальняя грань меньше)
  const containerTop = DROP_ZONE_HEIGHT + TOP_BUFFER; // Верх стакана сдвинут вниз

  ctx.save();

  // Задняя стенка (меньше из-за перспективы)
  const backLeft = t + depth + perspectiveOffset;
  const backRight = w - t - depth - perspectiveOffset;
  const backTop = containerTop + depth + perspectiveOffset / 2;
  const backBottom = h - t - depth - perspectiveOffset / 2;

  ctx.strokeStyle = 'rgba(180, 170, 210, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(backLeft, backTop, backRight - backLeft, backBottom - backTop, 6);
  ctx.stroke();

  // Заливка задней стенки (тёмная)
  ctx.fillStyle = 'rgba(40, 30, 60, 0.5)';
  ctx.fill();

  // Левая боковая стенка (трапеция с перспективой)
  ctx.fillStyle = 'rgba(200, 190, 230, 0.12)';
  ctx.beginPath();
  ctx.moveTo(t, containerTop); // передний верх
  ctx.lineTo(backLeft, backTop); // задний верх (меньше)
  ctx.lineTo(backLeft, backBottom); // задний низ
  ctx.lineTo(t, h - t); // передний низ
  ctx.closePath();
  ctx.fill();

  // Обводка левой стенки
  ctx.strokeStyle = 'rgba(220, 215, 245, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Правая боковая стенка (трапеция)
  ctx.fillStyle = 'rgba(200, 190, 230, 0.12)';
  ctx.beginPath();
  ctx.moveTo(w - t, containerTop);
  ctx.lineTo(backRight, backTop);
  ctx.lineTo(backRight, backBottom);
  ctx.lineTo(w - t, h - t);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Нижняя стенка (пол - трапеция)
  ctx.fillStyle = 'rgba(180, 170, 210, 0.15)';
  ctx.beginPath();
  ctx.moveTo(t, h - t); // передний левый
  ctx.lineTo(backLeft, backBottom); // задний левый
  ctx.lineTo(backRight, backBottom); // задний правый
  ctx.lineTo(w - t, h - t); // передний правый
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Внешняя рамка (передняя грань) с glow
  ctx.shadowColor = 'rgba(180, 170, 220, 0.6)';
  ctx.shadowBlur = 20;
  ctx.strokeStyle = 'rgba(235, 230, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(t, containerTop, w - 2*t, h - containerTop - t, 12);
  ctx.stroke();

  // Вторая обводка (двойная линия)
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(t + 3, containerTop + 3, w - 2*t - 6, h - containerTop - t - 6, 10);
  ctx.stroke();

  // Блик сверху
  const gradient = ctx.createLinearGradient(t, containerTop, t, containerTop + 50);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(t + 5, containerTop + 5, w - 2*t - 10, 45);

  // Угловые блики (стеклянный эффект)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.beginPath();
  ctx.moveTo(t + 5, containerTop + 5);
  ctx.lineTo(t + 25, containerTop + 5);
  ctx.lineTo(t + 5, containerTop + 60);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Рисование красивого шарика с градиентом и бликом
function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, level: number, inDanger: boolean = false) {
  const ballData = BALL_LEVELS[level];
  if (!ballData) return;

  ctx.save();

  // Если в опасной зоне - красное мигающее свечение
  if (inDanger) {
    const pulse = Math.sin(Date.now() / 100) * 0.5 + 0.5; // мигание
    ctx.shadowColor = `rgba(255, 50, 50, ${0.6 + pulse * 0.4})`;
    ctx.shadowBlur = 20 + pulse * 10;

    // Красная обводка
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 50, 50, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Основной градиент шара
  const gradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, 0,
    x, y, radius
  );
  gradient.addColorStop(0, ballData.glowColor);
  gradient.addColorStop(0.7, ballData.color);
  gradient.addColorStop(1, shadeColor(ballData.color, -20));

  // Тень под шаром (если не в опасности)
  if (!inDanger) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
  }

  // Рисуем шар
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Убираем тень для блика
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Блик (маленький эллипс сверху-слева)
  ctx.beginPath();
  ctx.ellipse(
    x - radius * 0.35,
    y - radius * 0.35,
    radius * 0.25,
    radius * 0.15,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.fill();

  // Второй маленький блик
  ctx.beginPath();
  ctx.arc(x - radius * 0.15, y - radius * 0.5, radius * 0.08, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  // Обводка для больших шаров
  if (level >= 5 && !inDanger) {
    ctx.beginPath();
    ctx.arc(x, y, radius - 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Для золотого шара - особый эффект
  if (level === 9 && !inDanger) {
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

// Вспомогательная функция для затемнения цвета
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export default function BallMergePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const matterRef = useRef<typeof import("matter-js") | null>(null);
  const ballBodiesRef = useRef<Map<number, MatterBody>>(new Map());

  // Режим игры: null = экран выбора, 'normal' | 'large' = игра
  const [gameMode, setGameMode] = useState<GameMode | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [score, setScore] = useState(0);
  const [currentBallLevel, setCurrentBallLevel] = useState(() => Math.floor(Math.random() * MAX_SPAWN_LEVEL));
  const [nextBallLevel, setNextBallLevel] = useState(() => Math.floor(Math.random() * MAX_SPAWN_LEVEL));
  const [isGameOver, setIsGameOver] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [dropX, setDropX] = useState(GAME_WIDTH / 2);

  // Динамические размеры на основе режима
  const GAME_HEIGHT = gameMode ? getGameHeight(gameMode) : getGameHeight('normal');
  const CANVAS_HEIGHT = gameMode ? getCanvasHeight(gameMode) : getCanvasHeight('normal');

  // Refs для использования в render loop
  const currentBallRef = useRef(currentBallLevel);
  currentBallRef.current = currentBallLevel;
  const dropXRef = useRef(dropX);
  dropXRef.current = dropX;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;

  // Per-ball danger timers: Map<ballId, startTime>
  const dangerTimersRef = useRef<Map<number, number>>(new Map());
  const mergedPairsRef = useRef<Set<string>>(new Set());

  // Cooldown на бросок (anti-spam)
  const lastDropTimeRef = useRef(0);

  // Авторизация
  const { user: authUser, playerId, signIn } = useAuth();

  // Игрок и таблица лидеров
  const [playerName, setPlayerNameState] = useState("");
  const [leaderboard, setLeaderboard] = useState<BallMergeScore[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [scoreSubmitting, setScoreSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  // Уведомление о сохранении pending result после OAuth
  const [pendingResultMessage, setPendingResultMessage] = useState<string | null>(null);
  const pendingResultSubmittedRef = useRef(false);

  // Загрузка таблицы лидеров
  const fetchLeaderboard = useCallback(async (mode: GameMode = gameMode || 'normal') => {
    setLeaderboardLoading(true);
    try {
      const scores = await getBallMergeScores(mode, 20);
      setLeaderboard(scores);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setLeaderboardLoading(false);
    }
  }, [gameMode]);

  // Загрузка имени игрока
  useEffect(() => {
    const savedName = getPlayerName();
    if (savedName) {
      setPlayerNameState(savedName);
    }
  }, []);

  // Загрузка таблицы лидеров при смене режима
  useEffect(() => {
    if (gameMode) {
      fetchLeaderboard(gameMode);
    }
  }, [gameMode, fetchLeaderboard]);

  // Проверка и отправка pending result после OAuth (только один раз)
  useEffect(() => {
    if (pendingResultSubmittedRef.current) return;
    if (authUser && playerId) {
      const pending = getPendingResult();
      // Проверяем что pending result валиден и содержит имя и score > 0
      if (pending && pending.name && pending.name.trim() && pending.score > 0) {
        pendingResultSubmittedRef.current = true;
        const pendingMode = pending.mode || 'normal';
        (async () => {
          try {
            const result = await submitBallMergeScore(playerId, pending.name.trim(), pending.score, pendingMode);
            clearPendingResult();
            if (result.success) {
              setPendingResultMessage(result.isNewRecord
                ? `Новый рекорд сохранён! ${pending.score} очков`
                : `Результат сохранён! ${pending.score} очков`);
              // Если режим совпадает с текущим - обновляем таблицу
              if (gameMode === pendingMode) {
                await fetchLeaderboard(pendingMode);
              }
            } else {
              setPendingResultMessage('Ошибка сохранения результата');
            }
            setTimeout(() => setPendingResultMessage(null), 5000);
          } catch (err) {
            console.error('Ошибка отправки pending result:', err);
            clearPendingResult();
            setPendingResultMessage('Ошибка сохранения результата');
            setTimeout(() => setPendingResultMessage(null), 5000);
          }
        })();
      } else if (pending) {
        // Невалидный pending result — очищаем
        clearPendingResult();
      }
    }
  }, [authUser, playerId, gameMode, fetchLeaderboard]);

  // Сохранение результата при game over (только для авторизованных)
  const handleSubmitScore = async () => {
    if (!authUser || !playerName.trim() || score === 0 || scoreSubmitting || scoreSubmitted || !gameMode) return;

    setScoreSubmitting(true);
    try {
      const result = await submitBallMergeScore(playerId, playerName.trim(), score, gameMode);
      if (result.success) {
        setScoreSubmitted(true);
        setIsNewRecord(result.isNewRecord);
        setPlayerName(playerName.trim());
        await fetchLeaderboard(gameMode);
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
    } finally {
      setScoreSubmitting(false);
    }
  };

  // Инициализация Matter.js (только когда выбран режим)
  useEffect(() => {
    if (!canvasRef.current || !gameMode) return;

    // Локальные константы для текущего режима (захватываются замыканием)
    const currentGameHeight = getGameHeight(gameMode);
    const currentCanvasHeight = getCanvasHeight(gameMode);

    let isMounted = true;
    let animationId: number;

    const initMatter = async () => {
      const Matter = await import("matter-js");
      if (!isMounted || !canvasRef.current) return;

      matterRef.current = Matter;
      const { Engine, Bodies, Body, Composite, Events } = Matter;

      const engine = Engine.create({
        gravity: { x: 0, y: 1.5 },
      });

      // Увеличиваем итерации солвера для стабильности
      engine.positionIterations = 10;  // было 6 по умолчанию
      engine.velocityIterations = 8;   // было 4 по умолчанию

      engineRef.current = engine;

      // Стены - БЕЗ трения, чтобы шары катились
      const wallOptions = {
        isStatic: true,
        render: { visible: false },
        label: 'wall',
        friction: 0,           // Нет трения
        frictionStatic: 0,     // Нет статического трения - шары легко сдвигаются
        restitution: 0.1,      // Минимальный отскок
      };

      // Высота стен - вся видимая область + запас сверху
      const totalWallHeight = currentCanvasHeight + 400;  // Толще для надёжности
      const wallCenterY = currentCanvasHeight / 2 - 100;

      const leftWall = Bodies.rectangle(
        WALL_THICKNESS / 2,
        wallCenterY,
        WALL_THICKNESS * 2,    // Толще стена
        totalWallHeight,
        wallOptions
      );

      const rightWall = Bodies.rectangle(
        GAME_WIDTH - WALL_THICKNESS / 2,
        wallCenterY,
        WALL_THICKNESS * 2,    // Толще стена
        totalWallHeight,
        wallOptions
      );

      // Пол - толстый для предотвращения туннелирования
      const floor = Bodies.rectangle(
        GAME_WIDTH / 2,
        currentCanvasHeight - WALL_THICKNESS / 2 + 20,  // Чуть ниже
        GAME_WIDTH + 100,
        WALL_THICKNESS * 3,    // Толще пол
        wallOptions
      );

      // Невидимый потолок
      const ceiling = Bodies.rectangle(
        GAME_WIDTH / 2,
        -200,
        GAME_WIDTH + 100,
        100,
        wallOptions
      );

      Composite.add(engine.world, [leftWall, rightWall, floor, ceiling]);

      // Мгновенный пинок соседям при слиянии
      const kickNeighbors = (newBall: MatterBody, targetRadius: number) => {
        for (const other of ballBodiesRef.current.values()) {
          if (other.id === newBall.id) continue;
          if (other.ballLevel === undefined) continue;

          const rO = other.circleRadius ?? BALL_LEVELS[other.ballLevel].radius;

          const dx = other.position.x - newBall.position.x;
          const dy = other.position.y - newBall.position.y;
          const dist = Math.hypot(dx, dy) || 1e-6;

          // Используем ЦЕЛЕВОЙ радиус для расчёта перекрытия
          const overlap = (targetRadius + rO + KICK_NEAR_THRESHOLD) - dist;
          if (overlap <= 0) continue;

          const nx = dx / dist;
          const ny = dy / dist;

          const dv = Math.min(MAX_KICK_SPEED, overlap * KICK_FORCE);

          Body.setVelocity(other, {
            x: other.velocity.x + nx * dv,
            y: other.velocity.y + ny * dv,
          });
        }
      };

      // Обработка столкновений - слияние
      // Используем и collisionStart, и collisionActive для надёжности
      const handleCollision = (event: Matter.IEventCollision<Matter.Engine>) => {
        for (const pair of event.pairs) {
          const bodyA = pair.bodyA as MatterBody;
          const bodyB = pair.bodyB as MatterBody;

          // FIX: Помечаем шар как "в игре" при любом столкновении
          // (со стенкой, дном или другим шаром)
          if (bodyA.ballLevel !== undefined && !bodyA.hasEnteredContainer) {
            bodyA.hasEnteredContainer = true;
          }
          if (bodyB.ballLevel !== undefined && !bodyB.hasEnteredContainer) {
            bodyB.hasEnteredContainer = true;
          }

          // Слияние только одинаковых шаров
          if (
            bodyA.ballLevel !== undefined &&
            bodyB.ballLevel !== undefined &&
            bodyA.ballLevel === bodyB.ballLevel
          ) {
            // Защита от уже удалённых тел
            if (!ballBodiesRef.current.has(bodyA.id) || !ballBodiesRef.current.has(bodyB.id)) {
              continue;
            }

            // Проверка иммунитета к слиянию (для цепных реакций)
            const now = Date.now();
            if (
              (bodyA.mergeImmunityUntil && now < bodyA.mergeImmunityUntil) ||
              (bodyB.mergeImmunityUntil && now < bodyB.mergeImmunityUntil)
            ) {
              continue;
            }

            const pairKey = [bodyA.id, bodyB.id].sort().join('-');

            if (!mergedPairsRef.current.has(pairKey)) {
              mergedPairsRef.current.add(pairKey);

              const currentLevel = bodyA.ballLevel;
              let newLevel: number;
              if (currentLevel === 8) {
                newLevel = 9;
              } else if (currentLevel === 9) {
                newLevel = 0;
              } else {
                newLevel = currentLevel + 1;
              }

              // Позиция - центр между двумя шарами
              const midX = (bodyA.position.x + bodyB.position.x) / 2;
              const midY = (bodyA.position.y + bodyB.position.y) / 2;

              // СОХРАНЯЕМ ИМПУЛЬС: массо-взвешенная средняя скорость
              const massA = bodyA.mass;
              const massB = bodyB.mass;
              const totalMass = massA + massB;
              const newVx = (bodyA.velocity.x * massA + bodyB.velocity.x * massB) / totalMass;
              const newVy = (bodyA.velocity.y * massA + bodyB.velocity.y * massB) / totalMass;

              // Удаляем старые шары
              ballBodiesRef.current.delete(bodyA.id);
              ballBodiesRef.current.delete(bodyB.id);
              Composite.remove(engine.world, bodyA);
              Composite.remove(engine.world, bodyB);

              // Создаём новый шарик с НАЧАЛЬНЫМ радиусом (для плавного роста)
              const startRadius = BALL_LEVELS[currentLevel].radius;
              const targetRadius = BALL_LEVELS[newLevel].radius;

              const newBall = Bodies.circle(midX, midY, startRadius, {
                ...BALL_PHYSICS,
                label: `ball-${newLevel}`,
              }) as MatterBody;
              newBall.ballLevel = newLevel;
              newBall.hasEnteredContainer = true; // Новый шар от слияния уже "в игре"
              newBall.mergeImmunityUntil = Date.now() + MERGE_IMMUNITY_MS;

              // Параметры плавного роста
              newBall.growStartRadius = startRadius;
              newBall.growTargetRadius = targetRadius;
              newBall.growStartTime = performance.now();
              newBall.growDurationMs = GROW_DURATION_MS;

              Composite.add(engine.world, newBall);
              ballBodiesRef.current.set(newBall.id, newBall);

              // Применяем сохранённый импульс к новому шару
              Body.setVelocity(newBall, { x: newVx, y: newVy });

              // МГНОВЕННЫЙ пинок соседям (используем целевой радиус)
              kickNeighbors(newBall, targetRadius);

              // +1 очко за слияние
              setScore(prev => prev + 1);

              setTimeout(() => mergedPairsRef.current.delete(pairKey), 100);
            }
          }
        }
      };

      // Слушаем оба события - начало и продолжение касания
      Events.on(engine, 'collisionStart', handleCollision);
      Events.on(engine, 'collisionActive', handleCollision);

      // Кастомный рендер + физика с ФИКСИРОВАННЫМ TIMESTEP
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Верх стакана с учётом буфера
      const containerTop = DROP_ZONE_HEIGHT + TOP_BUFFER;
      // Позиция превью шара - ближе к стакану, но не пересекает
      const previewY = TOP_BUFFER * 0.7;

      // Фиксированный timestep для стабильной физики
      const FIXED_DELTA = 1000 / 60;  // 60 FPS физики
      let accumulator = 0;
      let lastTime = performance.now();

      // Функция плавного ВИЗУАЛЬНОГО роста шаров (пинок уже был в момент слияния)
      const stepGrowth = (now: number) => {
        for (const b of ballBodiesRef.current.values()) {
          // Плавный рост
          if (b.growTargetRadius && b.growStartTime && b.growDurationMs && b.circleRadius) {
            const t = Math.min(1, (now - b.growStartTime) / b.growDurationMs);
            const tt = t * (2 - t); // easing

            const startR = b.growStartRadius ?? b.circleRadius;
            const desiredR = startR + (b.growTargetRadius - startR) * tt;

            const scale = desiredR / b.circleRadius;

            if (Number.isFinite(scale) && scale > 0.0001 && Math.abs(scale - 1) > 1e-3) {
              Body.scale(b, scale, scale);
            }

            if (t >= 1) {
              b.growTargetRadius = undefined;
              b.growStartTime = undefined;
              b.growDurationMs = undefined;
              b.growStartRadius = undefined;
            }
          }

          // Кэп скорости
          const speed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);
          if (speed > MAX_BALL_SPEED) {
            const factor = MAX_BALL_SPEED / speed;
            Body.setVelocity(b, { x: b.velocity.x * factor, y: b.velocity.y * factor });
          }
        }
      };

      const render = (currentTime: number) => {
        if (!ctx || !isMounted) return;

        // НЕ обновляем физику если игра окончена
        if (!isGameOverRef.current) {
          // Фиксированный timestep + сабстеппинг
          let dt = currentTime - lastTime;
          lastTime = currentTime;
          dt = Math.min(dt, 50);  // Clamp чтобы не было огромных скачков
          accumulator += dt;

          // Несколько апдейтов физики на кадр если нужно
          while (accumulator >= FIXED_DELTA) {
            Engine.update(engine, FIXED_DELTA);
            stepGrowth(performance.now()); // Рост шаров после каждого шага физики
            accumulator -= FIXED_DELTA;
          }

        }

        // Фон - вся канвас область
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(0, 0, GAME_WIDTH, currentCanvasHeight);

        // 3D стеклянный стакан
        drawGlassContainer(ctx, currentCanvasHeight);

        // Шарики
        const bodies = Composite.allBodies(engine.world);
        for (const body of bodies) {
          const b = body as MatterBody;
          if (b.ballLevel !== undefined) {
            // Отмечаем, что шар вошёл в стакан (центр ниже верхнего края)
            if (body.position.y > containerTop && !b.hasEnteredContainer) {
              b.hasEnteredContainer = true;
            }
            // Используем фактический радиус тела (для плавного роста)
            const actualRadius = b.circleRadius ?? BALL_LEVELS[b.ballLevel].radius;
            // Опасная зона: центр на уровне или выше верхнего края + шар уже был в стакане
            const isInDanger = b.hasEnteredContainer && body.position.y <= containerTop;
            drawBall(ctx, body.position.x, body.position.y, actualRadius, b.ballLevel, isInDanger);
          }
        }

        // Превью шарика (используем refs для актуальных значений)
        if (!isGameOverRef.current) {
          const previewBall = BALL_LEVELS[currentBallRef.current];
          if (previewBall) {
            // Рисуем превью с полной яркостью, как настоящий шар
            drawBall(ctx, dropXRef.current, previewY, previewBall.radius, currentBallRef.current);

            // Линия падения
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(dropXRef.current, previewY + previewBall.radius);
            ctx.lineTo(dropXRef.current, currentCanvasHeight);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Проверка game over с ИНДИВИДУАЛЬНЫМИ таймерами для каждого шара
        // Условие: центр шара на уровне или выше containerTop = выпирает на 50%+
        // Только для шаров, которые уже были внутри стакана
        const now = Date.now();
        const currentDangerBalls = new Set<number>();

        for (const body of bodies) {
          const b = body as MatterBody;
          // Проверяем только шары, которые уже были в стакане (hasEnteredContainer)
          if (b.ballLevel !== undefined && b.hasEnteredContainer) {
            // Центр на уровне или выше верхней границы = половина или больше выпирает
            if (body.position.y <= containerTop) {
              currentDangerBalls.add(b.id);

              // Если этот шар ещё не имеет таймера - создаём
              if (!dangerTimersRef.current.has(b.id)) {
                dangerTimersRef.current.set(b.id, now);
              } else {
                // Проверяем, прошло ли 3 секунды
                const startTime = dangerTimersRef.current.get(b.id)!;
                if (now - startTime >= DANGER_TIME_MS) {
                  setIsGameOver(true);
                }
              }
            }
          }
        }

        // Удаляем таймеры для шаров, которые вернулись в безопасную зону
        for (const ballId of dangerTimersRef.current.keys()) {
          if (!currentDangerBalls.has(ballId)) {
            dangerTimersRef.current.delete(ballId);
          }
        }

        animationId = requestAnimationFrame(render);
      };

      // Запускаем рендер-цикл
      animationId = requestAnimationFrame(render);
      setIsLoaded(true);
    };

    initMatter();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      if (engineRef.current && matterRef.current) {
        matterRef.current.Engine.clear(engineRef.current);
      }
      mergedPairsRef.current.clear();
      ballBodiesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]); // Перезапуск при смене режима

  // Бросок шарика с коротким cooldown
  const dropBall = useCallback((clientX: number) => {
    const Matter = matterRef.current;
    if (!Matter || !engineRef.current || !canvasRef.current || isGameOver) return;

    // Проверка cooldown
    const now = Date.now();
    if (now - lastDropTimeRef.current < DROP_COOLDOWN) return;
    lastDropTimeRef.current = now;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const ballData = BALL_LEVELS[currentBallLevel];
    const ballRadius = ballData?.radius || 25;
    const clampedX = Math.max(
      WALL_THICKNESS + ballRadius + 10,
      Math.min(GAME_WIDTH - WALL_THICKNESS - ballRadius - 10, x)
    );

    // Позиция сброса - ближе к стакану (как превью)
    const dropY = TOP_BUFFER * 0.7;

    const ball = Matter.Bodies.circle(clampedX, dropY, ballRadius, {
      ...BALL_PHYSICS,
      label: `ball-${currentBallLevel}`,
    }) as MatterBody;

    ball.ballLevel = currentBallLevel;
    Matter.Composite.add(engineRef.current.world, ball);
    ballBodiesRef.current.set(ball.id, ball);

    // Текущий становится следующим, генерируем новый следующий
    setCurrentBallLevel(nextBallLevel);
    setNextBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
  }, [isGameOver, currentBallLevel, nextBallLevel]);

  // Задержка показа окна game over (чтобы случайно не нажать на кнопку)
  useEffect(() => {
    if (isGameOver) {
      const timer = setTimeout(() => {
        setShowGameOverModal(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowGameOverModal(false);
    }
  }, [isGameOver]);

  // Обновление позиции превью
  const updateDropPosition = useCallback((clientX: number) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const ballRadius = BALL_LEVELS[currentBallLevel]?.radius || 25;
    const clampedX = Math.max(
      WALL_THICKNESS + ballRadius + 10,
      Math.min(GAME_WIDTH - WALL_THICKNESS - ballRadius - 10, x)
    );

    setDropX(clampedX);
  }, [currentBallLevel]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => dropBall(e.clientX);
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => updateDropPosition(e.clientX);
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) updateDropPosition(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) updateDropPosition(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) dropBall(e.changedTouches[0].clientX);
  };

  // Рестарт
  const restartGame = useCallback(() => {
    const Matter = matterRef.current;
    if (!Matter || !engineRef.current) return;

    const bodies = Matter.Composite.allBodies(engineRef.current.world);
    for (const body of bodies) {
      if ((body as MatterBody).ballLevel !== undefined) {
        Matter.Composite.remove(engineRef.current.world, body);
      }
    }

    mergedPairsRef.current.clear();
    ballBodiesRef.current.clear();
    dangerTimersRef.current.clear();
    lastDropTimeRef.current = 0;

    setScore(0);
    setCurrentBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
    setNextBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
    setIsGameOver(false);
    setDropX(GAME_WIDTH / 2);
    setScoreSubmitted(false);
    setIsNewRecord(false);
  }, []);

  // Выбор другого режима
  const changeMode = useCallback(() => {
    // Очищаем состояние
    const Matter = matterRef.current;
    if (Matter && engineRef.current) {
      Matter.Engine.clear(engineRef.current);
    }
    mergedPairsRef.current.clear();
    ballBodiesRef.current.clear();
    dangerTimersRef.current.clear();
    lastDropTimeRef.current = 0;

    setScore(0);
    setCurrentBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
    setNextBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
    setIsGameOver(false);
    setDropX(GAME_WIDTH / 2);
    setScoreSubmitted(false);
    setIsNewRecord(false);
    setIsLoaded(false);
    setGameMode(null); // Возврат к экрану выбора
  }, []);

  const nextBallData = BALL_LEVELS[nextBallLevel];

  // Экран выбора режима
  if (!gameMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-4">
        {/* Шапка */}
        <div className="w-full max-w-4xl mb-8 flex items-center justify-between px-4">
          <Link
            href="/games"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад</span>
          </Link>
          <h1 className="text-2xl font-bold">Шарики</h1>
          <div className="w-16" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-xl text-gray-300 mb-2">Выберите режим</h2>
          <p className="text-sm text-gray-500">У каждого режима отдельный рейтинг</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          {Object.values(GAME_MODES).map((mode) => (
            <button
              key={mode.id}
              onClick={() => setGameMode(mode.id)}
              className="group relative bg-gray-800 hover:bg-gray-700 border-2 border-gray-600 hover:border-purple-500 rounded-xl p-6 transition-all duration-200 min-w-[200px]"
            >
              <div className="flex flex-col items-center gap-3">
                {/* Иконка стакана */}
                <div
                  className="bg-gradient-to-b from-purple-500/20 to-purple-900/40 rounded-lg border-2 border-purple-400/50 flex items-end justify-center"
                  style={{
                    width: 60,
                    height: mode.id === 'large' ? 90 : 60,
                  }}
                >
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 mb-2" />
                </div>
                <div className="text-lg font-bold text-white">{mode.name}</div>
                <div className="text-sm text-gray-400 text-center">{mode.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Превью прогрессии шаров */}
        <div className="mt-12 flex flex-wrap justify-center gap-2 max-w-md">
          {BALL_LEVELS.map((ball, i) => (
            <div
              key={i}
              className="rounded-full"
              title={ball.name}
              style={{
                width: Math.min(ball.radius * 0.25, 28),
                height: Math.min(ball.radius * 0.25, 28),
                background: `radial-gradient(circle at 30% 30%, ${ball.glowColor}, ${ball.color})`,
                boxShadow: `0 2px 4px rgba(0,0,0,0.3)`,
              }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-500">Соединяй одинаковые шарики — они сливаются в больший!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-4">
      {/* Шапка */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between px-4">
        <Link
          href="/games"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </Link>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Шарики</h1>
          <button
            onClick={changeMode}
            className="text-xs text-gray-500 hover:text-purple-400 transition-colors"
          >
            {GAME_MODES[gameMode].name} режим (сменить)
          </button>
        </div>
        <button
          onClick={restartGame}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Основная область */}
      <div className="flex gap-6 items-center">
        {/* Прогрессия шаров слева - центрируется по вертикали с канвасом */}
        <div className="hidden md:flex flex-col gap-1 p-3 bg-gray-800/50 rounded-xl">
          <div className="text-xs text-gray-400 text-center mb-1">Шары</div>
          {BALL_LEVELS.map((ball, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ width: 36, height: 36 }}
              title={ball.name}
            >
              <div
                className="rounded-full"
                suppressHydrationWarning
                style={{
                  width: `${Math.round(Math.min(ball.radius * 0.3, 30))}px`,
                  height: `${Math.round(Math.min(ball.radius * 0.3, 30))}px`,
                  background: `radial-gradient(circle at 30% 30%, ${ball.glowColor}, ${ball.color})`,
                  boxShadow: `0 2px 4px rgba(0,0,0,0.3)`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Центральная часть */}
        <div className="flex flex-col items-center">
          {/* Счёт и следующий */}
          <div className="w-full max-w-xl mb-4 flex items-center justify-between px-4">
            <div className="bg-gray-800 rounded-lg px-4 py-2 text-center">
              <div className="text-xs text-gray-400">Слияний</div>
              <div className="text-3xl font-bold text-yellow-400">{score}</div>
            </div>

            <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-3">
              <div className="text-xs text-gray-400">Следующий:</div>
              {nextBallData && (
                <div
                  className="rounded-full"
                  style={{
                    width: Math.min(nextBallData.radius * 0.8, 45),
                    height: Math.min(nextBallData.radius * 0.8, 45),
                    background: `radial-gradient(circle at 30% 30%, ${nextBallData.glowColor}, ${nextBallData.color})`,
                    boxShadow: `0 2px 6px rgba(0,0,0,0.4)`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Игровое поле */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={GAME_WIDTH}
              height={CANVAS_HEIGHT}
              onClick={handleClick}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="cursor-pointer max-w-full"
              style={{ touchAction: 'none' }}
            />

            {!isLoaded && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <div className="text-gray-400">Загрузка...</div>
              </div>
            )}

            {showGameOverModal && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 overflow-y-auto">
                <h2 className="text-3xl font-bold text-red-400 mb-2">Игра окончена!</h2>
                <p className="text-xl text-gray-300 mb-4">
                  Слияний: <span className="text-yellow-400 font-bold">{score}</span>
                </p>

                {/* Форма сохранения результата (только для авторизованных) */}
                {score > 0 && !scoreSubmitted && authUser && (
                  <div className="bg-gray-800/90 rounded-lg p-4 mb-4 w-full max-w-xs">
                    <h3 className="text-sm text-gray-400 text-center mb-3">Сохранить результат</h3>
                    <input
                      type="text"
                      placeholder="Ваше имя"
                      value={playerName}
                      onChange={(e) => setPlayerNameState(e.target.value)}
                      maxLength={20}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 mb-3"
                    />
                    <button
                      onClick={handleSubmitScore}
                      disabled={!playerName.trim() || scoreSubmitting}
                      className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
                    >
                      {scoreSubmitting ? "Сохранение..." : "Сохранить"}
                    </button>
                  </div>
                )}

                {/* Приглашение войти (для неавторизованных) */}
                {score > 0 && !scoreSubmitted && !authUser && (
                  <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-4 mb-4 w-full max-w-xs">
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
                      onClick={() => {
                        if (!playerName.trim() || !gameMode) return;
                        // Сохраняем имя и результат перед OAuth редиректом
                        setPlayerName(playerName.trim());
                        savePendingResult(score, playerName.trim(), gameMode);
                        signIn();
                      }}
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
                    <p className="text-green-400">
                      {isNewRecord ? "Новый рекорд сохранён!" : "Результат сохранён!"}
                    </p>
                  </div>
                )}

                <button
                  onClick={restartGame}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Играть снова
                </button>
                <button
                  onClick={changeMode}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-lg font-medium transition-colors"
                >
                  Сменить режим
                </button>
              </div>
            )}
          </div>

          {/* Подсказка */}
          <p className="mt-4 text-sm text-gray-500 text-center">
            Соединяй одинаковые шарики — они сливаются в больший!
          </p>

          {/* Таблица лидеров */}
          <div className="w-full mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Таблица лидеров
              </h2>
              <button
                onClick={() => fetchLeaderboard()}
                disabled={leaderboardLoading}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Обновить"
              >
                <RefreshCw className={`w-5 h-5 ${leaderboardLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="w-12 text-center p-3 text-gray-400 font-medium">#</th>
                    <th className="text-left p-3 text-gray-400 font-medium">Игрок</th>
                    <th className="text-center p-3 text-gray-400 font-medium">Слияний</th>
                    <th className="text-center p-3 text-gray-400 font-medium hidden sm:table-cell">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardLoading ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">
                        Загрузка...
                      </td>
                    </tr>
                  ) : leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">
                        Пока нет результатов. Будьте первым!
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((entry, index) => {
                      const position = index + 1;
                      const dateStr = new Date(entry.updated_at || entry.created_at).toLocaleDateString("ru-RU");
                      return (
                        <tr key={entry.id} className="border-b border-gray-700/50 last:border-0 hover:bg-gray-700/30">
                          <td className="w-12 text-center p-3 text-lg">
                            {position === 1 && "🥇"}
                            {position === 2 && "🥈"}
                            {position === 3 && "🥉"}
                            {position > 3 && position}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-white">{entry.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center text-xl font-bold text-yellow-400">
                            {entry.score}
                          </td>
                          <td className="p-3 text-center text-gray-400 hidden sm:table-cell">
                            {dateStr}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Уведомление о сохранении pending result */}
      {pendingResultMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: pendingResultMessage.includes('Ошибка')
              ? 'rgba(255, 59, 77, 0.95)'
              : 'rgba(46, 204, 113, 0.95)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 14,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {pendingResultMessage}
        </div>
      )}
    </div>
  );
}
