import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { LineChart, Activity, Calculator } from "lucide-react";

const tools = [
  {
    id: "beam-builder",
    title: "Построитель эпюр",
    description: "Интерактивный инструмент для построения эпюр моментов и поперечных сил.",
    icon: LineChart,
    status: "coming-soon" as const,
  },
  {
    id: "oscillator",
    title: "Осциллятор",
    description: "Демонстрация затухающих колебаний: масса, жёсткость, демпфирование.",
    icon: Activity,
    status: "coming-soon" as const,
  },
  {
    id: "unit-converter",
    title: "Конвертер единиц",
    description: "Перевод между системами единиц для инженерных расчётов.",
    icon: Calculator,
    status: "coming-soon" as const,
  },
];

export default function ToolsPage() {
  return (
    <div>
      <PageHeader
        title="Инструменты"
        description="Интерактивные калькуляторы и визуализации"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            title={tool.title}
            description={tool.description}
            icon={tool.icon}
            status={tool.status}
          />
        ))}
      </div>
    </div>
  );
}
