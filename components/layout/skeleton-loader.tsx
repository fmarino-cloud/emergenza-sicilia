import { cn } from "@/lib/utils";

function Shimmer({ className }: { className?: string }) {
  return <div className={cn("skeleton-shimmer rounded", className)} aria-hidden="true" />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("bg-es-bg rounded-card border-l-4 border-l-gray-200 p-4", className)}
      role="status"
      aria-label="Caricamento..."
    >
      <div className="flex gap-2 mb-3">
        <Shimmer className="h-5 w-20 rounded-chip" />
        <Shimmer className="h-5 w-16 rounded-chip" />
      </div>
      <Shimmer className="h-5 w-3/4 mb-2" />
      <Shimmer className="h-4 w-full mb-1" />
      <Shimmer className="h-4 w-2/3 mb-4" />
      <div className="flex justify-between">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label="Caricamento eventi...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="bg-es-bg rounded-card p-6" role="status" aria-label="Caricamento...">
      <Shimmer className="h-8 w-64 mb-4" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Shimmer key={i} className="h-20 rounded-card" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonEditorial() {
  return (
    <div className="space-y-4" role="status">
      <Shimmer className="h-48 w-full rounded-card" />
      <Shimmer className="h-6 w-3/4" />
      <Shimmer className="h-4 w-full" />
      <Shimmer className="h-4 w-2/3" />
    </div>
  );
}
