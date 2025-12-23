"use client";

import type { BeamInput, BeamResult } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
  className?: string;
}

export function ResultCards({ input, result, className }: Props) {
  const { reactions, Mmax, Qmax, y } = result;

  // Находим максимальный прогиб
  const wMax = y
    ? (() => {
        let max = 0;
        let maxX = 0;
        for (let i = 0; i <= 100; i++) {
          const x = (i / 100) * input.L;
          const val = Math.abs(y(x));
          if (val > max) {
            max = val;
            maxX = x;
          }
        }
        return { value: y(maxX), x: maxX };
      })()
    : null;

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      {/* Мини-превью схемы балки */}
      <MiniBeamPreview input={input} />

      {/* Реакции */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3 text-sm">Реакции опор</h3>
        <div className="space-y-1 text-sm">
          {reactions.RA !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted">R_A:</span>
              <span className="font-mono">
                {reactions.RA.toFixed(2)} кН
                <span className="text-muted ml-1">
                  ({reactions.RA >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.RB !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted">R_B:</span>
              <span className="font-mono">
                {reactions.RB.toFixed(2)} кН
                <span className="text-muted ml-1">
                  ({reactions.RB >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.Rf !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted">R_f:</span>
              <span className="font-mono">
                {reactions.Rf.toFixed(2)} кН
                <span className="text-muted ml-1">
                  ({reactions.Rf >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.Mf !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted">M_f:</span>
              <span className="font-mono">
                {reactions.Mf.toFixed(2)} кН·м
                <span className="text-muted ml-1">
                  ({reactions.Mf >= 0 ? "↺" : "↻"})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Экстремумы — растягивается на оставшееся место */}
      <div className="p-4 rounded-lg border border-border bg-card flex-1">
        <h3 className="font-semibold mb-3 text-sm">Экстремальные значения</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">|Q|_max:</span>
            <span className="font-mono">
              {Math.abs(Qmax.value).toFixed(2)} кН
              <span className="text-muted ml-1">
                (x = {Qmax.x.toFixed(2)} м)
              </span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">|M|_max:</span>
            <span className="font-mono">
              {Math.abs(Mmax.value).toFixed(2)} кН·м
              <span className="text-muted ml-1">
                (x = {Mmax.x.toFixed(2)} м)
              </span>
            </span>
          </div>
          {wMax && (
            <div className="flex justify-between">
              <span className="text-muted">w_max:</span>
              <span className="font-mono">
                {(wMax.value * 1000).toFixed(2)} мм
                <span className="text-muted ml-1">
                  (x = {wMax.x.toFixed(2)} м)
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Мини-превью схемы балки
function MiniBeamPreview({ input }: { input: BeamInput }) {
  const { L, loads, beamType } = input;
  const width = 300;
  const height = 80;
  const padding = 30;
  const beamY = 40;
  const beamLen = width - 2 * padding;

  const xToPx = (x: number) => padding + (x / L) * beamLen;

  return (
    <div className="p-4 rounded-lg border border-border bg-card">
      <h3 className="font-semibold mb-2 text-sm">Схема нагружения</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Балка */}
        <rect
          x={padding}
          y={beamY - 4}
          width={beamLen}
          height={8}
          fill="rgb(100, 116, 139)"
          rx={2}
        />

        {/* Опоры */}
        {beamType === "simply-supported" && (
          <>
            <polygon
              points={`${padding},${beamY + 4} ${padding - 8},${beamY + 18} ${padding + 8},${beamY + 18}`}
              fill="none"
              stroke="rgb(148, 163, 184)"
              strokeWidth={2}
            />
            <polygon
              points={`${padding + beamLen},${beamY + 4} ${padding + beamLen - 8},${beamY + 18} ${padding + beamLen + 8},${beamY + 18}`}
              fill="none"
              stroke="rgb(148, 163, 184)"
              strokeWidth={2}
            />
          </>
        )}
        {beamType === "cantilever-left" && (
          <g>
            <line x1={padding} y1={beamY - 15} x2={padding} y2={beamY + 15} stroke="rgb(148, 163, 184)" strokeWidth={3} />
            {[-10, 0, 10].map((dy) => (
              <line
                key={dy}
                x1={padding}
                y1={beamY + dy}
                x2={padding - 8}
                y2={beamY + dy - 6}
                stroke="rgb(148, 163, 184)"
                strokeWidth={1.5}
              />
            ))}
          </g>
        )}
        {beamType === "cantilever-right" && (
          <g>
            <line x1={padding + beamLen} y1={beamY - 15} x2={padding + beamLen} y2={beamY + 15} stroke="rgb(148, 163, 184)" strokeWidth={3} />
            {[-10, 0, 10].map((dy) => (
              <line
                key={dy}
                x1={padding + beamLen}
                y1={beamY + dy}
                x2={padding + beamLen + 8}
                y2={beamY + dy - 6}
                stroke="rgb(148, 163, 184)"
                strokeWidth={1.5}
              />
            ))}
          </g>
        )}

        {/* Нагрузки */}
        {loads.map((load, i) => {
          if (load.type === "distributed") {
            const x1 = xToPx(load.a);
            const x2 = xToPx(load.b);
            const numArrows = Math.max(3, Math.floor((x2 - x1) / 15));
            return (
              <g key={i}>
                <line x1={x1} y1={beamY - 20} x2={x2} y2={beamY - 20} stroke="rgb(59, 130, 246)" strokeWidth={1.5} />
                {Array.from({ length: numArrows }).map((_, j) => {
                  const px = x1 + (j / (numArrows - 1)) * (x2 - x1);
                  return (
                    <line key={j} x1={px} y1={beamY - 20} x2={px} y2={beamY - 6} stroke="rgb(59, 130, 246)" strokeWidth={1.5} />
                  );
                })}
              </g>
            );
          } else if (load.type === "force") {
            const px = xToPx(load.x);
            return (
              <g key={i}>
                <line x1={px} y1={beamY - 25} x2={px} y2={beamY - 6} stroke="rgb(239, 68, 68)" strokeWidth={2} />
                <polygon
                  points={`${px},${beamY - 6} ${px - 4},${beamY - 12} ${px + 4},${beamY - 12}`}
                  fill="rgb(239, 68, 68)"
                />
              </g>
            );
          } else {
            const px = xToPx(load.x);
            return (
              <g key={i}>
                <circle cx={px} cy={beamY} r={8} fill="none" stroke="rgb(168, 85, 247)" strokeWidth={2} />
                <path
                  d={`M ${px + 5} ${beamY - 6} L ${px + 9} ${beamY - 2}`}
                  stroke="rgb(168, 85, 247)"
                  strokeWidth={2}
                />
              </g>
            );
          }
        })}

        {/* Размер L */}
        <text x={width / 2} y={height - 5} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={11}>
          L = {L} м
        </text>
      </svg>
    </div>
  );
}
