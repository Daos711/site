"use client";

import type { BeamInput, BeamResult } from "@/lib/beam";
import { UnifiedBeamView } from "./UnifiedBeamView";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

export function BeamResults({ input, result }: Props) {
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
    <div className="space-y-6">
      {/* Реакции и экстремумы в компактном виде */}
      <div className="grid gap-4 sm:grid-cols-2">
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

        {/* Экстремумы */}
        <div className="p-4 rounded-lg border border-border bg-card">
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
                <span className="text-muted">|w|_max:</span>
                <span className="font-mono">
                  {(Math.abs(wMax.value) * 1000).toFixed(2)} мм
                  <span className="text-muted ml-1">
                    (x = {wMax.x.toFixed(2)} м)
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Единая визуализация */}
      <UnifiedBeamView input={input} result={result} />
    </div>
  );
}
