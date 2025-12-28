import { Wrench, Box, Gamepad2, FolderOpen, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Section {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const sections: Section[] = [
  {
    id: "tools",
    title: "Инструменты",
    description: "Интерактивные калькуляторы и визуализации: расчёт балок, демонстрации.",
    href: "/tools",
    icon: Wrench,
  },
  {
    id: "models",
    title: "Модели",
    description: "Инженерные расчётные модели: подшипники, опоры скольжения, уравнение Рейнольдса.",
    href: "/models",
    icon: Box,
  },
  {
    id: "games",
    title: "Игры",
    description: "Головоломки и мини-игры.",
    href: "/games",
    icon: Gamepad2,
  },
  {
    id: "apps",
    title: "Приложения",
    description: "Мобильные и десктопные приложения.",
    href: "/apps",
    icon: Smartphone,
  },
  {
    id: "projects",
    title: "Проекты",
    description: "Галерея всех проектов с фильтрацией по тегам и поиском.",
    href: "/projects",
    icon: FolderOpen,
  },
];
