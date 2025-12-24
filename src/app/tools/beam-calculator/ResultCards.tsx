"use client";

import type { BeamInput, BeamResult } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
  className?: string;
}

const BEAM_TYPE_NAMES: Record<string, string> = {
  "simply-supported": "Двухопорная",
  "simply-supported-overhang-left": "Двухконсольная (левая)",
  "simply-supported-overhang-right": "Двухконсольная (правая)",
  "simply-supported-overhang-both": "Двухконсольная",
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

  // Проверка равновесия
  const equilibrium = (() => {
    // Сумма вертикальных сил
    let sumFy = 0;

    // Реакции (положительные = вверх)
    if (reactions.RA !== undefined) sumFy += reactions.RA;
    if (reactions.RB !== undefined) sumFy += reactions.RB;
    if (reactions.Rf !== undefined) sumFy += reactions.Rf;

    // Нагрузки (положительные = вниз, значит минус)
    for (const load of input.loads) {
      if (load.type === "force") {
        sumFy -= load.F;
      } else if (load.type === "distributed") {
        sumFy -= load.q * (load.b - load.a);
      }
    }

    // Сумма моментов относительно начала (x=0)
    let sumM = 0;

    // Реакции создают моменты
    if (reactions.RA !== undefined) {
      const xA = reactions.xA ?? 0;
      sumM += reactions.RA * xA;
    }
    if (reactions.RB !== undefined) {
      const xB = reactions.xB ?? input.L;
      sumM += reactions.RB * xB;
    }
    if (reactions.Rf !== undefined) {
      const xf = reactions.xf ?? 0;
      sumM += reactions.Rf * xf;
    }
    if (reactions.Mf !== undefined) {
      sumM += reactions.Mf;
    }

    // Нагрузки создают моменты (против часовой = положительный)
    for (const load of input.loads) {
      if (load.type === "force") {
        sumM -= load.F * load.x;
      } else if (load.type === "moment") {
        sumM -= load.M;
      } else if (load.type === "distributed") {
        // Распределённая нагрузка: момент = q * длина * плечо до центра
        const length = load.b - load.a;
        const centerX = (load.a + load.b) / 2;
        sumM -= load.q * length * centerX;
      }
    }

    return { sumFy, sumM };
  })();

  const isBalanced = Math.abs(equilibrium.sumFy) < 0.01 && Math.abs(equilibrium.sumM) < 0.01;

  return (
    <div className={`flex flex-col gap-4 ${className || ""}`}>
      {/* Реакции */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3 text-base text-foreground">Реакции опор</h3>
        <div className="space-y-2">
          {reactions.RA !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">R_A:</span>
              <span className="font-mono text-base tabular-nums">
                {reactions.RA.toFixed(2)} кН
                <span className="text-muted-foreground ml-2">
                  ({reactions.RA >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.RB !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">R_B:</span>
              <span className="font-mono text-base tabular-nums">
                {reactions.RB.toFixed(2)} кН
                <span className="text-muted-foreground ml-2">
                  ({reactions.RB >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.Rf !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">R:</span>
              <span className="font-mono text-base tabular-nums">
                {reactions.Rf.toFixed(2)} кН
                <span className="text-muted-foreground ml-2">
                  ({reactions.Rf >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.Mf !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">M:</span>
              <span className="font-mono text-base tabular-nums">
                {reactions.Mf.toFixed(2)} кН·м
                <span className="text-muted-foreground ml-2">
                  ({reactions.Mf >= 0 ? "↺" : "↻"})
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Экстремумы */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3 text-base text-foreground">Экстремальные значения</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">|Q|_max:</span>
            <span className="font-mono text-base tabular-nums">
              {Math.abs(Qmax.value).toFixed(2)} кН
              <span className="text-muted-foreground ml-2">
                (x = {Qmax.x.toFixed(2)} м)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">|M|_max:</span>
            <span className="font-mono text-base tabular-nums">
              {Math.abs(Mmax.value).toFixed(2)} кН·м
              <span className="text-muted-foreground ml-2">
                (x = {Mmax.x.toFixed(2)} м)
              </span>
            </span>
          </div>
          {wMax && (
            <div className="flex justify-between items-baseline">
              <span className="text-muted-foreground">|y|_max:</span>
              <span className="font-mono text-base tabular-nums">
                {Math.abs(wMax.value * 1000).toFixed(2)} мм
                <span className="text-muted-foreground ml-2">
                  (x = {wMax.x.toFixed(2)} м)
                </span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Проверка равновесия */}
      <div className={`p-4 rounded-lg border ${isBalanced ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <h3 className="font-semibold mb-3 text-base text-foreground flex items-center gap-2">
          Проверка равновесия
          {isBalanced ? (
            <span className="text-green-500 text-sm">✓</span>
          ) : (
            <span className="text-red-500 text-sm">✗</span>
          )}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">ΣF_y =</span>
            <span className={`font-mono text-base tabular-nums ${Math.abs(equilibrium.sumFy) < 0.01 ? 'text-green-500' : 'text-red-400'}`}>
              {equilibrium.sumFy.toFixed(4)} кН
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-muted-foreground">ΣM₀ =</span>
            <span className={`font-mono text-base tabular-nums ${Math.abs(equilibrium.sumM) < 0.01 ? 'text-green-500' : 'text-red-400'}`}>
              {equilibrium.sumM.toFixed(4)} кН·м
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
