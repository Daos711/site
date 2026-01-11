"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Palette,
  Move,
  MousePointer
} from "lucide-react";

// Типы фракталов
type FractalType = "mandelbrot" | "julia" | "burning-ship" | "tricorn";

// Цветовые схемы
interface ColorScheme {
  name: string;
  fn: (iterations: number, maxIter: number) => [number, number, number];
}

const colorSchemes: ColorScheme[] = [
  {
    name: "Космос",
    fn: (iter, maxIter) => {
      if (iter === maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      const r = Math.floor(9 * (1 - t) * t * t * t * 255);
      const g = Math.floor(15 * (1 - t) * (1 - t) * t * t * 255);
      const b = Math.floor(8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255);
      return [r, g, b];
    }
  },
  {
    name: "Огонь",
    fn: (iter, maxIter) => {
      if (iter === maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      const r = Math.floor(Math.min(255, t * 3 * 255));
      const g = Math.floor(Math.max(0, Math.min(255, (t - 0.33) * 3 * 255)));
      const b = Math.floor(Math.max(0, Math.min(255, (t - 0.66) * 3 * 255)));
      return [r, g, b];
    }
  },
  {
    name: "Океан",
    fn: (iter, maxIter) => {
      if (iter === maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      const r = Math.floor(Math.sin(t * Math.PI) * 100);
      const g = Math.floor(Math.sin(t * Math.PI * 2) * 127 + 128);
      const b = Math.floor(Math.cos(t * Math.PI * 0.5) * 127 + 128);
      return [r, g, b];
    }
  },
  {
    name: "Радуга",
    fn: (iter, maxIter) => {
      if (iter === maxIter) return [0, 0, 0];
      const hue = (iter / maxIter) * 360;
      const s = 1, l = 0.5;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((hue / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;
      if (hue < 60) { r = c; g = x; }
      else if (hue < 120) { r = x; g = c; }
      else if (hue < 180) { g = c; b = x; }
      else if (hue < 240) { g = x; b = c; }
      else if (hue < 300) { r = x; b = c; }
      else { r = c; b = x; }
      return [Math.floor((r + m) * 255), Math.floor((g + m) * 255), Math.floor((b + m) * 255)];
    }
  },
  {
    name: "Электро",
    fn: (iter, maxIter) => {
      if (iter === maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      const r = Math.floor(Math.sin(t * 5) * 127 + 128);
      const g = Math.floor(Math.sin(t * 7 + 2) * 127 + 128);
      const b = Math.floor(Math.sin(t * 11 + 4) * 127 + 128);
      return [r, g, b];
    }
  },
  {
    name: "Ч/Б",
    fn: (iter, maxIter) => {
      if (iter === maxIter) return [0, 0, 0];
      const v = Math.floor((iter / maxIter) * 255);
      return [v, v, v];
    }
  },
];

// Пресеты интересных мест
interface Preset {
  name: string;
  type: FractalType;
  centerX: number;
  centerY: number;
  zoom: number;
  juliaC?: { x: number; y: number };
}

const presets: Preset[] = [
  { name: "Обзор", type: "mandelbrot", centerX: -0.5, centerY: 0, zoom: 1 },
  { name: "Морской конёк", type: "mandelbrot", centerX: -0.743643887037151, centerY: 0.131825904205330, zoom: 1000 },
  { name: "Спираль", type: "mandelbrot", centerX: -0.761574, centerY: -0.0847596, zoom: 500 },
  { name: "Молния", type: "mandelbrot", centerX: -0.170337, centerY: -1.06506, zoom: 100 },
  { name: "Жюлиа классика", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.7, y: 0.27015 } },
  { name: "Жюлиа дракон", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.8, y: 0.156 } },
  { name: "Жюлиа спираль", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: 0.285, y: 0.01 } },
  { name: "Burning Ship", type: "burning-ship", centerX: -0.5, centerY: -0.5, zoom: 1 },
  { name: "Tricorn", type: "tricorn", centerX: -0.3, centerY: 0, zoom: 1 },
];

export default function FractalsPage() {
  // Состояние
  const [fractalType, setFractalType] = useState<FractalType>("mandelbrot");
  const [colorSchemeIdx, setColorSchemeIdx] = useState(0);
  const [maxIterations, setMaxIterations] = useState(100);
  const [center, setCenter] = useState({ x: -0.5, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [juliaC, setJuliaC] = useState({ x: -0.7, y: 0.27015 });
  const [showInfo, setShowInfo] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [mode, setMode] = useState<"navigate" | "julia">("navigate");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const renderIdRef = useRef(0);

  // Функция вычисления фрактала
  const computeFractal = useCallback((
    type: FractalType,
    cx: number,
    cy: number,
    juliaC: { x: number; y: number },
    maxIter: number
  ): number => {
    let zx: number, zy: number;
    let cRe: number, cIm: number;

    if (type === "julia") {
      zx = cx;
      zy = cy;
      cRe = juliaC.x;
      cIm = juliaC.y;
    } else {
      zx = 0;
      zy = 0;
      cRe = cx;
      cIm = cy;
    }

    for (let i = 0; i < maxIter; i++) {
      const zx2 = zx * zx;
      const zy2 = zy * zy;

      if (zx2 + zy2 > 4) {
        // Smooth coloring
        const log_zn = Math.log(zx2 + zy2) / 2;
        const nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
        return i + 1 - nu;
      }

      let newZx: number, newZy: number;

      switch (type) {
        case "burning-ship":
          newZx = zx2 - zy2 + cRe;
          newZy = 2 * Math.abs(zx * zy) + cIm;
          break;
        case "tricorn":
          newZx = zx2 - zy2 + cRe;
          newZy = -2 * zx * zy + cIm;
          break;
        default: // mandelbrot & julia
          newZx = zx2 - zy2 + cRe;
          newZy = 2 * zx * zy + cIm;
      }

      zx = newZx;
      zy = newZy;
    }

    return maxIter;
  }, []);

  // Рендеринг фрактала с двойной буферизацией
  const renderFractal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentRenderId = ++renderIdRef.current;
    setIsRendering(true);

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // Создаём или переиспользуем буферный canvas
    if (!bufferCanvasRef.current) {
      bufferCanvasRef.current = document.createElement("canvas");
    }
    const bufferCanvas = bufferCanvasRef.current;
    bufferCanvas.width = width;
    bufferCanvas.height = height;
    const bufferCtx = bufferCanvas.getContext("2d");
    if (!bufferCtx) return;

    const imageData = bufferCtx.createImageData(width, height);
    const data = imageData.data;

    const scale = 3 / (zoom * Math.min(width, height));
    const colorFn = colorSchemes[colorSchemeIdx].fn;

    // Рендерим построчно с setTimeout для отзывчивости UI
    let y = 0;
    const renderChunk = () => {
      if (currentRenderId !== renderIdRef.current) return; // Отменён

      const chunkSize = Math.ceil(height / 10);
      const endY = Math.min(y + chunkSize, height);

      for (; y < endY; y++) {
        for (let x = 0; x < width; x++) {
          const cx = center.x + (x - width / 2) * scale;
          const cy = center.y + (y - height / 2) * scale;

          const iter = computeFractal(fractalType, cx, cy, juliaC, maxIterations);
          const [r, g, b] = colorFn(iter, maxIterations);

          const idx = (y * width + x) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      if (y >= height) {
        // Рендеринг завершён — копируем буфер на видимый canvas
        bufferCtx.putImageData(imageData, 0, 0);
        ctx.drawImage(bufferCanvas, 0, 0);
        setIsRendering(false);
      } else {
        setTimeout(renderChunk, 0);
      }
    };

    renderChunk();
  }, [center, zoom, fractalType, juliaC, maxIterations, colorSchemeIdx, computeFractal]);

  // Перерендер при изменении параметров
  useEffect(() => {
    renderFractal();
  }, [renderFractal]);

  // Конвертация координат экрана в координаты фрактала
  const screenToFractal = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const canvasX = (screenX - rect.left) * dpr;
    const canvasY = (screenY - rect.top) * dpr;

    const scale = 3 / (zoom * Math.min(canvas.width, canvas.height));

    return {
      x: center.x + (canvasX - canvas.width / 2) * scale,
      y: center.y + (canvasY - canvas.height / 2) * scale,
    };
  }, [center, zoom]);

  // Обработка клика
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) return;

    const fractalCoords = screenToFractal(e.clientX, e.clientY);

    if (mode === "julia" && fractalType === "mandelbrot") {
      // Выбор параметра c для Жюлиа
      setJuliaC(fractalCoords);
      setFractalType("julia");
      setCenter({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [mode, fractalType, screenToFractal]);

  // Обработка колеса мыши (зум)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const fractalCoords = screenToFractal(e.clientX, e.clientY);
    const zoomFactor = e.deltaY < 0 ? 1.5 : 1 / 1.5;
    const newZoom = zoom * zoomFactor;

    // Зумим к точке под курсором
    const newCenterX = fractalCoords.x + (center.x - fractalCoords.x) / zoomFactor;
    const newCenterY = fractalCoords.y + (center.y - fractalCoords.y) / zoomFactor;

    setZoom(newZoom);
    setCenter({ x: newCenterX, y: newCenterY });
  }, [zoom, center, screenToFractal]);

  // Обработка перетаскивания
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const scale = 3 / (zoom * Math.min(canvas.width * dpr, canvas.height * dpr));

      setCenter(c => ({
        x: c.x - dx * dpr * scale,
        y: c.y - dy * dpr * scale,
      }));
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 10);
  };

  // Touch события
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const dpr = window.devicePixelRatio || 1;
      const scale = 3 / (zoom * Math.min(canvas.width, canvas.height));

      setCenter(c => ({
        x: c.x - dx * dpr * scale,
        y: c.y - dy * dpr * scale,
      }));

      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Применение пресета
  const applyPreset = (preset: Preset) => {
    setFractalType(preset.type);
    setCenter({ x: preset.centerX, y: preset.centerY });
    setZoom(preset.zoom);
    if (preset.juliaC) {
      setJuliaC(preset.juliaC);
    }
  };

  // Сброс
  const handleReset = () => {
    if (fractalType === "julia") {
      setCenter({ x: 0, y: 0 });
    } else if (fractalType === "burning-ship") {
      setCenter({ x: -0.5, y: -0.5 });
    } else {
      setCenter({ x: -0.5, y: 0 });
    }
    setZoom(1);
  };

  const fractalNames: Record<FractalType, string> = {
    mandelbrot: "Мандельброт",
    julia: "Жюлиа",
    "burning-ship": "Burning Ship",
    tricorn: "Tricorn",
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Фракталы"
        description="Бесконечная сложность из простых формул. Зумь колёсиком мыши!"
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{fractalNames[fractalType]}</span>
              {isRendering && (
                <span className="text-xs text-muted animate-pulse">рендеринг...</span>
              )}
            </div>
            <span className="text-xs text-muted font-mono">
              zoom: {zoom.toFixed(zoom > 100 ? 0 : 2)}x
            </span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-square cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none", background: "#000" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          />
        </div>

        {/* Управление */}
        <div className="space-y-4">
          {/* Кнопки зума */}
          <div className="flex gap-2">
            <button
              onClick={() => setZoom(z => z * 2)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all"
            >
              <ZoomIn size={18} />
              Приблизить
            </button>
            <button
              onClick={() => setZoom(z => z / 2)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all"
            >
              <ZoomOut size={18} />
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

          {/* Тип фрактала */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Тип фрактала</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["mandelbrot", "julia", "burning-ship", "tricorn"] as FractalType[]).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFractalType(type);
                    if (type === "julia") {
                      setCenter({ x: 0, y: 0 });
                    } else if (type === "burning-ship") {
                      setCenter({ x: -0.5, y: -0.5 });
                    } else if (type === "tricorn") {
                      setCenter({ x: -0.3, y: 0 });
                    } else {
                      setCenter({ x: -0.5, y: 0 });
                    }
                    setZoom(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    fractalType === type
                      ? "bg-accent/20 text-accent"
                      : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {fractalNames[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Режим для Мандельброта */}
          {fractalType === "mandelbrot" && (
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Режим клика</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMode("navigate")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    mode === "navigate" ? "bg-accent/20 text-accent" : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  <Move size={16} />
                  Навигация
                </button>
                <button
                  onClick={() => setMode("julia")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    mode === "julia" ? "bg-purple-500/20 text-purple-400" : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  <MousePointer size={16} />
                  → Жюлиа
                </button>
              </div>
              {mode === "julia" && (
                <p className="text-xs text-purple-400 mt-2">
                  Кликни на точку Мандельброта, чтобы увидеть соответствующее множество Жюлиа
                </p>
              )}
            </div>
          )}

          {/* Параметр c для Жюлиа */}
          {fractalType === "julia" && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Параметр c</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Re(c)</span>
                    <span className="font-mono text-xs">{juliaC.x.toFixed(4)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.001"
                    value={juliaC.x}
                    onChange={(e) => setJuliaC(c => ({ ...c, x: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Im(c)</span>
                    <span className="font-mono text-xs">{juliaC.y.toFixed(4)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.001"
                    value={juliaC.y}
                    onChange={(e) => setJuliaC(c => ({ ...c, y: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Цветовая схема */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={16} className="text-muted" />
              <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Цвета</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {colorSchemes.map((scheme, idx) => (
                <button
                  key={scheme.name}
                  onClick={() => setColorSchemeIdx(idx)}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    colorSchemeIdx === idx
                      ? "bg-accent/20 text-accent"
                      : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {scheme.name}
                </button>
              ))}
            </div>
          </div>

          {/* Итерации */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted">Итерации</span>
              <span className="font-mono">{maxIterations}</span>
            </div>
            <input
              type="range"
              min="50"
              max="500"
              step="10"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-xs text-muted mt-1">
              Больше = детальнее, но медленнее
            </p>
          </div>

          {/* Пресеты */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Интересные места</h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {presets.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-2 rounded-lg bg-muted/10 hover:bg-muted/20 text-sm transition-all text-left"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Что такое фракталы?</h3>
              <p className="text-muted text-xs">
                <strong>Фракталы</strong> — это геометрические объекты с бесконечной детализацией.
                Как бы глубоко ты ни зумил, всегда видны новые узоры.
              </p>
              <div className="space-y-2 text-xs text-muted">
                <p>
                  <strong>Мандельброт:</strong> z = z² + c, где c — координаты точки.
                  Точка закрашивается по скорости «убегания» z.
                </p>
                <p>
                  <strong>Жюлиа:</strong> та же формула, но c фиксировано, а начальное z — координаты точки.
                  Каждая точка Мандельброта даёт уникальный Жюлиа!
                </p>
                <p>
                  <strong>Burning Ship:</strong> z = (|Re(z)| + i|Im(z)|)² + c.
                  Создаёт образ «горящего корабля».
                </p>
                <p>
                  <strong>Tricorn:</strong> z = conj(z)² + c.
                  «Перевёрнутый» Мандельброт.
                </p>
              </div>
              <p className="text-muted text-xs">
                <strong>Управление:</strong> колёсико — зум, перетаскивание — навигация.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
