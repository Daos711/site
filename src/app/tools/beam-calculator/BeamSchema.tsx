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
      {(() => {
        const forceLoads = loads.filter(l => l.type === "force");
        const momentLoads = loads.filter(l => l.type === "moment");
        let forceIdx = 0;
        let momentIdx = 0;

        return loads.map((load, i) => {
          if (load.type === "force") {
            forceIdx++;
            const fLabel = forceLoads.length > 1 ? `F${forceIdx}` : "F";
            // Положительная сила вниз → верхняя поверхность, отрицательная вверх → нижняя
            const forceY = load.F >= 0 ? (beamY - beamThickness / 2) : (beamY + beamThickness / 2);
            return (
              <ForceArrow
                key={`force-${i}`}
                x={xToPx(load.x)}
                y={forceY}
                F={load.F}
                label={`${fLabel} = ${Math.abs(load.F)} кН`}
                maxX={xToPx(L) + PADDING.right - 10}
              />
            );
          } else if (load.type === "moment") {
            momentIdx++;
            const mLabel = momentLoads.length > 1 ? `M${momentIdx}` : "M";
            // Проверяем, есть ли внешняя сила в той же точке
            // (реакции не проверяем - они рисуются у символов опор)
            const hasForceAtSamePoint = loads.some(other =>
              other.type === "force" && Math.abs(other.x - load.x) < 0.01
            );
            return (
              <MomentArrow
                key={`moment-${i}`}
                x={xToPx(load.x)}
                y={beamY}
                M={load.M}
                label={`${mLabel} = ${Math.abs(load.M)} кН·м`}
                maxX={xToPx(L) + PADDING.right - 10}
                liftLabel={hasForceAtSamePoint}
              />
            );
          }
          return null;
        });
      })()}

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

        const beamTop = beamY - beamThickness / 2;
        const beamBottom = beamY + beamThickness / 2;

        if (reactions.RA !== undefined && reactions.RA !== 0) {
          const xA = reactions.xA ?? 0;
          const hasLoadAtA = hasLoadAt(xA);
          // Если опора A близко к левому краю — подпись справа, иначе слева
          const isNearLeftEdge = xA < L * 0.15;
          elements.push(
            <ReactionArrow
              key="RA"
              x={xToPx(xA)}
              baseY={beamTop}
              value={reactions.RA}
              name="R"
              subscript="A"
              valueText={`${formatNum(Math.abs(reactions.RA))} кН`}
              labelSide={isNearLeftEdge ? "right" : "left"}
              labelYOffset={hasLoadAtA ? 70 : 40}
            />
          );
        }

        if (reactions.RB !== undefined && reactions.RB !== 0) {
          const xB = reactions.xB ?? L;
          const hasLoadAtB = hasLoadAt(xB);
          // Подпись всегда слева от стрелки, чтобы не выходила за правый край диаграммы
          elements.push(
            <ReactionArrow
              key="RB"
              x={xToPx(xB)}
              baseY={beamTop}
              value={reactions.RB}
              name="R"
              subscript="B"
              valueText={`${formatNum(Math.abs(reactions.RB))} кН`}
              labelSide="left"
              labelYOffset={hasLoadAtB ? 70 : 50}
              labelXOffset={-30}
            />
          );
        }

        if (reactions.Rf !== undefined && reactions.Rf !== 0) {
          const xf = reactions.xf ?? 0;
          const hasLoadAtF = hasLoadAt(xf);
          // Если заделка близко к левому краю — подпись справа
          const isNearLeftEdge = xf < L * 0.15;
          elements.push(
            <ReactionArrow
              key="Rf"
              x={xToPx(xf)}
              baseY={beamTop}
              value={reactions.Rf}
              name="R"
              valueText={`${formatNum(Math.abs(reactions.Rf))} кН`}
              labelSide={isNearLeftEdge ? "right" : "left"}
              labelYOffset={hasLoadAtF ? 65 : 35}
            />
          );
        }

        // Реактивный момент Mf для консольных балок
        if (reactions.Mf !== undefined && Math.abs(reactions.Mf) > 1e-9) {
          const xf = reactions.xf ?? 0;
          const px = xToPx(xf);
          const H = 35;
          const R = 20;
          const gap = 6;
          const Cy = beamTop - gap - H;

          // Mf > 0 (против часовой) или Mf < 0 (по часовой)
          const isCW = reactions.Mf < 0;
          const aLeft = (240 * Math.PI) / 180;
          const aRight = (330 * Math.PI) / 180;
          const pLeft = { x: px + R * Math.cos(aLeft), y: Cy + R * Math.sin(aLeft) };
          const pRight = { x: px + R * Math.cos(aRight), y: Cy + R * Math.sin(aRight) };

          const legEnd = isCW ? pLeft : pRight;
          const arcStart = isCW ? pLeft : pRight;
          const arcEnd = isCW ? pRight : pLeft;
          const sweepFlag = isCW ? 1 : 0;

          // Подпись всегда справа и выше, чтобы не уходила за край
          const labelX = px + R + 8;
          const labelY = Cy - 20;

          elements.push(
            <g key="Mf">
              <line x1={px} y1={beamTop - gap} x2={legEnd.x} y2={legEnd.y} stroke={COLORS.reaction} strokeWidth={2} />
              <path
                d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`}
                fill="none"
                stroke={COLORS.reaction}
                strokeWidth={2}
                markerEnd="url(#arrowGreen)"
              />
              <text x={labelX} y={labelY} textAnchor="start" fill={COLORS.reaction} fontSize={13} fontWeight="600">
                Mf = {formatNum(Math.abs(reactions.Mf))} кН·м
              </text>
            </g>
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
