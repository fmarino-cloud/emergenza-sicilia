"use client";

import { cn } from "@/lib/utils";

export const CATEGORIES = [
  { value: "ALL",       label: "Tutti" },
  { value: "TERREMOTO", label: "Terremoti" },
  { value: "MALTEMPO",  label: "Maltempo" },
  { value: "TRAFFICO",  label: "Traffico" },
  { value: "ERUZIONE",  label: "Eruzioni" },
  { value: "INCENDIO",  label: "Incendi" },
  { value: "ALLERTA",   label: "Allerte" },
  { value: "TRASPORTI", label: "Trasporti" },
] as const;

interface FilterChipsProps {
  selected: string;
  onSelect: (value: string) => void;
}

export function FilterChips({ selected, onSelect }: FilterChipsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filtra per categoria"
    >
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value)}
          className={cn(
            "px-3 py-1.5 rounded-chip text-xs font-heading font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-es-blue focus:ring-offset-1",
            selected === cat.value
              ? "bg-es-blue text-white shadow-sm"
              : "bg-es-bg text-es-text-secondary border border-es-border hover:border-es-blue hover:text-es-blue"
          )}
          aria-pressed={selected === cat.value}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
