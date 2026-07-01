import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { SprayModelFrame } from "./SprayModelFrame";

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

      <div className="relative left-1/2 -translate-x-1/2 w-[min(calc(100vw-2rem),1800px)]">
        <SprayModelFrame />
      </div>
    </div>
  );
}
