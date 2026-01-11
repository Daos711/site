export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  status: "ready" | "prototype" | "coming-soon";
  href?: string;
}

export const projects: Project[] = [
  // === Игры ===
  {
    id: "tribology-lab",
    title: "Трибо-Лаб",
    description: "Tower Defense + Merge. Защити подшипник от частиц износа.",
    tags: ["игра", "TypeScript", "React", "web", "tower-defense"],
    status: "prototype",
    href: "/games/tribology-lab",
  },
  {
    id: "digits",
    title: "Цифры",
    description: "Головоломка с числами. Игра на логику и внимательность.",
    tags: ["игра", "Python", "Pygame", "desktop"],
    status: "prototype",
    href: "/games/digits",
  },
  {
    id: "ball-merge",
    title: "Шарики",
    description: "Бросай шарики и соединяй одинаковые. Физика Matter.js.",
    tags: ["игра", "TypeScript", "React", "web", "Matter.js"],
    status: "prototype",
    href: "/games/ball-merge",
  },

  // === Инструменты ===
  {
    id: "oscillator",
    title: "Осциллятор",
    description: "Интерактивная симуляция затухающих колебаний с фазовым портретом.",
    tags: ["инструмент", "физика", "TypeScript", "React", "web", "визуализация"],
    status: "prototype",
    href: "/tools/oscillator",
  },
  {
    id: "beam-calculator",
    title: "Расчёт балки",
    description: "Реакции опор, эпюры M и Q, прогиб методом начальных параметров.",
    tags: ["инструмент", "сопромат", "TypeScript", "web"],
    status: "prototype",
    href: "/tools/beam-calculator",
  },

  // === Приложения ===
  {
    id: "philoquiz",
    title: "PhiloQuiz",
    description: "Викторина по философии. Проверь свои знания о великих мыслителях.",
    tags: ["приложение", "TypeScript", "React", "web", "образование"],
    status: "prototype",
    href: "/apps/philoquiz",
  },

  // === Визуализации ===
  {
    id: "lorenz-attractor",
    title: "Аттрактор Лоренца",
    description: "3D-визуализация хаотической системы. Знаменитая «бабочка».",
    tags: ["инструмент", "математика", "хаос", "визуализация"],
    status: "prototype",
    href: "/tools/lorenz",
  },

  // === Будущие визуализации ===
  {
    id: "mandelbrot",
    title: "Множество Мандельброта",
    description: "Интерактивный фрактал с бесконечным зумом.",
    tags: ["инструмент", "математика", "фракталы", "визуализация"],
    status: "coming-soon",
  },
  {
    id: "double-pendulum",
    title: "Двойной маятник",
    description: "Хаос из простой механической системы.",
    tags: ["инструмент", "физика", "хаос", "визуализация"],
    status: "coming-soon",
  },
  {
    id: "fourier-series",
    title: "Ряды Фурье",
    description: "Как из синусов собираются любые формы волн.",
    tags: ["инструмент", "математика", "визуализация"],
    status: "coming-soon",
  },
  {
    id: "game-of-life",
    title: "Game of Life",
    description: "Клеточный автомат Конвея. Эмерджентность из простых правил.",
    tags: ["инструмент", "математика", "клеточные автоматы", "визуализация"],
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
