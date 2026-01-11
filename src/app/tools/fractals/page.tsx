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
    name: "Классика",
    fn: (iter, maxIter) => {
      if (iter >= maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      // Классическая синяя палитра
      const r = Math.floor(Math.min(255, 4 * (1 - t) * t * t * t * 255 * 9));
      const g = Math.floor(Math.min(255, 15 * (1 - t) * (1 - t) * t * t * 255));
      const b = Math.floor(Math.min(255, 8.5 * (1 - t) * (1 - t) * (1 - t) * t * 255 + 50 * t));
      return [r, g, b];
    }
  },
  {
    name: "Огонь",
    fn: (iter, maxIter) => {
      if (iter >= maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      const r = Math.floor(Math.min(255, t < 0.5 ? t * 2 * 255 : 255));
      const g = Math.floor(Math.max(0, Math.min(255, (t - 0.3) * 2 * 255)));
      const b = Math.floor(Math.max(0, Math.min(255, (t - 0.6) * 2.5 * 255)));
      return [r, g, b];
    }
  },
  {
    name: "Океан",
    fn: (iter, maxIter) => {
      if (iter >= maxIter) return [0, 0, 20];
      const t = iter / maxIter;
      const r = Math.floor(t * t * 100);
      const g = Math.floor(t * 150 + 50);
      const b = Math.floor(180 + t * 75);
      return [r, g, b];
    }
  },
  {
    name: "Радуга",
    fn: (iter, maxIter) => {
      if (iter >= maxIter) return [0, 0, 0];
      const hue = (iter * 10) % 360;
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
      if (iter >= maxIter) return [0, 0, 0];
      const t = iter / maxIter;
      const r = Math.floor(Math.sin(t * 5 + 0) * 127 + 128);
      const g = Math.floor(Math.sin(t * 5 + 2) * 127 + 128);
      const b = Math.floor(Math.sin(t * 5 + 4) * 127 + 128);
      return [r, g, b];
    }
  },
  {
    name: "Ч/Б",
    fn: (iter, maxIter) => {
      if (iter >= maxIter) return [0, 0, 0];
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
  { name: "Морской конёк", type: "mandelbrot", centerX: -0.743643887037151, centerY: 0.131825904205330, zoom: 500 },
  { name: "Спираль", type: "mandelbrot", centerX: -0.761574, centerY: -0.0847596, zoom: 200 },
  { name: "Долина", type: "mandelbrot", centerX: -0.745, centerY: 0.113, zoom: 100 },
  { name: "Жюлиа классика", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.7, y: 0.27015 } },
  { name: "Жюлиа дракон", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.8, y: 0.156 } },
  { name: "Жюлиа кролик", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.123, y: 0.745 } },
  { name: "Burning Ship", type: "burning-ship", centerX: -0.4, centerY: -0.6, zoom: 1 },
  { name: "Tricorn", type: "tricorn", centerX: -0.3, centerY: 0, zoom: 1 },
];

export default function FractalsPage() {
  // Состояние вида
  const [fractalType, setFractalType] = useState<FractalType>("mandelbrot");
  const [colorSchemeIdx, setColorSchemeIdx] = useState(0);
  const [maxIterations, setMaxIterations] = useState(80);
  const [center, setCenter] = useState({ x: -0.5, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [juliaC, setJuliaC] = useState({ x: -0.7, y: 0.27015 });
  const [showInfo, setShowInfo] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [mode, setMode] = useState<"navigate" | "julia">("navigate");

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderIdRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const prevViewRef = useRef({ center: { x: -0.5, y: 0 }, zoom: 1 });

  // Вычисление одной точки фрактала
  const computePoint = useCallback((
    type: FractalType,
    cx: number,
    cy: number,
    jc: { x: number; y: number },
    maxIter: number
  ): number => {
    let zx: number, zy: number;
    let cRe: number, cIm: number;

    if (type === "julia") {
      zx = cx;
      zy = cy;
      cRe = jc.x;
      cIm = jc.y;
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
        default:
          newZx = zx2 - zy2 + cRe;
          newZy = 2 * zx * zy + cIm;
      }

      zx = newZx;
      zy = newZy;
    }

    return maxIter;
  }, []);

  // Основная функция рендеринга
  const renderFractal = useCallback((immediate = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Отменяем предыдущий отложенный рендер
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }

    const doRender = () => {
      const currentRenderId = ++renderIdRef.current;
      setIsRendering(true);

      // Размеры без DPI масштабирования для скорости
      const rect = canvas.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      canvas.width = width;
      canvas.height = height;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Масштаб: при zoom=1 показываем область ~3.5 единиц
      const viewSize = 3.5 / zoom;
      const aspectRatio = width / height;
      const viewWidth = viewSize * (aspectRatio > 1 ? aspectRatio : 1);
      const viewHeight = viewSize * (aspectRatio > 1 ? 1 : 1 / aspectRatio);

      const colorFn = colorSchemes[colorSchemeIdx].fn;

      // Рендерим всё сразу (без чанков для простоты)
      for (let py = 0; py < height; py++) {
        if (currentRenderId !== renderIdRef.current) return;

        for (let px = 0; px < width; px++) {
          const fx = center.x + (px / width - 0.5) * viewWidth;
          const fy = center.y + (py / height - 0.5) * viewHeight;

          const iter = computePoint(fractalType, fx, fy, juliaC, maxIterations);
          const [r, g, b] = colorFn(iter, maxIterations);

          const idx = (py * width + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }

      if (currentRenderId === renderIdRef.current) {
        ctx.putImageData(imageData, 0, 0);
        prevViewRef.current = { center: { ...center }, zoom };
        setIsRendering(false);
      }
    };

    if (immediate) {
      doRender();
    } else {
      // Задержка для накопления изменений
      renderTimeoutRef.current = setTimeout(doRender, 150);
    }
  }, [center, zoom, fractalType, juliaC, maxIterations, colorSchemeIdx, computePoint]);

  // Начальный рендер
  useEffect(() => {
    renderFractal(true);
  }, []);

  // Перерендер при изменении параметров (с задержкой)
  useEffect(() => {
    renderFractal(false);
  }, [center, zoom, fractalType, juliaC, maxIterations, colorSchemeIdx]);

  // Координаты экрана → координаты фрактала
  const screenToFractal = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const px = screenX - rect.left;
    const py = screenY - rect.top;

    const viewSize = 3.5 / zoom;
    const aspectRatio = rect.width / rect.height;
    const viewWidth = viewSize * (aspectRatio > 1 ? aspectRatio : 1);
    const viewHeight = viewSize * (aspectRatio > 1 ? 1 : 1 / aspectRatio);

    return {
      x: center.x + (px / rect.width - 0.5) * viewWidth,
      y: center.y + (py / rect.height - 0.5) * viewHeight,
    };
  }, [center, zoom]);

  // Обработка клика
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) return;

    if (mode === "julia" && fractalType === "mandelbrot") {
      const fractalCoords = screenToFractal(e.clientX, e.clientY);
      setJuliaC(fractalCoords);
      setFractalType("julia");
      setCenter({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [mode, fractalType, screenToFractal]);

  // Зум колёсиком
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const fractalCoords = screenToFractal(e.clientX, e.clientY);
    const zoomFactor = e.deltaY < 0 ? 1.3 : 1 / 1.3;
    const newZoom = Math.max(0.5, Math.min(1000000, zoom * zoomFactor));

    // Зумим к точке под курсором
    const newCenterX = fractalCoords.x + (center.x - fractalCoords.x) / zoomFactor;
    const newCenterY = fractalCoords.y + (center.y - fractalCoords.y) / zoomFactor;

    setZoom(newZoom);
    setCenter({ x: newCenterX, y: newCenterY });
  }, [zoom, center, screenToFractal]);

  // Перетаскивание
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const viewSize = 3.5 / zoom;
      const aspectRatio = rect.width / rect.height;
      const viewWidth = viewSize * (aspectRatio > 1 ? aspectRatio : 1);
      const viewHeight = viewSize * (aspectRatio > 1 ? 1 : 1 / aspectRatio);

      const deltaX = (dx / rect.width) * viewWidth;
      const deltaY = (dy / rect.height) * viewHeight;

      setCenter(c => ({
        x: c.x - deltaX,
        y: c.y - deltaY,
      }));
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 10);
  };

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = false;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;

      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const viewSize = 3.5 / zoom;
        const aspectRatio = rect.width / rect.height;
        const viewWidth = viewSize * (aspectRatio > 1 ? aspectRatio : 1);
        const viewHeight = viewSize * (aspectRatio > 1 ? 1 : 1 / aspectRatio);

        const deltaX = (dx / rect.width) * viewWidth;
        const deltaY = (dy / rect.height) * viewHeight;

        setCenter(c => ({
          x: c.x - deltaX,
          y: c.y - deltaY,
        }));
      }

      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  // Пресет
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
      setCenter({ x: -0.4, y: -0.6 });
    } else if (fractalType === "tricorn") {
      setCenter({ x: -0.3, y: 0 });
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
        description="Бесконечная сложность из простых формул. Колёсико = зум, перетаскивание = навигация."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Canvas */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{fractalNames[fractalType]}</span>
              {isRendering && (
                <span className="text-xs text-yellow-400 animate-pulse">рендеринг...</span>
              )}
            </div>
            <span className="text-xs text-muted font-mono">
              x{zoom >= 1000 ? (zoom / 1000).toFixed(1) + "k" : zoom.toFixed(1)}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-square cursor-crosshair"
            style={{ touchAction: "none", background: "#000", imageRendering: "pixelated" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleClick}
            onWheel={handleWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          />
        </div>

        {/* Управление */}
        <div className="space-y-4">
          {/* Кнопки */}
          <div className="flex gap-2">
            <button
              onClick={() => setZoom(z => Math.min(1000000, z * 2))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 transition-all"
            >
              <ZoomIn size={18} />
              x2
            </button>
            <button
              onClick={() => setZoom(z => Math.max(0.5, z / 2))}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-muted/10 text-muted hover:bg-muted/20 transition-all"
            >
              <ZoomOut size={18} />
              /2
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
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Тип</h3>
            <div className="grid grid-cols-2 gap-2">
              {(["mandelbrot", "julia", "burning-ship", "tricorn"] as FractalType[]).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setFractalType(type);
                    if (type === "julia") setCenter({ x: 0, y: 0 });
                    else if (type === "burning-ship") setCenter({ x: -0.4, y: -0.6 });
                    else if (type === "tricorn") setCenter({ x: -0.3, y: 0 });
                    else setCenter({ x: -0.5, y: 0 });
                    setZoom(1);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm transition-all ${
                    fractalType === type ? "bg-accent/20 text-accent" : "bg-muted/10 hover:bg-muted/20"
                  }`}
                >
                  {fractalNames[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Режим клика для Мандельброта */}
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
                  Кликни на точку, чтобы увидеть соответствующее множество Жюлиа
                </p>
              )}
            </div>
          )}

          {/* Параметр c для Жюлиа */}
          {fractalType === "julia" && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Параметр c</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Re(c)</span>
                    <span className="font-mono text-xs">{juliaC.x.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.01"
                    value={juliaC.x}
                    onChange={(e) => setJuliaC(c => ({ ...c, x: parseFloat(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted">Im(c)</span>
                    <span className="font-mono text-xs">{juliaC.y.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.01"
                    value={juliaC.y}
                    onChange={(e) => setJuliaC(c => ({ ...c, y: parseFloat(e.target.value) }))}
                    className="w-full accent-pink-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Цвета */}
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
                    colorSchemeIdx === idx ? "bg-accent/20 text-accent" : "bg-muted/10 hover:bg-muted/20"
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
              min="30"
              max="300"
              step="10"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-xs text-muted mt-1">
              Больше = детальнее при глубоком зуме
            </p>
          </div>

          {/* Пресеты */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <h3 className="font-medium text-sm text-muted uppercase tracking-wide mb-3">Интересные места</h3>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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
              <h3 className="font-medium text-accent">Формулы</h3>
              <div className="space-y-2 text-xs text-muted">
                <p><strong>Мандельброт:</strong> z → z² + c</p>
                <p><strong>Жюлиа:</strong> z → z² + c (c фиксировано)</p>
                <p><strong>Burning Ship:</strong> z → (|Re(z)| + i|Im(z)|)² + c</p>
                <p><strong>Tricorn:</strong> z → conj(z)² + c</p>
              </div>
              <p className="text-muted text-xs">
                Цвет точки = скорость «убегания» z в бесконечность.
                Чёрные точки — множество (z не убегает).
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
