export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "ready" | "prototype" | "coming-soon";
}

export const projects: Project[] = [
  {
    id: "digits",
    title: "Digits",
    description: "Головоломка с числами. Игра на логику и внимательность.",
    tags: ["игра", "Python", "Pygame"],
    status: "prototype",
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
    title: "Калькулятор балок",
    description: "Построение эпюр моментов и поперечных сил для различных схем нагружения.",
    tags: ["инструмент", "сопромат", "эпюры"],
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
