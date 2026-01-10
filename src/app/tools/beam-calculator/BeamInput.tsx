"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import type {
  BeamInput as BeamInputType,
  BeamType,
  Load,
  BeamSupport,
  SectionType,
} from "@/lib/beam";

// Компонент числового ввода с валидацией min/max
function NumInput({
  value,
  onChange,
  className,
  min,
  max,
  ...props
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  min?: number;
  max?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'min' | 'max'>) {
  const [local, setLocal] = useState(String(value));

  // Синхронизация при изменении извне
  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  // Ограничение значения в пределах min/max
  const clamp = (n: number): number => {
    if (min !== undefined && n < min) return min;
    if (max !== undefined && n > max) return max;
    return n;
  };

  return (
    <input
      type="number"
      value={local}
      min={min}
      max={max}
      onChange={(e) => {
        setLocal(e.target.value);
        const num = e.target.valueAsNumber;
        if (!isNaN(num)) {
          onChange(clamp(num));
        }
      }}
      onBlur={() => {
        // При потере фокуса - валидация
        if (local === '' || local === '-') {
          const defaultVal = min !== undefined && min > 0 ? min : 0;
          setLocal(String(defaultVal));
          onChange(defaultVal);
        } else {
          const num = parseFloat(local);
          if (!isNaN(num)) {
            const clamped = clamp(num);
            setLocal(String(clamped));
            onChange(clamped);
          }
        }
      }}
      className={className}
      {...props}
    />
  );
}

interface Props {
  onCalculate: (input: BeamInputType) => void;
  showButton?: boolean;
  submitRef?: React.MutableRefObject<(() => void) | null>;
}

const beamTypes: { value: BeamType; label: string; description: string }[] = [
  {
    value: "simply-supported",
    label: "Двухопорная",
    description: "Шарнирные опоры на концах (A в x=0, B в x=L)",
  },
  {
    value: "simply-supported-overhang-left",
    label: "С консолью слева",
    description: "Опора A внутри балки, консоль слева",
  },
  {
    value: "simply-supported-overhang-right",
    label: "С консолью справа",
    description: "Опора B внутри балки, консоль справа",
  },
  {
    value: "simply-supported-overhang-both",
    label: "Двухконсольная",
    description: "Обе опоры внутри балки",
  },
  {
    value: "cantilever-left",
    label: "Заделка слева",
    description: "Жёсткая заделка в x = 0",
  },
  {
    value: "cantilever-right",
    label: "Заделка справа",
    description: "Жёсткая заделка в x = L",
  },
];

const sectionTypes: { value: SectionType; label: string; description: string }[] = [
  {
    value: "round",
    label: "Круглое сплошное",
    description: "Подбор диаметра по условию прочности",
  },
  {
    value: "i-beam",
    label: "Двутавр",
    description: "Подбор номера по ГОСТ 8239-89",
  },
  {
    value: "channel-u",
    label: "Швеллер У",
    description: "С уклоном полок, ГОСТ 8240-97",
  },
  {
    value: "channel-p",
    label: "Швеллер П",
    description: "С параллельными полками, ГОСТ 8240-97",
  },
];

export function BeamInput({ onCalculate, showButton = true, submitRef }: Props) {
  const [beamType, setBeamType] = useState<BeamType>("simply-supported");
  const [sectionType, setSectionType] = useState<SectionType>("i-beam");
  const [L, setL] = useState<number>(10);
  const [loads, setLoads] = useState<Load[]>([]);
  const [E, setE] = useState<number>(200e9); // Па
  const [sigma, setSigma] = useState<number>(160e6);  // Па (допускаемое напряжение)

  // Позиции опор для балок с консолями
  const [xA, setXA] = useState<number>(2);   // позиция опоры A
  const [xB, setXB] = useState<number>(8);   // позиция опоры B

  // При изменении L — ограничиваем позиции нагрузок и опор
  useEffect(() => {
    // Ограничиваем опоры
    if (xA > L - 0.1) setXA(Math.max(0.1, L - 0.1));
    if (xB > L - 0.1) setXB(Math.max(0.1, L - 0.1));

    // Ограничиваем нагрузки
    const clampedLoads = loads.map(load => {
      if (load.type === "distributed") {
        return {
          ...load,
          a: Math.min(load.a, L),
          b: Math.min(load.b, L),
        };
      } else if (load.type === "force" || load.type === "moment") {
        return {
          ...load,
          x: Math.min(load.x, L),
        };
      }
      return load;
    });

    // Обновляем только если что-то изменилось
    const hasChanges = clampedLoads.some((load, i) => {
      const orig = loads[i];
      if (load.type === "distributed" && orig.type === "distributed") {
        return load.a !== orig.a || load.b !== orig.b;
      }
      if ((load.type === "force" || load.type === "moment") &&
          (orig.type === "force" || orig.type === "moment")) {
        return load.x !== orig.x;
      }
      return false;
    });

    if (hasChanges) {
      setLoads(clampedLoads);
    }
  }, [L]); // eslint-disable-line react-hooks/exhaustive-deps

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

    switch (beamType) {
      case "simply-supported":
        // Опоры на концах
        supports = [
          { type: "pin", x: 0 },
          { type: "roller", x: L },
        ];
        break;
      case "simply-supported-overhang-left":
        // Опора A внутри (консоль слева), опора B на правом конце
        supports = [
          { type: "pin", x: xA },
          { type: "roller", x: L },
        ];
        break;
      case "simply-supported-overhang-right":
        // Опора A на левом конце, опора B внутри (консоль справа)
        supports = [
          { type: "pin", x: 0 },
          { type: "roller", x: xB },
        ];
        break;
      case "simply-supported-overhang-both":
        // Обе опоры внутри балки
        supports = [
          { type: "pin", x: xA },
          { type: "roller", x: xB },
        ];
        break;
      case "cantilever-left":
        supports = [{ type: "fixed", x: 0 }];
        break;
      case "cantilever-right":
        supports = [{ type: "fixed", x: L }];
        break;
    }

    const input: BeamInputType = {
      L,
      beamType,
      supports,
      loads,
      E,
      sigma,
      sectionType,
    };

    onCalculate(input);
  };

  // Expose handleSubmit to parent via ref
  useEffect(() => {
    if (submitRef) {
      submitRef.current = handleSubmit;
    }
  }, [submitRef, handleSubmit]);

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

      {/* Тип сечения */}
      <div className="p-4 rounded-lg border border-border bg-card">
        <h3 className="font-semibold mb-3">Тип сечения</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {sectionTypes.map((st) => (
            <label
              key={st.value}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                sectionType === st.value
                  ? "bg-accent/10 border border-accent"
                  : "bg-card-hover border border-transparent hover:border-border"
              }`}
            >
              <input
                type="radio"
                name="sectionType"
                value={st.value}
                checked={sectionType === st.value}
                onChange={(e) => setSectionType(e.target.value as SectionType)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{st.label}</div>
                <div className="text-sm text-muted">{st.description}</div>
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
            <label className="block text-sm text-muted mb-1">[σ], МПа</label>
            <NumInput
              value={sigma / 1e6}
              onChange={(n) => setSigma(n * 1e6)}
              min={1}
              step={10}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>

        {/* Позиции опор для балок с консолями */}
        {(beamType === "simply-supported-overhang-left" ||
          beamType === "simply-supported-overhang-right" ||
          beamType === "simply-supported-overhang-both") && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Позиции опор</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {(beamType === "simply-supported-overhang-left" ||
                beamType === "simply-supported-overhang-both") && (
                <div>
                  <label className="block text-sm text-muted mb-1">
                    Опора A (x<sub>A</sub>), м
                  </label>
                  <NumInput
                    value={xA}
                    onChange={setXA}
                    min={0.1}
                    max={L - 0.1}
                    step={0.1}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                  <p className="text-xs text-muted mt-1">Консоль слева: 0 → x<sub>A</sub></p>
                </div>
              )}
              {(beamType === "simply-supported-overhang-right" ||
                beamType === "simply-supported-overhang-both") && (
                <div>
                  <label className="block text-sm text-muted mb-1">
                    Опора B (x<sub>B</sub>), м
                  </label>
                  <NumInput
                    value={xB}
                    onChange={setXB}
                    min={0.1}
                    max={L - 0.1}
                    step={0.1}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                  <p className="text-xs text-muted mt-1">Консоль справа: x<sub>B</sub> → L</p>
                </div>
              )}
            </div>
          </div>
        )}
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
      {showButton && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg border border-accent bg-accent text-white font-semibold hover:bg-accent/90 transition-colors"
        >
          Рассчитать
        </button>
      )}
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
        <span className="text-muted text-sm whitespace-nowrap">кН/м</span>
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
