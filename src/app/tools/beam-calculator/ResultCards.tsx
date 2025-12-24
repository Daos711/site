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

// Компонент для отображения индексов через CSS
function Sub({ children, sub }: { children: React.ReactNode; sub: string }) {
  return (
    <span className="inline-flex items-baseline">
      <span>{children}</span>
      <sub className="text-[0.65em] ml-px">{sub}</sub>
    </span>
  );
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

  // Проверка равновесия с формулами
  const equilibrium = (() => {
    let sumFy = 0;
    const fyTerms: string[] = [];
    const fyValues: number[] = [];

    // Реакции (положительные - вверх)
    if (reactions.RA !== undefined) {
      sumFy += reactions.RA;
      fyTerms.push("R_A");
      fyValues.push(reactions.RA);
    }
    if (reactions.RB !== undefined) {
      sumFy += reactions.RB;
      fyTerms.push("R_B");
      fyValues.push(reactions.RB);
    }
    if (reactions.Rf !== undefined) {
      sumFy += reactions.Rf;
      fyTerms.push("R");
      fyValues.push(reactions.Rf);
    }

    // Нагрузки (отрицательные - вниз)
    for (const load of input.loads) {
      if (load.type === "force") {
        sumFy -= load.F;
        fyTerms.push("F");
        fyValues.push(-load.F);
      } else if (load.type === "distributed") {
        const qTotal = load.q * (load.b - load.a);
        sumFy -= qTotal;
        fyTerms.push("q·L");
        fyValues.push(-qTotal);
      }
    }

    let sumM = 0;
    const mTerms: string[] = [];
    const mValues: number[] = [];

    if (reactions.RA !== undefined) {
      const xA = reactions.xA ?? 0;
      const term = reactions.RA * xA;
      sumM += term;
      if (Math.abs(xA) > 0.001) {
        mTerms.push("R_A·x_A");
        mValues.push(term);
      }
    }
    if (reactions.RB !== undefined) {
      const xB = reactions.xB ?? input.L;
      const term = reactions.RB * xB;
      sumM += term;
      mTerms.push("R_B·x_B");
      mValues.push(term);
    }
    if (reactions.Rf !== undefined) {
      const xf = reactions.xf ?? 0;
      const term = reactions.Rf * xf;
      sumM += term;
      if (Math.abs(xf) > 0.001) {
        mTerms.push("R·x");
        mValues.push(term);
      }
    }
    if (reactions.Mf !== undefined) {
      sumM += reactions.Mf;
      mTerms.push("M_f");
      mValues.push(reactions.Mf);
    }

    for (const load of input.loads) {
      if (load.type === "force") {
        const term = -load.F * load.x;
        sumM += term;
        mTerms.push("F·x");
        mValues.push(term);
      } else if (load.type === "moment") {
        sumM += load.M;
        mTerms.push("M");
        mValues.push(load.M);
      } else if (load.type === "distributed") {
        const length = load.b - load.a;
        const centerX = (load.a + load.b) / 2;
        const term = -load.q * length * centerX;
        sumM += term;
        mTerms.push("q·L·x_c");
        mValues.push(term);
      }
    }

    // Формируем строку формулы
    const buildFormula = (values: number[]): string => {
      return values.map((v, i) => {
        const absV = formatNum(Math.abs(v));
        if (i === 0) return v >= 0 ? absV : `−${absV}`;
        return v >= 0 ? ` + ${absV}` : ` − ${absV}`;
      }).join("");
    };

    return {
      sumFy,
      sumM,
      fyFormula: buildFormula(fyValues),
      mFormula: buildFormula(mValues),
    };
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
              <Sub sub="A">R</Sub>
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
              <Sub sub="B">R</Sub>
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
              <span>R</span>
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
              <span>M</span>
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
            <Sub sub="max">|Q|</Sub>
            <span className="font-mono text-base tabular-nums">
              {formatNum(Math.abs(Qmax.value))} кН
              <span className="text-muted-foreground ml-2">
                (x = {formatNum(Qmax.x)} м)
              </span>
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <Sub sub="max">|M|</Sub>
            <span className="font-mono text-base tabular-nums">
              {formatNum(Math.abs(Mmax.value))} кН·м
              <span className="text-muted-foreground ml-2">
                (x = {formatNum(Mmax.x)} м)
              </span>
            </span>
          </div>
          {wMax && (
            <div className="flex justify-between items-baseline">
              <Sub sub="max">|y|</Sub>
              <span className="font-mono text-base tabular-nums">
                {formatNum(Math.abs(wMax.value * 1000))} мм
                <span className="text-muted-foreground ml-2">
                  (x = {formatNum(wMax.x)} м)
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
        <div className="space-y-3">
          <div>
            <div className="flex items-baseline gap-2">
              <Sub sub="y">ΣF</Sub>
              <span className="text-muted-foreground">=</span>
              <span className="font-mono text-sm">{equilibrium.fyFormula}</span>
              <span className="text-muted-foreground">=</span>
              <span className={`font-mono font-semibold ${Math.abs(equilibrium.sumFy) < 0.01 ? 'text-green-500' : 'text-red-400'}`}>
                {formatEquilibrium(equilibrium.sumFy)} кН
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <Sub sub="0">ΣM</Sub>
              <span className="text-muted-foreground">=</span>
              <span className="font-mono text-sm">{equilibrium.mFormula}</span>
              <span className="text-muted-foreground">=</span>
              <span className={`font-mono font-semibold ${Math.abs(equilibrium.sumM) < 0.01 ? 'text-green-500' : 'text-red-400'}`}>
                {formatEquilibrium(equilibrium.sumM)} кН·м
              </span>
            </div>
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
