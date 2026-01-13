import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Grid3X3, Circle, Cog, Grid2X2, Box, Calculator } from "lucide-react";

const games = [
  {
    id: "digits",
    title: "Цифры",
    description: "Головоломка с числами. Убирай пары: одинаковые или сумма 10.",
    href: "/games/digits",
    icon: Grid3X3,
    status: "prototype" as const,
  },
  {
    id: "ball-merge",
    title: "Шарики",
    description: "Бросай шарики и соединяй одинаковые. Физика + головоломка.",
    href: "/games/ball-merge",
    icon: Circle,
    status: "prototype" as const,
  },
  {
    id: "tribology-lab",
    title: "Трибо-Лаб",
    description: "Tower Defense + Merge. Защити подшипник от частиц износа.",
    href: "/games/tribology-lab",
    icon: Cog,
    status: "prototype" as const,
  },
  {
    id: "2048",
    title: "2048",
    description: "Классическая головоломка. Соединяй плитки, собери 2048!",
    href: "/games/2048",
    icon: Grid2X2,
    status: "prototype" as const,
  },
  {
    id: "sokoban",
    title: "Сокобан",
    description: "Классическая головоломка. 155 уровней Microban.",
    href: "/games/sokoban",
    icon: Box,
    status: "prototype" as const,
  },
  {
    id: "quick-math",
    title: "Quick Math",
    description: "Математический тренажёр. 20 примеров на скорость!",
    href: "/games/quick-math",
    icon: Calculator,
    status: "prototype" as const,
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
            href={game.href}
            icon={game.icon}
            status={game.status}
          />
        ))}
      </div>
    </div>
  );
}
