"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BeamInput } from "./BeamInput";
import { ResultCards } from "./ResultCards";
import { UnifiedBeamView } from "./UnifiedBeamView";
import { BeamSchemaExport } from "./BeamSchemaExport";
import { DiagramsExport } from "./DiagramsExport";
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
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr] mb-8 items-stretch">
        {/* Левая колонка: Форма ввода */}
        <BeamInput onCalculate={handleCalculate} />

        {/* Правая колонка: Результаты */}
        <div className="flex flex-col">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
              {error}
            </div>
          )}
          {result && input ? (
            <ResultCards input={input} result={result} />
          ) : (
            <div className="flex-1 p-6 rounded-lg border border-border bg-card/50 text-muted text-center flex items-center justify-center">
              <p>Введите параметры и нажмите «Рассчитать»</p>
            </div>
          )}
        </div>
      </div>

      {/* Эпюры на всю ширину */}
      {result && input && <UnifiedBeamView input={input} result={result} />}

      {/* Скрытые SVG для экспорта в отчёт */}
      {result && input && <BeamSchemaExport input={input} result={result} />}
      {result && input && <DiagramsExport input={input} result={result} />}
    </div>
  );
}
