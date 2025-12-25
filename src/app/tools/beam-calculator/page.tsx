"use client";

import { useState, useRef } from "react";
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

  const submitRef = useRef<(() => void) | null>(null);
  const reportRef = useRef<(() => void) | null>(null);

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
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr] mb-6">
        {/* Левая колонка: Форма ввода */}
        <BeamInput onCalculate={handleCalculate} showButton={false} submitRef={submitRef} />

        {/* Правая колонка: Результаты */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
              {error}
            </div>
          )}
          {result && input ? (
            <ResultCards input={input} result={result} showButton={false} onReportRef={reportRef} />
          ) : (
            <div className="p-6 rounded-lg border border-border bg-card/50 text-muted text-center">
              <p>Введите параметры и нажмите «Рассчитать»</p>
            </div>
          )}
        </div>
      </div>

      {/* Кнопки в отдельном ряду для выравнивания */}
      <div className="grid gap-6 lg:grid-cols-[5fr_7fr] mb-8">
        <button
          onClick={() => submitRef.current?.()}
          className="w-full py-3 rounded-lg border border-accent bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
        >
          Рассчитать
        </button>
        <button
          onClick={() => reportRef.current?.()}
          disabled={!result}
          className="w-full py-3 rounded-lg border border-border bg-card hover:bg-card/80 transition-colors font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-muted-foreground">📄</span>
          <span className="ml-2">Открыть отчёт</span>
        </button>
      </div>

      {/* Эпюры на всю ширину */}
      {result && input && <UnifiedBeamView input={input} result={result} />}

      {/* Скрытые SVG для экспорта в отчёт */}
      {result && input && <BeamSchemaExport input={input} result={result} />}
      {result && input && <DiagramsExport input={input} result={result} />}
    </div>
  );
}
