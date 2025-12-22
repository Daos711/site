import { type LucideIcon } from "lucide-react";
import { Badge } from "./Badge";

const basePath = "/site";

interface CardProps {
  title: string;
  description: string;
  href?: string;
  icon?: LucideIcon;
  status?: "ready" | "prototype" | "coming-soon";
  tags?: string[];
}

const statusLabels = {
  ready: "Готово",
  prototype: "Прототип",
  "coming-soon": "Скоро",
};

const statusColors = {
  ready: "bg-green-500/20 text-green-400",
  prototype: "bg-yellow-500/20 text-yellow-400",
  "coming-soon": "bg-muted/20 text-muted",
};

export function Card({ title, description, href, icon: Icon, status, tags }: CardProps) {
  const content = (
    <div className="group h-full p-6 rounded-xl border border-border bg-card hover:bg-card-hover hover:border-muted transition-all">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <Icon size={20} />
            </div>
          )}
          <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
            {title}
          </h3>
        </div>
        {status && (
          <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        )}
      </div>
      <p className="text-muted text-sm leading-relaxed mb-4">{description}</p>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}
    </div>
  );

  if (href) {
    const fullHref = href.startsWith("/") && !href.startsWith("/site") ? basePath + href : href;
    return <a href={fullHref}>{content}</a>;
  }

  return content;
}
