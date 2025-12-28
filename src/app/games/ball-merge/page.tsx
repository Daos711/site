"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import {
  BALL_LEVELS,
  GAME_WIDTH,
  GAME_HEIGHT,
  WALL_THICKNESS,
  DROP_ZONE_HEIGHT,
  DANGER_TIME_MS,
  MAX_SPAWN_LEVEL,
  TOP_BUFFER,
  CANVAS_HEIGHT,
} from "@/lib/ball-merge";

type MatterEngine = import("matter-js").Engine;
type MatterRender = import("matter-js").Render;
type MatterRunner = import("matter-js").Runner;
type MatterBody = import("matter-js").Body & {
  ballLevel?: number;
  mergeImmunityUntil?: number; // timestamp когда закончится иммунитет к слиянию
};

// Рисование 3D стеклянного стакана с реальной перспективой
function drawGlassContainer(ctx: CanvasRenderingContext2D) {
  const w = GAME_WIDTH;
  const h = GAME_HEIGHT + TOP_BUFFER; // Полная высота с буфером
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
  const runnerRef = useRef<MatterRunner | null>(null);
  const matterRef = useRef<typeof import("matter-js") | null>(null);
  const ballBodiesRef = useRef<Map<number, MatterBody>>(new Map());

  const [isLoaded, setIsLoaded] = useState(false);
  const [score, setScore] = useState(0);
  const [currentBallLevel, setCurrentBallLevel] = useState(() => Math.floor(Math.random() * MAX_SPAWN_LEVEL));
  const [nextBallLevel, setNextBallLevel] = useState(() => Math.floor(Math.random() * MAX_SPAWN_LEVEL));
  const [isGameOver, setIsGameOver] = useState(false);
  const [dropX, setDropX] = useState(GAME_WIDTH / 2);

  // Refs для использования в render loop
  const currentBallRef = useRef(currentBallLevel);
  currentBallRef.current = currentBallLevel;
  const dropXRef = useRef(dropX);
  dropXRef.current = dropX;
  const isGameOverRef = useRef(isGameOver);
  isGameOverRef.current = isGameOver;

  const dangerStartTimeRef = useRef<number | null>(null);
  const mergedPairsRef = useRef<Set<string>>(new Set());

  // Инициализация Matter.js
  useEffect(() => {
    if (!canvasRef.current) return;

    let isMounted = true;
    let animationId: number;

    const initMatter = async () => {
      const Matter = await import("matter-js");
      if (!isMounted || !canvasRef.current) return;

      matterRef.current = Matter;
      const { Engine, Runner, Bodies, Body, Composite, Events } = Matter;

      const engine = Engine.create({
        gravity: { x: 0, y: 1.5 }, // Земная гравитация (масштабированная)
      });
      engineRef.current = engine;

      // Невидимые стены (физика) - стекло, очень скользкое
      // Стены простираются от самого верха до низа, чтобы удерживать отлетающие шары
      const wallOptions = {
        isStatic: true,
        render: { visible: false },
        label: 'wall',
        friction: 0.001, // Стекло - почти без трения
        restitution: 0.3, // Отскок от невидимых стен выше стакана
      };

      // Высота стен - вся видимая область + запас сверху
      const totalWallHeight = CANVAS_HEIGHT + 200;
      const wallCenterY = CANVAS_HEIGHT / 2 - 100;

      const leftWall = Bodies.rectangle(
        WALL_THICKNESS / 2,
        wallCenterY,
        WALL_THICKNESS,
        totalWallHeight,
        wallOptions
      );

      const rightWall = Bodies.rectangle(
        GAME_WIDTH - WALL_THICKNESS / 2,
        wallCenterY,
        WALL_THICKNESS,
        totalWallHeight,
        wallOptions
      );

      // Пол сдвинут вниз на TOP_BUFFER
      const floor = Bodies.rectangle(
        GAME_WIDTH / 2,
        CANVAS_HEIGHT - WALL_THICKNESS / 2,
        GAME_WIDTH,
        WALL_THICKNESS,
        { ...wallOptions, restitution: 0.1 } // Пол менее упругий
      );

      // Невидимый потолок высоко вверху - шары могут подлетать и отскакивать
      const ceiling = Bodies.rectangle(
        GAME_WIDTH / 2,
        -150,
        GAME_WIDTH,
        100,
        { ...wallOptions, restitution: 0.5 } // Потолок упругий - шары отскакивают вниз
      );

      Composite.add(engine.world, [leftWall, rightWall, floor, ceiling]);

      // Обработка столкновений шаров - усиление передачи импульса
      Events.on(engine, 'collisionStart', (event) => {
        for (const pair of event.pairs) {
          const bodyA = pair.bodyA as MatterBody;
          const bodyB = pair.bodyB as MatterBody;

          // Усиление передачи импульса при столкновении двух шаров
          if (
            bodyA.ballLevel !== undefined &&
            bodyB.ballLevel !== undefined &&
            !bodyA.isStatic && !bodyB.isStatic
          ) {
            // Вектор от A к B (направление толчка)
            const dx = bodyB.position.x - bodyA.position.x;
            const dy = bodyB.position.y - bodyA.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Скорость падающего шара (A)
            const speedA = Math.sqrt(bodyA.velocity.x ** 2 + bodyA.velocity.y ** 2);

            // Если шар A движется достаточно быстро - передаём импульс B
            if (speedA > 1) {
              // Сила зависит от скорости падающего шара
              // Чем сильнее удар, тем дальше откатится
              const pushForce = speedA * 0.8;

              // Толкаем B в направлении от A
              Body.setVelocity(bodyB, {
                x: bodyB.velocity.x + nx * pushForce,
                y: bodyB.velocity.y + ny * pushForce * 0.5, // меньше вертикально
              });
            }
          }

          // Слияние одинаковых шаров
          if (
            bodyA.ballLevel !== undefined &&
            bodyB.ballLevel !== undefined &&
            bodyA.ballLevel === bodyB.ballLevel
          ) {
            // Проверка иммунитета к слиянию (для цепных реакций)
            const now = Date.now();
            if (
              (bodyA.mergeImmunityUntil && now < bodyA.mergeImmunityUntil) ||
              (bodyB.mergeImmunityUntil && now < bodyB.mergeImmunityUntil)
            ) {
              continue; // Пропускаем - один из шаров ещё под иммунитетом
            }

            const pairKey = [bodyA.id, bodyB.id].sort().join('-');

            if (!mergedPairsRef.current.has(pairKey)) {
              mergedPairsRef.current.add(pairKey);

              const currentLevel = bodyA.ballLevel;
              // При слиянии двух самых больших (8) -> золотой (9)
              // При слиянии двух золотых (9) -> маленький (0) - цикл
              let newLevel: number;
              if (currentLevel === 8) {
                newLevel = 9; // Золотой
              } else if (currentLevel === 9) {
                newLevel = 0; // Цикл - возврат к маленькому
              } else {
                newLevel = currentLevel + 1;
              }

              const midX = (bodyA.position.x + bodyB.position.x) / 2;
              const midY = (bodyA.position.y + bodyB.position.y) / 2;

              // Удаляем из tracking
              ballBodiesRef.current.delete(bodyA.id);
              ballBodiesRef.current.delete(bodyB.id);

              Composite.remove(engine.world, bodyA);
              Composite.remove(engine.world, bodyB);

              // Создаём новый шарик
              const newBallData = BALL_LEVELS[newLevel];
              if (newBallData) {
                // Плотность одинаковая, масса = density * area = density * π * r²
                // Matter.js автоматически считает массу от density и площади круга
                const newBall = Bodies.circle(midX, midY, newBallData.radius, {
                  restitution: 0.1, // Минимальный отскок
                  friction: 0.5, // Трение между шарами - держатся друг на друге
                  frictionAir: 0, // Нет сопротивления воздуха
                  density: 0.002, // Плотность (масса пропорциональна r²)
                  label: `ball-${newLevel}`,
                }) as MatterBody;
                newBall.ballLevel = newLevel;
                // Иммунитет к слиянию 300мс - чтобы видеть промежуточный шар
                newBall.mergeImmunityUntil = Date.now() + 300;

                Composite.add(engine.world, newBall);
                ballBodiesRef.current.set(newBall.id, newBall);

                // ВЗРЫВ при слиянии - толкаем ВСЕ близкие шары
                // Используем setTimeout чтобы импульс применился после physics step
                setTimeout(() => {
                  const allBodies = Composite.allBodies(engine.world);
                  for (const otherBody of allBodies) {
                    const ob = otherBody as MatterBody;
                    if (ob.ballLevel !== undefined && ob.id !== newBall.id && !otherBody.isStatic) {
                      const dx = otherBody.position.x - midX;
                      const dy = otherBody.position.y - midY;
                      const dist = Math.sqrt(dx * dx + dy * dy);
                      const otherRadius = BALL_LEVELS[ob.ballLevel]?.radius || 50;

                      // Проверяем пересечение: новый шар вырос и задел другой
                      const overlap = newBallData.radius + otherRadius - dist;

                      if (overlap > -10) { // Касается или почти касается (10px запас)
                        // Сила зависит от перекрытия и размера нового шара
                        // Чем больше перекрытие, тем сильнее толчок
                        const overlapFactor = Math.max(overlap, 10) / 10;
                        const sizeFactor = newBallData.radius / 25;
                        const pushSpeed = overlapFactor * sizeFactor * 4; // Мягкий толчок

                        const nx = dx / Math.max(dist, 1);
                        const ny = dy / Math.max(dist, 1);

                        // Применяем скорость напрямую
                        Body.setVelocity(otherBody, {
                          x: nx * pushSpeed,
                          y: ny * pushSpeed // без подброса вверх
                        });
                      }
                    }
                  }
                }, 10);
              }

              // +1 очко за слияние
              setScore(prev => prev + 1);

              setTimeout(() => mergedPairsRef.current.delete(pairKey), 100);
            }
          }
        }
      });

      // Запускаем физику
      const runner = Runner.create();
      runnerRef.current = runner;
      Runner.run(runner, engine);

      // Кастомный рендер
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Верх стакана с учётом буфера
      const containerTop = DROP_ZONE_HEIGHT + TOP_BUFFER;
      // Позиция превью шара - над стаканом
      const previewY = TOP_BUFFER + DROP_ZONE_HEIGHT / 2;

      const render = () => {
        if (!ctx || !isMounted) return;

        // Фон - вся канвас область
        ctx.fillStyle = '#2d1b4e';
        ctx.fillRect(0, 0, GAME_WIDTH, CANVAS_HEIGHT);

        // 3D стеклянный стакан
        drawGlassContainer(ctx);

        // Шарики
        const bodies = Composite.allBodies(engine.world);
        for (const body of bodies) {
          const b = body as MatterBody;
          if (b.ballLevel !== undefined) {
            // Проверяем, в опасной ли зоне шар (центр выше верхнего края стакана)
            // НО: не подсвечиваем падающие шары - если движется вниз вообще
            const isMovingDown = body.velocity.y > 0.5;
            const isInDanger = body.position.y < containerTop && !isMovingDown;
            drawBall(ctx, body.position.x, body.position.y, BALL_LEVELS[b.ballLevel].radius, b.ballLevel, isInDanger);
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
            ctx.lineTo(dropXRef.current, CANVAS_HEIGHT);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }

        // Проверка game over: центр шара выше верхнего края стакана (= больше половины выпирает)
        // Не считаем падающие шары - только те что выпирают снизу (стоят или поднимаются)
        let hasDangerBall = false;
        for (const body of bodies) {
          const b = body as MatterBody;
          if (b.ballLevel !== undefined) {
            const isMovingDown = body.velocity.y > 0.5;
            // Если центр шара выше containerTop И шар НЕ движется вниз - значит выпирает снизу
            if (body.position.y < containerTop && !isMovingDown) {
              hasDangerBall = true;
              break;
            }
          }
        }

        if (hasDangerBall) {
          if (dangerStartTimeRef.current === null) {
            dangerStartTimeRef.current = Date.now();
          } else if (Date.now() - dangerStartTimeRef.current > DANGER_TIME_MS) {
            setIsGameOver(true);
          }
        } else {
          dangerStartTimeRef.current = null;
        }

        animationId = requestAnimationFrame(render);
      };

      render();
      setIsLoaded(true);
    };

    initMatter();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationId);
      if (runnerRef.current && matterRef.current) {
        matterRef.current.Runner.stop(runnerRef.current);
      }
      if (engineRef.current && matterRef.current) {
        matterRef.current.Engine.clear(engineRef.current);
      }
      mergedPairsRef.current.clear();
      ballBodiesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Инициализация только один раз!

  // Бросок шарика - БЕЗ ЗАДЕРЖКИ
  const dropBall = useCallback((clientX: number) => {
    const Matter = matterRef.current;
    if (!Matter || !engineRef.current || !canvasRef.current || isGameOver) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (clientX - rect.left) * scaleX;

    const ballData = BALL_LEVELS[currentBallLevel];
    const ballRadius = ballData?.radius || 25;
    const clampedX = Math.max(
      WALL_THICKNESS + ballRadius + 10,
      Math.min(GAME_WIDTH - WALL_THICKNESS - ballRadius - 10, x)
    );

    // Позиция сброса с учётом TOP_BUFFER
    const dropY = TOP_BUFFER + DROP_ZONE_HEIGHT / 2;

    const ball = Matter.Bodies.circle(clampedX, dropY, ballRadius, {
      restitution: 0.1, // Минимальный отскок
      friction: 0.5, // Трение между шарами - держатся друг на друге
      frictionAir: 0, // Нет сопротивления воздуха
      density: 0.002, // Плотность (масса пропорциональна r²)
      label: `ball-${currentBallLevel}`,
    }) as MatterBody;

    ball.ballLevel = currentBallLevel;
    Matter.Composite.add(engineRef.current.world, ball);
    ballBodiesRef.current.set(ball.id, ball);

    // Текущий становится следующим, генерируем новый следующий
    setCurrentBallLevel(nextBallLevel);
    setNextBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
  }, [isGameOver, currentBallLevel, nextBallLevel]);

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
    dangerStartTimeRef.current = null;

    setScore(0);
    setCurrentBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
    setNextBallLevel(Math.floor(Math.random() * MAX_SPAWN_LEVEL));
    setIsGameOver(false);
    setDropX(GAME_WIDTH / 2);
  }, []);

  const nextBallData = BALL_LEVELS[nextBallLevel];

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
        <h1 className="text-2xl font-bold">Шарики</h1>
        <button
          onClick={restartGame}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Основная область */}
      <div className="flex gap-6 items-start">
        {/* Прогрессия шаров слева */}
        <div className="hidden md:flex flex-col gap-2 p-3 bg-gray-800/50 rounded-xl">
          <div className="text-xs text-gray-400 text-center mb-2">Шары</div>
          {BALL_LEVELS.slice(0, 9).map((ball, i) => (
            <div
              key={i}
              className="flex items-center justify-center"
              style={{ width: 40, height: 40 }}
              title={ball.name}
            >
              <div
                className="rounded-full"
                style={{
                  width: Math.min(ball.radius * 0.4, 35),
                  height: Math.min(ball.radius * 0.4, 35),
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

            {isGameOver && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
                <h2 className="text-3xl font-bold text-red-400 mb-2">Игра окончена!</h2>
                <p className="text-xl text-gray-300 mb-6">
                  Слияний: <span className="text-yellow-400 font-bold">{score}</span>
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
          <p className="mt-4 text-sm text-gray-500 text-center">
            Соединяй одинаковые шарики — они сливаются в больший!
          </p>
        </div>
      </div>
    </div>
  );
}
