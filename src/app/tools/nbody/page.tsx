"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Pause, RotateCcw, Trash2, Info, Plus } from "lucide-react";

// Тело
type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  radius: number;
  color: string;
  trail: { x: number; y: number }[];
};

// Пресеты
type Preset = {
  id: string;
  name: string;
  description: string;
  bodies: Omit<Body, "trail">[];
};

const TRAIL_LENGTH = 100;
const G = 0.3; // Гравитационная постоянная
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

// Цвет по массе
function getColorByMass(mass: number): string {
  if (mass > 1000) return "#fbbf24"; // Жёлтый - звезда
  if (mass > 100) return "#f97316";  // Оранжевый - большая планета
  if (mass > 20) return "#3b82f6";   // Синий - средняя планета
  if (mass > 5) return "#22c55e";    // Зелёный - малая планета
  return "#a855f7";                   // Фиолетовый - астероид
}

// Вычисление орбитальной скорости для стабильной орбиты
function orbitalVelocity(centerMass: number, distance: number): number {
  return Math.sqrt(G * centerMass / distance) * 0.8;
}

// Пресеты систем
const presets: Preset[] = [
  {
    id: "solar",
    name: "Солнечная",
    description: "Звезда и планеты на стабильных орбитах",
    bodies: [
      { x: 0, y: 0, vx: 0, vy: 0, mass: 3000, radius: 22, color: "#fbbf24" },
      { x: 0, y: -80, vx: orbitalVelocity(3000, 80), vy: 0, mass: 5, radius: 4, color: "#a855f7" },
      { x: 0, y: -130, vx: orbitalVelocity(3000, 130), vy: 0, mass: 10, radius: 5, color: "#3b82f6" },
      { x: 0, y: -190, vx: orbitalVelocity(3000, 190), vy: 0, mass: 20, radius: 7, color: "#22c55e" },
      { x: 0, y: -260, vx: orbitalVelocity(3000, 260), vy: 0, mass: 40, radius: 9, color: "#f97316" },
    ],
  },
  {
    id: "binary",
    name: "Двойная звезда",
    description: "Две звезды на орбите вокруг центра масс",
    bodies: [
      { x: -60, y: 0, vx: 0, vy: -1.2, mass: 1000, radius: 15, color: "#fbbf24" },
      { x: 60, y: 0, vx: 0, vy: 1.2, mass: 1000, radius: 15, color: "#f97316" },
    ],
  },
  {
    id: "trinary",
    name: "Тройная",
    description: "Три звезды — сложная динамика",
    bodies: [
      { x: 0, y: -70, vx: 1.0, vy: 0, mass: 500, radius: 12, color: "#fbbf24" },
      { x: 60, y: 35, vx: -0.5, vy: 0.87, mass: 500, radius: 12, color: "#3b82f6" },
      { x: -60, y: 35, vx: -0.5, vy: -0.87, mass: 500, radius: 12, color: "#22c55e" },
    ],
  },
  {
    id: "moonplanet",
    name: "Планета с луной",
    description: "Звезда, планета и её спутник",
    bodies: [
      { x: 0, y: 0, vx: 0, vy: 0, mass: 3000, radius: 20, color: "#fbbf24" },
      { x: 0, y: -150, vx: orbitalVelocity(3000, 150), vy: 0, mass: 50, radius: 8, color: "#3b82f6" },
      { x: 0, y: -170, vx: orbitalVelocity(3000, 150) + orbitalVelocity(50, 20), vy: 0, mass: 2, radius: 3, color: "#94a3b8" },
    ],
  },
];

// Вычисление центра масс
function getCenterOfMass(bodies: Body[]): { x: number; y: number } {
  if (bodies.length === 0) return { x: 0, y: 0 };

  let totalMass = 0;
  let cx = 0;
  let cy = 0;

  for (const body of bodies) {
    totalMass += body.mass;
    cx += body.x * body.mass;
    cy += body.y * body.mass;
  }

  return { x: cx / totalMass, y: cy / totalMass };
}

// Симуляция одного шага
function simulate(bodies: Body[], dt: number, gravity: number): Body[] {
  const n = bodies.length;
  const newBodies = bodies.map(b => ({
    ...b,
    trail: [...b.trail],
  }));

  // Вычисление сил и ускорений
  for (let i = 0; i < n; i++) {
    let ax = 0;
    let ay = 0;

    for (let j = 0; j < n; j++) {
      if (i === j) continue;

      const dx = newBodies[j].x - newBodies[i].x;
      const dy = newBodies[j].y - newBodies[i].y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);

      // Softening чтобы избежать сингулярности
      const softening = 10;
      const force = (G * gravity * newBodies[j].mass) / (distSq + softening * softening);

      ax += force * dx / dist;
      ay += force * dy / dist;
    }

    newBodies[i].vx += ax * dt;
    newBodies[i].vy += ay * dt;
  }

  // Обновление позиций и трейлов
  for (let i = 0; i < n; i++) {
    newBodies[i].x += newBodies[i].vx * dt;
    newBodies[i].y += newBodies[i].vy * dt;

    // Добавить в трейл
    newBodies[i].trail.push({ x: newBodies[i].x, y: newBodies[i].y });
    if (newBodies[i].trail.length > TRAIL_LENGTH) {
      newBodies[i].trail.shift();
    }
  }

  return newBodies;
}

export default function NBodyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bodies, setBodies] = useState<Body[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [gravity, setGravity] = useState(1);
  const [showTrails, setShowTrails] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("solar");
  const [addMass, setAddMass] = useState(50);

  const animationRef = useRef<number>(0);
  const bodiesRef = useRef<Body[]>([]);

  // Синхронизация ref
  useEffect(() => {
    bodiesRef.current = bodies;
  }, [bodies]);

  // Инициализация
  useEffect(() => {
    loadPreset("solar");
    setIsClient(true);
  }, []);

  // Загрузка пресета
  const loadPreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setBodies(preset.bodies.map(b => ({
      ...b,
      trail: [],
    })));
    setSelectedPreset(presetId);
  }, []);

  // Рендер
  const render = useCallback(() => {
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

    const w = rect.width;
    const h = rect.height;

    // Очистка
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    const currentBodies = bodiesRef.current;

    // Центр масс — камера следит за ним
    const com = getCenterOfMass(currentBodies);
    const offsetX = w / 2 - com.x;
    const offsetY = h / 2 - com.y;

    // Звёзды на фоне (статичные)
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    for (let i = 0; i < 80; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 73.3) % h;
      ctx.fillRect(x, y, 1, 1);
    }

    // Трейлы
    if (showTrails) {
      for (const body of currentBodies) {
        if (body.trail.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(body.trail[0].x + offsetX, body.trail[0].y + offsetY);

        for (let i = 1; i < body.trail.length; i++) {
          ctx.lineTo(body.trail[i].x + offsetX, body.trail[i].y + offsetY);
        }

        ctx.strokeStyle = body.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Тела
    for (const body of currentBodies) {
      const bx = body.x + offsetX;
      const by = body.y + offsetY;

      // Пропускаем тела за пределами экрана
      if (bx < -50 || bx > w + 50 || by < -50 || by > h + 50) continue;

      // Свечение
      const gradient = ctx.createRadialGradient(
        bx, by, 0,
        bx, by, body.radius * 2
      );
      gradient.addColorStop(0, body.color);
      gradient.addColorStop(0.5, body.color + "80");
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(bx, by, body.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Само тело
      ctx.beginPath();
      ctx.arc(bx, by, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();
    }

    // Индикатор центра масс
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();
  }, [showTrails]);

  // Анимация
  useEffect(() => {
    if (!isRunning) {
      render();
      return;
    }

    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = Math.min((time - lastTime) / 16, 3) * speed;
      lastTime = time;

      setBodies(prev => simulate(prev, dt, gravity));
      render();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, speed, gravity, render]);

  // Рендер при изменении тел
  useEffect(() => {
    if (!isRunning) {
      render();
    }
  }, [bodies, isRunning, render]);

  // Клик для добавления тела
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isRunning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Учитываем смещение камеры (центр масс в центре экрана)
    const com = getCenterOfMass(bodies);
    const x = clickX - rect.width / 2 + com.x;
    const y = clickY - rect.height / 2 + com.y;

    const newBody: Body = {
      x,
      y,
      vx: 0,
      vy: 0,
      mass: addMass,
      radius: 4 + Math.sqrt(addMass) / 2,
      color: getColorByMass(addMass),
      trail: [],
    };

    setBodies(prev => [...prev, newBody]);
  };

  // Сброс
  const handleReset = () => {
    cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    loadPreset(selectedPreset);
  };

  // Очистить
  const handleClear = () => {
    cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setBodies([]);
  };

  // Энергия системы (для отображения)
  const totalEnergy = bodies.reduce((sum, b) => {
    const ke = 0.5 * b.mass * (b.vx * b.vx + b.vy * b.vy);
    return sum + ke;
  }, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="N тел"
        description="Гравитационное взаимодействие — орбиты, хаос, танец планет"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">{bodies.length} тел</span>
            <span className="text-xs text-muted">
              Энергия: {totalEnergy.toFixed(0)}
            </span>
          </div>

          {!isClient ? (
            <div className="h-[500px] flex items-center justify-center text-muted text-sm bg-slate-900">
              Загрузка...
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full h-[500px] cursor-crosshair"
              style={{ background: "#0f172a" }}
              onClick={handleCanvasClick}
            />
          )}

          {/* Легенда */}
          <div className="p-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span>Звезда</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Гигант</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Планета</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Малая</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Астероид</span>
            </div>
          </div>
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
              onClick={() => setShowInfo(!showInfo)}
              className={`flex items-center justify-center px-4 py-3 rounded-lg transition-all ${
                showInfo ? "bg-accent/20 text-accent" : "bg-muted/10 text-muted hover:bg-muted/20"
              }`}
            >
              <Info size={18} />
            </button>
          </div>

          {/* Действия */}
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-all"
            >
              <RotateCcw size={16} />
              Сброс
            </button>
            <button
              onClick={handleClear}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              <Trash2 size={16} />
              Очистить
            </button>
          </div>

          {/* Пресеты */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Система</h3>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setIsRunning(false);
                    loadPreset(preset.id);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all text-left ${
                    selectedPreset === preset.id
                      ? "bg-accent/20 text-accent border border-accent/30"
                      : "bg-muted/10 text-muted hover:bg-muted/20"
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Добавить тело */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Масса нового тела</span>
              <span className="font-mono">{addMass}</span>
            </div>
            <input
              type="range"
              min="5"
              max="500"
              value={addMass}
              onChange={(e) => setAddMass(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-xs text-muted mt-2 flex items-center gap-1">
              <Plus size={12} />
              Кликни на холст чтобы добавить тело
            </p>
          </div>

          {/* Скорость */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Скорость</span>
              <span className="font-mono">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Гравитация */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Гравитация</span>
              <span className="font-mono">{gravity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={gravity}
              onChange={(e) => setGravity(parseFloat(e.target.value))}
              className="w-full accent-cyan-500"
            />
          </div>

          {/* Трейлы */}
          <button
            onClick={() => setShowTrails(!showTrails)}
            className={`w-full px-4 py-2 rounded-lg text-sm transition-all ${
              showTrails
                ? "bg-cyan-500/20 text-cyan-400"
                : "bg-muted/10 text-muted hover:bg-muted/20"
            }`}
          >
            {showTrails ? "Трейлы: ВКЛ" : "Трейлы: ВЫКЛ"}
          </button>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Задача N тел</h3>
              <p className="text-xs text-muted">
                Каждое тело притягивает все остальные по закону всемирного тяготения.
                При N &gt; 2 система становится хаотичной — малые изменения приводят к
                совершенно разным траекториям.
              </p>
              <div className="border-t border-border/50 pt-3 mt-3 text-xs text-muted">
                <p>• Кликай на холст чтобы добавить тела</p>
                <p>• Попробуй &quot;Хаос&quot; для случайной системы</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
