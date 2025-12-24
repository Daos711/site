"use client";

import type { BeamInput, BeamResult } from "@/lib/beam";
import { Latex } from "@/components/Latex";

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

// Единицы измерения в LaTeX
const UNIT_KN = "\\,\\text{кН}";
const UNIT_KNM = "\\,\\text{кН}{\\cdot}\\text{м}";
const UNIT_M = "\\,\\text{м}";
const UNIT_MM = "\\,\\text{мм}";

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
    // Для ΣFy — собираем с координатами для сортировки
    type FyTerm = { value: number; x: number };
    const fyTerms: FyTerm[] = [];
    let sumFy = 0;

    // Реакции (положительные - вверх)
    if (reactions.RA !== undefined) {
      sumFy += reactions.RA;
      fyTerms.push({ value: reactions.RA, x: reactions.xA ?? 0 });
    }
    if (reactions.RB !== undefined) {
      sumFy += reactions.RB;
      fyTerms.push({ value: reactions.RB, x: reactions.xB ?? input.L });
    }
    if (reactions.Rf !== undefined) {
      sumFy += reactions.Rf;
      fyTerms.push({ value: reactions.Rf, x: reactions.xf ?? 0 });
    }

    // Нагрузки (отрицательные - вниз)
    for (const load of input.loads) {
      if (load.type === "force") {
        sumFy -= load.F;
        fyTerms.push({ value: -load.F, x: load.x });
      } else if (load.type === "distributed") {
        const qTotal = load.q * (load.b - load.a);
        sumFy -= qTotal;
        fyTerms.push({ value: -qTotal, x: (load.a + load.b) / 2 });
      }
    }

    // Для ΣM — собираем с координатами
    type MTerm = { value: number; x: number };
    const mTerms: MTerm[] = [];
    let sumM = 0;

    if (reactions.RA !== undefined) {
      const xA = reactions.xA ?? 0;
      const term = reactions.RA * xA;
      sumM += term;
      if (Math.abs(xA) > 0.001) {
        mTerms.push({ value: term, x: xA });
      }
    }
    if (reactions.RB !== undefined) {
      const xB = reactions.xB ?? input.L;
      const term = reactions.RB * xB;
      sumM += term;
      mTerms.push({ value: term, x: xB });
    }
    if (reactions.Rf !== undefined) {
      const xf = reactions.xf ?? 0;
      const term = reactions.Rf * xf;
      sumM += term;
      if (Math.abs(xf) > 0.001) {
        mTerms.push({ value: term, x: xf });
      }
    }
    if (reactions.Mf !== undefined) {
      sumM += reactions.Mf;
      // Момент заделки — в точке заделки
      const xf = reactions.xf ?? 0;
      mTerms.push({ value: reactions.Mf, x: xf });
    }

    for (const load of input.loads) {
      if (load.type === "force") {
        const term = -load.F * load.x;
        sumM += term;
        mTerms.push({ value: term, x: load.x });
      } else if (load.type === "moment") {
        sumM += load.M;
        mTerms.push({ value: load.M, x: load.x });
      } else if (load.type === "distributed") {
        const length = load.b - load.a;
        const centerX = (load.a + load.b) / 2;
        const term = -load.q * length * centerX;
        sumM += term;
        mTerms.push({ value: term, x: centerX });
      }
    }

    // Сортируем по x (слева направо)
    fyTerms.sort((a, b) => a.x - b.x);
    mTerms.sort((a, b) => a.x - b.x);

    // Формируем строку формулы для LaTeX
    const buildFormula = (terms: { value: number }[]): string => {
      return terms.map((t, i) => {
        const absV = formatNum(Math.abs(t.value));
        if (i === 0) return t.value >= 0 ? absV : `-${absV}`;
        return t.value >= 0 ? ` + ${absV}` : ` - ${absV}`;
      }).join("");
    };

    return {
      sumFy,
      sumM,
      fyFormula: buildFormula(fyTerms),
      mFormula: buildFormula(mTerms),
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
            <div>
              <Latex tex={`R_A = ${formatNum(reactions.RA)}${UNIT_KN}`} />
            </div>
          )}
          {reactions.RB !== undefined && (
            <div>
              <Latex tex={`R_B = ${formatNum(reactions.RB)}${UNIT_KN}`} />
            </div>
          )}
          {reactions.Rf !== undefined && (
            <div>
              <Latex tex={`R = ${formatNum(reactions.Rf)}${UNIT_KN}`} />
            </div>
          )}
          {reactions.Mf !== undefined && (
            <div>
              <Latex tex={`M = ${formatNum(reactions.Mf)}${UNIT_KNM}`} />
            </div>
          )}
        </div>
      </div>

      {/* Экстремумы */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3 text-base text-foreground">Экстремальные значения</h3>
        <div className="space-y-2">
          <div>
            <Latex tex={`|Q|_{\\max} = ${formatNum(Math.abs(Qmax.value))}${UNIT_KN} \\quad (x = ${formatNum(Qmax.x)}${UNIT_M})`} />
          </div>
          <div>
            <Latex tex={`|M|_{\\max} = ${formatNum(Math.abs(Mmax.value))}${UNIT_KNM} \\quad (x = ${formatNum(Mmax.x)}${UNIT_M})`} />
          </div>
          {wMax && (
            <div>
              <Latex tex={`|y|_{\\max} = ${formatNum(Math.abs(wMax.value * 1000))}${UNIT_MM} \\quad (x = ${formatNum(wMax.x)}${UNIT_M})`} />
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
            <Latex tex={`\\Sigma F_y = ${equilibrium.fyFormula} = ${Math.abs(equilibrium.sumFy) < 0.01 ? '\\color{green}{0}' : `\\color{red}{${formatEquilibrium(equilibrium.sumFy)}}`}${UNIT_KN}`} />
          </div>
          <div>
            <Latex tex={`\\Sigma M_0 = ${equilibrium.mFormula} = ${Math.abs(equilibrium.sumM) < 0.01 ? '\\color{green}{0}' : `\\color{red}{${formatEquilibrium(equilibrium.sumM)}}`}${UNIT_KNM}`} />
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
