"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  Palette,
  MousePointer,
  Gauge,
  Zap,
} from "lucide-react";
import { computeReferenceOrbit, packOrbitForTexture, type ReferenceOrbit } from "./perturbation";

// DEBUG: установить в true чтобы HP шейдер показывал фиолетовый цвет (тест что он работает)
const DEBUG_HP_PURPLE = false;

// Режимы точности
type PrecisionMode = "normal" | "high" | "ultra";

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

// Аналогии масштаба
const scaleAnalogies = [
  { zoom: 1, name: "Земля", icon: "🌍" },
  { zoom: 1e2, name: "Страна", icon: "🗺️" },
  { zoom: 1e3, name: "Город", icon: "🏙️" },
  { zoom: 1e4, name: "Квартал", icon: "🏘️" },
  { zoom: 1e5, name: "Дом", icon: "🏠" },
  { zoom: 1e6, name: "Комната", icon: "🚪" },
  { zoom: 1e7, name: "Муравей", icon: "🐜" },
  { zoom: 1e8, name: "Волос", icon: "〰️" },
  { zoom: 1e9, name: "Клетка", icon: "🧫" },
  { zoom: 1e10, name: "Бактерия", icon: "🦠" },
  { zoom: 1e11, name: "Вирус", icon: "🔬" },
  { zoom: 1e12, name: "Молекула", icon: "⚗️" },
  { zoom: 1e13, name: "Атом", icon: "⚛️" },
  { zoom: 1e14, name: "Ядро", icon: "🔴" },
];

function getScaleAnalogy(zoom: number) {
  for (let i = scaleAnalogies.length - 1; i >= 0; i--) {
    if (zoom >= scaleAnalogies[i].zoom) return scaleAnalogies[i];
  }
  return scaleAnalogies[0];
}

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
  { name: "Глубокий зум", type: "mandelbrot", centerX: -0.7435669, centerY: 0.1314023, zoom: 1e10 },
  { name: "Ultra зум", type: "mandelbrot", centerX: -0.743643887037151, centerY: 0.131825904205330, zoom: 1e15 },
  { name: "Жюлиа ⚡", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.7, y: 0.27015 } },
  { name: "Жюлиа 🐉", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.8, y: 0.156 } },
  { name: "Жюлиа 🌀", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: 0.285, y: 0.01 } },
  { name: "Жюлиа ❄️", type: "julia", centerX: 0, centerY: 0, zoom: 1, juliaC: { x: -0.4, y: 0.6 } },
  { name: "Burning Ship", type: "burning-ship", centerX: -0.4, centerY: -0.6, zoom: 1 },
  { name: "Tricorn", type: "tricorn", centerX: -0.3, centerY: 0, zoom: 1 },
];

// Вершинный шейдер (WebGL1)
const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Вершинный шейдер (WebGL2)
const vertexShaderSourceWebGL2 = `#version 300 es
  in vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Обычный фрагментный шейдер (float precision)
const fragmentShaderSource = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_center;
  uniform float u_zoom;
  uniform int u_maxIter;
  uniform int u_fractalType;
  uniform vec2 u_juliaC;
  uniform int u_colorScheme;

  vec3 palette(float t, int scheme) {
    if (scheme == 0) {
      return vec3(
        9.0 * (1.0 - t) * t * t * t,
        15.0 * (1.0 - t) * (1.0 - t) * t * t,
        8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t + 0.2 * t
      );
    } else if (scheme == 1) {
      return vec3(
        min(1.0, t * 2.0),
        max(0.0, min(1.0, (t - 0.3) * 2.5)),
        max(0.0, min(1.0, (t - 0.6) * 3.0))
      );
    } else if (scheme == 2) {
      return vec3(t * t * 0.3, 0.2 + t * 0.6, 0.5 + t * 0.5);
    } else if (scheme == 3) {
      return vec3(
        sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
        sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
        sin(t * 6.28318 + 4.188) * 0.5 + 0.5
      );
    } else if (scheme == 4) {
      return vec3(
        sin(t * 10.0) * 0.5 + 0.5,
        sin(t * 10.0 + 2.0) * 0.5 + 0.5,
        sin(t * 10.0 + 4.0) * 0.5 + 0.5
      );
    } else {
      float h = mod(t * 5.0, 1.0);
      vec3 c = vec3(h * 6.0);
      c = abs(mod(c - vec3(3.0, 2.0, 4.0), 6.0) - 3.0) - 1.0;
      c = clamp(c, 0.0, 1.0);
      return mix(vec3(1.0), c, 1.0);
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
      z = c;
      c = juliaC;
    } else {
      z = vec2(0.0);
    }

    float iter = 0.0;
    float maxIter = float(u_maxIter);

    for (int i = 0; i < 2000; i++) {
      if (i >= u_maxIter) break;

      float x2 = z.x * z.x;
      float y2 = z.y * z.y;

      if (x2 + y2 > 4.0) break;

      vec2 newZ;

      if (u_fractalType == 2) {
        newZ = vec2(x2 - y2 + c.x, 2.0 * abs(z.x * z.y) + c.y);
      } else if (u_fractalType == 3) {
        newZ = vec2(x2 - y2 + c.x, -2.0 * z.x * z.y + c.y);
      } else {
        newZ = vec2(x2 - y2 + c.x, 2.0 * z.x * z.y + c.y);
      }

      z = newZ;
      iter += 1.0;
    }

    if (iter >= maxIter) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      float magSq = z.x * z.x + z.y * z.y;
      // Safety clamps для log
      float log_zn = log(max(magSq, 1.0)) / 2.0;
      float nu = log(max(log_zn / log(2.0), 1.0)) / log(2.0);
      float smoothIter = iter + 1.0 - nu;
      // ФИКСИРОВАННАЯ шкала - НЕ зависит от maxIter!
      float t = fract(smoothIter / 100.0);  // Цикл каждые 100 итераций
      vec3 color = palette(t, u_colorScheme);
      gl_FragColor = vec4(color, 1.0);
    }
  }
`;

// High Precision шейдер с Double-Double арифметикой (WebGL1 - Veltkamp-Dekker, без fma)
const fragmentShaderSourceHP_WebGL1 = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_centerHi;
  uniform vec2 u_centerLo;
  uniform vec2 u_scaleHi;
  uniform vec2 u_scaleLo;
  uniform int u_maxIter;
  uniform int u_fractalType;
  uniform vec2 u_juliaCHi;
  uniform vec2 u_juliaCLo;
  uniform int u_colorScheme;

  // ============ Double-Double Arithmetic (Veltkamp-Dekker) ============
  // БЕЗ fma() - работает на всех GPU

  vec2 twoSum(float a, float b) {
    float s = a + b;
    float v = s - a;
    float e = (a - (s - v)) + (b - v);
    return vec2(s, e);
  }

  vec2 quickTwoSum(float a, float b) {
    float s = a + b;
    float e = b - (s - a);
    return vec2(s, e);
  }

  vec2 dd_add(vec2 a, vec2 b) {
    vec2 s = twoSum(a.x, b.x);
    vec2 t = twoSum(a.y, b.y);
    s.y += t.x;
    s = quickTwoSum(s.x, s.y);
    s.y += t.y;
    return quickTwoSum(s.x, s.y);
  }

  vec2 dd_sub(vec2 a, vec2 b) {
    return dd_add(a, vec2(-b.x, -b.y));
  }

  // Veltkamp split - разделяет float на две половины без fma
  // SPLIT = 2^12 + 1 = 4097 для float32 (23 бита мантиссы)
  vec2 split(float a) {
    float c = 4097.0 * a;
    float a_hi = c - (c - a);
    float a_lo = a - a_hi;
    return vec2(a_hi, a_lo);
  }

  vec2 twoProd(float a, float b) {
    float p = a * b;
    vec2 aa = split(a);
    vec2 bb = split(b);
    float err = ((aa.x * bb.x - p) + aa.x * bb.y + aa.y * bb.x) + aa.y * bb.y;
    return vec2(p, err);
  }

  vec2 dd_mul(vec2 a, vec2 b) {
    vec2 p = twoProd(a.x, b.x);
    p.y += a.x * b.y + a.y * b.x;
    return quickTwoSum(p.x, p.y);
  }

  vec2 dd_mul_f(vec2 a, float b) {
    vec2 p = twoProd(a.x, b);
    p.y += a.y * b;
    return quickTwoSum(p.x, p.y);
  }`;

// High Precision шейдер с Double-Double арифметикой (WebGL2 - тот же алгоритм, другой синтаксис)
const fragmentShaderSourceHP_WebGL2_prefix = `#version 300 es
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_centerHi;
  uniform vec2 u_centerLo;
  uniform vec2 u_scaleHi;
  uniform vec2 u_scaleLo;
  uniform int u_maxIter;
  uniform int u_fractalType;
  uniform vec2 u_juliaCHi;
  uniform vec2 u_juliaCLo;
  uniform int u_colorScheme;

  out vec4 fragColor;

  // ============ Double-Double Arithmetic (Veltkamp-Dekker) ============
  // БЕЗ fma() - работает на всех GPU

  vec2 twoSum(float a, float b) {
    float s = a + b;
    float v = s - a;
    float e = (a - (s - v)) + (b - v);
    return vec2(s, e);
  }

  vec2 quickTwoSum(float a, float b) {
    float s = a + b;
    float e = b - (s - a);
    return vec2(s, e);
  }

  vec2 dd_add(vec2 a, vec2 b) {
    vec2 s = twoSum(a.x, b.x);
    vec2 t = twoSum(a.y, b.y);
    s.y += t.x;
    s = quickTwoSum(s.x, s.y);
    s.y += t.y;
    return quickTwoSum(s.x, s.y);
  }

  vec2 dd_sub(vec2 a, vec2 b) {
    return dd_add(a, vec2(-b.x, -b.y));
  }

  // Veltkamp split - разделяет float на две половины без fma
  // SPLIT = 2^12 + 1 = 4097 для float32 (23 бита мантиссы)
  vec2 split(float a) {
    float c = 4097.0 * a;
    float a_hi = c - (c - a);
    float a_lo = a - a_hi;
    return vec2(a_hi, a_lo);
  }

  vec2 twoProd(float a, float b) {
    float p = a * b;
    vec2 aa = split(a);
    vec2 bb = split(b);
    float err = ((aa.x * bb.x - p) + aa.x * bb.y + aa.y * bb.x) + aa.y * bb.y;
    return vec2(p, err);
  }

  vec2 dd_mul(vec2 a, vec2 b) {
    vec2 p = twoProd(a.x, b.x);
    p.y += a.x * b.y + a.y * b.x;
    return quickTwoSum(p.x, p.y);
  }

  vec2 dd_mul_f(vec2 a, float b) {
    vec2 p = twoProd(a.x, b);
    p.y += a.y * b;
    return quickTwoSum(p.x, p.y);
  }`;

// Общая логика main() для HP шейдера (WebGL1 версия)
const fragmentShaderSourceHP_main_WebGL1 = `

  vec3 palette(float t, int scheme) {
    if (scheme == 0) {
      return vec3(
        9.0 * (1.0 - t) * t * t * t,
        15.0 * (1.0 - t) * (1.0 - t) * t * t,
        8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t + 0.2 * t
      );
    } else if (scheme == 1) {
      return vec3(
        min(1.0, t * 2.0),
        max(0.0, min(1.0, (t - 0.3) * 2.5)),
        max(0.0, min(1.0, (t - 0.6) * 3.0))
      );
    } else if (scheme == 2) {
      return vec3(t * t * 0.3, 0.2 + t * 0.6, 0.5 + t * 0.5);
    } else if (scheme == 3) {
      return vec3(
        sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
        sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
        sin(t * 6.28318 + 4.188) * 0.5 + 0.5
      );
    } else if (scheme == 4) {
      return vec3(
        sin(t * 10.0) * 0.5 + 0.5,
        sin(t * 10.0 + 2.0) * 0.5 + 0.5,
        sin(t * 10.0 + 4.0) * 0.5 + 0.5
      );
    } else {
      float h = mod(t * 5.0, 1.0);
      vec3 c = vec3(h * 6.0);
      c = abs(mod(c - vec3(3.0, 2.0, 4.0), 6.0) - 3.0) - 1.0;
      c = clamp(c, 0.0, 1.0);
      return mix(vec3(1.0), c, 1.0);
    }
  }

  void main() {
    // DEBUG: фиолетовая полоса слева для проверки что HP шейдер работает
    if (gl_FragCoord.x < 5.0) {
      gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
      return;
    }

    // DEBUG: тест DD арифметики - красная полоса если twoProd не работает
    vec2 testProd = twoProd(1.0 + 1.0e-7, 1.0 + 1.0e-7);
    // Если fma работает, testProd.y ≈ 2e-14, а не 0
    if (gl_FragCoord.x >= 5.0 && gl_FragCoord.x < 10.0) {
      if (abs(testProd.y) < 1.0e-20) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // КРАСНЫЙ = DD сломан!
      } else {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // ЗЕЛЁНЫЙ = DD работает!
      }
      return;
    }

    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Вычисляем offset в DD для максимальной точности
    // offsetX = (gl_FragCoord.x / resolution.x - 0.5) * aspect
    // Разбиваем на шаги чтобы сохранить точность

    // Шаг 1: gl_FragCoord.x - resolution.x * 0.5 (центрирование в пиксельных координатах)
    float centerPixelX = u_resolution.x * 0.5;
    float centerPixelY = u_resolution.y * 0.5;
    vec2 pixelOffsetX = twoSum(gl_FragCoord.x, -centerPixelX);
    vec2 pixelOffsetY = twoSum(gl_FragCoord.y, -centerPixelY);

    // Шаг 2: делим на resolution и умножаем на aspect (для X)
    // offsetX_DD = pixelOffsetX / resolution.x * aspect = pixelOffsetX * (aspect / resolution.x)
    float scaleFactorX = aspect / u_resolution.x;
    float scaleFactorY = 1.0 / u_resolution.y;

    vec2 offsetX_DD = dd_mul_f(pixelOffsetX, scaleFactorX);
    vec2 offsetY_DD = dd_mul_f(pixelOffsetY, scaleFactorY);

    // scale как DD
    vec2 scaleDD = vec2(u_scaleHi.x, u_scaleLo.x);

    // c.x = centerX + offsetX * scale (всё в DD)
    vec2 cxDD = dd_add(vec2(u_centerHi.x, u_centerLo.x), dd_mul(scaleDD, offsetX_DD));
    // c.y = centerY + offsetY * scale (всё в DD)
    vec2 cyDD = dd_add(vec2(u_centerHi.y, u_centerLo.y), dd_mul(scaleDD, offsetY_DD));

    vec2 zxDD, zyDD;
    vec2 jcxDD = vec2(u_juliaCHi.x, u_juliaCLo.x);
    vec2 jcyDD = vec2(u_juliaCHi.y, u_juliaCLo.y);

    if (u_fractalType == 1) {
      // Julia: z = c, c = juliaC
      zxDD = cxDD;
      zyDD = cyDD;
      cxDD = jcxDD;
      cyDD = jcyDD;
    } else {
      zxDD = vec2(0.0, 0.0);
      zyDD = vec2(0.0, 0.0);
    }

    float iter = 0.0;
    float maxIter = float(u_maxIter);

    for (int i = 0; i < 2000; i++) {
      if (i >= u_maxIter) break;

      // x² и y² в DD
      vec2 x2 = dd_mul(zxDD, zxDD);
      vec2 y2 = dd_mul(zyDD, zyDD);

      // |z|² > 4 ?
      float magSq = x2.x + y2.x;
      if (magSq > 4.0) break;

      vec2 newZxDD, newZyDD;

      if (u_fractalType == 2) {
        // Burning Ship: z = (|Re|, |Im|)² + c
        vec2 absZxDD = zxDD.x < 0.0 ? vec2(-zxDD.x, -zxDD.y) : zxDD;
        vec2 absZyDD = zyDD.x < 0.0 ? vec2(-zyDD.x, -zyDD.y) : zyDD;
        newZxDD = dd_add(dd_sub(x2, y2), cxDD);
        newZyDD = dd_add(dd_mul_f(dd_mul(absZxDD, absZyDD), 2.0), cyDD);
      } else if (u_fractalType == 3) {
        // Tricorn: z = conj(z)² + c
        newZxDD = dd_add(dd_sub(x2, y2), cxDD);
        newZyDD = dd_add(dd_mul_f(dd_mul(zxDD, zyDD), -2.0), cyDD);
      } else {
        // Mandelbrot / Julia: z = z² + c
        newZxDD = dd_add(dd_sub(x2, y2), cxDD);
        newZyDD = dd_add(dd_mul_f(dd_mul(zxDD, zyDD), 2.0), cyDD);
      }

      zxDD = newZxDD;
      zyDD = newZyDD;
      iter += 1.0;
    }

    if (iter >= maxIter) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      // Smooth coloring
      float zx = zxDD.x;
      float zy = zyDD.x;
      float magSq = zx * zx + zy * zy;
      // Safety clamps для log
      float log_zn = log(max(magSq, 1.0)) / 2.0;
      float nu = log(max(log_zn / log(2.0), 1.0)) / log(2.0);
      float smoothIter = iter + 1.0 - nu;
      // ФИКСИРОВАННАЯ шкала - НЕ зависит от maxIter!
      float t = fract(smoothIter / 100.0);  // Цикл каждые 100 итераций
      vec3 color = palette(t, u_colorScheme);
      gl_FragColor = vec4(color, 1.0);
    }
    // DEBUG_MARKER: для теста что HP шейдер включается
  }
`;

// Общая логика main() для HP шейдера (WebGL2 версия - использует fragColor вместо gl_FragColor)
const fragmentShaderSourceHP_main_WebGL2 = `

  vec3 palette(float t, int scheme) {
    if (scheme == 0) {
      return vec3(
        9.0 * (1.0 - t) * t * t * t,
        15.0 * (1.0 - t) * (1.0 - t) * t * t,
        8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t + 0.2 * t
      );
    } else if (scheme == 1) {
      return vec3(
        min(1.0, t * 2.0),
        max(0.0, min(1.0, (t - 0.3) * 2.5)),
        max(0.0, min(1.0, (t - 0.6) * 3.0))
      );
    } else if (scheme == 2) {
      return vec3(t * t * 0.3, 0.2 + t * 0.6, 0.5 + t * 0.5);
    } else if (scheme == 3) {
      return vec3(
        sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
        sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
        sin(t * 6.28318 + 4.188) * 0.5 + 0.5
      );
    } else if (scheme == 4) {
      return vec3(
        sin(t * 10.0) * 0.5 + 0.5,
        sin(t * 10.0 + 2.0) * 0.5 + 0.5,
        sin(t * 10.0 + 4.0) * 0.5 + 0.5
      );
    } else {
      float h = mod(t * 5.0, 1.0);
      vec3 c = vec3(h * 6.0);
      c = abs(mod(c - vec3(3.0, 2.0, 4.0), 6.0) - 3.0) - 1.0;
      c = clamp(c, 0.0, 1.0);
      return mix(vec3(1.0), c, 1.0);
    }
  }

  void main() {
    // DEBUG: фиолетовая полоса слева для проверки что HP шейдер работает
    if (gl_FragCoord.x < 5.0) {
      fragColor = vec4(1.0, 0.0, 1.0, 1.0);
      return;
    }

    // DEBUG: тест DD арифметики - красная полоса если twoProd не работает
    vec2 testProd = twoProd(1.0 + 1.0e-7, 1.0 + 1.0e-7);
    // Если fma работает, testProd.y ≈ 2e-14, а не 0
    if (gl_FragCoord.x >= 5.0 && gl_FragCoord.x < 10.0) {
      if (abs(testProd.y) < 1.0e-20) {
        fragColor = vec4(1.0, 0.0, 0.0, 1.0); // КРАСНЫЙ = DD сломан!
      } else {
        fragColor = vec4(0.0, 1.0, 0.0, 1.0); // ЗЕЛЁНЫЙ = DD работает!
      }
      return;
    }

    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Вычисляем offset в DD для максимальной точности
    // offsetX = (gl_FragCoord.x / resolution.x - 0.5) * aspect
    // Разбиваем на шаги чтобы сохранить точность

    // Шаг 1: gl_FragCoord.x - resolution.x * 0.5 (центрирование в пиксельных координатах)
    float centerPixelX = u_resolution.x * 0.5;
    float centerPixelY = u_resolution.y * 0.5;
    vec2 pixelOffsetX = twoSum(gl_FragCoord.x, -centerPixelX);
    vec2 pixelOffsetY = twoSum(gl_FragCoord.y, -centerPixelY);

    // Шаг 2: делим на resolution и умножаем на aspect (для X)
    // offsetX_DD = pixelOffsetX / resolution.x * aspect = pixelOffsetX * (aspect / resolution.x)
    float scaleFactorX = aspect / u_resolution.x;
    float scaleFactorY = 1.0 / u_resolution.y;

    vec2 offsetX_DD = dd_mul_f(pixelOffsetX, scaleFactorX);
    vec2 offsetY_DD = dd_mul_f(pixelOffsetY, scaleFactorY);

    // scale как DD
    vec2 scaleDD = vec2(u_scaleHi.x, u_scaleLo.x);

    // c.x = centerX + offsetX * scale (всё в DD)
    vec2 cxDD = dd_add(vec2(u_centerHi.x, u_centerLo.x), dd_mul(scaleDD, offsetX_DD));
    // c.y = centerY + offsetY * scale (всё в DD)
    vec2 cyDD = dd_add(vec2(u_centerHi.y, u_centerLo.y), dd_mul(scaleDD, offsetY_DD));

    vec2 zxDD, zyDD;
    vec2 jcxDD = vec2(u_juliaCHi.x, u_juliaCLo.x);
    vec2 jcyDD = vec2(u_juliaCHi.y, u_juliaCLo.y);

    if (u_fractalType == 1) {
      // Julia: z = c, c = juliaC
      zxDD = cxDD;
      zyDD = cyDD;
      cxDD = jcxDD;
      cyDD = jcyDD;
    } else {
      zxDD = vec2(0.0, 0.0);
      zyDD = vec2(0.0, 0.0);
    }

    float iter = 0.0;
    float maxIter = float(u_maxIter);

    for (int i = 0; i < 2000; i++) {
      if (i >= u_maxIter) break;

      // x² и y² в DD
      vec2 x2 = dd_mul(zxDD, zxDD);
      vec2 y2 = dd_mul(zyDD, zyDD);

      // |z|² > 4 ?
      float magSq = x2.x + y2.x;
      if (magSq > 4.0) break;

      vec2 newZxDD, newZyDD;

      if (u_fractalType == 2) {
        // Burning Ship: z = (|Re|, |Im|)² + c
        vec2 absZxDD = zxDD.x < 0.0 ? vec2(-zxDD.x, -zxDD.y) : zxDD;
        vec2 absZyDD = zyDD.x < 0.0 ? vec2(-zyDD.x, -zyDD.y) : zyDD;
        newZxDD = dd_add(dd_sub(x2, y2), cxDD);
        newZyDD = dd_add(dd_mul_f(dd_mul(absZxDD, absZyDD), 2.0), cyDD);
      } else if (u_fractalType == 3) {
        // Tricorn: z = conj(z)² + c
        newZxDD = dd_add(dd_sub(x2, y2), cxDD);
        newZyDD = dd_add(dd_mul_f(dd_mul(zxDD, zyDD), -2.0), cyDD);
      } else {
        // Mandelbrot / Julia: z = z² + c
        newZxDD = dd_add(dd_sub(x2, y2), cxDD);
        newZyDD = dd_add(dd_mul_f(dd_mul(zxDD, zyDD), 2.0), cyDD);
      }

      zxDD = newZxDD;
      zyDD = newZyDD;
      iter += 1.0;
    }

    if (iter >= maxIter) {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
    } else {
      // Smooth coloring
      float zx = zxDD.x;
      float zy = zyDD.x;
      float magSq = zx * zx + zy * zy;
      // Safety clamps для log
      float log_zn = log(max(magSq, 1.0)) / 2.0;
      float nu = log(max(log_zn / log(2.0), 1.0)) / log(2.0);
      float smoothIter = iter + 1.0 - nu;
      // ФИКСИРОВАННАЯ шкала - НЕ зависит от maxIter!
      float t = fract(smoothIter / 100.0);  // Цикл каждые 100 итераций
      vec3 color = palette(t, u_colorScheme);
      fragColor = vec4(color, 1.0);
    }
    // DEBUG_MARKER: для теста что HP шейдер включается
  }
`;

// Собираем полные HP шейдеры
const fragmentShaderSourceHP_WebGL1_full = fragmentShaderSourceHP_WebGL1 + fragmentShaderSourceHP_main_WebGL1;
const fragmentShaderSourceHP_WebGL2_full = fragmentShaderSourceHP_WebGL2_prefix + fragmentShaderSourceHP_main_WebGL2;

// Версия HP шейдера для тестирования (фиолетовый экран)
const fragmentShaderSourceHP_WebGL1_DEBUG = fragmentShaderSourceHP_WebGL1_full.replace(
  '// DEBUG_MARKER: для теста что HP шейдер включается',
  'gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0); // PURPLE TEST'
);
const fragmentShaderSourceHP_WebGL2_DEBUG = fragmentShaderSourceHP_WebGL2_full.replace(
  '// DEBUG_MARKER: для теста что HP шейдер включается',
  'fragColor = vec4(1.0, 0.0, 1.0, 1.0); // PURPLE TEST'
);

// =====================================================
// PERTURBATION SHADER (Ultra mode) - зум до 10^100+
// =====================================================
const fragmentShaderSourcePerturbation = `#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform vec2 u_scaleHi;
uniform vec2 u_scaleLo;
uniform int u_maxIter;
uniform int u_orbitLength;
uniform int u_colorScheme;

uniform sampler2D u_referenceOrbit;  // Текстура с опорной орбитой (R=Zx, G=Zy)

out vec4 fragColor;

// ============ Double-Double Arithmetic (Veltkamp-Dekker) ============
vec2 twoSum(float a, float b) {
  float s = a + b;
  float v = s - a;
  float e = (a - (s - v)) + (b - v);
  return vec2(s, e);
}

vec2 quickTwoSum(float a, float b) {
  float s = a + b;
  float e = b - (s - a);
  return vec2(s, e);
}

vec2 dd_add(vec2 a, vec2 b) {
  vec2 s = twoSum(a.x, b.x);
  vec2 t = twoSum(a.y, b.y);
  s.y += t.x;
  s = quickTwoSum(s.x, s.y);
  s.y += t.y;
  return quickTwoSum(s.x, s.y);
}

vec2 dd_sub(vec2 a, vec2 b) {
  return dd_add(a, vec2(-b.x, -b.y));
}

vec2 split(float a) {
  float c = 4097.0 * a;
  float a_hi = c - (c - a);
  float a_lo = a - a_hi;
  return vec2(a_hi, a_lo);
}

vec2 twoProd(float a, float b) {
  float p = a * b;
  vec2 aa = split(a);
  vec2 bb = split(b);
  float err = ((aa.x * bb.x - p) + aa.x * bb.y + aa.y * bb.x) + aa.y * bb.y;
  return vec2(p, err);
}

vec2 dd_mul(vec2 a, vec2 b) {
  vec2 p = twoProd(a.x, b.x);
  p.y += a.x * b.y + a.y * b.x;
  return quickTwoSum(p.x, p.y);
}

vec2 dd_mul_f(vec2 a, float b) {
  vec2 p = twoProd(a.x, b);
  p.y += a.y * b;
  return quickTwoSum(p.x, p.y);
}

// Получить Z_n из текстуры опорной орбиты
vec2 getRefOrbit(int n) {
  float u = (float(n) + 0.5) / float(u_orbitLength);
  vec4 texel = texture(u_referenceOrbit, vec2(u, 0.5));
  return texel.xy;  // (Zx, Zy)
}

vec3 palette(float t, int scheme) {
  if (scheme == 0) {
    return vec3(
      9.0 * (1.0 - t) * t * t * t,
      15.0 * (1.0 - t) * (1.0 - t) * t * t,
      8.5 * (1.0 - t) * (1.0 - t) * (1.0 - t) * t + 0.2 * t
    );
  } else if (scheme == 1) {
    return vec3(
      min(1.0, t * 2.0),
      max(0.0, min(1.0, (t - 0.3) * 2.5)),
      max(0.0, min(1.0, (t - 0.6) * 3.0))
    );
  } else if (scheme == 2) {
    return vec3(t * t * 0.3, 0.2 + t * 0.6, 0.5 + t * 0.5);
  } else if (scheme == 3) {
    return vec3(
      sin(t * 6.28318 + 0.0) * 0.5 + 0.5,
      sin(t * 6.28318 + 2.094) * 0.5 + 0.5,
      sin(t * 6.28318 + 4.188) * 0.5 + 0.5
    );
  } else if (scheme == 4) {
    return vec3(
      sin(t * 10.0) * 0.5 + 0.5,
      sin(t * 10.0 + 2.0) * 0.5 + 0.5,
      sin(t * 10.0 + 4.0) * 0.5 + 0.5
    );
  } else {
    float h = mod(t * 5.0, 1.0);
    vec3 c = vec3(h * 6.0);
    c = abs(mod(c - vec3(3.0, 2.0, 4.0), 6.0) - 3.0) - 1.0;
    c = clamp(c, 0.0, 1.0);
    return mix(vec3(1.0), c, 1.0);
  }
}

void main() {
  // DEBUG: синяя полоса слева = Perturbation шейдер работает
  if (gl_FragCoord.x < 5.0) {
    fragColor = vec4(0.0, 0.5, 1.0, 1.0);
    return;
  }

  vec2 uv = gl_FragCoord.xy / u_resolution;
  float aspect = u_resolution.x / u_resolution.y;

  // Вычисляем δc для этого пикселя (смещение от центра)
  float offsetX = (uv.x - 0.5) * aspect;
  float offsetY = (uv.y - 0.5);

  vec2 scaleDD = vec2(u_scaleHi.x, u_scaleLo.x);

  // δc в DD для максимальной точности начального смещения
  vec2 dcxDD = dd_mul_f(scaleDD, offsetX);
  vec2 dcyDD = dd_mul_f(scaleDD, offsetY);

  // Начальные значения: δz_0 = δc (для Мандельброта)
  vec2 dzxDD = dcxDD;
  vec2 dzyDD = dcyDD;

  float iter = 0.0;
  float maxIter = float(u_maxIter);
  int orbitLen = u_orbitLength;

  for (int i = 0; i < 4000; i++) {
    if (i >= u_maxIter || i >= orbitLen - 1) break;

    // Получаем Z_n из опорной орбиты
    vec2 Zn = getRefOrbit(i);
    float Zx = Zn.x;
    float Zy = Zn.y;

    // Проверка escape: |Z + δz|² > bailout
    float dzx = dzxDD.x;
    float dzy = dzyDD.x;
    float fullX = Zx + dzx;
    float fullY = Zy + dzy;
    float magSq = fullX * fullX + fullY * fullY;

    if (magSq > 256.0) break;  // Большой bailout для стабильности

    // Perturbation formula:
    // δz_{n+1} = 2·Z_n·δz_n + δz_n² + δc

    // 2·Z_n·δz_n (комплексное умножение)
    vec2 term1_x = dd_mul_f(dzxDD, 2.0 * Zx);
    vec2 term1_y_part = dd_mul_f(dzyDD, 2.0 * Zy);
    vec2 real_2Zdz = dd_sub(term1_x, term1_y_part);

    vec2 term2_x = dd_mul_f(dzyDD, 2.0 * Zx);
    vec2 term2_y = dd_mul_f(dzxDD, 2.0 * Zy);
    vec2 imag_2Zdz = dd_add(term2_x, term2_y);

    // δz_n² (комплексное умножение)
    vec2 dzx2 = dd_mul(dzxDD, dzxDD);
    vec2 dzy2 = dd_mul(dzyDD, dzyDD);
    vec2 dzxy = dd_mul(dzxDD, dzyDD);

    vec2 real_dz2 = dd_sub(dzx2, dzy2);
    vec2 imag_dz2 = dd_add(dzxy, dzxy);  // 2·dzx·dzy

    // δz_{n+1} = 2·Z_n·δz_n + δz_n² + δc
    vec2 newDzxDD = dd_add(dd_add(real_2Zdz, real_dz2), dcxDD);
    vec2 newDzyDD = dd_add(dd_add(imag_2Zdz, imag_dz2), dcyDD);

    dzxDD = newDzxDD;
    dzyDD = newDzyDD;
    iter += 1.0;
  }

  if (iter >= float(orbitLen) - 1.0 || iter >= maxIter - 1.0) {
    // Не сбежало - чёрный
    fragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    // Smooth coloring - ИДЕНТИЧНО обычному шейдеру
    float dzx = dzxDD.x;
    float dzy = dzyDD.x;
    int idx = min(int(iter), orbitLen - 1);
    vec2 Zn = getRefOrbit(idx);
    float fullX = Zn.x + dzx;
    float fullY = Zn.y + dzy;
    float magSq = fullX * fullX + fullY * fullY;

    // Safety clamps для log
    float log_zn = log(max(magSq, 4.0)) / 2.0;
    float nu = log(max(log_zn / log(2.0), 1.0)) / log(2.0);
    float smoothIter = iter + 1.0 - nu;

    // ФИКСИРОВАННАЯ шкала - НЕ зависит от maxIter!
    float t = fract(smoothIter / 100.0);  // Цикл каждые 100 итераций

    vec3 color = palette(t, u_colorScheme);
    fragColor = vec4(color, 1.0);
  }
}
`;

// Упаковка double в (hi, lo) для передачи в шейдер
function packDD(x: number): [number, number] {
  const hi = Math.fround(x);
  const lo = x - hi;  // БЕЗ Math.fround! lo маленькое, float32 хватит при передаче
  return [hi, lo];
}

export default function FractalsPage() {
  // Состояние
  const [fractalType, setFractalType] = useState<FractalType>("mandelbrot");
  const [colorSchemeIdx, setColorSchemeIdx] = useState(0);
  const [maxIterations, setMaxIterations] = useState(200);
  const [center, setCenter] = useState({ x: -0.5, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [juliaC, setJuliaC] = useState({ x: -0.7, y: 0.27015 });
  const [showInfo, setShowInfo] = useState(false);
  const [mode, setMode] = useState<"navigate" | "julia">("navigate");
  const [glSupported, setGlSupported] = useState(true);
  const [autoIterations, setAutoIterations] = useState(true);
  const [precisionMode, setPrecisionMode] = useState<PrecisionMode>("normal");
  const [gpuPrecision, setGpuPrecision] = useState<number | null>(null);
  const [isWebGL2, setIsWebGL2] = useState(false);
  const [orbitLength, setOrbitLength] = useState(0);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const programHPRef = useRef<WebGLProgram | null>(null);
  const programPerturbationRef = useRef<WebGLProgram | null>(null);
  const referenceOrbitTextureRef = useRef<WebGLTexture | null>(null);
  const orbitLengthRef = useRef<number>(0);
  const lastOrbitCenterRef = useRef<{ x: string; y: string } | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Хелпер: режим высокой точности (HP или Ultra)
  const highPrecision = precisionMode === "high" || precisionMode === "ultra";

  // Автоматическое увеличение итераций при зуме
  const effectiveIterations = autoIterations
    ? Math.min(2000, Math.max(200, Math.floor(200 + 50 * Math.log2(zoom))))
    : maxIterations;

  // Лимит зума зависит от режима точности
  const maxZoom = precisionMode === "ultra" ? 1e100 : (precisionMode === "high" ? 1e14 : 1e7);

  // ФИКСИРОВАННАЯ длина орбиты для Ultra режима - НЕ зависит от zoom!
  const FIXED_ORBIT_LENGTH = 2000;

  // Инициализация WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Пробуем WebGL2 сначала (гарантирует настоящий highp)
    let gl = canvas.getContext("webgl2") as WebGLRenderingContext | null;
    let webgl2 = false;
    if (gl) {
      webgl2 = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsWebGL2(true);
    } else {
      gl = canvas.getContext("webgl") as WebGLRenderingContext | null;
      if (!gl) {
        gl = canvas.getContext("experimental-webgl") as WebGLRenderingContext | null;
      }
    }
    if (!gl) {
      setGlSupported(false);
      return;
    }
    glRef.current = gl;

    // Диагностика точности GPU
    const precisionFormat = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (precisionFormat) {
      console.log('Fragment HIGH_FLOAT precision:', precisionFormat.precision, 'bits');
      console.log('WebGL version:', webgl2 ? '2.0' : '1.0');
      setGpuPrecision(precisionFormat.precision);
    }

    // Хелпер для проверки компиляции шейдера
    const compileShader = (type: number, source: string, name: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(`Shader ${name} compile error:`, gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const linkProgram = (vs: WebGLShader, fs: WebGLShader, name: string) => {
      const prog = gl.createProgram()!;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error(`Program ${name} link error:`, gl.getProgramInfoLog(prog));
      }
      return prog;
    };

    // Компиляция стандартного шейдера
    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexShaderSource, "vertex");
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource, "fragment");
    const program = linkProgram(vertexShader, fragmentShader, "standard");
    programRef.current = program;

    // Компиляция High Precision шейдера (разный для WebGL1 и WebGL2)
    let hpVertexSource: string;
    let hpFragmentSource: string;

    if (webgl2) {
      hpVertexSource = vertexShaderSourceWebGL2;
      hpFragmentSource = DEBUG_HP_PURPLE
        ? fragmentShaderSourceHP_WebGL2_DEBUG
        : fragmentShaderSourceHP_WebGL2_full;
      console.log('Using WebGL2 HP shader (GLSL ES 3.0)');
    } else {
      hpVertexSource = vertexShaderSource;
      hpFragmentSource = DEBUG_HP_PURPLE
        ? fragmentShaderSourceHP_WebGL1_DEBUG
        : fragmentShaderSourceHP_WebGL1_full;
      console.log('Using WebGL1 HP shader');
    }

    const vertexShaderHP = compileShader(gl.VERTEX_SHADER, hpVertexSource, "vertexHP");
    const fragmentShaderHP = compileShader(gl.FRAGMENT_SHADER, hpFragmentSource, "fragmentHP");
    const programHP = linkProgram(vertexShaderHP, fragmentShaderHP, "highPrecision");
    programHPRef.current = programHP;
    if (DEBUG_HP_PURPLE) {
      console.log('DEBUG: HP shader compiled with PURPLE TEST mode');
    }

    // Компиляция Perturbation шейдера (только WebGL2)
    if (webgl2) {
      const vertexShaderPert = compileShader(gl.VERTEX_SHADER, vertexShaderSourceWebGL2, "vertexPert");
      const fragmentShaderPert = compileShader(gl.FRAGMENT_SHADER, fragmentShaderSourcePerturbation, "fragmentPert");
      const programPert = linkProgram(vertexShaderPert, fragmentShaderPert, "perturbation");
      programPerturbationRef.current = programPert;
      console.log('Perturbation shader compiled (Ultra mode available)');
    }

    // Вершины (полноэкранный квад)
    const vertices = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1,
    ]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    return () => {
      gl.deleteProgram(program);
      gl.deleteProgram(programHP);
      if (programPerturbationRef.current) {
        gl.deleteProgram(programPerturbationRef.current);
      }
      if (referenceOrbitTextureRef.current) {
        gl.deleteTexture(referenceOrbitTextureRef.current);
      }
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShaderHP);
      gl.deleteShader(fragmentShaderHP);
    };
  }, []);

  // Загрузка опорной орбиты в текстуру GPU
  const uploadReferenceOrbit = useCallback((orbit: ReferenceOrbit) => {
    const gl = glRef.current as WebGL2RenderingContext | null;
    if (!gl) return;

    // Удаляем старую текстуру
    if (referenceOrbitTextureRef.current) {
      gl.deleteTexture(referenceOrbitTextureRef.current);
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Упаковка данных орбиты
    const data = packOrbitForTexture(orbit);
    const width = orbit.zx.length;

    // Загружаем как RGBA32F текстуру (1 пиксель = одна итерация)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA32F,
      width,
      1,
      0,
      gl.RGBA,
      gl.FLOAT,
      data
    );

    // Настройки текстуры: ближайший сосед, без повторения
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    referenceOrbitTextureRef.current = texture;
    orbitLengthRef.current = width;
    setOrbitLength(width);

    console.log(`Reference orbit uploaded: ${width} iterations`);
  }, []);

  // Пересчёт опорной орбиты при переключении в Ultra режим или смене центра
  useEffect(() => {
    if (precisionMode !== "ultra" || fractalType !== "mandelbrot") {
      return;
    }

    // Конвертируем координаты в строки с высокой точностью
    const centerXStr = center.x.toFixed(20);
    const centerYStr = center.y.toFixed(20);

    // Проверяем нужно ли пересчитывать
    const lastCenter = lastOrbitCenterRef.current;
    if (lastCenter && lastCenter.x === centerXStr && lastCenter.y === centerYStr) {
      return; // Центр не изменился
    }

    console.log('Computing reference orbit for center:', centerXStr, centerYStr);
    const startTime = performance.now();

    // ФИКСИРОВАННАЯ длина орбиты - НЕ зависит от zoom/effectiveIterations!
    const orbit = computeReferenceOrbit(centerXStr, centerYStr, FIXED_ORBIT_LENGTH);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    uploadReferenceOrbit(orbit);

    lastOrbitCenterRef.current = { x: centerXStr, y: centerYStr };

    const elapsed = performance.now() - startTime;
    console.log(`Reference orbit computed in ${elapsed.toFixed(0)}ms, escaped: ${orbit.escaped} at iter ${orbit.escapeIter}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precisionMode, center.x, center.y, fractalType, uploadReferenceOrbit]);
  // БЕЗ effectiveIterations! Орбита фиксированной длины

  // Порог для переключения на Perturbation (zoom > 10^12)
  const PERTURBATION_ZOOM_THRESHOLD = 1e12;

  // Рендеринг
  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;

    // Выбор программы в зависимости от режима и zoom
    // Ultra при низком zoom использует HP шейдер для корректных цветов
    // Ultra при глубоком zoom (>10^12) использует Perturbation для бесконечного зума
    let program: WebGLProgram | null;
    const usePerturbation = precisionMode === "ultra" &&
                            zoom >= PERTURBATION_ZOOM_THRESHOLD &&
                            programPerturbationRef.current &&
                            referenceOrbitTextureRef.current;

    if (usePerturbation) {
      program = programPerturbationRef.current;
    } else if (highPrecision) {
      // Ultra при низком zoom или High mode -> HP шейдер
      program = programHPRef.current;
    } else {
      program = programRef.current;
    }

    if (!gl || !program || !canvas) return;

    gl.useProgram(program);

    // Настройка атрибутов
    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

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

    // Общие uniforms
    gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
    gl.uniform1i(gl.getUniformLocation(program, "u_maxIter"), effectiveIterations);

    const fractalTypeMap: Record<FractalType, number> = {
      "mandelbrot": 0,
      "julia": 1,
      "burning-ship": 2,
      "tricorn": 3,
    };
    gl.uniform1i(gl.getUniformLocation(program, "u_fractalType"), fractalTypeMap[fractalType]);
    gl.uniform1i(gl.getUniformLocation(program, "u_colorScheme"), colorSchemes[colorSchemeIdx].id);

    if (usePerturbation) {
      // Ultra mode при глубоком зуме: Perturbation Theory
      const scale = 3.0 / zoom;
      const [scaleHi, scaleLo] = packDD(scale);

      gl.uniform2f(gl.getUniformLocation(program, "u_scaleHi"), scaleHi, 0);
      gl.uniform2f(gl.getUniformLocation(program, "u_scaleLo"), scaleLo, 0);
      gl.uniform1i(gl.getUniformLocation(program, "u_orbitLength"), orbitLengthRef.current);

      // Привязываем текстуру опорной орбиты
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, referenceOrbitTextureRef.current);
      gl.uniform1i(gl.getUniformLocation(program, "u_referenceOrbit"), 0);

      console.log('Perturbation mode: zoom', zoom.toExponential(2), 'orbit length', orbitLengthRef.current);
    } else if (highPrecision) {
      // High Precision uniforms - передаём как (hi, lo) пары
      const scale = 3.0 / zoom;
      const [centerXHi, centerXLo] = packDD(center.x);
      const [centerYHi, centerYLo] = packDD(center.y);
      const [scaleHi, scaleLo] = packDD(scale);
      const [juliaCXHi, juliaCXLo] = packDD(juliaC.x);
      const [juliaCYHi, juliaCYLo] = packDD(juliaC.y);

      // Диагностика: логируем DD-значения при глубоком зуме
      if (zoom > 1e6) {
        const reconstructedX = centerXHi + centerXLo;
        const relErrorX = Math.abs(center.x - reconstructedX) / Math.abs(center.x);
        console.log('HP packDD test at zoom', zoom.toExponential(2), ':');
        console.log('  centerX:', center.x, '→ hi:', centerXHi, 'lo:', centerXLo);
        console.log('  reconstructed:', reconstructedX, 'relative error:', relErrorX.toExponential(2));
        console.log('  scale:', scale.toExponential(6), '→ hi:', scaleHi, 'lo:', scaleLo);
        // Relative error должен быть ~1e-15 или меньше
        if (relErrorX > 1e-10) {
          console.warn('⚠️ packDD relative error too high!');
        }
      }

      gl.uniform2f(gl.getUniformLocation(program, "u_centerHi"), centerXHi, centerYHi);
      gl.uniform2f(gl.getUniformLocation(program, "u_centerLo"), centerXLo, centerYLo);
      gl.uniform2f(gl.getUniformLocation(program, "u_scaleHi"), scaleHi, 0);
      gl.uniform2f(gl.getUniformLocation(program, "u_scaleLo"), scaleLo, 0);
      gl.uniform2f(gl.getUniformLocation(program, "u_juliaCHi"), juliaCXHi, juliaCYHi);
      gl.uniform2f(gl.getUniformLocation(program, "u_juliaCLo"), juliaCXLo, juliaCYLo);
    } else {
      // Стандартные uniforms
      gl.uniform2f(gl.getUniformLocation(program, "u_center"), center.x, center.y);
      gl.uniform1f(gl.getUniformLocation(program, "u_zoom"), zoom);
      gl.uniform2f(gl.getUniformLocation(program, "u_juliaC"), juliaC.x, juliaC.y);
    }

    // Рисуем
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, [center, zoom, fractalType, juliaC, effectiveIterations, colorSchemeIdx, highPrecision, precisionMode]);

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
      y: center.y + (1 - py / rect.height - 0.5) * scale,
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
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const scale = 3.0 / zoom;
      const aspect = rect.width / rect.height;

      const coords = {
        x: center.x + (px / rect.width - 0.5) * scale * aspect,
        y: center.y + (1 - py / rect.height - 0.5) * scale,
      };

      // Плавный зум: с Shift — медленнее
      const baseFactor = e.shiftKey ? 1.08 : 1.2;
      const factor = e.deltaY < 0 ? baseFactor : 1 / baseFactor;
      const newZoom = Math.max(0.5, Math.min(maxZoom, zoom * factor));

      setCenter({
        x: coords.x + (center.x - coords.x) / factor,
        y: coords.y + (center.y - coords.y) / factor,
      });
      setZoom(newZoom);
    };

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [zoom, center, maxZoom]);

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
    // Автоматически включаем правильный режим точности для глубоких зумов
    if (preset.zoom > 1e14 && preset.type === "mandelbrot" && isWebGL2) {
      setPrecisionMode("ultra");
    } else if (preset.zoom > 1e7) {
      setPrecisionMode("high");
    }
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

  // Форматирование зума
  const formatZoom = (z: number) => {
    if (z >= 1e12) return (z / 1e12).toFixed(1) + "T";
    if (z >= 1e9) return (z / 1e9).toFixed(1) + "B";
    if (z >= 1e6) return (z / 1e6).toFixed(1) + "M";
    if (z >= 1e3) return (z / 1e3).toFixed(1) + "k";
    return z.toFixed(1);
  };

  // Глубина (удвоения)
  const depth = Math.floor(Math.log2(zoom));
  const analogy = getScaleAnalogy(zoom);

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
          {/* Header с метриками */}
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{fractalNames[fractalType]}</span>
              <div className="flex items-center gap-2">
                {precisionMode === "ultra" && zoom >= PERTURBATION_ZOOM_THRESHOLD && (
                  <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                    Ultra/Pert
                  </span>
                )}
                {precisionMode === "ultra" && zoom < PERTURBATION_ZOOM_THRESHOLD && (
                  <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400">
                    Ultra/HP
                  </span>
                )}
                {precisionMode === "high" && (
                  <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                    HP
                  </span>
                )}
                <span className="text-xs text-muted font-mono">x{formatZoom(zoom)}</span>
              </div>
            </div>

            {/* Индикатор глубины */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Gauge size={14} className="text-muted" />
                <span className="text-muted">Глубина:</span>
                <span className="font-mono">{depth}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{analogy.icon}</span>
                <span className="text-muted">{analogy.name}</span>
              </div>
            </div>
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
              onClick={() => setZoom(z => Math.min(maxZoom, z * 2))}
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

          {/* Precision Toggle */}
          <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={16} className={precisionMode !== "normal" ? (precisionMode === "ultra" ? "text-cyan-400" : "text-yellow-400") : "text-muted"} />
                <span className="text-sm font-medium">Precision</span>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setPrecisionMode("normal")}
                  className={`px-2 py-1.5 text-xs transition-all ${
                    precisionMode === "normal" ? "bg-accent/20 text-accent" : "bg-transparent text-muted hover:bg-muted/10"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setPrecisionMode("high")}
                  className={`px-2 py-1.5 text-xs transition-all ${
                    precisionMode === "high" ? "bg-yellow-500/20 text-yellow-400" : "bg-transparent text-muted hover:bg-muted/10"
                  }`}
                >
                  High
                </button>
                <button
                  onClick={() => setPrecisionMode("ultra")}
                  disabled={!isWebGL2 || fractalType !== "mandelbrot"}
                  className={`px-2 py-1.5 text-xs transition-all ${
                    precisionMode === "ultra"
                      ? "bg-cyan-500/20 text-cyan-400"
                      : (!isWebGL2 || fractalType !== "mandelbrot")
                        ? "bg-transparent text-muted/30 cursor-not-allowed"
                        : "bg-transparent text-muted hover:bg-muted/10"
                  }`}
                  title={!isWebGL2 ? "Требуется WebGL2" : fractalType !== "mandelbrot" ? "Только для Мандельброта" : ""}
                >
                  Ultra
                </button>
              </div>
            </div>
            <p className="text-xs text-muted mt-2">
              {precisionMode === "ultra"
                ? (zoom >= PERTURBATION_ZOOM_THRESHOLD
                    ? "Perturbation активен: зум до 10¹⁰⁰+"
                    : "HP режим (Perturbation включится при zoom > 10¹²)")
                : precisionMode === "high"
                  ? "Double-Double: зум до 10¹⁴ без артефактов"
                  : "Float: зум до 10⁷ (быстрее)"
              }
            </p>
            {/* GPU диагностика */}
            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted font-mono">
              GPU highp: {gpuPrecision !== null ? `${gpuPrecision} bits` : "..."}
              {isWebGL2 && <span className="ml-2 text-green-400">WebGL2</span>}
              {precisionMode === "ultra" && orbitLength > 0 && (
                <span className="ml-2 text-cyan-400">orbit: {orbitLength}</span>
              )}
            </div>
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

          {/* Выбор c для Жюлиа */}
          {fractalType === "julia" && (
            <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-3">
              <h3 className="font-medium text-sm text-purple-400">Параметр c</h3>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { c: { x: -0.7, y: 0.27015 }, label: "⚡" },
                  { c: { x: -0.8, y: 0.156 }, label: "🐉" },
                  { c: { x: 0.285, y: 0.01 }, label: "🌀" },
                  { c: { x: -0.4, y: 0.6 }, label: "❄️" },
                  { c: { x: -0.123, y: 0.745 }, label: "🐰" },
                  { c: { x: 0.355, y: 0.355 }, label: "🌸" },
                  { c: { x: -0.54, y: 0.54 }, label: "🦋" },
                  { c: { x: -0.1, y: 0.651 }, label: "🔮" },
                ].map(({ c, label }) => (
                  <button
                    key={label}
                    onClick={() => setJuliaC(c)}
                    className={`p-2 rounded text-lg hover:bg-purple-500/20 transition-all ${
                      Math.abs(juliaC.x - c.x) < 0.01 && Math.abs(juliaC.y - c.y) < 0.01
                        ? "bg-purple-500/30 ring-1 ring-purple-400"
                        : ""
                    }`}
                    title={`c = ${c.x} + ${c.y}i`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted text-center">
                c = {juliaC.x.toFixed(3)} {juliaC.y >= 0 ? "+" : ""} {juliaC.y.toFixed(3)}i
              </div>
              <button
                onClick={() => {
                  setFractalType("mandelbrot");
                  setCenter({ x: -0.5, y: 0 });
                  setZoom(1);
                  setMode("julia");
                }}
                className="w-full px-3 py-2 rounded-lg bg-purple-500/20 text-purple-400 text-sm hover:bg-purple-500/30 transition-all"
              >
                Выбрать на Мандельброте →
              </button>
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
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-muted">Детализация</span>
              <div className="flex items-center gap-2">
                <span className="font-mono">{effectiveIterations}</span>
                <button
                  onClick={() => setAutoIterations(!autoIterations)}
                  className={`px-2 py-0.5 rounded text-xs transition-all ${
                    autoIterations ? "bg-accent/20 text-accent" : "bg-muted/20"
                  }`}
                >
                  {autoIterations ? "auto" : "manual"}
                </button>
              </div>
            </div>
            {!autoIterations && (
              <input
                type="range"
                min="50"
                max="2000"
                step="50"
                value={maxIterations}
                onChange={(e) => setMaxIterations(parseInt(e.target.value))}
                className="w-full accent-accent"
              />
            )}
            {autoIterations && (
              <p className="text-xs text-muted">
                Авто-увеличение при зуме (200 + 50×log₂)
              </p>
            )}
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
                  {preset.zoom > 1e7 && <span className="text-xs text-yellow-400 ml-1">HP</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Справка */}
          {showInfo && (
            <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm space-y-3">
              <h3 className="font-medium text-accent">Как это работает?</h3>
              <p className="text-xs text-muted">
                Для каждой точки проверяем: останется ли z → z² + c ограниченной?
                Цвет показывает скорость расходимости.
              </p>
              <p className="text-xs text-muted">
                <strong>Shift + колёсико:</strong> плавный зум
              </p>
              <p className="text-xs text-muted">
                <strong>Normal:</strong> float precision, до ~10⁷
              </p>
              <p className="text-xs text-muted">
                <strong>High:</strong> Double-Double арифметика, до ~10¹⁴ без пикселей
              </p>
              <p className="text-xs text-muted">
                <strong>Ultra:</strong> Perturbation Theory + arbitrary precision, бесконечный зум (10¹⁰⁰+)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
