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
const BEAM_HEIGHT = 180;
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
function formatNum(val: number, decimals = 2): string {
  const fixed = val.toFixed(decimals);
  // Убираем trailing zeros после точки
  return fixed.replace(/\.?0+$/, "");
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

      {/* Нагрузки - распределённые с учётом слоёв */}
      {(() => {
        // Группируем распределённые нагрузки по знаку и считаем слои для наложения
        const distributedLoads = loads.filter(l => l.type === "distributed") as Array<{ type: "distributed"; q: number; a: number; b: number }>;
        const positiveLoads = distributedLoads.filter(l => l.q >= 0);
        const negativeLoads = distributedLoads.filter(l => l.q < 0);

        // Функция для определения слоя (сколько нагрузок перекрываются с текущей)
        const getLayer = (load: { a: number; b: number }, sameSideLods: typeof distributedLoads) => {
          let layer = 0;
          for (const other of sameSideLods) {
            if (other === load) break;
            // Проверяем перекрытие
            if (!(other.b <= load.a || other.a >= load.b)) {
              layer++;
            }
          }
          return layer;
        };

        return distributedLoads.map((load, i) => {
          const sameSideLoads = load.q >= 0 ? positiveLoads : negativeLoads;
          const layer = getLayer(load, sameSideLoads);
          return (
            <DistributedLoadArrows
              key={`dist-${i}`}
              x1={xToPx(load.a)}
              x2={xToPx(load.b)}
              beamTopY={beamY - beamThickness / 2}
              beamBottomY={beamY + beamThickness / 2}
              q={load.q}
              label={`q = ${Math.abs(load.q)} кН/м`}
              layer={layer}
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

      {/* Реакции - ЗЕЛЁНЫЕ стрелки ОТ балки ВВЕРХ */}
      {reactions.RA !== undefined && reactions.RA !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xA ?? 0)}
          baseY={beamY - beamThickness / 2}
          value={reactions.RA}
          label={`R_A = ${formatNum(reactions.RA)} кН`}
          labelSide="left"
        />
      )}
      {reactions.RB !== undefined && reactions.RB !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xB ?? L)}
          baseY={beamY - beamThickness / 2}
          value={reactions.RB}
          label={`R_B = ${formatNum(reactions.RB)} кН`}
          labelSide="left"
          labelYOffset={25}
        />
      )}
      {reactions.Rf !== undefined && reactions.Rf !== 0 && (
        <ReactionArrow
          x={xToPx(reactions.xf ?? 0)}
          baseY={beamY - beamThickness / 2}
          value={reactions.Rf}
          label={`R = ${formatNum(reactions.Rf)} кН`}
          labelSide="left"
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
      <circle cx={x - size / 4} cy={y + size + 7} r={6} fill="none" stroke={COLORS.support} strokeWidth={2.5} />
      <circle cx={x + size / 4} cy={y + size + 7} r={6} fill="none" stroke={COLORS.support} strokeWidth={2.5} />
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
function ReactionArrow({ x, baseY, value, label, labelSide = "right", labelYOffset = 0 }: {
  x: number; baseY: number; value: number; label: string; labelSide?: "left" | "right"; labelYOffset?: number
}) {
  const arrowLen = 40;
  const pointsUp = value >= 0;

  // Если положительная - стрелка вверх, если отрицательная - вниз
  const startY = pointsUp ? baseY : baseY;
  const endY = pointsUp ? baseY - arrowLen : baseY + arrowLen;

  const textX = labelSide === "left" ? x - 8 : x + 8;
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
// layer: смещение для наложения нескольких q
function DistributedLoadArrows({
  x1, x2, beamTopY, beamBottomY, q, label, layer = 0
}: {
  x1: number; x2: number; beamTopY: number; beamBottomY: number; q: number; label: string; layer?: number
}) {
  const arrowLen = 30;
  const layerOffset = layer * 25; // Смещение между слоями
  const numArrows = Math.max(4, Math.floor((x2 - x1) / 35));

  if (q >= 0) {
    // Положительная q: сверху балки, стрелки вниз
    const baseY = beamTopY - layerOffset;
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
    const baseY = beamBottomY + layerOffset;
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
function ForceArrow({ x, y, F, label }: { x: number; y: number; F: number; label: string }) {
  const arrowLen = 50;
  return (
    <g>
      <line x1={x} y1={y - arrowLen} x2={x} y2={y - 8} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#arrowRed)" />
      <text x={x + 10} y={y - arrowLen + 10} fill={COLORS.pointForce} fontSize={13} fontWeight="600">
        {label}
      </text>
    </g>
  );
}

// Момент (дуговая стрелка, ФИОЛЕТОВАЯ)
function MomentArrow({ x, y, M, label }: { x: number; y: number; M: number; label: string }) {
  const r = 22;
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
        strokeWidth={3}
        markerEnd="url(#arrowPurple)"
      />
      <text x={x} y={y - r - 15} textAnchor="middle" fill={COLORS.moment} fontSize={14} fontWeight="600">
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

      {/* Подписи на границах участков — сдвинуты от пунктиров */}
      {scaledSegments.map((segment, segIdx) => {
        if (segment.length < 2) return null;
        const first = segment[0];
        const last = segment[segment.length - 1];
        const labels: React.ReactNode[] = [];

        // Проверяем, не слишком ли близко к экстремумам
        const isNearExtreme = (x: number, val: number) => {
          const nearMax = Math.abs(x - extremes.maxP.x) < 0.3 && Math.abs(val - extremes.maxP.value) < Math.abs(extremes.maxP.value) * 0.1;
          const nearMin = Math.abs(x - extremes.minP.x) < 0.3 && Math.abs(val - extremes.minP.value) < Math.abs(extremes.minP.value) * 0.1;
          return nearMax || nearMin;
        };

        // Подпись в начале сегмента (сдвиг вправо от пунктира)
        if (Math.abs(first.value) > 0.01 && !isNearExtreme(first.x, first.value)) {
          const textY = first.value >= 0 ? scaleY(first.value) - 8 : scaleY(first.value) + 14;
          labels.push(
            <text
              key={`start-${segIdx}`}
              x={xToPx(first.x) + 12}
              y={textY}
              textAnchor="start"
              fill={color}
              fontSize={12}
              fontWeight="500"
            >
              {formatNum(first.value, 1)}
            </text>
          );
        }

        // Подпись в конце сегмента (сдвиг влево от пунктира)
        // Показываем для всех сегментов, включая последний
        if (Math.abs(last.value) > 0.01 && !isNearExtreme(last.x, last.value)) {
          const textY = last.value >= 0 ? scaleY(last.value) - 8 : scaleY(last.value) + 14;
          labels.push(
            <text
              key={`end-${segIdx}`}
              x={xToPx(last.x) - 12}
              y={textY}
              textAnchor="end"
              fill={color}
              fontSize={12}
              fontWeight="500"
            >
              {formatNum(last.value, 1)}
            </text>
          );
        }

        return <g key={`labels-${segIdx}`}>{labels}</g>;
      })}

      {/* Маркеры экстремумов - сдвигаем подписи от границ */}
      {Math.abs(extremes.maxP.value) > 0.01 && (() => {
        // Проверяем, находится ли экстремум на границе
        const onBoundary = boundaries.some(b => Math.abs(b - extremes.maxP.x) < 0.05);
        const offset = onBoundary ? 15 : 0;
        const textAnchor = onBoundary ? "start" : "middle";
        return (
          <g>
            <circle cx={xToPx(extremes.maxP.x)} cy={scaleY(extremes.maxP.value)} r={4} fill={color} />
            <text x={xToPx(extremes.maxP.x) + offset} y={scaleY(extremes.maxP.value) - 10} textAnchor={textAnchor} fill={color} fontSize={12} fontWeight="600">
              {formatNum(extremes.maxP.value)}
            </text>
          </g>
        );
      })()}
      {Math.abs(extremes.minP.value) > 0.01 && Math.abs(extremes.minP.x - extremes.maxP.x) > 0.1 && (() => {
        // Проверяем, находится ли экстремум на границе
        const onBoundary = boundaries.some(b => Math.abs(b - extremes.minP.x) < 0.05);
        const offset = onBoundary ? 15 : 0;
        const textAnchor = onBoundary ? "start" : "middle";
        return (
          <g>
            <circle cx={xToPx(extremes.minP.x)} cy={scaleY(extremes.minP.value)} r={4} fill={color} />
            <text x={xToPx(extremes.minP.x) + offset} y={scaleY(extremes.minP.value) + 14} textAnchor={textAnchor} fill={color} fontSize={12} fontWeight="600">
              {formatNum(extremes.minP.value)}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
