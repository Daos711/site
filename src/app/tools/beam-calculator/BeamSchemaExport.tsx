"use client";

import React from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { COLORS } from "./constants";
import { PinSupport, RollerSupport, FixedSupport } from "./BeamSupports";
import { ReactionArrow, DistributedLoadArrows, ForceArrow, MomentArrow } from "./BeamLoads";

const formatNum = (value: number, decimals = 2): string => {
  if (Math.abs(value) < 1e-10) return "0";
  const fixed = value.toFixed(decimals);
  return fixed.replace(/\.?0+$/, "");
};

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

  // Размеры SVG (крупнее для лучшей читаемости)
  const width = 900;
  const height = 320;
  const padding = { left: 80, right: 80, top: 110, bottom: 80 };
  const beamY = padding.top + 45;
  const beamThickness = 20;

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
        width: "900px",
        height: "320px",
        background: "#ffffff",
      }}
    >
      {/* Маркеры для стрелок - refX=3 как на сайте */}
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
          // Положительная сила вниз → верхняя поверхность, отрицательная вверх → нижняя
          const forceY = load.F >= 0 ? (beamY - beamThickness / 2) : (beamY + beamThickness / 2);
          return (
            <ForceArrow
              key={`force-${i}`}
              x={xToPx(load.x)}
              y={forceY}
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

      {/* Реакции опор */}
      {(() => {
        const { reactions } = result;
        const elements: React.ReactNode[] = [];
        const beamTop = beamY - beamThickness / 2;
        const beamBottom = beamY + beamThickness / 2;

        // Проверка наличия нагрузки в точке
        const hasLoadAt = (x: number): boolean => {
          return input.loads.some(load => {
            if (load.type === "force" || load.type === "moment") {
              return Math.abs(load.x - x) < 0.01;
            }
            return false;
          });
        };

        if (reactions.RA !== undefined && reactions.RA !== 0) {
          const xA = reactions.xA ?? 0;
          // Реакции всегда относительно верхней плоскости балки
          elements.push(
            <ReactionArrow
              key="RA"
              x={xToPx(xA)}
              baseY={beamTop}
              value={reactions.RA}
              name="R"
              subscript="A"
              valueText={`${formatNum(Math.abs(reactions.RA))} кН`}
              labelSide="right"
              markerPrefix="exp-"
            />
          );
        }

        if (reactions.RB !== undefined && reactions.RB !== 0) {
          const xB = reactions.xB ?? L;
          const hasLoadAtB = hasLoadAt(xB);
          // Если есть нагрузка — подпись справа, чтобы не перекрывалась
          elements.push(
            <ReactionArrow
              key="RB"
              x={xToPx(xB)}
              baseY={beamTop}
              value={reactions.RB}
              name="R"
              subscript="B"
              valueText={`${formatNum(Math.abs(reactions.RB))} кН`}
              labelSide={hasLoadAtB ? "right" : "left"}
              markerPrefix="exp-"
            />
          );
        }

        if (reactions.Rf !== undefined && reactions.Rf !== 0) {
          const xf = reactions.xf ?? 0;
          elements.push(
            <ReactionArrow
              key="Rf"
              x={xToPx(xf)}
              baseY={beamTop}
              value={reactions.Rf}
              name="R"
              valueText={`${formatNum(Math.abs(reactions.Rf))} кН`}
              labelSide="right"
              markerPrefix="exp-"
            />
          );
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

      {/* Размерные линии участков */}
      {(() => {
        const dimY = height - 30;
        const tickH = 6;
        const elements: React.ReactNode[] = [];

        // Собираем все ключевые точки
        const keyPoints = new Set<number>([0, L]);

        // Точки опор
        for (const support of input.supports) {
          keyPoints.add(support.x);
        }

        // Точки нагрузок
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

        // Основная размерная линия
        elements.push(
          <line key="dim-main" x1={xToPx(0)} y1={dimY} x2={xToPx(L)} y2={dimY} stroke="#374151" strokeWidth={1} />
        );

        // Засечки и подписи для каждого сегмента
        for (let i = 0; i < sortedPoints.length; i++) {
          const x = sortedPoints[i];
          // Засечка
          elements.push(
            <line key={`tick-${i}`} x1={xToPx(x)} y1={dimY - tickH} x2={xToPx(x)} y2={dimY + tickH} stroke="#374151" strokeWidth={1} />
          );

          // Подпись длины сегмента (между соседними точками)
          if (i < sortedPoints.length - 1) {
            const nextX = sortedPoints[i + 1];
            const segLen = nextX - x;
            if (segLen > 0.001) {
              const midX = (xToPx(x) + xToPx(nextX)) / 2;
              elements.push(
                <text key={`seg-${i}`} x={midX} y={dimY + 18} textAnchor="middle" fill="#374151" fontSize={14} fontWeight="500">
                  {segLen % 1 === 0 ? segLen : segLen.toFixed(1)}
                </text>
              );
            }
          }
        }

        // Подпись общей длины L
        elements.push(
          <text key="dim-L" x={(xToPx(0) + xToPx(L)) / 2} y={height - 5} textAnchor="middle" fill="#374151" fontSize={14} fontWeight="500">
            L = {L} м
          </text>
        );

        return <g>{elements}</g>;
      })()}
    </svg>
  );
}
