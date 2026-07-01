"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Latex } from "@/components/Latex";
import { Play, Pause, RotateCcw, Info, Sparkles } from "lucide-react";

// Состояние точки в 3D
interface Point3D {
  x: number;
  y: number;
  z: number;
}

// Параметры системы Лоренца
interface LorenzParams {
  sigma: number;  // σ — число Прандтля
  rho: number;    // ρ — число Рэлея
  beta: number;   // β — геометрический параметр
}

// Траектория с цветом
interface Trail {
  points: Point3D[];
  hue: number;
}

export default function LorenzPage() {
  // Параметры системы (классические значения)
  const [params, setParams] = useState<LorenzParams>({
    sigma: 10,
    rho: 28,
    beta: 8 / 3,
  });

  // Состояние симуляции
  const [isRunning, setIsRunning] = useState(true);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [rotation, setRotation] = useState({ x: 0.3, y: 0, z: 0 });
  const [showInfo, setShowInfo] = useState(true); // По умолчанию показываем справку
  const [trailCount, setTrailCount] = useState(3);
  const [autoRotate, setAutoRotate] = useState(true);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const trailsRef = useRef<Trail[]>([]);
  const rotationRef = useRef(rotation);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Синхронизация refs
  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  // Инициализация траекторий
  const initTrails = useCallback((count: number) => {
    const newTrails: Trail[] = [];
    for (let i = 0; i < count; i++) {
      // Слегка разные начальные условия — демонстрация хаоса!
      const offset = (i - count / 2) * 0.001;
      newTrails.push({
        points: [{ x: 1 + offset, y: 1 + offset, z: 1 + offset }],
        hue: (i / count) * 360,
      });
    }
    return newTrails;
  }, []);

  // Сброс симуляции (можно передать кол-во траекторий напрямую)
  const resetTrails = useCallback((count: number) => {
    const newTrails = initTrails(count);
    setTrails(newTrails);
    trailsRef.current = newTrails;
  }, [initTrails]);

  // Обёртка для кнопки сброса (использует текущий trailCount)
  const handleReset = useCallback(() => {
    resetTrails(trailCount);
  }, [resetTrails, trailCount]);

  // Инициализация при монтировании
  useEffect(() => {
    resetTrails(3); // Начальное количество
  }, [resetTrails]);

  // Производные системы Лоренца
  const lorenzDerivatives = useCallback((p: Point3D, params: LorenzParams) => {
    const { sigma, rho, beta } = params;
    return {
      dx: sigma * (p.y - p.x),
      dy: p.x * (rho - p.z) - p.y,
      dz: p.x * p.y - beta * p.z,
    };
  }, []);

  // Шаг интегрирования (Рунге-Кутта 4-го порядка)
  const step = useCallback((p: Point3D, dt: number, params: LorenzParams): Point3D => {
    const k1 = lorenzDerivatives(p, params);
    const k2 = lorenzDerivatives(
      { x: p.x + k1.dx * dt / 2, y: p.y + k1.dy * dt / 2, z: p.z + k1.dz * dt / 2 },
      params
    );
    const k3 = lorenzDerivatives(
      { x: p.x + k2.dx * dt / 2, y: p.y + k2.dy * dt / 2, z: p.z + k2.dz * dt / 2 },
      params
    );
    const k4 = lorenzDerivatives(
      { x: p.x + k3.dx * dt, y: p.y + k3.dy * dt, z: p.z + k3.dz * dt },
      params
    );

    return {
      x: p.x + (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx) * dt / 6,
      y: p.y + (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy) * dt / 6,
      z: p.z + (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz) * dt / 6,
    };
  }, [lorenzDerivatives]);

  // 3D -> 2D проекция с вращением
  const project = useCallback((p: Point3D, width: number, height: number, rho: number): { x: number; y: number; depth: number } => {
    const rot = rotationRef.current;

    // Центрируем аттрактор (он примерно в районе z=rho-1)
    const centerZ = Math.max(25, rho - 1);
    const centered = { x: p.x, y: p.y, z: p.z - centerZ };

    // Вращение вокруг X
    let y1 = centered.y * Math.cos(rot.x) - centered.z * Math.sin(rot.x);
    let z1 = centered.y * Math.sin(rot.x) + centered.z * Math.cos(rot.x);

    // Вращение вокруг Y
    let x2 = centered.x * Math.cos(rot.y) + z1 * Math.sin(rot.y);
    let z2 = -centered.x * Math.sin(rot.y) + z1 * Math.cos(rot.y);

    // Вращение вокруг Z
    let x3 = x2 * Math.cos(rot.z) - y1 * Math.sin(rot.z);
    let y3 = x2 * Math.sin(rot.z) + y1 * Math.cos(rot.z);

    // Адаптивный масштаб — чем больше rho, тем дальше камера
    const baseScale = 4;
    const adaptiveScale = baseScale * (28 / Math.max(rho, 10));

    // Перспективная проекция
    const fov = 200;
    const distance = 80;
    const scale = fov / (distance + z2);

    return {
      x: width / 2 + x3 * scale * adaptiveScale,
      y: height / 2 - y3 * scale * adaptiveScale,
      depth: z2,
    };
  }, []);

  // Анимационный цикл
  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      // Обновляем траектории
      const dt = 0.005;
      const stepsPerFrame = 5;
      const maxPoints = 3000;

      trailsRef.current = trailsRef.current.map(trail => {
        const newPoints = [...trail.points];
        let lastPoint = newPoints[newPoints.length - 1];

        for (let i = 0; i < stepsPerFrame; i++) {
          lastPoint = step(lastPoint, dt, params);
          newPoints.push(lastPoint);
        }

        // Ограничиваем длину траектории
        while (newPoints.length > maxPoints) {
          newPoints.shift();
        }

        return { ...trail, points: newPoints };
      });

      setTrails([...trailsRef.current]);

      // Авто-вращение
      if (autoRotate && !isDraggingRef.current) {
        setRotation(r => ({
          ...r,
          y: r.y + 0.003,
        }));
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, params, step, autoRotate]);

  // Отрисовка
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;

    // Очистка с затуханием (создаёт эффект следа)
    ctx.fillStyle = "rgba(15, 23, 42, 0.15)";
    ctx.fillRect(0, 0, width, height);

    // Рисуем траектории
    trails.forEach(trail => {
      if (trail.points.length < 2) return;

      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Рисуем сегменты с градиентом прозрачности
      const segmentSize = 50;
      for (let i = 0; i < trail.points.length - 1; i += segmentSize) {
        const startIdx = i;
        const endIdx = Math.min(i + segmentSize, trail.points.length - 1);

        ctx.beginPath();

        for (let j = startIdx; j <= endIdx; j++) {
          const p = project(trail.points[j], width, height, params.rho);
          if (j === startIdx) {
            ctx.moveTo(p.x, p.y);
          } else {
            ctx.lineTo(p.x, p.y);
          }
        }

        // Прозрачность зависит от позиции в траектории (старые точки бледнее)
        const alpha = 0.3 + (endIdx / trail.points.length) * 0.7;
        // Яркость зависит от глубины
        const avgDepth = trail.points.slice(startIdx, endIdx + 1)
          .reduce((sum, pt) => sum + project(pt, width, height, params.rho).depth, 0) / (endIdx - startIdx + 1);
        const brightness = Math.max(40, Math.min(70, 55 - avgDepth * 0.5));

        ctx.strokeStyle = `hsla(${trail.hue}, 80%, ${brightness}%, ${alpha})`;
        ctx.lineWidth = 1.5 + (endIdx / trail.points.length) * 1;
        ctx.stroke();
      }

      // Рисуем "головы" траекторий (текущие точки)
      if (trail.points.length > 0) {
        const head = trail.points[trail.points.length - 1];
        const p = project(head, width, height, params.rho);

        // Свечение
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
        gradient.addColorStop(0, `hsla(${trail.hue}, 100%, 70%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${trail.hue}, 100%, 50%, 0.3)`);
        gradient.addColorStop(1, `hsla(${trail.hue}, 100%, 50%, 0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Точка
        ctx.fillStyle = `hsl(${trail.hue}, 100%, 80%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  }, [trails, project, params.rho]);

  // Обработка перетаскивания для вращения
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    setRotation(r => ({
      x: r.x + dy * 0.005,
      y: r.y + dx * 0.005,
      z: r.z,
    }));

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Touch события
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - lastMouseRef.current.x;
    const dy = e.touches[0].clientY - lastMouseRef.current.y;

    setRotation(r => ({
      x: r.x + dy * 0.005,
      y: r.y + dx * 0.005,
      z: r.z,
    }));

    lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  // Пресеты параметров
  const presets = [
    { name: "Классика", sigma: 10, rho: 28, beta: 8/3 },
    { name: "Хаос+", sigma: 10, rho: 99.96, beta: 8/3 },
    { name: "Спираль", sigma: 10, rho: 15, beta: 8/3 },
    { name: "Бабочка", sigma: 14, rho: 28, beta: 4 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Аттрактор Лоренца"
        description="Модель погоды 1963 года. Демонстрирует «эффект бабочки» — почему невозможно предсказать погоду."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted">3D-визуализация</span>
            <span className="text-xs text-muted">Вращай мышкой!</span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-square cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none", background: "#0f172a" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Управление */}
        <div className="space-y-4">
          {/* Кнопки */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                isRunning
                  ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                  : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
              }`}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
              {isRunning ? "Пауза" : "Старт"}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                showInfo ? "bg-accent/20 text-accent" : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
            >
              <Info size={18} />
            </button>
          </div>

          {/* Пресеты */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Пресеты</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setParams({ sigma: preset.sigma, rho: preset.rho, beta: preset.beta });
                    handleReset();
                  }}
                  className="px-3 py-2 rounded-lg bg-muted/10 hover:bg-muted/20 text-sm transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Параметры */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Параметры</h3>

            {/* Sigma */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Sigma (σ)</span>
                <span className="font-mono">{params.sigma.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.1"
                value={params.sigma}
                onChange={(e) => setParams({ ...params, sigma: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
            </div>

            {/* Rho */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Rho (ρ)</span>
                <span className="font-mono">{params.rho.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={params.rho}
                onChange={(e) => setParams({ ...params, rho: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>

            {/* Beta */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Beta (β)</span>
                <span className="font-mono">{params.beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.01"
                value={params.beta}
                onChange={(e) => setParams({ ...params, beta: parseFloat(e.target.value) })}
                className="w-full accent-pink-500"
              />
            </div>
          </div>

          {/* Визуализация */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Визуализация</h3>

            {/* Количество траекторий */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Траектории</span>
                <span className="font-mono">{trailCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={trailCount}
                onChange={(e) => {
                  const newCount = parseInt(e.target.value);
                  setTrailCount(newCount);
                  resetTrails(newCount); // Сразу перезапускаем с новым количеством
                }}
                className="w-full accent-accent"
              />
              <p className="text-xs text-muted mt-1">
                Больше траекторий = нагляднее хаос
              </p>
            </div>

            {/* Авто-вращение */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRotate}
                onChange={(e) => setAutoRotate(e.target.checked)}
                className="w-4 h-4 rounded accent-accent"
              />
              <span className="text-sm">Авто-вращение</span>
            </label>
          </div>

          {/* Хаос-демо */}
          <button
            onClick={() => {
              setTrailCount(5);
              resetTrails(5); // Передаём 5 напрямую
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          >
            <Sparkles size={18} />
            Демо чувствительности к начальным условиям
          </button>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Система Лоренца</h3>
              <div className="bg-card/50 p-3 rounded space-y-1 text-center">
                <Latex tex="\frac{dx}{dt} = \sigma(y - x)" />
                <Latex tex="\frac{dy}{dt} = x(\rho - z) - y" />
                <Latex tex="\frac{dz}{dt} = xy - \beta z" />
              </div>
              <ul className="text-muted text-xs space-y-1">
                <li><strong>σ (sigma)</strong> — число Прандтля</li>
                <li><strong>ρ (rho)</strong> — число Рэлея</li>
                <li><strong>β (beta)</strong> — геометрический параметр</li>
              </ul>
              <p className="text-muted text-xs">
                Эдвард Лоренц открыл этот аттрактор в 1963 году, моделируя атмосферную конвекцию.
                Это один из первых примеров <strong>детерминированного хаоса</strong> — система полностью
                определена уравнениями, но невозможно предсказать её поведение на длительном промежутке.
              </p>
              <p className="text-muted text-xs">
                <strong>Эффект бабочки:</strong> траектории с почти одинаковыми начальными условиями
                быстро расходятся. Попробуй добавить несколько траекторий!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
