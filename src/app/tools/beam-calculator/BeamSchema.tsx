import React from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { PADDING, COLORS, formatNum } from "./constants";
import { PinSupport, RollerSupport, FixedSupport } from "./BeamSupports";
import { ReactionArrow, DistributedLoadArrows, ForceArrow, MomentArrow } from "./BeamLoads";

export interface BeamSchemaProps {
  input: BeamInput;
  result: BeamResult;
  xToPx: (x: number) => number;
  y: number;
  height: number;
}

export function BeamSchema({ input, result, xToPx, y, height }: BeamSchemaProps) {
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

      {/* Нагрузки - распределённые */}
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
              maxX={xToPx(L) + PADDING.right - 10}
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
        return null;
      })}

      {/* Реакции - ЗЕЛЁНЫЕ стрелки */}
      {(() => {
        const hasLoadAt = (x: number) => {
          return loads.some(load => {
            if (load.type === "force" || load.type === "moment") {
              return Math.abs(load.x - x) < 0.01;
            }
            return false;
          });
        };

        const elements = [];

        if (reactions.RA !== undefined && reactions.RA !== 0) {
          const xA = reactions.xA ?? 0;
          const hasLoadAtA = hasLoadAt(xA);
          elements.push(
            <ReactionArrow
              key="RA"
              x={xToPx(xA)}
              baseY={beamY - beamThickness / 2}
              value={reactions.RA}
              label={`R_A = ${formatNum(Math.abs(reactions.RA))} кН`}
              labelSide="left"
              labelYOffset={hasLoadAtA ? 70 : 40}
            />
          );
        }

        if (reactions.RB !== undefined && reactions.RB !== 0) {
          const xB = reactions.xB ?? L;
          const hasLoadAtB = hasLoadAt(xB);
          elements.push(
            <ReactionArrow
              key="RB"
              x={xToPx(xB)}
              baseY={beamY - beamThickness / 2}
              value={reactions.RB}
              label={`R_B = ${formatNum(Math.abs(reactions.RB))} кН`}
              labelSide="left"
              labelYOffset={hasLoadAtB ? 80 : (reactions.RB >= 0 ? 50 : 35)}
              labelXOffset={-30}
            />
          );
        }

        if (reactions.Rf !== undefined && reactions.Rf !== 0) {
          const xf = reactions.xf ?? 0;
          const hasLoadAtF = hasLoadAt(xf);
          elements.push(
            <ReactionArrow
              key="Rf"
              x={xToPx(xf)}
              baseY={beamY - beamThickness / 2}
              value={reactions.Rf}
              label={`R = ${formatNum(Math.abs(reactions.Rf))} кН`}
              labelSide="left"
              labelYOffset={hasLoadAtF ? 65 : 35}
            />
          );
        }

        return elements;
      })()}

      {/* Подписи A и B */}
      {(() => {
        const pinSupport = input.supports.find(s => s.type === "pin");
        const rollerSupport = input.supports.find(s => s.type === "roller");

        const isSimplySupported = beamType === "simply-supported" ||
          beamType === "simply-supported-overhang-left" ||
          beamType === "simply-supported-overhang-right" ||
          beamType === "simply-supported-overhang-both";

        if (!isSimplySupported) return null;

        const labels = [];
        // Единая высота для всех подписей опор (ниже катка с штриховкой)
        const labelY = beamY + 85;

        if (pinSupport) {
          const isAtRight = pinSupport.x > L - 0.1;
          // Всегда смещаем влево от пунктира, кроме правого края
          const offset = isAtRight ? 25 : -25;
          labels.push(
            <text
              key="label-A"
              x={xToPx(pinSupport.x) + offset}
              y={labelY}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize={18}
              fontWeight="bold"
            >
              A
            </text>
          );
        }

        if (rollerSupport) {
          const isAtLeft = rollerSupport.x < 0.1;
          // Всегда смещаем вправо от пунктира, кроме левого края
          const offset = isAtLeft ? -25 : 25;
          labels.push(
            <text
              key="label-B"
              x={xToPx(rollerSupport.x) + offset}
              y={labelY}
              textAnchor="middle"
              fill={COLORS.text}
              fontSize={18}
              fontWeight="bold"
            >
              B
            </text>
          );
        }

        return labels;
      })()}
    </g>
  );
}
