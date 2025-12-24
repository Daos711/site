import React from "react";
import { COLORS } from "./constants";

// Стрелка реакции - направление зависит от знака
// value >= 0: вверх (от балки), value < 0: вниз (к балке сверху)
export function ReactionArrow({ x, baseY, value, label, labelSide = "right", labelYOffset = 0, labelXOffset = 0 }: {
  x: number; baseY: number; value: number; label: string; labelSide?: "left" | "right"; labelYOffset?: number; labelXOffset?: number
}) {
  const arrowLen = 40;
  const pointsUp = value >= 0;

  const markerSize = 6;
  let startY: number, endY: number;
  if (pointsUp) {
    startY = baseY;
    endY = baseY - arrowLen;
  } else {
    startY = baseY - arrowLen;
    endY = baseY - markerSize;
  }

  // Границы панели для проверки
  const minY = 15;
  const minX = 5;

  let textX = x + (labelSide === "left" ? -8 : 8) + labelXOffset;
  let textY = baseY - arrowLen / 2 - labelYOffset;
  let textAnchor: "start" | "end" = labelSide === "left" ? "end" : "start";

  if (textY < minY) {
    textY = minY;
  }

  if (labelSide === "left" && textX < minX + 80) {
    textX = x + 8;
    textAnchor = "start";
  }

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
export function DistributedLoadArrows({
  x1, x2, beamTopY, beamBottomY, q, label
}: {
  x1: number; x2: number; beamTopY: number; beamBottomY: number; q: number; label: string
}) {
  const arrowLen = 28;
  const numArrows = Math.max(4, Math.floor((x2 - x1) / 35));

  if (q >= 0) {
    const baseY = beamTopY;
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
    const baseY = beamBottomY;
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
// F > 0: вниз, F < 0: вверх
export function ForceArrow({ x, y, F, label, maxX }: { x: number; y: number; F: number; label: string; maxX?: number }) {
  const arrowLen = 60;
  const pointsDown = F >= 0;

  const labelWidth = 100;
  const minX = 5;

  const wouldOverflowRight = maxX !== undefined && (x + 10 + labelWidth > maxX);
  const wouldOverflowLeft = wouldOverflowRight && (x - 10 < minX + labelWidth);

  let labelX = wouldOverflowRight && !wouldOverflowLeft ? x - 10 : x + 10;
  let textAnchor: "end" | "start" = wouldOverflowRight && !wouldOverflowLeft ? "end" : "start";

  if (textAnchor === "end" && labelX < minX + labelWidth) {
    labelX = x + 10;
    textAnchor = "start";
  }

  if (pointsDown) {
    return (
      <g>
        <line x1={x} y1={y - arrowLen} x2={x} y2={y - 8} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#arrowRed)" />
        <text x={labelX} y={y - arrowLen - 5} fill={COLORS.pointForce} fontSize={13} fontWeight="600" textAnchor={textAnchor}>
          {label}
        </text>
      </g>
    );
  } else {
    return (
      <g>
        <line x1={x} y1={y + arrowLen} x2={x} y2={y + 22} stroke={COLORS.pointForce} strokeWidth={2} markerEnd="url(#arrowRed)" />
        <text x={labelX} y={y + arrowLen + 15} fill={COLORS.pointForce} fontSize={13} fontWeight="600" textAnchor={textAnchor}>
          {label}
        </text>
      </g>
    );
  }
}

// Момент (ножка + дуга со стрелкой, ФИОЛЕТОВАЯ)
// M > 0: против часовой (↺), стрелка слева
// M < 0: по часовой (↻), стрелка справа
export function MomentArrow({ x, y, M, label }: { x: number; y: number; M: number; label: string }) {
  const H = 35;
  const R = 20;
  const gap = 6;

  const Cx = x;
  const Cy = y - gap - H;

  const aLeft = (240 * Math.PI) / 180;
  const aRight = (330 * Math.PI) / 180;

  const pLeft = { x: Cx + R * Math.cos(aLeft), y: Cy + R * Math.sin(aLeft) };
  const pRight = { x: Cx + R * Math.cos(aRight), y: Cy + R * Math.sin(aRight) };

  const legStart = { x: x, y: y - gap };

  const isCW = M < 0;

  const legEnd = isCW ? pLeft : pRight;
  const arcStart = isCW ? pLeft : pRight;
  const arcEnd = isCW ? pRight : pLeft;
  const sweepFlag = isCW ? 1 : 0;

  const minX = 5;
  const minY = 15;

  let labelX = isCW ? pRight.x + 8 : pLeft.x - 8;
  let labelY = isCW ? pRight.y - 4 : pLeft.y - 4;
  let labelAnchor: "start" | "end" = isCW ? "start" : "end";

  if (!isCW && labelX < minX + 60) {
    labelX = pRight.x + 8;
    labelAnchor = "start";
  }

  if (labelY < minY) {
    labelY = minY;
  }

  const labelPos = { x: labelX, y: labelY };

  return (
    <g>
      <line
        x1={legStart.x}
        y1={legStart.y}
        x2={legEnd.x}
        y2={legEnd.y}
        stroke={COLORS.moment}
        strokeWidth={2}
      />
      <path
        d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 0 ${sweepFlag} ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke={COLORS.moment}
        strokeWidth={2}
        markerEnd="url(#arrowPurple)"
      />
      <text
        x={labelPos.x}
        y={labelPos.y}
        textAnchor={labelAnchor}
        fill={COLORS.moment}
        fontSize={12}
        fontWeight="600"
      >
        {label}
      </text>
    </g>
  );
}
