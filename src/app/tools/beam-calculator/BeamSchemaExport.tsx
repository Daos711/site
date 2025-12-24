"use client";

import React from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { COLORS } from "./constants";
import { PinSupport, RollerSupport, FixedSupport } from "./BeamSupports";
import { DistributedLoadArrows, ForceArrow, MomentArrow } from "./BeamLoads";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

/**
 * Отдельный SVG только со схемой балки для экспорта в отчёт.
 * Скрыт на странице, но сериализуется для вставки в HTML-отчёт.
 */
export function BeamSchemaExport({ input, result }: Props) {
  const { L, loads, beamType } = input;

  // Размеры SVG
  const width = 700;
  const height = 220;
  const padding = { left: 60, right: 60, top: 80, bottom: 60 };
  const beamY = padding.top + 30;
  const beamThickness = 14;

  const chartWidth = width - padding.left - padding.right;
  const xToPx = (x: number) => padding.left + (x / L) * chartWidth;

  return (
    <svg
      id="beam-schema-export"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: "700px",
        height: "220px",
        background: "#f8fafc",
      }}
    >
      {/* Маркеры для стрелок */}
      <defs>
        <marker id="exp-arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.distributedLoad} />
        </marker>
        <marker id="exp-arrowRed" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.pointForce} />
        </marker>
        <marker id="exp-arrowGreen" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.reaction} />
        </marker>
        <marker id="exp-arrowPurple" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.moment} />
        </marker>
      </defs>

      {/* Белый фон */}
      <rect x="0" y="0" width={width} height={height} fill="#f8fafc" />

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
      {input.supports.map((support, i) => {
        if (support.type === "pin") {
          return <PinSupport key={`support-${i}`} x={xToPx(support.x)} y={beamY + beamThickness / 2} />;
        } else if (support.type === "roller") {
          return <RollerSupport key={`support-${i}`} x={xToPx(support.x)} y={beamY + beamThickness / 2} />;
        } else if (support.type === "fixed") {
          const side = support.x < L / 2 ? "left" : "right";
          return <FixedSupport key={`support-${i}`} x={xToPx(support.x)} y={beamY} side={side} />;
        }
        return null;
      })}

      {/* Распределённые нагрузки */}
      {(() => {
        const distributedLoads = loads.filter(l => l.type === "distributed") as Array<{ type: "distributed"; q: number; a: number; b: number }>;
        if (distributedLoads.length === 0) return null;

        const points = new Set<number>();
        points.add(0);
        points.add(L);
        for (const load of distributedLoads) {
          if (load.a >= 0 && load.a <= L) points.add(load.a);
          if (load.b >= 0 && load.b <= L) points.add(load.b);
        }
        const sortedPoints = Array.from(points).sort((a, b) => a - b);

        const segments: Array<{ a: number; b: number; q: number }> = [];
        for (let i = 0; i < sortedPoints.length - 1; i++) {
          const a = sortedPoints[i];
          const b = sortedPoints[i + 1];
          let totalQ = 0;
          for (const load of distributedLoads) {
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

        const mergedSegments: typeof segments = [];
        for (const seg of segments) {
          const last = mergedSegments[mergedSegments.length - 1];
          if (last && Math.abs(last.q - seg.q) < 0.001 && Math.abs(last.b - seg.a) < 0.001) {
            last.b = seg.b;
          } else {
            mergedSegments.push({ ...seg });
          }
        }

        return mergedSegments.map((seg, i) => (
          <DistributedLoadArrows
            key={`dist-${i}`}
            x1={xToPx(seg.a)}
            x2={xToPx(seg.b)}
            beamTopY={beamY - beamThickness / 2}
            beamBottomY={beamY + beamThickness / 2}
            q={seg.q}
            label={`q = ${Math.abs(seg.q)} кН/м`}
            markerPrefix="exp-"
          />
        ));
      })()}

      {/* Сосредоточенные силы */}
      {loads.map((load, i) => {
        if (load.type === "force") {
          return (
            <ForceArrow
              key={`force-${i}`}
              x={xToPx(load.x)}
              y={beamY - beamThickness / 2}
              F={load.F}
              label={`F = ${Math.abs(load.F)} кН`}
              maxX={xToPx(L) + padding.right - 10}
              markerPrefix="exp-"
            />
          );
        }
        return null;
      })}

      {/* Моменты */}
      {loads.map((load, i) => {
        if (load.type === "moment") {
          return (
            <MomentArrow
              key={`moment-${i}`}
              x={xToPx(load.x)}
              y={beamY}
              M={load.M}
              label={`M = ${Math.abs(load.M)} кН·м`}
              markerPrefix="exp-"
            />
          );
        }
        return null;
      })}

      {/* Подписи опор A и B */}
      {(() => {
        const pinSupport = input.supports.find(s => s.type === "pin");
        const rollerSupport = input.supports.find(s => s.type === "roller");

        const isSimplySupported = beamType === "simply-supported" ||
          beamType === "simply-supported-overhang-left" ||
          beamType === "simply-supported-overhang-right" ||
          beamType === "simply-supported-overhang-both";

        if (!isSimplySupported) return null;

        const labels = [];
        const labelY = beamY + 70;

        if (pinSupport) {
          labels.push(
            <text
              key="label-A"
              x={xToPx(pinSupport.x)}
              y={labelY}
              textAnchor="middle"
              fill="#1f2937"
              fontSize={16}
              fontWeight="bold"
            >
              A
            </text>
          );
        }

        if (rollerSupport) {
          labels.push(
            <text
              key="label-B"
              x={xToPx(rollerSupport.x)}
              y={labelY}
              textAnchor="middle"
              fill="#1f2937"
              fontSize={16}
              fontWeight="bold"
            >
              B
            </text>
          );
        }

        return labels;
      })()}

      {/* Размерная линия */}
      <g>
        <line x1={xToPx(0)} y1={height - 25} x2={xToPx(L)} y2={height - 25} stroke="#374151" strokeWidth={1} />
        <line x1={xToPx(0)} y1={height - 30} x2={xToPx(0)} y2={height - 20} stroke="#374151" strokeWidth={1} />
        <line x1={xToPx(L)} y1={height - 30} x2={xToPx(L)} y2={height - 20} stroke="#374151" strokeWidth={1} />
        <text x={(xToPx(0) + xToPx(L)) / 2} y={height - 8} textAnchor="middle" fill="#374151" fontSize={14}>
          L = {L} м
        </text>
      </g>
    </svg>
  );
}
