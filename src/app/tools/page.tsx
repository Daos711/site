import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { LineChart, Activity, Orbit, Snowflake, GitBranch, AudioWaveform, Grid3X3, BarChart3, Route, Sparkles } from "lucide-react";

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

  {
    id: "lorenz",
    title: "Аттрактор Лоренца",
    description: "3D-визуализация хаотической системы. Знаменитая «бабочка».",
    icon: Orbit,
    href: "/tools/lorenz",
    status: "prototype" as const,
  },

  // === Визуализации ===
  {
    id: "fractals",
    title: "Фракталы",
    description: "Мандельброт, Жюлиа, Burning Ship и другие. Бесконечный зум.",
    icon: Snowflake,
    href: "/tools/fractals",
    status: "prototype" as const,
  },
  {
    id: "double-pendulum",
    title: "Двойной маятник",
    description: "Хаос из простой механической системы.",
    icon: GitBranch,
    href: "/tools/double-pendulum",
    status: "prototype" as const,
  },
  {
    id: "fourier",
    title: "Ряды Фурье",
    description: "Как из синусов собираются любые формы волн.",
    icon: AudioWaveform,
    href: "/tools/fourier",
    status: "prototype" as const,
  },
  {
    id: "game-of-life",
    title: "Game of Life",
    description: "Клеточный автомат Конвея. Эмерджентность из простых правил.",
    icon: Grid3X3,
    href: "/tools/game-of-life",
    status: "prototype" as const,
  },
  {
    id: "sorting",
    title: "Сортировки",
    description: "Визуализация алгоритмов сортировки: пузырьковая, быстрая, слиянием и др.",
    icon: BarChart3,
    href: "/tools/sorting",
    status: "prototype" as const,
  },
  {
    id: "pathfinding",
    title: "Поиск пути",
    description: "A*, Dijkstra, BFS, DFS — алгоритмы поиска пути на сетке с препятствиями.",
    icon: Route,
    href: "/tools/pathfinding",
    status: "prototype" as const,
  },
  {
    id: "nbody",
    title: "N тел",
    description: "Гравитационная симуляция: орбиты, двойные звёзды, хаос.",
    icon: Sparkles,
    href: "/tools/nbody",
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
