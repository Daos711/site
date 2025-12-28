export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "ready" | "prototype" | "coming-soon";
  href?: string;
}

export const projects: Project[] = [
  {
    id: "digits",
    title: "Цифры",
    description: "Головоломка с числами. Игра на логику и внимательность.",
    tags: ["игра", "Python", "Pygame", "desktop"],
    status: "prototype",
    href: "/games/digits",
  },
  {
    id: "particle-factory",
    title: "Фабрика частиц",
    description: "Строй конвейеры и трансформируй частицы. Головоломка с физикой.",
    tags: ["игра", "TypeScript", "React", "web", "Canvas"],
    status: "prototype",
    href: "/games/particle-factory",
  },
  {
    id: "beam-calculator",
    title: "Расчёт балки",
    description: "Реакции опор, эпюры M и Q, прогиб методом начальных параметров.",
    tags: ["инструмент", "сопромат", "TypeScript", "web"],
    status: "prototype",
    href: "/tools/beam-calculator",
  },
];

export function getAllTags(projects: Project[]): string[] {
  const tagsSet = new Set<string>();
  projects.forEach((project) => {
    project.tags.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}
