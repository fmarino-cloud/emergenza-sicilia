import Link from "next/link";
import { SeverityBadge } from "./severity-badge";
import { cn } from "@/lib/utils";

export interface EventCardData {
  id: string;
  title: string;
  category: string;
  severity: "BASSA" | "MEDIA" | "ALTA" | "CRITICA";
  description: string;
  source: string;
  publishedAt: string;
  provincia?: string | null;
  status: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  TERREMOTO: "Terremoto",
  MALTEMPO:  "Maltempo",
  TRAFFICO:  "Traffico",
  ERUZIONE:  "Eruzione",
  INCENDIO:  "Incendio",
  ALLERTA:   "Allerta",
  TRASPORTI: "Trasporti",
};

const SEVERITY_BORDER: Record<string, string> = {
  BASSA:   "border-l-es-green",
  MEDIA:   "border-l-es-yellow",
  ALTA:    "border-l-es-red",
  CRITICA: "border-l-es-red",
};

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return "ora";
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}

export function EventCard({ id, title, category, severity, description, source, publishedAt, provincia, status }: EventCardData) {
  return (
    <Link
      href={`/eventi/${id}`}
      className="block focus:outline-none focus:ring-2 focus:ring-es-blue focus:ring-offset-2 rounded-card"
    >
      <article
        className={cn(
          "bg-es-bg rounded-card border-l-4 p-4 hover:shadow-md transition-shadow duration-150 cursor-pointer",
          SEVERITY_BORDER[severity]
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-es-blue/10 text-es-blue text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
              {CATEGORY_LABELS[category] ?? category}
            </span>
            <SeverityBadge severity={severity} />
            {status === "CHIUSO" && (
              <span className="bg-gray-100 text-gray-500 text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
                Chiuso
              </span>
            )}
            {status === "MONITORAGGIO" && (
              <span className="bg-es-yellow/10 text-es-yellow text-xs font-heading font-semibold px-2 py-0.5 rounded-chip">
                Monitoraggio
              </span>
            )}
          </div>
          {provincia && (
            <span className="text-xs text-es-text-secondary font-body shrink-0">{provincia}</span>
          )}
        </div>

        <h3 className="font-heading font-semibold text-base text-es-text mb-1 line-clamp-2 leading-snug">
          {title}
        </h3>

        <p className="text-es-text-secondary text-sm font-body line-clamp-2 mb-3 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-between text-xs text-es-text-secondary font-body">
          <span>Fonte: <span className="font-medium">{source}</span></span>
          <time dateTime={publishedAt}>{formatTimeAgo(publishedAt)}</time>
        </div>
      </article>
    </Link>
  );
}
