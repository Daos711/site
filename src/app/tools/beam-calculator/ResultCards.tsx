"use client";

import type { BeamInput, BeamResult } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
  className?: string;
}

const BEAM_TYPE_NAMES: Record<string, string> = {
  "simply-supported": "Двухопорная",
  "cantilever-left": "Консоль (заделка слева)",
  "cantilever-right": "Консоль (заделка справа)",
};

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
      {/* Сводка параметров */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3 text-sm">Параметры расчёта</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Тип:</span>
            <span>{BEAM_TYPE_NAMES[input.beamType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Длина:</span>
            <span className="font-mono">{input.L} м</span>
          </div>
          {input.E && input.I && (
            <>
              <div className="flex justify-between">
                <span className="text-muted">E:</span>
                <span className="font-mono">{input.E} ГПа</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">I:</span>
                <span className="font-mono">{input.I} см⁴</span>
              </div>
            </>
          )}
        </div>

        {/* Список нагрузок */}
        {input.loads.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-xs text-muted mb-2">Нагрузки:</div>
            <div className="space-y-1 text-xs">
              {input.loads.map((load, i) => {
                if (load.type === "distributed") {
                  const sign = load.q >= 0 ? "↓" : "↑";
                  return (
                    <div key={i} className="flex justify-between text-blue-400">
                      <span>q{i + 1}:</span>
                      <span className="font-mono">
                        {Math.abs(load.q)} кН/м {sign} [{load.a}–{load.b}]
                      </span>
                    </div>
                  );
                } else if (load.type === "force") {
                  const sign = load.F >= 0 ? "↓" : "↑";
                  return (
                    <div key={i} className="flex justify-between text-red-400">
                      <span>F{i + 1}:</span>
                      <span className="font-mono">
                        {Math.abs(load.F)} кН {sign} @ x={load.x}
                      </span>
                    </div>
                  );
                } else {
                  const sign = load.M >= 0 ? "↺" : "↻";
                  return (
                    <div key={i} className="flex justify-between text-purple-400">
                      <span>M{i + 1}:</span>
                      <span className="font-mono">
                        {Math.abs(load.M)} кН·м {sign} @ x={load.x}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}
      </div>

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
