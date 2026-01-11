"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Pause, RotateCcw, Info } from "lucide-react";

// Типы волн
type WaveType = "square" | "sawtooth" | "triangle" | "pulse";

// Коэффициенты Фурье для разных волн
function getFourierCoefficients(
  waveType: WaveType,
  n: number
): { amplitude: number; frequency: number }[] {
  const coefficients: { amplitude: number; frequency: number }[] = [];

  for (let k = 1; k <= n; k++) {
    let amplitude = 0;
    let frequency = k;

    switch (waveType) {
      case "square":
        // Квадратная волна: только нечётные гармоники
        if (k % 2 === 1) {
          amplitude = 4 / (Math.PI * k);
          frequency = k;
        }
        break;

      case "sawtooth":
        // Пилообразная: все гармоники
        amplitude = (2 / Math.PI) * Math.pow(-1, k + 1) / k;
        frequency = k;
        break;

      case "triangle":
        // Треугольная: только нечётные
        if (k % 2 === 1) {
          const sign = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
          amplitude = (8 / (Math.PI * Math.PI)) * sign / (k * k);
          frequency = k;
        }
        break;

      case "pulse":
        // Импульс (узкий)
        amplitude = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.2);
        frequency = k;
        break;
    }

    if (Math.abs(amplitude) > 0.0001) {
      coefficients.push({ amplitude, frequency });
    }
  }

  return coefficients;
}

// Идеальная форма волны
function getIdealWave(waveType: WaveType, t: number): number {
  const normalized = ((t % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  switch (waveType) {
    case "square":
      return normalized < Math.PI ? 1 : -1;
    case "sawtooth":
      return 1 - normalized / Math.PI;
    case "triangle":
      if (normalized < Math.PI / 2) return normalized / (Math.PI / 2);
      if (normalized < (3 * Math.PI) / 2) return 1 - 2 * (normalized - Math.PI / 2) / Math.PI;
      return -1 + (normalized - (3 * Math.PI) / 2) / (Math.PI / 2);
    case "pulse":
      return normalized < Math.PI * 0.4 ? 1 : 0;
    default:
      return 0;
  }
}

const waveNames: Record<WaveType, string> = {
  square: "Квадратная",
  sawtooth: "Пилообразная",
  triangle: "Треугольная",
  pulse: "Импульсная",
};

// Склонение слова "гармоника" по числу
function pluralizeHarmonics(n: number): string {
  const lastTwo = n % 100;
  const lastOne = n % 10;

  if (lastTwo >= 11 && lastTwo <= 19) {
    return `${n} гармоник`;
  }
  if (lastOne === 1) {
    return `${n} гармоника`;
  }
  if (lastOne >= 2 && lastOne <= 4) {
    return `${n} гармоники`;
  }
  return `${n} гармоник`;
}

export default function FourierPage() {
  const [waveType, setWaveType] = useState<WaveType>("square");
  const [harmonics, setHarmonics] = useState(5);
  const [isRunning, setIsRunning] = useState(true);
  const [showIdeal, setShowIdeal] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const waveHistoryRef = useRef<number[]>([]);
  const animationRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Размеры
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width * dpr;
    const height = rect.height * dpr;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      ctx.scale(dpr, dpr);
    }

    const w = rect.width;
    const h = rect.height;

    // Очистка
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);

    const coefficients = getFourierCoefficients(waveType, harmonics);
    const epicycleX = w * 0.2;
    const epicycleY = h * 0.5;
    // Уменьшаем масштаб, чтобы выбросы Гиббса не выходили за границы
    const scale = Math.min(w, h) * 0.12;
    const t = timeRef.current;

    // Рисуем эпициклы
    let x = epicycleX;
    let y = epicycleY;

    ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
    ctx.lineWidth = 1;

    coefficients.forEach(({ amplitude, frequency }, index) => {
      const radius = Math.abs(amplitude) * scale;
      const angle = frequency * t + (amplitude < 0 ? Math.PI : 0);

      // Круг
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Радиус
      const newX = x + radius * Math.cos(angle);
      const newY = y + radius * Math.sin(angle);

      ctx.strokeStyle = `hsla(${200 + index * 30}, 80%, 60%, 0.8)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(newX, newY);
      ctx.stroke();

      // Точка
      ctx.fillStyle = `hsl(${200 + index * 30}, 80%, 60%)`;
      ctx.beginPath();
      ctx.arc(newX, newY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
      ctx.lineWidth = 1;

      x = newX;
      y = newY;
    });

    // Финальная точка (яркая)
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Область графика
    const graphX = w * 0.32;
    const graphWidth = w * 0.63;
    const graphCenterY = h * 0.5;
    // Уменьшаем амплитуду графика, чтобы пики не выходили за границы
    const graphAmplitude = h * 0.28;

    // Линия от эпициклов к графику
    ctx.strokeStyle = "rgba(250, 204, 21, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(graphX, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Добавляем точку в историю
    const waveValue = (y - epicycleY) / scale;
    waveHistoryRef.current.unshift(waveValue);
    if (waveHistoryRef.current.length > graphWidth) {
      waveHistoryRef.current.pop();
    }

    // Идеальная форма (фон)
    if (showIdeal) {
      ctx.strokeStyle = "rgba(255, 100, 100, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < graphWidth; i++) {
        const idealT = t - (i / graphWidth) * Math.PI * 4;
        const idealY = getIdealWave(waveType, idealT);
        const px = graphX + i;
        const py = graphCenterY - idealY * graphAmplitude;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Волна из Фурье
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 3;
    ctx.beginPath();
    waveHistoryRef.current.forEach((value, i) => {
      const px = graphX + i;
      const py = graphCenterY - value * graphAmplitude;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Точка на графике
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(graphX, y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Ось
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(graphX, graphCenterY);
    ctx.lineTo(graphX + graphWidth, graphCenterY);
    ctx.stroke();

    // Легенда
    ctx.font = "12px system-ui";
    ctx.fillStyle = "#22d3ee";
    ctx.fillText("Фурье", graphX + 10, h - 20);
    if (showIdeal) {
      ctx.fillStyle = "rgba(255, 100, 100, 0.7)";
      ctx.fillText("Идеал", graphX + 70, h - 20);
    }
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText(pluralizeHarmonics(coefficients.length), graphX + 130, h - 20);
  }, [waveType, harmonics, showIdeal]);

  // Анимация
  useEffect(() => {
    if (!isRunning) return;

    const animate = () => {
      timeRef.current += 0.03 * speed;
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, speed, render]);

  // Начальный рендер
  useEffect(() => {
    render();
  }, [render]);

  // Сброс при смене волны
  useEffect(() => {
    waveHistoryRef.current = [];
  }, [waveType]);

  const handleReset = () => {
    timeRef.current = 0;
    waveHistoryRef.current = [];
    render();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Ряды Фурье"
        description="Как из вращающихся кругов собираются волны любой формы"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium">{waveNames[waveType]} волна</span>
            <span className="text-xs text-muted">{pluralizeHarmonics(harmonics)}</span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-[16/9]"
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
              className="flex items-center justify-center px-4 py-3 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all"
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

          {/* Тип волны */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Форма волны</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["square", "sawtooth", "triangle", "pulse"] as WaveType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setWaveType(type)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    waveType === type ? "bg-accent/20 text-accent" : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {waveNames[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Гармоники */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Гармоники</span>
              <span className="font-mono">{harmonics}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={harmonics}
              onChange={(e) => setHarmonics(parseInt(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <p className="text-xs text-muted mt-2">
              Больше гармоник = точнее приближение
            </p>
          </div>

          {/* Скорость */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Скорость</span>
              <span className="font-mono">x{speed.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Показать идеал */}
          <label className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card cursor-pointer">
            <input
              type="checkbox"
              checked={showIdeal}
              onChange={(e) => setShowIdeal(e.target.checked)}
              className="w-4 h-4 rounded accent-red-400"
            />
            <div>
              <span className="text-sm">Показать идеальную форму</span>
              <p className="text-xs text-muted">Красная линия — целевая волна</p>
            </div>
          </label>

          {/* Пресеты */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Быстрый выбор</h3>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5, 10, 25, 50].map(n => (
                <button
                  key={n}
                  onClick={() => setHarmonics(n)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    harmonics === n ? "bg-cyan-500/20 text-cyan-400" : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Теорема Фурье</h3>
              <p className="text-xs text-muted">
                Любую периодическую функцию можно представить как сумму синусоид разных частот.
              </p>
              <p className="text-xs text-muted">
                <strong>Эпициклы слева</strong> — каждый круг соответствует одной гармонике.
                Размер круга = амплитуда, скорость = частота.
              </p>
              <p className="text-xs text-muted">
                <strong>Чем больше гармоник</strong>, тем точнее приближение.
                Попробуй 1, потом 5, потом 50 — увидишь как форма становится точнее!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
