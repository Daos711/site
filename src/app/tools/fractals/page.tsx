"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Palette,
  MousePointer
} from "lucide-react";

// Типы фракталов
type FractalType = "mandelbrot" | "julia" | "burning-ship" | "tricorn";

// Цветовые схемы (индексы для шейдера)
const colorSchemes = [
  { name: "Классика", id: 0 },
  { name: "Огонь", id: 1 },
  { name: "Океан", id: 2 },
  { name: "Радуга", id: 3 },
  { name: "Электро", id: 4 },
  { name: "Ультра", id: 5 },
];

// Пресеты
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
  { name: "Морской конёк", type: "mandelbrot", centerX: -0.743643887037151, centerY: 0.131825904205330, zoom: 2000 },
  { name: "Спираль", type: "mandelbrot", centerX: -0.761574, centerY: -0.0847596, zoom: 500 },
  { name: "Долина слонов", type: "mandelbrot", centerX: 0.275, centerY: 0.0, zoom: 50 },
  { name: "Жюлиа ⚡", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.7, y: 0.27015 } },
  { name: "Жюлиа 🐉", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.8, y: 0.156 } },
  { name: "Жюлиа 🌀", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: 0.285, y: 0.01 } },
  { name: "Жюлиа ❄️", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.4, y: 0.6 } },
  { name: "Burning Ship", type: "burning-ship", centerX: -0.4, centerY: -0.6, zoom: 1 },
  { name: "Tricorn", type: "tricorn", centerX: -0.3, centerY: 0, zoom: 1 },
];

// Вершинный шейдер
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Фрагментный шейдер с фракталами
const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_zoom;
  uniform int u_maxIter;
  uniform int u_fractalType; // 0=mandelbrot, 1=julia, 2=burning-ship, 3=tricorn
  uniform vec2 u_juliaC;
  uniform int u_colorScheme;

  vec3 palette(float t, int scheme) {
    if (scheme == 0) {
      // Классика — синяя
      return vec3(
        9.0 * (1.0 - t) * t * t * t,
        15.0 * (1.0 - t) * (1.0 - t) * t * t,
        8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t + 0.2 * t
      );
    } else if (scheme == 1) {
      // Огонь
      return vec3(
        min(1.0, t * 2.0),
        max(0.0, min(1.0, (t - 0.3) * 2.5)),
        max(0.0, min(1.0, (t - 0.6) * 3.0))
      );
    } else if (scheme == 2) {
      // Океан
      return vec3(
        t * t * 0.3,
        0.2 + t * 0.6,
        0.5 + t * 0.5
      );
    } else if (scheme == 3) {
      // Радуга
      return vec3(
        sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
        sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
        sin(t * 6.28318 + 4.188) * 0.5 + 0.5
      );
    } else if (scheme == 4) {
      // Электро
      return vec3(
        sin(t * 10.0) * 0.5 + 0.5,
        sin(t * 10.0 + 2.0) * 0.5 + 0.5,
        sin(t * 10.0 + 4.0) * 0.5 + 0.5
      );
    } else {
      // Ультра — высокий контраст
      float h = mod(t * 5.0, 1.0);
      float s = 1.0;
      float v = 1.0;
      vec3 c = vec3(h * 6.0);
      c = abs(mod(c - vec3(3.0, 2.0, 4.0), 6.0) - 3.0) - 1.0;
      c = clamp(c, 0.0, 1.0);
      return v * mix(vec3(1.0), c, s);
    }
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;

    float aspect = u_resolution.x / u_resolution.y;
    float scale = 3.0 / u_zoom;

    vec2 c;
    c.x = u_center.x + (uv.x - 0.5) * scale * aspect;
    c.y = u_center.y + (uv.y - 0.5) * scale;

    vec2 z;
    vec2 juliaC = u_juliaC;

    if (u_fractalType == 1) {
      // Julia
      z = c;
      c = juliaC;
    } else {
      z = vec2(0.0);
    }

    float iter = 0.0;
    float maxIter = float(u_maxIter);

    for (int i = 0; i < 1000; i++) {
      if (i >= u_maxIter) break;

      float x2 = z.x * z.x;
      float y2 = z.y * z.y;

      if (x2 + y2 > 4.0) break;

      vec2 newZ;

      if (u_fractalType == 2) {
        // Burning Ship
        newZ = vec2(x2 - y2 + c.x, 2.0 * abs(z.x * z.y) + c.y);
      } else if (u_fractalType == 3) {
        // Tricorn
        newZ = vec2(x2 - y2 + c.x, -2.0 * z.x * z.y + c.y);
      } else {
        // Mandelbrot / Julia
        newZ = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
      }

      z = newZ;
      iter += 1.0;
    }

    if (iter >= maxIter) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      // Smooth coloring
      float log_zn = log(z.x * z.x + z.y * z.y) / 2.0;
      float nu = log(log_zn / log(2.0)) / log(2.0);
      iter = iter + 1.0 - nu;

      float t = iter / maxIter;
      vec3 color = palette(t, u_colorScheme);
      gl_FragColor = vec4(color, 1.0);
    }
  }
`;

export default function FractalsPage() {
  // Состояние
  const [fractalType, setFractalType] = useState<FractalType>("mandelbrot");
  const [colorSchemeIdx, setColorSchemeIdx] = useState(0);
  const [maxIterations, setMaxIterations] = useState(150);
  const [center, setCenter] = useState({ x: -0.5, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [juliaC, setJuliaC] = useState({ x: -0.7, y: 0.27015 });
  const [showInfo, setShowInfo] = useState(false);
  const [mode, setMode] = useState<"navigate" | "julia">("navigate");
  const [glSupported, setGlSupported] = useState(true);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Инициализация WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      setGlSupported(false);
      return;
    }
    glRef.current = gl as WebGLRenderingContext;

    // Компиляция шейдеров
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Программа
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);
    programRef.current = program;

    // Вершины (полноэкранный квад)
    const vertices = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    return () => {
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  // Рендеринг
  const render = useCallback(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas) return;

    // Размер canvas
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width * dpr);
    const height = Math.floor(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    // Uniforms
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
    gl.uniform2f(gl.getUniformLocation(program, "u_center"), center.x, center.y);
    gl.uniform1f(gl.getUniformLocation(program, "u_zoom"), zoom);
    gl.uniform1i(gl.getUniformLocation(program, "u_maxIter"), maxIterations);

    const fractalTypeMap: Record<FractalType, number> = {
      "mandelbrot": 0,
      "julia": 1,
      "burning-ship": 2,
      "tricorn": 3,
    };
    gl.uniform1i(gl.getUniformLocation(program, "u_fractalType"), fractalTypeMap[fractalType]);
    gl.uniform2f(gl.getUniformLocation(program, "u_juliaC"), juliaC.x, juliaC.y);
    gl.uniform1i(gl.getUniformLocation(program, "u_colorScheme"), colorSchemes[colorSchemeIdx].id);

    // Рисуем
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [center, zoom, fractalType, juliaC, maxIterations, colorSchemeIdx]);

  // Перерендер при изменении параметров
  useEffect(() => {
    render();
  }, [render]);

  // Координаты экрана → фрактала
  const screenToFractal = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const px = screenX - rect.left;
    const py = screenY - rect.top;

    const scale = 3.0 / zoom;
    const aspect = rect.width / rect.height;

    return {
      x: center.x + (px / rect.width - 0.5) * scale * aspect,
      y: center.y + (1 - py / rect.height - 0.5) * scale, // Y перевёрнут
    };
  }, [center, zoom]);

  // Обработка клика
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current) return;

    if (mode === "julia" && fractalType === "mandelbrot") {
      const coords = screenToFractal(e.clientX, e.clientY);
      setJuliaC(coords);
      setFractalType("julia");
      setCenter({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [mode, fractalType, screenToFractal]);

  // Зум колёсиком
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const coords = screenToFractal(e.clientX, e.clientY);
    const factor = e.deltaY < 0 ? 1.2 : 1 / 1.2;
    const newZoom = Math.max(0.5, Math.min(100000000, zoom * factor));

    setCenter({
      x: coords.x + (center.x - coords.x) / factor,
      y: coords.y + (center.y - coords.y) / factor,
    });
    setZoom(newZoom);
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
      const scale = 3.0 / zoom;
      const aspect = rect.width / rect.height;

      setCenter(c => ({
        x: c.x - (dx / rect.width) * scale * aspect,
        y: c.y + (dy / rect.height) * scale,
      }));
    }

    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setTimeout(() => { isDraggingRef.current = false; }, 10);
  };

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = false;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;

    const dx = e.touches[0].clientX - lastMouseRef.current.x;
    const dy = e.touches[0].clientY - lastMouseRef.current.y;
    isDraggingRef.current = true;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scale = 3.0 / zoom;
    const aspect = rect.width / rect.height;

    setCenter(c => ({
      x: c.x - (dx / rect.width) * scale * aspect,
      y: c.y + (dy / rect.height) * scale,
    }));

    lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  // Пресет
  const applyPreset = (preset: Preset) => {
    setFractalType(preset.type);
    setCenter({ x: preset.centerX, y: preset.centerY });
    setZoom(preset.zoom);
    if (preset.juliaC) setJuliaC(preset.juliaC);
  };

  // Сброс
  const handleReset = () => {
    if (fractalType === "julia") setCenter({ x: 0, y: 0 });
    else if (fractalType === "burning-ship") setCenter({ x: -0.4, y: -0.6 });
    else if (fractalType === "tricorn") setCenter({ x: -0.3, y: 0 });
    else setCenter({ x: -0.5, y: 0 });
    setZoom(1);
  };

  const fractalNames: Record<FractalType, string> = {
    mandelbrot: "Мандельброт",
    julia: "Жюлиа",
    "burning-ship": "Burning Ship",
    tricorn: "Tricorn",
  };

  if (!glSupported) {
    return (
      <div className="max-w-6xl mx-auto">
        <PageHeader title="Фракталы" description="WebGL не поддерживается вашим браузером" />
        <div className="p-8 text-center text-muted">
          Для просмотра фракталов нужен браузер с поддержкой WebGL.
        </div>
      </div>
    );
  }

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
            <span className="text-sm font-medium">{fractalNames[fractalType]}</span>
            <span className="text-xs text-muted font-mono">
              x{zoom >= 1000000 ? (zoom / 1000000).toFixed(1) + "M" : zoom >= 1000 ? (zoom / 1000).toFixed(1) + "k" : zoom.toFixed(1)}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            className="w-full aspect-square cursor-crosshair"
            style={{ touchAction: "none" }}
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
              onClick={() => setZoom(z => Math.min(100000000, z * 2))}
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

          {/* Тип */}
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
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer size={16} className="text-purple-400" />
                <h3 className="font-medium text-sm text-purple-400">Исследуй связь!</h3>
              </div>
              <p className="text-xs text-muted mb-3">
                Каждая точка Мандельброта порождает уникальное множество Жюлиа.
              </p>
              <button
                onClick={() => setMode(m => m === "julia" ? "navigate" : "julia")}
                className={`w-full px-3 py-2 rounded-lg text-sm transition-all ${
                  mode === "julia" ? "bg-purple-500/20 text-purple-400" : "bg-muted/10 hover:bg-muted/20"
                }`}
              >
                {mode === "julia" ? "✓ Кликни на фрактал" : "Включить выбор Жюлиа"}
              </button>
            </div>
          )}

          {/* Параметр c для Жюлиа */}
          {fractalType === "julia" && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <h3 className="font-medium text-sm text-muted uppercase tracking-wide">Параметр c = {juliaC.x.toFixed(3)} + {juliaC.y.toFixed(3)}i</h3>
              <div className="space-y-3">
                <div>
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
              <p className="text-xs text-muted">
                Попробуй пресеты Жюлиа внизу — они показывают самые красивые значения c
              </p>
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
              <span className="text-muted">Детализация</span>
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
              <h3 className="font-medium text-accent">Как это работает?</h3>
              <p className="text-xs text-muted">
                Для каждой точки (x, y) проверяем: останется ли последовательность
                z → z² + c ограниченной? Цвет = скорость "убегания" в бесконечность.
              </p>
              <p className="text-xs text-muted">
                <strong>Мандельброт:</strong> c = точка, z₀ = 0<br/>
                <strong>Жюлиа:</strong> z₀ = точка, c фиксировано<br/>
                Каждая точка внутри Мандельброта даёт связное множество Жюлиа!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
