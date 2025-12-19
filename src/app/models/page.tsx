import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Cylinder, Droplets, Cog } from "lucide-react";

const models = [
  {
    id: "reynolds",
    title: "Уравнение Рейнольдса",
    description: "Расчёт параметров смазочного слоя в опорах скольжения.",
    icon: Droplets,
    status: "coming-soon" as const,
  },
  {
    id: "bearing",
    title: "Подшипники скольжения",
    description: "Модель для расчёта характеристик подшипников.",
    icon: Cylinder,
    status: "coming-soon" as const,
  },
  {
    id: "drill-bit",
    title: "Опора долота",
    description: "Расчёт опоры скольжения бурового долота.",
    icon: Cog,
    status: "coming-soon" as const,
  },
];

export default function ModelsPage() {
  return (
    <div>
      <PageHeader
        title="Модели"
        description="Инженерные расчётные модели"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <Card
            key={model.id}
            title={model.title}
            description={model.description}
            icon={model.icon}
            status={model.status}
          />
        ))}
      </div>
    </div>
  );
}
