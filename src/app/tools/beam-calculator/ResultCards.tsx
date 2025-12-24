"use client";

import type { BeamInput, BeamResult } from "@/lib/beam";

interface Props {
  input: BeamInput;
  result: BeamResult;
  className?: string;
}

// Форматирование числа: убираем лишние нули
function formatNum(value: number, decimals: number = 2): string {
  const fixed = value.toFixed(decimals);
  return parseFloat(fixed).toString();
}

// Форматирование для проверки равновесия
function formatEquilibrium(value: number): string {
  if (Math.abs(value) < 0.0001) return "0";
  return value.toFixed(4).replace(/\.?0+$/, "");
}

// Математические обозначения с Unicode
const math = {
  RA: "Rₐ",
  RB: "Rᵦ",
  R: "R",
  Mzad: "M",
  Qmax: "|Q|ₘₐₓ",
  Mmax: "|M|ₘₐₓ",
  ymax: "|y|ₘₐₓ",
  sumFy: "ΣFᵧ",
  sumM0: "ΣM₀",
  x: "x",
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
    let sumFy = 0;

    if (reactions.RA !== undefined) sumFy += reactions.RA;
    if (reactions.RB !== undefined) sumFy += reactions.RB;
    if (reactions.Rf !== undefined) sumFy += reactions.Rf;

    for (const load of input.loads) {
      if (load.type === "force") {
        sumFy -= load.F;
      } else if (load.type === "distributed") {
        sumFy -= load.q * (load.b - load.a);
      }
    }

    let sumM = 0;

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

    for (const load of input.loads) {
      if (load.type === "force") {
        sumM -= load.F * load.x;
      } else if (load.type === "moment") {
        sumM += load.M;
      } else if (load.type === "distributed") {
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
              <span className="text-base">{math.RA}</span>
              <span className="font-mono text-base tabular-nums">
                {formatNum(reactions.RA)} кН
                <span className="text-muted-foreground ml-2">
                  ({reactions.RA >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.RB !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-base">{math.RB}</span>
              <span className="font-mono text-base tabular-nums">
                {formatNum(reactions.RB)} кН
                <span className="text-muted-foreground ml-2">
                  ({reactions.RB >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.Rf !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-base">{math.R}</span>
              <span className="font-mono text-base tabular-nums">
                {formatNum(reactions.Rf)} кН
                <span className="text-muted-foreground ml-2">
                  ({reactions.Rf >= 0 ? "↑" : "↓"})
                </span>
              </span>
            </div>
          )}
          {reactions.Mf !== undefined && (
            <div className="flex justify-between items-baseline">
              <span className="text-base">{math.Mzad}</span>
              <span className="font-mono text-base tabular-nums">
                {formatNum(reactions.Mf)} кН·м
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
            <span className="text-base">{math.Qmax}</span>
            <span className="font-mono text-base tabular-nums">
              {formatNum(Math.abs(Qmax.value))} кН
              <span className="text-muted-foreground ml-2">
                ({math.x} = {formatNum(Qmax.x)} м)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-base">{math.Mmax}</span>
            <span className="font-mono text-base tabular-nums">
              {formatNum(Math.abs(Mmax.value))} кН·м
              <span className="text-muted-foreground ml-2">
                ({math.x} = {formatNum(Mmax.x)} м)
              </span>
            </span>
          </div>
          {wMax && (
            <div className="flex justify-between items-baseline">
              <span className="text-base">{math.ymax}</span>
              <span className="font-mono text-base tabular-nums">
                {formatNum(Math.abs(wMax.value * 1000))} мм
                <span className="text-muted-foreground ml-2">
                  ({math.x} = {formatNum(wMax.x)} м)
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
            <span className="text-base">{math.sumFy}</span>
            <span className={`font-mono text-base tabular-nums ${Math.abs(equilibrium.sumFy) < 0.01 ? 'text-green-500' : 'text-red-400'}`}>
              {formatEquilibrium(equilibrium.sumFy)} кН
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-base">{math.sumM0}</span>
            <span className={`font-mono text-base tabular-nums ${Math.abs(equilibrium.sumM) < 0.01 ? 'text-green-500' : 'text-red-400'}`}>
              {formatEquilibrium(equilibrium.sumM)} кН·м
            </span>
          </div>
        </div>
      </div>

      {/* Кнопка отчёта */}
      <button
        className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-center"
        onClick={() => window.print()}
      >
        <span className="text-muted-foreground">📄</span>
        <span className="ml-2">Печать / Сохранить PDF</span>
      </button>
    </div>
  );
}
