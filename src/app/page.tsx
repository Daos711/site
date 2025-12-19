import { Card } from "@/components/Card";
import { sections } from "@/data/sections";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          Lab / Playground
        </h1>
        <p className="text-muted text-lg max-w-2xl mx-auto">
          Лаборатория инженерных инструментов, моделей и экспериментов.
          Место для интерактивных демок и расчётов.
        </p>
      </div>

      {/* Sections Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {sections.map((section) => (
          <Card
            key={section.id}
            title={section.title}
            description={section.description}
            href={section.href}
            icon={section.icon}
          />
        ))}
      </div>
    </div>
  );
}
