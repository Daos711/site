"use client";

import React, { useMemo } from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { DiagramExport } from "./DiagramExport";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

/**
 * Скрытые SVG эпюр Q, M, y для экспорта в отчёт.
 * Каждая эпюра имеет свой id для сериализации.
 */
export function DiagramsExport({ input, result }: Props) {
  const { L, loads } = input;
  const { reactions, Q, M, y, events } = result;

  // Собираем все границы участков
  const boundaries = useMemo(() => {
    const points = new Set<number>([0, L]);
    for (const e of events) {
      points.add(e);
    }
    return Array.from(points).sort((a, b) => a - b);
  }, [events, L]);

  // Точки разрывов Q (сосредоточенные силы и опоры)
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

  // Генерация данных для графика
  const generateSegments = (
    fn: (x: number) => number,
    discontinuities: Set<number>,
    numPoints = 400
  ): { x: number; value: number }[][] => {
    const segments: { x: number; value: number }[][] = [];
    const allPoints = Array.from(new Set([0, ...discontinuities, L])).sort((a, b) => a - b);

    for (let i = 0; i < allPoints.length - 1; i++) {
      const start = allPoints[i];
      const end = allPoints[i + 1];
      const segment: { x: number; value: number }[] = [];

      const segmentPoints = Math.max(30, Math.ceil((numPoints * (end - start)) / L));

      for (let j = 0; j <= segmentPoints; j++) {
        const t = j / segmentPoints;
        const x = start + t * (end - start);
        const eps = 1e-9;
        let evalX = x;
        if (j === 0) evalX = start + eps;
        if (j === segmentPoints) evalX = end - eps;

        const value = fn(evalX);
        segment.push({ x, value });
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
  const ySegments = useMemo(
    () => (y ? generateSegments(y, new Set()) : []),
    [y]
  );

  const hasDeflection = !!y;

  // Границы для Q — все события + точки разрывов
  const qBoundaries = useMemo(() => {
    const points = new Set(boundaries);
    for (const x of qDiscontinuities) {
      points.add(x);
    }
    return Array.from(points).sort((a, b) => a - b);
  }, [boundaries, qDiscontinuities]);

  // Границы для M — все события + точки моментов
  const mBoundaries = useMemo(() => {
    const points = new Set(boundaries);
    for (const x of mDiscontinuities) {
      points.add(x);
    }
    return Array.from(points).sort((a, b) => a - b);
  }, [boundaries, mDiscontinuities]);

  return (
    <>
      {/* Эпюра Q */}
      <DiagramExport
        id="diagram-q-export"
        title="Q(x)"
        unit="кН"
        segments={qSegments}
        L={L}
        color="Q"
        boundaries={qBoundaries}
      />

      {/* Эпюра M */}
      <DiagramExport
        id="diagram-m-export"
        title="M(x)"
        unit="кН·м"
        segments={mSegments}
        L={L}
        color="M"
        boundaries={mBoundaries}
      />

      {/* Эпюра y (прогиб) */}
      {hasDeflection && (
        <DiagramExport
          id="diagram-y-export"
          title="y(x)"
          unit="мм"
          segments={ySegments}
          L={L}
          color="y"
          scale={1000}
          boundaries={boundaries}
        />
      )}
    </>
  );
}
