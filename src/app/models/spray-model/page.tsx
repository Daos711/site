import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Модель факела распыла форсунки",
  description:
    "Интерактивный расчёт гидравлики, траекторий капель, сферизации и фильтра",
};

export default function SprayModelPage() {
  return (
    <div>
      <PageHeader
        title="Модель факела распыла форсунки"
        description="Гидравлика · факел и капли · сферизация · фильтр"
      />

      <div className="rounded-xl overflow-hidden border border-border bg-card">
        <iframe
          src="/models/spray-model.html"
          title="Модель факела распыла форсунки"
          className="w-full block h-[calc(100vh-180px)] min-h-[900px]"
        />
      </div>
    </div>
  );
}
