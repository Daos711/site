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

// Описание силы, действующей на отсечённую часть
export interface ForceContribution {
  type: "reaction" | "force" | "distributed_resultant" | "moment";
  label: string;          // R_A, F, F_{q_1}, M и т.д.
  value: number;          // числовое значение
  x: number;              // точка приложения
  arm?: number;           // плечо относительно сечения (для момента)
  qStart?: number;        // начало участка распределённой нагрузки
  qEnd?: number;          // конец участка (для текущего z)
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
  contributions: ForceContribution[];  // силы слева от сечения
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
 * Собирает силы, действующие слева от точки x (на участке)
 */
function collectContributions(
  input: BeamInput,
  reactions: Reactions,
  sectionStart: number
): ForceContribution[] {
  const contributions: ForceContribution[] = [];
  const { loads } = input;

  // Подсчёт сил и распределённых нагрузок для индексации
  const forceCount = loads.filter(l => l.type === "force").length;
  const momentCount = loads.filter(l => l.type === "moment").length;

  // Вычисляем результирующие распределённые нагрузки
  const distributedLoads = loads.filter(l => l.type === "distributed") as Array<{ type: "distributed"; q: number; a: number; b: number }>;
  const resultingQLoads: Array<{ q: number; a: number; b: number; idx: number }> = [];

  if (distributedLoads.length > 0) {
    // Собираем все характерные точки
    const points = new Set<number>();
    points.add(0);
    points.add(input.L);
    for (const load of distributedLoads) {
      if (load.a >= 0 && load.a <= input.L) points.add(load.a);
      if (load.b >= 0 && load.b <= input.L) points.add(load.b);
    }
    const sortedPoints = Array.from(points).sort((a, b) => a - b);

    // Вычисляем результирующую нагрузку на каждом участке
    let qIdx = 1;
    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const a = sortedPoints[i];
      const b = sortedPoints[i + 1];
      let totalQ = 0;
      for (const load of distributedLoads) {
        if (load.a <= a && load.b >= b) {
          totalQ += load.q;
        }
      }
      if (Math.abs(totalQ) > 0.001) {
        resultingQLoads.push({ q: totalQ, a, b, idx: qIdx });
        qIdx++;
      }
    }
  }

  // Реакция A (если левее или в точке сечения)
  if (reactions.RA !== undefined && reactions.xA !== undefined && reactions.xA < sectionStart + EPS) {
    contributions.push({
      type: "reaction",
      label: "R_A",
      value: reactions.RA,
      x: reactions.xA,
    });
  }

  // Реакция B (если левее или в точке сечения)
  if (reactions.RB !== undefined && reactions.xB !== undefined && reactions.xB < sectionStart + EPS) {
    contributions.push({
      type: "reaction",
      label: "R_B",
      value: reactions.RB,
      x: reactions.xB,
    });
  }

  // Реакция заделки (для консольной балки)
  if (reactions.Rf !== undefined && reactions.xf !== undefined && reactions.xf < sectionStart + EPS) {
    contributions.push({
      type: "reaction",
      label: "R",
      value: reactions.Rf,
      x: reactions.xf,
    });
    if (reactions.Mf !== undefined) {
      contributions.push({
        type: "moment",
        label: "M_f",
        value: reactions.Mf,
        x: reactions.xf,
      });
    }
  }

  // Сосредоточенные силы слева от сечения
  let forceIdx = 1;
  for (const load of loads) {
    if (load.type === "force" && load.x < sectionStart + EPS) {
      const label = forceCount === 1 ? "F" : `F_{${forceIdx}}`;
      contributions.push({
        type: "force",
        label,
        value: load.F,
        x: load.x,
      });
    }
    if (load.type === "force") forceIdx++;
  }

  // Сосредоточенные моменты слева от сечения
  let momentIdx = 1;
  for (const load of loads) {
    if (load.type === "moment" && load.x < sectionStart + EPS) {
      const label = momentCount === 1 ? "M" : `M_{${momentIdx}}`;
      contributions.push({
        type: "moment",
        label,
        value: load.M,
        x: load.x,
      });
    }
    if (load.type === "moment") momentIdx++;
  }

  // Распределённые нагрузки (полностью или частично слева от сечения)
  for (const seg of resultingQLoads) {
    if (seg.a < sectionStart + EPS) {
      // Эта нагрузка начинается до начала участка
      const endX = Math.min(seg.b, sectionStart);
      if (endX > seg.a + EPS) {
        // Равнодействующая завершённой части
        contributions.push({
          type: "distributed_resultant",
          label: `q_{${seg.idx}}`,
          value: seg.q,
          x: (seg.a + endX) / 2,
          qStart: seg.a,
          qEnd: endX,
        });
      }
    }
  }

  return contributions;
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

    // Собираем силы слева от начала участка
    const contributions = collectContributions(input, reactions, a);

    formulas.push({
      interval,
      q,
      Qa,
      Ma,
      Qb,
      Mb,
      polyQ: { Qa, q },
      polyM: { Ma, Qa, q },
      contributions,
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
