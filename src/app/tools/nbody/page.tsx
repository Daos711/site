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

const TRAIL_LENGTH = 150;
const G = 0.5; // Гравитационная постоянная

// Цвет по массе
function getColorByMass(mass: number): string {
  if (mass > 1000) return "#fbbf24"; // Жёлтый - звезда
  if (mass > 100) return "#f97316";  // Оранжевый - большая планета
  if (mass > 20) return "#3b82f6";   // Синий - средняя планета
  if (mass > 5) return "#22c55e";    // Зелёный - малая планета
  return "#a855f7";                   // Фиолетовый - астероид
}

// Пресеты систем
const presets: Preset[] = [
  {
    id: "solar",
    name: "Солнечная",
    description: "Звезда и планеты",
    bodies: [
      { x: 400, y: 300, vx: 0, vy: 0, mass: 2000, radius: 25, color: "#fbbf24" },
      { x: 400, y: 150, vx: 2.5, vy: 0, mass: 10, radius: 6, color: "#3b82f6" },
      { x: 400, y: 80, vx: 3.2, vy: 0, mass: 3, radius: 4, color: "#22c55e" },
      { x: 400, y: 450, vx: -2.0, vy: 0, mass: 25, radius: 8, color: "#f97316" },
      { x: 400, y: 520, vx: -1.7, vy: 0, mass: 15, radius: 7, color: "#ec4899" },
    ],
  },
  {
    id: "binary",
    name: "Двойная звезда",
    description: "Две звезды вращаются вокруг центра масс",
    bodies: [
      { x: 300, y: 300, vx: 0, vy: 1.5, mass: 800, radius: 18, color: "#fbbf24" },
      { x: 500, y: 300, vx: 0, vy: -1.5, mass: 800, radius: 18, color: "#f97316" },
    ],
  },
  {
    id: "figure8",
    name: "Восьмёрка",
    description: "Три тела движутся по форме 8",
    bodies: [
      { x: 400, y: 300, vx: 0, vy: 0, mass: 100, radius: 10, color: "#3b82f6" },
      { x: 300, y: 300, vx: 0, vy: 1.8, mass: 100, radius: 10, color: "#22c55e" },
      { x: 500, y: 300, vx: 0, vy: -1.8, mass: 100, radius: 10, color: "#f97316" },
    ],
  },
  {
    id: "chaos",
    name: "Хаос",
    description: "Случайные тела — непредсказуемое поведение",
    bodies: [], // Генерируется динамически
  },
];

// Генерация хаотичной системы
function generateChaos(): Omit<Body, "trail">[] {
  const bodies: Omit<Body, "trail">[] = [];
  const count = 5 + Math.floor(Math.random() * 5);

  for (let i = 0; i < count; i++) {
    const mass = 20 + Math.random() * 100;
    bodies.push({
      x: 150 + Math.random() * 500,
      y: 100 + Math.random() * 400,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      mass,
      radius: 4 + Math.sqrt(mass) / 2,
      color: getColorByMass(mass),
    });
  }

  return bodies;
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

    const presetBodies = presetId === "chaos" ? generateChaos() : preset.bodies;

    setBodies(presetBodies.map(b => ({
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

    // Звёзды на фоне
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 73.3) % h;
      ctx.fillRect(x, y, 1, 1);
    }

    const currentBodies = bodiesRef.current;

    // Трейлы
    if (showTrails) {
      for (const body of currentBodies) {
        if (body.trail.length < 2) continue;

        ctx.beginPath();
        ctx.moveTo(body.trail[0].x, body.trail[0].y);

        for (let i = 1; i < body.trail.length; i++) {
          ctx.lineTo(body.trail[i].x, body.trail[i].y);
        }

        ctx.strokeStyle = body.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }

    // Тела
    for (const body of currentBodies) {
      // Свечение
      const gradient = ctx.createRadialGradient(
        body.x, body.y, 0,
        body.x, body.y, body.radius * 2
      );
      gradient.addColorStop(0, body.color);
      gradient.addColorStop(0.5, body.color + "80");
      gradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Само тело
      ctx.beginPath();
      ctx.arc(body.x, body.y, body.radius, 0, Math.PI * 2);
      ctx.fillStyle = body.color;
      ctx.fill();
    }
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
