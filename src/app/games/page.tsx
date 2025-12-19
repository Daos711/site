import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Grid3X3 } from "lucide-react";

const games = [
  {
    id: "digits",
    title: "Цифры",
    description: "Головоломка с числами. Игра на логику и внимательность.",
    icon: Grid3X3,
    status: "coming-soon" as const,
  },
];

export default function GamesPage() {
  return (
    <div>
      <PageHeader
        title="Игры"
        description="Головоломки и мини-игры"
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.id}
            title={game.title}
            description={game.description}
            icon={game.icon}
            status={game.status}
          />
        ))}
      </div>
    </div>
  );
}
