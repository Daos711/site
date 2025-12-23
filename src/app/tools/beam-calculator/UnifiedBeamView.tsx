"use client";

import { useMemo } from "react";
import type { BeamInput, BeamResult, Load } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

// Размеры
const WIDTH = 800;
const PADDING = { left: 60, right: 40, top: 10, bottom: 10 };
const CHART_WIDTH = WIDTH - PADDING.left - PADDING.right;

// Высоты панелей
const BEAM_HEIGHT = 120;
const DIAGRAM_HEIGHT = 100;
const GAP = 8;

// Цвета (согласованы с темой сайта)
const COLORS = {
  beam: "rgb(148, 163, 184)", // slate-400
  support: "rgb(148, 163, 184)",
  load: "rgb(239, 68, 68)", // red-500
  reaction: "rgb(34, 197, 94)", // green-500
  moment: "rgb(168, 85, 247)", // purple-500
  Q: "rgb(239, 68, 68)", // red
  M: "rgb(34, 197, 94)", // green
  theta: "rgb(251, 146, 60)", // orange-400
  w: "rgb(59, 130, 246)", // blue
  grid: "rgba(255, 255, 255, 0.1)",
  boundary: "rgba(255, 255, 255, 0.2)",
  text: "rgba(255, 255, 255, 0.7)",
  textMuted: "rgba(255, 255, 255, 0.4)",
};

export function UnifiedBeamView({ input, result }: Props) {
  const { L, loads, beamType } = input;
  const { reactions, Q, M, theta, y, events } = result;

  // Функция преобразования x -> px (единая для всех)
  const xToPx = (x: number) => PADDING.left + (x / L) * CHART_WIDTH;

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
    // Добавляем точки опор для Q
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
      const segmentPoints = Math.ceil(
        (numPoints * (end - start)) / L
      );

      for (let j = 0; j <= segmentPoints; j++) {
        const x = start + (j / segmentPoints) * (end - start);
        const value = fn(x);
        currentSegment.push({ x, value });
      }

      // Проверяем, есть ли разрыв в конце сегмента
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
    DIAGRAM_HEIGHT + // Q
    GAP +
    DIAGRAM_HEIGHT + // M
    (hasDeflection ? GAP + DIAGRAM_HEIGHT : 0) + // theta
    (hasDeflection ? GAP + DIAGRAM_HEIGHT : 0) + // w
    30; // для подписи оси X

  // Вертикальные позиции панелей
  const beamY = 0;
  const qY = BEAM_HEIGHT + GAP;
  const mY = qY + DIAGRAM_HEIGHT + GAP;
  const thetaY = mY + DIAGRAM_HEIGHT + GAP;
  const wY = thetaY + (hasDeflection ? DIAGRAM_HEIGHT + GAP : 0);

  return (
    <div className="p-4 rounded-lg border border-border bg-card overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${totalHeight}`}
        className="w-full"
        style={{ minWidth: "600px" }}
      >
        {/* Определения маркеров-стрелок */}
        <defs>
          <marker
            id="arrowRed"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill={COLORS.load} />
          </marker>
          <marker
            id="arrowGreen"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill={COLORS.reaction} />
          </marker>
          <marker
            id="arrowPurple"
            markerWidth="8"
            markerHeight="8"
            refX="4"
            refY="4"
            orient="auto"
          >
            <path d="M0,0 L8,4 L0,8 L2,4 Z" fill={COLORS.moment} />
          </marker>
        </defs>

        {/* Сквозные вертикальные линии границ */}
        {boundaries.map((b, i) => (
          <line
            key={`boundary-${i}`}
            x1={xToPx(b)}
            y1={BEAM_HEIGHT - 20}
            x2={xToPx(b)}
            y2={totalHeight - 25}
            stroke={COLORS.boundary}
            strokeDasharray="4,4"
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
          boundaries={boundaries}
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
          boundaries={boundaries}
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
            boundaries={boundaries}
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
            boundaries={boundaries}
            scale={1000}
          />
        )}

        {/* Ось X внизу */}
        <g transform={`translate(0, ${totalHeight - 20})`}>
          <line
            x1={PADDING.left}
            y1={0}
            x2={PADDING.left + CHART_WIDTH}
            y2={0}
            stroke={COLORS.textMuted}
            strokeWidth={1}
          />
          <text
            x={PADDING.left}
            y={15}
            fill={COLORS.textMuted}
            fontSize={10}
          >
            0
          </text>
          <text
            x={PADDING.left + CHART_WIDTH}
            y={15}
            textAnchor="end"
            fill={COLORS.textMuted}
            fontSize={10}
          >
            {L} м
          </text>
          <text
            x={PADDING.left + CHART_WIDTH / 2}
            y={15}
            textAnchor="middle"
            fill={COLORS.textMuted}
            fontSize={10}
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
}

function BeamSchema({ input, result, xToPx, y, height }: BeamSchemaProps) {
  const { L, loads, beamType, supports } = input;
  const { reactions } = result;

  const beamY = y + height / 2 + 10;
  const beamThickness = 8;

  return (
    <g>
      {/* Балка */}
      <rect
        x={xToPx(0)}
        y={beamY - beamThickness / 2}
        width={xToPx(L) - xToPx(0)}
        height={beamThickness}
        fill={COLORS.beam}
        rx={2}
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

      {/* Реакции */}
      {reactions.RA !== undefined && reactions.RA !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xA ?? 0)}
          y={beamY + beamThickness / 2 + 25}
          value={reactions.RA}
          label={`R_A=${Math.abs(reactions.RA).toFixed(1)}`}
        />
      )}
      {reactions.RB !== undefined && reactions.RB !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xB ?? L)}
          y={beamY + beamThickness / 2 + 25}
          value={reactions.RB}
          label={`R_B=${Math.abs(reactions.RB).toFixed(1)}`}
        />
      )}
      {reactions.Rf !== undefined && reactions.Rf !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xf ?? 0)}
          y={beamY + beamThickness / 2 + 25}
          value={reactions.Rf}
          label={`R_f=${Math.abs(reactions.Rf).toFixed(1)}`}
        />
      )}

      {/* Нагрузки */}
      {loads.map((load, i) => {
        if (load.type === "distributed") {
          return (
            <DistributedLoadArrows
              key={i}
              x1={xToPx(load.a)}
              x2={xToPx(load.b)}
              y={beamY - beamThickness / 2}
              q={load.q}
              label={`q${i + 1}=${Math.abs(load.q)}`}
            />
          );
        } else if (load.type === "force") {
          return (
            <ForceArrow
              key={i}
              x={xToPx(load.x)}
              y={beamY - beamThickness / 2}
              F={load.F}
              label={`F${i + 1}=${Math.abs(load.F)}`}
            />
          );
        } else {
          return (
            <MomentArrow
              key={i}
              x={xToPx(load.x)}
              y={beamY}
              M={load.M}
              label={`M${i + 1}=${Math.abs(load.M)}`}
            />
          );
        }
      })}

      {/* Подписи A и B */}
      {beamType === "simply-supported" && (
        <>
          <text
            x={xToPx(0)}
            y={beamY + 50}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={12}
            fontWeight="bold"
          >
            A
          </text>
          <text
            x={xToPx(L)}
            y={beamY + 50}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={12}
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
  const size = 15;
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}`}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2}
      />
      <line
        x1={x - size / 2 - 3}
        y1={y + size + 2}
        x2={x + size / 2 + 3}
        y2={y + size + 2}
        stroke={COLORS.support}
        strokeWidth={2}
      />
    </g>
  );
}

// Каток
function RollerSupport({ x, y }: { x: number; y: number }) {
  const size = 15;
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}`}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2}
      />
      <circle
        cx={x - size / 4}
        cy={y + size + 5}
        r={4}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2}
      />
      <circle
        cx={x + size / 4}
        cy={y + size + 5}
        r={4}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={2}
      />
      <line
        x1={x - size / 2 - 3}
        y1={y + size + 11}
        x2={x + size / 2 + 3}
        y2={y + size + 11}
        stroke={COLORS.support}
        strokeWidth={2}
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
  const h = 30;
  const dir = side === "left" ? -1 : 1;
  return (
    <g>
      <line
        x1={x}
        y1={y - h / 2}
        x2={x}
        y2={y + h / 2}
        stroke={COLORS.support}
        strokeWidth={3}
      />
      {/* Штриховка */}
      {[-12, -6, 0, 6, 12].map((dy, i) => (
        <line
          key={i}
          x1={x}
          y1={y + dy}
          x2={x + dir * 8}
          y2={y + dy - 6}
          stroke={COLORS.support}
          strokeWidth={1.5}
        />
      ))}
    </g>
  );
}

// Стрелка реакции (вверх)
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
  const arrowLen = 30;
  const dir = value >= 0 ? -1 : 1; // + вверх
  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={x}
        y2={y + dir * arrowLen}
        stroke={COLORS.reaction}
        strokeWidth={2}
        markerEnd="url(#arrowGreen)"
      />
      <text
        x={x + 5}
        y={y + dir * arrowLen / 2}
        fill={COLORS.reaction}
        fontSize={9}
        dominantBaseline="middle"
      >
        {label}
      </text>
    </g>
  );
}

// Распределённая нагрузка
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
  const arrowLen = 25;
  const numArrows = Math.max(3, Math.floor((x2 - x1) / 20));
  const dir = q >= 0 ? -1 : 1; // + вниз в конвенции, но стрелки рисуем сверху

  return (
    <g>
      {/* Верхняя линия */}
      <line
        x1={x1}
        y1={y - arrowLen}
        x2={x2}
        y2={y - arrowLen}
        stroke={COLORS.load}
        strokeWidth={1.5}
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
            y2={y - 3}
            stroke={COLORS.load}
            strokeWidth={1.5}
            markerEnd="url(#arrowRed)"
          />
        );
      })}
      {/* Подпись */}
      <text
        x={(x1 + x2) / 2}
        y={y - arrowLen - 8}
        textAnchor="middle"
        fill={COLORS.load}
        fontSize={9}
      >
        {label}
      </text>
    </g>
  );
}

// Сосредоточенная сила
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
  const arrowLen = 35;
  return (
    <g>
      <line
        x1={x}
        y1={y - arrowLen}
        x2={x}
        y2={y - 3}
        stroke={COLORS.load}
        strokeWidth={2}
        markerEnd="url(#arrowRed)"
      />
      <text
        x={x + 5}
        y={y - arrowLen + 5}
        fill={COLORS.load}
        fontSize={9}
      >
        {label}
      </text>
    </g>
  );
}

// Момент (дуговая стрелка)
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
  const r = 15;
  // M > 0 = против часовой
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
        strokeWidth={2}
        markerEnd="url(#arrowPurple)"
      />
      <text
        x={x}
        y={y - r - 10}
        textAnchor="middle"
        fill={COLORS.moment}
        fontSize={9}
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
  boundaries: number[];
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
  boundaries,
  scale = 1,
}: DiagramPanelProps) {
  // Масштабируем значения
  const scaledSegments = segments.map((seg) =>
    seg.map((p) => ({ x: p.x, value: p.value * scale }))
  );

  // Находим min/max
  const allValues = scaledSegments.flat().map((p) => p.value);
  let minVal = Math.min(0, ...allValues);
  let maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;
  minVal -= range * 0.15;
  maxVal += range * 0.15;

  const chartHeight = height - 20;
  const chartY = y + 10;

  const scaleY = (val: number) => {
    const normalized = (val - minVal) / (maxVal - minVal);
    return chartY + (1 - normalized) * chartHeight;
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

  return (
    <g>
      {/* Фон */}
      <rect
        x={PADDING.left}
        y={chartY}
        width={CHART_WIDTH}
        height={chartHeight}
        fill="rgba(0,0,0,0.15)"
        rx={2}
      />

      {/* Нулевая линия */}
      <line
        x1={PADDING.left}
        y1={zeroY}
        x2={PADDING.left + CHART_WIDTH}
        y2={zeroY}
        stroke={COLORS.grid}
        strokeWidth={1}
      />

      {/* Заголовок */}
      <text
        x={PADDING.left - 8}
        y={chartY + chartHeight / 2}
        textAnchor="end"
        dominantBaseline="middle"
        fill={color}
        fontSize={11}
        fontWeight="bold"
      >
        {title}
      </text>

      {/* Единицы */}
      <text
        x={PADDING.left + CHART_WIDTH + 5}
        y={chartY + chartHeight / 2}
        dominantBaseline="middle"
        fill={COLORS.textMuted}
        fontSize={9}
      >
        {unit}
      </text>

      {/* Сегменты графика */}
      {scaledSegments.map((segment, segIdx) => {
        if (segment.length < 2) return null;

        // Путь заливки
        let fillD = `M ${xToPx(segment[0].x)} ${zeroY}`;
        fillD += ` L ${xToPx(segment[0].x)} ${scaleY(segment[0].value)}`;
        for (const p of segment.slice(1)) {
          fillD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }
        fillD += ` L ${xToPx(segment[segment.length - 1].x)} ${zeroY} Z`;

        // Путь линии
        let lineD = `M ${xToPx(segment[0].x)} ${scaleY(segment[0].value)}`;
        for (const p of segment.slice(1)) {
          lineD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }

        return (
          <g key={segIdx}>
            <path d={fillD} fill={color} fillOpacity={0.15} />
            <path d={lineD} stroke={color} strokeWidth={1.5} fill="none" />
          </g>
        );
      })}

      {/* Маркеры экстремумов */}
      {Math.abs(extremes.maxP.value) > 0.01 && (
        <g>
          <circle
            cx={xToPx(extremes.maxP.x)}
            cy={scaleY(extremes.maxP.value)}
            r={3}
            fill={color}
          />
          <text
            x={xToPx(extremes.maxP.x)}
            y={scaleY(extremes.maxP.value) - 6}
            textAnchor="middle"
            fill={color}
            fontSize={8}
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
              r={3}
              fill={color}
            />
            <text
              x={xToPx(extremes.minP.x)}
              y={scaleY(extremes.minP.value) + 12}
              textAnchor="middle"
              fill={color}
              fontSize={8}
            >
              {extremes.minP.value.toFixed(2)}
            </text>
          </g>
        )}
    </g>
  );
}
