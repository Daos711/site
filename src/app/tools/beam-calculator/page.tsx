"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BeamInput } from "./BeamInput";
import { ResultCards } from "./ResultCards";
import { UnifiedBeamView } from "./UnifiedBeamView";
import { BeamSchemaExport } from "./BeamSchemaExport";
import type { BeamInput as BeamInputType, BeamResult } from "@/lib/beam";
import { solveBeam } from "@/lib/beam";

export default function BeamCalculatorPage() {
  const [input, setInput] = useState<BeamInputType | null>(null);
  const [result, setResult] = useState<BeamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = (beamInput: BeamInputType) => {
    try {
      setError(null);
      const res = solveBeam(beamInput);
      setInput(beamInput);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка расчёта");
      setResult(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        title="Расчёт балки"
        description="Эпюры Q, M, прогибы методом начальных параметров"
      />

      {/* Верхний блок: 2 колонки на десктопе */}
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr] mb-8 items-start">
        {/* Левая колонка: Форма ввода */}
        <div>
          <BeamInput onCalculate={handleCalculate} />
        </div>

        {/* Правая колонка: Результаты (sticky при прокрутке) */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
              {error}
            </div>
          )}
          {result && input ? (
            <ResultCards input={input} result={result} />
          ) : (
            <div className="p-6 rounded-lg border border-border bg-card/50 text-muted text-center">
              <p>Введите параметры и нажмите «Рассчитать»</p>
            </div>
          )}
        </div>
      </div>

      {/* Эпюры на всю ширину */}
      {result && input && <UnifiedBeamView input={input} result={result} />}

      {/* Скрытый SVG для экспорта в отчёт */}
      {result && input && <BeamSchemaExport input={input} result={result} />}
    </div>
  );
}
