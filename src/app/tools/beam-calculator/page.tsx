"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { BeamInput } from "./BeamInput";
import { BeamResults } from "./BeamResults";
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
    <div>
      <PageHeader
        title="Расчёт балки"
        description="Эпюры Q, M, прогибы методом начальных параметров"
      />

      {/* Форма ввода */}
      <div className="max-w-2xl mb-8">
        <BeamInput onCalculate={handleCalculate} />
      </div>

      {/* Ошибки */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Результаты на всю ширину */}
      {result && input && <BeamResults input={input} result={result} />}
    </div>
  );
}
