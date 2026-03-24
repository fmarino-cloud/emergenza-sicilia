import { cn } from "@/lib/utils";

type SeverityLevel = "BASSA" | "MEDIA" | "ALTA" | "CRITICA";

const config: Record<SeverityLevel, { bg: string; text: string; label: string; dotClass: string }> = {
  BASSA:   { bg: "bg-es-green/10",  text: "text-es-green",  label: "Bassa",   dotClass: "bg-es-green" },
  MEDIA:   { bg: "bg-es-yellow/10", text: "text-es-yellow", label: "Media",   dotClass: "bg-es-yellow" },
  ALTA:    { bg: "bg-es-red/10",    text: "text-es-red",    label: "Alta",    dotClass: "bg-es-red" },
  CRITICA: { bg: "bg-es-red/20",    text: "text-es-red",    label: "Critica", dotClass: "bg-es-red animate-pulse" },
};

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const c = config[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-chip text-xs font-heading font-semibold",
        c.bg,
        c.text
      )}
      role="status"
      aria-label={`Severità ${c.label}`}
    >
      <span className={cn("w-2 h-2 rounded-full shrink-0", c.dotClass)} aria-hidden="true" />
      {c.label}
    </span>
  );
}
