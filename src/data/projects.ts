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
    id: "reynolds",
    title: "Уравнение Рейнольдса",
    description: "Модель для расчёта параметров смазочного слоя в опорах скольжения.",
    tags: ["модель", "Python", "NumPy"],
    status: "coming-soon",
  },
  {
    id: "beam-calculator",
    title: "Расчёт балки",
    description: "Реакции опор, эпюры M и Q, прогиб методом начальных параметров.",
    tags: ["инструмент", "сопромат"],
    status: "coming-soon",
  },
];

export function getAllTags(projects: Project[]): string[] {
  const tagsSet = new Set<string>();
  projects.forEach((project) => {
    project.tags.forEach((tag) => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}
