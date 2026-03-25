"use client";

export function ShareButton({ title }: { title: string }) {
  return (
    <button
      className="w-full bg-es-bg border border-es-border text-es-text-secondary text-sm font-body py-2.5 rounded-lg hover:bg-es-border transition-colors"
      onClick={() => {
        if (navigator.share) {
          navigator.share({ title, url: window.location.href }).catch(() => {});
        } else {
          navigator.clipboard.writeText(window.location.href).catch(() => {});
        }
      }}
      aria-label="Condividi questo evento"
    >
      📤 Condividi
    </button>
  );
}
