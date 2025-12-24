/**
 * Модуль разбиения балки на участки для метода сечений
 */

import type { BeamInput, Reactions, Load } from "./types";

// Интервал (участок балки)
export interface Interval {
  idx: number;      // номер участка (1, 2, 3, ...)
  a: number;        // начало участка
  b: number;        // конец участка
}

// Коэффициенты полинома Q(s) = Qa - q*s
export interface PolyQ {
  Qa: number;       // Q в начале участка
  q: number;        // интенсивность распределённой нагрузки на участке
}

// Коэффициенты полинома M(s) = Ma + Qa*s - (q/2)*s²
export interface PolyM {
  Ma: number;       // M в начале участка
  Qa: number;       // Q в начале участка
  q: number;        // интенсивность распределённой нагрузки
}

// Формулы для одного участка
export interface SectionFormula {
  interval: Interval;
  q: number;                    // активная q на участке
  Qa: number;                   // Q(a+)
  Ma: number;                   // M(a+)
  Qb: number;                   // Q(b-)
  Mb: number;                   // M(b-)
  polyQ: PolyQ;
  polyM: PolyM;
}

// Событие в точке (скачок)
export interface PointEvent {
  x: number;
  type: "force" | "moment" | "reaction" | "q_start" | "q_end";
  value: number;
  label: string;
}

const EPS = 1e-9;

/**
 * Собирает точки разбиения и возвращает интервалы
 */
export function buildIntervals(input: BeamInput, reactions: Reactions): Interval[] {
  const breakpoints = new Set<number>();

  // Границы балки
  breakpoints.add(0);
  breakpoints.add(input.L);

  // Опоры
  if (reactions.xA !== undefined) breakpoints.add(reactions.xA);
  if (reactions.xB !== undefined) breakpoints.add(reactions.xB);
  if (reactions.xf !== undefined) breakpoints.add(reactions.xf);

  // Нагрузки
  for (const load of input.loads) {
    if (load.type === "distributed") {
      breakpoints.add(load.a);
      breakpoints.add(load.b);
    } else {
      breakpoints.add(load.x);
    }
  }

  // Сортируем и убираем дубли с eps
  const sorted = Array.from(breakpoints).sort((a, b) => a - b);
  const unique: number[] = [];

  for (const p of sorted) {
    if (unique.length === 0 || Math.abs(p - unique[unique.length - 1]) > EPS) {
      unique.push(p);
    }
  }

  // Создаём интервалы
  const intervals: Interval[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    intervals.push({
      idx: i + 1,
      a: unique[i],
      b: unique[i + 1],
    });
  }

  return intervals;
}

/**
 * Определяет активную q на интервале [a, b]
 */
function getActiveQ(input: BeamInput, a: number, b: number): number {
  let q = 0;
  const midpoint = (a + b) / 2;

  for (const load of input.loads) {
    if (load.type === "distributed") {
      // Если midpoint внутри области распределённой нагрузки
      if (midpoint > load.a + EPS && midpoint < load.b - EPS) {
        q += load.q;
      }
    }
  }

  return q;
}

/**
 * Строит формулы Q и M для каждого участка
 */
export function buildSectionFormulas(
  input: BeamInput,
  reactions: Reactions,
  Q: (x: number) => number,
  M: (x: number) => number
): SectionFormula[] {
  const intervals = buildIntervals(input, reactions);
  const formulas: SectionFormula[] = [];

  for (const interval of intervals) {
    const { a, b } = interval;

    // Активная q на участке
    const q = getActiveQ(input, a, b);

    // Значения в начале и конце (чуть внутри, чтобы не попасть в скачок)
    const eps = (b - a) * 1e-6;
    const Qa = roundValue(Q(a + eps));
    const Ma = roundValue(M(a + eps));
    const Qb = roundValue(Q(b - eps));
    const Mb = roundValue(M(b - eps));

    formulas.push({
      interval,
      q,
      Qa,
      Ma,
      Qb,
      Mb,
      polyQ: { Qa, q },
      polyM: { Ma, Qa, q },
    });
  }

  return formulas;
}

/**
 * Округляет значение, убирая погрешности вычислений с плавающей точкой
 * Если значение очень близко к целому или половинке, округляем до неё
 */
function roundValue(v: number, precision = 2): number {
  // Проверяем близость к 0
  if (Math.abs(v) < 0.005) return 0;

  // Округляем до 2 знаков после запятой
  const rounded = Math.round(v * Math.pow(10, precision)) / Math.pow(10, precision);

  // Проверяем близость к половинке (0.5)
  const half = Math.round(rounded * 2) / 2;
  if (Math.abs(rounded - half) < 0.01) {
    return half;
  }

  return rounded;
}

/**
 * Форматирует число для отображения
 */
export function formatNumber(n: number, decimals = 2): string {
  if (Math.abs(n) < 1e-10) return "0";
  const fixed = n.toFixed(decimals);
  return parseFloat(fixed).toString();
}

/**
 * Генерирует LaTeX для Q(s) на участке
 */
export function formatQFormula(poly: PolyQ, varName = "s"): string {
  const { Qa, q } = poly;

  if (Math.abs(q) < EPS) {
    // Q = const
    return formatNumber(Qa);
  }

  // Q = Qa - q*s
  const qaStr = formatNumber(Qa);
  const qStr = formatNumber(Math.abs(q));
  const sign = q > 0 ? "-" : "+";

  if (Math.abs(Qa) < EPS) {
    return q > 0 ? `-${qStr}${varName}` : `${qStr}${varName}`;
  }

  return `${qaStr} ${sign} ${qStr}${varName}`;
}

/**
 * Генерирует LaTeX для M(s) на участке
 */
export function formatMFormula(poly: PolyM, varName = "s"): string {
  const { Ma, Qa, q } = poly;

  const parts: string[] = [];

  // Ma
  if (Math.abs(Ma) > EPS) {
    parts.push(formatNumber(Ma));
  }

  // + Qa*s
  if (Math.abs(Qa) > EPS) {
    const qaStr = formatNumber(Math.abs(Qa));
    if (parts.length === 0) {
      parts.push(Qa > 0 ? `${qaStr}${varName}` : `-${qaStr}${varName}`);
    } else {
      parts.push(Qa > 0 ? `+ ${qaStr}${varName}` : `- ${qaStr}${varName}`);
    }
  }

  // - (q/2)*s²
  if (Math.abs(q) > EPS) {
    const qHalf = q / 2;
    const qStr = formatNumber(Math.abs(qHalf));
    if (parts.length === 0) {
      parts.push(qHalf > 0 ? `-${qStr}${varName}^2` : `${qStr}${varName}^2`);
    } else {
      parts.push(qHalf > 0 ? `- ${qStr}${varName}^2` : `+ ${qStr}${varName}^2`);
    }
  }

  return parts.length > 0 ? parts.join(" ") : "0";
}
