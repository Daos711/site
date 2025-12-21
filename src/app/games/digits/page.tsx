import { PageHeader } from "@/components/PageHeader";
import { Download, Trophy, Calendar } from "lucide-react";
import { RANKS, LEGENDARY_GRADIENTS } from "@/lib/game-ranks";

// Версии игры для скачивания (новые сверху)
const versions = [
  {
    version: "1.0",
    date: "2025-12-21",
    downloadUrl: "/downloads/digits-1.0.zip",
    changelog: "Первый релиз игры",
  },
];

export default function DigitsGamePage() {
  return (
    <div>
      <PageHeader
        title="Цифры"
        description="Головоломка с числами. Убирай пары: одинаковые или в сумме дающие 10."
      />

      {/* Описание игры */}
      <section className="mb-12">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Об игре</h2>
          <div className="text-muted space-y-2">
            <p>
              <strong className="text-foreground">Цифры</strong> — это логическая головоломка,
              где нужно убирать пары плиток с числами. Плитки можно убрать, если:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Числа на них одинаковые (например, 5 и 5)</li>
              <li>Числа в сумме дают 10 (например, 3 и 7)</li>
              <li>Между ними нет других плиток по горизонтали или вертикали</li>
            </ul>
            <p className="mt-4">
              Цель — убрать все плитки с поля до истечения времени. Чем быстрее
              справитесь и чем больше плиток уберёте за ход, тем выше счёт!
            </p>
          </div>
        </div>
      </section>

      {/* Скачать */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-6 h-6" />
          Скачать
        </h2>

        <div className="space-y-4">
          {versions.map((v) => (
            <div
              key={v.version}
              className="bg-card border border-border rounded-lg p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    Версия {v.version}
                  </h3>
                  <p className="text-muted text-sm flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {v.date}
                  </p>
                </div>
                <a
                  href={v.downloadUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Скачать
                </a>
              </div>

              <p className="text-sm text-muted">{v.changelog}</p>
            </div>
          ))}
        </div>

      </section>

      {/* Система рангов */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Система рангов</h2>
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {RANKS.map(([score, name, textColor, bgColor]) => {
              const gradient = LEGENDARY_GRADIENTS[score];
              const bgStyle = gradient
                ? { background: `linear-gradient(135deg, ${gradient.join(", ")})` }
                : { backgroundColor: bgColor };
              return (
                <div
                  key={score}
                  className="flex items-center gap-2 p-2 rounded"
                  style={bgStyle}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: textColor }}
                  >
                    {name}
                  </span>
                  <span className="text-xs opacity-70" style={{ color: textColor }}>
                    {score}+
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Таблица лидеров - заглушка */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="w-6 h-6" />
          Таблица лидеров
        </h2>

        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-muted">
            Таблица лидеров скоро появится. Пока что результаты сохраняются локально в игре.
          </p>
        </div>
      </section>
    </div>
  );
}
