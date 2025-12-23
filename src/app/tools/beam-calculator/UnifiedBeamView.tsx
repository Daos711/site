"use client";

import { useMemo } from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

// Размеры (адаптивные)
const PADDING = { left: 70, right: 50, top: 15, bottom: 15 };

// Высоты панелей (увеличенные)
const BEAM_HEIGHT = 140;
const DIAGRAM_HEIGHT = 120;
const GAP = 12;

// Цвета (разные для разных типов нагрузок)
const COLORS = {
  beam: "rgb(100, 116, 139)", // slate-500
  support: "rgb(148, 163, 184)", // slate-400
  distributedLoad: "rgb(59, 130, 246)", // blue-500 (q - синий)
  pointForce: "rgb(239, 68, 68)", // red-500 (F - красный)
  moment: "rgb(168, 85, 247)", // purple-500 (M - фиолетовый)
  reaction: "rgb(34, 197, 94)", // green-500 (реакции - зелёный)
  Q: "rgb(239, 68, 68)", // red
  M: "rgb(34, 197, 94)", // green
  theta: "rgb(251, 146, 60)", // orange-400
  w: "rgb(59, 130, 246)", // blue
  grid: "rgba(255, 255, 255, 0.15)",
  boundary: "rgba(255, 255, 255, 0.25)",
  text: "rgba(255, 255, 255, 0.85)",
  textMuted: "rgba(255, 255, 255, 0.5)",
};

export function UnifiedBeamView({ input, result }: Props) {
  const { L, loads, beamType } = input;
  const { reactions, Q, M, theta, y, events } = result;

  // Собираем все границы участков
  const boundaries = useMemo(() => {
    const points = new Set<number>([0, L]);
    for (const e of events) {
      points.add(e);
    }
    return Array.from(points).sort((a, b) => a - b);
  }, [events, L]);

  // Точки разрывов (где есть скачки Q или M)
  const discontinuities = useMemo(() => {
    const disc = new Set<number>();
    for (const load of loads) {
      if (load.type === "force") {
        disc.add(load.x);
      } else if (load.type === "moment") {
        disc.add(load.x);
      }
    }
    if (reactions.xA !== undefined) disc.add(reactions.xA);
    if (reactions.xB !== undefined) disc.add(reactions.xB);
    if (reactions.xf !== undefined) disc.add(reactions.xf);
    return disc;
  }, [loads, reactions]);

  // Генерация данных для графика с учётом разрывов
  const generateData = (
    fn: (x: number) => number,
    numPoints = 300
  ): { x: number; value: number }[][] => {
    const segments: { x: number; value: number }[][] = [];
    let currentSegment: { x: number; value: number }[] = [];

    const sortedBoundaries = [...boundaries];

    for (let i = 0; i < sortedBoundaries.length - 1; i++) {
      const start = sortedBoundaries[i];
      const end = sortedBoundaries[i + 1];
      const segmentPoints = Math.ceil((numPoints * (end - start)) / L);

      for (let j = 0; j <= segmentPoints; j++) {
        const x = start + (j / segmentPoints) * (end - start);
        const value = fn(x);
        currentSegment.push({ x, value });
      }

      if (discontinuities.has(end) && i < sortedBoundaries.length - 2) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  };

  // Данные для графиков
  const qData = useMemo(() => generateData(Q), [Q, boundaries, discontinuities]);
  const mData = useMemo(() => generateData(M), [M, boundaries, discontinuities]);
  const thetaData = useMemo(
    () => (theta ? generateData(theta) : []),
    [theta, boundaries, discontinuities]
  );
  const wData = useMemo(
    () => (y ? generateData(y) : []),
    [y, boundaries, discontinuities]
  );

  // Вычисляем общую высоту
  const hasDeflection = !!y;
  const totalHeight =
    BEAM_HEIGHT +
    GAP +
    DIAGRAM_HEIGHT +
    GAP +
    DIAGRAM_HEIGHT +
    (hasDeflection ? GAP + DIAGRAM_HEIGHT : 0) +
    (hasDeflection ? GAP + DIAGRAM_HEIGHT : 0) +
    40;

  // Используем viewBox для масштабирования
  const viewBoxWidth = 900;
  const chartWidth = viewBoxWidth - PADDING.left - PADDING.right;

  // Функция преобразования x -> px (единая для всех)
  const xToPx = (x: number) => PADDING.left + (x / L) * chartWidth;

  // Вертикальные позиции панелей
  const beamY = 0;
  const qY = BEAM_HEIGHT + GAP;
  const mY = qY + DIAGRAM_HEIGHT + GAP;
  const thetaY = mY + DIAGRAM_HEIGHT + GAP;
  const wY = thetaY + (hasDeflection ? DIAGRAM_HEIGHT + GAP : 0);

  return (
    <div className="rounded-lg border border-border bg-card">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${totalHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Определения маркеров-стрелок */}
        <defs>
          <marker
            id="arrowBlue"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill={COLORS.distributedLoad} />
          </marker>
          <marker
            id="arrowRed"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill={COLORS.pointForce} />
          </marker>
          <marker
            id="arrowGreen"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill={COLORS.reaction} />
          </marker>
          <marker
            id="arrowPurple"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 L3,5 Z" fill={COLORS.moment} />
          </marker>
        </defs>

        {/* Сквозные вертикальные линии границ */}
        {boundaries.map((b, i) => (
          <line
            key={`boundary-${i}`}
            x1={xToPx(b)}
            y1={BEAM_HEIGHT - 10}
            x2={xToPx(b)}
            y2={totalHeight - 35}
            stroke={COLORS.boundary}
            strokeDasharray="6,4"
            strokeWidth={1}
          />
        ))}

        {/* Панель: Схема балки */}
        <BeamSchema
          input={input}
          result={result}
          xToPx={xToPx}
          y={beamY}
          height={BEAM_HEIGHT}
          chartWidth={chartWidth}
        />

        {/* Панель: Q(x) */}
        <DiagramPanel
          title="Q(x)"
          unit="кН"
          segments={qData}
          xToPx={xToPx}
          y={qY}
          height={DIAGRAM_HEIGHT}
          color={COLORS.Q}
          chartWidth={chartWidth}
        />

        {/* Панель: M(x) */}
        <DiagramPanel
          title="M(x)"
          unit="кН·м"
          segments={mData}
          xToPx={xToPx}
          y={mY}
          height={DIAGRAM_HEIGHT}
          color={COLORS.M}
          chartWidth={chartWidth}
        />

        {/* Панель: θ(x) */}
        {hasDeflection && (
          <DiagramPanel
            title="θ(x)"
            unit="рад"
            segments={thetaData}
            xToPx={xToPx}
            y={thetaY}
            height={DIAGRAM_HEIGHT}
            color={COLORS.theta}
            chartWidth={chartWidth}
            scale={1}
          />
        )}

        {/* Панель: w(x) */}
        {hasDeflection && (
          <DiagramPanel
            title="w(x)"
            unit="мм"
            segments={wData}
            xToPx={xToPx}
            y={wY}
            height={DIAGRAM_HEIGHT}
            color={COLORS.w}
            chartWidth={chartWidth}
            scale={1000}
          />
        )}

        {/* Ось X внизу */}
        <g transform={`translate(0, ${totalHeight - 30})`}>
          <line
            x1={PADDING.left}
            y1={0}
            x2={PADDING.left + chartWidth}
            y2={0}
            stroke={COLORS.textMuted}
            strokeWidth={1}
          />
          <text x={PADDING.left} y={18} fill={COLORS.text} fontSize={13}>
            0
          </text>
          <text
            x={PADDING.left + chartWidth}
            y={18}
            textAnchor="end"
            fill={COLORS.text}
            fontSize={13}
          >
            {L} м
          </text>
          <text
            x={PADDING.left + chartWidth / 2}
            y={18}
            textAnchor="middle"
            fill={COLORS.textMuted}
            fontSize={13}
          >
            x, м
          </text>
        </g>
      </svg>
    </div>
  );
}

// Компонент схемы балки
interface BeamSchemaProps {
  input: BeamInput;
  result: BeamResult;
  xToPx: (x: number) => number;
  y: number;
  height: number;
  chartWidth: number;
}

function BeamSchema({ input, result, xToPx, y, height, chartWidth }: BeamSchemaProps) {
  const { L, loads, beamType } = input;
  const { reactions } = result;

  const beamY = y + height / 2;
  const beamThickness = 12;

  return (
    <g>
      {/* Балка */}
      <rect
        x={xToPx(0)}
        y={beamY - beamThickness / 2}
        width={xToPx(L) - xToPx(0)}
        height={beamThickness}
        fill={COLORS.beam}
        rx={3}
      />

      {/* Опоры */}
      {beamType === "simply-supported" && (
        <>
          <PinSupport x={xToPx(0)} y={beamY + beamThickness / 2} />
          <RollerSupport x={xToPx(L)} y={beamY + beamThickness / 2} />
        </>
      )}
      {beamType === "cantilever-left" && (
        <FixedSupport x={xToPx(0)} y={beamY} side="left" />
      )}
      {beamType === "cantilever-right" && (
        <FixedSupport x={xToPx(L)} y={beamY} side="right" />
      )}

      {/* Нагрузки (рисуем первыми, чтобы были под реакциями) */}
      {loads.map((load, i) => {
        if (load.type === "distributed") {
          return (
            <DistributedLoadArrows
              key={i}
              x1={xToPx(load.a)}
              x2={xToPx(load.b)}
              y={beamY - beamThickness / 2}
              q={load.q}
              label={`q = ${Math.abs(load.q)} кН/м`}
            />
          );
        } else if (load.type === "force") {
          return (
            <ForceArrow
              key={i}
              x={xToPx(load.x)}
              y={beamY - beamThickness / 2}
              F={load.F}
              label={`F = ${Math.abs(load.F)} кН`}
            />
          );
        } else {
          return (
            <MomentArrow
              key={i}
              x={xToPx(load.x)}
              y={beamY}
              M={load.M}
              label={`M = ${Math.abs(load.M)} кН·м`}
            />
          );
        }
      })}

      {/* Реакции (зелёные стрелки вверх от опор) */}
      {reactions.RA !== undefined && reactions.RA !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xA ?? 0)}
          y={beamY + beamThickness / 2 + 35}
          value={reactions.RA}
          label={`R_A = ${reactions.RA.toFixed(1)} кН`}
        />
      )}
      {reactions.RB !== undefined && reactions.RB !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xB ?? L)}
          y={beamY + beamThickness / 2 + 35}
          value={reactions.RB}
          label={`R_B = ${reactions.RB.toFixed(1)} кН`}
        />
      )}
      {reactions.Rf !== undefined && reactions.Rf !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xf ?? 0)}
          y={beamY + beamThickness / 2 + 35}
          value={reactions.Rf}
          label={`R = ${reactions.Rf.toFixed(1)} кН`}
        />
      )}

      {/* Подписи A и B */}
      {beamType === "simply-supported" && (
        <>
          <text
            x={xToPx(0)}
            y={beamY + 65}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={16}
            fontWeight="bold"
          >
            A
          </text>
          <text
            x={xToPx(L)}
            y={beamY + 65}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={16}
            fontWeight="bold"
          >
            B
          </text>
        </>
      )}
    </g>
  );
}

// Шарнирная опора
function PinSupport({ x, y }: { x: number; y: number }) {
  const size = 20;
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}`}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2.5}
      />
      <line
        x1={x - size / 2 - 5}
        y1={y + size + 3}
        x2={x + size / 2 + 5}
        y2={y + size + 3}
        stroke={COLORS.support}
        strokeWidth={2.5}
      />
    </g>
  );
}

// Каток
function RollerSupport({ x, y }: { x: number; y: number }) {
  const size = 20;
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}`}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2.5}
      />
      <circle
        cx={x - size / 4}
        cy={y + size + 6}
        r={5}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2}
      />
      <circle
        cx={x + size / 4}
        cy={y + size + 6}
        r={5}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2}
      />
      <line
        x1={x - size / 2 - 5}
        y1={y + size + 13}
        x2={x + size / 2 + 5}
        y2={y + size + 13}
        stroke={COLORS.support}
        strokeWidth={2.5}
      />
    </g>
  );
}

// Заделка
function FixedSupport({
  x,
  y,
  side,
}: {
  x: number;
  y: number;
  side: "left" | "right";
}) {
  const h = 40;
  const dir = side === "left" ? -1 : 1;
  return (
    <g>
      <line
        x1={x}
        y1={y - h / 2}
        x2={x}
        y2={y + h / 2}
        stroke={COLORS.support}
        strokeWidth={4}
      />
      {[-15, -7.5, 0, 7.5, 15].map((dy, i) => (
        <line
          key={i}
          x1={x}
          y1={y + dy}
          x2={x + dir * 12}
          y2={y + dy - 8}
          stroke={COLORS.support}
          strokeWidth={2}
        />
      ))}
    </g>
  );
}

// Стрелка реакции (вверх от опоры)
function ReactionArrow({
  x,
  y,
  value,
  label,
}: {
  x: number;
  y: number;
  value: number;
  label: string;
}) {
  const arrowLen = 35;
  // Реакция положительная = вверх, стрелка идёт снизу вверх
  const startY = y;
  const endY = y - arrowLen;

  return (
    <g>
      <line
        x1={x}
        y1={startY}
        x2={x}
        y2={endY}
        stroke={COLORS.reaction}
        strokeWidth={2.5}
        markerEnd="url(#arrowGreen)"
      />
      <text
        x={x + 8}
        y={(startY + endY) / 2}
        fill={COLORS.reaction}
        fontSize={12}
        fontWeight="500"
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

// Распределённая нагрузка (СИНЯЯ)
function DistributedLoadArrows({
  x1,
  x2,
  y,
  q,
  label,
}: {
  x1: number;
  x2: number;
  y: number;
  q: number;
  label: string;
}) {
  const arrowLen = 30;
  const numArrows = Math.max(5, Math.floor((x2 - x1) / 25));

  return (
    <g>
      {/* Верхняя линия */}
      <line
        x1={x1}
        y1={y - arrowLen}
        x2={x2}
        y2={y - arrowLen}
        stroke={COLORS.distributedLoad}
        strokeWidth={2}
      />
      {/* Стрелки */}
      {Array.from({ length: numArrows }).map((_, i) => {
        const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
        return (
          <line
            key={i}
            x1={px}
            y1={y - arrowLen}
            x2={px}
            y2={y - 4}
            stroke={COLORS.distributedLoad}
            strokeWidth={2}
            markerEnd="url(#arrowBlue)"
          />
        );
      })}
      {/* Подпись */}
      <text
        x={(x1 + x2) / 2}
        y={y - arrowLen - 10}
        textAnchor="middle"
        fill={COLORS.distributedLoad}
        fontSize={13}
        fontWeight="500"
      >
        {label}
      </text>
    </g>
  );
}

// Сосредоточенная сила (КРАСНАЯ)
function ForceArrow({
  x,
  y,
  F,
  label,
}: {
  x: number;
  y: number;
  F: number;
  label: string;
}) {
  const arrowLen = 40;
  return (
    <g>
      <line
        x1={x}
        y1={y - arrowLen}
        x2={x}
        y2={y - 4}
        stroke={COLORS.pointForce}
        strokeWidth={2.5}
        markerEnd="url(#arrowRed)"
      />
      <text
        x={x + 8}
        y={y - arrowLen + 8}
        fill={COLORS.pointForce}
        fontSize={13}
        fontWeight="500"
      >
        {label}
      </text>
    </g>
  );
}

// Момент (дуговая стрелка, ФИОЛЕТОВАЯ)
function MomentArrow({
  x,
  y,
  M,
  label,
}: {
  x: number;
  y: number;
  M: number;
  label: string;
}) {
  const r = 18;
  const sweep = M >= 0 ? 0 : 1;
  const startAngle = -30;
  const endAngle = 210;

  const x1 = x + r * Math.cos((startAngle * Math.PI) / 180);
  const y1 = y - r * Math.sin((startAngle * Math.PI) / 180);
  const x2 = x + r * Math.cos((endAngle * Math.PI) / 180);
  const y2 = y - r * Math.sin((endAngle * Math.PI) / 180);

  return (
    <g>
      <path
        d={`M ${x1} ${y1} A ${r} ${r} 0 1 ${sweep} ${x2} ${y2}`}
        fill="none"
        stroke={COLORS.moment}
        strokeWidth={2.5}
        markerEnd="url(#arrowPurple)"
      />
      <text
        x={x}
        y={y - r - 12}
        textAnchor="middle"
        fill={COLORS.moment}
        fontSize={13}
        fontWeight="500"
      >
        {label}
      </text>
    </g>
  );
}

// Компонент панели диаграммы
interface DiagramPanelProps {
  title: string;
  unit: string;
  segments: { x: number; value: number }[][];
  xToPx: (x: number) => number;
  y: number;
  height: number;
  color: string;
  chartWidth: number;
  scale?: number;
}

function DiagramPanel({
  title,
  unit,
  segments,
  xToPx,
  y,
  height,
  color,
  chartWidth,
  scale = 1,
}: DiagramPanelProps) {
  const scaledSegments = segments.map((seg) =>
    seg.map((p) => ({ x: p.x, value: p.value * scale }))
  );

  const allValues = scaledSegments.flat().map((p) => p.value);
  let minVal = Math.min(0, ...allValues);
  let maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;
  minVal -= range * 0.15;
  maxVal += range * 0.15;

  const chartHeight = height - 25;
  const chartY = y + 12;

  const scaleY = (val: number) => {
    const normalized = (val - minVal) / (maxVal - minVal);
    return chartY + (1 - normalized) * chartHeight;
  };

  const zeroY = scaleY(0);

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

  return (
    <g>
      {/* Фон */}
      <rect
        x={PADDING.left}
        y={chartY}
        width={chartWidth}
        height={chartHeight}
        fill="rgba(0,0,0,0.2)"
        rx={4}
      />

      {/* Нулевая линия */}
      <line
        x1={PADDING.left}
        y1={zeroY}
        x2={PADDING.left + chartWidth}
        y2={zeroY}
        stroke={COLORS.grid}
        strokeWidth={1}
      />

      {/* Заголовок слева */}
      <text
        x={PADDING.left - 12}
        y={chartY + chartHeight / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fill={color}
        fontSize={16}
        fontWeight="bold"
      >
        {title}
      </text>

      {/* Единицы справа */}
      <text
        x={PADDING.left + chartWidth + 8}
        y={chartY + chartHeight / 2}
        dominantBaseline="middle"
        fill={COLORS.textMuted}
        fontSize={12}
      >
        {unit}
      </text>

      {/* Сегменты графика */}
      {scaledSegments.map((segment, segIdx) => {
        if (segment.length < 2) return null;

        let fillD = `M ${xToPx(segment[0].x)} ${zeroY}`;
        fillD += ` L ${xToPx(segment[0].x)} ${scaleY(segment[0].value)}`;
        for (const p of segment.slice(1)) {
          fillD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }
        fillD += ` L ${xToPx(segment[segment.length - 1].x)} ${zeroY} Z`;

        let lineD = `M ${xToPx(segment[0].x)} ${scaleY(segment[0].value)}`;
        for (const p of segment.slice(1)) {
          lineD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }

        return (
          <g key={segIdx}>
            <path d={fillD} fill={color} fillOpacity={0.2} />
            <path d={lineD} stroke={color} strokeWidth={2} fill="none" />
          </g>
        );
      })}

      {/* Маркеры экстремумов */}
      {Math.abs(extremes.maxP.value) > 0.01 && (
        <g>
          <circle
            cx={xToPx(extremes.maxP.x)}
            cy={scaleY(extremes.maxP.value)}
            r={4}
            fill={color}
          />
          <text
            x={xToPx(extremes.maxP.x)}
            y={scaleY(extremes.maxP.value) - 10}
            textAnchor="middle"
            fill={color}
            fontSize={12}
            fontWeight="500"
          >
            {extremes.maxP.value.toFixed(2)}
          </text>
        </g>
      )}
      {Math.abs(extremes.minP.value) > 0.01 &&
        extremes.minP.x !== extremes.maxP.x && (
          <g>
            <circle
              cx={xToPx(extremes.minP.x)}
              cy={scaleY(extremes.minP.value)}
              r={4}
              fill={color}
            />
            <text
              x={xToPx(extremes.minP.x)}
              y={scaleY(extremes.minP.value) + 16}
              textAnchor="middle"
              fill={color}
              fontSize={12}
              fontWeight="500"
            >
              {extremes.minP.value.toFixed(2)}
            </text>
          </g>
        )}
    </g>
  );
}
