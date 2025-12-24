"use client";

import React, { useMemo } from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { PADDING, BEAM_HEIGHT, DIAGRAM_HEIGHT, GAP, COLORS } from "./constants";
import { BeamSchema } from "./BeamSchema";
import { DiagramPanel } from "./DiagramPanel";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

export function UnifiedBeamView({ input, result }: Props) {
  const { L, loads } = input;
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
    const disc = new Set<number>([0, L]);
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
        {/* Определения маркеров-стрелок */}
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
          <clipPath id="diagramClip">
            <rect x={PADDING.left + 1} y={0} width={chartWidth - 2} height={totalHeight} />
          </clipPath>
        </defs>

        {/* Сквозные вертикальные пунктирные линии границ */}
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

        {/* Панель: θ(x) - автовыбор единиц */}
        {hasDeflection && (() => {
          const maxTheta = Math.max(...thetaSegments.flat().map(p => Math.abs(p.value)));
          const useMillirad = maxTheta < 0.1 && maxTheta > 0;
          const thetaScale = useMillirad ? 1000 : 1;
          const thetaUnit = useMillirad ? "мрад" : "рад";

          return (
            <DiagramPanel
              title="θ(x)"
              unit={thetaUnit}
              segments={thetaSegments}
              xToPx={xToPx}
              y={thetaY}
              height={DIAGRAM_HEIGHT}
              color={COLORS.theta}
              chartWidth={chartWidth}
              scale={thetaScale}
              boundaries={boundaries}
            />
          );
        })()}

        {/* Панель: y(x) — прогиб */}
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
