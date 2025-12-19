import { type LucideIcon, Construction } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function EmptyState({
  title = "Скоро здесь что-то появится",
  description = "Этот раздел находится в разработке",
  icon: Icon = Construction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-card mb-4">
        <Icon size={32} className="text-muted" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted text-sm max-w-md">{description}</p>
    </div>
  );
}
