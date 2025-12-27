"use client";

import React from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { COLORS } from "./constants";
import { PinSupport, RollerSupport, FixedSupport } from "./BeamSupports";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

/**
 * Отдельный SVG только со схемой балки для экспорта в отчёт.
 * Размеры оптимизированы под A4 (680px ширина контента).
 * Использует собственные крупные шрифты для подписей.
 */
export function BeamSchemaExport({ input, result }: Props) {
  const { L, loads, beamType } = input;

  // Размеры SVG под A4 (180mm ≈ 680px)
  const width = 680;
  const height = 280;
  const padding = { left: 55, right: 55, top: 75, bottom: 65 };
  const beamY = padding.top + 40;
  const beamThickness = 16; // тоньше балка

  const chartWidth = width - padding.left - padding.right;
  const xToPx = (x: number) => padding.left + (x / L) * chartWidth;

  // Размеры шрифтов для экспорта (крупные)
  const fontSize = {
    label: 14,      // подписи нагрузок и реакций
    subscript: 10,  // индексы
    dimension: 14,  // размерные линии
    support: 16,    // буквы A, B
  };

  return (
    <svg
      id="beam-schema-export"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        width: `${width}px`,
        height: `${height}px`,
        background: "#ffffff",
      }}
    >
      {/* Маркеры для стрелок */}
      <defs>
        <marker id="exp-arrowBlue" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1.5,3 Z" fill={COLORS.distributedLoad} />
        </marker>
        <marker id="exp-arrowBlueUp" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse">
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
      <rect x="0" y="0" width={width} height={height} fill="#ffffff" />

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

      {/* Распределённые нагрузки — собственный рендеринг с крупными шрифтами */}
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
        const arrowLen = 22;
        const markerOffset = 6;
        const beamTopY = beamY - beamThickness / 2;
        const beamBottomY = beamY + beamThickness / 2;

        return mergedSegments.map((seg, i) => {
          const isFirst = i === 0;
          const isLast = i === mergedSegments.length - 1;
          const x1 = xToPx(seg.a) + (isFirst ? 0 : gap);
          const x2 = xToPx(seg.b) - (isLast ? 0 : gap);
          const numArrows = Math.max(3, Math.floor((x2 - x1) / 30));
          const subscript = mergedSegments.length > 1 ? String(i + 1) : "";
          const pointsDown = seg.q >= 0;

          if (pointsDown) {
            // Нагрузка вниз (q >= 0)
            return (
              <g key={`dist-${i}`}>
                <line x1={x1} y1={beamTopY - arrowLen} x2={x2} y2={beamTopY - arrowLen} stroke={COLORS.distributedLoad} strokeWidth={1.5} />
                {Array.from({ length: numArrows }).map((_, j) => {
                  const px = x1 + (j / (numArrows - 1)) * (x2 - x1);
                  return (
                    <line
                      key={j}
                      x1={px}
                      y1={beamTopY - arrowLen}
                      x2={px}
                      y2={beamTopY - markerOffset}
                      stroke={COLORS.distributedLoad}
                      strokeWidth={1.5}
                      markerEnd="url(#exp-arrowBlue)"
                    />
                  );
                })}
                <text x={(x1 + x2) / 2} y={beamTopY - arrowLen - 6} textAnchor="middle" fill={COLORS.distributedLoad} fontSize={fontSize.label} fontWeight="600">
                  q{subscript && <tspan dy="3" fontSize={fontSize.subscript}>{subscript}</tspan>}
                </text>
              </g>
            );
          } else {
            // Нагрузка вверх (q < 0)
            return (
              <g key={`dist-${i}`}>
                <line x1={x1} y1={beamBottomY + arrowLen} x2={x2} y2={beamBottomY + arrowLen} stroke={COLORS.distributedLoad} strokeWidth={1.5} />
                {Array.from({ length: numArrows }).map((_, j) => {
                  const px = x1 + (j / (numArrows - 1)) * (x2 - x1);
                  return (
                    <line
                      key={j}
                      x1={px}
                      y1={beamBottomY + arrowLen}
                      x2={px}
                      y2={beamBottomY + markerOffset}
                      stroke={COLORS.distributedLoad}
                      strokeWidth={1.5}
                      markerEnd="url(#exp-arrowBlue)"
                    />
                  );
                })}
                <text x={(x1 + x2) / 2} y={beamBottomY + arrowLen + 14} textAnchor="middle" fill={COLORS.distributedLoad} fontSize={fontSize.label} fontWeight="600">
                  q{subscript && <tspan dy="3" fontSize={fontSize.subscript}>{subscript}</tspan>}
                </text>
              </g>
            );
          }
        });
      })()}

      {/* Сосредоточенные силы — собственный рендеринг */}
      {(() => {
        const forceLoads = loads.filter(l => l.type === "force");
        const forceCount = forceLoads.length;
        let forceIdx = 0;

        return loads.map((load, i) => {
          if (load.type !== "force") return null;
          forceIdx++;
          const subscript = forceCount > 1 ? String(forceIdx) : "";
          const arrowLen = 40;
          const markerOffset = 6;
          const pointsDown = load.F >= 0;
          const y = pointsDown ? (beamY - beamThickness / 2) : (beamY + beamThickness / 2);
          const px = xToPx(load.x);

          // Определяем позицию подписи
          const nearEnd = load.x > L * 0.85;
          const labelX = nearEnd ? px - 8 : px + 8;
          const anchor = nearEnd ? "end" : "start";

          if (pointsDown) {
            return (
              <g key={`force-${i}`}>
                <line x1={px} y1={y - arrowLen} x2={px} y2={y - markerOffset} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#exp-arrowRed)" />
                <text x={labelX} y={y - arrowLen - 4} fill={COLORS.pointForce} fontSize={fontSize.label} fontWeight="600" textAnchor={anchor}>
                  F{subscript && <tspan dy="3" fontSize={fontSize.subscript}>{subscript}</tspan>}
                </text>
              </g>
            );
          } else {
            return (
              <g key={`force-${i}`}>
                <line x1={px} y1={y + arrowLen} x2={px} y2={y + markerOffset} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#exp-arrowRed)" />
                <text x={labelX} y={y + arrowLen + 12} fill={COLORS.pointForce} fontSize={fontSize.label} fontWeight="600" textAnchor={anchor}>
                  F{subscript && <tspan dy="3" fontSize={fontSize.subscript}>{subscript}</tspan>}
                </text>
              </g>
            );
          }
        });
      })()}

      {/* Моменты — собственный рендеринг */}
      {(() => {
        const momentLoads = loads.filter(l => l.type === "moment");
        const momentCount = momentLoads.length;
        let momentIdx = 0;

        return loads.map((load, i) => {
          if (load.type !== "moment") return null;
          momentIdx++;
          const subscript = momentCount > 1 ? String(momentIdx) : "";
          const H = 28;
          const R = 16;
          const gap = 5;
          const px = xToPx(load.x);
          const Cy = beamY - gap - H;

          const isCW = load.M < 0;
          const aLeft = (240 * Math.PI) / 180;
          const aRight = (330 * Math.PI) / 180;
          const pLeft = { x: px + R * Math.cos(aLeft), y: Cy + R * Math.sin(aLeft) };
          const pRight = { x: px + R * Math.cos(aRight), y: Cy + R * Math.sin(aRight) };

          const legEnd = isCW ? pLeft : pRight;
          const arcStart = isCW ? pLeft : pRight;
          const arcEnd = isCW ? pRight : pLeft;
          const sweepFlag = isCW ? 1 : 0;

          const labelX = isCW ? pRight.x + 6 : pLeft.x - 6;
          const labelAnchor = isCW ? "start" : "end";

          return (
            <g key={`moment-${i}`}>
              <line x1={px} y1={beamY - gap} x2={legEnd.x} y2={legEnd.y} stroke={COLORS.moment} strokeWidth={2} />
              <path
                d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`}
                fill="none"
                stroke={COLORS.moment}
                strokeWidth={2}
                markerEnd="url(#exp-arrowPurple)"
              />
              <text x={labelX} y={Cy - 12} textAnchor={labelAnchor} fill={COLORS.moment} fontSize={fontSize.label} fontWeight="600">
                M{subscript && <tspan dy="3" fontSize={fontSize.subscript}>{subscript}</tspan>}
              </text>
            </g>
          );
        });
      })()}

      {/* Реакции опор — собственный рендеринг с крупными шрифтами */}
      {(() => {
        const { reactions } = result;
        const elements: React.ReactNode[] = [];
        const beamTop = beamY - beamThickness / 2;
        const arrowLen = 32;
        const markerOffset = 6;

        const drawReaction = (key: string, px: number, value: number, name: string, subscript: string, labelSide: "left" | "right") => {
          const pointsUp = value >= 0;
          let startY: number, endY: number, textY: number;

          if (pointsUp) {
            startY = beamTop;
            endY = beamTop - arrowLen;
            textY = endY - 8;
          } else {
            startY = beamTop - arrowLen;
            endY = beamTop - markerOffset;
            textY = startY - 4;
          }

          const textX = labelSide === "left" ? px - 8 : px + 8;
          const anchor = labelSide === "left" ? "end" : "start";

          elements.push(
            <g key={key}>
              <line x1={px} y1={startY} x2={px} y2={endY} stroke={COLORS.reaction} strokeWidth={2} markerEnd="url(#exp-arrowGreen)" />
              <text x={textX} y={textY} fill={COLORS.reaction} fontSize={fontSize.label} fontWeight="600" textAnchor={anchor} dominantBaseline="middle">
                {name}<tspan dy="3" fontSize={fontSize.subscript}>{subscript}</tspan>
              </text>
            </g>
          );
        };

        if (reactions.RA !== undefined && reactions.RA !== 0) {
          drawReaction("RA", xToPx(reactions.xA ?? 0), reactions.RA, "R", "A", "right");
        }
        if (reactions.RB !== undefined && reactions.RB !== 0) {
          drawReaction("RB", xToPx(reactions.xB ?? L), reactions.RB, "R", "B", "left");
        }
        if (reactions.Rf !== undefined && reactions.Rf !== 0) {
          drawReaction("Rf", xToPx(reactions.xf ?? 0), reactions.Rf, "R", "", "right");
        }

        return <>{elements}</>;
      })()}

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
        const labelY = beamY + 72;

        if (pinSupport) {
          labels.push(
            <text key="label-A" x={xToPx(pinSupport.x)} y={labelY} textAnchor="middle" fill="#1f2937" fontSize={fontSize.support} fontWeight="bold">
              A
            </text>
          );
        }
        if (rollerSupport) {
          labels.push(
            <text key="label-B" x={xToPx(rollerSupport.x)} y={labelY} textAnchor="middle" fill="#1f2937" fontSize={fontSize.support} fontWeight="bold">
              B
            </text>
          );
        }

        return labels;
      })()}

      {/* Размерные линии участков */}
      {(() => {
        const dimY = height - 28;
        const tickH = 6;
        const elements: React.ReactNode[] = [];

        const keyPoints = new Set<number>([0, L]);
        for (const support of input.supports) {
          keyPoints.add(support.x);
        }
        for (const load of loads) {
          if (load.type === "distributed") {
            keyPoints.add(load.a);
            keyPoints.add(load.b);
          } else if (load.type === "force") {
            keyPoints.add(load.x);
          } else if (load.type === "moment") {
            keyPoints.add(load.x);
          }
        }

        const sortedPoints = Array.from(keyPoints).filter(p => p >= 0 && p <= L).sort((a, b) => a - b);
        const beamBottomY = beamY + beamThickness / 2;

        // Пунктирные линии от балки к размерной линии
        for (let i = 0; i < sortedPoints.length; i++) {
          const x = sortedPoints[i];
          elements.push(
            <line
              key={`dashed-${i}`}
              x1={xToPx(x)}
              y1={beamBottomY + 2}
              x2={xToPx(x)}
              y2={dimY - tickH}
              stroke="#9ca3af"
              strokeWidth={0.75}
              strokeDasharray="3,3"
            />
          );
        }

        elements.push(
          <line key="dim-main" x1={xToPx(0)} y1={dimY} x2={xToPx(L)} y2={dimY} stroke="#374151" strokeWidth={1} />
        );

        for (let i = 0; i < sortedPoints.length; i++) {
          const x = sortedPoints[i];
          elements.push(
            <line key={`tick-${i}`} x1={xToPx(x)} y1={dimY - tickH} x2={xToPx(x)} y2={dimY + tickH} stroke="#374151" strokeWidth={1} />
          );

          if (i < sortedPoints.length - 1) {
            const nextX = sortedPoints[i + 1];
            const segLen = nextX - x;
            if (segLen > 0.001) {
              const midX = (xToPx(x) + xToPx(nextX)) / 2;
              elements.push(
                <text key={`seg-${i}`} x={midX} y={dimY + 16} textAnchor="middle" fill="#374151" fontSize={fontSize.dimension} fontWeight="500">
                  {segLen % 1 === 0 ? segLen : segLen.toFixed(1)}
                </text>
              );
            }
          }
        }

        return <g>{elements}</g>;
      })()}
    </svg>
  );
}
