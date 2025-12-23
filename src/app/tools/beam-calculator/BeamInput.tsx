"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  BeamInput as BeamInputType,
  BeamType,
  Load,
  BeamSupport,
} from "@/lib/beam";

// Компонент числового ввода с возможностью стереть значение
function NumInput({
  value,
  onChange,
  className,
  ...props
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const [local, setLocal] = useState(String(value));

  // Синхронизация при изменении извне
  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  return (
    <input
      type="number"
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        const num = e.target.valueAsNumber;
        if (!isNaN(num)) {
          onChange(num);
        }
      }}
      onBlur={() => {
        // При потере фокуса - если пусто, вернуть 0
        if (local === '' || local === '-') {
          setLocal('0');
          onChange(0);
        }
      }}
      className={className}
      {...props}
    />
  );
}

interface Props {
  onCalculate: (input: BeamInputType) => void;
}

const beamTypes: { value: BeamType; label: string; description: string }[] = [
  {
    value: "simply-supported",
    label: "Двухопорная",
    description: "Шарнирные опоры на концах",
  },
  {
    value: "cantilever-left",
    label: "Консоль (заделка слева)",
    description: "Заделка в x = 0",
  },
  {
    value: "cantilever-right",
    label: "Консоль (заделка справа)",
    description: "Заделка в x = L",
  },
];

export function BeamInput({ onCalculate }: Props) {
  const [beamType, setBeamType] = useState<BeamType>("simply-supported");
  const [L, setL] = useState<number>(10);
  const [loads, setLoads] = useState<Load[]>([]);
  const [E, setE] = useState<number>(200e9); // Па
  const [I, setI] = useState<number>(1e-4);  // м^4

  const addDistributedLoad = () => {
    setLoads([
      ...loads,
      { type: "distributed", q: 10, a: 0, b: L / 2 },
    ]);
  };

  const addPointForce = () => {
    setLoads([...loads, { type: "force", F: 20, x: L / 2 }]);
  };

  const addMoment = () => {
    setLoads([...loads, { type: "moment", M: 10, x: L / 2 }]);
  };

  const updateLoad = (index: number, updates: Partial<Load>) => {
    const newLoads = [...loads];
    newLoads[index] = { ...newLoads[index], ...updates } as Load;
    setLoads(newLoads);
  };

  const removeLoad = (index: number) => {
    setLoads(loads.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    // Создаём опоры в зависимости от типа балки
    let supports: BeamSupport[] = [];

    if (beamType === "simply-supported") {
      supports = [
        { type: "pin", x: 0 },
        { type: "roller", x: L },
      ];
    } else if (beamType === "cantilever-left") {
      supports = [{ type: "fixed", x: 0 }];
    } else {
      supports = [{ type: "fixed", x: L }];
    }

    const input: BeamInputType = {
      L,
      beamType,
      supports,
      loads,
      E,
      I,
    };

    onCalculate(input);
  };

  return (
    <div className="space-y-6">
      {/* Тип балки */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3">Тип балки</h3>
        <div className="space-y-2">
          {beamTypes.map((bt) => (
            <label
              key={bt.value}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                beamType === bt.value
                  ? "bg-accent/10 border border-accent"
                  : "bg-card-hover border border-transparent hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="beamType"
                value={bt.value}
                checked={beamType === bt.value}
                onChange={(e) => setBeamType(e.target.value as BeamType)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{bt.label}</div>
                <div className="text-sm text-muted">{bt.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Длина балки */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3">Параметры балки</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm text-muted mb-1">Длина L, м</label>
            <NumInput
              value={L}
              onChange={setL}
              min={0.1}
              step={0.1}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">E, ГПа</label>
            <NumInput
              value={E / 1e9}
              onChange={(n) => setE(n * 1e9)}
              min={1}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">I, см⁴</label>
            <NumInput
              value={I * 1e8}
              onChange={(n) => setI(n / 1e8)}
              min={0.01}
              step={0.01}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>
      </div>

      {/* Нагрузки */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Нагрузки</h3>
          <div className="flex gap-2">
            <button
              onClick={addDistributedLoad}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              <Plus size={16} /> q
            </button>
            <button
              onClick={addPointForce}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            >
              <Plus size={16} /> F
            </button>
            <button
              onClick={addMoment}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
            >
              <Plus size={16} /> M
            </button>
          </div>
        </div>

        <p className="text-sm text-muted mb-4">
          Знак: q, F + вниз (↓), M + против часовой (↺)
        </p>

        {loads.length === 0 ? (
          <p className="text-muted text-center py-4">Нагрузки не добавлены</p>
        ) : (
          <div className="space-y-3">
            {loads.map((load, index) => (
              <LoadInput
                key={index}
                load={load}
                maxX={L}
                onChange={(updates) => updateLoad(index, updates)}
                onRemove={() => removeLoad(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Кнопка расчёта */}
      <button
        onClick={handleSubmit}
        className="w-full py-3 rounded-lg bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
      >
        Рассчитать
      </button>
    </div>
  );
}

interface LoadInputProps {
  load: Load;
  maxX: number;
  onChange: (updates: Partial<Load>) => void;
  onRemove: () => void;
}

function LoadInput({ load, maxX, onChange, onRemove }: LoadInputProps) {
  if (load.type === "distributed") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
        <span className="text-green-400 font-medium w-8">q</span>
        <NumInput
          value={load.q}
          onChange={(n) => onChange({ q: n })}
          className="w-20 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
        />
        <span className="text-muted text-sm">кН/м</span>
        <span className="text-muted text-sm ml-2">от</span>
        <NumInput
          value={load.a}
          onChange={(n) => onChange({ a: n })}
          min={0}
          max={maxX}
          step={0.1}
          className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
        />
        <span className="text-muted text-sm">до</span>
        <NumInput
          value={load.b}
          onChange={(n) => onChange({ b: n })}
          min={0}
          max={maxX}
          step={0.1}
          className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
        />
        <span className="text-muted text-sm">м</span>
        <button
          onClick={onRemove}
          className="ml-auto p-1 text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  if (load.type === "force") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
        <span className="text-blue-400 font-medium w-8">F</span>
        <NumInput
          value={load.F}
          onChange={(n) => onChange({ F: n })}
          className="w-20 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
        />
        <span className="text-muted text-sm">кН</span>
        <span className="text-muted text-sm ml-2">в x =</span>
        <NumInput
          value={load.x}
          onChange={(n) => onChange({ x: n })}
          min={0}
          max={maxX}
          step={0.1}
          className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
        />
        <span className="text-muted text-sm">м</span>
        <button
          onClick={onRemove}
          className="ml-auto p-1 text-muted hover:text-red-400 transition-colors"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
      <span className="text-purple-400 font-medium w-8">M</span>
      <NumInput
        value={load.M}
        onChange={(n) => onChange({ M: n })}
        className="w-20 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
      />
      <span className="text-muted text-sm">кН·м</span>
      <span className="text-muted text-sm ml-2">в x =</span>
      <NumInput
        value={load.x}
        onChange={(n) => onChange({ x: n })}
        min={0}
        max={maxX}
        step={0.1}
        className="w-16 px-2 py-1 rounded border border-border bg-background text-foreground text-sm"
      />
      <span className="text-muted text-sm">м</span>
      <button
        onClick={onRemove}
        className="ml-auto p-1 text-muted hover:text-red-400 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
