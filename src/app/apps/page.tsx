import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { BookOpen, KeyRound } from "lucide-react";

const apps = [
  {
    id: "gothic-locks",
    title: "Gothic Remake — Замки",
    description: "Справочник сундуков и дверей. Пошаговый решатель, поиск и офлайн-доступ.",
    href: "/apps/gothic-locks",
    icon: KeyRound,
    status: "prototype" as const,
  },
  {
    id: "philoquiz",
    title: "PhiloQuiz",
    description: "Подготовка к кандидатскому экзамену по философии науки. 120 вопросов.",
    href: "/apps/philoquiz",
    icon: BookOpen,
    status: "prototype" as const,
  },
];

export default function AppsPage() {
  return (
    <div>
      <PageHeader
        title="Приложения"
        description="Мобильные и десктопные приложения"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {apps.map((app) => (
          <Card
            key={app.id}
            title={app.title}
            description={app.description}
            href={app.href}
            icon={app.icon}
            status={app.status}
          />
        ))}
      </div>
    </div>
  );
}
