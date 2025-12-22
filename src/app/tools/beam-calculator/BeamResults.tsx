"use client";

import { useMemo } from "react";
import type { BeamInput, BeamResult } from "@/lib/beam";
import { generateDiagramData } from "@/lib/beam";
import { BeamDiagram } from "./BeamDiagram";

interface Props {
  input: BeamInput;
  result: BeamResult;
}

export function BeamResults({ input, result }: Props) {
  const { L } = input;
  const { reactions, Q, M, theta, y, Mmax, Qmax, events } = result;

  // Генерируем данные для графиков
  const qData = useMemo(
    () => generateDiagramData(Q, L, events, 500),
    [Q, L, events]
  );
  const mData = useMemo(
    () => generateDiagramData(M, L, events, 500),
    [M, L, events]
  );
  const yData = useMemo(
    () => (y ? generateDiagramData(y, L, events, 500) : null),
    [y, L, events]
  );

  return (
    <div className="space-y-6">
      {/* Реакции */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3">Реакции опор</h3>
        <div className="grid gap-4 sm:grid-cols-2">
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
        <h3 className="font-semibold mb-3">Экстремальные значения</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted">|Q|_max:</span>
            <span className="font-mono">
              {Math.abs(Qmax.value).toFixed(2)} кН
              <span className="text-muted ml-1">при x = {Qmax.x.toFixed(2)} м</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">|M|_max:</span>
            <span className="font-mono">
              {Math.abs(Mmax.value).toFixed(2)} кН·м
              <span className="text-muted ml-1">при x = {Mmax.x.toFixed(2)} м</span>
            </span>
          </div>
        </div>
      </div>

      {/* Эпюры */}
      <div className="space-y-4">
        <BeamDiagram
          title="Эпюра Q"
          data={qData}
          L={L}
          events={events}
          unit="кН"
          color="rgb(239, 68, 68)"
          fillColor="rgba(239, 68, 68, 0.2)"
        />

        <BeamDiagram
          title="Эпюра M"
          data={mData}
          L={L}
          events={events}
          unit="кН·м"
          color="rgb(34, 197, 94)"
          fillColor="rgba(34, 197, 94, 0.2)"
        />

        {yData && (
          <BeamDiagram
            title="Прогиб y"
            data={yData}
            L={L}
            events={events}
            unit="м"
            color="rgb(59, 130, 246)"
            fillColor="rgba(59, 130, 246, 0.2)"
            scale={1000}
            scaleUnit="мм"
          />
        )}
      </div>
    </div>
  );
}
