"use client";

import { useMemo } from "react";

interface DiagramData {
  x: number[];
  values: number[];
}

interface Props {
  title: string;
  data: DiagramData;
  L: number;
  events: number[];
  unit: string;
  color: string;
  fillColor: string;
  invertY?: boolean;
  scale?: number;
  scaleUnit?: string;
}

export function BeamDiagram({
  title,
  data,
  L,
  events,
  unit,
  color,
  fillColor,
  invertY = false,
  scale = 1,
  scaleUnit,
}: Props) {
  const width = 600;
  const height = 200;
  const padding = { top: 30, right: 50, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const displayUnit = scaleUnit || unit;
  const scaledValues = useMemo(
    () => data.values.map((v) => v * scale),
    [data.values, scale]
  );

  // Находим min/max для масштабирования
  const { minVal, maxVal } = useMemo(() => {
    let min = Math.min(0, ...scaledValues);
    let max = Math.max(0, ...scaledValues);
    // Добавляем немного отступа
    const range = max - min || 1;
    min -= range * 0.1;
    max += range * 0.1;
    return { minVal: min, maxVal: max };
  }, [scaledValues]);

  // Функции масштабирования
  const scaleX = (x: number) => padding.left + (x / L) * chartWidth;
  const scaleY = (val: number) => {
    const normalized = (val - minVal) / (maxVal - minVal);
    // Инвертируем Y (SVG координаты растут вниз)
    const y = invertY ? normalized : 1 - normalized;
    return padding.top + y * chartHeight;
  };

  // Позиция нулевой линии
  const zeroY = scaleY(0);

  // Создаём путь для графика с заливкой
  const pathD = useMemo(() => {
    if (data.x.length === 0) return "";

    let d = `M ${scaleX(data.x[0])} ${zeroY}`;
    d += ` L ${scaleX(data.x[0])} ${scaleY(scaledValues[0])}`;

    for (let i = 1; i < data.x.length; i++) {
      d += ` L ${scaleX(data.x[i])} ${scaleY(scaledValues[i])}`;
    }

    d += ` L ${scaleX(data.x[data.x.length - 1])} ${zeroY}`;
    d += " Z";

    return d;
  }, [data.x, scaledValues, zeroY]);

  // Путь только для линии
  const lineD = useMemo(() => {
    if (data.x.length === 0) return "";

    let d = `M ${scaleX(data.x[0])} ${scaleY(scaledValues[0])}`;
    for (let i = 1; i < data.x.length; i++) {
      d += ` L ${scaleX(data.x[i])} ${scaleY(scaledValues[i])}`;
    }
    return d;
  }, [data.x, scaledValues]);

  // Находим ключевые точки для подписей
  const keyPoints = useMemo(() => {
    const points: { x: number; value: number }[] = [];

    // Добавляем точки в событиях
    for (const e of events) {
      const idx = data.x.findIndex((x) => Math.abs(x - e) < 0.001);
      if (idx !== -1) {
        points.push({ x: e, value: scaledValues[idx] });
      }
    }

    // Добавляем экстремумы
    let maxIdx = 0;
    let minIdx = 0;
    for (let i = 0; i < scaledValues.length; i++) {
      if (scaledValues[i] > scaledValues[maxIdx]) maxIdx = i;
      if (scaledValues[i] < scaledValues[minIdx]) minIdx = i;
    }

    if (
      !points.some(
        (p) => Math.abs(p.x - data.x[maxIdx]) < 0.1 && Math.abs(p.value - scaledValues[maxIdx]) < 0.1
      )
    ) {
      points.push({ x: data.x[maxIdx], value: scaledValues[maxIdx] });
    }
    if (
      !points.some(
        (p) => Math.abs(p.x - data.x[minIdx]) < 0.1 && Math.abs(p.value - scaledValues[minIdx]) < 0.1
      )
    ) {
      points.push({ x: data.x[minIdx], value: scaledValues[minIdx] });
    }

    return points.filter((p) => Math.abs(p.value) > 0.01);
  }, [events, data.x, scaledValues]);

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h4 className="font-medium mb-2 text-center">{title}</h4>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: "250px" }}
      >
        {/* Фон */}
        <rect
          x={padding.left}
          y={padding.top}
          width={chartWidth}
          height={chartHeight}
          fill="rgba(0,0,0,0.1)"
        />

        {/* Вертикальные линии событий (пунктир) */}
        {events.map((e, i) => (
          <line
            key={i}
            x1={scaleX(e)}
            y1={padding.top}
            x2={scaleX(e)}
            y2={padding.top + chartHeight}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="4,4"
          />
        ))}

        {/* Нулевая линия */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={padding.left + chartWidth}
          y2={zeroY}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
        />

        {/* Заливка */}
        <path d={pathD} fill={fillColor} />

        {/* Линия графика */}
        <path d={lineD} stroke={color} strokeWidth={2} fill="none" />

        {/* Подписи ключевых точек */}
        {keyPoints.map((p, i) => (
          <g key={i}>
            <circle cx={scaleX(p.x)} cy={scaleY(p.value)} r={3} fill={color} />
            <text
              x={scaleX(p.x)}
              y={scaleY(p.value) + (p.value >= 0 ? -8 : 14)}
              textAnchor="middle"
              fill={color}
              fontSize={11}
              fontFamily="monospace"
            >
              {p.value.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Ось X подписи */}
        <text
          x={padding.left}
          y={height - 5}
          fill="rgba(255,255,255,0.5)"
          fontSize={10}
        >
          0
        </text>
        <text
          x={padding.left + chartWidth}
          y={height - 5}
          textAnchor="end"
          fill="rgba(255,255,255,0.5)"
          fontSize={10}
        >
          {L} м
        </text>

        {/* Единицы измерения */}
        <text
          x={width - 5}
          y={padding.top + chartHeight / 2}
          textAnchor="end"
          fill="rgba(255,255,255,0.5)"
          fontSize={10}
        >
          {displayUnit}
        </text>
      </svg>
    </div>
  );
}
