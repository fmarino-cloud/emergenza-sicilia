"use client";

import { useState } from "react";

const SEVERITIES = ["BASSA", "MEDIA", "ALTA", "CRITICA"];

export default function AdminPushPage() {
  const [form, setForm] = useState({
    title: "",
    body: "",
    url: "/",
    severity: "ALTA",
    eventId: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number } | null>(null);
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.eventId.trim()) {
      setError("Inserisci un Event ID valido.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: form.eventId.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.message ?? JSON.stringify(data?.error) ?? "Errore nell'invio.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="font-heading font-bold text-gray-900 text-2xl">Invia Notifica Push</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-card px-4 py-3 text-sm font-body text-blue-700">
        Le notifiche vengono inviate a tutti gli abbonati che corrispondono alla categoria, provincia e
        severità dell&apos;evento selezionato.
      </div>

      <div className="bg-white rounded-card border border-gray-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event ID */}
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              Event ID <span className="text-red-500">*</span>
            </label>
            <input
              value={form.eventId}
              onChange={(e) => update("eventId", e.target.value)}
              required
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body font-mono text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="cm..."
            />
            <p className="text-xs text-gray-400 font-body mt-1">
              L&apos;ID dell&apos;evento a cui si riferisce la notifica.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              Titolo notifica
            </label>
            <input
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              maxLength={100}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Emergenza Sicilia"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              Messaggio
            </label>
            <textarea
              value={form.body}
              onChange={(e) => update("body", e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Testo della notifica push..."
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              URL destinazione
            </label>
            <input
              value={form.url}
              onChange={(e) => update("url", e.target.value)}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="/it/eventi/..."
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-heading font-semibold text-gray-700 mb-1">
              Severità
            </label>
            <select
              value={form.severity}
              onChange={(e) => update("severity", e.target.value)}
              className="w-full border border-gray-300 rounded-card px-3 py-2 text-sm font-body text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-card px-3 py-2.5">
              <p className="text-sm text-red-600 font-body">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-card px-3 py-2.5">
              <p className="text-sm text-green-600 font-body">
                ✓ Notifica inviata a <strong>{result.sent ?? 0}</strong> abbonati
                {(result.failed ?? 0) > 0 && ` (${result.failed} falliti)`}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-sm py-3 rounded-card transition-colors disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Invio in corso...
              </span>
            ) : (
              "🔔 Invia notifica push"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
