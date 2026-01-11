import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { LineChart, Activity } from "lucide-react";

const tools = [
  {
    id: "beam",
    title: "Расчёт балки",
    description: "Реакции опор, эпюры M и Q, прогиб методом начальных параметров (МНП).",
    icon: LineChart,
    href: "/tools/beam-calculator",
    status: "prototype" as const,
  },
  {
    id: "oscillator",
    title: "Осциллятор",
    description: "Интерактивная симуляция затухающих колебаний с фазовым портретом.",
    icon: Activity,
    href: "/tools/oscillator",
    status: "prototype" as const,
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
            href={tool.href}
            status={tool.status}
          />
        ))}
      </div>
    </div>
  );
}
