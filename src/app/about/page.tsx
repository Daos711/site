import { PageHeader } from "@/components/PageHeader";

export default function AboutPage() {
  return (
    <div>
      <PageHeader
        title="О сайте"
      />

      <div className="prose prose-invert max-w-none">
        <div className="rounded-xl border border-border bg-card p-8">
          <h2 className="text-xl font-semibold mb-4">Что это?</h2>
          <p className="text-muted leading-relaxed mb-6">
            Это лаборатория инженерных инструментов и экспериментов — место,
            где собраны интерактивные демонстрации, расчётные модели и
            небольшие проекты.
          </p>

          <h2 className="text-xl font-semibold mb-4">Для чего?</h2>
          <p className="text-muted leading-relaxed mb-6">
            Сайт создан для удобного доступа к инженерным калькуляторам
            и визуализациям. Здесь можно поиграть с параметрами,
            посмотреть графики и проверить расчёты.
          </p>

          <h2 className="text-xl font-semibold mb-4">Что планируется?</h2>
          <ul className="text-muted space-y-2">
            <li>Расчёт балок: реакции, эпюры, прогиб</li>
            <li>Модели подшипников и опор скольжения</li>
            <li>Интерактивные демонстрации</li>
            <li>Игра «Цифры»</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
