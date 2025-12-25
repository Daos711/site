"use client";

import React, { useMemo } from "react";

// Цвета для печати (тёмные на светлом фоне)
const PRINT_COLORS = {
  Q: "#2563eb",      // синий
  M: "#dc2626",      // красный
  y: "#0891b2",      // голубой/циан
  grid: "#d1d5db",   // серая сетка
  text: "#1f2937",   // тёмный текст
  textMuted: "#6b7280",
  fill: "#f8fafc",   // светлый фон
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
  const width = 700;
  const height = 180;
  const padding = { left: 60, right: 40, top: 30, bottom: 35 };
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
        background: PRINT_COLORS.fill,
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
        stroke={PRINT_COLORS.grid}
        strokeWidth={1}
      />

      {/* Нулевая линия */}
      <line
        x1={padding.left}
        y1={zeroY}
        x2={padding.left + chartWidth}
        y2={zeroY}
        stroke={PRINT_COLORS.grid}
        strokeWidth={1}
        strokeDasharray="4,4"
      />

      {/* Заголовок */}
      <text
        x={padding.left - 10}
        y={padding.top + chartHeight / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fill={lineColor}
        fontSize={16}
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
        fontSize={12}
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

        // Заливка под кривой
        const fillLines: React.ReactNode[] = [];
        const step = Math.max(1, Math.floor(segment.length / 30));
        for (let i = 0; i < segment.length; i += step) {
          const p = segment[i];
          const px = xToPx(p.x);
          const py = scaleY(p.value);
          if (Math.abs(py - zeroY) > 1) {
            fillLines.push(
              <line
                key={`f-${segIdx}-${i}`}
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

      {/* Подписи значений на границах */}
      {boundaries.map((bx, bIdx) => {
        const isFirst = bIdx === 0;
        const isLast = bIdx === boundaries.length - 1;

        // Находим значение в этой точке
        let value: number | null = null;
        for (const seg of scaledSegments) {
          if (seg.length < 2) continue;
          const first = seg[0];
          const last = seg[seg.length - 1];
          if (Math.abs(first.x - bx) < 0.01) {
            value = first.value;
            break;
          }
          if (Math.abs(last.x - bx) < 0.01) {
            value = last.value;
          }
        }

        if (value === null) return null;

        const curveY = scaleY(value);
        const textY = value >= 0 ? curveY - 8 : curveY + 14;
        const xOffset = isFirst ? 6 : isLast ? -6 : 0;
        const anchor = isFirst ? "start" : isLast ? "end" : "middle";

        return (
          <text
            key={`label-${bIdx}`}
            x={xToPx(bx) + xOffset}
            y={textY}
            textAnchor={anchor}
            fill={lineColor}
            fontSize={11}
            fontWeight="500"
          >
            {formatNum(value)}
          </text>
        );
      })}

      {/* Маркеры экстремумов (если не на границе) */}
      {Math.abs(extremes.maxP.value) > 1e-9 &&
        !boundaries.some((b) => Math.abs(b - extremes.maxP.x) < 0.05) && (
          <g>
            <circle cx={xToPx(extremes.maxP.x)} cy={scaleY(extremes.maxP.value)} r={3} fill={lineColor} />
            <text
              x={xToPx(extremes.maxP.x)}
              y={scaleY(extremes.maxP.value) - 8}
              textAnchor="middle"
              fill={lineColor}
              fontSize={11}
              fontWeight="600"
            >
              {formatNum(extremes.maxP.value)}
            </text>
          </g>
        )}

      {Math.abs(extremes.minP.value) > 1e-9 &&
        Math.abs(extremes.minP.x - extremes.maxP.x) > 0.1 &&
        !boundaries.some((b) => Math.abs(b - extremes.minP.x) < 0.05) && (
          <g>
            <circle cx={xToPx(extremes.minP.x)} cy={scaleY(extremes.minP.value)} r={3} fill={lineColor} />
            <text
              x={xToPx(extremes.minP.x)}
              y={scaleY(extremes.minP.value) + 14}
              textAnchor="middle"
              fill={lineColor}
              fontSize={11}
              fontWeight="600"
            >
              {formatNum(extremes.minP.value)}
            </text>
          </g>
        )}

      {/* Ось X */}
      <line
        x1={padding.left}
        y1={height - padding.bottom + 5}
        x2={padding.left + chartWidth}
        y2={height - padding.bottom + 5}
        stroke={PRINT_COLORS.text}
        strokeWidth={1}
      />
      <text x={padding.left} y={height - 8} fill={PRINT_COLORS.text} fontSize={12}>
        0
      </text>
      <text x={padding.left + chartWidth} y={height - 8} textAnchor="end" fill={PRINT_COLORS.text} fontSize={12}>
        {L} м
      </text>
      <text x={padding.left + chartWidth / 2} y={height - 8} textAnchor="middle" fill={PRINT_COLORS.textMuted} fontSize={12}>
        x, м
      </text>
    </svg>
  );
}
