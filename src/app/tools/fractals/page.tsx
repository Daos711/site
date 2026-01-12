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

// DEBUG: установить в true чтобы HP шейдер показывал фиолетовый цвет (тест что он работает)
const DEBUG_HP_PURPLE = false;

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
      float log_zn = log(z.x * z.x + z.y * z.y) / 2.0;
      float nu = log(log_zn / log(2.0)) / log(2.0);
      iter = iter + 1.0 - nu;
      float t = iter / maxIter;
      vec3 color = palette(t, u_colorScheme);
      gl_FragColor = vec4(color, 1.0);
    }
  }
`;

// High Precision шейдер с Double-Double арифметикой (WebGL1 - Veltkamp-Dekker)
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
  // Число представляется как vec2(hi, lo) где value ≈ hi + lo

  vec2 twoSum(float a, float b) {
    float s = a + b;
    float bb = s - a;
    float err = (a - (s - bb)) + (b - bb);
    return vec2(s, err);
  }

  vec2 quickTwoSum(float a, float b) {
    float s = a + b;
    float err = b - (s - a);
    return vec2(s, err);
  }

  vec2 dd_add(vec2 a, vec2 b) {
    vec2 s = twoSum(a.x, b.x);
    float e = a.y + b.y + s.y;
    return quickTwoSum(s.x, e);
  }

  vec2 dd_sub(vec2 a, vec2 b) {
    return dd_add(a, vec2(-b.x, -b.y));
  }

  const float SPLIT = 4097.0; // 2^12 + 1

  vec2 twoProd(float a, float b) {
    float p = a * b;
    float a1 = a * SPLIT;
    float a_hi = a1 - (a1 - a);
    float a_lo = a - a_hi;
    float b1 = b * SPLIT;
    float b_hi = b1 - (b1 - b);
    float b_lo = b - b_hi;
    float err = ((a_hi * b_hi - p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
    return vec2(p, err);
  }

  vec2 dd_mul(vec2 a, vec2 b) {
    vec2 p = twoProd(a.x, b.x);
    float e = a.x * b.y + a.y * b.x + a.y * b.y + p.y;
    vec2 s = twoSum(p.x, e);
    return vec2(s.x, s.y);
  }

  // DD * float
  vec2 dd_mul_f(vec2 a, float b) {
    vec2 p = twoProd(a.x, b);
    float e = a.y * b + p.y;
    return quickTwoSum(p.x, e);
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
  // Число представляется как vec2(hi, lo) где value ≈ hi + lo

  vec2 twoSum(float a, float b) {
    float s = a + b;
    float bb = s - a;
    float err = (a - (s - bb)) + (b - bb);
    return vec2(s, err);
  }

  vec2 quickTwoSum(float a, float b) {
    float s = a + b;
    float err = b - (s - a);
    return vec2(s, err);
  }

  vec2 dd_add(vec2 a, vec2 b) {
    vec2 s = twoSum(a.x, b.x);
    float e = a.y + b.y + s.y;
    return quickTwoSum(s.x, e);
  }

  vec2 dd_sub(vec2 a, vec2 b) {
    return dd_add(a, vec2(-b.x, -b.y));
  }

  const float SPLIT = 4097.0; // 2^12 + 1

  vec2 twoProd(float a, float b) {
    float p = a * b;
    float a1 = a * SPLIT;
    float a_hi = a1 - (a1 - a);
    float a_lo = a - a_hi;
    float b1 = b * SPLIT;
    float b_hi = b1 - (b1 - b);
    float b_lo = b - b_hi;
    float err = ((a_hi * b_hi - p) + a_hi * b_lo + a_lo * b_hi) + a_lo * b_lo;
    return vec2(p, err);
  }

  vec2 dd_mul(vec2 a, vec2 b) {
    vec2 p = twoProd(a.x, b.x);
    float e = a.x * b.y + a.y * b.x + a.y * b.y + p.y;
    vec2 s = twoSum(p.x, e);
    return vec2(s.x, s.y);
  }

  // DD * float
  vec2 dd_mul_f(vec2 a, float b) {
    vec2 p = twoProd(a.x, b);
    float e = a.y * b + p.y;
    return quickTwoSum(p.x, e);
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
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Смещение в DD
    float offsetX = (uv.x - 0.5) * aspect;
    float offsetY = (uv.y - 0.5);

    // scale как DD
    vec2 scaleDD = vec2(u_scaleHi.x, u_scaleLo.x);

    // c.x = centerX + offsetX * scale (в DD)
    vec2 cxDD = dd_add(vec2(u_centerHi.x, u_centerLo.x), dd_mul_f(scaleDD, offsetX));
    // c.y = centerY + offsetY * scale (в DD)
    vec2 cyDD = dd_add(vec2(u_centerHi.y, u_centerLo.y), dd_mul_f(scaleDD, offsetY));

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
      float log_zn = log(zx * zx + zy * zy) / 2.0;
      float nu = log(log_zn / log(2.0)) / log(2.0);
      iter = iter + 1.0 - nu;
      float t = iter / maxIter;
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
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / u_resolution.y;

    // Смещение в DD
    float offsetX = (uv.x - 0.5) * aspect;
    float offsetY = (uv.y - 0.5);

    // scale как DD
    vec2 scaleDD = vec2(u_scaleHi.x, u_scaleLo.x);

    // c.x = centerX + offsetX * scale (в DD)
    vec2 cxDD = dd_add(vec2(u_centerHi.x, u_centerLo.x), dd_mul_f(scaleDD, offsetX));
    // c.y = centerY + offsetY * scale (в DD)
    vec2 cyDD = dd_add(vec2(u_centerHi.y, u_centerLo.y), dd_mul_f(scaleDD, offsetY));

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
      float log_zn = log(zx * zx + zy * zy) / 2.0;
      float nu = log(log_zn / log(2.0)) / log(2.0);
      iter = iter + 1.0 - nu;
      float t = iter / maxIter;
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

// Упаковка double в (hi, lo) для передачи в шейдер
function packDD(x: number): [number, number] {
  const hi = Math.fround(x);
  const lo = Math.fround(x - hi);
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
  const [highPrecision, setHighPrecision] = useState(false);
  const [gpuPrecision, setGpuPrecision] = useState<number | null>(null);
  const [isWebGL2, setIsWebGL2] = useState(false);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const programHPRef = useRef<WebGLProgram | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  // Автоматическое увеличение итераций при зуме
  const effectiveIterations = autoIterations
    ? Math.min(2000, Math.max(200, Math.floor(200 + 50 * Math.log2(zoom))))
    : maxIterations;

  // Лимит зума зависит от режима точности
  const maxZoom = highPrecision ? 1e14 : 1e7;

  // Инициализация WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Пробуем WebGL2 сначала (гарантирует настоящий highp)
    let gl = canvas.getContext("webgl2") as WebGLRenderingContext | null;
    let webgl2 = false;
    if (gl) {
      webgl2 = true;
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
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(vertexShaderHP);
      gl.deleteShader(fragmentShaderHP);
    };
  }, []);

  // Рендеринг
  const render = useCallback(() => {
    const gl = glRef.current;
    const canvas = canvasRef.current;
    const program = highPrecision ? programHPRef.current : programRef.current;
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

    if (highPrecision) {
      // High Precision uniforms - передаём как (hi, lo) пары
      const scale = 3.0 / zoom;
      const [centerXHi, centerXLo] = packDD(center.x);
      const [centerYHi, centerYLo] = packDD(center.y);
      const [scaleHi, scaleLo] = packDD(scale);
      const [juliaCXHi, juliaCXLo] = packDD(juliaC.x);
      const [juliaCYHi, juliaCYLo] = packDD(juliaC.y);

      // Диагностика: логируем DD-значения при глубоком зуме
      if (zoom > 1000) {
        console.log('HP mode diagnostics at zoom', zoom.toExponential(2), ':');
        console.log('  scale:', scale.toExponential(6), '-> hi:', scaleHi, 'lo:', scaleLo);
        console.log('  centerX:', center.x, '-> hi:', centerXHi, 'lo:', centerXLo);
        console.log('  centerY:', center.y, '-> hi:', centerYHi, 'lo:', centerYLo);
        console.log('  reconstructed centerX:', centerXHi + centerXLo, 'error:', Math.abs(center.x - (centerXHi + centerXLo)));
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
  }, [center, zoom, fractalType, juliaC, effectiveIterations, colorSchemeIdx, highPrecision]);

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
    // Автоматически включаем HP для глубоких зумов
    if (preset.zoom > 1e7) {
      setHighPrecision(true);
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
                {highPrecision && (
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
                <Zap size={16} className={highPrecision ? "text-yellow-400" : "text-muted"} />
                <span className="text-sm font-medium">Precision</span>
              </div>
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setHighPrecision(false)}
                  className={`px-3 py-1.5 text-sm transition-all ${
                    !highPrecision ? "bg-accent/20 text-accent" : "bg-transparent text-muted hover:bg-muted/10"
                  }`}
                >
                  Normal
                </button>
                <button
                  onClick={() => setHighPrecision(true)}
                  className={`px-3 py-1.5 text-sm transition-all ${
                    highPrecision ? "bg-yellow-500/20 text-yellow-400" : "bg-transparent text-muted hover:bg-muted/10"
                  }`}
                >
                  High
                </button>
              </div>
            </div>
            <p className="text-xs text-muted mt-2">
              {highPrecision
                ? "Double-Double: зум до 10¹⁴ без артефактов"
                : "Float: зум до 10⁷ (быстрее)"
              }
            </p>
            {/* GPU диагностика */}
            <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted font-mono">
              GPU highp: {gpuPrecision !== null ? `${gpuPrecision} bits` : "..."}
              {isWebGL2 && <span className="ml-2 text-green-400">WebGL2</span>}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
