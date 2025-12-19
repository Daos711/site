import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Gamepad2 } from "lucide-react";
import Link from "next/link";

export default function DigitsPage() {
  return (
    <div>
      <PageHeader
        title="Digits"
        description="Головоломка с числами"
      />

      <div className="rounded-xl border border-border bg-card p-8">
        <EmptyState
          title="Игра в разработке"
          description="Digits — это головоломка на логику и внимательность. Веб-версия появится позже."
          icon={Gamepad2}
        />

        <div className="flex justify-center mt-6">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg bg-card-hover text-sm font-medium hover:bg-border transition-colors"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
}
