"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import Matter from "matter-js";
import {
  BALL_LEVELS,
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  DROP_ZONE_HEIGHT,
  DANGER_LINE_Y,
  DANGER_TIME_MS,
  MAX_SPAWN_LEVEL,
  GameState,
} from "@/lib/ball-merge";

const { Engine, Render, Runner, Bodies, Body, Composite, Events, Mouse, Vector } = Matter;

export default function BallMergePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    nextBallLevel: Math.floor(Math.random() * Math.min(MAX_SPAWN_LEVEL, 3)),
    isGameOver: false,
    dropX: GAME_WIDTH / 2,
    canDrop: true,
  });

  const dangerStartTimeRef = useRef<number | null>(null);
  const mergedPairsRef = useRef<Set<string>>(new Set());

  // Создание шарика
  const createBall = useCallback((x: number, y: number, level: number) => {
    const ballData = BALL_LEVELS[level];
    if (!ballData) return null;

    const ball = Bodies.circle(x, y, ballData.radius, {
      restitution: 0.3,
      friction: 0.5,
      frictionAir: 0.001,
      density: 0.001 * (level + 1),
      label: `ball-${level}`,
      render: {
        fillStyle: ballData.color,
        strokeStyle: ballData.borderColor,
        lineWidth: 3,
      },
    });

    // Сохраняем уровень в body
    (ball as Matter.Body & { ballLevel: number }).ballLevel = level;

    return ball;
  }, []);

  // Инициализация Matter.js
  useEffect(() => {
    if (!canvasRef.current) return;

    // Создаём движок
    const engine = Engine.create({
      gravity: { x: 0, y: 1.5 },
    });
    engineRef.current = engine;

    // Создаём рендер
    const render = Render.create({
      canvas: canvasRef.current,
      engine: engine,
      options: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        wireframes: false,
        background: '#1a1a2e',
      },
    });
    renderRef.current = render;

    // Стены контейнера
    const wallOptions = {
      isStatic: true,
      render: {
        fillStyle: '#4a4a6a',
      },
      label: 'wall',
    };

    const leftWall = Bodies.rectangle(
      WALL_THICKNESS / 2,
      GAME_HEIGHT / 2 + DROP_ZONE_HEIGHT / 2,
      WALL_THICKNESS,
      GAME_HEIGHT - DROP_ZONE_HEIGHT,
      wallOptions
    );

    const rightWall = Bodies.rectangle(
      GAME_WIDTH - WALL_THICKNESS / 2,
      GAME_HEIGHT / 2 + DROP_ZONE_HEIGHT / 2,
      WALL_THICKNESS,
      GAME_HEIGHT - DROP_ZONE_HEIGHT,
      wallOptions
    );

    const floor = Bodies.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - WALL_THICKNESS / 2,
      GAME_WIDTH,
      WALL_THICKNESS,
      wallOptions
    );

    Composite.add(engine.world, [leftWall, rightWall, floor]);

    // Обработка столкновений для слияния
    Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;

      for (const pair of pairs) {
        const bodyA = pair.bodyA as Matter.Body & { ballLevel?: number };
        const bodyB = pair.bodyB as Matter.Body & { ballLevel?: number };

        // Проверяем что оба тела - шарики одного уровня
        if (
          bodyA.ballLevel !== undefined &&
          bodyB.ballLevel !== undefined &&
          bodyA.ballLevel === bodyB.ballLevel &&
          bodyA.ballLevel < BALL_LEVELS.length - 1
        ) {
          // Уникальный ключ пары для предотвращения двойного слияния
          const pairKey = [bodyA.id, bodyB.id].sort().join('-');

          if (!mergedPairsRef.current.has(pairKey)) {
            mergedPairsRef.current.add(pairKey);

            const newLevel = bodyA.ballLevel + 1;
            const midX = (bodyA.position.x + bodyB.position.x) / 2;
            const midY = (bodyA.position.y + bodyB.position.y) / 2;

            // Удаляем оба шарика
            Composite.remove(engine.world, bodyA);
            Composite.remove(engine.world, bodyB);

            // Создаём новый шарик большего размера
            const newBall = createBall(midX, midY, newLevel);
            if (newBall) {
              // Даём небольшой импульс
              Body.setVelocity(newBall, { x: 0, y: -2 });
              Composite.add(engine.world, newBall);
            }

            // Добавляем очки
            const points = BALL_LEVELS[newLevel]?.points || 1;
            setGameState(prev => ({
              ...prev,
              score: prev.score + points,
            }));

            // Очищаем пару через некоторое время
            setTimeout(() => {
              mergedPairsRef.current.delete(pairKey);
            }, 100);
          }
        }
      }
    });

    // Проверка game over
    const checkGameOver = () => {
      const bodies = Composite.allBodies(engine.world);
      let hasDangerBall = false;

      for (const body of bodies) {
        if ((body as Matter.Body & { ballLevel?: number }).ballLevel !== undefined) {
          const ballData = BALL_LEVELS[(body as Matter.Body & { ballLevel?: number }).ballLevel!];
          if (ballData && body.position.y - ballData.radius < DANGER_LINE_Y) {
            hasDangerBall = true;
            break;
          }
        }
      }

      if (hasDangerBall) {
        if (dangerStartTimeRef.current === null) {
          dangerStartTimeRef.current = Date.now();
        } else if (Date.now() - dangerStartTimeRef.current > DANGER_TIME_MS) {
          setGameState(prev => ({ ...prev, isGameOver: true }));
        }
      } else {
        dangerStartTimeRef.current = null;
      }
    };

    // Кастомный рендер для линии опасности и превью
    Events.on(render, 'afterRender', () => {
      const ctx = render.canvas.getContext('2d');
      if (!ctx) return;

      // Линия опасности
      ctx.strokeStyle = dangerStartTimeRef.current ? '#ff4444' : '#ff444466';
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(WALL_THICKNESS, DANGER_LINE_Y);
      ctx.lineTo(GAME_WIDTH - WALL_THICKNESS, DANGER_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Зона для броска (затемнённая)
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, GAME_WIDTH, DROP_ZONE_HEIGHT);
    });

    Events.on(engine, 'afterUpdate', checkGameOver);

    // Запускаем
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    return () => {
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      mergedPairsRef.current.clear();
    };
  }, [createBall]);

  // Бросок шарика
  const dropBall = useCallback((clientX: number) => {
    if (!engineRef.current || !canvasRef.current || gameState.isGameOver || !gameState.canDrop) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    // Ограничиваем позицию стенками
    const ballRadius = BALL_LEVELS[gameState.nextBallLevel].radius;
    const clampedX = Math.max(
      WALL_THICKNESS + ballRadius,
      Math.min(GAME_WIDTH - WALL_THICKNESS - ballRadius, x)
    );

    const ball = createBall(clampedX, DROP_ZONE_HEIGHT / 2, gameState.nextBallLevel);
    if (ball) {
      Composite.add(engineRef.current.world, ball);
    }

    // Следующий шарик
    setGameState(prev => ({
      ...prev,
      nextBallLevel: Math.floor(Math.random() * Math.min(MAX_SPAWN_LEVEL, 4)),
      canDrop: false,
    }));

    // Задержка перед следующим броском
    setTimeout(() => {
      setGameState(prev => ({ ...prev, canDrop: true }));
    }, 500);
  }, [createBall, gameState.isGameOver, gameState.canDrop, gameState.nextBallLevel]);

  // Обновление позиции превью
  const updateDropPosition = useCallback((clientX: number) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const ballRadius = BALL_LEVELS[gameState.nextBallLevel]?.radius || 20;
    const clampedX = Math.max(
      WALL_THICKNESS + ballRadius,
      Math.min(GAME_WIDTH - WALL_THICKNESS - ballRadius, x)
    );

    setGameState(prev => ({ ...prev, dropX: clampedX }));
  }, [gameState.nextBallLevel]);

  // Обработчики мыши/тача
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dropBall(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateDropPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      updateDropPosition(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      updateDropPosition(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.changedTouches.length > 0) {
      dropBall(e.changedTouches[0].clientX);
    }
  };

  // Рестарт игры
  const restartGame = useCallback(() => {
    if (!engineRef.current) return;

    // Удаляем все шарики
    const bodies = Composite.allBodies(engineRef.current.world);
    for (const body of bodies) {
      if ((body as Matter.Body & { ballLevel?: number }).ballLevel !== undefined) {
        Composite.remove(engineRef.current.world, body);
      }
    }

    mergedPairsRef.current.clear();
    dangerStartTimeRef.current = null;

    setGameState({
      score: 0,
      nextBallLevel: Math.floor(Math.random() * Math.min(MAX_SPAWN_LEVEL, 3)),
      isGameOver: false,
      dropX: GAME_WIDTH / 2,
      canDrop: true,
    });
  }, []);

  // Рендер превью шарика
  useEffect(() => {
    const render = renderRef.current;
    if (!render) return;

    const drawPreview = () => {
      const ctx = render.canvas.getContext('2d');
      if (!ctx || gameState.isGameOver) return;

      const ballData = BALL_LEVELS[gameState.nextBallLevel];
      if (!ballData) return;

      // Превью шарика
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(gameState.dropX, DROP_ZONE_HEIGHT / 2, ballData.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballData.color;
      ctx.fill();
      ctx.strokeStyle = ballData.borderColor;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Линия вниз
      ctx.strokeStyle = '#ffffff33';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(gameState.dropX, DROP_ZONE_HEIGHT / 2 + ballData.radius);
      ctx.lineTo(gameState.dropX, GAME_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    Events.on(render, 'afterRender', drawPreview);
    return () => Events.off(render, 'afterRender', drawPreview);
  }, [gameState.dropX, gameState.nextBallLevel, gameState.isGameOver]);

  const nextBallData = BALL_LEVELS[gameState.nextBallLevel];

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Шапка */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between px-2">
        <Link
          href="/games"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Назад</span>
        </Link>
        <h1 className="text-xl font-bold">Шарики</h1>
        <div className="w-20" />
      </div>

      {/* Счёт и следующий шарик */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between px-4">
        <div className="bg-gray-800 rounded-lg px-4 py-2">
          <div className="text-xs text-gray-400">Очки</div>
          <div className="text-2xl font-bold text-yellow-400">{gameState.score}</div>
        </div>

        <div className="bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-3">
          <div className="text-xs text-gray-400">Следующий:</div>
          {nextBallData && (
            <div
              className="rounded-full border-2"
              style={{
                width: Math.min(nextBallData.radius * 1.5, 40),
                height: Math.min(nextBallData.radius * 1.5, 40),
                backgroundColor: nextBallData.color,
                borderColor: nextBallData.borderColor,
              }}
            />
          )}
        </div>
      </div>

      {/* Игровое поле */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden shadow-2xl"
        style={{ maxWidth: GAME_WIDTH }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="cursor-pointer max-w-full"
          style={{ touchAction: 'none' }}
        />

        {/* Game Over */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <h2 className="text-3xl font-bold text-red-400 mb-2">Игра окончена!</h2>
            <p className="text-xl text-gray-300 mb-6">
              Очки: <span className="text-yellow-400 font-bold">{gameState.score}</span>
            </p>
            <button
              onClick={restartGame}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-lg font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Играть снова
            </button>
          </div>
        )}
      </div>

      {/* Подсказка */}
      <p className="mt-4 text-sm text-gray-500 text-center px-4">
        Соединяй одинаковые шарики — они сливаются в больший!
      </p>

      {/* Легенда шариков */}
      <div className="mt-6 flex flex-wrap justify-center gap-2 px-4 max-w-md">
        {BALL_LEVELS.slice(0, 6).map((ball) => (
          <div
            key={ball.level}
            className="flex items-center gap-1 bg-gray-800 rounded-full px-2 py-1"
            title={ball.name}
          >
            <div
              className="rounded-full border"
              style={{
                width: 16,
                height: 16,
                backgroundColor: ball.color,
                borderColor: ball.borderColor,
              }}
            />
            <span className="text-xs text-gray-400">{ball.points}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
