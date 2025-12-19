import { Wrench, Box, Gamepad2, FolderOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Section {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  status: "ready" | "prototype" | "coming-soon";
}

export const sections: Section[] = [
  {
    id: "tools",
    title: "Инструменты",
    description: "Интерактивные калькуляторы и визуализации: эпюры, осцилляторы, демо-приложения.",
    href: "/tools",
    icon: Wrench,
    status: "coming-soon",
  },
  {
    id: "models",
    title: "Модели",
    description: "Инженерные расчётные модели: подшипники, опоры скольжения, уравнение Рейнольдса.",
    href: "/models",
    icon: Box,
    status: "coming-soon",
  },
  {
    id: "digits",
    title: "Digits",
    description: "Головоломка с числами. Игра на логику и внимательность.",
    href: "/digits",
    icon: Gamepad2,
    status: "coming-soon",
  },
  {
    id: "projects",
    title: "Проекты",
    description: "Галерея всех проектов с фильтрацией по тегам и поиском.",
    href: "/projects",
    icon: FolderOpen,
    status: "ready",
  },
];
