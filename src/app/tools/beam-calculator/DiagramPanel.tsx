import React, { useMemo } from "react";
import { PADDING, COLORS, formatNum } from "./constants";

export interface DiagramPanelProps {
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

export function DiagramPanel({ title, unit, segments, xToPx, y, height, color, chartWidth, scale = 1, boundaries = [] }: DiagramPanelProps) {
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

      {/* Сегменты графика */}
      {scaledSegments.map((segment, segIdx) => {
        if (segment.length < 2) return null;

        const first = segment[0];

        let lineD = `M ${xToPx(first.x)} ${scaleY(first.value)}`;
        for (const p of segment.slice(1)) {
          lineD += ` L ${xToPx(p.x)} ${scaleY(p.value)}`;
        }

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
            {fillLines}
            <path d={lineD} stroke={color} strokeWidth={2.5} fill="none" />
          </g>
        );
      })}

      {/* Подписи значений на границах участков */}
      {(() => {
        const labels: React.ReactNode[] = [];

        const proximityThreshold = Math.max(0.5, boundaries[boundaries.length - 1] * 0.15);
        const isAtExtremum = (x: number) => {
          return Math.abs(x - extremes.maxP.x) < proximityThreshold ||
                 Math.abs(x - extremes.minP.x) < proximityThreshold;
        };

        const findValueAt = (x: number, fromLeft: boolean): number | null => {
          for (const seg of scaledSegments) {
            if (seg.length < 2) continue;

            const first = seg[0];
            const last = seg[seg.length - 1];

            if (fromLeft) {
              if (Math.abs(last.x - x) < 0.01) {
                return last.value;
              }
            } else {
              if (Math.abs(first.x - x) < 0.01) {
                return first.value;
              }
            }

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

        const addBoundaryLabel = (bx: number, value: number, placeRight: boolean, key: string, isEndpoint: boolean, forceShow = false) => {
          if (Math.abs(value) < 1e-6) {
            value = 0;
          }

          if (!forceShow && !isEndpoint && isAtExtremum(bx)) {
            return;
          }

          const xOffset = placeRight ? 12 : -12;
          const anchor = placeRight ? "start" : "end";
          const curveY = scaleY(value);
          const textY = value >= 0 ? curveY - 20 : curveY + 24;

          labels.push(
            <text
              key={key}
              x={xToPx(bx) + xOffset}
              y={textY}
              textAnchor={anchor}
              fill={color}
              fontSize={12}
              fontWeight="500"
            >
              {formatNum(value, 2)}
            </text>
          );
        };

        // Проверяет, горизонтальный ли сегмент слева от границы
        const isLeftSegmentHorizontal = (bIdx: number, endValue: number): boolean => {
          if (bIdx === 0) return false;
          const prevBx = boundaries[bIdx - 1];
          const startValue = findValueAt(prevBx, false); // начало сегмента = rightValue предыдущей границы
          if (startValue === null) return false;
          return Math.abs(startValue - endValue) < 0.1;
        };

        for (let bIdx = 0; bIdx < boundaries.length; bIdx++) {
          const bx = boundaries[bIdx];
          const isFirst = bIdx === 0;
          const isLast = bIdx === boundaries.length - 1;
          const isEndpoint = isFirst || isLast;

          const leftValue = findValueAt(bx, true);
          const rightValue = findValueAt(bx, false);

          const hasDiscontinuity = leftValue !== null && rightValue !== null &&
            Math.abs(leftValue - rightValue) > 0.5;

          if (hasDiscontinuity) {
            // При разрыве: подписываем оба значения
            // НО: если левый сегмент горизонтальный — он уже подписан в начале, пропускаем
            if (leftValue !== null) {
              const skipLeft = isLeftSegmentHorizontal(bIdx, leftValue);
              if (!skipLeft) {
                addBoundaryLabel(bx, leftValue, false, `boundary-${bIdx}-left`, isEndpoint, true);
              }
            }
            if (rightValue !== null) {
              addBoundaryLabel(bx, rightValue, true, `boundary-${bIdx}-right`, isEndpoint, true);
            }
          } else {
            const value = rightValue ?? leftValue;
            if (value === null) continue;

            // Если слева горизонтальный сегмент — подпись уже есть в его начале, пропускаем
            const skipHorizontal = isLeftSegmentHorizontal(bIdx, value);
            if (skipHorizontal) {
              continue;
            }

            let placeRight: boolean;
            if (isFirst) {
              placeRight = true;
            } else if (isLast) {
              placeRight = false;
            } else {
              placeRight = false;
            }

            addBoundaryLabel(bx, value, placeRight, `boundary-${bIdx}`, isEndpoint);
          }
        }

        return <g>{labels}</g>;
      })()}

      {/* Маркеры экстремумов */}
      {Math.abs(extremes.maxP.value) > 1e-9 && (() => {
        const isEndpoint = Math.abs(extremes.maxP.x - boundaries[0]) < 0.05 ||
                          Math.abs(extremes.maxP.x - boundaries[boundaries.length - 1]) < 0.05;
        if (isEndpoint) return null;

        const onBoundary = boundaries.some(b => Math.abs(b - extremes.maxP.x) < 0.05);
        const curveY = scaleY(extremes.maxP.value);

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
        const isEndpoint = Math.abs(extremes.minP.x - boundaries[0]) < 0.05 ||
                          Math.abs(extremes.minP.x - boundaries[boundaries.length - 1]) < 0.05;
        if (isEndpoint) return null;

        const onBoundary = boundaries.some(b => Math.abs(b - extremes.minP.x) < 0.05);
        const curveY = scaleY(extremes.minP.value);

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
