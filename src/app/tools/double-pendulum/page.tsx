"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Latex } from "@/components/Latex";
import { Play, Pause, RotateCcw, Info, Sparkles } from "lucide-react";

// Состояние маятника
interface PendulumState {
  theta1: number;  // угол первого маятника (от вертикали)
  theta2: number;  // угол второго маятника
  omega1: number;  // угловая скорость первого
  omega2: number;  // угловая скорость второго
}

// Параметры системы
interface PendulumParams {
  L1: number;  // длина первого стержня
  L2: number;  // длина второго стержня
  m1: number;  // масса первого груза
  m2: number;  // масса второго груза
  g: number;   // ускорение свободного падения
}

// Траектория с цветом
interface Trail {
  state: PendulumState;
  points: { x: number; y: number }[];
  hue: number;
}

export default function DoublePendulumPage() {
  // Параметры системы
  const [params, setParams] = useState<PendulumParams>({
    L1: 1,
    L2: 1,
    m1: 1,
    m2: 1,
    g: 9.81,
  });

  // Начальные углы
  const [initialAngle1, setInitialAngle1] = useState(120);
  const [initialAngle2, setInitialAngle2] = useState(120);

  // Состояние симуляции
  const [isRunning, setIsRunning] = useState(false);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [showInfo, setShowInfo] = useState(true);
  const [trailCount, setTrailCount] = useState(1);
  const [showTrail, setShowTrail] = useState(true);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const trailsRef = useRef<Trail[]>([]);
  const lastTimeRef = useRef<number>(0);

  // Инициализация маятников
  const initTrails = useCallback((count: number, angle1Deg: number, angle2Deg: number) => {
    const newTrails: Trail[] = [];
    for (let i = 0; i < count; i++) {
      // Слегка разные начальные условия для демонстрации хаоса
      const offset = (i - (count - 1) / 2) * 0.001;
      const theta1 = (angle1Deg + offset) * Math.PI / 180;
      const theta2 = (angle2Deg + offset) * Math.PI / 180;
      newTrails.push({
        state: { theta1, theta2, omega1: 0, omega2: 0 },
        points: [],
        hue: count === 1 ? 280 : (i / count) * 360,
      });
    }
    return newTrails;
  }, []);

  // Сброс симуляции
  const resetTrails = useCallback((count: number) => {
    const newTrails = initTrails(count, initialAngle1, initialAngle2);
    setTrails(newTrails);
    trailsRef.current = newTrails;
  }, [initTrails, initialAngle1, initialAngle2]);

  const handleReset = useCallback(() => {
    resetTrails(trailCount);
    setIsRunning(false);
  }, [resetTrails, trailCount]);

  // Инициализация
  useEffect(() => {
    resetTrails(1);
  }, []);

  // Производные для двойного маятника (уравнения Лагранжа)
  const derivatives = useCallback((state: PendulumState, params: PendulumParams) => {
    const { theta1, theta2, omega1, omega2 } = state;
    const { L1, L2, m1, m2, g } = params;

    const delta = theta2 - theta1;
    const den1 = (m1 + m2) * L1 - m2 * L1 * Math.cos(delta) * Math.cos(delta);
    const den2 = (L2 / L1) * den1;

    const dtheta1 = omega1;
    const dtheta2 = omega2;

    const domega1 = (
      m2 * L1 * omega1 * omega1 * Math.sin(delta) * Math.cos(delta) +
      m2 * g * Math.sin(theta2) * Math.cos(delta) +
      m2 * L2 * omega2 * omega2 * Math.sin(delta) -
      (m1 + m2) * g * Math.sin(theta1)
    ) / den1;

    const domega2 = (
      -m2 * L2 * omega2 * omega2 * Math.sin(delta) * Math.cos(delta) +
      (m1 + m2) * g * Math.sin(theta1) * Math.cos(delta) -
      (m1 + m2) * L1 * omega1 * omega1 * Math.sin(delta) -
      (m1 + m2) * g * Math.sin(theta2)
    ) / den2;

    return { dtheta1, dtheta2, domega1, domega2 };
  }, []);

  // Шаг Рунге-Кутты 4-го порядка
  const step = useCallback((state: PendulumState, dt: number, params: PendulumParams): PendulumState => {
    const k1 = derivatives(state, params);

    const s2: PendulumState = {
      theta1: state.theta1 + k1.dtheta1 * dt / 2,
      theta2: state.theta2 + k1.dtheta2 * dt / 2,
      omega1: state.omega1 + k1.domega1 * dt / 2,
      omega2: state.omega2 + k1.domega2 * dt / 2,
    };
    const k2 = derivatives(s2, params);

    const s3: PendulumState = {
      theta1: state.theta1 + k2.dtheta1 * dt / 2,
      theta2: state.theta2 + k2.dtheta2 * dt / 2,
      omega1: state.omega1 + k2.domega1 * dt / 2,
      omega2: state.omega2 + k2.domega2 * dt / 2,
    };
    const k3 = derivatives(s3, params);

    const s4: PendulumState = {
      theta1: state.theta1 + k3.dtheta1 * dt,
      theta2: state.theta2 + k3.dtheta2 * dt,
      omega1: state.omega1 + k3.domega1 * dt,
      omega2: state.omega2 + k3.domega2 * dt,
    };
    const k4 = derivatives(s4, params);

    return {
      theta1: state.theta1 + (k1.dtheta1 + 2*k2.dtheta1 + 2*k3.dtheta1 + k4.dtheta1) * dt / 6,
      theta2: state.theta2 + (k1.dtheta2 + 2*k2.dtheta2 + 2*k3.dtheta2 + k4.dtheta2) * dt / 6,
      omega1: state.omega1 + (k1.domega1 + 2*k2.domega1 + 2*k3.domega1 + k4.domega1) * dt / 6,
      omega2: state.omega2 + (k1.domega2 + 2*k2.domega2 + 2*k3.domega2 + k4.domega2) * dt / 6,
    };
  }, [derivatives]);

  // Позиции грузов
  const getPositions = useCallback((state: PendulumState, params: PendulumParams) => {
    const { theta1, theta2 } = state;
    const { L1, L2 } = params;

    const x1 = L1 * Math.sin(theta1);
    const y1 = L1 * Math.cos(theta1);
    const x2 = x1 + L2 * Math.sin(theta2);
    const y2 = y1 + L2 * Math.cos(theta2);

    return { x1, y1, x2, y2 };
  }, []);

  // Энергия системы
  const getEnergy = useCallback((state: PendulumState, params: PendulumParams) => {
    const { theta1, theta2, omega1, omega2 } = state;
    const { L1, L2, m1, m2, g } = params;

    const pos = getPositions(state, params);

    // Кинетическая энергия
    const v1x = L1 * omega1 * Math.cos(theta1);
    const v1y = -L1 * omega1 * Math.sin(theta1);
    const v2x = v1x + L2 * omega2 * Math.cos(theta2);
    const v2y = v1y - L2 * omega2 * Math.sin(theta2);

    const T = 0.5 * m1 * (v1x*v1x + v1y*v1y) + 0.5 * m2 * (v2x*v2x + v2y*v2y);

    // Потенциальная энергия (относительно точки подвеса)
    const U = -m1 * g * pos.y1 - m2 * g * pos.y2;

    return { kinetic: T, potential: U, total: T + U };
  }, [getPositions]);

  // Анимационный цикл
  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const dt = 0.001; // Фиксированный шаг для стабильности
      const steps = Math.floor(deltaTime / dt) || 1;

      trailsRef.current = trailsRef.current.map(trail => {
        let newState = trail.state;
        const newPoints = [...trail.points];

        for (let i = 0; i < steps; i++) {
          newState = step(newState, dt, params);
        }

        // Добавляем точку в след
        const pos = getPositions(newState, params);
        newPoints.push({ x: pos.x2, y: pos.y2 });

        // Ограничиваем длину следа
        const maxPoints = 500;
        while (newPoints.length > maxPoints) {
          newPoints.shift();
        }

        return { ...trail, state: newState, points: newPoints };
      });

      setTrails([...trailsRef.current]);
      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, params, step, getPositions]);

  // Отрисовка
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height * 0.35;
    const scale = Math.min(width, height) / (2.5 * (params.L1 + params.L2));

    // Очистка
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    // Сетка
    ctx.strokeStyle = "rgba(100, 116, 139, 0.1)";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Рисуем следы
    if (showTrail) {
      trails.forEach(trail => {
        if (trail.points.length < 2) return;

        for (let i = 1; i < trail.points.length; i++) {
          const alpha = i / trail.points.length;
          ctx.strokeStyle = `hsla(${trail.hue}, 80%, 60%, ${alpha * 0.8})`;
          ctx.lineWidth = 1 + alpha * 2;

          ctx.beginPath();
          ctx.moveTo(
            centerX + trail.points[i-1].x * scale,
            centerY + trail.points[i-1].y * scale
          );
          ctx.lineTo(
            centerX + trail.points[i].x * scale,
            centerY + trail.points[i].y * scale
          );
          ctx.stroke();
        }
      });
    }

    // Рисуем маятники
    trails.forEach((trail, idx) => {
      const pos = getPositions(trail.state, params);
      const x1Screen = centerX + pos.x1 * scale;
      const y1Screen = centerY + pos.y1 * scale;
      const x2Screen = centerX + pos.x2 * scale;
      const y2Screen = centerY + pos.y2 * scale;

      // Стержни
      ctx.strokeStyle = trails.length === 1 ? "#94a3b8" : `hsl(${trail.hue}, 60%, 70%)`;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x1Screen, y1Screen);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x1Screen, y1Screen);
      ctx.lineTo(x2Screen, y2Screen);
      ctx.stroke();

      // Точка подвеса
      ctx.fillStyle = "#64748b";
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      // Первый груз
      const r1 = 12 + params.m1 * 4;
      ctx.shadowColor = `hsl(${trail.hue}, 80%, 50%)`;
      ctx.shadowBlur = 15;
      ctx.fillStyle = trails.length === 1 ? "#60a5fa" : `hsl(${trail.hue}, 70%, 55%)`;
      ctx.beginPath();
      ctx.arc(x1Screen, y1Screen, r1, 0, Math.PI * 2);
      ctx.fill();

      // Второй груз (с ярким свечением)
      const r2 = 12 + params.m2 * 4;
      ctx.shadowColor = `hsl(${trail.hue}, 100%, 60%)`;
      ctx.shadowBlur = 20;
      ctx.fillStyle = trails.length === 1 ? "#a78bfa" : `hsl(${trail.hue}, 80%, 65%)`;
      ctx.beginPath();
      ctx.arc(x2Screen, y2Screen, r2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });

  }, [trails, params, showTrail, getPositions]);

  // Пресеты
  const presets = [
    { name: "Классика", angle1: 120, angle2: 120 },
    { name: "Симметрия", angle1: 90, angle2: 90 },
    { name: "Хаос", angle1: 170, angle2: 170 },
    { name: "Один вниз", angle1: 45, angle2: 180 },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Двойной маятник"
        description="Хаос из простой механической системы. Чувствительность к начальным условиям."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm text-muted">Симуляция</span>
            <span className="text-xs text-muted">Настрой углы и нажми Старт!</span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-square"
            style={{ background: "#0f172a" }}
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
                    setInitialAngle1(preset.angle1);
                    setInitialAngle2(preset.angle2);
                    const newTrails = initTrails(trailCount, preset.angle1, preset.angle2);
                    setTrails(newTrails);
                    trailsRef.current = newTrails;
                    setIsRunning(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-muted/10 hover:bg-muted/20 text-sm transition-all"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Начальные углы */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Начальные углы</h3>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Угол θ₁</span>
                <span className="font-mono">{initialAngle1}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={initialAngle1}
                onChange={(e) => {
                  const angle = parseInt(e.target.value);
                  setInitialAngle1(angle);
                  if (!isRunning) {
                    const newTrails = initTrails(trailCount, angle, initialAngle2);
                    setTrails(newTrails);
                    trailsRef.current = newTrails;
                  }
                }}
                className="w-full accent-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Угол θ₂</span>
                <span className="font-mono">{initialAngle2}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                step="1"
                value={initialAngle2}
                onChange={(e) => {
                  const angle = parseInt(e.target.value);
                  setInitialAngle2(angle);
                  if (!isRunning) {
                    const newTrails = initTrails(trailCount, initialAngle1, angle);
                    setTrails(newTrails);
                    trailsRef.current = newTrails;
                  }
                }}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          {/* Визуализация */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Визуализация</h3>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Маятники</span>
                <span className="font-mono">{trailCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={trailCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  setTrailCount(count);
                  const newTrails = initTrails(count, initialAngle1, initialAngle2);
                  setTrails(newTrails);
                  trailsRef.current = newTrails;
                  setIsRunning(false);
                }}
                className="w-full accent-accent"
              />
              <p className="text-xs text-muted mt-1">
                Больше маятников = виднее хаос
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showTrail}
                onChange={(e) => setShowTrail(e.target.checked)}
                className="w-4 h-4 rounded accent-accent"
              />
              <span className="text-sm">Показывать след</span>
            </label>
          </div>

          {/* Хаос-демо */}
          <button
            onClick={() => {
              setTrailCount(3);
              const newTrails = initTrails(3, initialAngle1, initialAngle2);
              setTrails(newTrails);
              trailsRef.current = newTrails;
              setIsRunning(true);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
          >
            <Sparkles size={18} />
            Демо хаоса (3 маятника)
          </button>

          {/* Энергия */}
          {trails.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Энергия</h3>
              {(() => {
                const energy = getEnergy(trails[0].state, params);
                const maxEnergy = Math.abs(energy.total) + 1;
                return (
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-orange-400">Кинетическая T</span>
                        <span className="font-mono text-orange-300">{energy.kinetic.toFixed(2)} Дж</span>
                      </div>
                      <div className="h-2 bg-muted/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all duration-75"
                          style={{ width: `${Math.min(100, (energy.kinetic / maxEnergy) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-cyan-400">Потенциальная U</span>
                        <span className="font-mono text-cyan-300">{energy.potential.toFixed(2)} Дж</span>
                      </div>
                      <div className="h-2 bg-muted/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 transition-all duration-75"
                          style={{ width: `${Math.min(100, (Math.abs(energy.potential) / maxEnergy) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted">Полная E (сохраняется!)</span>
                        <span className="font-mono">{energy.total.toFixed(2)} Дж</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Двойной маятник</h3>
              <p className="text-muted text-xs">
                Два стержня соединены шарнирами. Несмотря на простоту, система демонстрирует
                <strong className="text-foreground"> хаотическое поведение</strong> —
                малейшая разница в начальных условиях приводит к совершенно разным траекториям.
              </p>
              <p className="text-muted text-xs">
                <strong>Попробуй:</strong> Запусти 3 маятника с почти одинаковыми углами (разница 0.001°).
                Сначала они будут двигаться вместе, но через ~10-20 секунд разойдутся!
              </p>
              <p className="text-muted text-xs">
                <strong>Энергия:</strong> Полная энергия E = T + U сохраняется (закон сохранения энергии),
                но кинетическая и потенциальная постоянно перетекают друг в друга.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
