"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncWordPressButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created?: number; updated?: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSync() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/ingest/wordpress", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Errore durante la sincronizzazione.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResult(data);
      router.refresh();
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className="text-sm font-body text-green-600">
          +{result.created ?? 0} creati, {result.updated ?? 0} aggiornati
        </span>
      )}
      {error && (
        <span className="text-sm font-body text-red-500">{error}</span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-sm px-4 py-2 rounded-card transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {loading && (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {loading ? "Sincronizzazione..." : "↻ Sincronizza da WordPress"}
      </button>
    </div>
  );
}
