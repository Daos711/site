import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { LineChart, Activity, Orbit, Snowflake, GitBranch, AudioWaveform, Grid3X3 } from "lucide-react";

const tools = [
  // === Готовые ===
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

  // === Coming Soon ===
  {
    id: "lorenz",
    title: "Аттрактор Лоренца",
    description: "3D-визуализация хаотической системы. Знаменитая «бабочка».",
    icon: Orbit,
    status: "coming-soon" as const,
  },
  {
    id: "mandelbrot",
    title: "Множество Мандельброта",
    description: "Интерактивный фрактал с бесконечным зумом.",
    icon: Snowflake,
    status: "coming-soon" as const,
  },
  {
    id: "double-pendulum",
    title: "Двойной маятник",
    description: "Хаос из простой механической системы.",
    icon: GitBranch,
    status: "coming-soon" as const,
  },
  {
    id: "fourier",
    title: "Ряды Фурье",
    description: "Как из синусов собираются любые формы волн.",
    icon: AudioWaveform,
    status: "coming-soon" as const,
  },
  {
    id: "game-of-life",
    title: "Game of Life",
    description: "Клеточный автомат Конвея. Эмерджентность из простых правил.",
    icon: Grid3X3,
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
            href={tool.href}
            status={tool.status}
          />
        ))}
      </div>
    </div>
  );
}
