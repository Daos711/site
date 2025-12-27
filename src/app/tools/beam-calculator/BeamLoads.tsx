import React from "react";
import { COLORS } from "./constants";

// Стрелка реакции - направление зависит от знака
// baseY - верхняя поверхность балки (реакции всегда относительно верхней плоскости)
// value >= 0: стрелка ВВЕРХ - начинается ОТ верхней плоскости, уходит вверх
// value < 0: стрелка ВНИЗ - приходит сверху, наконечник касается верхней плоскости
export function ReactionArrow({ x, baseY, value, name, subscript, valueText, labelSide = "right", labelYOffset = 0, labelXOffset = 0, markerPrefix = "" }: {
  x: number; baseY: number; value: number; name: string; subscript?: string; valueText: string; labelSide?: "left" | "right"; labelYOffset?: number; labelXOffset?: number; markerPrefix?: string
}) {
  const arrowLen = 40;
  // Маркер 6x6 с refX=3 при strokeWidth=2 масштабируется до 12x12
  // Острие выступает на 6px от конца линии
  const markerOffset = 8;
  const pointsUp = value >= 0; // Положительная реакция направлена ВВЕРХ

  let startY: number, endY: number, textY: number;

  if (pointsUp) {
    // Стрелка ВВЕРХ: начинается ОТ верхней плоскости балки, уходит вверх
    startY = baseY; // начало на поверхности балки
    endY = baseY - arrowLen; // конец выше (наконечник вверху)
    textY = endY - 10;
  } else {
    // Стрелка ВНИЗ: приходит сверху, наконечник касается верхней плоскости
    startY = baseY - arrowLen; // начало выше
    endY = baseY - markerOffset; // конец у поверхности, острие касается baseY
    textY = startY - 5;
  }

  const textX = x + (labelSide === "left" ? -10 : 10) + labelXOffset;
  const textAnchor: "start" | "end" = labelSide === "left" ? "end" : "start";

  return (
    <g>
      <line x1={x} y1={startY} x2={x} y2={endY} stroke={COLORS.reaction} strokeWidth={2} markerEnd={`url(#${markerPrefix}arrowGreen)`} />
      <text x={textX} y={textY} fill={COLORS.reaction} fontSize={12} fontWeight="600" dominantBaseline="middle" textAnchor={textAnchor}>
        {name}
        {subscript && <tspan dy="3" fontSize="9">{subscript}</tspan>}
        {subscript && <tspan dy="-3"> </tspan>}
        <tspan> = {valueText}</tspan>
      </text>
    </g>
  );
}

// Распределённая нагрузка (СИНЯЯ)
// q > 0: сверху балки, стрелки вниз
// q < 0: снизу балки, стрелки вверх
export function DistributedLoadArrows({
  x1, x2, beamTopY, beamBottomY, q, label, markerPrefix = ""
}: {
  x1: number; x2: number; beamTopY: number; beamBottomY: number; q: number; label: string; markerPrefix?: string
}) {
  const arrowLen = 28;
  const markerOffset = 8; // маркер масштабируется, острие выступает на ~6px
  const numArrows = Math.max(4, Math.floor((x2 - x1) / 35));

  if (q >= 0) {
    // Стрелки вниз к верхней поверхности балки
    return (
      <g>
        <line x1={x1} y1={beamTopY - arrowLen} x2={x2} y2={beamTopY - arrowLen} stroke={COLORS.distributedLoad} strokeWidth={2} />
        {Array.from({ length: numArrows }).map((_, i) => {
          const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
          return (
            <line
              key={i}
              x1={px}
              y1={beamTopY - arrowLen}
              x2={px}
              y2={beamTopY - markerOffset}
              stroke={COLORS.distributedLoad}
              strokeWidth={2}
              markerEnd={`url(#${markerPrefix}arrowBlue)`}
            />
          );
        })}
        <text x={(x1 + x2) / 2} y={beamTopY - arrowLen - 8} textAnchor="middle" fill={COLORS.distributedLoad} fontSize={12} fontWeight="600">
          {label}
        </text>
      </g>
    );
  } else {
    // Стрелки вверх к нижней поверхности балки
    return (
      <g>
        <line x1={x1} y1={beamBottomY + arrowLen} x2={x2} y2={beamBottomY + arrowLen} stroke={COLORS.distributedLoad} strokeWidth={2} />
        {Array.from({ length: numArrows }).map((_, i) => {
          const px = x1 + (i / (numArrows - 1)) * (x2 - x1);
          return (
            <line
              key={i}
              x1={px}
              y1={beamBottomY + arrowLen}
              x2={px}
              y2={beamBottomY + markerOffset}
              stroke={COLORS.distributedLoad}
              strokeWidth={2}
              markerEnd={`url(#${markerPrefix}arrowBlueUp)`}
            />
          );
        })}
        <text x={(x1 + x2) / 2} y={beamBottomY + arrowLen + 18} textAnchor="middle" fill={COLORS.distributedLoad} fontSize={12} fontWeight="600">
          {label}
        </text>
      </g>
    );
  }
}

// Сосредоточенная сила (КРАСНАЯ)
// y - поверхность балки (верхняя для F>0, нижняя для F<0)
// F > 0: вниз к верхней, F < 0: вверх к нижней
export function ForceArrow({ x, y, F, label, maxX, markerPrefix = "" }: { x: number; y: number; F: number; label: string; maxX?: number; markerPrefix?: string }) {
  const arrowLen = 50;
  const markerOffset = 8; // маркер масштабируется, острие выступает на ~6px
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
    // Стрелка вниз: кончик касается y (верхняя поверхность)
    return (
      <g>
        <line x1={x} y1={y - arrowLen} x2={x} y2={y - markerOffset} stroke={COLORS.pointForce} strokeWidth={2} markerEnd={`url(#${markerPrefix}arrowRed)`} />
        <text x={labelX} y={y - arrowLen - 5} fill={COLORS.pointForce} fontSize={13} fontWeight="600" textAnchor={textAnchor}>
          {label}
        </text>
      </g>
    );
  } else {
    // Стрелка вверх: кончик касается y (нижняя поверхность)
    return (
      <g>
        <line x1={x} y1={y + arrowLen} x2={x} y2={y + markerOffset} stroke={COLORS.pointForce} strokeWidth={2} markerEnd={`url(#${markerPrefix}arrowRed)`} />
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
export function MomentArrow({ x, y, M, label, markerPrefix = "", maxX, liftLabel = false }: { x: number; y: number; M: number; label: string; markerPrefix?: string; maxX?: number; liftLabel?: boolean }) {
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

  // Проверяем, не вылезет ли подпись за правый край
  const nearRightEdge = maxX !== undefined && x > maxX - 80;

  let labelX: number;
  let labelY: number;
  let labelAnchor: "start" | "end";

  if (nearRightEdge) {
    // У правого края — подпись слева и выше дуги
    labelX = pLeft.x - 8;
    labelY = Cy - R - 5;
    labelAnchor = "end";
  } else if (isCW) {
    labelX = pRight.x + 8;
    labelY = pRight.y - 4;
    labelAnchor = "start";
  } else {
    labelX = pLeft.x - 8;
    labelY = pLeft.y - 4;
    labelAnchor = "end";
  }

  if (!isCW && !nearRightEdge && labelX < minX + 60) {
    labelX = pRight.x + 8;
    labelAnchor = "start";
  }

  // При наложении с силой/реакцией — поднимаем подпись выше
  if (liftLabel) {
    labelY = Cy - R - 5;
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
        markerEnd={`url(#${markerPrefix}arrowPurple)`}
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
