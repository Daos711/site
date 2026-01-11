"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Play, Pause, RotateCcw, Info } from "lucide-react";

// Физические параметры
interface OscillatorParams {
  mass: number;      // масса (кг)
  stiffness: number; // жёсткость пружины (Н/м)
  damping: number;   // коэффициент демпфирования
}

// Состояние системы
interface OscillatorState {
  x: number;  // смещение от положения равновесия
  v: number;  // скорость
  t: number;  // время
}

// История для графиков
interface HistoryPoint {
  t: number;
  x: number;
  v: number;
}

export default function OscillatorPage() {
  // Параметры системы
  const [params, setParams] = useState<OscillatorParams>({
    mass: 1.0,
    stiffness: 20,
    damping: 0.3,
  });

  // Состояние симуляции
  const [state, setState] = useState<OscillatorState>({ x: 0, v: 0, t: 0 });
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [showInfo, setShowInfo] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const stateRef = useRef(state);
  const historyRef = useRef(history);

  // Синхронизация refs
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  // Вычисляемые параметры
  const omega0 = Math.sqrt(params.stiffness / params.mass); // собственная частота
  const gamma = params.damping / (2 * params.mass); // коэффициент затухания
  const dampingRatio = gamma / omega0; // относительное демпфирование

  // Определение режима колебаний
  const getRegime = () => {
    if (dampingRatio < 1) return { name: "Недодемпфированный", color: "#22c55e" };
    if (dampingRatio === 1) return { name: "Критический", color: "#eab308" };
    return { name: "Передемпфированный", color: "#ef4444" };
  };

  const regime = getRegime();

  // Физика: метод Рунге-Кутты 4-го порядка
  const step = useCallback((dt: number) => {
    const { mass: m, stiffness: k, damping: c } = params;
    const { x, v, t } = stateRef.current;

    // Уравнение: m*x'' + c*x' + k*x = 0
    // x' = v
    // v' = (-c*v - k*x) / m
    const f = (x: number, v: number) => ({
      dx: v,
      dv: (-c * v - k * x) / m,
    });

    const k1 = f(x, v);
    const k2 = f(x + k1.dx * dt / 2, v + k1.dv * dt / 2);
    const k3 = f(x + k2.dx * dt / 2, v + k2.dv * dt / 2);
    const k4 = f(x + k3.dx * dt, v + k3.dv * dt);

    const newX = x + (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx) * dt / 6;
    const newV = v + (k1.dv + 2 * k2.dv + 2 * k3.dv + k4.dv) * dt / 6;
    const newT = t + dt;

    return { x: newX, v: newV, t: newT };
  }, [params]);

  // Анимационный цикл
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
    lastTimeRef.current = timestamp;

    if (!isDragging) {
      // Несколько шагов физики для стабильности
      const steps = 4;
      let newState = stateRef.current;
      for (let i = 0; i < steps; i++) {
        newState = step(deltaTime / steps);
        stateRef.current = newState;
      }

      setState(newState);

      // Добавляем точку в историю
      const newHistory = [...historyRef.current, { t: newState.t, x: newState.x, v: newState.v }];
      // Ограничиваем историю последними 10 секундами
      const maxHistory = 600;
      if (newHistory.length > maxHistory) {
        newHistory.shift();
      }
      setHistory(newHistory);
      historyRef.current = newHistory;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [step, isDragging]);

  // Запуск/остановка анимации
  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isRunning, animate]);

  // Сброс симуляции
  const reset = () => {
    setIsRunning(false);
    setState({ x: 0, v: 0, t: 0 });
    setHistory([]);
    stateRef.current = { x: 0, v: 0, t: 0 };
    historyRef.current = [];
  };

  // Отрисовка основного canvas (пружина + груз)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const anchorY = 40;
    const equilibriumY = height / 2;
    const scale = 80; // пикселей на единицу смещения

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Фон с градиентом
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, "rgba(15, 23, 42, 0.8)");
    bgGradient.addColorStop(1, "rgba(15, 23, 42, 0.95)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Сетка
    ctx.strokeStyle = "rgba(100, 116, 139, 0.1)";
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Линия равновесия
    ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, equilibriumY);
    ctx.lineTo(width, equilibriumY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Позиция груза
    const massY = equilibriumY + state.x * scale;
    const massRadius = 25 + params.mass * 5;

    // Крепление наверху
    ctx.fillStyle = "#64748b";
    ctx.fillRect(centerX - 40, 0, 80, 20);
    ctx.fillStyle = "#475569";
    ctx.fillRect(centerX - 30, 15, 60, 10);

    // Рисуем пружину
    const springCoils = 12;
    const springWidth = 20;
    const springStartY = anchorY;
    const springEndY = massY - massRadius;
    const springLength = springEndY - springStartY;

    ctx.strokeStyle = "#60a5fa";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Свечение пружины
    ctx.shadowColor = "#60a5fa";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(centerX, springStartY);

    for (let i = 0; i <= springCoils; i++) {
      const t = i / springCoils;
      const y = springStartY + t * springLength;
      const xOffset = (i % 2 === 0 ? 1 : -1) * springWidth * (i > 0 && i < springCoils ? 1 : 0);

      if (i === 0) {
        ctx.lineTo(centerX, y);
      } else if (i === springCoils) {
        ctx.lineTo(centerX, y);
      } else {
        ctx.lineTo(centerX + xOffset, y);
      }
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Груз с градиентом и свечением
    const massGradient = ctx.createRadialGradient(
      centerX - massRadius * 0.3,
      massY - massRadius * 0.3,
      0,
      centerX,
      massY,
      massRadius
    );

    // Цвет зависит от скорости
    const speed = Math.abs(state.v);
    const hue = Math.max(200, 280 - speed * 30);
    massGradient.addColorStop(0, `hsl(${hue}, 80%, 70%)`);
    massGradient.addColorStop(0.5, `hsl(${hue}, 70%, 50%)`);
    massGradient.addColorStop(1, `hsl(${hue}, 60%, 30%)`);

    // Свечение груза
    ctx.shadowColor = `hsl(${hue}, 80%, 50%)`;
    ctx.shadowBlur = 20 + speed * 5;

    ctx.beginPath();
    ctx.arc(centerX, massY, massRadius, 0, Math.PI * 2);
    ctx.fillStyle = massGradient;
    ctx.fill();

    // Блик на грузе
    ctx.shadowBlur = 0;
    const highlightGradient = ctx.createRadialGradient(
      centerX - massRadius * 0.4,
      massY - massRadius * 0.4,
      0,
      centerX - massRadius * 0.4,
      massY - massRadius * 0.4,
      massRadius * 0.6
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.beginPath();
    ctx.arc(centerX, massY, massRadius, 0, Math.PI * 2);
    ctx.fillStyle = highlightGradient;
    ctx.fill();

    // Трейл (след движения)
    if (history.length > 1) {
      ctx.globalAlpha = 0.3;
      const trailLength = Math.min(30, history.length);
      for (let i = history.length - trailLength; i < history.length - 1; i++) {
        if (i < 0) continue;
        const alpha = (i - (history.length - trailLength)) / trailLength * 0.5;
        const trailY = equilibriumY + history[i].x * scale;
        const radius = 3 + alpha * 5;

        ctx.beginPath();
        ctx.arc(centerX, trailY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${alpha})`;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // Подписи
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px monospace";
    ctx.textAlign = "right";
    ctx.fillText("x = 0", centerX - 50, equilibriumY + 4);

    // Текущее смещение
    ctx.fillStyle = "#f8fafc";
    ctx.font = "14px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`x = ${state.x.toFixed(3)}`, centerX, height - 20);

  }, [state, params, history]);

  // Отрисовка графика x(t)
  useEffect(() => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 30;

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Фон
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(0, 0, width, height);

    // Оси
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1;

    // Ось X (время)
    ctx.beginPath();
    ctx.moveTo(padding, height / 2);
    ctx.lineTo(width - 10, height / 2);
    ctx.stroke();

    // Ось Y (смещение)
    ctx.beginPath();
    ctx.moveTo(padding, 10);
    ctx.lineTo(padding, height - 10);
    ctx.stroke();

    // Подписи осей
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("t", width - 15, height / 2 + 15);
    ctx.fillText("x(t)", padding + 15, 15);

    // График
    if (history.length > 1) {
      const maxT = Math.max(10, history[history.length - 1]?.t || 10);
      const minT = Math.max(0, maxT - 10);
      const maxX = 2;

      // Градиент для линии
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, "#3b82f6");
      gradient.addColorStop(1, "#60a5fa");

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Свечение
      ctx.shadowColor = "#3b82f6";
      ctx.shadowBlur = 5;

      ctx.beginPath();
      let started = false;

      for (const point of history) {
        if (point.t < minT) continue;

        const px = padding + ((point.t - minT) / (maxT - minT)) * (width - padding - 20);
        const py = height / 2 - (point.x / maxX) * (height / 2 - padding);

        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Текущая точка
      if (history.length > 0) {
        const last = history[history.length - 1];
        const px = padding + ((last.t - minT) / (maxT - minT)) * (width - padding - 20);
        const py = height / 2 - (last.x / maxX) * (height / 2 - padding);

        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#60a5fa";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      }
    }
  }, [history]);

  // Отрисовка фазового портрета
  useEffect(() => {
    const canvas = phaseCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Фон
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fillRect(0, 0, width, height);

    // Сетка
    ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
    ctx.lineWidth = 1;

    // Круги
    for (let r = 30; r < width / 2; r += 30) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Оси
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    ctx.moveTo(10, centerY);
    ctx.lineTo(width - 10, centerY);
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX, height - 10);
    ctx.stroke();

    // Подписи
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("x", width - 15, centerY + 15);
    ctx.fillText("v", centerX + 15, 15);

    // Фазовая траектория
    if (history.length > 1) {
      const scale = 40;

      // Градиент по времени (от старого к новому)
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < history.length; i++) {
        const alpha = i / history.length;
        const prev = history[i - 1];
        const curr = history[i];

        ctx.strokeStyle = `rgba(34, 197, 94, ${alpha * 0.8})`;
        ctx.lineWidth = 1 + alpha * 2;

        ctx.beginPath();
        ctx.moveTo(centerX + prev.x * scale, centerY - prev.v * scale);
        ctx.lineTo(centerX + curr.x * scale, centerY - curr.v * scale);
        ctx.stroke();
      }

      // Текущая точка
      const last = history[history.length - 1];

      // Свечение
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(centerX + last.x * scale, centerY - last.v * scale, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e";
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(centerX + last.x * scale, centerY - last.v * scale, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }, [history]);

  // Обработка перетаскивания груза
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const equilibriumY = canvas.height / 2;
    const scale = 80;
    const massY = equilibriumY + state.x * scale;
    const massRadius = 25 + params.mass * 5;

    // Проверяем, кликнули ли по грузу
    if (Math.abs(mouseY - massY) < massRadius + 20) {
      setIsDragging(true);
      setIsRunning(false);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const equilibriumY = canvas.height / 2;
    const scale = 80;

    // Ограничиваем смещение
    const newX = Math.max(-2, Math.min(2, (mouseY - equilibriumY) / scale));
    setState((prev) => ({ ...prev, x: newX, v: 0 }));
    stateRef.current = { ...stateRef.current, x: newX, v: 0 };
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Автоматически запускаем симуляцию после отпускания
      setHistory([{ t: 0, x: state.x, v: 0 }]);
      historyRef.current = [{ t: 0, x: state.x, v: 0 }];
      setState((prev) => ({ ...prev, t: 0 }));
      stateRef.current = { ...stateRef.current, t: 0 };
      setIsRunning(true);
    }
  };

  // Touch события для мобильных
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>;
    handleCanvasMouseDown(mouseEvent);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>;
    handleCanvasMouseMove(mouseEvent);
  };

  const handleTouchEnd = () => {
    handleCanvasMouseUp();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Осциллятор"
        description="Интерактивная симуляция затухающих колебаний"
      />

      {/* Основной layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Левая колонка: визуализации */}
        <div className="space-y-4">
          {/* Основная анимация */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm text-muted">Пружинный маятник</span>
              <span className="text-xs text-muted">Тяни груз мышкой и отпускай!</span>
            </div>
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Графики */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* График x(t) */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-3 border-b border-border">
                <span className="text-sm text-muted">Смещение x(t)</span>
              </div>
              <canvas
                ref={graphCanvasRef}
                width={300}
                height={180}
                className="w-full"
              />
            </div>

            {/* Фазовый портрет */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="p-3 border-b border-border">
                <span className="text-sm text-muted">Фазовый портрет (x, v)</span>
              </div>
              <canvas
                ref={phaseCanvasRef}
                width={300}
                height={180}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Правая колонка: управление */}
        <div className="space-y-4">
          {/* Кнопки управления */}
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
              onClick={reset}
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

          {/* Параметры */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-4">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Параметры</h3>

            {/* Масса */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Масса m</span>
                <span className="font-mono">{params.mass.toFixed(1)} кг</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={params.mass}
                onChange={(e) => setParams({ ...params, mass: parseFloat(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            {/* Жёсткость */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Жёсткость k</span>
                <span className="font-mono">{params.stiffness.toFixed(0)} Н/м</span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={params.stiffness}
                onChange={(e) => setParams({ ...params, stiffness: parseFloat(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>

            {/* Демпфирование */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted">Демпфирование c</span>
                <span className="font-mono">{params.damping.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.05"
                value={params.damping}
                onChange={(e) => setParams({ ...params, damping: parseFloat(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>
          </div>

          {/* Вычисляемые величины */}
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Характеристики</h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/5">
                <div className="text-muted text-xs mb-1">Собств. частота ω₀</div>
                <div className="font-mono">{omega0.toFixed(2)} рад/с</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/5">
                <div className="text-muted text-xs mb-1">Период T</div>
                <div className="font-mono">{(2 * Math.PI / omega0).toFixed(2)} с</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/5">
                <div className="text-muted text-xs mb-1">Затухание γ</div>
                <div className="font-mono">{gamma.toFixed(3)}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/5">
                <div className="text-muted text-xs mb-1">Демпф. отн. ζ</div>
                <div className="font-mono">{dampingRatio.toFixed(3)}</div>
              </div>
            </div>

            {/* Режим колебаний */}
            <div
              className="p-3 rounded-lg text-center"
              style={{ backgroundColor: `${regime.color}20`, color: regime.color }}
            >
              <div className="text-xs mb-1">Режим колебаний</div>
              <div className="font-medium">{regime.name}</div>
            </div>
          </div>

          {/* Текущее состояние */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Состояние</h3>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <div className="text-blue-400 text-xs mb-1">x</div>
                <div className="font-mono text-blue-300">{state.x.toFixed(3)}</div>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <div className="text-green-400 text-xs mb-1">v</div>
                <div className="font-mono text-green-300">{state.v.toFixed(3)}</div>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <div className="text-purple-400 text-xs mb-1">t</div>
                <div className="font-mono text-purple-300">{state.t.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-2">
              <h3 className="font-medium text-accent">Уравнение движения</h3>
              <p className="font-mono text-xs bg-card/50 p-2 rounded">
                m·x&apos;&apos; + c·x&apos; + k·x = 0
              </p>
              <ul className="text-muted text-xs space-y-1">
                <li><strong>m</strong> — масса груза</li>
                <li><strong>k</strong> — жёсткость пружины</li>
                <li><strong>c</strong> — коэффициент вязкого трения</li>
                <li><strong>ω₀ = √(k/m)</strong> — собственная частота</li>
                <li><strong>ζ = c/(2√(km))</strong> — коэффициент демпфирования</li>
              </ul>
              <p className="text-muted text-xs">
                Фазовый портрет показывает траекторию в пространстве (x, v).
                При затухании траектория — спираль к началу координат.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
