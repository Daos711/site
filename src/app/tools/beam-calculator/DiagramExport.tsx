"use client";

import React, { useMemo } from "react";

// Цвета для печати (тёмные на светлом фоне)
const PRINT_COLORS = {
  Q: "#2563eb",      // синий
  M: "#dc2626",      // красный
  y: "#0891b2",      // голубой/циан
  grid: "#9ca3af",   // серая сетка
  zeroLine: "#374151", // нулевая линия (тёмно-серый, почти чёрный)
  text: "#1f2937",   // тёмный текст
  textMuted: "#6b7280",
  fill: "#ffffff",   // белый фон
};

interface DiagramExportProps {
  id: string;
  title: string;
  unit: string;
  segments: { x: number; value: number }[][];
  L: number;
  color: keyof typeof PRINT_COLORS;
  scale?: number;
  boundaries?: number[];
}

/**
 * Экспортный SVG для одной эпюры (Q, M или y).
 * Скрыт на странице, сериализуется для вставки в HTML-отчёт.
 */
export function DiagramExport({
  id,
  title,
  unit,
  segments,
  L,
  color,
  scale = 1,
  boundaries = [],
}: DiagramExportProps) {
  // Размеры под A4 (180mm ≈ 680px)
  const width = 680;
  const height = 200;
  const padding = { left: 55, right: 35, top: 35, bottom: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const lineColor = PRINT_COLORS[color];

  // Масштабируем значения
  const scaledSegments = segments.map((seg) =>
    seg.map((p) => ({ ...p, value: p.value * scale }))
  );

  // Вычисляем диапазон значений
  const allValues = scaledSegments.flat().map((p) => p.value);
  let minVal = Math.min(0, ...allValues);
  let maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;
  minVal -= range * 0.12;
  maxVal += range * 0.12;

  const xToPx = (x: number) => padding.left + (x / L) * chartWidth;
  const scaleY = (val: number) => {
    const normalized = (val - minVal) / (maxVal - minVal);
    return padding.top + (1 - normalized) * chartHeight;
  };
  const zeroY = scaleY(0);

  // Находим экстремумы
  const extremes = useMemo(() => {
    let maxP = { x: 0, value: 0 };
    let minP = { x: 0, value: 0 };
    for (const seg of scaledSegments) {
      for (const p of seg) {
        if (p.value > maxP.value) maxP = p;
        if (p.value < minP.value) minP = p;
      }
    }
    return { maxP, minP };
  }, [scaledSegments]);

  const formatNum = (val: number): string => {
    if (Math.abs(val) < 1e-10) return "0";

    // Округляем floating-point шум: только явные ошибки типа 20.03
    const snapThreshold = 0.002; // 0.2% допуск
    const roundToNearest = (v: number, step: number): number => {
      const rounded = Math.round(v / step) * step;
      const relError = Math.abs(v - rounded) / Math.max(Math.abs(v), 1);
      return relError < snapThreshold ? rounded : v;
    };
    let snapped = roundToNearest(val, 1);
    if (snapped === val) snapped = roundToNearest(val, 0.5);
    if (snapped === val) snapped = roundToNearest(val, 0.25);
    val = snapped;

    const absVal = Math.abs(val);
    let decimals = 2;
    if (absVal < 0.001) decimals = 5;
    else if (absVal < 0.01) decimals = 4;
    else if (absVal < 0.1) decimals = 3;
    const fixed = val.toFixed(decimals);
    const result = fixed.replace(/\.?0+$/, "");
    return result === "-0" ? "0" : result;
  };

  return (
    <svg
      id={id}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: `${width}px`,
        height: `${height}px`,
        background: "#ffffff",
      }}
    >
      {/* Фон */}
      <rect x="0" y="0" width={width} height={height} fill={PRINT_COLORS.fill} />

      {/* Область графика */}
      <rect
        x={padding.left}
        y={padding.top}
        width={chartWidth}
        height={chartHeight}
        fill="#ffffff"
        stroke="none"
      />

      {/* Нулевая линия */}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={padding.left + chartWidth}
        y2={zeroY}
        stroke={PRINT_COLORS.zeroLine}
        strokeWidth={2}
        strokeDasharray="8,5"
      />

      {/* Заголовок */}
      <text
        x={padding.left - 10}
        y={padding.top + chartHeight / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fill={lineColor}
        fontSize={18}
        fontWeight="bold"
      >
        {title}
      </text>

      {/* Единицы справа */}
      <text
        x={padding.left + chartWidth + 8}
        y={padding.top + chartHeight / 2}
        dominantBaseline="middle"
        fill={PRINT_COLORS.textMuted}
        fontSize={14}
      >
        {unit}
      </text>

      {/* Вертикальные линии границ участков */}
      {boundaries.map((b, i) => (
        <line
          key={`b-${i}`}
          x1={xToPx(b)}
          y1={padding.top}
          x2={xToPx(b)}
          y2={padding.top + chartHeight}
          stroke={PRINT_COLORS.grid}
          strokeWidth={0.5}
          strokeDasharray="2,2"
        />
      ))}

      {/* Сегменты графика */}
      {scaledSegments.map((segment, segIdx) => {
        if (segment.length < 2) return null;

        const first = segment[0];
        let lineD = `M ${xToPx(first.x)} ${scaleY(first.value)}`;
        for (const p of segment.slice(1)) {
          lineD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }

        // Заливка под кривой — фиксированный шаг в пикселях для одинаковой частоты
        const fillLines: React.ReactNode[] = [];
        const hatchSpacingPx = 10;
        const firstX = segment[0].x;
        const lastX = segment[segment.length - 1].x;
        const startPx = xToPx(firstX);
        const endPx = xToPx(lastX);

        // Интерполяция значения по X
        const getValueAtX = (targetX: number): number => {
          for (let i = 0; i < segment.length - 1; i++) {
            if (segment[i].x <= targetX && segment[i + 1].x >= targetX) {
              const t = (targetX - segment[i].x) / (segment[i + 1].x - segment[i].x);
              return segment[i].value + t * (segment[i + 1].value - segment[i].value);
            }
          }
          return segment[segment.length - 1].value;
        };

        for (let px = startPx; px <= endPx; px += hatchSpacingPx) {
          // Обратное преобразование px -> x
          const x = firstX + ((px - startPx) / (endPx - startPx)) * (lastX - firstX);
          const value = getValueAtX(x);
          const py = scaleY(value);
          if (Math.abs(py - zeroY) > 1) {
            fillLines.push(
              <line
                key={`f-${segIdx}-${px}`}
                x1={px}
                y1={zeroY}
                x2={px}
                y2={py}
                stroke={lineColor}
                strokeOpacity={0.15}
                strokeWidth={2}
              />
            );
          }
        }

        return (
          <g key={segIdx}>
            {fillLines}
            <path d={lineD} stroke={lineColor} strokeWidth={2} fill="none" />
          </g>
        );
      })}

      {/* Подписи значений и экстремумов */}
      {(() => {
        const labels: React.ReactNode[] = [];

        // Отслеживаем уже добавленные подписи для дедупликации
        const addedLabels: { x: number; value: number }[] = [];

        // Проверка на дубль — по значению (если такое значение уже показано, не дублируем)
        const isDuplicate = (bx: number, value: number) => {
          return addedLabels.some(
            (lbl) => Math.abs(lbl.value - value) < Math.abs(value) * 0.02 + 0.1
          );
        };

        // Добавляет подпись сбоку (для границ и скачков)
        const addSideLabel = (bx: number, value: number, placeRight: boolean, key: string) => {
          if (Math.abs(value) < 1e-6) return;
          if (isDuplicate(bx, value)) return;

          addedLabels.push({ x: bx, value });
          const xOffset = placeRight ? 18 : -18;
          const anchor = placeRight ? "start" : "end";
          const curveY = scaleY(value);
          const textY = value >= 0 ? curveY - 8 : curveY + 14;

          labels.push(
            <text key={key} x={xToPx(bx) + xOffset} y={textY} textAnchor={anchor}
              fill={lineColor} fontSize={13} fontWeight="500">
              {formatNum(value)}
            </text>
          );
        };

        // Добавляет подпись экстремума (по центру, с маркером)
        const addExtremumLabel = (pt: { x: number; value: number }, isMax: boolean, key: string) => {
          if (Math.abs(pt.value) < 0.01) return;
          if (isDuplicate(pt.x, pt.value)) return;

          addedLabels.push({ x: pt.x, value: pt.value });
          const textY = isMax ? scaleY(pt.value) - 10 : scaleY(pt.value) + 16;

          labels.push(
            <g key={key}>
              <circle cx={xToPx(pt.x)} cy={scaleY(pt.value)} r={4} fill={lineColor} />
              <text x={xToPx(pt.x)} y={textY} textAnchor="middle"
                fill={lineColor} fontSize={13} fontWeight="600">
                {formatNum(pt.value)}
              </text>
            </g>
          );
        };

        // Функции поиска значений
        const findLeftValue = (x: number): number | null => {
          for (const seg of scaledSegments) {
            if (seg.length < 2) continue;
            const last = seg[seg.length - 1];
            if (Math.abs(last.x - x) < 0.02) return last.value;
          }
          return null;
        };

        const findRightValue = (x: number): number | null => {
          for (const seg of scaledSegments) {
            if (seg.length < 2) continue;
            const first = seg[0];
            if (Math.abs(first.x - x) < 0.02) return first.value;
          }
          return null;
        };

        // 1. Экстремумы (добавляем первыми — они приоритетные)
        addExtremumLabel(extremes.maxP, true, "extremum-max");
        if (Math.abs(extremes.minP.x - extremes.maxP.x) > 0.03 * L ||
            Math.abs(extremes.minP.value - extremes.maxP.value) > 0.5) {
          addExtremumLabel(extremes.minP, false, "extremum-min");
        }

        // 2. Концы балки
        const startValue = findRightValue(0);
        const endValue = findLeftValue(L);
        if (startValue !== null) addSideLabel(0, startValue, true, "label-start");
        if (endValue !== null) addSideLabel(L, endValue, false, "label-end");

        // 3. Скачки (разрывы)
        for (let bIdx = 0; bIdx < boundaries.length; bIdx++) {
          const bx = boundaries[bIdx];
          if (Math.abs(bx) < 0.01 || Math.abs(bx - L) < 0.01) continue;

          const leftValue = findLeftValue(bx);
          const rightValue = findRightValue(bx);

          const hasDiscontinuity = leftValue !== null && rightValue !== null &&
            Math.abs(leftValue - rightValue) > 0.5;

          if (hasDiscontinuity) {
            if (leftValue !== null) addSideLabel(bx, leftValue, false, `label-${bIdx}-left`);
            if (rightValue !== null) addSideLabel(bx, rightValue, true, `label-${bIdx}-right`);
          }
        }

        return <>{labels}</>;
      })()}

      {/* Ось X */}
      <line
        x1={padding.left}
        y1={height - padding.bottom + 5}
        x2={padding.left + chartWidth}
        y2={height - padding.bottom + 5}
        stroke={PRINT_COLORS.text}
        strokeWidth={1}
      />
      <text x={padding.left} y={height - 10} fill={PRINT_COLORS.text} fontSize={14}>
        0
      </text>
      <text x={padding.left + chartWidth} y={height - 10} textAnchor="end" fill={PRINT_COLORS.text} fontSize={14}>
        {L} м
      </text>
      <text x={padding.left + chartWidth / 2} y={height - 10} textAnchor="middle" fill={PRINT_COLORS.textMuted} fontSize={14}>
        x, м
      </text>
    </svg>
  );
}
