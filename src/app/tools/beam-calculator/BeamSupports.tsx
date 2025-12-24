import React from "react";
import { COLORS } from "./constants";

interface SupportProps {
  x: number;
  y: number;
}

// Шарнирно-неподвижная опора
export function PinSupport({ x, y }: SupportProps) {
  const size = 24;
  const baseY = y + size;
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
      {/* Штриховка под линией (заделка) */}
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
export function RollerSupport({ x, y }: SupportProps) {
  const size = 24;
  const baseY = y + size + 15;
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
      {/* Штриховка под линией */}
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
export function FixedSupport({ x, y, side }: SupportProps & { side: "left" | "right" }) {
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
