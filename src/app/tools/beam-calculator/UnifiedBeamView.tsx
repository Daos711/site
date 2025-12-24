"use client";

import React, { useMemo } from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

// Увеличенные размеры для читаемости
const PADDING = { left: 80, right: 60, top: 20, bottom: 20 };

// Высоты панелей (значительно увеличены)
const BEAM_HEIGHT = 200;
const DIAGRAM_HEIGHT = 160;
const GAP = 16;

// Цвета как в sopromat: Q=синий, M=красный, реакции=зелёный
const COLORS = {
  beam: "rgb(100, 116, 139)",
  support: "rgb(148, 163, 184)",
  distributedLoad: "rgb(59, 130, 246)", // синий
  pointForce: "rgb(239, 68, 68)", // красный
  moment: "rgb(168, 85, 247)", // фиолетовый
  reaction: "rgb(34, 197, 94)", // зелёный
  Q: "rgb(59, 130, 246)", // СИНИЙ как в sopromat
  M: "rgb(239, 68, 68)", // КРАСНЫЙ как в sopromat
  theta: "rgb(251, 146, 60)", // оранжевый
  w: "rgb(96, 165, 250)", // голубой
  grid: "rgba(255, 255, 255, 0.2)",
  boundary: "rgba(255, 255, 255, 0.5)", // более заметные
  text: "rgba(255, 255, 255, 0.9)",
  textMuted: "rgba(255, 255, 255, 0.6)",
};

// Форматирование числа без лишних нулей: 31.00 → "31", 31.50 → "31.5"
// Умная точность: для малых значений (< 0.1) показываем больше знаков
function formatNum(val: number, decimals = 2): string {
  // Сначала проверяем на ноль (включая -0)
  if (Math.abs(val) < 1e-10) return "0";

  // Для малых значений увеличиваем точность
  const absVal = Math.abs(val);
  let actualDecimals = decimals;
  if (absVal < 0.001) {
    actualDecimals = 5; // Для очень малых значений (углы в радианах)
  } else if (absVal < 0.01) {
    actualDecimals = 4;
  } else if (absVal < 0.1) {
    actualDecimals = 3;
  }

  const fixed = val.toFixed(actualDecimals);
  // Убираем trailing zeros после точки
  const result = fixed.replace(/\.?0+$/, "");
  // Защита от "-0"
  return result === "-0" ? "0" : result;
}

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

  // Точки разрывов Q (сосредоточенные силы и опоры — включая границы 0 и L)
  const qDiscontinuities = useMemo(() => {
    const disc = new Set<number>([0, L]); // Границы тоже разрывы!
    for (const load of loads) {
      if (load.type === "force") {
        disc.add(load.x);
      }
    }
    if (reactions.xA !== undefined) disc.add(reactions.xA);
    if (reactions.xB !== undefined) disc.add(reactions.xB);
    if (reactions.xf !== undefined) disc.add(reactions.xf);
    return disc;
  }, [loads, reactions, L]);

  // Точки разрывов M (внешние моменты)
  const mDiscontinuities = useMemo(() => {
    const disc = new Set<number>();
    for (const load of loads) {
      if (load.type === "moment") {
        disc.add(load.x);
      }
    }
    return disc;
  }, [loads]);

  // Генерация данных для графика БЕЗ вертикальных соединений
  const generateSegments = (
    fn: (x: number) => number,
    discontinuities: Set<number>,
    numPoints = 400
  ): { x: number; value: number; isDiscontinuity: boolean }[][] => {
    const segments: { x: number; value: number; isDiscontinuity: boolean }[][] = [];
    const allPoints = Array.from(new Set([0, ...discontinuities, L])).sort((a, b) => a - b);

    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      const segment: { x: number; value: number; isDiscontinuity: boolean }[] = [];

      const segmentPoints = Math.max(30, Math.ceil((numPoints * (end - start)) / L));

      for (let j = 0; j <= segmentPoints; j++) {
        const t = j / segmentPoints;
        const x = start + t * (end - start);
        // Сдвигаем точку от границы чтобы не попасть в разрыв
        const eps = 1e-9;
        let evalX = x;
        if (j === 0) evalX = start + eps;
        if (j === segmentPoints) evalX = end - eps;

        const value = fn(evalX);
        const isDiscontinuity = (j === 0 && discontinuities.has(start)) ||
                                (j === segmentPoints && discontinuities.has(end));
        segment.push({ x, value, isDiscontinuity });
      }

      if (segment.length > 1) {
        segments.push(segment);
      }
    }

    return segments;
  };

  // Данные для графиков
  const qSegments = useMemo(() => generateSegments(Q, qDiscontinuities), [Q, qDiscontinuities]);
  const mSegments = useMemo(() => generateSegments(M, mDiscontinuities), [M, mDiscontinuities]);
  const thetaSegments = useMemo(
    () => (theta ? generateSegments(theta, new Set()) : []),
    [theta]
  );
  const wSegments = useMemo(
    () => (y ? generateSegments(y, new Set()) : []),
    [y]
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
    50;

  const viewBoxWidth = 1000;
  const chartWidth = viewBoxWidth - PADDING.left - PADDING.right;

  const xToPx = (x: number) => PADDING.left + (x / L) * chartWidth;

  const beamY = 0;
  const qY = BEAM_HEIGHT + GAP;
  const mY = qY + DIAGRAM_HEIGHT + GAP;
  const thetaY = mY + DIAGRAM_HEIGHT + GAP;
  const wY = thetaY + (hasDeflection ? DIAGRAM_HEIGHT + GAP : 0);

  return (
    <div className="rounded-lg border border-border bg-card" style={{ minHeight: "700px" }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${totalHeight}`}
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        style={{ minHeight: "700px" }}
      >
        {/* Определения маркеров-стрелок и clipPath для диаграмм */}
        <defs>
          <marker id="arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.distributedLoad} />
          </marker>
          <marker id="arrowBlueUp" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
            <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.distributedLoad} />
          </marker>
          <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.pointForce} />
          </marker>
          <marker id="arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.reaction} />
          </marker>
          <marker id="arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.moment} />
          </marker>
          {/* ClipPath для обрезки вертикальных краёв заливки диаграмм */}
          <clipPath id="diagramClip">
            <rect x={PADDING.left + 1} y={0} width={chartWidth - 2} height={totalHeight} />
          </clipPath>
        </defs>

        {/* Сквозные вертикальные пунктирные линии границ - от балки до низа */}
        {boundaries.map((b, i) => (
          <line
            key={`boundary-${i}`}
            x1={xToPx(b)}
            y1={BEAM_HEIGHT / 2 + 20}
            x2={xToPx(b)}
            y2={totalHeight - 45}
            stroke={COLORS.boundary}
            strokeDasharray="8,6"
            strokeWidth={1.5}
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

        {/* Панель: Q(x) - СИНИЙ */}
        <DiagramPanel
          title="Q(x)"
          unit="кН"
          segments={qSegments}
          xToPx={xToPx}
          y={qY}
          height={DIAGRAM_HEIGHT}
          color={COLORS.Q}
          chartWidth={chartWidth}
          boundaries={boundaries}
        />

        {/* Панель: M(x) - КРАСНЫЙ */}
        <DiagramPanel
          title="M(x)"
          unit="кН·м"
          segments={mSegments}
          xToPx={xToPx}
          y={mY}
          height={DIAGRAM_HEIGHT}
          color={COLORS.M}
          chartWidth={chartWidth}
          boundaries={boundaries}
        />

        {/* Панель: θ(x) */}
        {hasDeflection && (
          <DiagramPanel
            title="θ(x)"
            unit="рад"
            segments={thetaSegments}
            xToPx={xToPx}
            y={thetaY}
            height={DIAGRAM_HEIGHT}
            color={COLORS.theta}
            chartWidth={chartWidth}
            boundaries={boundaries}
          />
        )}

        {/* Панель: y(x) — прогиб вниз (отрицательный, но физичный) */}
        {hasDeflection && (
          <DiagramPanel
            title="y(x)"
            unit="мм"
            segments={wSegments}
            xToPx={xToPx}
            y={wY}
            height={DIAGRAM_HEIGHT}
            color={COLORS.w}
            chartWidth={chartWidth}
            scale={1000}
            boundaries={boundaries}
          />
        )}

        {/* Ось X внизу */}
        <g transform={`translate(0, ${totalHeight - 35})`}>
          <line
            x1={PADDING.left}
            y1={0}
            x2={PADDING.left + chartWidth}
            y2={0}
            stroke={COLORS.textMuted}
            strokeWidth={1.5}
          />
          <text x={PADDING.left} y={22} fill={COLORS.text} fontSize={15} fontWeight="500">
            0
          </text>
          <text
            x={PADDING.left + chartWidth}
            y={22}
            textAnchor="end"
            fill={COLORS.text}
            fontSize={15}
            fontWeight="500"
          >
            {L} м
          </text>
          <text
            x={PADDING.left + chartWidth / 2}
            y={22}
            textAnchor="middle"
            fill={COLORS.textMuted}
            fontSize={15}
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
  const { L, loads, beamType } = input;
  const { reactions } = result;

  const beamY = y + height / 2;
  const beamThickness = 14;

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

      {/* Нагрузки - распределённые (результирующие по сегментам) */}
      {(() => {
        const distributedLoads = loads.filter(l => l.type === "distributed") as Array<{ type: "distributed"; q: number; a: number; b: number }>;
        if (distributedLoads.length === 0) return null;

        // Собираем все граничные точки (ограничиваем длиной балки)
        const points = new Set<number>();
        points.add(0);
        points.add(L);
        for (const load of distributedLoads) {
          if (load.a >= 0 && load.a <= L) points.add(load.a);
          if (load.b >= 0 && load.b <= L) points.add(load.b);
        }
        const sortedPoints = Array.from(points).sort((a, b) => a - b);

        // Для каждого сегмента считаем суммарную нагрузку
        const segments: Array<{ a: number; b: number; q: number }> = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
          const a = sortedPoints[i];
          const b = sortedPoints[i + 1];
          // Суммируем q от всех нагрузок, покрывающих этот сегмент
          let totalQ = 0;
          for (const load of distributedLoads) {
            // Нагрузка покрывает сегмент, если её диапазон включает [a, b]
            const clampedA = Math.max(0, Math.min(L, load.a));
            const clampedB = Math.max(0, Math.min(L, load.b));
            if (clampedA <= a && clampedB >= b) {
              totalQ += load.q;
            }
          }
          if (Math.abs(totalQ) > 0.001) {
            segments.push({ a, b, q: totalQ });
          }
        }

        // Объединяем соседние сегменты с одинаковым q
        const mergedSegments: typeof segments = [];
        for (const seg of segments) {
          const last = mergedSegments[mergedSegments.length - 1];
          if (last && Math.abs(last.q - seg.q) < 0.001 && Math.abs(last.b - seg.a) < 0.001) {
            last.b = seg.b;
          } else {
            mergedSegments.push({ ...seg });
          }
        }

        // Добавляем зазоры между сегментами (3px с каждой стороны)
        const gap = 3;
        return mergedSegments.map((seg, i) => {
          const isFirst = i === 0;
          const isLast = i === mergedSegments.length - 1;
          const x1 = xToPx(seg.a) + (isFirst ? 0 : gap);
          const x2 = xToPx(seg.b) - (isLast ? 0 : gap);
          return (
            <DistributedLoadArrows
              key={`dist-${i}`}
              x1={x1}
              x2={x2}
              beamTopY={beamY - beamThickness / 2}
              beamBottomY={beamY + beamThickness / 2}
              q={seg.q}
              label={`q = ${Math.abs(seg.q)} кН/м`}
            />
          );
        });
      })()}
      {/* Сосредоточенные силы и моменты */}
      {loads.map((load, i) => {
        if (load.type === "force") {
          return (
            <ForceArrow
              key={`force-${i}`}
              x={xToPx(load.x)}
              y={beamY - beamThickness / 2}
              F={load.F}
              label={`F = ${Math.abs(load.F)} кН`}
            />
          );
        } else if (load.type === "moment") {
          return (
            <MomentArrow
              key={`moment-${i}`}
              x={xToPx(load.x)}
              y={beamY}
              M={load.M}
              label={`M = ${Math.abs(load.M)} кН·м`}
            />
          );
        }
        return null; // distributed уже обработаны выше
      })}

      {/* Реакции - ЗЕЛЁНЫЕ стрелки (вверх = положительная, вниз = отрицательная) */}
      {reactions.RA !== undefined && reactions.RA !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xA ?? 0)}
          baseY={beamY - beamThickness / 2}
          value={reactions.RA}
          label={`R_A = ${formatNum(Math.abs(reactions.RA))} кН`}
          labelSide="left"
        />
      )}
      {reactions.RB !== undefined && reactions.RB !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xB ?? L)}
          baseY={beamY - beamThickness / 2}
          value={reactions.RB}
          label={`R_B = ${formatNum(Math.abs(reactions.RB))} кН`}
          labelSide="left"
          labelYOffset={reactions.RB >= 0 ? 50 : 35}
          labelXOffset={-30}
        />
      )}
      {reactions.Rf !== undefined && reactions.Rf !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xf ?? 0)}
          baseY={beamY - beamThickness / 2}
          value={reactions.Rf}
          label={`R = ${formatNum(Math.abs(reactions.Rf))} кН`}
          labelSide="left"
          labelYOffset={35}
        />
      )}

      {/* Подписи A и B - сдвинуты от пунктиров */}
      {beamType === "simply-supported" && (
        <>
          <text
            x={xToPx(0) - 25}
            y={beamY + 75}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={18}
            fontWeight="bold"
          >
            A
          </text>
          <text
            x={xToPx(L) + 25}
            y={beamY + 75}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={18}
            fontWeight="bold"
          >
            B
          </text>
        </>
      )}
    </g>
  );
}

// Шарнирная опора с заделкой (штриховкой)
function PinSupport({ x, y }: { x: number; y: number }) {
  const size = 24;
  const baseY = y + size; // низ треугольника
  const lineHalfWidth = size / 2 + 8;
  const lineWidth = lineHalfWidth * 2;
  const hatchSpacing = 7;
  const numHatches = Math.floor(lineWidth / hatchSpacing);
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - size / 2},${baseY} ${x + size / 2},${baseY}`}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={3}
      />
      {/* Горизонтальная линия через основание треугольника */}
      <line
        x1={x - lineHalfWidth}
        y1={baseY}
        x2={x + lineHalfWidth}
        y2={baseY}
        stroke={COLORS.support}
        strokeWidth={3}
      />
      {/* Штриховка под линией (заделка) - в пределах линии */}
      {Array.from({ length: numHatches }).map((_, i) => {
        const hx = x - lineHalfWidth + 8 + i * hatchSpacing;
        return (
          <line
            key={i}
            x1={hx}
            y1={baseY}
            x2={hx - 8}
            y2={baseY + 10}
            stroke={COLORS.support}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}

// Каток с штриховкой
function RollerSupport({ x, y }: { x: number; y: number }) {
  const size = 24;
  const baseY = y + size + 15; // линия под колёсами
  const lineHalfWidth = size / 2 + 8;
  const lineWidth = lineHalfWidth * 2;
  const hatchSpacing = 7;
  const numHatches = Math.floor(lineWidth / hatchSpacing);
  return (
    <g>
      <polygon
        points={`${x},${y} ${x - size / 2},${y + size} ${x + size / 2},${y + size}`}
        fill="none"
        stroke={COLORS.support}
        strokeWidth={3}
      />
      {/* Колёса разведены к углам треугольника */}
      <circle cx={x - size / 2.5} cy={y + size + 7} r={5} fill="none" stroke={COLORS.support} strokeWidth={2.5} />
      <circle cx={x + size / 2.5} cy={y + size + 7} r={5} fill="none" stroke={COLORS.support} strokeWidth={2.5} />
      {/* Горизонтальная линия под колёсами */}
      <line
        x1={x - lineHalfWidth}
        y1={baseY}
        x2={x + lineHalfWidth}
        y2={baseY}
        stroke={COLORS.support}
        strokeWidth={3}
      />
      {/* Штриховка под линией (заделка) - в пределах линии */}
      {Array.from({ length: numHatches }).map((_, i) => {
        const hx = x - lineHalfWidth + 8 + i * hatchSpacing;
        return (
          <line
            key={i}
            x1={hx}
            y1={baseY}
            x2={hx - 8}
            y2={baseY + 10}
            stroke={COLORS.support}
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
}

// Заделка
function FixedSupport({ x, y, side }: { x: number; y: number; side: "left" | "right" }) {
  const h = 50;
  const dir = side === "left" ? -1 : 1;
  return (
    <g>
      <line x1={x} y1={y - h / 2} x2={x} y2={y + h / 2} stroke={COLORS.support} strokeWidth={5} />
      {[-20, -10, 0, 10, 20].map((dy, i) => (
        <line
          key={i}
          x1={x}
          y1={y + dy}
          x2={x + dir * 14}
          y2={y + dy - 10}
          stroke={COLORS.support}
          strokeWidth={2.5}
        />
      ))}
    </g>
  );
}

// Стрелка реакции - направление зависит от знака
// value >= 0: вверх, value < 0: вниз
// labelSide: "left" или "right" для позиционирования подписи
// labelYOffset: дополнительное смещение подписи вверх (для избежания пересечений)
function ReactionArrow({ x, baseY, value, label, labelSide = "right", labelYOffset = 0, labelXOffset = 0 }: {
  x: number; baseY: number; value: number; label: string; labelSide?: "left" | "right"; labelYOffset?: number; labelXOffset?: number
}) {
  const arrowLen = 40;
  const pointsUp = value >= 0;

  // Если положительная - стрелка вверх, если отрицательная - вниз
  const startY = pointsUp ? baseY : baseY;
  const endY = pointsUp ? baseY - arrowLen : baseY + arrowLen;

  const baseXOffset = labelSide === "left" ? -8 : 8;
  const textX = x + baseXOffset + labelXOffset;
  const textAnchor = labelSide === "left" ? "end" : "start";
  const textY = pointsUp
    ? baseY - arrowLen / 2 - labelYOffset
    : baseY + arrowLen / 2 + labelYOffset;

  return (
    <g>
      <line x1={x} y1={startY} x2={x} y2={endY} stroke={COLORS.reaction} strokeWidth={2} markerEnd="url(#arrowGreen)" />
      <text x={textX} y={textY} fill={COLORS.reaction} fontSize={11} fontWeight="500" dominantBaseline="middle" textAnchor={textAnchor}>
        {label}
      </text>
    </g>
  );
}

// Распределённая нагрузка (СИНЯЯ)
// q > 0: сверху балки, стрелки вниз
// q < 0: снизу балки, стрелки вверх
function DistributedLoadArrows({
  x1, x2, beamTopY, beamBottomY, q, label
}: {
  x1: number; x2: number; beamTopY: number; beamBottomY: number; q: number; label: string
}) {
  const arrowLen = 28;
  const numArrows = Math.max(4, Math.floor((x2 - x1) / 35));

  if (q >= 0) {
    // Положительная q: сверху балки, стрелки вниз
    const baseY = beamTopY;
    return (
      <g>
        <line x1={x1} y1={baseY - arrowLen} x2={x2} y2={baseY - arrowLen} stroke={COLORS.distributedLoad} strokeWidth={2} />
        {Array.from({ length: numArrows }).map((_, i) => {
          const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
          return (
            <line
              key={i}
              x1={px}
              y1={baseY - arrowLen}
              x2={px}
              y2={baseY - 8}
              stroke={COLORS.distributedLoad}
              strokeWidth={2}
              markerEnd="url(#arrowBlue)"
            />
          );
        })}
        <text x={(x1 + x2) / 2} y={baseY - arrowLen - 8} textAnchor="middle" fill={COLORS.distributedLoad} fontSize={12} fontWeight="600">
          {label}
        </text>
      </g>
    );
  } else {
    // Отрицательная q: снизу балки, стрелки вверх (наконечник у балки)
    const baseY = beamBottomY;
    return (
      <g>
        <line x1={x1} y1={baseY + arrowLen} x2={x2} y2={baseY + arrowLen} stroke={COLORS.distributedLoad} strokeWidth={2} />
        {Array.from({ length: numArrows }).map((_, i) => {
          const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
          return (
            <line
              key={i}
              x1={px}
              y1={baseY + arrowLen}
              x2={px}
              y2={baseY + 8}
              stroke={COLORS.distributedLoad}
              strokeWidth={2}
              markerEnd="url(#arrowBlueUp)"
            />
          );
        })}
        <text x={(x1 + x2) / 2} y={baseY + arrowLen + 18} textAnchor="middle" fill={COLORS.distributedLoad} fontSize={12} fontWeight="600">
          {label}
        </text>
      </g>
    );
  }
}

// Сосредоточенная сила (КРАСНАЯ)
// F > 0: вниз, F < 0: вверх
function ForceArrow({ x, y, F, label }: { x: number; y: number; F: number; label: string }) {
  const arrowLen = 60;
  const pointsDown = F >= 0;

  if (pointsDown) {
    // Сила вниз: стрелка сверху к балке
    return (
      <g>
        <line x1={x} y1={y - arrowLen} x2={x} y2={y - 8} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#arrowRed)" />
        <text x={x + 10} y={y - arrowLen - 5} fill={COLORS.pointForce} fontSize={13} fontWeight="600">
          {label}
        </text>
      </g>
    );
  } else {
    // Сила вверх: стрелка снизу к балке (y - верх балки, +14 = низ балки, +8 = зазор для наконечника)
    return (
      <g>
        <line x1={x} y1={y + arrowLen} x2={x} y2={y + 22} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#arrowRed)" />
        <text x={x + 10} y={y + arrowLen + 15} fill={COLORS.pointForce} fontSize={13} fontWeight="600">
          {label}
        </text>
      </g>
    );
  }
}

// Момент (ножка + дуга со стрелкой, ФИОЛЕТОВАЯ)
// M > 0: против часовой (↺), стрелка слева
// M < 0: по часовой (↻), стрелка справа
function MomentArrow({ x, y, M, label }: { x: number; y: number; M: number; label: string }) {
  // Параметры геометрии
  const H = 35;      // высота центра дуги над балкой
  const R = 20;      // радиус дуги
  const gap = 6;     // зазор от балки

  // Центр дуги
  const Cx = x;
  const Cy = y - gap - H;

  // Углы дуги (в экранных координатах: +y вниз)
  // 240° = слева-снизу от центра, 330° = справа-снизу
  const aLeft = (240 * Math.PI) / 180;
  const aRight = (330 * Math.PI) / 180;

  // Точки дуги
  const pLeft = { x: Cx + R * Math.cos(aLeft), y: Cy + R * Math.sin(aLeft) };
  const pRight = { x: Cx + R * Math.cos(aRight), y: Cy + R * Math.sin(aRight) };

  // Начало ножки на балке
  const legStart = { x: x, y: y - gap };

  const isCW = M < 0; // по часовой

  // Для CW: ножка к левой точке, дуга слева направо, стрелка справа
  // Для CCW: ножка к правой точке, дуга справа налево, стрелка слева
  const legEnd = isCW ? pLeft : pRight;
  const arcStart = isCW ? pLeft : pRight;
  const arcEnd = isCW ? pRight : pLeft;
  const sweepFlag = isCW ? 1 : 0;

  // Подпись рядом со стрелкой
  const labelPos = isCW
    ? { x: pRight.x + 8, y: pRight.y - 4 }
    : { x: pLeft.x - 8, y: pLeft.y - 4 };
  const labelAnchor = isCW ? "start" : "end";

  return (
    <g>
      {/* Ножка от балки к дуге */}
      <line
        x1={legStart.x}
        y1={legStart.y}
        x2={legEnd.x}
        y2={legEnd.y}
        stroke={COLORS.moment}
        strokeWidth={2}
      />
      {/* Дуга со стрелкой */}
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke={COLORS.moment}
        strokeWidth={2}
        markerEnd="url(#arrowPurple)"
      />
      {/* Подпись */}
      <text
        x={labelPos.x}
        y={labelPos.y}
        textAnchor={labelAnchor}
        fill={COLORS.moment}
        fontSize={12}
        fontWeight="600"
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
  segments: { x: number; value: number; isDiscontinuity?: boolean }[][];
  xToPx: (x: number) => number;
  y: number;
  height: number;
  color: string;
  chartWidth: number;
  scale?: number;
  boundaries?: number[];
}

function DiagramPanel({ title, unit, segments, xToPx, y, height, color, chartWidth, scale = 1, boundaries = [] }: DiagramPanelProps) {
  const scaledSegments = segments.map((seg) =>
    seg.map((p) => ({ ...p, value: p.value * scale }))
  );

  const allValues = scaledSegments.flat().map((p) => p.value);
  let minVal = Math.min(0, ...allValues);
  let maxVal = Math.max(0, ...allValues);
  const range = maxVal - minVal || 1;
  minVal -= range * 0.12;
  maxVal += range * 0.12;

  const chartHeight = height - 30;
  const chartY = y + 15;

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
      <rect x={PADDING.left} y={chartY} width={chartWidth} height={chartHeight} fill="rgba(0,0,0,0.25)" rx={4} />

      {/* Нулевая линия */}
      <line x1={PADDING.left} y1={zeroY} x2={PADDING.left + chartWidth} y2={zeroY} stroke={COLORS.grid} strokeWidth={1.5} />

      {/* Заголовок слева */}
      <text x={PADDING.left - 15} y={chartY + chartHeight / 2} textAnchor="end" dominantBaseline="middle" fill={color} fontSize={16} fontWeight="bold">
        {title}
      </text>

      {/* Единицы справа */}
      <text x={PADDING.left + chartWidth + 10} y={chartY + chartHeight / 2} dominantBaseline="middle" fill={COLORS.textMuted} fontSize={12}>
        {unit}
      </text>

      {/* Сегменты графика - БЕЗ вертикальных линий на границах */}
      {scaledSegments.map((segment, segIdx) => {
        if (segment.length < 2) return null;

        const first = segment[0];
        const last = segment[segment.length - 1];

        // Линия графика - только кривая, без вертикальных участков
        let lineD = `M ${xToPx(first.x)} ${scaleY(first.value)}`;
        for (const p of segment.slice(1)) {
          lineD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }

        // Заливка: не рисуем вертикальные края - только горизонтальные штриховки
        // Рисуем тонкие горизонтальные линии от нуля до значения
        const fillLines: React.ReactNode[] = [];
        const step = Math.max(1, Math.floor(segment.length / 40));
        for (let i = 0; i < segment.length; i += step) {
          const p = segment[i];
          const px = xToPx(p.x);
          const py = scaleY(p.value);
          if (Math.abs(py - zeroY) > 1) {
            fillLines.push(
              <line
                key={i}
                x1={px}
                y1={zeroY}
                x2={px}
                y2={py}
                stroke={color}
                strokeOpacity={0.15}
                strokeWidth={2}
              />
            );
          }
        }

        return (
          <g key={segIdx}>
            {/* Штриховка вместо сплошной заливки */}
            {fillLines}
            {/* Линия только по кривой */}
            <path d={lineD} stroke={color} strokeWidth={2.5} fill="none" />
          </g>
        );
      })}

      {/* Подписи значений на всех границах участков */}
      {(() => {
        const labels: React.ReactNode[] = [];

        // Проверяем, не слишком ли близко к экстремумам (увеличил порог с 0.2 до 1.0)
        const isNearExtreme = (x: number, val: number) => {
          const nearMax = Math.abs(x - extremes.maxP.x) < 1.0 && Math.abs(val - extremes.maxP.value) < Math.abs(extremes.maxP.value) * 0.2;
          const nearMin = Math.abs(x - extremes.minP.x) < 1.0 && Math.abs(val - extremes.minP.value) < Math.abs(extremes.minP.value) * 0.2;
          return nearMax || nearMin;
        };

        // Функция для поиска значения в точке
        // fromLeft=true: ищем предел слева (конец сегмента, который ЗАКАНЧИВАЕТСЯ в x)
        // fromLeft=false: ищем предел справа (начало сегмента, который НАЧИНАЕТСЯ в x)
        const findValueAt = (x: number, fromLeft: boolean): number | null => {
          for (const seg of scaledSegments) {
            if (seg.length < 2) continue;

            const first = seg[0];
            const last = seg[seg.length - 1];

            if (fromLeft) {
              // Предел слева → сегмент должен ЗАКАНЧИВАТЬСЯ в x
              if (Math.abs(last.x - x) < 0.01) {
                return last.value;
              }
            } else {
              // Предел справа → сегмент должен НАЧИНАТЬСЯ в x
              if (Math.abs(first.x - x) < 0.01) {
                return first.value;
              }
            }

            // Интерполяция только для точек СТРОГО ВНУТРИ сегмента (не на границах)
            if (first.x < x - 0.01 && last.x > x + 0.01) {
              for (let i = 0; i < seg.length - 1; i++) {
                if (seg[i].x <= x && seg[i + 1].x >= x) {
                  const t = (x - seg[i].x) / (seg[i + 1].x - seg[i].x);
                  return seg[i].value + t * (seg[i + 1].value - seg[i].value);
                }
              }
            }
          }
          return null;
        };

        // Система collision detection для подписей
        interface LabelInfo {
          x: number;
          y: number;
          text: string;
          anchor: "start" | "middle" | "end";
          priority: number; // 0 = экстремум, 1 = endpoint, 2 = внутренняя граница
          key: string;
        }
        const labelInfos: LabelInfo[] = [];

        // Оценка ширины текста (примерно 7px на символ для fontSize=12)
        const estimateTextWidth = (text: string) => text.length * 7;

        // Получить bounding box подписи
        const getLabelBounds = (label: LabelInfo) => {
          const w = estimateTextWidth(label.text);
          const h = 14; // высота текста
          let left: number;
          if (label.anchor === "start") left = label.x;
          else if (label.anchor === "end") left = label.x - w;
          else left = label.x - w / 2;
          return { left, right: left + w, top: label.y - h, bottom: label.y };
        };

        // Проверка пересечения двух прямоугольников
        const rectsOverlap = (a: ReturnType<typeof getLabelBounds>, b: ReturnType<typeof getLabelBounds>) => {
          return !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
        };

        // Проверка что подпись в пределах графика
        const isInBounds = (bounds: ReturnType<typeof getLabelBounds>) => {
          return bounds.left >= PADDING.left - 5 &&
                 bounds.right <= PADDING.left + chartWidth + 5 &&
                 bounds.top >= chartY &&
                 bounds.bottom <= chartY + chartHeight;
        };

        // Попытка разместить подпись, возвращает true если удалось
        const tryPlaceLabel = (label: LabelInfo, placedLabels: LabelInfo[]): boolean => {
          const bounds = getLabelBounds(label);

          // Проверяем границы
          if (!isInBounds(bounds)) return false;

          // Проверяем пересечения с уже размещёнными
          for (const placed of placedLabels) {
            if (rectsOverlap(bounds, getLabelBounds(placed))) {
              return false;
            }
          }
          return true;
        };

        // Добавление подписи в очередь
        const queueLabel = (bx: number, value: number, placeRight: boolean, key: string, priority: number, skipNearExtreme = true) => {
          if (Math.abs(value) < 1e-9) return;
          if (skipNearExtreme && isNearExtreme(bx, value)) return;

          const xOffset = placeRight ? 12 : -12;
          const anchor = placeRight ? "start" : "end";
          const curveY = scaleY(value);
          const textY = value >= 0 ? curveY - 20 : curveY + 24;

          labelInfos.push({
            x: xToPx(bx) + xOffset,
            y: textY,
            text: formatNum(value, 1),
            anchor: anchor as "start" | "end",
            priority,
            key
          });
        };

        // Для каждой границы находим значения
        for (let bIdx = 0; bIdx < boundaries.length; bIdx++) {
          const bx = boundaries[bIdx];
          const isFirst = bIdx === 0;
          const isLast = bIdx === boundaries.length - 1;

          const leftValue = findValueAt(bx, true);
          const rightValue = findValueAt(bx, false);

          // Проверяем, есть ли разрыв (скачок)
          const hasDiscontinuity = leftValue !== null && rightValue !== null &&
            Math.abs(leftValue - rightValue) > 0.5;

          // На крайних границах (0 и L) показываем подпись даже если рядом экстремум
          const isEndpoint = isFirst || isLast;

          if (hasDiscontinuity) {
            // При скачке показываем ОБА значения, но только если они отличаются после форматирования
            const leftStr = formatNum(leftValue!, 1);
            const rightStr = formatNum(rightValue!, 1);
            if (leftStr === rightStr) {
              // Одинаковые после округления - показываем только левое
              queueLabel(bx, leftValue!, false, `boundary-${bIdx}-left`, isEndpoint ? 1 : 2, false);
            } else {
              // Разные значения - показываем оба
              queueLabel(bx, leftValue!, false, `boundary-${bIdx}-left`, isEndpoint ? 1 : 2, false);
              queueLabel(bx, rightValue!, true, `boundary-${bIdx}-right`, isEndpoint ? 1 : 2, false);
            }
          } else {
            // Непрерывная функция - одна подпись
            const value = rightValue ?? leftValue;
            if (value === null) continue;

            let placeRight: boolean;
            if (isFirst) {
              placeRight = true;  // На левой границе - справа от пунктира
            } else if (isLast) {
              placeRight = false; // На правой границе - слева от пунктира
            } else {
              // Внутренние границы - всегда слева, чтобы не накладываться на экстремумы справа
              placeRight = false;
            }

            queueLabel(bx, value, placeRight, `boundary-${bIdx}`, isEndpoint ? 1 : 2, !isEndpoint);
          }
        }

        // Сортируем по приоритету (0 = экстремум, 1 = endpoint, 2 = внутренние)
        labelInfos.sort((a, b) => a.priority - b.priority);

        // Размещаем подписи с учётом коллизий
        const placedLabels: LabelInfo[] = [];
        for (const label of labelInfos) {
          // Пробуем разместить в исходной позиции
          if (tryPlaceLabel(label, placedLabels)) {
            placedLabels.push(label);
            continue;
          }

          // Пробуем сдвинуть вверх или вниз
          for (const dy of [15, -15, 30, -30]) {
            const shifted = { ...label, y: label.y + dy };
            if (tryPlaceLabel(shifted, placedLabels)) {
              placedLabels.push(shifted);
              break;
            }
          }
          // Если не удалось - пропускаем подпись
        }

        return (
          <g>
            {placedLabels.map(label => (
              <text
                key={label.key}
                x={label.x}
                y={label.y}
                textAnchor={label.anchor}
                fill={color}
                fontSize={12}
                fontWeight="500"
              >
                {label.text}
              </text>
            ))}
          </g>
        );
      })()}

      {/* Маркеры экстремумов - на границах с разрывом показываем только кружок, иначе с текстом */}
      {Math.abs(extremes.maxP.value) > 1e-9 && (() => {
        // Пропускаем полностью если экстремум на крайней границе (x=0 или x=L)
        const isEndpoint = Math.abs(extremes.maxP.x - boundaries[0]) < 0.05 ||
                          Math.abs(extremes.maxP.x - boundaries[boundaries.length - 1]) < 0.05;
        if (isEndpoint) return null;

        const onBoundary = boundaries.some(b => Math.abs(b - extremes.maxP.x) < 0.05);
        const curveY = scaleY(extremes.maxP.value);

        // Проверяем, есть ли разрыв на этой границе (разные значения слева и справа)
        let hasDiscontinuityAtBoundary = false;
        if (onBoundary) {
          for (let i = 0; i < scaledSegments.length - 1; i++) {
            const seg1 = scaledSegments[i];
            const seg2 = scaledSegments[i + 1];
            if (seg1.length > 0 && seg2.length > 0) {
              const endVal = seg1[seg1.length - 1];
              const startVal = seg2[0];
              if (Math.abs(endVal.x - extremes.maxP.x) < 0.05 && Math.abs(startVal.x - extremes.maxP.x) < 0.05) {
                if (Math.abs(endVal.value - startVal.value) > 0.5) {
                  hasDiscontinuityAtBoundary = true;
                  break;
                }
              }
            }
          }
        }

        // На границе с разрывом показываем только кружок (текст уже есть от подписи границы)
        // На границе без разрыва показываем и кружок и текст (со смещением от пунктира)
        const textY = extremes.maxP.value >= 0 ? curveY - 20 : curveY + 24;
        if (onBoundary && hasDiscontinuityAtBoundary) {
          return <circle cx={xToPx(extremes.maxP.x)} cy={curveY} r={4} fill={color} />;
        }
        const offset = onBoundary ? 15 : 0;
        const textAnchor = onBoundary ? "start" : "middle";
        return (
          <g>
            <circle cx={xToPx(extremes.maxP.x)} cy={curveY} r={4} fill={color} />
            <text x={xToPx(extremes.maxP.x) + offset} y={textY} textAnchor={textAnchor} fill={color} fontSize={12} fontWeight="600">
              {formatNum(extremes.maxP.value)}
            </text>
          </g>
        );
      })()}
      {Math.abs(extremes.minP.value) > 1e-9 && Math.abs(extremes.minP.x - extremes.maxP.x) > 0.1 && (() => {
        // Пропускаем полностью если экстремум на крайней границе (x=0 или x=L)
        const isEndpoint = Math.abs(extremes.minP.x - boundaries[0]) < 0.05 ||
                          Math.abs(extremes.minP.x - boundaries[boundaries.length - 1]) < 0.05;
        if (isEndpoint) return null;

        const onBoundary = boundaries.some(b => Math.abs(b - extremes.minP.x) < 0.05);
        const curveY = scaleY(extremes.minP.value);

        // Проверяем, есть ли разрыв на этой границе
        let hasDiscontinuityAtBoundary = false;
        if (onBoundary) {
          for (let i = 0; i < scaledSegments.length - 1; i++) {
            const seg1 = scaledSegments[i];
            const seg2 = scaledSegments[i + 1];
            if (seg1.length > 0 && seg2.length > 0) {
              const endVal = seg1[seg1.length - 1];
              const startVal = seg2[0];
              if (Math.abs(endVal.x - extremes.minP.x) < 0.05 && Math.abs(startVal.x - extremes.minP.x) < 0.05) {
                if (Math.abs(endVal.value - startVal.value) > 0.5) {
                  hasDiscontinuityAtBoundary = true;
                  break;
                }
              }
            }
          }
        }

        const textY = extremes.minP.value >= 0 ? curveY - 20 : curveY + 24;
        if (onBoundary && hasDiscontinuityAtBoundary) {
          return <circle cx={xToPx(extremes.minP.x)} cy={curveY} r={4} fill={color} />;
        }
        const offset = onBoundary ? 15 : 0;
        const textAnchor = onBoundary ? "start" : "middle";
        return (
          <g>
            <circle cx={xToPx(extremes.minP.x)} cy={curveY} r={4} fill={color} />
            <text x={xToPx(extremes.minP.x) + offset} y={textY} textAnchor={textAnchor} fill={color} fontSize={12} fontWeight="600">
              {formatNum(extremes.minP.value)}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
